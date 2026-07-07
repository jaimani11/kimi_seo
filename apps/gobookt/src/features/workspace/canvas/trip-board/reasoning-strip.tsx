'use client';

import { motion } from 'framer-motion';
import type { ReasoningChip } from '@core/trip-proposal';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import {
  EASE_EMPHASIZED,
  REASONING_STRIP_DELAY,
  REASONING_STRIP_DURATION,
  REDUCED_DURATION,
} from './motion-tokens';

export function ReasoningStrip({
  highlights,
  totalCost,
}: {
  highlights: ReasoningChip[];
  totalCost?: { amount: number; currency: string };
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? REDUCED_DURATION : REASONING_STRIP_DURATION,
        delay: reduced ? 0 : REASONING_STRIP_DELAY,
        ease: EASE_EMPHASIZED,
      }}
      className="flex items-center gap-2 rounded-[14px] border px-3 py-2"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          flexShrink: 0,
        }}
      >
        Why these
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {highlights.map((chip) => (
          <Chip key={`${chip.source}:${chip.label}`} chip={chip} />
        ))}
        {totalCost ? <TotalCostChip total={totalCost} /> : null}
      </div>
    </motion.div>
  );
}

function Chip({ chip }: { chip: ReasoningChip }) {
  const isAgent = chip.source === 'agent';
  return (
    <span
      className="rounded-full border px-2 py-0.5"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.6875rem',
        background: isAgent ? 'var(--accent-primary-soft)' : 'var(--surface-overlay)',
        borderColor: isAgent ? 'var(--accent-primary-soft)' : 'var(--border-subtle)',
        color: isAgent ? 'var(--accent-primary)' : 'var(--ink-secondary)',
      }}
    >
      {chip.label}
    </span>
  );
}

function TotalCostChip({ total }: { total: { amount: number; currency: string } }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5"
      style={{
        background: 'var(--surface-overlay)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6875rem',
          color: 'var(--ink-tertiary)',
        }}
      >
        total{' '}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '0.8125rem',
          color: 'var(--accent-primary)',
        }}
      >
        {total.amount.toLocaleString()} {total.currency}
      </span>
    </span>
  );
}
