import React, { useState, useCallback, useEffect, useMemo, useDeferredValue, useRef } from 'react';
import {
  Monitor,
  Power,
  Plus,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Terminal,
  Wifi,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  ShieldAlert,
  OctagonAlert,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Activity,
  Gauge,
  LayoutGrid,
  Network,
} from 'lucide-react';
import { HostDevice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHapticFeedback } from '../services/hapticService';
import { GlassContainer } from './ui/GlassContainer';
import { useUIStore } from '../store/uiStore';
import { HostCard } from './HostCard';
import { useTranslation, Language } from '../i18n/useTranslation';
import { LanguageToggle } from './ui/LanguageToggle';

const LazyNetworkTopologyGraph = React.lazy(() =>
  import('./NetworkTopologyGraph').then((module) => ({
    default: module.NetworkTopologyGraph,
  }))
);

export type FleetSortMode = 'alphabetical' | 'status' | 'latency';
export type FleetSortDirection = 'asc' | 'desc';

interface FleetDashboardProps {
  hosts: HostDevice[];
  selectedHostId?: string;
  selectedTarget?: string;
  quarantinedHosts?: string[];
  circuitTrippedHosts?: string[];
  onPanicKill?: () => void;
  onSelectHost?: (hostId: string) => void;
  onSelectHostForCommand?: (hostId: string) => void;
  onInspectWolPacket: (device: HostDevice) => void;
  onSendWol?: (device: HostDevice) => void;
  onViewScreen: (device: HostDevice) => void;
  onOpenAddHostModal?: () => void;
  onAddNewHost?: () => void;
  onRescan?: () => void;
  isScanning?: boolean;
  isNetworkDisconnected?: boolean;
  onReconnectNetwork?: () => void;
}

const latencyConfigCache = new Map<string, any>();

/**
 * Calculates color-coded network latency telemetry and visual bar levels with O(1) memoization
 */
