import React, { useState, useRef, useEffect } from 'react';
import { triggerHapticFeedback } from '../services/hapticService';

interface HoldToConfirmButtonProps {
  label: string;
  icon?: React.ReactNode;
  onConfirmed: () => void;
  holdDurationMs?: number;
  isDestructive?: boolean;
  accentColor?: string;
  className?: string;
}

export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
  label,
  icon,
  onConfirmed,
  holdDurationMs = 1500,
  isDestructive = true,
  accentColor,
  className = '',
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const hapticIntervalRef = useRef<any>(null);

  const startHolding = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isConfirmed) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();
    triggerHapticFeedback('light');

    // Interval for smooth radial fill
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(1, elapsed / holdDurationMs);
      setProgress(p);

      if (p >= 1) {
        clearInterval(timerRef.current);
        clearInterval(hapticIntervalRef.current);
        setIsConfirmed(true);
        setIsHolding(false);
        triggerHapticFeedback('heavy');
        onConfirmed();

        // Reset after feedback
        setTimeout(() => {
          setIsConfirmed(false);
          setProgress(0);
        }, 800);
      }
    }, 20);

    // Periodic haptic tick during hold
    hapticIntervalRef.current = setInterval(() => {
      triggerHapticFeedback('selection');
    }, 180);
  };

  const cancelHolding = () => {
    if (isConfirmed) return;
    clearInterval(timerRef.current);
    clearInterval(hapticIntervalRef.current);
    if (isHolding) {
      setIsHolding(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(hapticIntervalRef.current);
    };
  }, []);

  const activeColor = accentColor || (isDestructive ? '#FF2A6D' : '#FFB800');

  return (
    <div
      onMouseDown={startHolding}
      onMouseUp={cancelHolding}
      onMouseLeave={cancelHolding}
      onTouchStart={startHolding}
      onTouchEnd={cancelHolding}
      onTouchCancel={cancelHolding}
      style={{
        borderColor: isHolding ? activeColor : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isHolding ? `0 0 16px ${activeColor}44` : 'none',
      }}
      className={`relative select-none overflow-hidden cursor-pointer rounded-full h-9 px-4 flex items-center justify-center gap-2 border bg-slate-900/90 hover:bg-slate-800/90 transition-all active:scale-98 ${className}`}
    >
      {/* Background fill track */}
      <div
        className="absolute inset-0 transition-all"
        style={{
          width: `${progress * 100}%`,
          backgroundColor: `${activeColor}25`,
        }}
      />

      {/* Radial border or line indicator */}
      {isHolding && (
        <div
          className="absolute bottom-0 left-0 h-0.5"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: activeColor,
          }}
        />
      )}

      <div className="relative z-10 flex items-center gap-1.5 text-xs font-semibold">
        {icon && (
          <span style={{ color: isHolding ? activeColor : undefined }}>
            {icon}
          </span>
        )}
        <span
          style={{
            color: isHolding ? activeColor : undefined,
          }}
          className="font-sans"
        >
          {isConfirmed
            ? 'Потвърдено'
            : isHolding
            ? `Задръжте... ${Math.round(progress * 100)}%`
            : label}
        </span>
      </div>
    </div>
  );
};
