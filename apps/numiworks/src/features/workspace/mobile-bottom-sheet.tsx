'use client';

import { motion, useMotionValue, animate } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

/**
 * Native-feeling bottom sheet for mobile. Three snap points:
 *
 *   - peek: ~140px visible (just enough to show the input bar)
 *   - half: 50vh
 *   - full: 95vh
 *
 * The sheet is always visible (no hide state - chat is always at hand).
 * Drag-to-snap with rubber-banding past the bounds. A backdrop dims
 * the canvas only at `full`.
 *
 * Why discrete snaps: free-drag is a UX trap on mobile (users get
 * stuck at random heights, then can't tell if they tapped or dragged).
 * Three snaps mirror native iOS/Android sheet behavior.
 */

const PEEK_PX = 140;
const HALF_VH = 0.5;
const FULL_VH = 0.95;

type Snap = 'peek' | 'half' | 'full';

interface MobileBottomSheetProps {
  /** Renders inside the sheet - typically the ChatSidebar. */
  children: ReactNode;
  /** Initial snap on first render. Default 'peek'. */
  initialSnap?: Snap;
}

export function MobileBottomSheet({ children, initialSnap = 'peek' }: MobileBottomSheetProps) {
  const reduced = useReducedMotion();
  const [snap, setSnap] = useState<Snap>(initialSnap);
  const [viewportH, setViewportH] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const y = useMotionValue(0);

  useEffect(() => {
    function measure() {
      setViewportH(window.innerHeight);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Translate snap → y offset (sheet is positioned at top: 0 of its
  // container, then translated DOWN to the desired peek/half/full
  // height). We compute height visible = viewportH - y.
  const heightFor: Record<Snap, number> = {
    peek: PEEK_PX,
    half: viewportH * HALF_VH,
    full: viewportH * FULL_VH,
  };

  // Sheet's own height is the maximum (full) so content fits at any snap.
  const sheetHeight = heightFor.full;

  function targetY(s: Snap): number {
    return sheetHeight - heightFor[s];
  }

  // When viewport changes or snap changes, animate y to the target.
  useEffect(() => {
    if (viewportH === 0) return;
    const target = targetY(snap);
    const controls = animate(y, target, {
      duration: reduced ? 0.18 : 0.42,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, viewportH]);

  function handleDragEnd(_: unknown, info: { velocity: { y: number }; offset: { y: number } }) {
    const currentY = y.get();
    const visibleHeight = sheetHeight - currentY;

    // Velocity-aware snap: a quick flick goes one snap further than
    // the position alone would suggest. Threshold 600px/s.
    const flickThreshold = 600;
    let next: Snap;
    if (info.velocity.y > flickThreshold) {
      // Flicked down → smaller snap
      next = visibleHeight > heightFor.half ? 'half' : 'peek';
    } else if (info.velocity.y < -flickThreshold) {
      // Flicked up → bigger snap
      next = visibleHeight < heightFor.half ? 'half' : 'full';
    } else {
      // Position-based: snap to nearest
      const distancePeek = Math.abs(visibleHeight - heightFor.peek);
      const distanceHalf = Math.abs(visibleHeight - heightFor.half);
      const distanceFull = Math.abs(visibleHeight - heightFor.full);
      const min = Math.min(distancePeek, distanceHalf, distanceFull);
      next = min === distanceFull ? 'full' : min === distanceHalf ? 'half' : 'peek';
    }
    setSnap(next);
  }

  if (viewportH === 0) {
    // First paint - render at peek statically; effect will animate.
    return null;
  }

  return (
    <>
      {/* Backdrop only when fully expanded */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30 md:hidden"
        animate={{ opacity: snap === 'full' ? 0.5 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ background: '#08090C' }}
      />

      <motion.div
        ref={containerRef}
        drag="y"
        dragMomentum={false}
        dragElastic={0.15}
        dragConstraints={{ top: targetY('full'), bottom: sheetHeight }}
        onDragEnd={handleDragEnd}
        style={{
          y,
          height: sheetHeight,
          background: 'var(--surface-base)',
          borderTop: '1px solid var(--border-emphasis)',
          touchAction: 'none',
        }}
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[20px] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] md:hidden"
      >
        {/* Drag handle - also the tap target to cycle snaps */}
        <button
          type="button"
          aria-label={`Sheet: ${snap}. Tap to cycle.`}
          onClick={() => setSnap(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'peek')}
          className="grid h-6 w-full place-items-center"
          style={{ touchAction: 'manipulation' }}
        >
          <span
            aria-hidden
            className="block h-1 w-9 rounded-full"
            style={{ background: 'var(--border-emphasis)' }}
          />
        </button>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </motion.div>
    </>
  );
}
