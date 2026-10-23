import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Sheet / Dialog Surface */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.75 }}
            className="
              bg-[#091020]/95 backdrop-blur-3xl border border-white/15 border-t-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.85)]
              relative z-10 w-full max-w-xl
              rounded-t-[2.5rem] sm:rounded-[2.4rem]
              flex flex-col overflow-hidden
              max-h-[90vh] sm:max-h-[85vh]
              transform-gpu will-change-transform
            "
          >
            {/* Samsung Specular Rim Highlight */}
            <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

            {/* Tactile Drag Handle (Mobile) */}
            <div className="pt-3 pb-1 cursor-grab active:cursor-grabbing w-full flex justify-center sm:hidden">
              <div className="w-12 h-1.5 bg-white/25 rounded-full hover:bg-white/40 transition-colors" />
            </div>

            {/* Header - Negative space hierarchy without divider border */}
            <div className="px-6 pt-4 pb-2 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition cursor-pointer"
                aria-label="Затвори"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content with Safe Insets */}
            <div className="p-6 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
