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
}

const FloatingPillNavComponent: React.FC<FloatingPillNavProps> = ({
  activeTab,
  onChangeTab,
  isConnected,
  latency,
}) => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'fleet' as NavTab,
      label: t('nav_devices'),
      icon: Laptop2,
      badge: null,
    },
    {
      id: 'terminal' as NavTab,
      label: t('nav_console'),
      icon: SquareTerminal,
      badge: null,
    },
    {
      id: 'chat' as NavTab,
      label: t('nav_gemini_ai'),
      icon: Sparkles,
      badge: 'AI',
    },
    {
      id: 'settings' as NavTab,
      label: t('nav_settings'),
      icon: SlidersHorizontal,
      badge: null,
    },
  ];

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,16px)+0.75rem)] left-1/2 -translate-x-1/2 z-40 max-w-sm w-[calc(100%-2.5rem)] select-none pointer-events-auto">
      {/* Main Single-Pill Navigation Dock without text labels */}
      <nav className="glass-liquid-elevated w-full h-[58px] rounded-full flex items-center justify-between p-1.5 transform-gpu relative shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(0,212,255,0.12)] border border-white/12 backdrop-blur-2xl">
        {/* Top specular reflection rim */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Tab Icons - Icon Only, perfectly centered */}
        <div className="flex-1 flex items-center justify-around h-full gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                type="button"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.88, y: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                onClick={() => {
                  triggerHapticFeedback('selection');
                  onChangeTab(tab.id);
                }}
                className="relative flex-1 flex flex-col items-center justify-center h-full min-h-[44px] rounded-full transition-colors cursor-pointer group"
                aria-label={tab.label}
                title={tab.label}
              >
                {/* Active Pill Glow Surface with Bubbly Spring LayoutId */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-full bg-cyan-500/25 border border-cyan-400/50 shadow-[0_0_18px_rgba(0,212,255,0.35)] pointer-events-none"
                    transition={{ type: 'spring', stiffness: 480, damping: 28, mass: 0.6 }}
                  />
                )}

                {/* Informative & Minimalist Icon */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <Icon
                    className={`w-[20px] h-[20px] transition-colors duration-150 ${
                      isActive
                        ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(0,212,255,0.5)] stroke-[2.2]'
                        : 'text-white/45 group-hover:text-white/80 stroke-[1.8]'
                    }`}
                  />
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_4px_#22d3ee] mt-0.5" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Live Network Health Status Capsule */}
        <div className="pl-1 pr-1 flex items-center shrink-0">
          <div
            className="px-2.5 py-1 rounded-full glass-liquid-subtle border border-white/10 flex items-center space-x-1.5 text-[11px] font-mono shadow-inner"
            title={isConnected ? `Network Connected (${latency ? `${Math.round(latency)}ms` : 'active'})` : 'Simulation Lab'}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-cyan-400 shadow-[0_0_6px_#06b6d4] animate-pulse'
              }`}
            />
            <span className="text-white/80 font-semibold text-[10px]">
              {latency ? `${Math.round(latency)}ms` : isConnected ? t('nav_connected') : t('nav_lab')}
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export const FloatingPillNav = React.memo(FloatingPillNavComponent);
