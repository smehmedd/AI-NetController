import React from 'react';
import { motion } from 'motion/react';
import { Laptop2, SquareTerminal, Sparkles, SlidersHorizontal } from 'lucide-react';
import { triggerHapticFeedback } from '../services/hapticService';
import { useTranslation } from '../i18n/useTranslation';

export type NavTab = 'fleet' | 'terminal' | 'chat' | 'settings';

interface FloatingPillNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isConnected: boolean;
  latency: number | null;
  onOpenNetworkConfig?: () => void;
}

const FloatingPillNavComponent: React.FC<FloatingPillNavProps> = ({
  activeTab,
  onChangeTab,
  isConnected,
  latency,
  onOpenNetworkConfig,
}) => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'fleet' as NavTab,
      label: t('nav_devices'),
      icon: Laptop2,
      shortcut: '1',
    },
    {
      id: 'terminal' as NavTab,
      label: t('nav_console'),
      icon: SquareTerminal,
      shortcut: '2',
    },
    {
      id: 'chat' as NavTab,
      label: t('nav_gemini_ai'),
      icon: Sparkles,
      shortcut: '3',
    },
    {
      id: 'settings' as NavTab,
      label: t('nav_settings'),
      icon: SlidersHorizontal,
      shortcut: '4',
    },
  ];

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,12px)+0.5rem)] left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] select-none pointer-events-auto">
      <nav className="landscape-compact-nav bg-[#070c18]/90 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/15 border-t-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.8)] w-full h-[58px] sm:h-[60px] rounded-full flex items-center justify-between p-1.5 transform-gpu relative">
        {/* Top & Bottom Specular Refraction Highlights */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-12 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none" />

        {/* Tab Items with Fluid Sliding Liquid Glass Capsule */}
        <div className="flex-1 flex items-center justify-around h-full gap-1 min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                type="button"
                layout
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                onClick={() => {
                  triggerHapticFeedback('selection');
                  onChangeTab(tab.id);
                }}
                className={`relative flex items-center justify-center h-full min-h-[44px] px-2.5 sm:px-3.5 rounded-full transition-colors cursor-pointer group min-w-0 ${
                  isActive ? 'flex-[1.4]' : 'flex-1'
                }`}
                aria-label={`${tab.label} (${tab.shortcut})`}
                title={`${tab.label} [${tab.shortcut}]`}
              >
                {/* Active Liquid Glass Lens with Spring LayoutId */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/25 via-sky-500/20 to-indigo-500/20 border border-cyan-300/45 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_0_20px_rgba(56,189,248,0.3)] pointer-events-none"
                    transition={{ type: 'spring', stiffness: 440, damping: 28, mass: 0.65 }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.65)] stroke-[2.2]'
                        : 'text-white/50 group-hover:text-white/85 stroke-[1.8]'
                    }`}
                  />
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-[11px] font-semibold text-cyan-100 tracking-wide whitespace-nowrap overflow-hidden truncate"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                  <kbd className="hidden lg:inline-block text-[9px] font-mono text-white/30 group-hover:text-white/55 px-1 rounded bg-white/[0.04] border border-white/[0.06] shrink-0">
                    {tab.shortcut}
                  </kbd>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Live Network Telemetry Status Orb (1-tap QoL shortcut to WebSocket / Lab config) */}
        <div className="pl-1 pr-0.5 flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onOpenNetworkConfig) {
                triggerHapticFeedback('light');
                onOpenNetworkConfig();
              }
            }}
            className="px-2.5 py-1.5 rounded-full glass-liquid-subtle hover:border-cyan-400/40 border border-white/12 flex items-center space-x-1.5 text-[11px] font-mono tabular-nums transition cursor-pointer"
            title={
              isConnected
                ? `Network Connected (${latency ? `${Math.round(latency)}ms` : 'active'}) — Click to configure`
                : 'Simulation Lab Mode — Click to configure WebSocket'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
              }`}
            />
            <span className="text-white/85 font-semibold text-[10px] whitespace-nowrap">
              {latency ? `${Math.round(latency)}ms` : isConnected ? t('nav_connected') : t('nav_lab')}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export const FloatingPillNav = React.memo(FloatingPillNavComponent);

