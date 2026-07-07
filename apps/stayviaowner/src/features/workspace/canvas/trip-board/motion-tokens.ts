// Shared timing for the Trip Board materialization sequence (spec §5.6).
// Values chosen to match the cinematic ~700ms-total reveal.

export type CubicBezier = [number, number, number, number];

export const EASE_EMPHASIZED: CubicBezier = [0.16, 1, 0.3, 1];
export const EASE_OUT: CubicBezier = [0.2, 0.8, 0.2, 1];
export const EASE_IN_OUT: CubicBezier = [0.4, 0, 0.2, 1];

// Materialization choreography.
export const HERO_DURATION = 0.6;
export const ALT_DURATION = 0.6;
export const ALT_STAGGER = 0.06;
export const REASONING_STRIP_DELAY = 0.4;
export const REASONING_STRIP_DURATION = 0.35;
export const BREATHE_DELAY_MS = 600;
export const BREATHE_DURATION_S = 5;

// Reduced-motion fallback (spec §4.5).
export const REDUCED_DURATION = 0.2;

// Refine flow timings (spec §5.7).
export const REFINING_RIPPLE_DURATION = 1.4;
export const HERO_SWAP_DURATION = 0.8;
export const ADAPTATION_BANNER_LIFETIME_MS = 5000;