export function getLatencyConfig(
  ping?: number,
  isOnline?: boolean,
  seedId: string = 'host',
  lang: Language = 'bg'
) {
  const cacheKey = `${ping ?? -1}_${isOnline ? 1 : 0}_${seedId}_${lang}`;
  const cached = latencyConfigCache.get(cacheKey);
  if (cached) return cached;

  let result;
  if (!isOnline) {
    result = {
      latency: null,
      level: 'offline' as const,
      label: lang === 'bg' ? 'Спящ режим (N/A)' : 'Sleeping (N/A)',
      tooltip:
        lang === 'bg'
          ? 'Устройството е в спящ режим — няма активна телеметрия'
          : 'Host is sleeping — no active RTT telemetry',
      colorDot: 'bg-white/20',
      colorText: 'text-white/40',
      colorBg: 'bg-white/[0.04]',
      colorBorder: 'border-white/10',
      bars: [
        { active: false, height: '4px', color: 'bg-white/20' },
        { active: false, height: '7px', color: 'bg-white/20' },
        { active: false, height: '10px', color: 'bg-white/20' },
      ],
    };
  } else {
    // Fast deterministic hash without splitting strings
    let seedVal = 0;
    for (let i = 0; i < seedId.length; i++) {
      seedVal = (seedVal + seedId.charCodeAt(i)) | 0;
    }
    const latency = typeof ping === 'number' ? ping : ((seedVal % 12) + 3);

    if (latency <= 20) {
      result = {
        latency,
        level: 'optimal' as const,
        label: lang === 'bg' ? 'Отлично закъснение (<20ms)' : 'Optimal latency (<20ms)',
        tooltip:
          lang === 'bg'
            ? `Мрежова латентност (RTT): ${latency} ms • Отлична реакция на връзката (GbE LAN)`
            : `Network latency (RTT): ${latency} ms • Excellent connection response (GbE LAN)`,
        colorDot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
        colorText: 'text-emerald-400',
        colorBg: 'bg-emerald-500/10',
        colorBorder: 'border-emerald-500/30',
        bars: [
          { active: true, height: '4px', color: 'bg-emerald-400' },
          { active: true, height: '7px', color: 'bg-emerald-400' },
          { active: true, height: '10px', color: 'bg-emerald-400' },
        ],
      };
    } else if (latency <= 60) {
      result = {
        latency,
        level: 'good' as const,
        label: lang === 'bg' ? 'Добро закъснение (20-60ms)' : 'Good latency (20-60ms)',
        tooltip:
          lang === 'bg'
            ? `Мрежова латентност (RTT): ${latency} ms • Стабилна и бърза мрежова връзка`
            : `Network latency (RTT): ${latency} ms • Stable and responsive connection`,
        colorDot: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
        colorText: 'text-cyan-300',
        colorBg: 'bg-cyan-500/10',
        colorBorder: 'border-cyan-500/30',
        bars: [
          { active: true, height: '4px', color: 'bg-cyan-400' },
          { active: true, height: '7px', color: 'bg-cyan-400' },
          { active: true, height: '10px', color: 'bg-cyan-400/50' },
        ],
      };
    } else if (latency <= 120) {
      result = {
        latency,
        level: 'moderate' as const,
        label: lang === 'bg' ? 'Умерено закъснение (60-120ms)' : 'Moderate latency (60-120ms)',
        tooltip:
          lang === 'bg'
            ? `Мрежова латентност (RTT): ${latency} ms • Възможно е слабо забавяне при стрийминг`
            : `Network latency (RTT): ${latency} ms • Possible slight stream delay`,
        colorDot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
        colorText: 'text-amber-300',
        colorBg: 'bg-amber-500/10',
        colorBorder: 'border-amber-500/30',
        bars: [
          { active: true, height: '4px', color: 'bg-amber-400' },
          { active: true, height: '7px', color: 'bg-amber-400' },
          { active: false, height: '10px', color: 'bg-white/20' },
        ],
      };
    } else {
      result = {
        latency,
        level: 'high' as const,
        label: lang === 'bg' ? 'Високо закъснение (>120ms)' : 'High latency (>120ms)',
        tooltip:
          lang === 'bg'
            ? `Мрежова латентност (RTT): ${latency} ms • Високо закъснение / натоварена мрежа`
            : `Network latency (RTT): ${latency} ms • High latency / congested route`,
        colorDot: 'bg-rose-400 shadow-[0_0_8px_#f43f5e]',
        colorText: 'text-rose-400',
        colorBg: 'bg-rose-500/10',
        colorBorder: 'border-rose-500/30',
        bars: [
          { active: true, height: '4px', color: 'bg-rose-400' },
          { active: false, height: '7px', color: 'bg-white/20' },
          { active: false, height: '10px', color: 'bg-white/20' },
        ],
      };
    }
  }

  if (latencyConfigCache.size > 100) {
    latencyConfigCache.clear();
  }
  latencyConfigCache.set(cacheKey, result);
  return result;
}

