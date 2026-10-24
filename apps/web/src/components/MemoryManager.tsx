import React, { useState } from 'react';
import { HardDrive, Cpu, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { HostDevice } from '../types';
import { useTranslation } from '../i18n/useTranslation';

interface MemoryManagerProps {
  hosts: HostDevice[];
  onUpdateInstructions: (
    hostId: string,
    type: 'persistent' | 'session',
    instructions: string[]
  ) => void;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({
  hosts,
  onUpdateInstructions
}) => {
  const { language } = useTranslation();
  const [selectedHostId, setSelectedHostId] = useState<string>(hosts[0]?.id || 'PC-WORK-01');
  const [newPersistentRule, setNewPersistentRule] = useState('');
  const [newSessionRule, setNewSessionRule] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const selectedHost = hosts.find(h => h.id === selectedHostId) || hosts[0];

  const persistentRules = selectedHost?.persistentInstructions || [];
  const sessionRules = selectedHost?.sessionInstructions || [];

  const handleAddPersistent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersistentRule.trim()) return;
    const updated = [...persistentRules, newPersistentRule.trim()];
    onUpdateInstructions(selectedHost.id, 'persistent', updated);
    setNewPersistentRule('');
    triggerFeedback();
  };

  const handleRemovePersistent = (index: number) => {
    const updated = persistentRules.filter((_, i) => i !== index);
    onUpdateInstructions(selectedHost.id, 'persistent', updated);
    triggerFeedback();
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionRule.trim()) return;
    const updated = [...sessionRules, newSessionRule.trim()];
    onUpdateInstructions(selectedHost.id, 'session', updated);
    setNewSessionRule('');
    triggerFeedback();
  };

  const handleRemoveSession = (index: number) => {
    const updated = sessionRules.filter((_, i) => i !== index);
    onUpdateInstructions(selectedHost.id, 'session', updated);
    triggerFeedback();
  };

  const handleClearSession = () => {
    onUpdateInstructions(selectedHost.id, 'session', []);
    triggerFeedback();
  };

  const triggerFeedback = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Compact Inline Host Selector Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <label className="text-xs text-slate-300 font-semibold shrink-0">
          {language === 'bg' ? 'Избран целеви хост:' : 'Selected Target Host:'}
        </label>
        <div className="flex-1 sm:max-w-xs min-w-0">
          <select
            value={selectedHostId}
            onChange={(e) => setSelectedHostId(e.target.value)}
            className="w-full max-w-full truncate rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 min-h-[44px] text-xs text-cyan-300 font-mono font-bold focus:outline-hidden"
          >
            {hosts.map(h => (
              <option key={h.id} value={h.id} className="bg-slate-950 text-cyan-300">
                {h.id} ({h.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {language === 'bg'
              ? `Контекстът за ${selectedHost?.id} беше успешно синхронизиран през WebSocket!`
              : `Context for ${selectedHost?.id} was successfully synchronized via WebSocket!`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Persistent Instructions (config.json) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 backdrop-blur-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-teal-400 shrink-0" />
                <h3 className="font-bold text-sm text-white">
                  {language === 'bg'
                    ? '1. Постоянни правила (Дългосрочна памет)'
                    : '1. Persistent Rules (Long-Term Storage)'}
                </h3>
              </div>
              <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20 font-mono shrink-0">
                config.json (Disk)
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {language === 'bg' ? (
                <>
                  Тези инструкции се записват в <code className="text-teal-400 font-mono">config.json</code> на хоста и се запазват при рестарт (напр. пътища до програми, браузър по подразбиране).
                </>
              ) : (
                <>
                  These instructions are written to <code className="text-teal-400 font-mono">config.json</code> on the host and remain active across restarts (e.g. executable paths, default browser).
                </>
              )}
            </p>

            {/* List */}
            <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
              {persistentRules.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  {language === 'bg'
                    ? 'Няма конфигурирани постоянни правила за този хост.'
                    : 'No persistent rules configured for this host.'}
                </div>
              ) : (
                persistentRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-200 group"
                  >
                    <span className="leading-relaxed pr-2">{rule}</span>
                    <button
                      onClick={() => handleRemovePersistent(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition shrink-0 cursor-pointer"
                      title={language === 'bg' ? 'Изтрий правило' : 'Delete rule'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddPersistent} className="pt-3 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPersistentRule}
                onChange={(e) => setNewPersistentRule(e.target.value)}
                placeholder={
                  language === 'bg'
                    ? 'Ново постоянно правило (напр. Браузър по подразбиране е Brave)...'
                    : 'New persistent rule (e.g. Default browser is Brave)...'
                }
                className="flex-1 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-hidden placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shrink-0 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'bg' ? 'Добави' : 'Add'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Session-Only Instructions (RAM) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 backdrop-blur-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                <h3 className="font-bold text-sm text-white">
                  {language === 'bg'
                    ? '2. Сесийни инструкции (Временен контекст)'
                    : '2. Session Instructions (Ephemeral Context)'}
                </h3>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                  {language === 'bg' ? 'Само в RAM' : 'RAM Only (Ephemeral)'}
                </span>
                {sessionRules.length > 0 && (
                  <button
                    onClick={handleClearSession}
                    className="text-[10px] text-slate-400 hover:text-rose-400 underline transition cursor-pointer"
                  >
                    {language === 'bg' ? 'Изчисти RAM' : 'Clear RAM'}
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {language === 'bg'
                ? 'Временен контекст, съхраняван само в RAM паметта на Python демона. Изчиства се автоматично при рестартиране на агента.'
                : "Temporary context held exclusively in the Python daemon's RAM. Automatically cleared when the host agent service restarts."}
            </p>

            {/* List */}
            <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
              {sessionRules.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  {language === 'bg'
                    ? 'Няма активни сесийни инструкции в RAM паметта.'
                    : 'No active session instructions in RAM.'}
                </div>
              ) : (
                sessionRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2.5 bg-slate-950/80 border border-indigo-950/40 rounded-xl text-xs text-slate-200 group"
                  >
                    <span className="leading-relaxed pr-2">{rule}</span>
                    <button
                      onClick={() => handleRemoveSession(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition shrink-0 cursor-pointer"
                      title={language === 'bg' ? 'Изтрий правило' : 'Delete rule'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddSession} className="pt-3 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSessionRule}
                onChange={(e) => setNewSessionRule(e.target.value)}
                placeholder={
                  language === 'bg'
                    ? 'Нова сесийна инструкция (напр. Не питай за вторични обновления)...'
                    : 'New session instruction (e.g. Do not prompt for secondary updates)...'
                }
                className="flex-1 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shrink-0 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'bg' ? 'Запази в RAM' : 'Save to RAM'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
