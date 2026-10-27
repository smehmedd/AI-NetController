/**
 * Tactile / Haptic Feedback Generator - Disabled for Ultra-Smooth 120 FPS Performance
 * Completely eliminates vibration latency, Web Audio thread context overhead, and frame drops.
 */
export function triggerHapticFeedback(_type?: 'light' | 'medium' | 'heavy' | 'warning' | 'selection'): void {
  // Haptic feedback disabled per performance optimization specs
}
