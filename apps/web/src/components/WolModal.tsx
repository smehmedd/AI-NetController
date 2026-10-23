import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  X,
  Copy,
  Check,
  Radio,
  AlertCircle,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Monitor,
  RefreshCw
} from 'lucide-react';
import {
  generateMagicPacket,
  formatHexDump,
  loadWolSchedules,
  saveWolSchedules,
  calculateNextRun,
  formatDaysSummary,
  formatTimeDisplay,
  resolveScheduleTargets,
  DEFAULT_WOL_SCHEDULES,
  WEEKDAYS_MAP
} from '../services/wolService';
import { triggerHapticFeedback } from '../services/hapticService';
import { HostDevice, Weekday, WolPacketPayload, WolSchedule, WolScheduleTargetType } from '../types';

interface WolModalProps {
  device: HostDevice | null;
  hosts?: HostDevice[];
  isOpen: boolean;
  onClose: () => void;
  onSendPacket: (payload: WolPacketPayload, deviceId: string) => void;
  onTriggerSchedule?: (schedule: WolSchedule) => void;
  schedules?: WolSchedule[];
  onUpdateSchedules?: (schedules: WolSchedule[]) => void;
  initialTab?: 'direct' | 'schedules';
}

export const WolModal: React.FC<WolModalProps> = ({
  device,
  hosts = [],
  isOpen,
  onClose,
  onSendPacket,
  onTriggerSchedule,
  schedules: externalSchedules,
  onUpdateSchedules,
  initialTab = 'direct'
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'schedules'>(initialTab);

  // Direct Packet State
  const [mac, setMac] = useState(device?.mac || '00:1A:2B:3C:4D:5E');
  const [broadcastIp, setBroadcastIp] = useState('255.255.255.255');
  const [port, setPort] = useState(9);
  const [secureOnPassword, setSecureOnPassword] = useState('');
  const [packet, setPacket] = useState<WolPacketPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedules State
  const [schedules, setSchedules] = useState<WolSchedule[]>(() => externalSchedules || loadWolSchedules());
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [recentlyFiredId, setRecentlyFiredId] = useState<string | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Form State for Adding/Editing Schedule
  const [formName, setFormName] = useState('Wake Lab PCs (08:00 AM)');
  const [formTargetType, setFormTargetType] = useState<WolScheduleTargetType>('all_lab');
  const [formTargetDeviceId, setFormTargetDeviceId] = useState<string>('');
  const [formTargetMac, setFormTargetMac] = useState<string>('00:1A:2B:3C:4D:5E');
  const [formTime, setFormTime] = useState('08:00');
  const [formDays, setFormDays] = useState<Weekday[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [formBroadcastIp, setFormBroadcastIp] = useState('192.168.1.255');
  const [formPort, setFormPort] = useState(9);
  const [formNotes, setFormNotes] = useState('Automated recurring wake-up for university lab sessions');
  const [formError, setFormError] = useState<string | null>(null);

  // Keep internal schedules in sync if external provided
  useEffect(() => {
    if (externalSchedules) {
      setSchedules(externalSchedules);
    }
  }, [externalSchedules]);

  useEffect(() => {
    if (device) {
      setMac(device.mac);
      setFormTargetDeviceId(device.id);
      setFormTargetMac(device.mac);
    }
  }, [device]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    try {
      const generated = generateMagicPacket(mac, broadcastIp, port, secureOnPassword);
      setPacket(generated);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid MAC address');
      setPacket(null);
    }
  }, [mac, broadcastIp, port, secureOnPassword]);

  const persistSchedules = (newSchedules: WolSchedule[]) => {
    setSchedules(newSchedules);
    saveWolSchedules(newSchedules);
    if (onUpdateSchedules) {
      onUpdateSchedules(newSchedules);
    }
  };

  const handleCopyHex = () => {
    if (packet) {
      navigator.clipboard.writeText(packet.rawHex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendDirect = () => {
    if (!packet) return;
    setIsSending(true);
    triggerHapticFeedback('heavy');
    setTimeout(() => {
      onSendPacket(packet, device?.id || 'CUSTOM-MAC');
      setIsSending(false);
      onClose();
    }, 600);
  };

  const handleToggleSchedule = (id: string, currentEnabled: boolean) => {
    triggerHapticFeedback('light');
    const updated = schedules.map(s => (s.id === id ? { ...s, enabled: !currentEnabled } : s));
    persistSchedules(updated);
  };

  const handleDeleteSchedule = (id: string) => {
    triggerHapticFeedback('medium');
    const updated = schedules.filter(s => s.id !== id);
    persistSchedules(updated);
  };

  const handleRestoreDefaults = () => {
    triggerHapticFeedback('medium');
    persistSchedules(DEFAULT_WOL_SCHEDULES);
  };

  const handleTestTriggerSchedule = (schedule: WolSchedule) => {
    triggerHapticFeedback('heavy');
    setRecentlyFiredId(schedule.id);
    setTimeout(() => setRecentlyFiredId(null), 2500);

    if (onTriggerSchedule) {
      onTriggerSchedule(schedule);
    } else {
      // Fallback direct dispatch
      const targets = resolveScheduleTargets(schedule, hosts);
      targets.forEach(t => {
        try {
          const p = generateMagicPacket(t.mac, schedule.broadcastIp, schedule.port);
          onSendPacket(p, t.id);
        } catch (e) {
          console.error(`Failed to send packet to target ${t.name}:`, e);
        }
      });
    }

    // Update lastTriggered timestamp
    const updated = schedules.map(s =>
      s.id === schedule.id
        ? {
            ...s,
            lastTriggered: `Днес в ${new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}`
          }
        : s
    );
    persistSchedules(updated);
  };

  const handleStartEditSchedule = (schedule: WolSchedule) => {
    triggerHapticFeedback('light');
    setEditingScheduleId(schedule.id);
    setFormName(schedule.name);
    setFormTargetType(schedule.targetType);
    setFormTargetDeviceId(schedule.targetDeviceId || '');
    setFormTargetMac(schedule.targetMac || '00:1A:2B:3C:4D:5E');
    setFormTime(schedule.time);
    setFormDays(schedule.days);
    setFormBroadcastIp(schedule.broadcastIp || '192.168.1.255');
    setFormPort(schedule.port || 9);
    setFormNotes(schedule.notes || '');
    setIsAddingSchedule(true);
  };

  const handleSaveFormSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Моля, въведете наименование на графика.');
      return;
    }
    if (!formTime) {
      setFormError('Моля, задайте час за събуждане.');
      return;
    }
    if (formDays.length === 0) {
      setFormError('Изберете поне един ден от седмицата.');
      return;
    }

    let targetName = 'All Lab PCs (Tag: Lab)';
    if (formTargetType === 'all_offline') {
      targetName = 'All Sleeping / Offline Hosts';
    } else if (formTargetType === 'all_hosts') {
      targetName = 'All Registered Fleet Hosts';
    } else if (formTargetType === 'specific_device') {
      const found = hosts.find(h => h.id === formTargetDeviceId);
      targetName = found ? `${found.name} (${found.ip})` : formTargetDeviceId || 'Specific Host';
    } else if (formTargetType === 'custom_mac') {
      targetName = `Custom NIC (${formTargetMac})`;
    }

    const scheduleObj: WolSchedule = {
      id: editingScheduleId || `sched-${Date.now()}`,
      name: formName.trim(),
      targetType: formTargetType,
      targetDeviceId: formTargetType === 'specific_device' ? formTargetDeviceId : undefined,
      targetMac:
        formTargetType === 'custom_mac'
          ? formTargetMac
          : formTargetType === 'specific_device'
          ? hosts.find(h => h.id === formTargetDeviceId)?.mac || formTargetMac
          : undefined,
      targetName,
      time: formTime,
      days: formDays,
      enabled: true,
      broadcastIp: formBroadcastIp,
      port: formPort,
      notes: formNotes.trim(),
      createdTimestamp: Date.now()
    };

    let updated: WolSchedule[];
    if (editingScheduleId) {
      updated = schedules.map(s => (s.id === editingScheduleId ? scheduleObj : s));
    } else {
      updated = [scheduleObj, ...schedules];
    }

    persistSchedules(updated);
    triggerHapticFeedback('medium');
    setIsAddingSchedule(false);
    setEditingScheduleId(null);
    setFormError(null);
  };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const handleCopyConfigJson = () => {
    navigator.clipboard.writeText(JSON.stringify(schedules, null, 2));
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const toggleDayInForm = (day: Weekday) => {
    triggerHapticFeedback('light');
    if (formDays.includes(day)) {
      if (formDays.length > 1) {
        setFormDays(formDays.filter(d => d !== day));
      }
    } else {
      setFormDays([...formDays, day]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
              mass: 0.8
            }}
            className="
              relative z-10 w-full max-w-3xl
              rounded-t-[2.5rem]
              bg-[#091020]/95 backdrop-blur-3xl
              border border-white/15 border-t-white/25
              shadow-[0_24px_64px_rgba(0,0,0,0.85)]
              flex flex-col overflow-hidden
              transform-gpu will-change-transform
              max-h-[92vh]
            "
        >
          {/* Tactile Drag Handle */}
          <div className="pt-3 pb-1 cursor-grab active:cursor-grabbing w-full flex justify-center">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-white/[0.02]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-2xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white text-base tracking-tight">
                    Wake-on-LAN Контролер
                  </h3>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    UDP 9
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  102-байтови Magic Packets • Рекурентни графици
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              title="Затвори"
              aria-label="Затвори"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800/80 bg-slate-900/40 px-4 pt-2 gap-2 overflow-x-auto scrollbar-none">
            <button
              id="tab-direct-packet"
              onClick={() => {
                triggerHapticFeedback('light');
                setActiveTab('direct');
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
                activeTab === 'direct'
                  ? 'bg-slate-950 text-cyan-300 border-slate-800 border-b-transparent shadow-sm'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Директен Magic Packet (UDP 9)</span>
            </button>

            <button
              id="tab-recurring-schedules"
              onClick={() => {
                triggerHapticFeedback('light');
                setActiveTab('schedules');
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
                activeTab === 'schedules'
                  ? 'bg-slate-950 text-amber-300 border-slate-800 border-b-transparent shadow-sm'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Графици за събуждане (Scheduler)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {schedules.filter(s => s.enabled).length} активни
              </span>
            </button>
          </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* ========================================================================= */}
          {/* TAB 1: DIRECT PACKET TRANSMISSION & HEX INSPECTOR                        */}
          {/* ========================================================================= */}
          {activeTab === 'direct' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Target Host Information Card */}
              {device && (
                <div className="bg-[#071120] border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-cyan-950/60 rounded-xl border border-cyan-500/20 text-cyan-400">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                        Целеви Host Компютър
                      </span>
                      <div className="text-sm font-bold text-white mt-0.5">{device.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: {device.id} • IP: {device.ip} • NIC: {device.mac}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                        device.isOnline
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {device.isOnline ? 'Online (Активен)' : 'Standby / Готов за WoL'}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Хардуерен MAC Адрес (Целева Мрежова Карта NIC)
                  </label>
                  <input
                    type="text"
                    value={mac}
                    onChange={(e) => setMac(e.target.value)}
                    placeholder="00:1A:2B:3C:4D:5E"
                    className="w-full bg-[#040A15] border border-cyan-500/30 rounded-xl px-3.5 py-2 text-sm text-cyan-100 font-mono focus:border-cyan-400 focus:outline-hidden shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    UDP Порт (Port 9 / 7)
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-[#040A15] border border-cyan-500/30 rounded-xl px-3.5 py-2 text-sm text-cyan-100 font-mono focus:border-cyan-400 focus:outline-hidden shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Broadcast IP Адрес за субнет излъчване
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={broadcastIp}
                    onChange={(e) => setBroadcastIp(e.target.value)}
                    placeholder="255.255.255.255"
                    className="flex-1 bg-[#040A15] border border-cyan-500/30 rounded-xl px-3.5 py-2 text-sm text-cyan-100 font-mono focus:border-cyan-400 focus:outline-hidden shadow-inner"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastIp('255.255.255.255')}
                      className="px-3 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition font-mono whitespace-nowrap"
                    >
                      Global (255.255.255.255)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastIp('192.168.1.255')}
                      className="px-3 py-1.5 text-xs bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 rounded-xl border border-cyan-500/30 transition font-mono whitespace-nowrap"
                    >
                      Subnet (.255)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>SecureOn Парола (Опционален 6-байтов ключ / AMD WoL стандарт)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">108 байта при активна парола</span>
                </label>
                <input
                  type="text"
                  value={secureOnPassword}
                  onChange={(e) => setSecureOnPassword(e.target.value)}
                  placeholder="00:11:22:33:44:55 или празно за стандартен 102B пакет"
                  className="w-full bg-[#040A15] border border-cyan-500/30 rounded-xl px-3.5 py-2 text-sm text-cyan-100 font-mono focus:border-cyan-400 focus:outline-hidden shadow-inner"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Hex Dump Inspector */}
              {packet && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      Raw Ethernet Payload Дъмпер ({packet.bytesCount} байта)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyHex}
                      className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-300 transition px-2 py-1 rounded-lg hover:bg-white/5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Копирано!' : 'Копирай Raw Hex'}</span>
                    </button>
                  </div>

                  <div className="bg-[#040A15] border border-cyan-500/20 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-40 shadow-inner">
                    <div className="text-cyan-400/80 mb-1 border-b border-cyan-500/20 pb-1 font-bold">
                      OFFSET  00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
                    </div>
                    {formatHexDump(packet.rawHex).map((line, idx) => (
                      <div key={idx} className="hover:bg-cyan-950/40 px-1 rounded transition-colors">
                        {idx === 0 ? (
                          <span>
                            <span className="text-slate-500">{line.slice(0, 6)}</span>
                            <span className="text-amber-400 font-bold">{line.slice(6, 24)}</span>
                            <span className="text-emerald-400">{line.slice(24)}</span>
                          </span>
                        ) : (
                          <span>
                            <span className="text-slate-500">{line.slice(0, 6)}</span>
                            <span className="text-emerald-400">{line.slice(6)}</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>
                      <strong className="text-amber-400">Жълто:</strong> 6-байтов синхро префикс (0xFF).
                    </span>
                    <span>
                      <strong className="text-emerald-400">Зелено:</strong> 16 повторения на целевия хардуерен MAC адрес.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RECURRING WOL SCHEDULES (PERSISTENT CONFIG)                        */}
          {/* ========================================================================= */}
          {activeTab === 'schedules' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Persistent Engine Banner */}
              <div className="bg-[#071120] border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white font-display">
                        Устойчиви графици за събуждане (Recurring Schedules)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Фоновият таймер проверява времето всяка минута и изпраща UDP Magic Packet (напр. събуждане на CST Lab компютрите в 08:00 ч.).
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setIsAddingSchedule(!isAddingSchedule);
                      setEditingScheduleId(null);
                      setFormError(null);
                    }}
                    className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-full transition border shadow-md ${
                      isAddingSchedule
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                    }`}
                  >
                    {isAddingSchedule ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isAddingSchedule ? 'Затвори формата' : 'Нов График'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-700/80 hover:bg-white/5 transition"
                    title="Възстанови стандартните Lab графици"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Creator / Editor Form */}
              {isAddingSchedule && (
                <form
                  onSubmit={handleSaveFormSchedule}
                  className="bg-[#050C17] border border-cyan-500/40 rounded-xl p-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      {editingScheduleId ? 'Редактиране на График' : 'Създаване на Нов График за Събуждане'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingSchedule(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {formError && (
                    <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Schedule Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Име на графика / Задача
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="напр. Събуждане на Lab компютрите (08:00)"
                        className="w-full bg-[#0A1628] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-slate-100 font-sans focus:border-cyan-400 focus:outline-hidden"
                      />
                    </div>

                    {/* Target Scope */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Целеви компютри (Target Scope)
                      </label>
                      <select
                        value={formTargetType}
                        onChange={e => setFormTargetType(e.target.value as WolScheduleTargetType)}
                        className="w-full bg-[#0A1628] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-slate-100 font-sans focus:border-cyan-400 focus:outline-hidden"
                      >
                        <option value="all_lab">🏢 Всички Lab компютри (Tag: Lab)</option>
                        <option value="all_offline">💤 Всички спящи / офлайн компютри</option>
                        <option value="all_hosts">🌐 Цялата работна флота (Всички)</option>
                        <option value="specific_device">💻 Конкретен компютър от списъка</option>
                        <option value="custom_mac">🔧 Потребителски MAC адрес</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional Target Inputs */}
                  {formTargetType === 'specific_device' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Избор на конкретен компютър
                      </label>
                      <select
                        value={formTargetDeviceId}
                        onChange={e => {
                          setFormTargetDeviceId(e.target.value);
                          const h = hosts.find(item => item.id === e.target.value);
                          if (h) setFormTargetMac(h.mac);
                        }}
                        className="w-full bg-[#0A1628] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-hidden"
                      >
                        <option value="">-- Изберете компютър от мрежата --</option>
                        {hosts.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.id}) • IP: {h.ip} • MAC: {h.mac} [{h.isOnline ? 'ONLINE' : 'SLEEPING'}]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formTargetType === 'custom_mac' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Хардуерен MAC Адрес (NIC)
                      </label>
                      <input
                        type="text"
                        value={formTargetMac}
                        onChange={e => setFormTargetMac(e.target.value)}
                        placeholder="00:1A:2B:3C:4D:5E"
                        className="w-full bg-[#0A1628] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-hidden"
                      />
                    </div>
                  )}

                  {/* Wake-Up Time & Presets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Час на събуждане (24-часов формат)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={formTime}
                          onChange={e => setFormTime(e.target.value)}
                          className="flex-1 bg-[#0A1628] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-200 font-mono font-bold focus:border-cyan-400 focus:outline-hidden"
                        />
                        <span className="text-xs text-slate-400 font-mono">
                          {formatTimeDisplay(formTime)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Time Presets */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Бързи предварително зададени часове:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { time: '08:00', label: '08:00 AM (Lab Начало)' },
                          { time: '09:00', label: '09:00 AM' },
                          { time: '13:30', label: '13:30 PM (Следобед)' },
                          { time: '23:00', label: '23:00 PM (Audit)' }
                        ].map(preset => (
                          <button
                            key={preset.time}
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback('light');
                              setFormTime(preset.time);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-mono transition border ${
                              formTime === preset.time
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recurring Days Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Повтаряне в дни от седмицата:
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHapticFeedback('light');
                            setFormDays(['mon', 'tue', 'wed', 'thu', 'fri']);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                          Делнични (Пон-Пет)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHapticFeedback('light');
                            setFormDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                          Всеки ден
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS_MAP.map(day => {
                        const isSelected = formDays.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDayInForm(day.id)}
                            className={`py-2 text-center rounded-lg text-xs font-mono font-bold transition-all border ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <div>{day.short}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Network Subnet & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Broadcast IP
                      </label>
                      <input
                        type="text"
                        value={formBroadcastIp}
                        onChange={e => setFormBroadcastIp(e.target.value)}
                        className="w-full bg-[#0A1628] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Описание / Забележка
                      </label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        placeholder="напр. Автоматично събуждане за студенти преди упражнение"
                        className="w-full bg-[#0A1628] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-sans focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Form Submission Buttons */}
                  <div className="flex justify-end space-x-2 pt-2 border-t border-cyan-500/20">
                    <button
                      type="button"
                      onClick={() => setIsAddingSchedule(false)}
                      className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition"
                    >
                      Отказ
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingScheduleId ? 'Запази промените' : 'Запази в Persistent Config'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Schedules List */}
              <div className="space-y-3">
                {schedules.length === 0 ? (
                  <div className="text-center py-10 bg-[#071120] border border-dashed border-slate-700/60 rounded-xl p-6">
                    <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Няма конфигурирани графици за събуждане</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Добавете нов график или възстановете фабричните настройки за CST лабораторията.
                    </p>
                    <button
                      type="button"
                      onClick={handleRestoreDefaults}
                      className="mt-3 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition"
                    >
                      Зареди стандартни Lab графици
                    </button>
                  </div>
                ) : (
                  schedules.map(schedule => {
                    const nextRun = calculateNextRun(schedule);
                    const isFired = recentlyFiredId === schedule.id;
                    const resolvedTargets = resolveScheduleTargets(schedule, hosts);

                    return (
                      <div
                        key={schedule.id}
                        className={`rounded-xl p-4 transition-all duration-200 border ${
                          schedule.enabled
                            ? 'bg-[#071120] border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.06)]'
                            : 'bg-[#050C17]/60 border-slate-800/80 opacity-70'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  schedule.enabled
                                    ? 'bg-cyan-400 shadow-[0_0_8px_#00F0FF] animate-pulse'
                                    : 'bg-slate-600'
                                }`}
                              />
                              <h4 className="text-sm font-bold text-white font-display tracking-wide">
                                {schedule.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                                {schedule.targetType === 'all_lab'
                                  ? '🏢 CST Lab Workstations'
                                  : schedule.targetType === 'all_offline'
                                  ? '💤 All Offline Hosts'
                                  : schedule.targetType === 'specific_device'
                                  ? `💻 ${schedule.targetDeviceId || 'Host'}`
                                  : '🌐 Fleet'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400">
                              {schedule.notes || 'Автоматично излъчване на Magic Packet към мрежовия субнет.'}
                            </p>
                          </div>

                          {/* Cyber Toggle Switch */}
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSchedule(schedule.id, schedule.enabled)}
                              className={`w-12 h-6 rounded-full p-0.5 transition-all duration-200 flex items-center border ${
                                schedule.enabled
                                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.3)] justify-end'
                                  : 'bg-slate-900 border-slate-700 justify-start'
                              }`}
                              title={schedule.enabled ? 'Деактивирай график' : 'Активирай график'}
                            >
                              <div
                                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                                  schedule.enabled ? 'bg-cyan-400 shadow-[0_0_6px_#00F0FF]' : 'bg-slate-600'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Middle Stats Row */}
                        <div className="mt-3 pt-3 border-t border-cyan-500/10 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          {/* Time & Clock */}
                          <div className="flex items-center space-x-2.5">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-base font-bold text-white font-mono tracking-tight">
                                {schedule.time}
                              </div>
                              <div className="text-[10px] text-amber-300 font-mono">
                                {formatTimeDisplay(schedule.time).match(/\(([^)]+)\)/)?.[1] || '24-часов'}
                              </div>
                            </div>
                          </div>

                          {/* Days Repetition */}
                          <div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">
                              {formatDaysSummary(schedule.days)}
                            </div>
                            <div className="flex gap-1">
                              {WEEKDAYS_MAP.map(d => {
                                const isDayActive = schedule.days.includes(d.id);
                                return (
                                  <span
                                    key={d.id}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                      isDayActive
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-slate-900 text-slate-600 border border-slate-800'
                                    }`}
                                  >
                                    {d.short[0]}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Next Run Calculation */}
                          <div className="text-right sm:text-left">
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">
                              Следващо изпълнение:
                            </span>
                            <span className="text-xs font-semibold text-emerald-400 font-mono">
                              {schedule.enabled && nextRun
                                ? `${nextRun.relativeText} (след ${nextRun.timeUntilFormatted})`
                                : 'Паузиран'}
                            </span>
                          </div>
                        </div>

                        {/* Targets Breakdown & Action Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-cyan-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5 flex-wrap">
                            <span className="text-cyan-400">🎯 {resolvedTargets.length} целеви компютъра:</span>
                            {resolvedTargets.map(t => (
                              <span key={t.id} className="text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded">
                                {t.name} ({t.mac})
                              </span>
                            ))}
                            <span className="text-slate-500">• {schedule.broadcastIp}:{schedule.port} UDP</span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                            {/* Manual Test Trigger Button */}
                            <button
                              type="button"
                              onClick={() => handleTestTriggerSchedule(schedule)}
                              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                                isFired
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_10px_#00FFA3]'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                              }`}
                              title="Тестово ръчно излъчване на Magic Packet за този график"
                            >
                              {isFired ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                              <span>{isFired ? 'Излъчено!' : 'Събуди сега'}</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEditSchedule(schedule)}
                              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-white/5 transition"
                              title="Редактирай"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/5 transition"
                              title="Изтрий"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {schedule.lastTriggered && (
                          <div className="mt-2 text-[10px] text-slate-500 font-mono">
                            Последно събуждане: <span className="text-slate-400">{schedule.lastTriggered}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-cyan-500/20 bg-[#040A15]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-[calc(env(safe-area-inset-bottom,16px)+0.75rem)]">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            {activeTab === 'direct' ? (
              <>
                <span>Протокол:</span>
                <span className="font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  UDP Broadcast (Port {port})
                </span>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCopyConfigJson}
                  className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 transition text-[11px] min-h-[36px] py-1 px-2 rounded"
                >
                  {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedConfig ? 'Конфигурацията е копирана!' : 'Копирай Config JSON'}</span>
                </button>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-slate-500">
                  {schedules.length} графика ({schedules.filter(s => s.enabled).length} активни)
                </span>
              </>
            )}
          </div>

          <div className="flex space-x-2.5 self-end sm:self-center items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 min-h-[44px] text-xs font-semibold text-slate-400 hover:text-white rounded-full transition hover:bg-white/5 flex items-center justify-center cursor-pointer"
            >
              Затвори
            </button>

            {activeTab === 'direct' && (
              <button
                type="button"
                disabled={!packet || isSending}
                onClick={handleSendDirect}
                className="flex items-center justify-center space-x-2 px-6 py-2.5 min-h-[44px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-full text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              >
                <Zap className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
                <span>{isSending ? 'Излъчване...' : 'Изпрати Magic Packet'}</span>
              </button>
            )}
          </div>
        </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};
