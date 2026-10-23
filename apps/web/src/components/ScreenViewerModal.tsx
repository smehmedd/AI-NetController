import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  X,
  Download,
  RefreshCw,
  Zap,
  Touchpad,
  MousePointer,
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { HostDevice } from '../types';
import { generateMockScreenCanvas } from '../services/screenFrameService';
import { triggerHapticFeedback } from '../services/hapticService';
import { useScreenStore } from '../store/screenStore';

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
  const [isTrackpadOpen, setIsTrackpadOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const storeScreenBase64 = useScreenStore((s) => s.screenBase64);

  const activeFrame = screenBase64 || storeScreenBase64 || screenshotBase64;
  const displayImage = activeFrame || (device ? generateMockScreenCanvas(device) : '');

  const handleDownload = () => {
    if (!device) return;
    const link = document.createElement('a');
    link.href = displayImage;
    link.download = `cst_remote_display_${device.id}_${Date.now()}.jpg`;
    link.click();
  };

  const handleRefreshTrigger = () => {
    if (!device) return;
    if (onRefreshFrame) {
      onRefreshFrame();
    } else if (onRefresh) {
      onRefresh(device.id);
    }
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

    setCursorPos(prev => ({
      x: Math.max(0, Math.min(100, prev.x + dx * 0.15)),
      y: Math.max(0, Math.min(100, prev.y + dy * 0.15)),
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && device && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.05] backdrop-blur-[32px] backdrop-saturate-[180%] border border-white/[0.05] border-t-white/[0.15] border-l-white/[0.1] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] rounded-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] transform-gpu will-change-transform"
          >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white/[0.02] shrink-0 gap-2">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/25 rounded-xl shrink-0">
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h3 className="font-bold text-slate-100 text-xs sm:text-base font-display truncate">
                    {device.name}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 bg-[#00f0ff]/10 text-[#00f0ff] rounded border border-[#00f0ff]/30 shrink-0">
                    {device.id}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-sans truncate">
                  SIMD Delta Pipeline • 60 FPS • 1920x1080
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <button
                onClick={handleRefreshTrigger}
                disabled={isCapturing}
                className="flex items-center space-x-1.5 px-3 py-2 bg-[#070f1e] hover:bg-[#0c182e] text-[#00f0ff] rounded-xl text-xs font-sans border border-cyan-500/30 transition disabled:opacity-50 min-h-[44px] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-[#00f0ff]' : ''}`} />
                <span className="hidden sm:inline">{isCapturing ? 'Зареждане...' : 'Обнови'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="p-2 bg-[#070f1e] hover:bg-[#0c182e] text-slate-300 hover:text-white rounded-xl text-xs border border-white/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Свали екранна снимка"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsTrackpadOpen(prev => !prev)}
                className={`p-2 rounded-xl text-xs border transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                  isTrackpadOpen
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/40'
                    : 'bg-[#070f1e] text-slate-300 border-white/10 hover:text-white'
                }`}
                title="Виртуален тракпад"
              >
                <Touchpad className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs border border-rose-500/20 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Затвори"
                aria-label="Затвори"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Adaptive Aspect Ratio Viewport (Section 3.5 - Letterbox Contain) */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px]">
            <img
              src={displayImage}
              alt="Remote Desktop Screen"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />

            {/* True Physical Resolution Badge (Section 3.5) */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono text-slate-300 flex items-center space-x-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffa3]" />
              <span>1920x1080 • 60 FPS</span>
            </div>

            {/* Virtual Pointer Cursor */}
            <div
              className="absolute w-4 h-4 text-[#00f0ff] pointer-events-none drop-shadow-md transition-all duration-75"
              style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
            >
              <MousePointer className="w-4 h-4 fill-[#00f0ff]/30" />
            </div>

            {/* Collapsible Virtual Trackpad Drawer (Section 4.3) */}
            <AnimatePresence>
              {isTrackpadOpen && (
                <motion.div
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 200, opacity: 0 }}
                  className="absolute bottom-3 inset-x-3 sm:inset-x-16 bg-[#0c182e]/95 border border-cyan-500/30 rounded-2xl p-3 backdrop-blur-xl shadow-2xl flex flex-col space-y-2 z-20"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-xs font-sans font-semibold text-[#00f0ff] flex items-center space-x-1.5">
                      <Touchpad className="w-3.5 h-3.5" />
                      <span>Виртуален тракпад и жестове</span>
                    </span>
                    <button
                      onClick={() => setIsTrackpadOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Touchpad Surface & Scroll Zone */}
                  <div className="flex space-x-2 h-24">
                    {/* Main relative pointer movement area */}
                    <div
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      className="flex-1 bg-[#060b16] border border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-[11px] font-sans cursor-crosshair active:border-cyan-500/50"
                    >
                      Плъзнете пръст за преместване на мишката
                    </div>

                    {/* Vertical Two-Finger Scroll Strip */}
                    <div className="w-12 bg-[#060b16] border border-white/10 rounded-xl flex flex-col items-center justify-center text-[9px] font-sans text-slate-400 space-y-1">
                      <span>▲</span>
                      <span>Скрол</span>
                      <span>▼</span>
                    </div>
                  </div>

                  {/* Left and Right Click Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => triggerHapticFeedback('selection')}
                      className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-sans text-slate-200 font-semibold active:scale-98 transition"
                    >
                      Ляв клик
                    </button>
                    <button
                      onClick={() => triggerHapticFeedback('selection')}
                      className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-sans text-slate-200 font-semibold active:scale-98 transition"
                    >
                      Десен клик
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};
