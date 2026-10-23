import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Terminal,
  Sparkles,
  ArrowUp,
  RefreshCw,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HostDevice, AgentExecutionResponse } from '../types';
import { GlassContainer } from './ui/GlassContainer';
import { triggerHapticFeedback } from '../services/hapticService';
import { useTranslation } from '../i18n/useTranslation';

interface CommandTerminalProps {
  hosts: HostDevice[];
  selectedTarget: string;
  onSelectTarget: (targetId: string) => void;
  onSendCommand: (command: any) => void;
  isExecuting: boolean;
  lastExecutionResult?: AgentExecutionResponse | null;
  onViewScreen: (device: HostDevice) => void;
  screenBase64: string | null;
  onRefreshScreen: (hostId: string) => void;
  isCapturingScreen: boolean;
}

const CommandTerminalComponent: React.FC<CommandTerminalProps> = ({
  hosts,
  selectedTarget,
  onSelectTarget,
  onSendCommand,
  isExecuting,
  lastExecutionResult,
  onViewScreen,
}) => {
  const { t, language } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const logScrollRef = useRef<HTMLDivElement>(null);

  const selectedHost = hosts.find((h) => h.id === selectedTarget) || hosts[0];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      logScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [lastExecutionResult, isExecuting]);

  const localizedPresets = useMemo(
    () => [
      {
        id: 'updates',
        label: language === 'bg' ? 'Провери обновления' : 'Check Updates',
        prompt:
          language === 'bg'
            ? 'Провери за системни обновления на Windows и инсталирани пакети'
            : 'Check for pending OS system updates and installed packages',
      },
      {
        id: 'restart',
        label: language === 'bg' ? 'Рестартирай хоста' : 'Restart Host',
        prompt:
          language === 'bg'
            ? 'Планирай безопасен рестарт на работната станция след 30 секунди'
            : 'Schedule a safe workstation restart in 30 seconds',
      },
      {
        id: 'browser',
        label: language === 'bg' ? 'Отвори браузър' : 'Open Browser',
        prompt:
          language === 'bg'
            ? 'Отвори системния браузър с таблото за мониторинг'
            : 'Open default system browser to network status dashboard',
      },
      {
        id: 'stats',
        label: language === 'bg' ? 'CPU и RAM Статистика' : 'CPU & RAM Stats',
        prompt:
          language === 'bg'
            ? 'Покажи топ 10 процеса по натоварване на CPU и RAM памет'
            : 'List top 10 processes sorted by CPU and RAM utilization',
      },
    ],
    [language]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExecuting) return;

    triggerHapticFeedback('medium');
    onSendCommand({
      target_id: selectedTarget,
      command_type: 'natural_language',
      prompt: prompt.trim(),
    });

    setPrompt('');
  };

  const handleRunPreset = (presetPrompt: string) => {
    if (isExecuting) return;
    triggerHapticFeedback('light');
    onSendCommand({
      target_id: selectedTarget,
      command_type: 'natural_language',
      prompt: presetPrompt,
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between select-none relative pb-[calc(env(safe-area-inset-bottom,24px)+6.5rem)]">
      {/* 1. Header & Flush Target Selector Pills */}
      <div className="py-1.5 flex items-center justify-between gap-2 mb-3 max-w-full overflow-hidden">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-1 py-1">
          {hosts.map((h) => {
            const isSelected = h.id === selectedTarget;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  triggerHapticFeedback('selection');
                  onSelectTarget(h.id);
                }}
                className={`relative min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex items-center space-x-2 shrink-0 overflow-hidden cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 font-bold shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                    : 'bg-[#070c18]/88 border-white/12 text-white/65 hover:text-white hover:border-white/25'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    h.isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-white/30'
                  }`}
                />
                <span className="whitespace-nowrap">{h.name}</span>
              </button>
            );
          })}
        </div>

        {selectedHost && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              triggerHapticFeedback('light');
              onViewScreen(selectedHost);
            }}
            className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#070c18]/88 backdrop-blur-3xl border border-white/15 border-t-white/25 hover:border-cyan-400/40 text-cyan-300 text-xs font-medium flex items-center space-x-1.5 shrink-0 transition cursor-pointer shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('term_view_screen')}</span>
          </motion.button>
        )}
      </div>

      {/* 2. Main Terminal Output Surface (Tier 1 Resting Card) */}
      <GlassContainer className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-h-[300px] sm:min-h-[360px] mb-3 overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between gap-2 pb-3 text-xs text-white/50 border-b border-white/[0.08] overflow-hidden">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white truncate">{t('term_agent_context')}</span>
          </div>
          <span className="font-mono text-[11px] text-cyan-300/80 shrink-0 pl-1 tabular-nums">
            {selectedHost?.ip}:8765
          </span>
        </div>

        {/* Scrollable Command Output */}
        <div className="flex-1 min-h-[200px] max-h-[50vh] py-4 font-mono text-xs leading-relaxed space-y-3 overflow-y-auto scrollbar-thin">
          <div className="text-white/50">
            {t('term_connected_to', { name: selectedHost?.name || 'host', os: selectedHost?.os || 'Windows 11' })}
          </div>

          <AnimatePresence mode="popLayout">
            {lastExecutionResult && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="p-3.5 rounded-2xl bg-[#070c18]/90 border border-cyan-400/25 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-white/50 tabular-nums">
                  <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('term_exec_success', { time: lastExecutionResult.execution_time_ms })}
                  </span>
                  <span className="text-white/45">{lastExecutionResult.timestamp}</span>
                </div>
                <pre className="text-white/95 text-xs whitespace-pre-wrap font-mono">
                  {lastExecutionResult.output}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {isExecuting && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-cyan-300"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t('term_executing')}</span>
            </motion.div>
          )}

          <div ref={logScrollRef} />
        </div>
      </GlassContainer>

      {/* 3. Bottom-Anchored Compact Horizontal Preset Chip Strip + Tier 2 Input Bar */}
      <div className="w-full space-y-2 pt-1">
        {/* Compact Horizontally Scrollable Preset Chip Strip (Zero Truncation) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5">
          {localizedPresets.map((preset) => (
            <motion.button
              key={preset.id}
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.95 }}
              disabled={isExecuting}
              onClick={() => handleRunPreset(preset.prompt)}
              className="h-9 px-3.5 rounded-full bg-[#070c18]/88 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/15 border-t-white/25 hover:border-cyan-400/45 text-xs font-semibold text-white/85 hover:text-cyan-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition cursor-pointer disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{preset.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tier 2 Liquid Glass Prompt Input Capsule */}
        <form onSubmit={handleSubmit} className="w-full relative">
          <div className="min-h-[54px] h-14 rounded-full bg-[#070c18]/88 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/15 border-t-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.75)] px-4 flex items-center space-x-3 focus-within:border-cyan-400/60 transition">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('term_prompt_placeholder')}
              disabled={isExecuting}
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-white/40 disabled:opacity-50"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              disabled={!prompt.trim() || isExecuting}
              className="min-w-[42px] min-h-[42px] w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 disabled:opacity-35 text-slate-950 flex items-center justify-center transition shadow-[0_0_16px_rgba(56,189,248,0.45)] shrink-0 cursor-pointer"
              aria-label={t('term_send_btn')}
            >
              {isExecuting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CommandTerminal = React.memo(CommandTerminalComponent);
