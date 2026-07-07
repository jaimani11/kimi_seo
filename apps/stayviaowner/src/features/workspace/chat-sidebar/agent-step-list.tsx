'use client';

import { motion } from 'framer-motion';
import type { AgentStep } from '../store/workspace-store';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

export function AgentStepList({ steps }: { steps: AgentStep[] }) {
  const reduced = useReducedMotion();
  if (steps.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {steps.map((step, idx) => (
        <motion.li
          key={step.stepId}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0.2 : 0.35,
            delay: reduced ? 0 : idx * 0.06,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          className="flex items-center gap-2.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-3 py-1.5"
        >
          <StepIcon status={step.status} />
          <span
            className="flex-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: step.status === 'failed' ? 'var(--ink-tertiary)' : 'var(--ink-secondary)',
              textDecoration: step.status === 'failed' ? 'line-through' : 'none',
            }}
          >
            {step.status === 'active' ? presentParticiple(step.label) : pastTense(step.label)}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.6875rem',
              color: 'var(--accent-primary)',
              fontStyle: 'italic',
            }}
          >
            · {step.agentId}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function StepIcon({ status }: { status: AgentStep['status'] }) {
  if (status === 'completed') {
    return (
      <span
        aria-hidden
        className="grid h-3 w-3 place-items-center rounded-full"
        style={{ background: 'var(--accent-primary)' }}
      >
        <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="#14171C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span
        aria-hidden
        className="h-3 w-3 rounded-full"
        style={{ background: 'var(--ink-tertiary)' }}
      />
    );
  }
  return (
    <motion.span
      aria-hidden
      animate={{
        boxShadow: ['0 0 0 0 var(--accent-primary-glow)', '0 0 0 4px transparent'],
      }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      className="h-3 w-3 rounded-full border-2"
      style={{
        borderColor: 'var(--accent-primary)',
        background: 'var(--accent-primary-soft)',
      }}
    />
  );
}

function pastTense(label: string): string {
  return label
    .replace(/^Reading/i, 'Read')
    .replace(/^Adjusting/i, 'Adjusted')
    .replace(/^Searching/i, 'Searched')
    .replace(/^Composing/i, 'Composed')
    .replace(/^Ranking/i, 'Ranked');
}

function presentParticiple(label: string): string {
  return label;
}
