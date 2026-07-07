'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(notify: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', notify);
  return () => mq.removeEventListener('change', notify);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns whether the user has requested reduced motion. SSR-safe via
 * useSyncExternalStore - server returns `false`, client subscribes to
 * matchMedia and re-renders on change. Use this to gate cinematic motion
 * (shimmer, materialize, breathe) - fall back to a 200ms cross-fade when
 * true. Spec §4.5.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Server-safe motion config builder. Component code passes its preferred
 * config, and we either return it or a degraded fallback. Helps keep the
 * "200ms fade fallback" rule (spec §4.5) consistent across components.
 */
export function motionWithFallback<T>(preferred: T, fallback: T, reduced: boolean): T {
  return reduced ? fallback : preferred;
}
