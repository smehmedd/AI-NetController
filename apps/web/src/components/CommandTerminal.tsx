import React, { useState, useRef, useEffect } from 'react';
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
import { DEMO_PRESET_COMMANDS } from '../data/mockHosts';
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
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const logScrollRef = useRef<HTMLDivElement>(null);

  const selectedHost = hosts.find((h) => h.id === selectedTarget) || hosts[0];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      logScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // Allow AnimatePresence layout to mount before scrolling
    return () => clearTimeout(timeoutId);
  }, [lastExecutionResult, isExecuting]);

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
    <div className="w-full flex-1 flex flex-col justify-between select-none relative pb-[calc(env(safe-area-inset-bottom,20px)+1rem)]">
      {/* 1. Header & Target Selector Pills (No Clipping) */}
      <div className="py-1.5 flex items-center justify-between gap-2 mb-3 max-w-full overflow-hidden">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-1 py-1">
          {hosts.map((h) => {
            const isSelected = h.id === selectedTarget;
            return (
              <motion.button
                key={h.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  triggerHapticFeedback('selection');
                  onSelectTarget(h.id);
                }}
                className="relative min-w-[40px] min-h-[40px] px-3 py-1.5 rounded-full text-xs font-mono transition flex items-center space-x-2 shrink-0 bg-white/[0.03] backdrop-blur-xl border border-white/10 text-white/60 hover:text-white overflow-hidden cursor-pointer bubble-tap"
              >
                {isSelected && (
                  <motion.div
                    layoutId="terminalTargetActivePill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-cyan-500/15 border border-cyan-400/50 shadow-[0_0_14px_rgba(0,212,255,0.25)] pointer-events-none"
                    transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }}
                  />
                )}
                <span
                  className={`relative z-10 w-1.5 h-1.5 rounded-full ${
                    h.isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-white/30'
                  }`}
                />
                <span className={`relative z-10 ${isSelected ? 'text-cyan-300 font-bold' : ''}`}>
                  {h.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {selectedHost && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              triggerHapticFeedback('light');
              onViewScreen(selectedHost);
            }}
            className="min-w-[40px] min-h-[40px] px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:brightness-110 active:scale-95 text-cyan-300 text-xs font-medium flex items-center space-x-1.5 shrink-0 transition cursor-pointer bubble-tap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('term_view_screen')}</span>
          </motion.button>
        )}
      </div>

      {/* 2. Main Terminal Output Surface */}
      <GlassContainer className="flex-1 p-3.5 sm:p-5 flex flex-col justify-between min-h-[300px] sm:min-h-[340px] mb-4 overflow-hidden">
        {/* Terminal Header with Non-Clipping Truncation */}
        <div className="flex items-center justify-between gap-2 pb-3 text-xs text-white/50 border-b border-white/[0.06] overflow-hidden">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white truncate">{t('term_agent_context')}</span>
          </div>
          <span className="font-mono text-[10px] sm:text-[11px] text-white/60 shrink-0 pl-1">{selectedHost?.ip}:8765</span>
        </div>

        {/* Scrollable Command Output */}
        <div className="flex-1 min-h-[160px] max-h-[45vh] sm:max-h-[50vh] py-4 font-mono text-xs leading-relaxed space-y-3 overflow-y-auto scrollbar-thin">
          <div className="text-white/50">
            [SYS] {t('term_connected_to', { name: selectedHost?.name || 'host', os: selectedHost?.os || 'Windows 11' })}
          </div>

          <AnimatePresence mode="popLayout">
            {lastExecutionResult && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('term_exec_success', { time: lastExecutionResult.execution_time_ms })}
                  </span>
                  <span className="text-white/50">{lastExecutionResult.timestamp}</span>
                </div>
                <pre className="text-white text-xs whitespace-pre-wrap font-mono">
                  {lastExecutionResult.output}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {isExecuting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-cyan-400"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t('term_executing')}</span>
            </motion.div>
          )}

          <div ref={logScrollRef} />
        </div>

        {/* 2x2 Quick Action Presets */}
        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEMO_PRESET_COMMANDS.map((preset, idx) => (
            <motion.button
              key={idx}
              type="button"
              whileTap={{ scale: 0.94 }}
              disabled={isExecuting}
              onClick={() => handleRunPreset(preset.prompt)}
              className="min-h-[44px] p-2.5 rounded-2xl bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] active:scale-95 text-left transition disabled:opacity-40 flex flex-col justify-center cursor-pointer border border-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate">{preset.label}</span>
                <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />
              </div>
              <p className="text-[10px] text-white/50 truncate mt-0.5">{preset.prompt}</p>
            </motion.button>
          ))}
        </div>
      </GlassContainer>

      {/* 3. Anchored Chat Prompt Input Container with Gradient Mask */}
      <div className="sticky bottom-0 z-30 pt-3 pb-[calc(env(safe-area-inset-bottom,20px)+5rem)] bg-gradient-to-t from-[#060913] via-[#060913]/90 to-transparent">
        <form onSubmit={handleSubmit} className="w-full relative px-1">
          <div className="min-h-[52px] h-14 rounded-full bg-white/[0.04] backdrop-blur-[48px] backdrop-saturate-[200%] border border-white/[0.1] border-t-white/[0.22] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)] px-4 flex items-center space-x-3 focus-within:border-cyan-400/60 transition">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('term_prompt_placeholder')}
              disabled={isExecuting}
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-white/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isExecuting}
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 active:scale-90 text-slate-950 flex items-center justify-center transition shadow-md shrink-0 cursor-pointer"
              aria-label={t('term_send_btn')}
            >
              {isExecuting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CommandTerminal = React.memo(CommandTerminalComponent);
