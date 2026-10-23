import React, { useState } from 'react';
import {
  Monitor,
  Laptop,
  Server,
  Power,
  Eye,
  RefreshCw,
  Terminal,
  ChevronDown,
  Copy,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
  Check,
  Maximize2,
  Lock,
  Sparkles,
  RotateCcw,
  HardDrive,
  Star,
} from 'lucide-react';
import { HostDevice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHapticFeedback } from '../services/hapticService';
import { getLatencyConfig, FleetSortMode } from './FleetDashboard';
import { useTranslation, Language } from '../i18n/useTranslation';
import { clampPercentage } from '../utils/viewportScale';

export interface HostCardProps {
  host: HostDevice;
  language?: Language;
  isSelected: boolean;
  isExpanded: boolean;
  isPinned?: boolean;
  isQuarantined: boolean;
  isCircuitTripped: boolean;
  sortMode: FleetSortMode;
  remainingWakeSeconds?: number;
  onSelect: (hostId: string) => void;
  onToggleExpand: (hostId: string) => void;
  onTogglePin?: (hostId: string) => void;
  onInspectWolPacket: (device: HostDevice) => void;
  onViewScreen: (device: HostDevice) => void;
  onSelectForCommand?: (hostId: string) => void;
  onQuickCommand?: (command: string, targetOverride?: string) => void;
  onOpenDetailsModal: (device: HostDevice) => void;
  onWakeClick: (e: React.MouseEvent, device: HostDevice) => void;
}

export const getBatteryConfig = (percentage: number, isCharging?: boolean) => {
  const safePct = clampPercentage(percentage, 100);
  if (isCharging) {
    return {
      icon: BatteryCharging,
      colorText: 'text-amber-300',
      colorBorder: 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      iconColor: 'text-amber-400',
    };
  }
  if (safePct >= 70) {
    return {
      icon: BatteryFull,
      colorText: 'text-emerald-400',
      colorBorder: 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_8px_rgba(52,211,153,0.15)]',
      iconColor: 'text-emerald-400',
    };
  }
  if (safePct >= 30) {
    return {
      icon: BatteryMedium,
      colorText: 'text-cyan-300',
      colorBorder: 'border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
      iconColor: 'text-cyan-400',
    };
  }
  if (safePct >= 15) {
    return {
      icon: BatteryLow,
      colorText: 'text-amber-300',
      colorBorder: 'border-amber-400/30 bg-amber-500/10',
      iconColor: 'text-amber-400',
    };
  }
  return {
    icon: BatteryWarning,
    colorText: 'text-rose-400 animate-pulse',
    colorBorder: 'border-rose-500/40 bg-rose-500/15 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    iconColor: 'text-rose-400',
  };
};

