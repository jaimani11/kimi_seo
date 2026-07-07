'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { X } from '@/features/shared/icons';
import type { Stay } from '@core/stay';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

/**
 * Side-by-side compare modal. Slice A: simple structural comparison
 * (photo, name, region, price/night, sleeps, walkability/familyFit, top
 * vibe tags). Cheapest highlighted in gold. Slice B layers ranking-aware
 * comparisons + diff highlights via the RankingAgent.
 */
export function CompareView({
  open,
  onClose,
  stays,
}: {
  open: boolean;
  onClose: () => void;
  stays: Stay[];
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const cheapest = stays.length
    ? stays.reduce((best, s) =>
        s.pricing.pricePerNight.amount < best.pricing.pricePerNight.amount ? s : best,
      )
    : null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="compare-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.3 }}
          className="fixed inset-0 z-40 grid place-items-center px-6"
          style={{ background: 'rgba(11, 13, 16, 0.78)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: reduced ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl rounded-[24px] border p-6"
            style={{
              background: 'var(--surface-raised)',
              borderColor: 'var(--border-emphasis)',
              boxShadow: 'var(--elev-hero)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-tertiary)',
                  }}
                >
                  Compare · {stays.length}
                </p>
                <h2
                  className="mt-1"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: 'var(--text-display-md)',
                    fontWeight: 300,
                    color: 'var(--ink-primary)',
                  }}
                >
                  Side-by-side
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close compare"
                className="grid h-9 w-9 place-items-center rounded-full border transition-colors hover:bg-[color:var(--surface-overlay)]"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-secondary)' }}
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${stays.length}, minmax(0, 1fr))` }}
            >
              {stays.map((s) => (
                <CompareCard key={s.id} stay={s} cheapest={cheapest?.id === s.id} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CompareCard({ stay, cheapest }: { stay: Stay; cheapest: boolean }) {
  const photo = stay.photos[0];
  return (
    <article
      className="overflow-hidden rounded-[18px] border"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: cheapest ? 'var(--accent-primary)' : 'var(--border-subtle)',
      }}
    >
      <div className="relative aspect-[16/10] w-full">
        {photo ? (
          <Image src={photo.url} alt={photo.alt} fill sizes="33vw" className="object-cover" />
        ) : null}
      </div>
      <div className="p-3">
        <p
          className="truncate"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-lg)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {stay.name}
        </p>
        <p
          className="mt-0.5"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-secondary)',
          }}
        >
          {stay.location.region ?? stay.location.country}
          {stay.location.neighborhood ? ` · ${stay.location.neighborhood}` : ''}
        </p>

        <dl className="mt-3 space-y-1.5">
          <Row
            label="Per night"
            value={`${stay.pricing.pricePerNight.amount.toLocaleString()} ${stay.pricing.pricePerNight.currency}`}
            emphasized={cheapest}
          />
          <Row label="Sleeps" value={`${stay.capacity.sleeps}`} />
          {typeof stay.signals.walkability === 'number' ? (
            <Row label="Walkability" value={`${stay.signals.walkability}/100`} />
          ) : null}
          {typeof stay.signals.familyFit === 'number' ? (
            <Row label="Family fit" value={`${stay.signals.familyFit}/100`} />
          ) : null}
        </dl>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {stay.signals.tags.slice(0, 4).map((t) => (
            <li
              key={t}
              className="rounded-full border px-2 py-0.5"
              style={{
                background: 'var(--surface-overlay)',
                borderColor: 'var(--border-subtle)',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.6875rem',
                color: 'var(--ink-secondary)',
              }}
            >
              {t.replace(/-/g, ' ')}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Row({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6875rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontFamily: emphasized ? 'var(--font-fraunces)' : 'var(--font-inter)',
          fontSize: emphasized ? 'var(--text-body-lg)' : 'var(--text-body-sm)',
          color: emphasized ? 'var(--accent-primary)' : 'var(--ink-primary)',
        }}
      >
        {value}
      </dd>
    </div>
  );
}
