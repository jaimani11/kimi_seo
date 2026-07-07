'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, X } from '@/features/shared/icons';
import { useWorkspaceStore } from '../store/workspace-store';
import { selectStayById, selectTurnContainingStay } from '../store/derived';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import { useSavedTrips } from '../hooks/use-saved-trips';
import { ConfirmRedirectModal } from './confirm-redirect-modal';
import { ProvenanceBadge } from '@/features/shared/provenance-badge';
import { ExpediaCta } from '@/features/shared/expedia-cta';

/**
 * Side-panel detail view. Triggered by clicking a stay card. Slides in
 * from the right (480px wide, glass border on the canvas-facing edge).
 * Closes via Esc / click-outside / X.
 */
export function DetailPanel() {
  const stayId = useWorkspaceStore((s) => s.detailViewStayId);
  const stay = useWorkspaceStore((s) => (stayId ? selectStayById(s, stayId) : null));
  const turn = useWorkspaceStore((s) => (stayId ? selectTurnContainingStay(s, stayId) : null));
  const closeDetail = useWorkspaceStore((s) => s.closeDetail);
  const openSavedPanel = useWorkspaceStore((s) => s.openSavedPanel);
  const reduced = useReducedMotion();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { save, mutating, isSaved } = useSavedTrips();
  const proposalRef = turn?.proposalRef;
  const proposal = turn?.proposal;
  const intent = turn?.intent;
  const alreadySaved = proposalRef ? isSaved(proposalRef.proposalId) : false;
  const canSave = !!(proposalRef && proposal && intent) && !alreadySaved && !mutating;

  async function handleSave() {
    if (!proposalRef || !proposal || !intent) return;
    const result = await save({ proposal, intent, proposalRef });
    if (result) openSavedPanel();
  }

  useEffect(() => {
    if (!stayId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmOpen) closeDetail();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [stayId, confirmOpen, closeDetail]);

  return (
    <>
      <AnimatePresence>
        {stay ? (
          <motion.aside
            key={`detail-${stay.id}`}
            initial={reduced ? { opacity: 0 } : { x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { x: '100%', opacity: 0 }}
            transition={{ duration: reduced ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[72px] right-0 z-30 flex h-[calc(100vh-72px)] w-full max-w-[480px] flex-col overflow-y-auto border-l backdrop-blur-[14px]"
            style={{
              background: 'rgba(20, 23, 28, 0.92)',
              borderColor: 'var(--border-emphasis)',
            }}
          >
            <header
              className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3 backdrop-blur-[14px]"
              style={{
                background: 'rgba(20, 23, 28, 0.86)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-tertiary)',
                    }}
                  >
                    {stay.location.region ?? stay.location.country}
                  </p>
                  <ProvenanceBadge providerId={stay.providerId} variant="panel" />
                </div>
                <h2
                  className="mt-1 truncate"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: 'var(--text-display-sm)',
                    fontWeight: 400,
                    color: 'var(--ink-primary)',
                    maxWidth: '320px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stay.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                aria-label="Close detail"
                className="grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-[color:var(--surface-overlay)]"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-secondary)' }}
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </header>

            <div className="px-5 py-5">
              {stay.photos[0] ? (
                <div
                  className="relative w-full overflow-hidden rounded-[18px] border"
                  style={{
                    aspectRatio: '4/3',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <Image
                    src={stay.photos[0].url}
                    alt={stay.photos[0].alt}
                    fill
                    sizes="480px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <p
                className="mt-4"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-body)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  lineHeight: 1.55,
                  color: 'var(--ink-primary)',
                }}
              >
                {stay.description}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <Stat
                  label="Per night"
                  value={`${stay.pricing.pricePerNight.amount.toLocaleString()} ${stay.pricing.pricePerNight.currency}`}
                  display
                />
                <Stat
                  label="Sleeps"
                  value={`${stay.capacity.sleeps}${stay.capacity.bedrooms ? ` · ${stay.capacity.bedrooms} bd` : ''}`}
                />
                {typeof stay.signals.walkability === 'number' ? (
                  <Stat label="Walkability" value={`${stay.signals.walkability}/100`} />
                ) : null}
                {typeof stay.signals.familyFit === 'number' ? (
                  <Stat label="Family fit" value={`${stay.signals.familyFit}/100`} />
                ) : null}
              </dl>

              <h3
                className="mt-5 mb-2"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                }}
              >
                Amenities
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {stay.amenities.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-full border px-2 py-0.5"
                    style={{
                      background: 'var(--surface-overlay)',
                      borderColor: 'var(--border-subtle)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      color: 'var(--ink-secondary)',
                    }}
                  >
                    {a.label}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3">
                {/* Primary affiliate CTA - replaces the old "Continue to
                 *  Booking" button. Built-in disclosure (Powered by Expedia
                 *  · Affiliate link · Prices may change) lives directly
                 *  beneath the button. Routes via /r/[id] for click
                 *  attribution + recordClick. */}
                {intent ? (
                  <ExpediaCta
                    stay={stay}
                    intent={intent}
                    {...(turn?.turnId ? { turnId: turn.turnId } : {})}
                    variant="primary"
                  />
                ) : null}

                {proposalRef ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave && !alreadySaved}
                    className="flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 transition-colors hover:bg-[color:var(--surface-overlay)] disabled:cursor-default disabled:opacity-70"
                    style={{
                      background: alreadySaved ? 'var(--surface-overlay)' : 'transparent',
                      borderColor: 'var(--border-emphasis)',
                      color: 'var(--ink-primary)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: 500,
                      letterSpacing: '-0.005em',
                    }}
                    aria-label={alreadySaved ? 'Trip already saved' : 'Save this trip'}
                  >
                    {alreadySaved ? (
                      <>
                        <BookmarkCheck size={14} strokeWidth={1.8} />
                        Trip saved
                      </>
                    ) : (
                      <>
                        <Bookmark size={14} strokeWidth={1.8} />
                        {mutating ? 'Saving…' : 'Save this trip'}
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {stay ? (
        <ConfirmRedirectModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          stay={stay}
          {...(turn?.turnId ? { turnId: turn.turnId } : {})}
        />
      ) : null}
    </>
  );
}

function Stat({
  label,
  value,
  display = false,
}: {
  label: string;
  value: string;
  display?: boolean;
}) {
  return (
    <div
      className="rounded-[12px] border px-3 py-2"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <dt
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.625rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </dt>
      <dd
        className="mt-0.5"
        style={{
          fontFamily: display ? 'var(--font-fraunces)' : 'var(--font-inter)',
          fontSize: display ? 'var(--text-body-lg)' : 'var(--text-body-sm)',
          color: display ? 'var(--accent-primary)' : 'var(--ink-primary)',
          letterSpacing: display ? '-0.01em' : 'normal',
        }}
      >
        {value}
      </dd>
    </div>
  );
}
