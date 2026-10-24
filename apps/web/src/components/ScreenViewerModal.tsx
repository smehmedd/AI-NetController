import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  X,
  Download,
  RefreshCw,
  Touchpad,
  MousePointer,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Keyboard,
  Check,
} from 'lucide-react';
import { HostDevice } from '../types';
import { generateMockScreenCanvas } from '../services/screenFrameService';
import { triggerHapticFeedback } from '../services/hapticService';
import { useScreenStore } from '../store/screenStore';
import { useTranslation } from '../i18n/useTranslation';
import { ScreenAspectPreset, computeContainedScreenRect } from '../utils/viewportScale';

export interface ScreenViewerModalProps {
  device: HostDevice | null;
  screenshotBase64?: string | null;
  screenBase64?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: (deviceId: string) => void;
  onRefreshFrame?: () => void;
  isCapturing?: boolean;
}

const ASPECT_PRESETS: { id: ScreenAspectPreset; label: string }[] = [
  { id: 'fit', label: 'Fit' },
  { id: '16:9', label: '16:9' },
  { id: '16:10', label: '16:10' },
  { id: '21:9', label: '21:9' },
  { id: '4:3', label: '4:3' },
  { id: 'fill', label: 'Fill' },
];

export const ScreenViewerModal: React.FC<ScreenViewerModalProps> = ({
  device,
  screenshotBase64,
  screenBase64,
  isOpen,
  onClose,
  onRefresh,
  onRefreshFrame,
  isCapturing = false,
}) => {
  const { language } = useTranslation();
  const [isTrackpadOpen, setIsTrackpadOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [aspectPreset, setAspectPreset] = useState<ScreenAspectPreset>('fit');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [sentKeyCombo, setSentKeyCombo] = useState<string | null>(null);
  const [viewportBounds, setViewportBounds] = useState({ width: 960, height: 540 });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const storeScreenBase64 = useScreenStore((s) => s.screenBase64);

  const activeFrame = screenBase64 || storeScreenBase64 || screenshotBase64;
  const displayImage = activeFrame || (device ? generateMockScreenCanvas(device) : '');

  useEffect(() => {
    if (!isOpen || !stageRef.current) return;
    const el = stageRef.current;
    const updateSize = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setViewportBounds({ width: el.clientWidth, height: el.clientHeight });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const screenRect = computeContainedScreenRect(
    viewportBounds.width,
    viewportBounds.height,
    aspectPreset,
    zoomLevel
  );

  const handleDownload = () => {
    if (!device) return;
    triggerHapticFeedback('light');
    const link = document.createElement('a');
    link.href = displayImage;
    link.download = `cst_remote_display_${device.id}_${Date.now()}.jpg`;
    link.click();
  };

  const handleRefreshTrigger = () => {
    if (!device) return;
    triggerHapticFeedback('light');
    if (onRefreshFrame) {
      onRefreshFrame();
    } else if (onRefresh) {
      onRefresh(device.id);
    }
  };

  const handleSendKeyCombo = async (combo: string) => {
    triggerHapticFeedback('medium');
    if (combo === 'Paste Clipboard') {
      try {
        await navigator.clipboard?.readText();
      } catch {
        // Fallback when clipboard read permission is not granted
      }
    }
    setSentKeyCombo(combo);
    setTimeout(() => {
      setSentKeyCombo((prev) => (prev === combo ? null : prev));
    }, 1400);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCursorPos({ x: xPct, y: yPct });
    triggerHapticFeedback('selection');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    setCursorPos((prev) => ({
      x: Math.max(0, Math.min(100, prev.x + dx * 0.15)),
      y: Math.max(0, Math.min(100, prev.y + dy * 0.15)),
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && device && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/75 backdrop-blur-md select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="landscape-compact-modal bg-[#091020]/96 backdrop-blur-3xl border border-white/15 border-t-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.9)] rounded-2xl sm:rounded-3xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[94dvh] transform-gpu will-change-transform"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/[0.02] border-b border-white/[0.08] shrink-0 gap-2 flex-wrap">
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 rounded-xl shrink-0">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h3 className="font-bold text-slate-100 text-xs sm:text-base font-display truncate">
                      {device.name}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 bg-cyan-500/15 text-cyan-300 rounded border border-cyan-400/30 shrink-0">
                      {device.ip}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate tabular-nums">
                    SIMD Delta Pipeline • 60 FPS • {screenRect.resolutionLabel}
                  </p>
                </div>
              </div>

              {/* Aspect Ratio Preset Pills (Desktop/Tablet inline, scrollable on mobile) */}
              <div className="flex items-center gap-1 bg-black/45 border border-white/10 rounded-full p-1 overflow-x-auto scrollbar-none">
                {ASPECT_PRESETS.map((preset) => {
                  const active = aspectPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback('selection');
                        setAspectPreset(preset.id);
                      }}
                      className={`px-2.5 py-1.5 rounded-full text-[10px] font-mono font-semibold transition cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                          : 'text-white/55 hover:text-white'
                      }`}
                      title={`Aspect Ratio: ${preset.label}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Action Controls */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Zoom Out / Reset / Zoom In */}
                <div className="hidden md:flex items-center bg-[#070f1e] border border-white/10 rounded-xl px-1 h-11">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
                    className="p-2 text-slate-300 hover:text-white cursor-pointer"
                    title={language === 'bg' ? 'Намали' : 'Zoom Out'}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="px-1.5 text-[10px] font-mono text-cyan-300 tabular-nums cursor-pointer"
                    title={language === 'bg' ? 'Нулирай мащаба' : 'Reset Zoom'}
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.25, Number((z + 0.25).toFixed(2))))}
                    className="p-2 text-slate-300 hover:text-white cursor-pointer"
                    title={language === 'bg' ? 'Увеличи' : 'Zoom In'}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleRefreshTrigger}
                  disabled={isCapturing}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-[#070f1e] hover:bg-[#0c182e] text-cyan-300 rounded-xl text-xs font-sans border border-cyan-500/30 transition disabled:opacity-50 min-h-[44px] min-w-[44px] justify-center cursor-pointer"
                  title={language === 'bg' ? 'Обнови кадъра' : 'Refresh frame'}
                >
                  <RefreshCw className={`w-4 h-4 ${isCapturing ? 'animate-spin text-cyan-300' : ''}`} />
                  <span className="hidden sm:inline">
                    {isCapturing
                      ? language === 'bg'
                        ? 'Зареждане...'
                        : 'Capturing...'
                      : language === 'bg'
                      ? 'Обнови'
                      : 'Refresh'}
                  </span>
                </button>

                <button
                  onClick={handleDownload}
                  className="p-2 bg-[#070f1e] hover:bg-[#0c182e] text-slate-300 hover:text-white rounded-xl text-xs border border-white/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title={language === 'bg' ? 'Свали екранна снимка' : 'Download screenshot'}
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsTrackpadOpen((prev) => !prev)}
                  className={`p-2 rounded-xl text-xs border transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                    isTrackpadOpen
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                      : 'bg-[#070f1e] text-slate-300 border-white/10 hover:text-white'
                  }`}
                  title={language === 'bg' ? 'Виртуален тракпад' : 'Virtual Trackpad'}
                >
                  <Touchpad className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs border border-rose-500/20 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title={language === 'bg' ? 'Затвори' : 'Close'}
                  aria-label={language === 'bg' ? 'Затвори' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Adaptive Aspect-Ratio Viewport Stage */}
            <div
              ref={stageRef}
              className="relative flex-1 bg-[#03060c] flex items-center justify-center overflow-auto min-h-[240px] sm:min-h-[400px] lg:min-h-[480px] p-2"
            >
              <div
                onClick={handleCanvasClick}
                style={{
                  width: `${screenRect.width}px`,
                  height: `${screenRect.height}px`,
                }}
                className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.85)] bg-black cursor-crosshair transition-all duration-150 shrink-0"
              >
                <img
                  src={displayImage}
                  alt="Remote Desktop Screen"
                  referrerPolicy="no-referrer"
                  className={`w-full h-full pointer-events-none ${
                    aspectPreset === 'fill' ? 'object-cover' : 'object-fill'
                  }`}
                />

                {/* Virtual Pointer Cursor */}
                <div
                  className="absolute w-4 h-4 text-cyan-300 pointer-events-none drop-shadow-[0_2px_6px_rgba(0,240,255,0.8)] transition-all duration-75"
                  style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
                >
                  <MousePointer className="w-4 h-4 fill-cyan-400/40" />
                </div>
              </div>

              {/* Resolution & Coordinates HUD Badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 border border-white/12 text-[10px] font-mono text-slate-300 flex items-center space-x-2 backdrop-blur-md pointer-events-none tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{screenRect.resolutionLabel}</span>
                <span className="text-white/30">•</span>
                <span className="text-cyan-300">
                  X:{Math.round(cursorPos.x)}% Y:{Math.round(cursorPos.y)}%
                </span>
              </div>

              {/* Collapsible Virtual Trackpad Drawer */}
              <AnimatePresence>
                {isTrackpadOpen && (
                  <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    className="absolute bottom-3 inset-x-3 sm:inset-x-16 bg-[#091020]/96 border border-cyan-500/35 rounded-2xl p-3 backdrop-blur-3xl shadow-2xl flex flex-col space-y-2 z-20"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-xs font-sans font-semibold text-cyan-300 flex items-center space-x-1.5">
                        <Touchpad className="w-3.5 h-3.5" />
                        <span>
                          {language === 'bg' ? 'Виртуален тракпад и жестове' : 'Virtual Trackpad & Gestures'}
                        </span>
                      </span>
                      <button
                        onClick={() => setIsTrackpadOpen(false)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Touchpad Surface & Scroll Zone */}
                    <div className="flex space-x-2 h-24">
                      <div
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        className="flex-1 bg-[#060b16] border border-white/10 rounded-xl flex items-center justify-center text-slate-400 text-[11px] font-sans cursor-crosshair active:border-cyan-500/50 px-2 text-center"
                      >
                        {language === 'bg'
                          ? 'Плъзнете пръст или кликнете директно върху екрана'
                          : 'Drag finger here or click directly on the remote screen'}
                      </div>

                      <div className="w-12 bg-[#060b16] border border-white/10 rounded-xl flex flex-col items-center justify-center text-[9px] font-sans text-slate-400 space-y-1">
                        <span>▲</span>
                        <span>{language === 'bg' ? 'Скрол' : 'Scroll'}</span>
                        <span>▼</span>
                      </div>
                    </div>

                    {/* Left and Right Click Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => triggerHapticFeedback('selection')}
                        className="py-2.5 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-sans text-slate-200 font-semibold active:scale-98 transition cursor-pointer"
                      >
                        {language === 'bg' ? 'Ляв клик' : 'Left Click'}
                      </button>
                      <button
                        onClick={() => triggerHapticFeedback('selection')}
                        className="py-2.5 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-sans text-slate-200 font-semibold active:scale-98 transition cursor-pointer"
                      >
                        {language === 'bg' ? 'Десен клик' : 'Right Click'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Quick Remote Keybar (Esc, Tab, Win/Super, Alt+F4, Ctrl+Alt+Del, Paste Clipboard) */}
            <div className="px-3 sm:px-4 py-2 bg-[#070c18]/90 backdrop-blur-3xl border-t border-white/[0.12] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/50 shrink-0">
                <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">
                  {language === 'bg' ? 'Бързи клавиши:' : 'Quick Keys:'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {['Esc', 'Tab', 'Win/Super', 'Alt+F4', 'Ctrl+Alt+Del', 'Paste Clipboard'].map((combo) => {
                  const isSent = sentKeyCombo === combo;
                  const displayLabel =
                    combo === 'Paste Clipboard' && language === 'bg' ? 'Постави буфер' : combo;
                  return (
                    <button
                      key={combo}
                      type="button"
                      onClick={() => handleSendKeyCombo(combo)}
                      className={`px-3 py-1.5 min-h-[38px] rounded-lg text-[10.5px] font-mono font-medium border transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        isSent
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSent && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{displayLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
