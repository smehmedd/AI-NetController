import { useCallback } from 'react';
import { triggerHapticFeedback } from '../services/hapticService';

/**
 * useHaptics Hook
 * Ergonomic hardware vibration and Web Audio synthesized feedback
 */
export function useHaptics() {
  const selection = useCallback(() => triggerHapticFeedback('selection'), []);
  const light = useCallback(() => triggerHapticFeedback('light'), []);
  const medium = useCallback(() => triggerHapticFeedback('medium'), []);
  const heavy = useCallback(() => triggerHapticFeedback('heavy'), []);
  const warning = useCallback(() => triggerHapticFeedback('warning'), []);

  return {
    selection,
    light,
    medium,
    heavy,
    warning,
    trigger: triggerHapticFeedback
  };
}
