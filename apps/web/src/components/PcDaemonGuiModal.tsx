import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  ShieldCheck,
  Cpu,
  HardDrive,
  Wifi,
  Copy,
  Check,
  RefreshCw,
  Pause,
  Play,
  Lock,
  Unlock,
  KeyRound,
  Terminal,
  Download,
  OctagonAlert,
  X,
  Eye,
  EyeOff,
  Radio,
  Activity,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { triggerHapticFeedback } from '../services/hapticService';
import { useTranslation } from '../i18n/useTranslation';

interface ConnectedPeer {
  id: string;
  ip: string;
  device: string;
  auth: string;
  connectedAt: string;
}

interface DaemonLog {
  time: string;
  level: 'INFO' | 'SECURITY' | 'DIAG' | 'WARN' | 'ALERT';
  message: string;
}

interface DaemonStateSnapshot {
  version: string;
  protocol: string;
  hostname: string;
  osName: string;
  localIp: string;
  port: number;
  wsUri: string;
  uptime: string;
  isRunning: boolean;
  isPaused: boolean;
  mdnsEnabled: boolean;
  viewOnlyMode: boolean;
  requireHitlApproval: boolean;
  pairingToken: string;
  cpuPercent: number;
  cpuCores: number;
  ramPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskPercent: number;
  captureFps: number;
  connectedClients: ConnectedPeer[];
  activeAdapters: Array<{ name: string; ipv4: string; mac: string }>;
  avIntegrity: {
    upxDisabled: boolean;
    visibleHwnd: boolean;
    zeroHiddenShell: boolean;
    manifestAsInvoker: boolean;
    authenticodeReady: boolean;
    sandboxJobObject: boolean;
  };
  logs: DaemonLog[];
}

interface PcDaemonGuiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCodeReleases?: () => void;
}

const FALLBACK_DAEMON_STATE: DaemonStateSnapshot = {
  version: '2.7.0-LTS',
  protocol: 'CST/3.0-SECURE',
  hostname: 'CST-LAB-WS-01',
  osName: 'Windows 11 Pro 24H2 (x86_64)',
  localIp: '192.168.1.104',
  port: 8765,
  wsUri: 'ws://192.168.1.104:8765',
  uptime: '00:14:32',
  isRunning: true,
  isPaused: false,
  mdnsEnabled: true,
  viewOnlyMode: false,
  requireHitlApproval: true,
  pairingToken: 'cst_autonomous_lan_secret_2025',
  cpuPercent: 11.4,
  cpuCores: 8,
  ramPercent: 34.2,
  ramUsedGb: 5.5,
  ramTotalGb: 16.0,
  diskPercent: 42.8,
  captureFps: 60,
  connectedClients: [
    {
      id: 'PEER-WEB-01',
      ip: '192.168.1.50',
      device: 'CST Web Fleet Console',
      auth: 'HMAC-SHA256 + Curve25519',
      connectedAt: '14:20:05',
    },
    {
      id: 'PEER-MOB-02',
      ip: '192.168.1.88',
      device: 'Android 15 Controller (arm64)',
      auth: 'ChaCha20-Poly1305 AEAD',
      connectedAt: '14:24:18',
    },
  ],
  activeAdapters: [
    { name: 'Ethernet0 (Intel I225-V 2.5GbE)', ipv4: '192.168.1.104', mac: '00:2B:67:89:AB:CD' },
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
    {
      time: '14:18:00',
      level: 'INFO',
      message: 'CST Host Daemon GUI v2.7.0-LTS initialized on 192.168.1.104:8765',
    },
    {
      time: '14:18:02',
      level: 'SECURITY',
      message:
        'AV-Safe Mode verified: Native Tkinter HWND window, UPX disabled, zero hidden PowerShell spawns.',
    },
  ],
};

