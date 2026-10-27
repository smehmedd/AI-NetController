import React from 'react';
import { motion } from 'motion/react';
import { Cpu, TerminalSquare, WandSparkles, SlidersHorizontal, Radio } from 'lucide-react';
import { triggerHapticFeedback } from '../services/hapticService';
import { useTranslation } from '../i18n/useTranslation';
import { SPRING_BUBBLY, SPRING_POP } from '../utils/springPhysics';

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
      icon: Cpu,
      shortcut: '1',
      activeRotate: -8,
    },
    {
      id: 'terminal' as NavTab,
      label: t('nav_console'),
      icon: TerminalSquare,
      shortcut: '2',
      activeRotate: 6,
    },
    {
      id: 'chat' as NavTab,
      label: t('nav_gemini_ai'),
      icon: WandSparkles,
      shortcut: '3',
      activeRotate: 12,
    },
    {
      id: 'settings' as NavTab,
      label: t('nav_settings'),
      icon: SlidersHorizontal,
      shortcut: '4',
      activeRotate: -10,
    },
  ];

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,12px)+0.5rem)] left-1/2 -translate-x-1/2 z-40 max-w-lg md:max-w-xl w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] select-none pointer-events-auto smooth-144hz">
      <nav className="landscape-compact-nav bg-[#070c18]/90 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/15 border-t-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.8)] w-full h-[58px] sm:h-[62px] rounded-full flex items-center justify-between p-1.5 transform-gpu relative">
        {/* Top & Bottom Specular Refraction Highlights */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-12 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none" />

        {/* Tab Items with 120Hz Zero-Reflow Sliding Liquid Glass Capsule */}
        <div className="flex-1 flex items-center justify-around h-full gap-1 min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                type="button"
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.89 }}
                transition={SPRING_POP}
                onClick={() => {
                  triggerHapticFeedback('selection');
                  onChangeTab(tab.id);
                }}
                className="relative flex-1 flex items-center justify-center h-full min-h-[44px] px-2 sm:px-3 rounded-full transition-colors cursor-pointer group min-w-0 transform-gpu"
                aria-label={`${tab.label} (${tab.shortcut})`}
                title={`${tab.label} [${tab.shortcut}]`}
              >
                {/* Active Liquid Glass Lens with Bubbly 120Hz Spring LayoutId */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/25 via-sky-500/20 to-indigo-500/20 border border-cyan-300/45 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_0_20px_rgba(56,189,248,0.28)] pointer-events-none transform-gpu"
                    transition={SPRING_BUBBLY}
                  />
                )}

                <div className="relative z-10 flex items-center justify-center gap-1.5 min-w-0">
                  <motion.div
                    animate={
                      isActive
                        ? { scale: 1.18, y: -1.5, rotate: tab.activeRotate }
                        : { scale: 1, y: 0, rotate: 0 }
                    }
                    whileHover={{ scale: 1.24, rotate: tab.activeRotate * -1, y: -2 }}
                    transition={SPRING_POP}
                    className="flex items-center justify-center shrink-0 transform-gpu"
                  >
                    <Icon
                      className={`w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] transition-colors duration-150 shrink-0 ${
                        isActive
                          ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.75)] stroke-[2.25]'
                          : 'text-white/55 group-hover:text-cyan-200 stroke-[1.9]'
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`font-display text-[11px] sm:text-[11.5px] font-bold tracking-tight whitespace-nowrap truncate transition-all duration-200 ${
                      isActive
                        ? 'text-cyan-100 opacity-100 max-w-[100px]'
                        : 'text-white/55 opacity-0 max-w-0 sm:opacity-80 sm:max-w-[88px] group-hover:text-white/95'
                    }`}
                  >
                    {tab.label}
                  </span>
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
          <motion.button
            type="button"
            whileHover={{ scale: 1.07, y: -1.5 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING_POP}
            onClick={() => {
              if (onOpenNetworkConfig) {
                triggerHapticFeedback('light');
                onOpenNetworkConfig();
              }
            }}
            className="group px-2.5 py-1.5 rounded-full glass-liquid-subtle hover:border-cyan-400/40 border border-white/12 flex items-center space-x-1.5 text-[11px] font-mono tabular-nums transition cursor-pointer transform-gpu"
            title={
              isConnected
                ? `Network Connected (${latency ? `${Math.round(latency)}ms` : 'active'}) — Click to configure`
                : 'Simulation Lab Mode — Click to configure WebSocket'
            }
          >
            <Radio
              className={`w-3.5 h-3.5 shrink-0 icon-bubbly ${
                isConnected
                  ? 'text-emerald-400 drop-shadow-[0_0_6px_#34d399]'
                  : 'text-sky-400 drop-shadow-[0_0_6px_#38bdf8]'
              }`}
            />
            <span className="text-white/90 font-semibold text-[10.5px] whitespace-nowrap">
              {latency ? `${Math.round(latency)}ms` : isConnected ? t('nav_connected') : t('nav_lab')}
            </span>
          </motion.button>
        </div>
      </nav>
    </div>
  );
};

export const FloatingPillNav = React.memo(FloatingPillNavComponent);