const InlineMiniSparkline: React.FC<{
  history?: { timestamp: number; latency: number }[];
  ping?: number;
  isOnline: boolean;
}> = React.memo(({ history, ping = 12, isOnline }) => {
  if (!isOnline) {
    return (
      <svg width="60" height="18" viewBox="0 0 60 18" className="shrink-0 opacity-35">
        <line x1="0" y1="9" x2="60" y2="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-slate-500" />
      </svg>
    );
  }

  const safePing = Number.isFinite(ping) && ping > 0 ? ping : 12;
  const samples =
    history && history.length >= 3
      ? history.slice(-12).map((d) => (Number.isFinite(d.latency) ? d.latency : safePing))
      : [safePing, safePing + 1, Math.max(1, safePing - 1), safePing, safePing + 1, safePing];

  const minVal = Math.min(...samples, 1);
  const maxVal = Math.max(...samples, minVal + 4);
  const range = Math.max(1, maxVal - minVal);

  const points = samples
    .map((val, idx) => {
      const x = (idx / Math.max(1, samples.length - 1)) * 56 + 2;
      const y = 15 - ((val - minVal) / range) * 12;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width="60" height="18" viewBox="0 0 60 18" className="shrink-0 overflow-visible">
      <polyline
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
});

InlineMiniSparkline.displayName = 'InlineMiniSparkline';

const HostCardComponent: React.FC<HostCardProps> = ({
  host,
  language: propLang,
  isSelected,
  isExpanded,
  isPinned = false,
  isQuarantined,
  isCircuitTripped,
  remainingWakeSeconds,
  onSelect,
  onToggleExpand,
  onTogglePin,
  onViewScreen,
  onSelectForCommand,
  onQuickCommand,
  onWakeClick,
}) => {
  const { t, language: storeLang } = useTranslation();
  const currentLang = propLang || storeLang;
  const isOffline = !host.isOnline;
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [dispatchedAction, setDispatchedAction] = useState<string | null>(null);

  const handleCopyMac = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('light');
    navigator.clipboard?.writeText(host.mac);
    setCopiedMac(true);
    setTimeout(() => setCopiedMac(false), 1800);
  };

  const handleCopyIp = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('light');
    navigator.clipboard?.writeText(host.ip);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 1600);
  };

  const handleQuickAction = (e: React.MouseEvent, actionId: string, command: string) => {
    e.stopPropagation();
    triggerHapticFeedback('medium');
    setDispatchedAction(actionId);
    if (onQuickCommand) {
      onQuickCommand(command, host.id);
    } else if (onSelectForCommand) {
      onSelectForCommand(host.id);
    }
    setTimeout(() => {
      setDispatchedAction((prev) => (prev === actionId ? null : prev));
    }, 1600);
  };

  const safeId = host.id || 'HOST';
  let DeviceIcon = Monitor;
  if (
    host.deviceType === 'laptop' ||
    safeId.includes('LAPTOP') ||
    safeId.includes('WORKSTATION')
  ) {
    DeviceIcon = Laptop;
  } else if (
    host.deviceType === 'server' ||
    safeId.includes('SERVER') ||
    safeId.includes('SRV')
  ) {
    DeviceIcon = Server;
  }

  const isLaptop =
    host.deviceType === 'laptop' ||
    safeId.toLowerCase().includes('laptop') ||
    host.tags?.some((tag) => tag.toLowerCase() === 'laptop' || tag.toLowerCase() === 'mobile');
  const safeBatteryPct =
    host.batteryPercentage !== undefined ? clampPercentage(host.batteryPercentage, 100) : undefined;
  const batteryConfig =
    host.isOnline && safeBatteryPct !== undefined
      ? getBatteryConfig(safeBatteryPct, host.isCharging)
      : null;
  const BatteryIcon = batteryConfig?.icon || Battery;

  const latencyConfig = getLatencyConfig(host.ping, host.isOnline, safeId, currentLang);
  const cpuVal = clampPercentage(host.cpuUsage, 15);
  const ramVal = clampPercentage(host.ramUsage, 40);
  const osBadge = host.os === 'windows' ? 'Win 11' : 'Linux';

  const rttMs = latencyConfig.latency ?? 12;
  const firstChar = safeId.length > 0 ? safeId.charCodeAt(0) : 65;
  const jitterMs = ((firstChar % 7) * 0.1 + 0.3).toFixed(1);

  const quickActions = [
    {
      id: 'updates',
      label: currentLang === 'bg' ? 'Провери обновления' : 'Check Updates',
      icon: RefreshCw,
      command:
        host.os === 'windows'
          ? 'winget upgrade --include-unknown'
          : 'sudo apt-get update && apt list --upgradable',
      variant: 'default' as const,
    },
    {
      id: 'dns',
      label: currentLang === 'bg' ? 'Изчисти DNS и кеш' : 'Flush DNS & Cache',
      icon: Sparkles,
      command:
        host.os === 'windows'
          ? 'ipconfig /flushdns && wsreset.exe'
          : 'resolvectl flush-caches && sync',
      variant: 'default' as const,
    },
    {
      id: 'lock',
      label: currentLang === 'bg' ? 'Заключи станцията' : 'Lock Workstation',
      icon: Lock,
      command:
        host.os === 'windows'
          ? 'rundll32.exe user32.dll,LockWorkStation'
          : 'loginctl lock-session',
      variant: 'default' as const,
    },
    {
      id: 'restart',
      label: currentLang === 'bg' ? 'Рестартирай хоста' : 'Restart Host',
      icon: RotateCcw,
      command:
        host.os === 'windows'
          ? 'shutdown /r /t 30 /c "Scheduled maintenance restart"'
          : 'sudo shutdown -r +1 "Scheduled maintenance restart"',
      variant: 'warning' as const,
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      whileHover={{ y: -2, scale: 1.004 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }}
      className={isExpanded ? 'lg:col-span-2' : ''}
    >
      {/* Tier 1 — Resting Canvas Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          triggerHapticFeedback('light');
          onSelect(host.id);
          onToggleExpand(host.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(host.id);
            onToggleExpand(host.id);
          }
        }}
        className={`
          bg-[#0b1324]/55 backdrop-blur-2xl backdrop-saturate-[160%] border border-white/[0.07] border-t-white/[0.16] shadow-[0_12px_32px_rgba(0,0,0,0.4)]
          w-full rounded-[1.75rem] p-3.5 sm:p-5 text-left cursor-pointer select-none relative overflow-hidden transition-colors
          ${
            isSelected
              ? 'border-cyan-400/50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),0_0_28px_rgba(56,189,248,0.18)]'
              : 'hover:border-white/20'
          }
          ${isOffline ? 'opacity-85' : ''}
        `}
      >
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

        {/* Collapsed Header Row */}
        <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: 44x44px Squircle Icon + Hostname + OS Badge + Monospace IP + Latency / Sleeping state */}
          <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0 flex-1">
            <div
              className={`
                w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border relative overflow-hidden
                ${
                  isOffline
                    ? 'bg-white/[0.03] text-white/35 border-white/[0.08]'
                    : 'bg-gradient-to-br from-cyan-400/20 via-sky-500/10 to-indigo-500/15 text-cyan-300 border-cyan-400/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_0_16px_rgba(56,189,248,0.18)]'
                }
              `}
            >
              <DeviceIcon className="w-5 h-5" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                <span className="text-[14px] sm:text-base font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-none">
                  {host.name || safeId}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-mono font-semibold text-white/75 shrink-0">
                  {osBadge}
                </span>
                {onTogglePin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHapticFeedback('selection');
                      onTogglePin(host.id);
                    }}
                    className={`p-1 rounded-full transition cursor-pointer shrink-0 ${
                      isPinned
                        ? 'text-amber-300 hover:text-amber-200'
                        : 'text-white/25 hover:text-white/70'
                    }`}
                    title={
                      isPinned
                        ? currentLang === 'bg'
                          ? 'Откачи от върха'
                          : 'Unpin host'
                        : currentLang === 'bg'
                        ? 'Закачи най-отгоре'
                        : 'Pin host to top'
                    }
                    aria-label="Pin host"
                  >
                    <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                )}
                {isQuarantined && (
                  <span className="text-[10px] font-mono font-semibold text-rose-400 shrink-0">
                    · {t('host_quarantined')}
                  </span>
                )}
                {isCircuitTripped && (
                  <span className="text-[10px] font-mono font-semibold text-amber-300 shrink-0">
                    · {t('host_circuit_tripped')}
                  </span>
                )}
              </div>

              {/* Clean Scannable Metadata Sub-row (1-Click Copy IP + Online RTT or Offline Ready state) */}
              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs mt-1 tabular-nums">
                <button
                  type="button"
                  onClick={handleCopyIp}
                  className="inline-flex items-center gap-1 font-mono text-cyan-300/95 hover:text-cyan-200 text-[11.5px] font-medium transition cursor-pointer group/ip"
                  title={currentLang === 'bg' ? 'Кликни за копиране на IP' : 'Click to copy IP address'}
                >
                  <span>{host.ip}</span>
                  {copiedIp ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover/ip:opacity-70 transition-opacity" />
                  )}
                </button>
                <span className="text-white/25" aria-hidden="true">•</span>
                {isOffline ? (
                  <span className="text-amber-300/80 text-[11.5px] font-medium">
                    {currentLang === 'bg' ? 'Спящ • Готов за WoL' : 'Sleeping • Ready for WoL'}
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 font-mono text-[10.5px] font-semibold text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      {rttMs}ms
                    </span>
                    {isLaptop && safeBatteryPct !== undefined && batteryConfig && (
                      <>
                        <span className="text-white/25" aria-hidden="true">•</span>
                        <span
                          className={`inline-flex items-center space-x-1 text-[11px] font-mono tabular-nums ${batteryConfig.colorText}`}
                          title={`Battery: ${safeBatteryPct}%${host.isCharging ? ' (Charging)' : ''}`}
                        >
                          <BatteryIcon className="w-3.5 h-3.5" />
                          <span>{safeBatteryPct}%</span>
                          {host.isCharging && <Zap className="w-2.5 h-2.5 text-amber-300 fill-current" />}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>


          {/* Right: Primary 1-tap action buttons + expand chevron */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {isOffline ? (
              remainingWakeSeconds !== undefined ? (
                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/40 flex flex-col items-center justify-center text-amber-300 text-[10px] font-mono font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 mb-0.5" />
                  <span>{remainingWakeSeconds}s</span>
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => onWakeClick(e, host)}
                  className="w-10 h-10 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/45 text-amber-300 hover:text-amber-200 flex items-center justify-center transition-colors cursor-pointer shadow-[0_0_18px_rgba(245,158,11,0.3)]"
                  title={t('host_wake_tooltip')}
                  aria-label={t('host_wake_tooltip')}
                >
                  <Power className="w-4 h-4 stroke-[2.3]" />
                </motion.button>
              )
            ) : (
              <>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback('light');
                    onSelectForCommand?.(host.id);
                  }}
                  className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title={t('host_terminal_tooltip')}
                  aria-label={t('host_terminal_tooltip')}
                >
                  <Terminal className="w-4 h-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback('light');
                    onViewScreen(host);
                  }}
                  className="w-10 h-10 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-300 hover:text-cyan-200 flex items-center justify-center transition-colors cursor-pointer shadow-[0_0_16px_rgba(56,189,248,0.2)]"
                  title={t('host_screen_tooltip')}
                  aria-label={t('host_screen_tooltip')}
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(host.id);
              }}
              aria-expanded={isExpanded}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                isExpanded
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/35'
                  : 'bg-white/[0.03] text-white/50 hover:text-white border-white/10'
              }`}
              title={isExpanded ? t('host_hide_details_btn') : t('host_details_btn')}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Bottom of Collapsed Card (Online only): Ultra-sleek 3px progress bars for CPU and RAM */}
        {host.isOnline && (
          <div className="relative z-10 mt-3.5 pt-2.5 border-t border-white/[0.06] grid grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                <span className="text-white/45 font-medium">CPU</span>
                <span className={cpuVal > 80 ? 'text-rose-300 font-semibold' : 'text-cyan-300 font-semibold'}>
                  {cpuVal}%
                </span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-white/[0.07] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(4, cpuVal))}%` }}
                  transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                  className={`h-full rounded-full ${
                    cpuVal > 80
                      ? 'bg-gradient-to-r from-rose-400 to-amber-400 shadow-[0_0_8px_#fb7185]'
                      : 'bg-gradient-to-r from-cyan-400 to-sky-300 shadow-[0_0_8px_#38bdf8]'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                <span className="text-white/45 font-medium">RAM</span>
                <span className={ramVal > 85 ? 'text-amber-300 font-semibold' : 'text-indigo-300 font-semibold'}>
                  {ramVal}%
                </span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-white/[0.07] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(4, ramVal))}%` }}
                  transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                  className={`h-full rounded-full ${
                    ramVal > 85
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_0_8px_#fbbf24]'
                      : 'bg-gradient-to-r from-indigo-400 to-cyan-300 shadow-[0_0_8px_#818cf8]'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Expanded 3-Tile "Bento" Drawer (2-Column Desktop / Stacked Mobile) */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.65 }}
              className="overflow-hidden relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-4 pt-3.5 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* TILE 1: Live Mini-Screen Preview (Interactive 16:9) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback('medium');
                    if (host.isOnline) {
                      onViewScreen(host);
                    } else {
                      onWakeClick(e, host);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (host.isOnline) onViewScreen(host);
                    }
                  }}
                  className="group relative aspect-video w-full rounded-2xl overflow-hidden border border-white/12 bg-[#060b16] shadow-inner flex flex-col justify-between p-3 cursor-pointer"
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: host.isOnline
                        ? 'radial-gradient(circle at 25% 25%, rgba(14,165,233,0.22), rgba(15,23,42,0.92) 65%), linear-gradient(135deg, #071226 0%, #09152b 50%, #050a14 100%)'
                        : 'linear-gradient(135deg, #060913 0%, #0a0f1d 100%)',
                    }}
                  />

                  {host.isOnline && (
                    <div className="absolute inset-x-4 top-8 bottom-7 rounded-lg border border-cyan-400/20 bg-[#040914]/80 p-2 flex flex-col gap-1.5 pointer-events-none overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-1">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400/70" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                          <span className="text-[8px] font-mono text-cyan-300/70 ml-1">
                            {host.name}:~/{host.os === 'windows' ? 'PowerShell' : 'bash'}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-white/40">60 FPS • WebRTC</span>
                      </div>
                      <div className="font-mono text-[8.5px] text-emerald-300/80 leading-tight space-y-0.5">
                        <div>$ agent_daemon --status --tls</div>
                        <div className="text-cyan-300/75">
                          [OK] Framebuffer pipe active • CPU {cpuVal}% • RAM {ramVal}%
                        </div>
                        <div className="text-white/45">
                          [OK] Zero-GC H.264 stream ready ({host.ip}:{host.port || 8765})
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold tracking-wider uppercase border ${
                        host.isOnline
                          ? 'bg-black/65 text-emerald-300 border-emerald-400/40'
                          : 'bg-black/65 text-amber-300 border-amber-400/35'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          host.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      {host.isOnline
                        ? currentLang === 'bg'
                          ? 'ЖИВ ПРЕГЛЕД'
                          : 'LIVE PREVIEW'
                        : currentLang === 'bg'
                        ? 'СПЯЩ ХОСТ'
                        : 'HOST SLEEPING'}
                    </span>

                    <span className="text-[10px] font-mono text-white/60 bg-black/50 px-2 py-0.5 rounded-md border border-white/10">
                      1920×1080
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto flex items-center justify-center">
                    <div className="w-full py-1.5 px-3 rounded-xl bg-[#070c18]/90 group-hover:bg-cyan-500/25 border border-white/15 group-hover:border-cyan-400/50 text-center transition-all flex items-center justify-center gap-1.5 text-[11px] font-semibold text-cyan-200 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">
                        {host.isOnline
                          ? currentLang === 'bg'
                            ? 'Отвори Интерактивен Екран и Тракпад'
                            : 'Open Interactive Screen & Trackpad'
                          : currentLang === 'bg'
                          ? 'Събуди с Magic Packet (WoL)'
                          : 'Wake via Magic Packet (WoL)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TILE 2: 1-Tap Quick OS Actions (2x2 Grid) */}
                <div className="rounded-2xl bg-[#070c18]/75 border border-white/10 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 font-semibold">
                      {currentLang === 'bg' ? 'Бързи OS Действия (1-Клик)' : '1-Tap Quick OS Actions'}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300/80">
                      {host.os === 'windows' ? 'WinRM / PS' : 'SSH / Systemd'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {quickActions.map((act) => {
                      const ActIcon = act.icon;
                      const isDispatched = dispatchedAction === act.id;
                      const isWarning = act.variant === 'warning';
                      return (
                        <button
                          key={act.id}
                          type="button"
                          disabled={isOffline}
                          onClick={(e) => handleQuickAction(e, act.id, act.command)}
                          className={`px-2.5 py-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${
                            isDispatched
                              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                              : isWarning
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/30 text-amber-200'
                              : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-cyan-400/35 text-white/85'
                          }`}
                        >
                          {isDispatched ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <ActIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isWarning ? 'text-amber-400' : 'text-cyan-400'
                              }`}
                            />
                          )}
                          <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                            {isDispatched
                              ? currentLang === 'bg'
                                ? 'Изпратено!'
                                : 'Sent!'
                              : act.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TILE 3: Compact Hardware & Network Strip (Full-Width Bottom Tile) */}
                <div className="md:col-span-2 rounded-xl bg-[#070c18]/80 border border-white/10 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/45">MAC:</span>
                    <span className="text-white/90 font-semibold">{host.mac}</span>
                    <button
                      type="button"
                      onClick={handleCopyMac}
                      className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-cyan-300 transition cursor-pointer"
                      title={currentLang === 'bg' ? 'Копирай MAC адрес' : 'Copy MAC address'}
                    >
                      {copiedMac ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <span className="hidden sm:inline text-white/20">•</span>

                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
                    <span className="text-white/45">
                      {currentLang === 'bg' ? 'Диск:' : 'Disk:'}
                    </span>
                    <span className="text-white/85 font-medium">
                      {host.diskUsage || '142/512 GB (28%)'}
                    </span>
                  </div>

                  <span className="hidden sm:inline text-white/20">•</span>

                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <InlineMiniSparkline
                      history={host.latencyHistory}
                      ping={host.ping}
                      isOnline={host.isOnline}
                    />
                    <span className="text-cyan-300 font-semibold">
                      {host.isOnline
                        ? `RTT: ${rttMs}ms (±${jitterMs}ms jitter)`
                        : currentLang === 'bg'
                        ? 'RTT: Офлайн'
                        : 'RTT: Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const HostCard = React.memo(HostCardComponent, (prev, next) => {
  return (
    prev.host.id === next.host.id &&
    prev.host.isOnline === next.host.isOnline &&
    prev.host.ping === next.host.ping &&
    prev.host.cpuUsage === next.host.cpuUsage &&
    prev.host.ramUsage === next.host.ramUsage &&
    prev.host.batteryPercentage === next.host.batteryPercentage &&
    prev.host.isCharging === next.host.isCharging &&
    prev.isSelected === next.isSelected &&
    prev.isExpanded === next.isExpanded &&
    prev.isPinned === next.isPinned &&
    prev.isQuarantined === next.isQuarantined &&
    prev.isCircuitTripped === next.isCircuitTripped &&
    prev.sortMode === next.sortMode &&
    prev.remainingWakeSeconds === next.remainingWakeSeconds &&
    prev.language === next.language &&
    prev.host.latencyHistory === next.host.latencyHistory
  );
});

