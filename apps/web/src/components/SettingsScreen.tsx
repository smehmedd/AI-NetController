import React, { useState } from 'react';
import {
  Brain,
  Radio,
  FileText,
  ShieldAlert,
  Fingerprint,
  Bell,
  Activity,
  Info,
  ArrowUpCircle,
  ChevronRight,
  Code,
  Terminal,
  Check,
  RefreshCw,
  Clock,
  Languages,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHapticFeedback } from '../services/hapticService';
import { WolSchedule } from '../types';
import { WolEnergyCalculator } from './WolEnergyCalculator';
import { useTranslation } from '../i18n/useTranslation';
import { LanguageToggle } from './ui/LanguageToggle';
import { useUIStore } from '../store/uiStore';

interface SettingsScreenProps {
  onOpenPersistentInstructions: () => void;
  onOpenCodeViewer: () => void;
  onOpenWsConfig: () => void;
  onOpenTerminalLogs: () => void;
  onOpenUpdateCenter?: () => void;
  onOpenWolScheduler?: () => void;
  activeWolSchedulesCount?: number;
  wolSchedules?: WolSchedule[];
  hostsCount?: number;
}

const SettingsScreenComponent: React.FC<SettingsScreenProps> = ({
  onOpenPersistentInstructions,
  onOpenCodeViewer,
  onOpenWsConfig,
  onOpenTerminalLogs,
  onOpenUpdateCenter,
  onOpenWolScheduler,
  activeWolSchedulesCount,
  wolSchedules,
  hostsCount
}) => {
  const { t } = useTranslation();

  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelProvider, setNewModelProvider] = useState<'gemini' | 'ollama' | 'deepseek' | 'custom'>('gemini');
  const [newModelDesc, setNewModelDesc] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestingModel, setIsTestingModel] = useState(false);

  const [isAutoDiscovery, setIsAutoDiscovery] = useState(true);
  const [isHitlEnabled, setIsHitlEnabled] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isCommandConfirmations, setIsCommandConfirmations] = useState(true);
  const [isSystemStateAlerts, setIsSystemStateAlerts] = useState(true);

  const [modelsList, setModelsList] = useState<Array<{ id: string; name: string; description: string; provider: string }>>([
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)', description: 'Ultra-fast multimodal reasoning model for real-time fleet triage & mouse control', provider: 'gemini' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'High-speed agentic model with structured tool-use capabilities', provider: 'gemini' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Deep reasoning model for complex network diagnostics and security audits', provider: 'gemini' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Lightweight high-efficiency model for quick sysadmin tasks', provider: 'gemini' },
    { id: 'deepseek-r1:latest', name: 'DeepSeek-R1 (Local / Ollama)', description: 'Reasoning model for offline air-gapped network management', provider: 'deepseek' },
  ]);

  const handleTestModel = async (modelId: string) => {
    setIsTestingModel(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(`⚡ Online (${data.latencyMs}ms)`);
      } else {
        setTestResult(`⚠️ ${data.error || 'Test failed'}`);
      }
    } catch {
      setTestResult('⚠️ Test connection error');
    } finally {
      setIsTestingModel(false);
    }
  };

  const handleAddCustomModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelId.trim() || !newModelName.trim()) return;

    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newModelId,
          name: newModelName,
          provider: newModelProvider,
          description: newModelDesc || 'Custom Model Endpoint',
        }),
      });
      const data = await res.json();
      if (data.success && data.models) {
        setModelsList(data.models);
        setSelectedModel(data.model.id);
        setNewModelId('');
        setNewModelName('');
        setNewModelDesc('');
        setIsAddModelOpen(false);
        triggerHapticFeedback('medium');
      }
    } catch (err) {
      console.error('Failed to save model:', err);
    }
  };

  const CyberToggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => {
        triggerHapticFeedback('light');
        onChange(!checked);
      }}
      className="p-1 cursor-pointer"
      aria-label="Toggle setting"
    >
      <div
        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center relative border ${
          checked
            ? 'bg-cyan-500/20 border-cyan-400/50'
            : 'bg-white/10 border-white/10'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`w-5 h-5 rounded-full shadow-xs ${
            checked ? 'bg-cyan-300 shadow-[0_0_10px_#22d3ee]' : 'bg-white/60'
          }`}
          style={{ marginLeft: checked ? 'auto' : '0' }}
        />
      </div>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="w-full flex flex-col space-y-6 max-w-3xl mx-auto pb-[calc(env(safe-area-inset-bottom,24px)+6.5rem)] select-none"
    >
      {/* SECTION 1: GENERAL & AI */}
      <div className="space-y-2 relative z-30">
        <span className="text-[11px] font-mono text-cyan-300/80 uppercase tracking-widest px-2 font-semibold">
          {t('settings_general_title')}
        </span>

        <div className="glass-liquid-elevated w-full rounded-[2rem] p-1 border border-white/12 shadow-xl divide-y divide-white/[0.05] relative overflow-visible">
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
          {/* Row 0: Language */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Languages className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_language')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_language_desc')}
                </span>
              </div>
            </div>
            <LanguageToggle variant="segmented" />
          </div>

          {/* Row 1: Dynamic AI Model Selector & Management */}
          <div className="p-3.5 sm:p-4 flex flex-col space-y-3 relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center border border-cyan-500/20 shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                    {t('settings_ai_model')}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {t('settings_ai_model_desc')}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleTestModel(selectedModel)}
                  disabled={isTestingModel}
                  className="px-2.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/10 text-cyan-300 text-xs font-mono transition cursor-pointer border border-white/10"
                  title="Test Model Connection"
                >
                  {isTestingModel ? <RefreshCw className="w-3 h-3 animate-spin" /> : testResult || 'Test'}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-cyan-300 text-xs font-mono font-medium flex items-center space-x-2 transition cursor-pointer border border-white/10"
                >
                  <span>{selectedModel}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-90' : ''}`} />
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {isModelDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setIsModelDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className="absolute right-4 top-14 w-80 rounded-2xl bg-[#0a1224]/98 backdrop-blur-3xl border border-white/20 p-2.5 z-[70] shadow-2xl space-y-1.5 max-h-80 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <span>Available AI Models</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModelDropdownOpen(false);
                          setIsAddModelOpen(true);
                        }}
                        className="text-cyan-400 hover:underline cursor-pointer font-bold"
                      >
                        + Add Custom Model
                      </button>
                    </div>

                    {modelsList.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback('light');
                          setSelectedModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex flex-col transition cursor-pointer ${
                          selectedModel === m.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate">{m.name}</span>
                          {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate mt-0.5">{m.description}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isAddModelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="w-full max-w-md rounded-3xl glass-liquid-elevated bg-[#0c1220]/95 border border-cyan-400/40 p-6 space-y-4 text-white shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="text-base font-bold text-cyan-300">Add / Update AI Model</h3>
                      <button
                        type="button"
                        onClick={() => setIsAddModelOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddCustomModel} className="space-y-3 font-mono text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Model Identifier (ID)</label>
                        <input
                          type="text"
                          required
                          value={newModelId}
                          onChange={(e) => setNewModelId(e.target.value)}
                          placeholder="e.g. gemini-2.5-flash or ollama/llama3.3"
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Display Name</label>
                        <input
                          type="text"
                          required
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          placeholder="e.g. Custom Gemini 2.5 Flash"
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Provider Type</label>
                        <select
                          value={newModelProvider}
                          onChange={(e) => setNewModelProvider(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white outline-none focus:border-cyan-400"
                        >
                          <option value="gemini">Google Gemini API</option>
                          <option value="deepseek">DeepSeek AI</option>
                          <option value="ollama">Local Ollama / Open Source</option>
                          <option value="custom">Custom Endpoint</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Description</label>
                        <input
                          type="text"
                          value={newModelDesc}
                          onChange={(e) => setNewModelDesc(e.target.value)}
                          placeholder="Short description of capabilities"
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="pt-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsAddModelOpen(false)}
                          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
                        >
                          Save Model
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Row 2: Auto Discovery */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_autodiscovery')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_autodiscovery_desc')}
                </span>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                triggerHapticFeedback('light');
                setIsAutoDiscovery(!isAutoDiscovery);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition shrink-0 cursor-pointer ${
                isAutoDiscovery
                  ? 'bg-emerald-500/18 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,230,118,0.2)]'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {isAutoDiscovery ? 'AUTO-DISCOVERY' : 'MANUAL IP'}
            </motion.button>
          </div>

          {/* Row 3: Memory / Persistent Instructions */}
          <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              triggerHapticFeedback('light');
              onOpenPersistentInstructions();
            }}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.035] transition group"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-violet-500/12 text-violet-300 flex items-center justify-center border border-violet-500/20 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_memory')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_memory_desc')}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </motion.div>

          {/* Row 4: WoL Scheduler */}
          <motion.div
            id="settings-wol-scheduler-row"
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              triggerHapticFeedback('light');
              if (onOpenWolScheduler) onOpenWolScheduler();
            }}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.035] transition group"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/12 text-amber-300 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_wol_scheduler')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_wol_scheduler_desc')}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-mono text-amber-300/90">
                {activeWolSchedulesCount !== undefined ? `${activeWolSchedulesCount} ${t('settings_active_schedules')}` : 'Config'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* SECTION 2: ENERGY CALCULATOR */}
      <WolEnergyCalculator wolSchedules={wolSchedules} defaultHostCount={hostsCount || 15} />

      {/* SECTION 3: SECURITY & ACCESS */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-cyan-300/80 uppercase tracking-widest px-2 font-semibold">
          {t('settings_hitl').split('(')[0] || 'SECURITY'}
        </span>

        <div className="glass-liquid-elevated w-full rounded-[2rem] p-1 border border-white/12 shadow-xl divide-y divide-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/12 text-rose-300 flex items-center justify-center border border-rose-500/20 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_hitl')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_hitl_desc')}
                </span>
              </div>
            </div>
            <CyberToggle checked={isHitlEnabled} onChange={setIsHitlEnabled} />
          </div>

          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_biometric')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_biometric_desc')}
                </span>
              </div>
            </div>
            <CyberToggle checked={isBiometricEnabled} onChange={setIsBiometricEnabled} />
          </div>
        </div>
      </div>

      {/* SECTION 4: NOTIFICATIONS & ALERTS */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-cyan-300/80 uppercase tracking-widest px-2 font-semibold">
          {t('settings_alerts')}
        </span>

        <div className="glass-liquid-elevated w-full rounded-[2rem] p-1 border border-white/12 shadow-xl divide-y divide-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_confirmations')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_confirmations_desc')}
                </span>
              </div>
            </div>
            <CyberToggle checked={isCommandConfirmations} onChange={setIsCommandConfirmations} />
          </div>

          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/12 text-emerald-300 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_alerts')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_alerts_desc')}
                </span>
              </div>
            </div>
            <CyberToggle checked={isSystemStateAlerts} onChange={setIsSystemStateAlerts} />
          </div>
        </div>
      </div>

      {/* SECTION 5: AUDIT & SYSTEM CONTROLS */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-cyan-300/80 uppercase tracking-widest px-2 font-semibold">
          {t('settings_audit_title')}
        </span>

        <div className="glass-liquid-elevated w-full rounded-[2rem] p-1 border border-white/12 shadow-xl divide-y divide-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
          <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              triggerHapticFeedback('light');
              onOpenCodeViewer();
            }}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.035] transition group"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_code_viewer')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_code_viewer_desc')}
                </span>
              </div>
            </div>
            <Code className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors shrink-0" />
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              triggerHapticFeedback('light');
              if (onOpenUpdateCenter) onOpenUpdateCenter();
            }}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.035] transition group"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_update_center')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_update_center_desc')}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-mono text-amber-300/90">
                5 available
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              triggerHapticFeedback('light');
              onOpenWsConfig();
            }}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.035] transition group"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/12 text-emerald-300 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <ArrowUpCircle className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_ws_config')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_ws_config_desc')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              triggerHapticFeedback('light');
              onOpenTerminalLogs();
            }}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.035] transition group"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-violet-500/12 text-violet-300 flex items-center justify-center border border-violet-500/20 shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {t('settings_system_logs')}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {t('settings_system_logs_desc')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const SettingsScreen = React.memo(SettingsScreenComponent);
