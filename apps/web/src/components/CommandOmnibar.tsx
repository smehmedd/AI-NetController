import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Monitor, Terminal, Zap, X, TerminalSquare, Command, ChevronRight, Sparkles, Languages, Cpu, Radio, Shield } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { HostDevice } from '../types';
import { DEMO_PRESET_COMMANDS } from '../data/mockHosts';
import { triggerHapticFeedback } from '../services/hapticService';
import { useTranslation } from '../i18n/useTranslation';

interface CommandOmnibarProps {
  hosts: HostDevice[];
  selectedTarget: string;
  onSelectHost: (id: string) => void;
  onSendCommand: (cmd: any) => void;
  onSendWolDirect: (device: HostDevice) => void;
  onRescanMdns: () => void;
}

export const CommandOmnibar: React.FC<CommandOmnibarProps> = ({
  hosts,
  selectedTarget,
  onSelectHost,
  onSendCommand,
  onSendWolDirect,
  onRescanMdns,
}) => {
  const isOpen = useUIStore((s) => s.isOmnibarOpen);
  const setOmnibarOpen = useUIStore((s) => s.setOmnibarOpen);
  const openModal = useUIStore((s) => s.openModal);
  const { t, toggleLanguage } = useTranslation();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (CMD+K / CTRL+K / Escape / Arrow navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOmnibarOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setOmnibarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOmnibarOpen]);

  // Focus input automatically when opened and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const q = query.toLowerCase().trim();
  const isActionMode = q.startsWith('>');
  const isHostMode = q.startsWith('@');
  const isAiMode = q.startsWith('/');
  const rawQuery = q.replace(/^[>@/]\s*/, '');

  const executeAction = useCallback((action: () => void) => {
    triggerHapticFeedback('medium');
    action();
    setOmnibarOpen(false);
  }, [setOmnibarOpen]);

  const systemActions = [
    { label: t('omni_action_rescan'), icon: Search, action: onRescanMdns },
    { label: t('omni_action_ws'), icon: TerminalSquare, action: () => openModal('wsConfig') },
    { label: t('omni_action_wol'), icon: Zap, action: () => openModal('wol', { tab: 'schedules' }) },
    { label: t('omni_action_memory'), icon: Monitor, action: () => openModal('memory') },
    { label: t('omni_switch_lang'), icon: Languages, action: () => toggleLanguage() },
  ].filter((a) => a.label.toLowerCase().includes(rawQuery));

  const filteredHosts = hosts.filter(
    (h) => h.name.toLowerCase().includes(rawQuery) || h.ip.includes(rawQuery) || h.mac.toLowerCase().includes(rawQuery)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-start select-none">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOmnibarOpen(false)}
            className="fixed inset-0 bg-[#050811]/60 backdrop-blur-xl transform-gpu"
          />

          {/* Edge-to-edge transparent iOS Spotlight design */}
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="
              relative z-10 w-full max-w-2xl mx-auto
              bg-white/[0.03] dark:bg-white/[0.04]
              backdrop-blur-[48px] backdrop-saturate-[200%]
              border border-white/[0.08] border-t-white/[0.2] border-l-white/[0.14]
              shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]
              transform-gpu will-change-[transform,backdrop-filter]
              flex flex-col pt-[calc(env(safe-area-inset-top,12px)+0.5rem)]
              sm:rounded-b-[2rem]
            "
          >
            {/* Top Drag Indicator */}
            <div className="w-full flex justify-center pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-2.5">
              <Command className="w-5 h-5 text-cyan-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('omni_placeholder')}
                className="flex-1 bg-transparent border-none outline-none text-white text-base px-3 placeholder-white/40 font-sans"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white transition cursor-pointer"
                  aria-label={t('omni_clear')}
                >
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOmnibarOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white transition cursor-pointer"
                  aria-label="Close search"
                >
                  <kbd className="inline-block px-2 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-white/50 border border-white/[0.08]">
                    ESC
                  </kbd>
                </button>
              )}
            </div>

            {/* Context Mode Badges */}
            <div className="flex items-center space-x-1.5 px-4 pb-2 text-[11px] text-white/50 border-b border-white/[0.06]">
              <span className={`px-2 py-0.5 rounded-full transition ${isActionMode ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30' : 'bg-white/5'}`}>
                {t('omni_actions')}
              </span>
              <span className={`px-2 py-0.5 rounded-full transition ${isHostMode ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30' : 'bg-white/5'}`}>
                {t('omni_hosts')}
              </span>
              <span className={`px-2 py-0.5 rounded-full transition ${isAiMode ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30' : 'bg-white/5'}`}>
                {t('omni_ai')}
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-[55vh] overflow-y-auto p-2 scrollbar-none space-y-1">
              {/* Host Results */}
              {(!q || isHostMode) &&
                filteredHosts.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => executeAction(() => onSelectHost(h.id))}
                    className="w-full min-h-[52px] flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] transition cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-white">{h.name}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              h.isOnline ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs text-white/50 font-mono">{h.ip} · {h.mac}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5 text-white/50 font-mono">
                        {t('omni_console')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </div>
                  </button>
                ))}

              {/* System Actions */}
              {(!q || isActionMode) &&
                systemActions.map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => executeAction(act.action)}
                    className="w-full min-h-[52px] flex items-center p-3 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] transition space-x-3 text-left cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                      <act.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-white">{act.label}</span>
                  </button>
                ))}

              {/* AI Presets */}
              {isAiMode &&
                DEMO_PRESET_COMMANDS.filter((p) => p.label.toLowerCase().includes(rawQuery) || p.prompt.toLowerCase().includes(rawQuery)).map(
                  (p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        executeAction(() =>
                          onSendCommand({
                            target_id: selectedTarget,
                            command_type: 'natural_language',
                            prompt: p.prompt,
                          })
                        )
                      }
                      className="w-full min-h-[52px] flex flex-col items-start p-3 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] transition space-y-1 text-left cursor-pointer border border-transparent hover:border-white/10"
                    >
                      <span className="text-sm font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {p.label}
                      </span>
                      <span className="text-xs text-white/50 truncate w-full">{p.prompt}</span>
                    </button>
                  )
                )}

              {/* Direct Natural Language Query to Active Host */}
              {q && !isActionMode && !isHostMode && !isAiMode && (
                <button
                  type="button"
                  onClick={() =>
                    executeAction(() =>
                      onSendCommand({
                        target_id: selectedTarget,
                        command_type: 'natural_language',
                        prompt: q,
                      })
                    )
                  }
                  className="w-full min-h-[52px] flex items-center p-3 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] transition space-x-3 text-left cursor-pointer border border-transparent hover:border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 shrink-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-sm font-semibold text-white">
                      {t('omni_send_to_host', { target: selectedTarget })}
                    </span>
                    <span className="text-xs text-white/50 truncate">&quot;{q}&quot;</span>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
