'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Lock, Share2, X } from '@/features/shared/icons';
import { findDestinationBySlugOrAlias } from '@lib/curation/destinations';
import type { SavedTripRow as SavedTripRowData } from '../hooks/use-saved-trips';
import { ShareModal } from './share-modal';
import { MonitoringBadge } from './monitoring-badge';
import { BookThisButton } from '@/features/bookings/book-this-button';

/**
 * Single row in the saved-trips panel. Affordances:
 *  - Click the row body → resurface the saved trip on the workspace
 *    canvas (parent passes onSelect).
 *  - Share button → opens the share modal (mints slug lazily).
 *  - X button → removes (with optimistic update at the hook layer).
 *
 * Visuals lean on the same card vocabulary as the canvas trip-board so
 * a saved trip feels like a snapshot of the moment it was bookmarked.
 */
export function SavedTripRow({
  trip,
  index,
  onSelect,
  onRemove,
  onShare,
  removing,
}: {
  trip: SavedTripRowData;
  index: number;
  onSelect: () => void;
  onRemove: () => void;
  onShare: () => Promise<{ slug: string; url: string } | null>;
  removing: boolean;
}) {
  const summary = trip.proposalSummary;
  const bookmarked = new Date(trip.bookmarkedAt);
  const dateLabel = bookmarked.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const [shareOpen, setShareOpen] = useState(false);

  // C4 hint: itineraries fall back to the synthesized generator (premium-
  // gated for free users) for any destination outside the curated library.
  // Show a small lock glyph next to the "Plan day-by-day" link so users
  // see the gate at a glance. The page itself is the source of truth.
  const isCurated = findDestinationBySlugOrAlias(summary.destinationName) !== null;

  function handleRowClick(e: React.MouseEvent) {
    // Don't resurface when clicking the action buttons.
    if ((e.target as HTMLElement).closest('button[data-row-action]')) return;
    onSelect();
  }

  return (
    <>
      <motion.li
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.32, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
        className="group relative cursor-pointer rounded-[14px] border p-4 transition-colors hover:border-[color:var(--border-emphasis)]"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
        onClick={handleRowClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-tertiary)',
              }}
            >
              {summary.destinationName}
              {summary.nights > 0
                ? ` · ${summary.nights} ${summary.nights === 1 ? 'night' : 'nights'}`
                : ''}
            </p>
            <h3
              className="mt-1 truncate"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-body-lg)',
                fontWeight: 400,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {summary.heroStayName}
            </h3>
            {trip.monitoringEvents.length > 0 ? (
              <div className="mt-2">
                <MonitoringBadge events={trip.monitoringEvents} />
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              data-row-action
              onClick={() => setShareOpen(true)}
              aria-label={`Share ${summary.heroStayName}`}
              className="grid h-7 w-7 place-items-center rounded-full border transition-colors hover:bg-[color:var(--surface-overlay)]"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-secondary)' }}
            >
              <Share2 size={13} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              data-row-action
              onClick={onRemove}
              disabled={removing}
              aria-label={`Remove ${summary.heroStayName}`}
              className="grid h-7 w-7 place-items-center rounded-full border transition-colors hover:bg-[color:var(--surface-overlay)] disabled:pointer-events-none disabled:opacity-30"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-secondary)' }}
            >
              <X size={13} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {trip.proposal.reasoning.totalCost ? (
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--accent-primary)',
              letterSpacing: '-0.005em',
            }}
          >
            {trip.proposal.reasoning.totalCost.amount.toLocaleString()}{' '}
            {trip.proposal.reasoning.totalCost.currency} total
          </p>
        ) : null}

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <p
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.625rem',
              letterSpacing: '0.04em',
              color: 'var(--ink-tertiary)',
            }}
          >
            Bookmarked {dateLabel}
          </p>
          <div className="flex items-center gap-3">
            <BookThisButton trip={trip} />
            <Link
              href={`/trips/${trip.id}/itinerary`}
              data-row-action
              className="inline-flex items-center gap-1 transition-colors hover:text-[color:var(--accent-primary)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink-secondary)',
                fontWeight: 500,
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label={
                isCurated
                  ? `Plan ${summary.destinationName} day-by-day`
                  : `Plan ${summary.destinationName} day-by-day (premium for non-curated destinations)`
              }
              title={isCurated ? undefined : 'Day-by-day for non-curated destinations is premium'}
            >
              {!isCurated && (
                <Lock
                  size={10}
                  strokeWidth={2.2}
                  style={{ color: 'var(--ink-tertiary)' }}
                  aria-hidden="true"
                />
              )}
              Plan day-by-day
              <ArrowRight size={11} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </motion.li>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        resolve={onShare}
        tripName={summary.heroStayName}
      />
    </>
  );
}
