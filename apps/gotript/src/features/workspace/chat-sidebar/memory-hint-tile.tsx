'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle } from '@/features/shared/icons';
import { useWorkspaceStore } from '../store/workspace-store';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

/**
 * Subtle italic tile that surfaces a session-scoped memory hint. Spec
 * §5.9: "very occasionally and never anthropomorphic." Slice A's
 * MemoryHinter fires at most once per session.
 */
export function MemoryHintTile() {
  const hint = useWorkspaceStore((s) => s.memoryHint);
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {hint ? (
        <motion.div
          key="memory-hint"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: reduced ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-5 my-2 flex items-start gap-2 rounded-lg border px-3 py-2"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <Sparkle
            size={11}
            style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '4px' }}
          />
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body-sm)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.45,
              color: 'var(--ink-secondary)',
            }}
          >
            {hint.message}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
