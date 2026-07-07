'use client';

import { useMotionValue, useSpring } from 'framer-motion';
import { useCallback } from 'react';

interface UseMagneticHoverOptions {
  /** Maximum pixel translate in either axis. Default 6px. Keep small -
   *  the effect should be felt more than seen. */
  strength?: number;
  /** Disable on touch devices. Default true (touch devices don't have
   *  cursor coordinates worth chasing). */
  disableOnTouch?: boolean;
}

/**
 * Cursor-aware magnetic translate for cards. Returns three motion
 * values + the pointer handlers a Framer Motion element should bind.
 *
 * Cards translate gently toward the cursor when it's inside their
 * bounding box. The motion is spring-eased so the card moves with
 * its own subtle weight, not snappy.
 *
 * Usage:
 *
 *   const { x, y, onPointerMove, onPointerLeave } = useMagneticHover();
 *   <motion.a
 *     style={{ x, y }}
 *     onPointerMove={onPointerMove}
 *     onPointerLeave={onPointerLeave}
 *   >
 *
 * Why a hook + handlers rather than a wrapper component: cards already
 * use `motion.a` for the link semantics + hover lift. Splicing another
 * wrapper would either nest the motion or fight for the same element.
 * Hook-and-bind keeps the binding site explicit.
 */
export function useMagneticHover(options: UseMagneticHoverOptions = {}) {
  const strength = options.strength ?? 6;
  const disableOnTouch = options.disableOnTouch ?? true;

  // Springs - critically damped, slightly soft. Cards feel weighted.
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disableOnTouch && e.pointerType === 'touch') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalize to -1..+1 across the card's extent, then scale.
      const dx = ((e.clientX - cx) / (rect.width / 2)) * strength;
      const dy = ((e.clientY - cy) / (rect.height / 2)) * strength;
      x.set(dx);
      y.set(dy);
    },
    [strength, disableOnTouch, x, y],
  );

  const onPointerLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { x, y, onPointerMove, onPointerLeave };
}
