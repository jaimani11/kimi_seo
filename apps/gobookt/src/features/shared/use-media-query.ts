'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook. Returns `false` on the server and during
 * the first paint, then flips on mount once `window.matchMedia` is
 * available. This prevents a flash of mobile-shell on desktop hydration.
 *
 * Pattern: render the same shell on SSR + first client paint, then
 * react to the post-mount value. Components that need a different
 * shell entirely should branch AFTER mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    // Sync external state (matchMedia) into React - the legitimate use
    // of setState-in-effect that the rule is supposed to allow but
    // flags here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Convenience: true when viewport < 768px (Tailwind's `md` breakpoint). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
