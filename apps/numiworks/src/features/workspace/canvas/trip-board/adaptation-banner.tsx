'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { AdaptationNote } from '@core/reasoning';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import { ADAPTATION_BANNER_LIFETIME_MS, EASE_EMPHASIZED, REDUCED_DURATION } from './motion-tokens';

/**
 * "Why this changed" banner. Renders when proposal.adaptation events
 * arrive (Slice B+ via RankingAgent). Auto-dismisses after 5s. Slice A's
 * orchestrator never emits these so this component is silently inactive
 * in the current demo - but the wire is ready.
 *
 * Implementation: outer component is a stateless gate, inner BannerCore
 * owns the auto-hide timer. Using a stable `key` on BannerCore (derived
 * from the notes' signals) forces a remount when the notes change, which
 * resets the lifetime cleanly without triggering React 19's
 * set-state-in-effect rule.
 */
export function AdaptationBanner({ notes }: { notes: AdaptationNote[] }) {
  if (notes.length === 0) return null;
  const key = notes.map((n) => `${n.signal}:${n.direction}`).join('|');
  return <BannerCore key={key} notes={notes} />;
}

function BannerCore({ notes }: { notes: AdaptationNote[] }) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), ADAPTATION_BANNER_LIFETIME_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="adaptation-banner"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{
            duration: reduced ? REDUCED_DURATION : 0.4,
            ease: EASE_EMPHASIZED,
          }}
          className="rounded-[14px] border px-3 py-2"
          style={{
            background: 'var(--accent-primary-soft)',
            borderColor: 'var(--accent-primary-soft)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            Why this changed
          </span>
          <ul className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {notes.map((note, i) => (
              <li
                key={`${note.signal}-${i}`}
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-body-sm)',
                  fontStyle: 'italic',
                  color: 'var(--ink-primary)',
                }}
              >
                {note.description}
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
