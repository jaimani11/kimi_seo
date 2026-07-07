'use client';

import { useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface UseCardParallaxResult<T extends HTMLElement> {
  containerRef: React.RefObject<T | null>;
  photoY: MotionValue<string>;
}

interface UseCardParallaxOptions {
  /** Peak translate (as a percent string) at the viewport edges.
   *  Default 8 (i.e. -8% at the bottom of viewport, +8% at the top). */
  strength?: number;
}

/**
 * Scroll-linked photo parallax for cards.
 *
 * Bind `containerRef` to the card's outer element and `photoY` to the
 * photo wrapper's `y` style. As the card moves through the viewport
 * the photo pans gently along the Y axis, so a long scroll feels
 * cinematic instead of mechanical.
 *
 * The hook is generic over the element type so cards rendered as
 * `<motion.a>` get an HTMLAnchorElement ref, `<motion.button>` gets
 * HTMLButtonElement, etc. Default is HTMLElement.
 *
 * Implementation notes:
 *
 *   - We track the card itself as the `useScroll` target, with the
 *     viewport's start/end as the offset bounds. The transformation
 *     runs only while the card is on screen.
 *   - We output a percent string (not pixels) so the parallax scales
 *     with the photo height rather than being constant across card
 *     sizes.
 *   - Hooks are stable - useRef + useScroll + useTransform run once
 *     per render and Framer caches the underlying subscription.
 */
export function useCardParallax<T extends HTMLElement = HTMLElement>(
  options: UseCardParallaxOptions = {},
): UseCardParallaxResult<T> {
  const containerRef = useRef<T | null>(null);
  const strength = options.strength ?? 8;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // scrollYProgress goes 0 (card just entered viewport bottom) → 1
  // (card just exited viewport top). Map to +strength% → -strength%.
  const photoY = useTransform(scrollYProgress, [0, 1], [`${strength}%`, `-${strength}%`]);

  return { containerRef, photoY };
}
