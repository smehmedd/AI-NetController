import { HostDevice } from '../types';

const screenCache = new Map<string, string>();
const MAX_CACHE_SIZE = 12;

/**
 * Generates a realistic high-resolution SVG desktop screenshot for Windows or Linux hosts,
 * showing the terminal daemon running with mDNS, Ollama, and hardware gauges.
 */
export function generateMockScreenCanvas(device?: HostDevice | null): string {
  const isWin = device?.os === 'windows' || !device;
  const hostId = device?.id || 'CST-LAB-PC-1';
  const ip = device?.ip || '192.168.1.50';
  const mac = device?.mac || '00:1A:2B:3C:4D:5E';
  const cpu = device?.cpuUsage ?? 24;
  const ram = device?.ramUsage ?? 48;

  const cacheKey = `${hostId}_${isWin ? 1 : 0}_${cpu}_${ram}`;
  if (screenCache.has(cacheKey)) {
    return screenCache.get(cacheKey)!;
  }

  const bgColor = isWin ? '#0b1329' : '#140c24';
  const taskbarColor = isWin ? '#050a17' : '#0d0718';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <radialGradient id="bgGlow" cx="70%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.12" />
        <stop offset="60%" stop-color="#8A2BE2" stop-opacity="0.05" />
        <stop offset="100%" stop-color="#040812" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="termGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#081120" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#040812" stop-opacity="0.98" />
      </linearGradient>
    </defs>

    <!-- Desktop Background -->
    <rect width="1280" height="720" fill="${bgColor}" />
    <rect width="1280" height="720" fill="url(#bgGlow)" />

    <!-- Subtle Hex Grid Backdrop -->
    <pattern id="hexGrid" width="40" height="40" patternUnits="userSpaceOnUse" opacity="0.06">
      <path d="M20 0 L40 10 L40 30 L20 40 L0 30 L0 10 Z" fill="none" stroke="#00F0FF" stroke-width="1"/>
    </pattern>
    <rect width="1280" height="672" fill="url(#hexGrid)" />

    <!-- Terminal Window: Python Host Agent Daemon -->
    <rect x="80" y="50" width="700" height="420" rx="14" fill="url(#termGrad)" stroke="#00F0FF" stroke-width="1.5" />
    <rect x="80" y="50" width="700" height="40" rx="14" fill="#0c1a30" stroke="#00F0FF" stroke-width="0.5" />
    <circle cx="106" cy="70" r="6" fill="#FF2A6D" />
    <circle cx="126" cy="70" r="6" fill="#FFB800" />
    <circle cx="146" cy="70" r="6" fill="#00FFA3" />
    <text x="175" y="75" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold">
      cst@${hostId}: ~/host_agent $ python3 agent.py
    </text>

    <!-- Terminal Lines -->
    <text x="104" y="125" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="13">
      [mDNS] Announced: _cst-agent._tcp.local. on 0.0.0.0:8765
    </text>
    <text x="104" y="155" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="13">
      [WS] WebSocket server online: ws://${ip}:8765
    </text>
    <text x="104" y="185" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="13">
      [SYS] Host: ${hostId} | MAC: ${mac} | OS: ${isWin ? 'Windows 11' : 'Linux Kernel 6.5'}
    </text>
    <text x="104" y="215" fill="#8A2BE2" font-family="'JetBrains Mono', monospace" font-size="13">
      [AI-ENGINE] Ollama instance: qwen2.5-coder:7b (HITL strict active)
    </text>
    <text x="104" y="245" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="13">
      [SCREEN] Frame grabber initialized: mss engine (1280x720 JPEG)
    </text>
    <text x="104" y="275" fill="#FFB800" font-family="'JetBrains Mono', monospace" font-size="13">
      [TELEMETRY] CPU: ${cpu}% | RAM: ${ram}% | Status: READY
    </text>
    <text x="104" y="315" fill="#FFFFFF" font-family="'JetBrains Mono', monospace" font-size="13">
      &gt; Client connection established from Flutter Mobile Controller
    </text>
    <text x="104" y="345" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="13">
      &gt; Stream: SCREEN_FRAME event dispatched via WebSocket (32ms latency)
    </text>
    <text x="104" y="390" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="bold">
      [DAEMON READY] Awaiting mobile client prompt... _
    </text>

    <!-- Side Floating Hardware Telemetry Widget -->
    <rect x="820" y="50" width="380" height="230" rx="14" fill="#081120" stroke="#8A2BE2" stroke-width="1.5" opacity="0.95" />
    <text x="844" y="86" fill="#8A2BE2" font-family="'Rajdhani', sans-serif" font-size="18" font-weight="bold" letter-spacing="1">
      HARDWARE TELEMETRY HUD
    </text>
    <text x="844" y="125" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12">
      CPU UTILIZATION: ${cpu}%
    </text>
    <rect x="844" y="135" width="330" height="10" rx="5" fill="#1E293B" />
    <rect x="844" y="135" width="${(cpu / 100) * 330}" height="10" rx="5" fill="#00F0FF" />

    <text x="844" y="180" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12">
      RAM UTILIZATION: ${ram}% (8.4 GB / 16.0 GB)
    </text>
    <rect x="844" y="190" width="330" height="10" rx="5" fill="#1E293B" />
    <rect x="844" y="190" width="${(ram / 100) * 330}" height="10" rx="5" fill="#8A2BE2" />

    <text x="844" y="240" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="12">
      STATUS: ACTIVE LISTENER (PORT 8765)
    </text>

    <!-- Code Editor Card (Mini representation) -->
    <rect x="820" y="300" width="380" height="170" rx="14" fill="#081120" stroke="#00F0FF" stroke-width="1" opacity="0.85" />
    <text x="844" y="330" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">
      FILE: backend/agent.py
    </text>
    <text x="844" y="360" fill="#64748B" font-family="'JetBrains Mono', monospace" font-size="11">
      async def handle_client(websocket):
    </text>
    <text x="860" y="385" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="11">
      msg = await websocket.recv()
    </text>
    <text x="860" y="410" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="11">
      if msg.get("action") == "EXECUTE_PROMPT":
    </text>
    <text x="880" y="435" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="11">
      await hitl_filter_and_dispatch(msg)
    </text>

    <!-- Desktop Taskbar -->
    <rect x="0" y="672" width="1280" height="48" fill="${taskbarColor}" stroke="#1E293B" stroke-width="1" />
    <rect x="16" y="680" width="32" height="32" rx="8" fill="#00F0FF" opacity="0.2" stroke="#00F0FF" stroke-width="1" />
    <text x="25" y="702" fill="#00F0FF" font-family="sans-serif" font-size="16" font-weight="bold">⊞</text>

    <rect x="60" y="682" width="28" height="28" rx="6" fill="#1E293B" />
    <rect x="96" y="682" width="28" height="28" rx="6" fill="#1E293B" />
    <rect x="132" y="682" width="28" height="28" rx="6" fill="#1E293B" />

    <text x="1170" y="702" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="13">
      LAN: 1 Gbps
    </text>
  </svg>`;

  const result = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  if (screenCache.size >= MAX_CACHE_SIZE) {
    const firstKey = screenCache.keys().next().value;
    if (firstKey) screenCache.delete(firstKey);
  }
  screenCache.set(cacheKey, result);
  return result;
}
