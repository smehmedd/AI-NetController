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
  ChevronUp,
  Info,
  Copy,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
  Check,
} from 'lucide-react';
import { HostDevice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHapticFeedback } from '../services/hapticService';
import { GlassContainer } from './ui/GlassContainer';
import { HostLatencySparkline } from './HostLatencySparkline';
import { getLatencyConfig, FleetSortMode } from './FleetDashboard';
import { useTranslation, Language } from '../i18n/useTranslation';

export interface HostCardProps {
  host: HostDevice;
  language?: Language;
  isSelected: boolean;
  isExpanded: boolean;
  isQuarantined: boolean;
  isCircuitTripped: boolean;
  sortMode: FleetSortMode;
  remainingWakeSeconds?: number;
  onSelect: (hostId: string) => void;
  onToggleExpand: (hostId: string) => void;
  onInspectWolPacket: (device: HostDevice) => void;
  onViewScreen: (device: HostDevice) => void;
  onSelectForCommand?: (hostId: string) => void;
  onOpenDetailsModal: (device: HostDevice) => void;
  onWakeClick: (e: React.MouseEvent, device: HostDevice) => void;
}

/**
 * Visual styling and iconography for laptop battery state
 */
export const getBatteryConfig = (percentage: number, isCharging?: boolean) => {
  if (isCharging) {
    return {
      icon: BatteryCharging,
      colorText: 'text-amber-300',
      colorBorder: 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      iconColor: 'text-amber-400',
    };
  }
  if (percentage >= 70) {
    return {
      icon: BatteryFull,
      colorText: 'text-emerald-400',
      colorBorder: 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_8px_rgba(52,211,153,0.15)]',
      iconColor: 'text-emerald-400',
    };
  }
  if (percentage >= 30) {
    return {
      icon: BatteryMedium,
      colorText: 'text-cyan-300',
      colorBorder: 'border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
      iconColor: 'text-cyan-400',
    };
  }
  if (percentage >= 15) {
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

/**
 * Subtle, color-coded latency indicator with stepped signal bars and micro value
 */
const HostLatencyIndicator: React.FC<{
  ping?: number;
  isOnline: boolean;
  seedId?: string;
  lang?: Language;
}> = React.memo(({ ping, isOnline, seedId, lang = 'bg' }) => {
  const config = getLatencyConfig(ping, isOnline, seedId, lang);

  return (
    <span
      className="inline-flex items-center space-x-1.5 font-mono text-[10px] sm:text-[11px] cursor-help select-none shrink-0"
      title={config.tooltip}
      aria-label={config.tooltip}
    >
      {/* 3-bar subtle signal meter */}
      <span className="flex items-end space-x-[2px] h-3 px-0.5" aria-hidden="true">
        {config.bars.map((bar, idx) => (
          <span
            key={idx}
            className={`w-[2.5px] rounded-full transition-all duration-300 ${bar.color}`}
            style={{ height: bar.height }}
          />
        ))}
      </span>

      {/* Latency text with subtle color coding */}
      <span className={`${config.colorText} font-medium tracking-tight`}>
        {config.latency !== null ? `${config.latency} ms` : '— ms'}
      </span>
    </span>
  );
});

HostLatencyIndicator.displayName = 'HostLatencyIndicator';

const HostCardComponent: React.FC<HostCardProps> = ({
  host,
  language: propLang,
  isSelected,
  isExpanded,
  isQuarantined,
  isCircuitTripped,
  sortMode,
  remainingWakeSeconds,
  onSelect,
  onToggleExpand,
  onViewScreen,
  onSelectForCommand,
  onOpenDetailsModal,
  onWakeClick,
}) => {
  const { t, language: storeLang } = useTranslation();
  const currentLang = propLang || storeLang;
  const isOffline = !host.isOnline;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (e: React.MouseEvent, text: string, fieldName: string) => {
    e.stopPropagation();
    triggerHapticFeedback('light');
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  let DeviceIcon = Monitor;
  if (
    host.deviceType === 'laptop' ||
    host.id.includes('LAPTOP') ||
    host.id.includes('WORKSTATION')
  ) {
    DeviceIcon = Laptop;
  } else if (
    host.deviceType === 'server' ||
    host.id.includes('SERVER') ||
    host.id.includes('SRV')
  ) {
    DeviceIcon = Server;
  }

  const isLaptop =
    host.deviceType === 'laptop' ||
    host.id.toLowerCase().includes('laptop') ||
    host.tags?.some((t) => t.toLowerCase() === 'laptop' || t.toLowerCase() === 'mobile');
  const batteryConfig = host.batteryPercentage !== undefined ? getBatteryConfig(host.batteryPercentage, host.isCharging) : null;
  const BatteryIcon = batteryConfig?.icon || Battery;

  const latencyConfig = getLatencyConfig(host.ping, host.isOnline, host.id, currentLang);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ scale: 1.012, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.7 }}
    >
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
          w-full rounded-2xl p-4 sm:p-4.5 text-left transition-all duration-150 cursor-pointer select-none
          border bg-[#0a0f1e]/85 backdrop-blur-md
          ${
            isSelected
              ? 'border-cyan-400/40 shadow-[0_0_16px_rgba(0,212,255,0.12)]'
              : 'border-white/[0.08] hover:border-white/[0.16] hover:bg-[#0d1428]/90'
          }
          ${isOffline ? 'opacity-85' : ''}
        `}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Column: Device Icon & Metadata */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors
                ${
                  isOffline
                    ? 'bg-white/[0.02] text-white/35 border-white/[0.06]'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }
              `}
            >
              <DeviceIcon className="w-5 h-5" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                  {host.name}
                </span>
                {isQuarantined && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-mono font-semibold border border-rose-500/30 shrink-0">
                    {t('host_quarantined')}
                  </span>
                )}
                {isCircuitTripped && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-mono font-semibold border border-amber-500/30 shrink-0">
                    {t('host_circuit_tripped')}
                  </span>
                )}
                {isSelected && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono font-medium border border-cyan-500/20 shrink-0">
                    {t('host_selected')}
                  </span>
                )}
              </div>

              {/* Pill-Shaped Metadata Capsules */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-white/50 mt-1.5 tabular-nums">
                <span className="font-mono text-cyan-300 text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 truncate">
                  {host.ip}
                </span>

                <span
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                    host.isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/[0.03] text-white/40 border-white/10'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      host.isOnline
                        ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                        : 'bg-white/30'
                    }`}
                  />
                  <span>{host.isOnline ? t('host_online_mdns') : t('host_sleeping_status')}</span>
                </span>

                <div
                  className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                    latencyConfig.colorBg
                  } ${latencyConfig.colorBorder}`}
                >
                  <HostLatencyIndicator ping={host.ping} isOnline={host.isOnline} seedId={host.id} lang={currentLang} />
                </div>

                {/* Laptop Battery Pill Indicator */}
                {isLaptop && host.batteryPercentage !== undefined && batteryConfig && (
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums border ${batteryConfig.colorBorder} ${batteryConfig.colorText}`}
                    title={`Battery: ${host.batteryPercentage}%${host.isCharging ? ' (Charging)' : ''}`}
                  >
                    <BatteryIcon className="w-3.5 h-3.5" />
                    <span>{host.batteryPercentage}%</span>
                    {host.isCharging && <Zap className="w-2.5 h-2.5 text-amber-300 fill-current animate-pulse -ml-0.5" />}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pill Action Controls */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {isOffline ? (
              remainingWakeSeconds !== undefined ? (
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center text-amber-300 text-[10px] font-mono font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 mb-0.5" />
                  <span>{remainingWakeSeconds}s</span>
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.12, y: -1 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={(e) => onWakeClick(e, host)}
                  className="w-9 h-9 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 flex items-center justify-center transition-colors cursor-pointer shadow-xs bubble-tap"
                  title={t('host_wake_tooltip')}
                  aria-label={t('host_wake_tooltip')}
                >
                  <Power className="w-4 h-4 stroke-[2.2]" />
                </motion.button>
              )
            ) : (
              <>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.12, y: -1 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback('light');
                    onSelectForCommand?.(host.id);
                  }}
                  className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer bubble-tap"
                  title={t('host_terminal_tooltip')}
                  aria-label={t('host_terminal_tooltip')}
                >
                  <Terminal className="w-4 h-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.12, y: -1 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback('light');
                    onViewScreen(host);
                  }}
                  className="w-9 h-9 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 flex items-center justify-center transition-colors cursor-pointer bubble-tap"
                  title={t('host_screen_tooltip')}
                  aria-label={t('host_screen_tooltip')}
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Spec Strip inside Card: Pill Badges & Unified Stats */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-y-2 gap-x-3 text-xs text-white/50">
          <div className="flex items-center space-x-2 font-mono text-[11px] truncate min-w-0">
            <span className="truncate">{host.mac}</span>
            {host.tags && host.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {host.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-cyan-300/90 text-[10px] font-mono shrink-0"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 font-mono text-[11px] shrink-0 tabular-nums">
            {host.isOnline && (
              <div className="flex items-center space-x-2 text-white/50">
                <span>CPU <strong className="text-white/80 font-medium">{host.cpuUsage ?? 15}%</strong></span>
                <span className="text-white/20">·</span>
                <span>RAM <strong className="text-white/80 font-medium">{host.ramUsage ?? 40}%</strong></span>
              </div>
            )}

            {/* Toggle Host Details Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(host.id);
              }}
              aria-expanded={isExpanded}
              className={`h-7 px-3 rounded-full text-[11px] font-medium transition-colors flex items-center space-x-1 cursor-pointer border ${
                isExpanded
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border-white/10'
              }`}
              title={isExpanded ? t('host_hide_details_btn') : t('host_details_btn')}
            >
              <span>{isExpanded ? t('host_hide_details_btn') : t('host_details_btn')}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Host Details with Bouncy Elastic Expansion & 30-Second Latency Sparkline */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 480, damping: 24, mass: 0.6 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-3">
                {/* Sparkline Chart for Last 30 Seconds */}
                <HostLatencySparkline
                  history={host.latencyHistory}
                  currentPing={host.ping}
                  isOnline={host.isOnline}
                  hostId={host.id}
                  hostName={host.name}
                  timeWindowSeconds={30}
                  showSummaryStats={true}
                  showTimeAxis={true}
                />

                {/* Minimalist Hairline Divider Grid for Hardware Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/[0.08] rounded-xl overflow-hidden border border-white/[0.08] text-xs font-mono tabular-nums">
                  <div className="bg-[#080d1a] p-2.5 space-y-0.5">
                    <span className="text-white/40 text-[10px] block font-medium uppercase">{t('host_ip_label')}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">{host.ip}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyText(e, host.ip, 'ip')}
                        className="text-white/40 hover:text-white transition p-0.5 cursor-pointer bubble-tap"
                        title={t('host_copy_ip')}
                      >
                        {copiedField === 'ip' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#080d1a] p-2.5 space-y-0.5">
                    <span className="text-white/40 text-[10px] block font-medium uppercase">{t('host_mac_label')}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium truncate block">{host.mac}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyText(e, host.mac, 'mac')}
                        className="text-white/40 hover:text-white transition p-0.5 cursor-pointer bubble-tap"
                        title="Copy MAC address"
                      >
                        {copiedField === 'mac' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#080d1a] p-2.5 space-y-0.5">
                    <span className="text-white/40 text-[10px] block font-medium uppercase">{t('host_port_label')}</span>
                    <span className="text-emerald-400 font-bold block">{host.port || 8765} (TCP/WS)</span>
                  </div>

                  <div className="bg-[#080d1a] p-2.5 space-y-0.5">
                    <span className="text-white/40 text-[10px] block font-medium uppercase">{t('host_os_label')}</span>
                    <span className="text-white/90 font-medium block truncate">
                      {host.os === 'windows' ? 'Windows 11 Pro' : 'Linux Kernel 6.8'}
                    </span>
                  </div>

                  <div className="bg-[#080d1a] p-2.5 space-y-0.5">
                    <span className="text-white/40 text-[10px] block font-medium uppercase">{t('host_disk_label')}</span>
                    <span className="text-white/80 font-medium truncate block">
                      {host.diskUsage || '342 GB / 1000 GB'}
                    </span>
                  </div>

                  <div className="bg-[#080d1a] p-2.5 space-y-0.5">
                    <span className="text-white/40 text-[10px] block font-medium uppercase">{t('host_session_label')}</span>
                    <span className={`font-bold block truncate ${host.isOnline ? 'text-emerald-400' : 'text-white/40'}`}>
                      {host.isOnline ? 'Active (mDNS)' : t('host_sleeping_status')}
                    </span>
                  </div>

                  {/* Laptop Battery Telemetry in Hardware Matrix */}
                  {isLaptop && host.batteryPercentage !== undefined && batteryConfig && (
                    <div className="bg-[#080d1a] p-2.5 space-y-0.5 col-span-2 sm:col-span-3 border-t border-white/[0.06]">
                      <span className="text-white/40 text-[10px] block font-medium uppercase">BATTERY TELEMETRY</span>
                      <div className="flex items-center space-x-2">
                        <BatteryIcon className={`w-3.5 h-3.5 ${batteryConfig.iconColor}`} />
                        <span className={`font-bold ${batteryConfig.colorText}`}>
                          {host.batteryPercentage}%
                        </span>
                        <span className="text-[10px] text-white/50">
                          {host.isCharging ? '(Charging / AC)' : '(On Battery / DC)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Controls Bar inside Details */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHapticFeedback('light');
                      onOpenDetailsModal(host);
                    }}
                    className="h-8 px-3.5 rounded-full text-xs font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors flex items-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('host_full_dialog_btn')}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {host.isOnline ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback('medium');
                            onViewScreen(host);
                          }}
                          className="h-8 px-3.5 rounded-full text-xs font-medium text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 transition-colors flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('host_screen_btn')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback('medium');
                            onSelectForCommand?.(host.id);
                          }}
                          className="h-8 px-3.5 rounded-full text-xs font-medium text-white bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/40 transition-colors flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <Terminal className="w-3.5 h-3.5 text-cyan-300" />
                          <span>{t('host_terminal_btn')}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWakeClick(e, host);
                        }}
                        className="h-8 px-4 rounded-full text-xs font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 transition-colors flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{t('host_wake_btn')}</span>
                      </button>
                    )}
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
    prev.isQuarantined === next.isQuarantined &&
    prev.isCircuitTripped === next.isCircuitTripped &&
    prev.sortMode === next.sortMode &&
    prev.remainingWakeSeconds === next.remainingWakeSeconds &&
    prev.language === next.language &&
    prev.host.latencyHistory === next.host.latencyHistory
  );
});
