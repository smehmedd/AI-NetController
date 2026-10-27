import { HostDevice } from '../types';

export type SimulatedWindowType = 'default' | 'task_manager' | 'file_explorer' | 'browser' | 'desktop' | 'locked';

export interface ScreenSimulationState {
  activeWindow?: SimulatedWindowType;
  lastCommandLine?: string;
  lastTypedText?: string;
  browserUrl?: string;
}

const screenCache = new Map<string, string>();
const MAX_CACHE_SIZE = 24;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a realistic high-resolution SVG desktop screenshot for Windows or Linux hosts,
 * dynamically reflecting opened windows (Task Manager, File Explorer, Browser, Desktop) and AI actions.
 */
export function generateMockScreenCanvas(
  device?: HostDevice | null,
  simState?: ScreenSimulationState
): string {
  const isWin = device?.os === 'windows' || !device;
  const hostId = device?.id || 'HOST';
  const ip = device?.ip || '0.0.0.0';
  const mac = device?.mac || '00:00:00:00:00:00';
  const cpu = device?.cpuUsage ?? 24;
  const ram = device?.ramUsage ?? 48;
  const activeWin = simState?.activeWindow || 'default';
  const lastCmd = simState?.lastCommandLine || '';
  const lastText = simState?.lastTypedText || '';
  const browserUrl = simState?.browserUrl || 'https://www.google.com';

  const cacheKey = `${hostId}_${isWin ? 1 : 0}_${cpu}_${ram}_${activeWin}_${lastCmd}_${lastText}_${browserUrl}`;
  if (screenCache.has(cacheKey)) {
    return screenCache.get(cacheKey)!;
  }

  const bgColor = isWin ? '#0b1329' : '#140c24';
  const taskbarColor = isWin ? '#050a17' : '#0d0718';

  let foregroundOverlay = '';

  if (activeWin === 'task_manager') {
    foregroundOverlay = `
      <!-- Windows 11 Task Manager Foreground Window -->
      <rect x="210" y="70" width="860" height="530" rx="16" fill="#091224" stroke="#38BDF8" stroke-width="2" />
      <rect x="210" y="70" width="860" height="44" rx="16" fill="#0f1d36" />
      <circle cx="238" cy="92" r="6" fill="#FF2A6D" />
      <circle cx="258" cy="92" r="6" fill="#FFB800" />
      <circle cx="278" cy="92" r="6" fill="#00FFA3" />
      <text x="305" y="97" fill="#F8FAFC" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="bold">
        Task Manager — Processes &amp; Performance (${escapeXml(hostId)})
      </text>
      <text x="955" y="97" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">
        Ctrl+Shift+Esc
      </text>

      <!-- CPU & RAM KPI Strip -->
      <rect x="234" y="130" width="250" height="68" rx="10" fill="#060c1a" stroke="#1e293b" />
      <text x="250" y="152" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="11">CPU TOTAL</text>
      <text x="250" y="182" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="22" font-weight="bold">${cpu}% (3.84 GHz)</text>

      <rect x="504" y="130" width="250" height="68" rx="10" fill="#060c1a" stroke="#1e293b" />
      <text x="520" y="152" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="11">MEMORY (DDR5)</text>
      <text x="520" y="182" fill="#A855F7" font-family="'JetBrains Mono', monospace" font-size="22" font-weight="bold">${ram}% (7.7 / 16 GB)</text>

      <rect x="774" y="130" width="270" height="68" rx="10" fill="#060c1a" stroke="#1e293b" />
      <text x="790" y="152" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="11">NETWORK (LAN)</text>
      <text x="790" y="182" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="bold">120Hz Stream Active</text>

      <!-- Process Table Header -->
      <rect x="234" y="214" width="810" height="32" rx="6" fill="#111f38" />
      <text x="250" y="235" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">PROCESS NAME</text>
      <text x="560" y="235" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">PID</text>
      <text x="660" y="235" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">STATUS</text>
      <text x="790" y="235" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">CPU</text>
      <text x="900" y="235" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">MEMORY</text>

      <!-- Process Rows -->
      <rect x="234" y="254" width="810" height="38" rx="6" fill="#0c1930" stroke="#00F0FF" stroke-width="0.8" />
      <text x="250" y="278" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold">cst_host_daemon.exe (CST Agent v2.9)</text>
      <text x="560" y="278" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">4120</text>
      <text x="660" y="278" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="12">Running</text>
      <text x="790" y="278" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="12">4.2%</text>
      <text x="900" y="278" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">84.5 MB</text>

      <rect x="234" y="300" width="810" height="38" rx="6" fill="#060d1b" />
      <text x="250" y="324" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="13">ollama_llama_server.exe (qwen2.5-coder)</text>
      <text x="560" y="324" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">8812</text>
      <text x="660" y="324" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="12">Running</text>
      <text x="790" y="324" fill="#FFB800" font-family="'JetBrains Mono', monospace" font-size="12">12.6%</text>
      <text x="900" y="324" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">4,120 MB</text>

      <rect x="234" y="346" width="810" height="38" rx="6" fill="#060d1b" />
      <text x="250" y="370" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="13">brave.exe (Brave Browser - 8 tabs)</text>
      <text x="560" y="370" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">6304</text>
      <text x="660" y="370" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="12">Running</text>
      <text x="790" y="370" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">3.8%</text>
      <text x="900" y="370" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">1,240 MB</text>

      <rect x="234" y="392" width="810" height="38" rx="6" fill="#060d1b" />
      <text x="250" y="416" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="13">Code.exe (Visual Studio Code - CST Workspace)</text>
      <text x="560" y="416" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">5190</text>
      <text x="660" y="416" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="12">Running</text>
      <text x="790" y="416" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">2.1%</text>
      <text x="900" y="416" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">690 MB</text>

      <rect x="234" y="438" width="810" height="38" rx="6" fill="#060d1b" />
      <text x="250" y="462" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="13">explorer.exe (Windows Shell Experience)</text>
      <text x="560" y="462" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">1940</text>
      <text x="660" y="462" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="12">Running</text>
      <text x="790" y="462" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">0.9%</text>
      <text x="900" y="462" fill="#CBD5E1" font-family="'JetBrains Mono', monospace" font-size="12">145 MB</text>

      <!-- End Task Action Button inside Task Manager -->
      <rect x="880" y="540" width="164" height="38" rx="10" fill="#E11D48" />
      <text x="922" y="564" fill="#FFFFFF" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold">End Task</text>
    `;
  } else if (activeWin === 'file_explorer') {
    foregroundOverlay = `
      <!-- File Explorer Foreground Window -->
      <rect x="200" y="75" width="860" height="510" rx="16" fill="#091224" stroke="#F59E0B" stroke-width="2" />
      <rect x="200" y="75" width="860" height="44" rx="16" fill="#131f38" />
      <circle cx="228" cy="97" r="6" fill="#FF2A6D" />
      <circle cx="248" cy="97" r="6" fill="#FFB800" />
      <circle cx="268" cy="97" r="6" fill="#00FFA3" />
      <text x="295" y="102" fill="#F8FAFC" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="bold">
        File Explorer — D:\\Projects\\CST_Graduation
      </text>
      <rect x="224" y="140" width="240" height="110" rx="12" fill="#0f1c34" stroke="#38BDF8" stroke-width="1" />
      <text x="244" y="180" fill="#FBBF24" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold">📁 agent_daemon</text>
      <text x="244" y="210" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12">14 items • Python 3.12</text>

      <rect x="484" y="140" width="240" height="110" rx="12" fill="#0f1c34" stroke="#38BDF8" stroke-width="1" />
      <text x="504" y="180" fill="#FBBF24" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold">📁 releases_v2.9</text>
      <text x="504" y="210" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12">CST_Daemon.exe • APK</text>

      <rect x="744" y="140" width="290" height="110" rx="12" fill="#0f1c34" stroke="#10B981" stroke-width="1" />
      <text x="764" y="180" fill="#34D399" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold">📄 START_HERE_WINDOWS.bat</text>
      <text x="764" y="210" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="12">1-Click Launcher • Verified</text>
    `;
  } else if (activeWin === 'browser') {
    foregroundOverlay = `
      <!-- Web Browser Foreground Window -->
      <rect x="170" y="65" width="940" height="535" rx="16" fill="#071020" stroke="#00FFA3" stroke-width="2" />
      <rect x="170" y="65" width="940" height="48" rx="16" fill="#0e1b33" />
      <circle cx="198" cy="89" r="6" fill="#FF2A6D" />
      <circle cx="218" cy="89" r="6" fill="#FFB800" />
      <circle cx="238" cy="89" r="6" fill="#00FFA3" />
      <rect x="270" y="75" width="660" height="28" rx="14" fill="#050b16" stroke="#334155" />
      <text x="290" y="94" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="12">
        🔒 ${escapeXml(browserUrl)}
      </text>
      <text x="450" y="280" fill="#F8FAFC" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="bold">
        Brave Browser — Connected
      </text>
      <text x="390" y="325" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="14">
        Navigated to ${escapeXml(browserUrl)} via Remote Phone AI Control
      </text>
    `;
  } else if (activeWin === 'locked') {
    foregroundOverlay = `
      <!-- Locked Workstation Overlay -->
      <rect x="0" y="0" width="1280" height="672" fill="#040914" opacity="0.92" />
      <text x="530" y="280" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="42" font-weight="bold">
        🔒 LOCKED
      </text>
      <text x="450" y="330" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="18">
        ${escapeXml(hostId)} (${escapeXml(ip)}) — Session Locked
      </text>
      <text x="465" y="365" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="13">
        Tap or type via AI Copilot to unlock workstation
      </text>
    `;
  }

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

    ${
      activeWin === 'desktop'
        ? `
      <!-- Clean Desktop Icons View (Win+D) -->
      <rect x="40" y="40" width="96" height="84" rx="12" fill="#0c1930" opacity="0.75" stroke="#38BDF8" stroke-width="1" />
      <text x="52" y="80" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold">🖥️ This PC</text>

      <rect x="40" y="144" width="96" height="84" rx="12" fill="#0c1930" opacity="0.75" stroke="#10B981" stroke-width="1" />
      <text x="48" y="184" fill="#34D399" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">⚡ CST Agent</text>

      <rect x="40" y="248" width="96" height="84" rx="12" fill="#0c1930" opacity="0.75" stroke="#A855F7" stroke-width="1" />
      <text x="48" y="288" fill="#C084FC" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">📁 Projects</text>
    `
        : `
      <!-- Terminal Window: Python Host Agent Daemon -->
      <rect x="80" y="50" width="700" height="440" rx="14" fill="url(#termGrad)" stroke="#00F0FF" stroke-width="1.5" />
      <rect x="80" y="50" width="700" height="40" rx="14" fill="#0c1a30" stroke="#00F0FF" stroke-width="0.5" />
      <circle cx="106" cy="70" r="6" fill="#FF2A6D" />
      <circle cx="126" cy="70" r="6" fill="#FFB800" />
      <circle cx="146" cy="70" r="6" fill="#00FFA3" />
      <text x="175" y="75" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold">
        cst@${escapeXml(hostId)}: ~/host_agent $ python3 agent.py
      </text>

      <!-- Terminal Lines -->
      <text x="104" y="125" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="13">
        [mDNS] Announced: _cst-agent._tcp.local. on 0.0.0.0:8765
      </text>
      <text x="104" y="155" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="13">
        [WS] WebSocket server online: ws://${escapeXml(ip)}:8765
      </text>
      <text x="104" y="185" fill="#94A3B8" font-family="'JetBrains Mono', monospace" font-size="13">
        [SYS] Host: ${escapeXml(hostId)} | MAC: ${escapeXml(mac)} | OS: ${isWin ? 'Windows 11' : 'Linux Kernel 6.5'}
      </text>
      <text x="104" y="215" fill="#8A2BE2" font-family="'JetBrains Mono', monospace" font-size="13">
        [AI-ENGINE] Gemini 3.8 Flash &amp; Ollama qwen2.5-coder active
      </text>
      <text x="104" y="245" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="13">
        [SCREEN] Frame grabber initialized: mss engine (1280x720 JPEG)
      </text>
      <text x="104" y="275" fill="#FFB800" font-family="'JetBrains Mono', monospace" font-size="13">
        [TELEMETRY] CPU: ${cpu}% | RAM: ${ram}% | Status: READY
      </text>
      <text x="104" y="315" fill="#FFFFFF" font-family="'JetBrains Mono', monospace" font-size="13">
        &gt; Touch Input: 1-Tap = Left Click | Hold 1s = Right Click
      </text>
      ${
        lastCmd
          ? `<text x="104" y="350" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold">
              &gt; [AI-EXEC] ${escapeXml(lastCmd.slice(0, 56))}
            </text>`
          : `<text x="104" y="350" fill="#00F0FF" font-family="'JetBrains Mono', monospace" font-size="13">
              &gt; Stream: SCREEN_FRAME event dispatched via WebSocket (32ms)
            </text>`
      }
      ${
        lastText
          ? `<text x="104" y="385" fill="#FBBF24" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold">
              &gt; [TYPED] "${escapeXml(lastText.slice(0, 50))}"
            </text>`
          : ''
      }
      <text x="104" y="425" fill="#00FFA3" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="bold">
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
    `
    }

    ${foregroundOverlay}

    <!-- Desktop Taskbar -->
    <rect x="0" y="672" width="1280" height="48" fill="${taskbarColor}" stroke="#1E293B" stroke-width="1" />
    <rect x="16" y="680" width="32" height="32" rx="8" fill="#00F0FF" opacity="0.2" stroke="#00F0FF" stroke-width="1" />
    <text x="25" y="702" fill="#00F0FF" font-family="sans-serif" font-size="16" font-weight="bold">⊞</text>

    <rect x="60" y="682" width="28" height="28" rx="6" fill="${activeWin === 'task_manager' ? '#00F0FF' : '#1E293B'}" opacity="${activeWin === 'task_manager' ? '0.45' : '1'}" />
    <rect x="96" y="682" width="28" height="28" rx="6" fill="${activeWin === 'file_explorer' ? '#F59E0B' : '#1E293B'}" opacity="${activeWin === 'file_explorer' ? '0.45' : '1'}" />
    <rect x="132" y="682" width="28" height="28" rx="6" fill="${activeWin === 'browser' ? '#10B981' : '#1E293B'}" opacity="${activeWin === 'browser' ? '0.45' : '1'}" />

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

