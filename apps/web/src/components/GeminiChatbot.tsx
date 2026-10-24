import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUp,
  Square,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Shield,
  Terminal,
  Zap,
  Power,
  RefreshCw,
  FlaskConical,
  Bot,
  User,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { triggerHapticFeedback } from '../services/hapticService';
import { HostDevice, WolSchedule } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useUIStore } from '../store/uiStore';

export type BotRole = 'commander' | 'diagnostics' | 'fast_triage';
export type GeminiModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | string;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  durationMs?: number;
  actions?: Array<{
    type: 'wol' | 'rescan' | 'lab_mode' | 'details' | 'copy';
    label: string;
    payload?: any;
  }>;
}

interface GeminiChatbotProps {
  hosts: HostDevice[];
  selectedTarget: string;
  onSendWol?: (device: HostDevice) => void;
  onSelectHost?: (hostId: string) => void;
  onTriggerRescan?: () => void;
  onToggleLabMode?: () => void;
  isRealWsConnected?: boolean;
  latency?: number | null;
  wolSchedules?: WolSchedule[];
}

const STORAGE_KEY = 'cst_gemini_chat_history_v3';
const ROLE_STORAGE_KEY = 'cst_gemini_active_role_v3';

const GeminiChatbotComponent: React.FC<GeminiChatbotProps> = ({
  hosts,
  selectedTarget,
  onSendWol,
  onSelectHost,
  onTriggerRescan,
  onToggleLabMode,
  isRealWsConnected = false,
  latency = null,
  wolSchedules = [],
}) => {
  const { t, language } = useTranslation();
  const selectedModel = useUIStore((s) => s.selectedModel);
  const pendingChatPrompt = useUIStore((s) => s.pendingChatPrompt);
  const setPendingChatPrompt = useUIStore((s) => s.setPendingChatPrompt);

  const welcomeText = useMemo(
    () =>
      language === 'bg'
        ? 'Здравейте. Аз съм Вашият CST мрежов асистент с Gemini AI. Мога да управлявам флот от работни станции, да изпращам Wake-on-LAN пакети и да анализирам телеметрия на протокол CST/3.0-SECURE.'
        : 'Hello. I am your CST fleet copilot powered by Gemini AI. I can orchestrate workstations, dispatch Wake-on-LAN packets, and inspect CST/3.0-SECURE telemetry.',
    [language]
  );

  const ROLES = useMemo(
    () => [
      {
        id: 'commander' as BotRole,
        label: language === 'bg' ? 'Флот' : 'Fleet',
        model: (selectedModel || 'gemini-3.8-flash') as GeminiModelId,
        icon: Sparkles,
        placeholder: language === 'bg' ? 'Попитайте Флот Командира...' : 'Ask Fleet Copilot...',
      },
      {
        id: 'diagnostics' as BotRole,
        label: language === 'bg' ? 'Сигурност' : 'Security',
        model: (selectedModel || 'gemini-3.8-flash') as GeminiModelId,
        icon: Shield,
        placeholder: language === 'bg' ? 'Анализ на CST/3.0 протокол...' : 'Analyze CST/3.0 security...',
      },
      {
        id: 'fast_triage' as BotRole,
        label: language === 'bg' ? 'Shell' : 'Shell',
        model: (selectedModel || 'gemini-3.8-flash') as GeminiModelId,
        icon: Terminal,
        placeholder: language === 'bg' ? 'Бърза shell команда...' : 'Fast bash / PowerShell command...',
      },
    ],
    [language, selectedModel]
  );

  const [activeRole, setActiveRole] = useState<BotRole>(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY) as BotRole;
      if (saved && ['commander', 'diagnostics', 'fast_triage'].includes(saved)) return saved;
    } catch {}
    return 'commander';
  });

  const activeRoleConfig = useMemo(
    () => ROLES.find((r) => r.id === activeRole) || ROLES[0],
    [ROLES, activeRole]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'model',
        content: welcomeText,
        timestamp: Date.now(),
        modelUsed: selectedModel || 'gemini-3.8-flash',
      },
    ];
  });

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 'welcome'
          ? { ...m, content: welcomeText, modelUsed: selectedModel || 'gemini-3.8-flash' }
          : m
      )
    );
  }, [welcomeText, selectedModel]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleRoleSelect = (roleId: BotRole) => {
    triggerHapticFeedback('selection');
    setActiveRole(roleId);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, roleId);
    } catch {}
    textareaRef.current?.focus();
  };

  const handleClearHistory = () => {
    triggerHapticFeedback('warning');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
    const fresh: ChatMessage = {
      id: `init-${Date.now()}`,
      role: 'model',
      content: language === 'bg' ? 'Разговорът е изчистен. С какво мога да съдействам?' : 'Conversation cleared. How can I help with the fleet?',
      timestamp: Date.now(),
      modelUsed: activeRoleConfig.model,
    };
    setMessages([fresh]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleStopGeneration = () => {
    triggerHapticFeedback('medium');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const parseActionChips = (text: string) => {
    const actions: ChatMessage['actions'] = [];

    const wolMatch = text.match(/\[ACTION:WOL\s+target=([^\]]+)\]/i);
    if (wolMatch) {
      const target = wolMatch[1].trim();
      const host = hosts.find(
        (h) => h.id.toLowerCase() === target.toLowerCase() || h.mac.toLowerCase() === target.toLowerCase()
      );
      actions.push({
        type: 'wol',
        label: `${language === 'bg' ? 'Събуди' : 'Wake'} ${host ? host.name : target}`,
        payload: host || { id: target, mac: target },
      });
    }

    if (/\[ACTION:RESCAN\]/i.test(text)) {
      actions.push({
        type: 'rescan',
        label: language === 'bg' ? 'Сканирай флот' : 'Rescan Fleet',
      });
    }

    if (/\[ACTION:LAB_MODE\]/i.test(text)) {
      actions.push({
        type: 'lab_mode',
        label: language === 'bg' ? 'Лабораторен режим' : 'Lab Mode',
      });
    }

    return actions;
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    triggerHapticFeedback('light');
    setInputPrompt('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const fleetContext = {
        protocolVersion: 'CST/3.0-SECURE',
        networkMode: isRealWsConnected ? 'Live Real WebSocket' : 'Simulation Lab',
        hostsTotal: hosts.length,
        hostsOnline: hosts.filter((h) => h.isOnline).length,
        hostsSleeping: hosts.filter((h) => !h.isOnline).length,
        avgLatency: latency,
        activeSchedulesCount: wolSchedules.filter((s) => s.enabled).length,
        hosts: hosts.map((h) => ({
          id: h.id,
          name: h.name,
          ip: h.ip,
          mac: h.mac,
          isOnline: h.isOnline,
          ping: h.ping,
          os: h.os,
        })),
      };

      const payload = {
        messages: updated.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        model: activeRoleConfig.model,
        role: activeRole,
        fleetContext,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server responded with ${response.status}`);
      }

      const replyContent = data.reply || '';
      const actions = parseActionChips(replyContent);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: replyContent,
        timestamp: Date.now(),
        modelUsed: data.modelUsed || activeRoleConfig.model,
        durationMs: data.durationMs,
        actions: actions.length > 0 ? actions : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
      triggerHapticFeedback('medium');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content:
          language === 'bg'
            ? `Възникна проблем при връзка с Gemini API (${err.message || 'Error'}).`
            : `Error contacting Gemini API (${err.message || 'Error'}).`,
        timestamp: Date.now(),
        modelUsed: activeRoleConfig.model,
      };
      setMessages((prev) => [...prev, errorMessage]);
      triggerHapticFeedback('warning');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // Auto-dispatch proactive AI diagnostic prompt from HostCard anomaly pill
  useEffect(() => {
    if (pendingChatPrompt && !isLoading) {
      const promptToRun = pendingChatPrompt;
      setPendingChatPrompt(null);
      handleSendMessage(promptToRun);
    }
  }, [pendingChatPrompt, isLoading, setPendingChatPrompt]);

  const handleCopy = (id: string, text: string) => {
    triggerHapticFeedback('light');
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const starterPrompts = useMemo(() => {
    const sleepingCount = hosts.filter((h) => !h.isOnline).length;
    if (language === 'bg') {
      return [
        sleepingCount > 0
          ? `Събуди заспалите машини (${sleepingCount} бр.)`
          : 'Анализирай стабилността и jitter на мрежата',
        'Обясни Anti-Replay защитата на CST/3.0',
        'PowerShell команда за проверка на Wake-on-LAN',
      ];
    }
    return [
      sleepingCount > 0
        ? `Wake sleeping hosts (${sleepingCount} offline)`
        : 'Analyze fleet network stability & jitter',
      'Explain CST/3.0 anti-replay framing',
      'PowerShell command to verify Wake-on-LAN NIC',
    ];
  }, [hosts, language]);

  const renderFormattedContent = (content: string) => {
    const cleanText = content.replace(/\[ACTION:[^\]]+\]/gi, '').trim();
    const parts = cleanText.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const hasLang = /^[a-z0-9_-]+$/i.test(firstLine);
        const lang = hasLang ? firstLine : '';
        const code = (hasLang ? lines.slice(1) : lines).join('\n');

        return (
          <div key={index} className="my-2.5 rounded-2xl bg-black/60 border border-white/10 overflow-hidden text-[12px] font-mono shadow-inner">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] border-b border-white/5 text-[10px] text-slate-400">
              <span className="uppercase tracking-wider font-semibold text-cyan-400">{lang || 'SHELL'}</span>
              <button
                type="button"
                onClick={() => handleCopy(`code-${index}`, code)}
                className="hover:text-white transition flex items-center space-x-1 cursor-pointer min-h-[28px] px-1.5"
              >
                {copiedId === `code-${index}` ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      {language === 'bg' ? 'Копирано' : 'Copied'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{language === 'bg' ? 'Копирай' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto text-slate-200 select-text leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={index} className="space-y-1.5 whitespace-pre-wrap select-text">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-5xl mx-auto px-1 sm:px-3 pb-1 select-none">
      {/* 1. Tier 2 Optical Glass Header Bar with Role Pills */}
      <header className="flex-none py-2 px-3 mb-2 rounded-full bg-[#070c18]/90 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/15 border-t-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.8)] transform-gpu flex items-center justify-between relative gap-2">
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Gemini Identity */}
        <div className="flex items-center space-x-2.5 pl-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.25)] shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-300 icon-sparkle-live" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="font-display text-xs sm:text-[13px] font-bold text-white tracking-tight flex items-center space-x-1.5">
              <span className="truncate">Gemini Copilot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
            </h2>
            <span className="text-[10px] font-mono text-cyan-300/80 truncate">
              {selectedModel || activeRoleConfig.model}
            </span>
          </div>
        </div>

        {/* Segmented Role Selector with Sliding Lens */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="flex items-center glass-liquid-subtle p-1 rounded-full">
            {ROLES.map((r) => {
              const isSelected = activeRole === r.id;
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`group relative px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors duration-200 cursor-pointer flex items-center space-x-1.5 z-10 whitespace-nowrap min-h-[36px] ${
                    isSelected
                      ? 'text-cyan-200'
                      : 'text-white/50 hover:text-white/85'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="geminiRoleLens"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/25 to-sky-500/20 border border-cyan-400/45 shadow-[0_0_12px_rgba(56,189,248,0.25)] -z-10 transform-gpu"
                      transition={{ type: 'spring', stiffness: 480, damping: 24, mass: 0.6 }}
                    />
                  )}
                  <motion.div
                    animate={
                      isSelected
                        ? { scale: 1.18, rotate: r.id === 'commander' ? 10 : r.id === 'diagnostics' ? -8 : 6 }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{ type: 'spring', stiffness: 560, damping: 22 }}
                    className="flex items-center justify-center transform-gpu"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 icon-bubbly" />
                  </motion.div>
                  <span className="font-display">{r.label}</span>
                </button>
              );
            })}
          </div>

          {messages.length > 1 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.08, rotate: -8 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClearHistory}
              className="group w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-liquid-subtle hover:bg-white/10 text-white/55 hover:text-white flex items-center justify-center transition cursor-pointer transform-gpu"
              title={language === 'bg' ? 'Изчисти чата' : 'Clear chat'}
              aria-label={language === 'bg' ? 'Изчисти чата' : 'Clear chat'}
            >
              <Trash2 className="w-4 h-4 icon-bubbly" />
            </motion.button>
          )}
        </div>
      </header>

      {/* 2. Scrollable Conversation Thread with Bouncy Overscroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-3 px-1 space-y-4 bouncy-scroll"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 24, mass: 0.6 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`text-xs sm:text-[13px] leading-relaxed relative ${
                  isUser
                    ? 'glass-liquid-elevated bg-cyan-500/20 text-white border border-cyan-400/35 rounded-[1.5rem] rounded-tr-xs px-4 py-2.5 max-w-[85%] lg:max-w-[75%] shadow-[0_8px_20px_rgba(0,212,255,0.15)]'
                    : 'glass-liquid text-slate-100 rounded-[1.75rem] rounded-tl-xs p-4 max-w-[94%] sm:max-w-[88%] lg:max-w-[82%] border border-white/10 shadow-lg'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 mb-2 text-[10px] text-cyan-300/80 font-mono border-b border-white/6 pb-1.5">
                    <span className="flex items-center space-x-1 font-semibold truncate">
                      <Bot className="w-3 h-3 shrink-0" />
                      <span className="truncate">{msg.modelUsed || activeRoleConfig.model}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {msg.durationMs && (
                        <span className="flex items-center space-x-0.5 text-white/40 tabular-nums">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{msg.durationMs}ms</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content.replace(/\[ACTION:[^\]]+\]/gi, '').trim())}
                        className="text-white/45 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer p-1"
                        title={language === 'bg' ? 'Копирай отговора' : 'Copy response'}
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {renderFormattedContent(msg.content)}

                {/* Interactive Action Pills */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/8 flex flex-wrap gap-2">
                    {msg.actions.map((action, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback('medium');
                          if (action.type === 'wol' && action.payload && onSendWol) {
                            onSendWol(action.payload);
                          } else if (action.type === 'rescan' && onTriggerRescan) {
                            onTriggerRescan();
                          } else if (action.type === 'lab_mode' && onToggleLabMode) {
                            onToggleLabMode();
                          }
                        }}
                        className="samsung-pill px-3.5 py-2 min-h-[40px] bg-cyan-500/18 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer bubble-tap shadow-[0_4px_12px_rgba(0,212,255,0.2)]"
                      >
                        {action.type === 'wol' && <Power className="w-3.5 h-3.5 text-cyan-300" />}
                        {action.type === 'rescan' && <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />}
                        {action.type === 'lab_mode' && <FlaskConical className="w-3.5 h-3.5 text-cyan-300" />}
                        <span>{action.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading Indicator Pill */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2.5 px-4 py-2.5 rounded-full glass-liquid-subtle border border-cyan-400/30 text-cyan-300 text-xs font-mono w-max shadow-md"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{language === 'bg' ? 'Gemini анализира...' : 'Gemini reasoning...'}</span>
          </motion.div>
        )}
      </div>

      {/* Starter Prompts (Shown on fresh chat) */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {starterPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-3.5 py-2 min-h-[40px] rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-xs font-medium cursor-pointer transition bubble-tap"
            >
              ⚡ {prompt}
            </button>
          ))}
        </div>
      )}

      {/* 3. Tier 2 Liquid Glass Input Capsule Bar */}
      <footer className="flex-none pt-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative bg-[#070c18]/90 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/15 border-t-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.8)] transform-gpu rounded-full p-1.5 flex items-center"
        >
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={activeRoleConfig.placeholder}
            rows={1}
            className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400/70 focus:outline-none resize-none max-h-24 leading-relaxed font-medium"
          />

          {isLoading ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 flex items-center justify-center transition cursor-pointer shrink-0 bubble-tap"
              title={language === 'bg' ? 'Спри генерирането' : 'Stop generation'}
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputPrompt.trim()}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer bubble-tap ${
                inputPrompt.trim()
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-[0_0_16px_rgba(0,212,255,0.5)]'
                  : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </form>
      </footer>
    </div>
  );
};

export const GeminiChatbot = React.memo(GeminiChatbotComponent);
