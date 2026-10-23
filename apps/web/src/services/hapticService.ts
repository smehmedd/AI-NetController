/**
 * Android Tactile / Haptic Feedback Generator
 * Uses navigator.vibrate when available on Android devices,
 * or Web Audio API synthesis for a subtle tactile click.
 */
let audioCtx: AudioContext | null = null;

export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'warning' | 'selection' = 'light') {
  // 1. Hardware vibration on Android devices
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'selection') navigator.vibrate(4);
      else if (type === 'light') navigator.vibrate(8);
      else if (type === 'medium') navigator.vibrate(18);
      else if (type === 'heavy') navigator.vibrate(35);
      else if (type === 'warning') navigator.vibrate([30, 40, 30]);
    } catch {
      // Ignore vibration errors if restricted by browser policy
    }
  }

  // 2. Web Audio subtle click synthesizer
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const freq = type === 'warning' ? 180 : type === 'heavy' ? 220 : type === 'selection' ? 440 : 380;
    const duration = type === 'warning' ? 0.06 : type === 'selection' ? 0.02 : 0.03;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Non-blocking fallback
  }
}
