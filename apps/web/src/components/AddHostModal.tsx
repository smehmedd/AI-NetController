import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Monitor,
  Laptop,
  Server,
  Cpu,
  Radio,
  CheckCircle2,
  Sparkles,
  Tag,
  Hash,
  Activity,
  Layers
} from 'lucide-react';
import { HostDevice, OSType } from '../types';
import { triggerHapticFeedback } from '../services/hapticService';

export interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHost: (newHost: HostDevice) => void;
  existingHostsCount?: number;
}

export const AddHostModal: React.FC<AddHostModalProps> = ({
  isOpen,
  onClose,
  onAddHost,
  existingHostsCount = 3
}) => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('192.168.1.');
  const [mac, setMac] = useState('');
  const [deviceType, setDeviceType] = useState<'pc' | 'laptop' | 'server'>('pc');
  const [os, setOs] = useState<OSType>('windows');
  const [initialStatus, setInitialStatus] = useState<'ready' | 'sleeping'>('ready');
  const [tagsInput, setTagsInput] = useState('Lab, Primary');
  const [port, setPort] = useState('8765');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Auto-generate random valid MAC address helper
  const handleGenerateMac = () => {
    triggerHapticFeedback('light');
    const hexDigits = '0123456789ABCDEF';
    const macParts: string[] = [];
    for (let i = 0; i < 6; i++) {
      let part = hexDigits[Math.floor(Math.random() * 16)] + hexDigits[Math.floor(Math.random() * 16)];
      // First byte unicast (even 2nd hex digit)
      if (i === 0) part = '00';
      macParts.push(part);
    }
    setMac(macParts.join(':'));
    if (errors.mac) {
      setErrors(prev => ({ ...prev, mac: '' }));
    }
  };

  // Quick preset templates
  const handleApplyPreset = (type: 'workstation' | 'server' | 'laptop') => {
    triggerHapticFeedback('light');
    const suffix = existingHostsCount + 1;
    if (type === 'workstation') {
      setName(`DEV-WORKSTATION-0${suffix}`);
      setIp(`192.168.1.${100 + suffix}`);
      setDeviceType('pc');
      setOs('windows');
      setInitialStatus('ready');
      setTagsInput('Windows, Dev, Lab');
      handleGenerateMac();
    } else if (type === 'server') {
      setName(`BACKUP-NAS-0${suffix}`);
      setIp(`192.168.1.${200 + suffix}`);
      setDeviceType('server');
      setOs('linux');
      setInitialStatus('ready');
      setTagsInput('Linux, Storage, AI, Docker');
      handleGenerateMac();
    } else {
      setName(`MOBILE-LAPTOP-0${suffix}`);
      setIp(`192.168.1.${70 + suffix}`);
      setDeviceType('laptop');
      setOs('windows');
      setInitialStatus('sleeping');
      setTagsInput('Windows, Mobile, WoL');
      handleGenerateMac();
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Въведете име на хоста';
    }

    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ip.trim() || !ipRegex.test(ip.trim())) {
      newErrors.ip = 'Невалиден IPv4 адрес (напр. 192.168.1.120)';
    }

    const macClean = mac.trim().replace(/[:-]/g, '');
    if (!macClean || macClean.length !== 12 || !/^[0-9A-Fa-f]{12}$/.test(macClean)) {
      newErrors.mac = 'Невалиден MAC адрес (12 шестнайсетични знака, напр. 00:1A:2B:3C:4D:5E)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      triggerHapticFeedback('heavy');
      return;
    }

    triggerHapticFeedback('medium');

    // Format MAC with colons
    const cleanMac = mac.trim().replace(/[:-]/g, '').toUpperCase();
    const formattedMac = cleanMac.match(/.{1,2}/g)?.join(':') || mac.toUpperCase();

    // Clean tags
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (tags.length === 0) {
      tags.push(os === 'windows' ? 'Windows' : 'Linux');
    }

    const isOnline = initialStatus === 'ready';

    const newHost: HostDevice = {
      id: name.trim().toUpperCase().replace(/\s+/g, '-'),
      name: name.trim().toUpperCase(),
      ip: ip.trim(),
      mac: formattedMac,
      os,
      deviceType,
      isOnline,
      lastSeen: isOnline ? 'Active (Manual host added)' : 'Offline (Ready for Wake-on-LAN)',
      tags,
      specStatus: isOnline ? 'READY' : 'SLEEPING',
      cpuUsage: isOnline ? Math.floor(Math.random() * 25) + 10 : 0,
      ramUsage: isOnline ? Math.floor(Math.random() * 35) + 30 : 0,
      diskUsage: '256 GB / 1024 GB (25%)',
      persistentInstructions: [
        `Custom host configured on port ${port || '8765'}`
      ],
      sessionInstructions: []
    };

    onAddHost(newHost);
    onClose();

    // Reset form
    setName('');
    setIp('192.168.1.');
    setMac('');
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-slate-900/95 border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
        >
          {/* Cyber Accent Top Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display tracking-wide uppercase">
                  Добавяне на Хост Машина
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Ръчно конфигуриране в CST мрежовия флот
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                onClose();
              }}
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 flex items-center justify-center transition border border-slate-700/60 cursor-pointer"
              aria-label="Затвори"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Quick Presets Row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Бързи шаблони (Presets):
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('workstation')}
                  className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-cyan-950/40 border border-slate-700/70 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 hover:text-cyan-300 flex items-center justify-center space-x-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Десктоп PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('server')}
                  className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-violet-950/40 border border-slate-700/70 hover:border-violet-500/40 text-[11px] font-mono text-slate-300 hover:text-violet-300 flex items-center justify-center space-x-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="truncate">AI Сървър</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('laptop')}
                  className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700/70 hover:border-emerald-500/40 text-[11px] font-mono text-slate-300 hover:text-emerald-300 flex items-center justify-center space-x-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Лаптоп WoL</span>
                </button>
              </div>
            </div>

            {/* Host Name Field */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                ИМЕ НА ХОСТ (HOSTNAME) <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value.toUpperCase())}
                placeholder="напр. CST-LAB-PC-2 или BACKUP-NODE"
                className={`w-full px-3.5 py-2 rounded-xl bg-slate-950 border ${
                  errors.name ? 'border-rose-500/70' : 'border-slate-700/80 focus:border-cyan-400'
                } text-slate-100 font-mono text-xs focus:outline-none transition`}
              />
              {errors.name && <p className="text-[11px] text-rose-400 font-mono mt-1">{errors.name}</p>}
            </div>

            {/* IP Address & Port Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  IP АДРЕС (IPv4) <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={ip}
                  onChange={e => setIp(e.target.value)}
                  placeholder="192.168.1.120"
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-950 border ${
                    errors.ip ? 'border-rose-500/70' : 'border-slate-700/80 focus:border-cyan-400'
                  } text-slate-100 font-mono text-xs focus:outline-none transition`}
                />
                {errors.ip && <p className="text-[11px] text-rose-400 font-mono mt-1">{errors.ip}</p>}
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  АГЕНТ ПОРТ
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={e => setPort(e.target.value)}
                  placeholder="8765"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-slate-100 font-mono text-xs focus:outline-none transition"
                />
              </div>
            </div>

            {/* MAC Address Field with Auto-Generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono font-medium text-slate-300">
                  MAC АДРЕС (За Wake-on-LAN) <span className="text-cyan-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateMac}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Генерирай MAC</span>
                </button>
              </div>
              <input
                type="text"
                value={mac}
                onChange={e => setMac(e.target.value.toUpperCase())}
                placeholder="00:1A:2B:3C:4D:5E"
                className={`w-full px-3.5 py-2 rounded-xl bg-slate-950 border ${
                  errors.mac ? 'border-rose-500/70' : 'border-slate-700/80 focus:border-cyan-400'
                } text-slate-100 font-mono text-xs focus:outline-none transition`}
              />
              {errors.mac && <p className="text-[11px] text-rose-400 font-mono mt-1">{errors.mac}</p>}
            </div>

            {/* Device Type Selector */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                ТИП УСТРОЙСТВО
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pc' as const, label: 'Десктоп PC', icon: Monitor },
                  { id: 'laptop' as const, label: 'Лаптоп', icon: Laptop },
                  { id: 'server' as const, label: 'Сървър / NAS', icon: Server }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = deviceType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback('light');
                        setDeviceType(item.id);
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center space-y-1 transition text-xs font-mono ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OS & Initial Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* OS Selection */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  ОПЕРАЦИОННА СИСТЕМА
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setOs('windows');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition text-center ${
                      os === 'windows'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Windows
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setOs('linux');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition text-center ${
                      os === 'linux'
                        ? 'bg-violet-500/15 border-violet-400 text-violet-300 font-bold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Linux
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  НАЧАЛЕН СТАТУС
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setInitialStatus('ready');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition text-center flex items-center justify-center space-x-1 ${
                      initialStatus === 'ready'
                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Готов (Online)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setInitialStatus('sleeping');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition text-center flex items-center justify-center space-x-1 ${
                      initialStatus === 'sleeping'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Приспан (WoL)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                ЕТИКЕТИ (TAGS, разделени със запетая)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="Lab, Production, Storage, AI"
                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-slate-100 font-mono text-xs focus:outline-none transition"
                />
                <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  onClose();
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-mono text-xs font-medium transition cursor-pointer"
              >
                Отказ
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Добави във Флота</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
