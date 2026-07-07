'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { X } from '@/features/shared/icons';
import type { Stay } from '@core/stay';
import { useWorkspaceStore } from '../store/workspace-store';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import { CompareView } from './compare-view';

/**
 * Floating bottom strip showing pinned stays. Auto-hides when nothing is
 * pinned. Click thumbnails to unpin individually; "Compare" opens the
 * side-by-side modal; "Clear" removes all pins.
 *
 * Note: we subscribe to compareSet + turns separately and derive the
 * stays array via useMemo. A naive selector that returned the array
 * inside useWorkspaceStore would create a new array reference on every
 * render and trip Zustand's reference-equality check, causing an
 * infinite loop.
 */
export function CompareTray() {
  const compareSet = useWorkspaceStore((s) => s.compareSet);
  const turns = useWorkspaceStore((s) => s.turns);
  const unpinStay = useWorkspaceStore((s) => s.unpinStay);
  const clearCompare = useWorkspaceStore((s) => s.clearCompare);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  const stays = useMemo<Stay[]>(() => {
    const out: Stay[] = [];
    for (const id of compareSet) {
      for (const t of turns) {
        if (!t.proposal) continue;
        if (t.proposal.hero.id === id) {
          out.push(t.proposal.hero);
          break;
        }
        const alt = t.proposal.alternatives.find((a) => a.id === id);
        if (alt) {
          out.push(alt);
          break;
        }
      }
    }
    return out;
  }, [compareSet, turns]);

  return (
    <>
      <AnimatePresence>
        {stays.length > 0 ? (
          <motion.div
            key="compare-tray"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-6 bottom-6 left-6 flex items-center gap-3 rounded-full border px-3 py-2 backdrop-blur-[14px]"
            style={{
              background: 'rgba(20, 23, 28, 0.72)',
              borderColor: 'var(--border-emphasis)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-tertiary)',
              }}
            >
              Compare
            </span>
            <ul className="flex items-center gap-2">
              {stays.map((s) => (
                <li key={s.id} className="relative">
                  <button
                    type="button"
                    onClick={() => unpinStay(s.id)}
                    aria-label={`Remove ${s.name} from compare`}
                    className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg border transition-transform duration-[var(--dur-fast)] hover:scale-95"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {s.photos[0] ? (
                      <Image
                        src={s.photos[0].url}
                        alt={s.photos[0].alt}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{ background: 'rgba(0,0,0,0.18)' }}
                    />
                    <X
                      size={12}
                      strokeWidth={2.4}
                      className="relative"
                      style={{ color: '#EDE6DB' }}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => clearCompare()}
                className="rounded-full px-2.5 py-1 transition-colors hover:bg-[color:var(--surface-overlay)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--ink-tertiary)',
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={stays.length < 2}
                className="rounded-full px-3 py-1.5 transition-opacity disabled:opacity-40"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#14171C',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 500,
                }}
              >
                Compare ({stays.length})
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CompareView open={open} onClose={() => setOpen(false)} stays={stays} />
    </>
  );
}