const FleetDashboardComponent: React.FC<FleetDashboardProps> = ({
  hosts,
  selectedHostId,
  selectedTarget,
  quarantinedHosts = [],
  circuitTrippedHosts = [],
  onPanicKill,
  onSelectHost,
  onSelectHostForCommand,
  onInspectWolPacket,
  onSendWol,
  onViewScreen,
  onOpenAddHostModal,
  onAddNewHost,
  onRescan,
  isScanning = false,
  isNetworkDisconnected = false,
  onReconnectNetwork,
}) => {
  const activeSelectedId = selectedHostId || selectedTarget;
  const onSelectHostSafe = onSelectHost || (() => {});
  const rescanHandler = onRescan || (() => {});
  const addHostHandler = onOpenAddHostModal || onAddNewHost || (() => openModal('addHost'));
  const toggleOmnibar = useUIStore((s) => s.toggleOmnibar);
  const openModal = useUIStore((s) => s.openModal);
  const { t, language } = useTranslation();

  // Per-host expansion state so collapsing/hiding any host is reliable and persists
  const [expandedHostIds, setExpandedHostIds] = useState<Record<string, boolean>>(() => {
    return activeSelectedId ? { [activeSelectedId]: true } : {};
  });

  // View Mode: Cards Grid vs D3 Force-Directed Network Topology
  const [viewMode, setViewMode] = useState<'grid' | 'topology'>(() => {
    try {
      const saved = localStorage.getItem('cst_fleet_view_mode');
      if (saved === 'grid' || saved === 'topology') return saved;
    } catch {}
    return 'grid';
  });

  useEffect(() => {
    try {
      localStorage.setItem('cst_fleet_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  const toggleHostExpansion = useCallback((hostId: string) => {
    triggerHapticFeedback('light');
    setExpandedHostIds((prev) => ({
      ...prev,
      [hostId]: !prev[hostId],
    }));
  }, []);

  const lastSelectedHostRef = useRef<string | undefined>(selectedHostId);
  useEffect(() => {
    if (selectedHostId && selectedHostId !== lastSelectedHostRef.current) {
      lastSelectedHostRef.current = selectedHostId;
      setExpandedHostIds((prev) => ({ ...prev, [selectedHostId]: true }));
    }
  }, [selectedHostId]);

  // React 18 Concurrent Mode: Instant input updates, deferred filtering to prevent 120Hz frame drops
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'sleeping' | 'servers'>('all');
  const [sortMode, setSortMode] = useState<FleetSortMode>(() => {
    try {
      const saved = localStorage.getItem('wakeflow_fleet_sort_mode');
      if (saved === 'alphabetical' || saved === 'status' || saved === 'latency') {
        return saved;
      }
    } catch {}
    return 'alphabetical';
  });
  const [sortDirection, setSortDirection] = useState<FleetSortDirection>(() => {
    try {
      const saved = localStorage.getItem('wakeflow_fleet_sort_direction');
      if (saved === 'asc' || saved === 'desc') {
        return saved;
      }
    } catch {}
    return 'asc';
  });

  useEffect(() => {
    try {
      localStorage.setItem('wakeflow_fleet_sort_mode', sortMode);
      localStorage.setItem('wakeflow_fleet_sort_direction', sortDirection);
    } catch {}
  }, [sortMode, sortDirection]);

  const handleSortToggle = useCallback((mode: FleetSortMode) => {
    triggerHapticFeedback('selection');
    setSortMode((prevMode) => {
      if (prevMode === mode) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return prevMode;
      } else {
        setSortDirection('asc');
        return mode;
      }
    });
  }, []);

  const [wakingCountdown, setWakingCountdown] = useState<Record<string, number>>({});

  // Native Pull-To-Refresh State with requestAnimationFrame throttling
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullYRef = useRef(0);
  const pullRafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pullYRef.current = pullY;
  }, [pullY]);

  const onlineCount = useMemo(() => hosts.filter((h) => h.isOnline).length, [hosts]);
  const offlineCount = useMemo(() => hosts.filter((h) => !h.isOnline).length, [hosts]);

  // Wake-on-LAN countdown timer
  const handleWakeClick = useCallback(
    (e: React.MouseEvent, host: HostDevice) => {
      e.stopPropagation();
      triggerHapticFeedback('heavy');
      onInspectWolPacket(host);
      setWakingCountdown((prev) => ({ ...prev, [host.id]: 45 }));
    },
    [onInspectWolPacket]
  );

  useEffect(() => {
    const activeKeys = Object.keys(wakingCountdown);
    if (activeKeys.length === 0) return;

    const interval = setInterval(() => {
      setWakingCountdown((prev) => {
        const next: Record<string, number> = {};
        for (const [id, count] of Object.entries(prev)) {
          const countNum = Number(count);
          if (countNum > 1) {
            next[id] = countNum - 1;
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [wakingCountdown]);

  // Damped Pull-To-Refresh Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 5 || (containerRef.current && containerRef.current.scrollTop <= 5)) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      if (pullRafRef.current) return;
      pullRafRef.current = requestAnimationFrame(() => {
        pullRafRef.current = null;
        const clamped = Math.min(diff * 0.45, 90);
        setPullY((prev) => {
          const next = Math.max(prev, clamped);
          if (next >= 60 && pullYRef.current < 60) {
            triggerHapticFeedback('light');
          }
          pullYRef.current = next;
          return next;
        });
      });
    }
  };

  const handleTouchEnd = () => {
    if (pullRafRef.current) {
      cancelAnimationFrame(pullRafRef.current);
      pullRafRef.current = null;
    }
    if (!isPulling) return;
    setIsPulling(false);
    const currentPullY = pullYRef.current;
    if (currentPullY >= 60 && !isRefreshing) {
      setIsRefreshing(true);
      triggerHapticFeedback('medium');
      onRescan?.();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
        pullYRef.current = 0;
      }, 1000);
    } else {
      setPullY(0);
      pullYRef.current = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (pullRafRef.current) {
        cancelAnimationFrame(pullRafRef.current);
      }
    };
  }, []);

  // Filter against deferredQuery and sort by active mode & direction for 120 FPS non-blocking sorting
  const filteredHosts = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();
    const filtered = hosts.filter((h) => {
      const matchesQuery =
        !query ||
        h.name.toLowerCase().includes(query) ||
        h.ip.toLowerCase().includes(query) ||
        h.id.toLowerCase().includes(query) ||
        (h.tags && h.tags.some((t) => t.toLowerCase().includes(query)));

      if (!matchesQuery) return false;

      if (activeFilter === 'online') return h.isOnline;
      if (activeFilter === 'sleeping') return !h.isOnline;
      if (activeFilter === 'servers')
        return h.deviceType === 'server' || h.id.includes('SERVER') || h.id.includes('SRV');
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'alphabetical') {
        const cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      if (sortMode === 'status') {
        if (a.isOnline !== b.isOnline) {
          return sortDirection === 'asc'
            ? a.isOnline ? -1 : 1 // Online first
            : a.isOnline ? 1 : -1; // Offline first
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (sortMode === 'latency') {
        const latA = a.isOnline ? (getLatencyConfig(a.ping, a.isOnline, a.id).latency ?? 9999) : 999999;
        const latB = b.isOnline ? (getLatencyConfig(b.ping, b.isOnline, b.id).latency ?? 9999) : 999999;

        if (a.isOnline && b.isOnline) {
          const diff = latA - latB;
          if (diff !== 0) {
            return sortDirection === 'asc' ? diff : -diff;
          }
        } else if (a.isOnline !== b.isOnline) {
          return sortDirection === 'asc' ? (a.isOnline ? -1 : 1) : (a.isOnline ? 1 : -1);
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }

      return 0;
    });
  }, [activeFilter, hosts, deferredQuery, sortMode, sortDirection]);

  return (
    <div
      id="fleet-dashboard-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full flex flex-col select-none pb-[calc(env(safe-area-inset-bottom,20px)+6.5rem)] relative"
    >
      {/* Native-Grade Pull-to-Refresh Physics Spinner */}
      <AnimatePresence>
        {(pullY > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: isRefreshing ? 54 : pullY,
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full flex items-center justify-center overflow-hidden"
          >
            <div className="glass-liquid flex items-center space-x-2.5 px-4 py-2 rounded-full border border-cyan-400/30 text-cyan-300 text-xs font-semibold shadow-lg">
              <RefreshCw
                className={`w-4 h-4 text-cyan-400 ${
                  isRefreshing || isScanning || pullY >= 60 ? 'animate-spin' : ''
                }`}
                style={{
                  transform: !isRefreshing && !isScanning ? `rotate(${pullY * 3}deg)` : undefined,
                }}
              />
              <span>
                {isRefreshing || isScanning
                  ? t('pull_scanning')
                  : pullY >= 60
                  ? t('pull_release')
                  : t('pull_down')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Viewing Area (Top 30% One UI Ergonomics) */}
      <div className="pt-2 pb-5 px-1 flex flex-col space-y-4">
        {/* Network Disconnection Banner */}
        {isNetworkDisconnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-liquid w-full px-4 py-3 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-200"
          >
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('conn_disconnected')}</span>
            </div>
            {onReconnectNetwork && (
              <button
                type="button"
                onClick={onReconnectNetwork}
                className="glass-liquid min-h-[44px] px-4 py-2 hover:brightness-110 text-amber-200 border border-amber-400/50 rounded-full font-semibold transition flex items-center justify-center cursor-pointer"
              >
                {t('conn_reconnect')}
              </button>
            )}
          </motion.div>
        )}

        {/* Minimalist Dashboard Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              {t('fleet_title')}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-white/50 mt-0.5 font-medium">
              <span>{t('fleet_subtitle')}</span>
              <span className="text-white/20">·</span>
              <span className="text-emerald-400 font-medium inline-flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                {onlineCount} {t('fleet_online')}
              </span>
              {offlineCount > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40">
                    {offlineCount} {t('fleet_sleeping')}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="bg-white/[0.04] p-0.5 rounded-full border border-white/10 flex items-center space-x-0.5">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('selection');
                  setViewMode('grid');
                }}
                className={`h-8 px-3 rounded-full text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white/10 text-cyan-300 font-semibold border border-cyan-400/30'
                    : 'text-white/50 hover:text-white'
                }`}
                title={t('fleet_view_cards')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('fleet_view_cards')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('selection');
                  setViewMode('topology');
                }}
                className={`h-8 px-3 rounded-full text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'topology'
                    ? 'bg-white/10 text-cyan-300 font-semibold border border-cyan-400/30'
                    : 'text-white/50 hover:text-white'
                }`}
                title={t('fleet_view_topology')}
              >
                <Network className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('fleet_view_topology')}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <LanguageToggle />

            {/* Spotlight Omnibar Search Button */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                toggleOmnibar();
              }}
              className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] active:scale-95 text-white/60 hover:text-white flex items-center justify-center transition shrink-0 cursor-pointer"
              title={t('fleet_spotlight_tooltip')}
              aria-label={t('fleet_spotlight_aria')}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {onPanicKill && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('heavy');
                  onPanicKill();
                }}
                className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 active:scale-95 text-rose-400 flex items-center justify-center transition shrink-0 cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                title={t('fleet_panic_tooltip')}
                aria-label={t('fleet_panic_aria')}
              >
                <OctagonAlert className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Pill Search & Action Controls */}
        <div className="w-full flex items-center space-x-2">
          <div className="flex-1 h-10 rounded-full bg-white/[0.03] border border-white/10 px-4 flex items-center space-x-2 focus-within:border-cyan-400/50 focus-within:bg-white/[0.05] transition">
            <Search className="w-3.5 h-3.5 text-white/35 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('fleet_search_placeholder')}
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-white/35"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                aria-label={t('fleet_clear_search')}
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-mono text-white/40 border border-white/[0.08]">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Quick Rescan Button */}
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('medium');
              rescanHandler();
            }}
            disabled={isScanning}
            className="w-10 h-10 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-cyan-400 hover:text-cyan-300 flex items-center justify-center transition active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
            title={t('fleet_rescan_tooltip')}
            aria-label={t('fleet_rescan_aria')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          </button>

          {/* Quick Add Host Button */}
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              addHostHandler();
            }}
            className="h-10 px-4 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shrink-0"
            title={t('fleet_add_host_tooltip')}
            aria-label={t('fleet_add_host_aria')}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Clean Filter & Sorting Pill Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
          {/* Segmented Filter Pill Bar */}
          <div className="bg-white/[0.03] p-1 rounded-full border border-white/10 flex items-center space-x-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: `${t('filter_all')} (${hosts.length})` },
              { id: 'online', label: `${t('filter_online')} (${onlineCount})` },
              { id: 'sleeping', label: `${t('filter_sleeping')} (${offlineCount})` },
              { id: 'servers', label: t('filter_servers') },
            ].map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback('selection');
                    setActiveFilter(chip.id as any);
                  }}
                  className={`h-7.5 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30 shadow-xs'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Clean Segmented Sort Pill Bar */}
          <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
            <span className="text-[11px] font-mono text-white/40 flex items-center space-x-1 mr-1">
              <ArrowUpDown className="w-3 h-3 text-white/30" />
              <span className="hidden sm:inline">{t('sort_label')}</span>
            </span>

            <div className="bg-white/[0.03] p-1 rounded-full border border-white/10 flex items-center space-x-1">
              {[
                {
                  id: 'alphabetical' as const,
                  label: t('sort_name'),
                  badge: sortDirection === 'asc' ? 'A→Z' : 'Z→A',
                  icon: sortDirection === 'asc' ? ArrowDownAZ : ArrowUpAZ,
                },
                {
                  id: 'status' as const,
                  label: t('sort_status'),
                  badge: sortDirection === 'asc' ? 'Online' : 'Sleep',
                  icon: Activity,
                },
                {
                  id: 'latency' as const,
                  label: t('sort_latency'),
                  badge: sortDirection === 'asc' ? 'Fast' : 'Slow',
                  icon: Gauge,
                },
              ].map((sortItem) => {
                const isActive = sortMode === sortItem.id;
                const SortIcon = sortItem.icon;
                return (
                  <button
                    key={sortItem.id}
                    type="button"
                    onClick={() => handleSortToggle(sortItem.id)}
                    title={t('sort_title_template', { mode: sortItem.label, badge: sortItem.badge })}
                    aria-label={`${t('sort_label')} ${sortItem.label}`}
                    className={`h-7.5 px-2.5 rounded-full text-xs font-medium transition flex items-center space-x-1 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30 shadow-xs'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <SortIcon className="w-3 h-3" />
                    <span>{sortItem.label}</span>
                    <span className="text-[10px] text-white/40 font-mono">{sortItem.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interaction Area: D3 Force-Directed Network Topology or Cards Grid */}
      {viewMode === 'topology' ? (
        <motion.div
          key="topology-view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
          className="px-0.5"
        >
          <React.Suspense
            fallback={
              <div
                className="grid min-h-[320px] place-items-center"
                aria-busy="true"
              >
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"
                  aria-hidden="true"
                />
              </div>
            }
          >
            <LazyNetworkTopologyGraph
              hosts={hosts}
              selectedHostId={activeSelectedId}
              quarantinedHosts={quarantinedHosts}
              circuitTrippedHosts={circuitTrippedHosts}
              onSelectHost={onSelectHostSafe}
              onSendWol={onInspectWolPacket}
              onViewScreen={onViewScreen}
            />
          </React.Suspense>
        </motion.div>
      ) : filteredHosts.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f1e]/80 p-8 sm:p-10 flex flex-col items-center justify-center text-center mx-0.5">
          <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/40 mb-3.5">
            <Wifi className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">{t('empty_hosts_title')}</h3>
          <p className="text-xs text-white/50 max-w-xs mt-1 mb-4">
            {t('empty_hosts_desc')}
          </p>
          <button
            type="button"
            onClick={addHostHandler}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 font-semibold text-xs flex items-center space-x-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('empty_hosts_btn')}</span>
          </button>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.045,
              },
            },
          }}
          className="space-y-3 px-0.5"
        >
          <AnimatePresence mode="popLayout">
            {filteredHosts.map((host) => (
              <HostCard
                key={host.id}
                host={host}
                language={language}
                isSelected={host.id === activeSelectedId}
                isExpanded={!!expandedHostIds[host.id]}
                isQuarantined={quarantinedHosts.includes(host.id)}
                isCircuitTripped={circuitTrippedHosts.includes(host.id)}
                sortMode={sortMode}
                remainingWakeSeconds={wakingCountdown[host.id]}
                onSelect={onSelectHostSafe}
                onToggleExpand={toggleHostExpansion}
                onInspectWolPacket={onInspectWolPacket}
                onViewScreen={onViewScreen}
                onSelectForCommand={onSelectHostForCommand}
                onOpenDetailsModal={(dev) => openModal('hostDetails', dev)}
                onWakeClick={handleWakeClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export const FleetDashboard = React.memo(FleetDashboardComponent);