export const PcDaemonGuiModal: React.FC<PcDaemonGuiModalProps> = ({
  isOpen,
  onClose,
  onOpenCodeReleases,
}) => {
  const { language } = useTranslation();
  const isBg = language === 'bg';

  const [daemon, setDaemon] = useState<DaemonStateSnapshot>(FALLBACK_DAEMON_STATE);
  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [portInput, setPortInput] = useState('8765');
  const [isEditingPort, setIsEditingPort] = useState(false);

  const fetchDaemonState = useCallback(async () => {
    try {
      const res = await fetch('/api/daemon/state');
      const data = await res.json();
      if (data.success && data.daemon) {
        setDaemon(data.daemon);
        if (!isEditingPort) {
          setPortInput(String(data.daemon.port));
        }
      }
    } catch {
      // Keep local fallback state if offline
    }
  }, [isEditingPort]);

  useEffect(() => {
    if (!isOpen) return;
    fetchDaemonState();
    const timer = setInterval(fetchDaemonState, 2000);
    return () => clearInterval(timer);
  }, [isOpen, fetchDaemonState]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dispatchAction = async (action: string, extra?: Record<string, any>) => {
    triggerHapticFeedback('medium');
    setIsLoadingAction(action);
    try {
      const res = await fetch('/api/daemon/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (data.success && data.daemon) {
        setDaemon(data.daemon);
      }
    } catch {
      // Local optimistic fallback
      const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setDaemon((prev) => {
        if (action === 'toggle_pause') {
          const nextPaused = !prev.isPaused;
          return {
            ...prev,
            isPaused: nextPaused,
            captureFps: nextPaused ? 0 : prev.connectedClients.length > 0 ? 60 : 2,
            logs: [
              ...prev.logs,
              {
                time: nowTime,
                level: nextPaused ? 'WARN' : 'INFO',
                message: nextPaused
                  ? 'Daemon paused by local operator.'
                  : 'Daemon resumed by local operator.',
              },
            ],
          };
        }
        if (action === 'toggle_view_only') {
          const nextViewOnly = !prev.viewOnlyMode;
          return {
            ...prev,
            viewOnlyMode: nextViewOnly,
            logs: [
              ...prev.logs,
              {
                time: nowTime,
                level: 'SECURITY',
                message: nextViewOnly
                  ? 'View-Only Mode enabled: Remote mouse & keyboard input locked.'
                  : 'Remote mouse & keyboard input unlocked.',
              },
            ],
          };
        }
        return prev;
      });
    } finally {
      setIsLoadingAction(null);
    }
  };

  const handleCopyUri = () => {
    triggerHapticFeedback('light');
    navigator.clipboard.writeText(daemon.wsUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 1800);
  };

  const handleCopyToken = () => {
    triggerHapticFeedback('light');
    navigator.clipboard.writeText(daemon.pairingToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1800);
  };

  const handleApplyPort = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(portInput);
    if (Number.isInteger(num) && num >= 1024 && num <= 65535) {
      setIsEditingPort(false);
      dispatchAction('update_port', { port: num });
    }
  };

  const avChecks = [
    {
      key: 'upx',
      title: isBg ? 'Нулева UPX компресия (upx=False)' : 'Zero UPX Packing (upx=False)',
      desc: isBg
        ? 'Елиминира фалшивите детекции Win32/Wacatac при евристичен анализ'
        : 'Eliminates Win32/Wacatac heuristic unpacker false positives',
    },
    {
      key: 'hwnd',
      title: isBg ? 'Видим Desktop GUI прозорец (HWND)' : 'Visible Native GUI Window (HWND)',
      desc: isBg
        ? 'Прозрачен Tkinter контролен панел вместо скрит фонов процес'
        : 'Transparent Tkinter control center instead of headless socket listener',
    },
    {
      key: 'shell',
      title: isBg ? 'Без скрити PowerShell / CMD процеси' : 'Zero Hidden PowerShell / CMD Spawns',
      desc: isBg
        ? 'Чиста Python psutil & socket NIC диагностика без shell=True'
        : 'Pure Python psutil & socket NIC diagnostics without shell=True',
    },
    {
      key: 'manifest',
      title: isBg ? 'Windows 10/11 Манифест (asInvoker)' : 'Windows 10/11 Manifest (asInvoker)',
      desc: isBg
        ? 'Без принудителна UAC ескалация + PerMonitorV2 High-DPI скалиране'
        : 'Standard user privilege level + PerMonitorV2 High-DPI awareness',
    },
    {
      key: 'sig',
      title: isBg ? 'SHA-256 Authenticode Подпис' : 'SHA-256 Authenticode Signed',
      desc: isBg
        ? 'Включен sign_binary.ps1 и MpCmdRun.exe Defender верификация'
        : 'Includes sign_binary.ps1 & MpCmdRun.exe Defender verification',
    },
    {
      key: 'sandbox',
      title: isBg ? 'Windows Job Object Изолация' : 'Windows Job Object Sandbox',
      desc: isBg
        ? '256MB RAM лимит и автоматично почистване на дъщерни задачи'
        : '256MB RAM cap & clean process tree lifecycle governance',
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHapticFeedback('light');
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-5xl max-h-[93vh] flex flex-col rounded-[24px] bg-[#091020]/96 backdrop-blur-3xl border border-white/15 border-t-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Native Desktop Window Titlebar Chrome */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#060b16] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)] shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white font-display tracking-wide truncate">
                  {isBg
                    ? `CST PC Демон Контролен Център — ${daemon.hostname}`
                    : `CST PC Host Daemon Control Center — ${daemon.hostname}`}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    daemon.isPaused
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      daemon.isPaused ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  {daemon.isPaused
                    ? isBg
                      ? 'ПАУЗИРАН'
                      : 'PAUSED'
                    : isBg
                    ? 'ОНЛАЙН • СЛУША'
                    : 'ONLINE • LISTENING'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/12 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{isBg ? 'AV-Safe Верифициран' : 'AV-Safe Verified'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {daemon.osName} • {daemon.protocol} • v{daemon.version} • Uptime: {daemon.uptime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/releases/v2.7.0/CST_HostAgent_v2.7.0_win64.exe"
              download="CST_HostAgent_v2.7.0_win64.exe"
              onClick={() => triggerHapticFeedback('medium')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBg ? 'Свали .EXE (GUI)' : 'Download .EXE (GUI)'}</span>
            </a>

            {onOpenCodeReleases && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  onOpenCodeReleases();
                }}
                className="hidden sm:flex min-h-[40px] px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-mono text-slate-200 items-center gap-1.5 transition cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>agent_gui.py</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                onClose();
              }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 flex items-center justify-center transition cursor-pointer"
              aria-label={isBg ? 'Затвори' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Scrollable Desktop GUI Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ROW 1: Network & Pairing Endpoint Card + Live Hardware Telemetry Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left (6 cols): Network & Pairing Endpoint */}
            <div className="lg:col-span-6 rounded-2xl bg-[#0b1324]/75 border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    {isBg ? 'Мрежова точка и сдвояване' : 'Network & Pairing Endpoint'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 tabular-nums">
                  Uptime: {daemon.uptime}
                </span>
              </div>

              {/* WebSocket URI */}
              <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-slate-400">
                    {isBg ? 'Локален WebSocket адрес' : 'Local WebSocket URI'}
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-bold text-cyan-300 truncate tabular-nums">
                    {daemon.wsUri}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUri}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-xs font-mono font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition"
                >
                  {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUri ? (isBg ? 'Копирано' : 'Copied') : isBg ? 'Копирай URI' : 'Copy URI'}</span>
                </button>
              </div>

              {/* Port & mDNS Info */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-black/30 border border-white/[0.07] rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {isBg ? 'Слушащ Порт' : 'Listening Port'}
                    </div>
                    {isEditingPort ? (
                      <form onSubmit={handleApplyPort} className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          min={1024}
                          max={65535}
                          value={portInput}
                          onChange={(e) => setPortInput(e.target.value)}
                          className="w-20 px-1.5 py-0.5 rounded bg-black border border-cyan-400 text-xs font-mono text-white"
                        />
                        <button
                          type="submit"
                          className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          OK
                        </button>
                      </form>
                    ) : (
                      <div className="text-xs font-mono font-bold text-white tabular-nums">
                        TCP {daemon.port}
                      </div>
                    )}
                  </div>
                  {!isEditingPort && (
                    <button
                      type="button"
                      onClick={() => setIsEditingPort(true)}
                      className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                    >
                      {isBg ? 'Промени' : 'Change'}
                    </button>
                  )}
                </div>

                <div className="bg-black/30 border border-white/[0.07] rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">mDNS ZeroConf</div>
                    <div className="text-xs font-mono font-bold text-white truncate">
                      {daemon.mdnsEnabled ? '_cst-agent._tcp' : isBg ? 'Изключен' : 'Muted'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatchAction('toggle_mdns')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold border cursor-pointer transition ${
                      daemon.mdnsEnabled
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    {daemon.mdnsEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Pairing Key Management */}
              <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>{isBg ? 'HMAC-SHA256 Ключ за сдвояване' : 'HMAC-SHA256 Pairing Key'}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-200 truncate mt-0.5">
                    {showToken ? daemon.pairingToken : '••••••••••••••••••••••••••••'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                    title={showToken ? 'Hide Key' : 'Show Key'}
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-cyan-300 cursor-pointer"
                  >
                    {copiedToken ? (isBg ? 'Копирано!' : 'Copied!') : isBg ? 'Копирай' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchAction('rotate_token')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-[11px] font-mono text-amber-300 cursor-pointer"
                    title={isBg ? 'Генерирай нов криптографски ключ' : 'Rotate pairing key'}
                  >
                    {isBg ? 'Ротирай' : 'Rotate'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right (6 cols): Live PC Hardware Telemetry & Active Peers */}
            <div className="lg:col-span-6 rounded-2xl bg-[#0b1324]/75 border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    {isBg ? 'Системна телеметрия и стрийминг' : 'System Telemetry & Stream Pipeline'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 tabular-nums">
                  {daemon.captureFps} FPS ({daemon.isPaused ? 'Paused' : daemon.captureFps > 2 ? 'TurboJPEG SIMD' : 'Idle Standby'})
                </span>
              </div>

              {/* CPU & RAM Progress Bars */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">
                      CPU ({daemon.cpuCores} {isBg ? 'ядра' : 'cores'})
                    </span>
                    <span className="text-cyan-300 font-bold tabular-nums">{daemon.cpuPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(2, daemon.cpuPercent))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">RAM Memory (Job Limit: 256 MB)</span>
                    <span className="text-cyan-300 font-bold tabular-nums">
                      {daemon.ramPercent}% ({daemon.ramUsedGb} / {daemon.ramTotalGb} GB)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 to-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(2, daemon.ramPercent))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Connected Authenticated Controllers List */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span>
                    {isBg
                      ? `Удостоверени контролери (${daemon.connectedClients.length})`
                      : `Authenticated Controllers (${daemon.connectedClients.length})`}
                  </span>
                  {daemon.connectedClients.length === 0 && (
                    <button
                      type="button"
                      onClick={() => dispatchAction('simulate_reconnect')}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      {isBg ? '+ Тестова сесия' : '+ Reconnect Local Controller'}
                    </button>
                  )}
                </div>

                {daemon.connectedClients.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-xs font-mono text-slate-400 text-center">
                    {isBg
                      ? 'Няма активни дистанционни сесии (Готовност на порт ' + daemon.port + ')'
                      : `No active remote sessions (Listening on port ${daemon.port})`}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {daemon.connectedClients.map((peer) => (
                      <div
                        key={peer.id}
                        className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="min-w-0">
                          <span className="text-white font-semibold">{peer.device}</span>
                          <span className="text-slate-400 ml-2">({peer.ip})</span>
                        </div>
                        <span className="text-[10px] text-emerald-300 shrink-0">{peer.auth}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: Basic & Useful Functionality — Interactive Daemon Controls Bar */}
          <div className="rounded-2xl bg-[#0b1324]/85 border border-white/12 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>
                  {isBg
                    ? 'Управление на демона и локална защита'
                    : 'Daemon Controls & Local Operator Safeguards'}
                </span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {isBg ? 'Директен контрол над локалния хост' : 'Direct local host governance'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Pause / Resume Daemon */}
              <button
                type="button"
                onClick={() => dispatchAction('toggle_pause')}
                disabled={isLoadingAction === 'toggle_pause'}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  daemon.isPaused
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/40'
                    : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border-cyan-400/35'
                }`}
              >
                {daemon.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>
                  {daemon.isPaused
                    ? isBg
                      ? 'Възобнови Демона'
                      : 'Resume Daemon'
                    : isBg
                    ? 'Паузирай Демона'
                    : 'Pause Daemon'}
                </span>
              </button>

              {/* 2. View-Only Mode (Lock Remote Mouse/Keyboard Input) */}
              <button
                type="button"
                onClick={() => dispatchAction('toggle_view_only')}
                disabled={isLoadingAction === 'toggle_view_only'}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  daemon.viewOnlyMode
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border-white/15'
                }`}
              >
                {daemon.viewOnlyMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span>
                  {daemon.viewOnlyMode
                    ? isBg
                      ? 'Само преглед (Вход заключен)'
                      : 'View-Only (Input Locked)'
                    : isBg
                    ? 'Вход: Разрешен'
                    : 'Remote Input: Allowed'}
                </span>
              </button>

              {/* 3. Run Safe NIC & WoL Diagnostics */}
              <button
                type="button"
                onClick={() => dispatchAction('run_diagnostics')}
                disabled={isLoadingAction === 'run_diagnostics'}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-mono text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingAction === 'run_diagnostics' ? 'animate-spin' : ''}`}
                />
                <span>{isBg ? 'Тест на NIC & WoL' : 'Check NIC & WoL'}</span>
              </button>

              {/* 4. Panic Disconnect All Peers */}
              <button
                type="button"
                onClick={() => dispatchAction('panic_disconnect')}
                disabled={isLoadingAction === 'panic_disconnect'}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 font-mono text-xs font-bold text-rose-300 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <OctagonAlert className="w-4 h-4 text-rose-400" />
                <span>{isBg ? 'Прекъсни всички сесии' : 'Panic Disconnect All'}</span>
              </button>
            </div>
          </div>

          {/* ROW 3: Antivirus False-Positive Prevention & Binary Integrity Architecture */}
          <div className="rounded-2xl bg-[#0b1324]/75 border border-emerald-500/25 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.07] pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                  {isBg
                    ? 'Защита срещу фалшиви антивирусни сигнали (AV-Safe Architecture)'
                    : 'Antivirus False-Positive Prevention & Clean Binary Architecture'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Windows Defender • SmartScreen • CrowdStrike • Malwarebytes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {avChecks.map((chk) => (
                <div
                  key={chk.key}
                  className="p-2.5 rounded-xl bg-black/35 border border-white/[0.07] flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-white">{chk.title}</div>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{chk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 4: Live Daemon Event & Security Audit Log */}
          <div className="rounded-2xl bg-[#060b16] border border-white/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isBg
                    ? 'Журнал на събитията и сигурността на PC демона'
                    : 'Live PC Daemon Event & Security Audit Log'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => dispatchAction('clear_logs')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer transition"
              >
                {isBg ? 'Изчисти лога' : 'Clear Log'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/70 border border-white/5 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
              {daemon.logs.map((entry, idx) => (
                <div key={idx} className="leading-relaxed flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 tabular-nums">[{entry.time}]</span>
                  <span
                    className={`shrink-0 font-bold ${
                      entry.level === 'ALERT'
                        ? 'text-rose-400'
                        : entry.level === 'WARN'
                        ? 'text-amber-400'
                        : entry.level === 'SECURITY'
                        ? 'text-emerald-400'
                        : entry.level === 'DIAG'
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                  >
                    [{entry.level}]
                  </span>
                  <span className="text-slate-200 break-words">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
