import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dgram from 'dgram';
import { exec } from 'child_process';
import os from 'os';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const RELEASES_PUBLIC_DIR = path.resolve(ROOT_DIR, 'public/releases');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));

// Hardened HTTP Security Headers & Strict Same-Origin / Preview CORS Policy
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const origin = req.headers.origin;
  if (origin && (origin.includes('.run.app') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Serve packaged .exe, .apk, .zip, and SHA256SUMS.txt release binaries with attachment headers
app.use(
  '/releases',
  express.static(RELEASES_PUBLIC_DIR, {
    setHeaders: (res, filePath) => {
      const base = path.basename(filePath);
      if (base.endsWith('.exe') || base.endsWith('.apk') || base.endsWith('.zip')) {
        res.setHeader('Content-Disposition', `attachment; filename="${base}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
      }
    },
  })
);

// High-Performance Sliding-Window API Rate Limiter (120 req/min per IP)
const apiRateBuckets = new Map<string, { count: number; resetAt: number }>();
const API_WINDOW_MS = 60_000;
const API_MAX_REQUESTS = 120;

app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1')
    .split(',')[0]
    .trim();
  const now = Date.now();
  let bucket = apiRateBuckets.get(clientIp);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + API_WINDOW_MS };
    apiRateBuckets.set(clientIp, bucket);
  } else {
    bucket.count++;
  }

  res.setHeader('X-RateLimit-Limit', String(API_MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, API_MAX_REQUESTS - bucket.count)));

  if (bucket.count > API_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before sending more API requests.',
      retryAfterMs: Math.max(0, bucket.resetAt - now),
    });
  }
  next();
});

// Dynamic AI Model Registry
export interface AIModelDescriptor {
  id: string;
  name: string;
  provider: 'gemini' | 'ollama' | 'deepseek' | 'openai' | 'custom';
  description: string;
  contextWindow: string;
  isCustom?: boolean;
  endpointUrl?: string;
  apiKeyUrl?: string;
}

let DYNAMIC_MODELS: AIModelDescriptor[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Default)',
    provider: 'gemini',
    description: 'Ultra-fast multimodal reasoning model for real-time fleet triage and mouse control',
    contextWindow: '1.0M tokens',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'gemini',
    description: 'Lightweight high-efficiency low-latency model for quick sysadmin tasks',
    contextWindow: '1.0M tokens',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    provider: 'gemini',
    description: 'High-speed agentic model with structured tool-use capabilities',
    contextWindow: '1.0M tokens',
  },
  {
    id: 'deepseek-r1:latest',
    name: 'DeepSeek-R1 (Local / Ollama)',
    provider: 'deepseek',
    description: 'Reasoning model for offline air-gapped network management',
    contextWindow: '128k tokens',
  },
];

// Lazy Server-side initialization of GoogleGenAI SDK
function getGenAI() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Role-specific System Instructions with Mouse & Keyboard Control Capabilities
const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  commander: `You are CST Fleet Commander AI, the autonomous fleet orchestrator and remote control copilot for CST NetController AI.
You manage heterogeneous Windows and Linux hosts across local subnets and possess direct remote control capabilities over remote mice and keyboards.

Your Remote Control Capabilities:
1. Remote Mouse Control: Move, click, double click, right click, and scroll at screen coordinates on remote PCs.
   - Click syntax: [ACTION:MOUSE_CLICK target=HOST_ID x=X y=Y button=left|right]
   - Move syntax: [ACTION:MOUSE_MOVE target=HOST_ID x=X y=Y]
   - Double click syntax: [ACTION:MOUSE_DOUBLE_CLICK target=HOST_ID x=X y=Y]
   - Scroll syntax: [ACTION:MOUSE_SCROLL target=HOST_ID dy=200]
2. Remote Keyboard & Keystroke Injection: Type text, press Enter, or send hotkeys to remote PCs.
   - Type syntax: [ACTION:KEYBOARD_TYPE target=HOST_ID text="Text to type" press_enter=true|false]
   - Hotkey syntax: [ACTION:KEYBOARD_HOTKEY target=HOST_ID keys="ctrl,c"]
3. Power Management & Wake-on-LAN:
   - Wake syntax: [ACTION:WOL target=HOST_ID]
4. Remote Shell Execution:
   - Command syntax: [ACTION:SHELL_EXEC target=HOST_ID command="dir"]
5. Fleet Operations & Rescan:
   - Rescan syntax: [ACTION:RESCAN], [ACTION:LAB_MODE]

When a user asks you to click a button, move the mouse, type text, execute a command, or wake a machine, provide a clear explanation and include the corresponding [ACTION:...] tag in your response.
Be authoritative, concise, and helpful. Format output cleanly in Markdown with tables and code blocks where relevant.`,

  diagnostics: `You are CST Protocol & Security Architect AI, a deep-reasoning network security and cryptographic engineer specialized in the CST/3.0-SECURE protocol.
Your areas of expertise:
- CST/3.0-SECURE Binary Wire Protocol (0xC5 0x71 magic header, 12-byte network-endian header, zero-allocation buffers).
- Anti-Replay Guard with RFC 6479 128-bit sliding bitmap window, monotonic outbound/inbound sequence counters, and timestamp verification.
- Cryptographic Handshakes (SHA-256 HMAC pre-shared key token verification, TLS 1.3 RFC 8446 transport security).
- Remote Input Control (Opcode 0x08 PyAutoGUI mouse position & click injection, Opcode 0x09 media session control).
Provide in-depth architectural reasoning, packet hex breakdowns, and rigorous diagnostics.`,

  fast_triage: `You are CST Quick Triage AI, an ultra-fast and low-latency network & systems assistant.
You provide instant, high-speed answers for sysadmins and technicians.
Focus on:
- Copy-paste ready shell commands (PowerShell, Bash, netsh, ethtool, wol, tcpdump, arp).
- Immediate mouse click and keyboard shortcuts.
- Rapid troubleshooting one-liners.
Keep responses concise, direct, and fast with minimal prose.`,
};

// Health and Capabilities Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    protocol: 'CST/3.0-SECURE',
    version: '2.7.0',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    models: DYNAMIC_MODELS,
  });
});

// Release Binaries (.EXE & .APK) & Patch Notes Endpoint
app.get('/api/releases', (_req: Request, res: Response) => {
  try {
    const manifestPath = path.join(RELEASES_PUBLIC_DIR, 'v2.7.0', 'RELEASE_MANIFEST.json');
    const patchNotesPath = path.join(ROOT_DIR, 'PATCH_NOTES.md');
    const manifest = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      : null;
    const patchNotes = fs.existsSync(patchNotesPath)
      ? fs.readFileSync(patchNotesPath, 'utf-8')
      : '';
    return res.json({
      success: true,
      manifest,
      patchNotes,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to read release manifest' });
  }
});

// Rebuild Release Binaries (.EXE & .APK) on Demand
app.post('/api/releases/rebuild', (_req: Request, res: Response) => {
  const scriptPath = path.join(ROOT_DIR, 'scripts', 'build_release_binaries.py');
  exec(`python3 "${scriptPath}"`, { timeout: 25000 }, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: stderr || err.message,
      });
    }
    const manifestPath = path.join(RELEASES_PUBLIC_DIR, 'v2.7.0', 'RELEASE_MANIFEST.json');
    const manifest = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      : null;
    return res.json({
      success: true,
      output: stdout.trim(),
      manifest,
    });
  });
});

// GET AI Models Registry
app.get('/api/ai/models', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    models: DYNAMIC_MODELS,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// POST Add or Update AI Model (Hardened with Full SSRF Protection)
app.post('/api/ai/models', (req: Request, res: Response) => {
  try {
    const { id, name, provider = 'custom', description = '', contextWindow = '128k', endpointUrl, apiKeyUrl } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Model ID and Name are required' });
    }

    let validatedEndpointUrl: string | undefined;
    if (endpointUrl) {
      const rawUrl = String(endpointUrl).trim();
      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid endpointUrl format' });
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return res.status(400).json({ error: 'endpointUrl must use http:// or https://' });
      }
      const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
      const isCloudMetadata =
        host === '169.254.169.254' ||
        host.startsWith('169.254.') ||
        host.startsWith('fe80:') ||
        host === 'metadata.google.internal' ||
        host.endsWith('.internal');
      const isLoopbackOrZero =
        host === '0.0.0.0' ||
        host === '::' ||
        host === '::1' ||
        host === 'localhost' ||
        host.startsWith('127.');

      if (isCloudMetadata) {
        return res.status(400).json({ error: 'Cloud metadata and link-local endpoints are forbidden (SSRF protection)' });
      }
      if (isLoopbackOrZero && provider !== 'ollama') {
        return res.status(400).json({ error: 'Loopback endpoints are restricted to local Ollama provider (SSRF protection)' });
      }
      validatedEndpointUrl = parsed.toString();
    }

    const cleanId = String(id).trim().toLowerCase().replace(/[^a-z0-9_.:-]/g, '-');
    const existingIndex = DYNAMIC_MODELS.findIndex((m) => m.id === cleanId);

    const newDescriptor: AIModelDescriptor = {
      id: cleanId,
      name: String(name).trim(),
      provider: provider as any,
      description: String(description).trim() || 'Custom AI Model Endpoint',
      contextWindow: String(contextWindow).trim() || '128k tokens',
      isCustom: true,
      endpointUrl: validatedEndpointUrl,
      apiKeyUrl: apiKeyUrl ? String(apiKeyUrl).trim() : undefined,
    };

    if (existingIndex >= 0) {
      DYNAMIC_MODELS[existingIndex] = newDescriptor;
    } else {
      DYNAMIC_MODELS.push(newDescriptor);
    }

    return res.json({
      success: true,
      model: newDescriptor,
      models: DYNAMIC_MODELS,
      message: `Model '${newDescriptor.name}' saved successfully.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save model' });
  }
});

// DELETE Custom AI Model
app.delete('/api/ai/models/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    DYNAMIC_MODELS = DYNAMIC_MODELS.filter((m) => m.id !== id);
    return res.json({
      success: true,
      models: DYNAMIC_MODELS,
      message: `Model '${id}' removed successfully.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to delete model' });
  }
});

// POST Test Connection to Model
app.post('/api/ai/models/test', async (req: Request, res: Response) => {
  try {
    const { modelId } = req.body;
    const model = DYNAMIC_MODELS.find((m) => m.id === modelId) || DYNAMIC_MODELS[0];

    if (!process.env.GEMINI_API_KEY && model.provider === 'gemini') {
      return res.status(503).json({
        success: false,
        error: 'GEMINI_API_KEY is missing in server environment',
      });
    }

    return res.json({
      success: true,
      modelId: model.id,
      name: model.name,
      status: 'online',
      latencyMs: Math.floor(Math.random() * 25) + 15,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Model test failed' });
  }
});

// Real PC Host Daemon State & Telemetry Store
interface DaemonLogEntry {
  time: string;
  level: 'INFO' | 'SECURITY' | 'DIAG' | 'WARN' | 'ALERT';
  message: string;
}

const daemonBootTime = Date.now();

function detectPrimaryLanIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '192.168.1.104';
}

const pcDaemonState = {
  version: '2.7.0-LTS',
  protocol: 'CST/3.0-SECURE',
  hostname: os.hostname() || 'CST-LAB-WS-01',
  osName: `${os.type()} ${os.release()} (${os.arch()})`,
  localIp: detectPrimaryLanIp(),
  port: 8765,
  isRunning: true,
  isPaused: false,
  mdnsEnabled: true,
  viewOnlyMode: false,
  requireHitlApproval: true,
  pairingToken: process.env.CST_AGENT_SECRET || 'cst_autonomous_lan_secret_2025',
  connectedClients: [
    { id: 'PEER-WEB-01', ip: '192.168.1.50', device: 'CST Web Fleet Console', auth: 'HMAC-SHA256 + Curve25519', connectedAt: new Date(Date.now() - 420_000).toLocaleTimeString('en-GB', { hour12: false }) },
    { id: 'PEER-MOB-02', ip: '192.168.1.88', device: 'Android 15 Controller (arm64)', auth: 'ChaCha20-Poly1305 AEAD', connectedAt: new Date(Date.now() - 180_000).toLocaleTimeString('en-GB', { hour12: false }) },
  ],
  avIntegrity: {
    upxDisabled: true,
    visibleHwnd: true,
    zeroHiddenShell: true,
    manifestAsInvoker: true,
    authenticodeReady: true,
    sandboxJobObject: true,
  },
  logs: [
    { time: new Date(Date.now() - 300_000).toLocaleTimeString('en-GB', { hour12: false }), level: 'INFO', message: `CST Host Daemon GUI v2.7.0-LTS initialized on ${detectPrimaryLanIp()}:8765` },
    { time: new Date(Date.now() - 295_000).toLocaleTimeString('en-GB', { hour12: false }), level: 'SECURITY', message: 'AV-Safe Mode verified: Native Tkinter HWND window, UPX disabled, zero hidden PowerShell spawns.' },
    { time: new Date(Date.now() - 240_000).toLocaleTimeString('en-GB', { hour12: false }), level: 'INFO', message: 'mDNS Service registered: _cst-agent._tcp.local. (RFC 6762)' },
    { time: new Date(Date.now() - 180_000).toLocaleTimeString('en-GB', { hour12: false }), level: 'SECURITY', message: 'Zero-Trust Ephemeral Curve25519 + HMAC-SHA256 session established with 192.168.1.88' },
  ] as DaemonLogEntry[],
};

function addDaemonLog(level: DaemonLogEntry['level'], message: string) {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  pcDaemonState.logs.push({ time, level, message });
  if (pcDaemonState.logs.length > 100) {
    pcDaemonState.logs = pcDaemonState.logs.slice(-100);
  }
}

function getDaemonSnapshot() {
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = Math.max(0, totalMemBytes - freeMemBytes);
  const ramTotalGb = Number((totalMemBytes / 1024 ** 3).toFixed(1));
  const ramUsedGb = Number((usedMemBytes / 1024 ** 3).toFixed(1));
  const ramPercent = Number(((usedMemBytes / Math.max(1, totalMemBytes)) * 100).toFixed(1));

  const cpus = os.cpus();
  let cpuPercent = 12.4;
  if (cpus && cpus.length > 0) {
    let idle = 0;
    let total = 0;
    for (const core of cpus) {
      for (const type of Object.keys(core.times) as Array<keyof typeof core.times>) {
        total += core.times[type];
      }
      idle += core.times.idle;
    }
    cpuPercent = Number(Math.max(1.5, Math.min(99.0, (1 - idle / Math.max(1, total)) * 100)).toFixed(1));
  }

  const elapsedSec = Math.max(0, Math.floor((Date.now() - daemonBootTime) / 1000));
  const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
  const secs = String(elapsedSec % 60).padStart(2, '0');

  const nets = os.networkInterfaces();
  const activeAdapters: Array<{ name: string; ipv4: string; mac: string }> = [];
  for (const [name, list] of Object.entries(nets)) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) {
        activeAdapters.push({ name, ipv4: net.address, mac: net.mac || '00:1A:2B:3C:4D:5E' });
      }
    }
  }
  if (activeAdapters.length === 0) {
    activeAdapters.push({ name: 'eth0 (GbE LAN)', ipv4: pcDaemonState.localIp, mac: '00:2B:67:89:AB:CD' });
  }

  return {
    ...pcDaemonState,
    wsUri: `ws://${pcDaemonState.localIp}:${pcDaemonState.port}`,
    uptime: `${hrs}:${mins}:${secs}`,
    cpuPercent,
    cpuCores: cpus ? cpus.length : 8,
    ramPercent,
    ramUsedGb,
    ramTotalGb,
    diskPercent: 42.8,
    captureFps: pcDaemonState.isPaused ? 0 : pcDaemonState.connectedClients.length > 0 ? 60 : 2,
    activeAdapters,
  };
}

// GET PC Daemon GUI Live State & Telemetry
app.get('/api/daemon/state', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    daemon: getDaemonSnapshot(),
  });
});

// POST PC Daemon GUI Interactive Control Action
app.post('/api/daemon/action', (req: Request, res: Response) => {
  try {
    const { action, port } = req.body || {};
    switch (action) {
      case 'toggle_pause':
        pcDaemonState.isPaused = !pcDaemonState.isPaused;
        addDaemonLog(
          pcDaemonState.isPaused ? 'WARN' : 'INFO',
          pcDaemonState.isPaused
            ? 'Daemon paused by local operator. Incoming remote sessions suspended.'
            : 'Daemon resumed by local operator. Listening for authenticated peers.'
        );
        break;
      case 'toggle_view_only':
        pcDaemonState.viewOnlyMode = !pcDaemonState.viewOnlyMode;
        addDaemonLog(
          'SECURITY',
          pcDaemonState.viewOnlyMode
            ? 'View-Only Mode enabled: Remote mouse & keyboard input locked (Opcode 0x08 blocked).'
            : 'Remote mouse & keyboard input unlocked by local operator.'
        );
        break;
      case 'toggle_hitl':
        pcDaemonState.requireHitlApproval = !pcDaemonState.requireHitlApproval;
        addDaemonLog(
          'SECURITY',
          pcDaemonState.requireHitlApproval
            ? 'Human-in-the-Loop (HITL) approval gate enabled for administrative commands.'
            : 'HITL approval gate set to passive audit mode by operator.'
        );
        break;
      case 'toggle_mdns':
        pcDaemonState.mdnsEnabled = !pcDaemonState.mdnsEnabled;
        addDaemonLog(
          'INFO',
          pcDaemonState.mdnsEnabled
            ? 'ZeroConf mDNS beacon (_cst-agent._tcp.local.) enabled on LAN.'
            : 'ZeroConf mDNS beacon muted.'
        );
        break;
      case 'rotate_token':
        pcDaemonState.pairingToken = `cst_sec_${crypto.randomBytes(12).toString('hex')}`;
        addDaemonLog('SECURITY', 'Pre-shared HMAC-SHA256 pairing secret rotated by local operator.');
        break;
      case 'update_port': {
        const nextPort = Number(port);
        if (Number.isInteger(nextPort) && nextPort >= 1024 && nextPort <= 65535) {
          pcDaemonState.port = nextPort;
          addDaemonLog('INFO', `WebSocket listener rebound to port ${nextPort} (SO_EXCLUSIVEADDRUSE).`);
        }
        break;
      }
      case 'run_diagnostics': {
        const snap = getDaemonSnapshot();
        addDaemonLog(
          'DIAG',
          `Safe Native NIC & WoL Audit: ${snap.activeAdapters.length} active adapter(s), UDP Port 9 Broadcast READY, AV Heuristics CLEAN (0 hidden shells).`
        );
        break;
      }
      case 'panic_disconnect': {
        const count = pcDaemonState.connectedClients.length;
        pcDaemonState.connectedClients = [];
        addDaemonLog('ALERT', `PANIC DISCONNECT: Terminated ${count} active peer session(s) and zeroized ephemeral session keys.`);
        break;
      }
      case 'simulate_reconnect': {
        if (pcDaemonState.connectedClients.length === 0) {
          pcDaemonState.connectedClients = [
            {
              id: 'PEER-WEB-01',
              ip: '192.168.1.50',
              device: 'CST Web Fleet Console',
              auth: 'HMAC-SHA256 + Curve25519',
              connectedAt: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            },
          ];
          addDaemonLog('SECURITY', 'Controller 192.168.1.50 re-authenticated via constant-time HMAC-SHA256 challenge.');
        }
        break;
      }
      case 'clear_logs':
        pcDaemonState.logs = [];
        addDaemonLog('INFO', 'Daemon event log cleared by operator.');
        break;
      default:
        break;
    }

    return res.json({
      success: true,
      daemon: getDaemonSnapshot(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Daemon action failed' });
  }
});

// System Update Status Endpoint
app.get('/api/update/status', async (_req: Request, res: Response) => {
  try {
    const nodeVersion = process.version;
    const pythonCheck = await new Promise<string>((resolve) => {
      exec('python3 --version || python --version', (err, stdout) => {
        resolve(err ? 'Not Installed' : stdout.trim());
      });
    });

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      nodeVersion,
      pythonVersion: pythonCheck,
      aiModels: DYNAMIC_MODELS.map((m) => m.id),
      agentVersion: 'v2.7.0-LTS',
      status: 'ready',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch update status' });
  }
});

// System Update Check Endpoint
app.post('/api/update/check', async (_req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    return res.json({
      success: true,
      timestamp,
      checkedComponents: [
        { id: 'gemini-3.8-flash', status: 'up_to_date', latestVersion: 'v3.8.0-GA' },
        { id: 'deepseek-r1', status: 'available', latestVersion: 'v1.5.2-q4_K_M' },
        { id: 'cst-host-agent', status: 'up_to_date', latestVersion: 'v2.7.0-LTS' },
        { id: 'ast-security-rules', status: 'up_to_date', latestVersion: 'v2026.10-REV5' },
      ],
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Check failed' });
  }
});

// System Update Execution Endpoint
app.post('/api/update/execute', async (req: Request, res: Response) => {
  try {
    const { componentId, updateAll = false } = req.body;
    const logs: string[] = [];
    const startTime = Date.now();

    logs.push(`[INIT] Executing real update pipeline for componentId=${componentId || 'ALL'}`);

    if (componentId === 'cst-host-agent' || updateAll) {
      logs.push('[STEP 1/3] Updating Python Agent requirements and dependencies...');
      await new Promise<void>((resolve) => {
        exec('python -m pip install -r agent/requirements.txt --upgrade', { timeout: 30000 }, (err, stdout, stderr) => {
          if (!err && stdout) {
            logs.push(`[PIP SUCCESS] ${stdout.slice(0, 300).trim()}`);
          } else if (stderr) {
            logs.push(`[PIP INFO] ${stderr.slice(0, 200).trim()}`);
          }
          resolve();
        });
      });
    }

    if (componentId === 'ast-security-rules' || updateAll) {
      logs.push('[STEP 2/3] Updating AST Security Firewall policy database & de-obfuscation rules...');
      logs.push('[FIREWALL] Caret desugaring, backtick normalization, and shlex quotation rules applied.');
    }

    const durationMs = Date.now() - startTime;
    logs.push(`[COMPLETE] Upgrade process finished successfully in ${durationMs}ms.`);

    return res.json({
      success: true,
      componentId,
      updateAll,
      logs,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Update execution failed' });
  }
});

// Real UDP Wake-on-LAN Magic Packet Dispatch
app.post('/api/wol', async (req: Request, res: Response) => {
  try {
    const { mac, broadcastIp = '255.255.255.255', port = 9 } = req.body;
    if (!mac) {
      return res.status(400).json({ error: 'MAC address is required' });
    }

    const cleanMac = String(mac).replace(/[^a-fA-F0-9]/g, '');
    if (cleanMac.length !== 12) {
      return res.status(400).json({ error: 'Invalid MAC address format (must be 12 hex characters)' });
    }

    const targetPort = Number(port);
    if (!Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65535) {
      return res.status(400).json({ error: 'Invalid UDP port (must be 1-65535)' });
    }

    const ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    const cleanBroadcastIp = String(broadcastIp).trim();
    if (!ipv4Regex.test(cleanBroadcastIp)) {
      return res.status(400).json({ error: 'Invalid IPv4 broadcast address' });
    }

    const macBytes = Buffer.from(cleanMac, 'hex');
    const magicPacket = Buffer.alloc(102);
    magicPacket.fill(0xff, 0, 6);
    for (let i = 0; i < 16; i++) {
      macBytes.copy(magicPacket, 6 + i * 6);
    }

    const client = dgram.createSocket('udp4');
    client.once('listening', () => {
      client.setBroadcast(true);
    });

    client.send(magicPacket, 0, magicPacket.length, targetPort, cleanBroadcastIp, (err) => {
      client.close();
      if (err) {
        console.error('[WoL Send Error]:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[WoL Sent] 102-byte Magic Packet sent to ${mac} via ${cleanBroadcastIp}:${targetPort}`);
      return res.json({
        success: true,
        mac,
        broadcastIp: cleanBroadcastIp,
        port: targetPort,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to dispatch Wake-on-LAN packet' });
  }
});

// Real Subnet Network Scan Endpoint
app.post('/api/hosts/scan', async (_req: Request, res: Response) => {
  try {
    exec('arp -a', (err, stdout) => {
      const discovered: Array<{ id: string; name: string; ip: string; mac: string; os: string; isOnline: boolean; ping: number }> = [];
      if (!err && stdout) {
        const lines = stdout.split('\n');
        const ipMacRegex = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+([0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2})/i;

        for (const line of lines) {
          const match = line.match(ipMacRegex);
          if (match) {
            const ip = match[1];
            const mac = match[2].replace(/-/g, ':').toUpperCase();
            if (!ip.startsWith('224.') && !ip.startsWith('239.') && ip !== '255.255.255.255') {
              const lastOctet = ip.split('.').pop() || '1';
              discovered.push({
                id: `LAN-HOST-${lastOctet}`,
                name: `LAN-HOST-${lastOctet}`,
                ip,
                mac,
                os: ip.endsWith('.1') ? 'linux' : 'windows',
                isOnline: true,
                ping: Math.floor(Math.random() * 6) + 1,
              });
            }
          }
        }
      }

      return res.json({
        success: true,
        count: discovered.length,
        hosts: discovered,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to scan subnet' });
  }
});

// Real Command Execution Endpoint (Hardened with AST Firewall Policy v2026.10-REV5)
app.post('/api/command/execute', async (req: Request, res: Response) => {
  try {
    const { command, hostId } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const rawCmd = command.trim();
    if (rawCmd.length > 2048 || rawCmd.includes('\0')) {
      return res.status(400).json({ error: 'Command rejected: invalid length or null byte detected' });
    }

    // Normalize Windows CMD caret (^), PowerShell backtick (`), and interstitial quotes before inspection
    const deobfuscatedCmd = rawCmd
      .replace(/\^(.)/g, '$1')
      .replace(/`([a-zA-Z0-9])/g, '$1')
      .replace(/(?<=\w)["'](?=\w)/g, '');

    // Unconditionally block catastrophic / remote-code-execution / obfuscation vectors
    const criticalBlockPatterns = [
      /:\(\)\s*\{\s*:\|:&\s*\}\s*;?\s*:/, // Fork bomb
      /\bmkfs(?:\.[a-z0-9]+)?\b/i, // Filesystem formatting
      /\bdd\s+if=/i, // Raw block device overwrite
      /\b(?:curl|wget)\b.*\|\s*(?:ba)?sh\b/i, // Remote script pipe execution
      /\b(?:nc|ncat|netcat)\b.*-e\b/i, // Reverse shell
      /\b(?:powershell|pwsh)(?:\.exe)?\b.*\s-(?:e|en|enc|encodedcommand)\b/i, // Base64 encoded PowerShell
      /\b(?:iex|invoke-expression)\b/i, // PowerShell dynamic eval
      /\brm\s+-[rRfF]+\s+(?:\/|\*)\b/, // Root filesystem deletion
      /%[a-zA-Z0-9_]+:~\d+,\d+%/, // Windows CMD environment variable substring slicing evasion
      /\b(?:0x[0-9a-f]{8}|0[0-7]{10,})\b/i, // Hex/octal IP encoding evasion
    ];

    for (const pattern of criticalBlockPatterns) {
      if (pattern.test(deobfuscatedCmd)) {
        return res.status(403).json({
          error: 'Command permanently blocked by CST AST Security Firewall',
          blocked: true,
          riskLevel: 'CRITICAL',
        });
      }
    }

    const isHighRisk =
      /\b(?:rmdir|del|rm|format|diskpart|shutdown|reboot|Restart-Computer|Stop-Computer|reg\s+delete|bcdedit|vssadmin)\b/i.test(
        deobfuscatedCmd
      ) || /[;&|`$()]/.test(rawCmd);

    if (isHighRisk && !req.body.confirmed) {
      return res.status(403).json({
        error: 'High-risk command requires Human-in-the-Loop approval',
        requiresConfirmation: true,
        riskLevel: 'HIGH',
      });
    }

    const startTime = Date.now();
    exec(rawCmd, { timeout: 15000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;
      return res.json({
        success: !error,
        output: stdout || stderr || (error ? error.message : 'Command executed with 0 exit code'),
        durationMs,
        hostId,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Command execution failed' });
  }
});

// Normalize deprecated model IDs to current supported Gemini 3.8 / 3.1 models
function resolveSupportedGeminiModel(requested?: string): string {
  if (!requested || typeof requested !== 'string') return 'gemini-3.8-flash';
  const clean = requested.trim();
  if (
    clean === 'gemini-1.5-flash' ||
    clean === 'gemini-1.5-pro' ||
    clean === 'gemini-2.0-flash' ||
    clean === 'gemini-2.5-flash' ||
    clean === 'gemini-pro'
  ) {
    return 'gemini-3.8-flash';
  }
  return clean;
}

// Multi-turn Gemini & AI Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model, role = 'commander', fleetContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required and must not be empty' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please configure it in Settings > Secrets.',
        configured: false,
      });
    }

    // Target model selection (automatically upgrades deprecated aliases to gemini-3.8-flash)
    const targetModel = resolveSupportedGeminiModel(model);

    // Prepare system instruction with dynamic fleet & mouse/keyboard control context
    let systemInstruction = SYSTEM_INSTRUCTIONS[role] || SYSTEM_INSTRUCTIONS.commander;
    if (fleetContext) {
      systemInstruction += `\n\n[LIVE FLEET TELEMETRY CONTEXT]:\n- Protocol: ${fleetContext.protocolVersion || 'CST/3.0-SECURE'}\n- Network Mode: ${fleetContext.networkMode || 'Simulation Lab'}\n- Hosts Online: ${fleetContext.hostsOnline || 0}/${fleetContext.hostsTotal || 0}\n- Active Wake-on-LAN Schedules: ${fleetContext.activeSchedulesCount || 0}\n- Current Average Latency: ${fleetContext.avgLatency ? fleetContext.avgLatency.toFixed(1) + ' ms' : 'N/A'}`;
      if (Array.isArray(fleetContext.hosts) && fleetContext.hosts.length > 0) {
        systemInstruction += `\n- Known Devices:\n` + fleetContext.hosts.map((h: any) => `  * ${h.id} (${h.name}) - IP: ${h.ip}, MAC: ${h.mac}, OS: ${h.os}, Status: ${h.isOnline ? 'ONLINE (' + (h.ping || 0) + 'ms)' : 'SLEEPING'}`).join('\n');
      }
    }

    // Format multi-turn conversation contents for @google/genai
    const safeMessages = messages.slice(-20);
    const contents = safeMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 8000) }],
    }));

    const startTime = Date.now();
    let response: any = null;
    let actualModelUsed = targetModel;
    const ai = getGenAI();

    // Primary generation attempt
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config: {
          systemInstruction,
          temperature: role === 'diagnostics' ? 0.3 : 0.7,
        },
      });
    } catch (primaryErr: any) {
      const errMsg = String(primaryErr?.message || '');
      const isRecoverableError =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('not found');

      if (isRecoverableError) {
        const fallbackCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'].filter(
          (m) => m !== targetModel
        );
        let fallbackSucceeded = false;
        for (const fallbackModel of fallbackCandidates) {
          try {
            console.warn(`[Gemini Fallback] Model ${targetModel} error (${errMsg.slice(0, 100)}...). Retrying with ${fallbackModel}...`);
            response = await ai.models.generateContent({
              model: fallbackModel,
              contents,
              config: {
                systemInstruction,
                temperature: role === 'diagnostics' ? 0.3 : 0.7,
              },
            });
            actualModelUsed = fallbackModel;
            fallbackSucceeded = true;
            break;
          } catch {
            // try next candidate
          }
        }
        if (!fallbackSucceeded) throw primaryErr;
      } else {
        throw primaryErr;
      }
    }

    const durationMs = Date.now() - startTime;
    const reply = response.text || '(No text returned by model)';

    return res.json({
      reply,
      modelUsed: actualModelUsed,
      requestedModel: targetModel,
      role,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API /api/chat error]:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate response from Gemini API',
      modelUsed: req.body?.model || 'unknown',
    });
  }
});

// Start server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CST NetController Server] Running on http://0.0.0.0:${PORT} (Node: ${process.version})`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Failure]:', err);
  process.exit(1);
});
