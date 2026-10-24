import type { Transition, Variants } from 'motion/react';

/**
 * 120Hz Hardware-Accelerated Bubbly Spring Physics System
 * Strictly animates GPU-composited properties (transform: translate3d/scale/rotate & opacity)
 * with zero runtime CSS filter blurs or layout-thrashing width/height recalculations.
 */

/** Expressive, bubbly spring with a lively overshoot for pills, cards, modals & popovers */
export const SPRING_BUBBLY: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 24,
  mass: 0.6,
};

/** Ultra-snappy, tactile micro-bounce for buttons, icons, toggles & chips */
export const SPRING_POP: Transition = {
  type: 'spring',
  stiffness: 580,
  damping: 22,
  mass: 0.5,
};

/** Silky, high-frame-rate fluid spring for tab transitions, sheets & bento drawers */
export const SPRING_FLUID: Transition = {
  type: 'spring',
  stiffness: 410,
  damping: 27,
  mass: 0.65,
};

/** Gentle elastic spring for floating badges, status indicators & telemetry bars */
export const SPRING_ELASTIC: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 20,
  mass: 0.6,
};

/** Cohesive hover & tap micro-interaction presets */
export const BUBBLE_HOVER = {
  scale: 1.045,
  y: -1.5,
  transition: SPRING_POP,
};

export const BUBBLE_TAP = {
  scale: 0.92,
  y: 1,
  transition: SPRING_POP,
};

export const CARD_HOVER = {
  y: -3,
  scale: 1.006,
  transition: SPRING_BUBBLY,
};

/** 120Hz Zero-Blur Tab View Variants (GPU transform + opacity only) */
export const TAB_VIEW_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 14,
    scale: 0.975,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_BUBBLY,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.985,
    transition: {
      duration: 0.13,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

/** Expressive Popover / Dropdown Menu Variants */
export const POPOVER_BUBBLE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: -8,
    scale: 0.92,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_BUBBLY,
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.95,
    transition: {
      duration: 0.12,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

/** Modal Dialog Bubbly Entrance & Exit Variants */
export const MODAL_BUBBLE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 22,
    scale: 0.93,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_BUBBLY,
  },
  exit: {
    opacity: 0,
    y: 14,
    scale: 0.96,
    transition: {
      duration: 0.14,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};
