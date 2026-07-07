'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import type { Turn } from '../store/workspace-store';

export function ConciergeMessage({ turn }: { turn: Turn }) {
  const reduced = useReducedMotion();
  const cm = turn.conciergeMessage;
  const mood = turn.moodSnapshot;
  if (!cm && !mood) return null;
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-3 py-2"
    >
      {cm ? (
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.45,
            color: 'var(--ink-primary)',
          }}
        >
          {cm.text}
        </p>
      ) : null}
      {mood ? (
        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.45,
            color: 'var(--ink-secondary)',
          }}
        >
          {mood.text}
        </p>
      ) : null}
    </motion.div>
  );
}
