'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Bookmark, X } from '@/features/shared/icons';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import { useWorkspaceStore } from '../store/workspace-store';
import { useSavedTrips, type SavedTripRow as SavedTripRowData } from '../hooks/use-saved-trips';
import { SavedTripRow } from './saved-trip-row';
import type { ProposalRef } from '@core/partial';

/**
 * Slide-in panel listing saved trips. Mirrors the detail panel's
 * geometry (480px right-anchored) so the workspace has a consistent
 * "side drawer" vocabulary.
 *
 * Anonymous users see their session's bookmarks; signed-in users see
 * theirs. After sign-in, the migrate route runs and the list re-fetches
 * so the prior anonymous trips appear in the authenticated view.
 */
export function SavedTripsPanel() {
  const open = useWorkspaceStore((s) => s.savedPanelOpen);
  const closeSavedPanel = useWorkspaceStore((s) => s.closeSavedPanel);
  const resurfaceSavedTrip = useWorkspaceStore((s) => s.resurfaceSavedTrip);
  const reduced = useReducedMotion();
  const {
    trips,
    loading,
    error,
    mutating,
    remove,
    refresh,
    share,
    resurface,
    acknowledgeMonitoring,
  } = useSavedTrips();

  function handleSelect(trip: SavedTripRowData) {
    // Prime the SessionStore so the orchestrator's getTurn(priorProposalRef.turnId)
    // lookup resolves on a subsequent refine. Fire-and-forget - never
    // gates the local UX (B8 tenet: network shouldn't block resurface).
    void resurface(trip.id);

    // Slice C2: clicking a row clears its monitoring badge - the user
    // has seen what changed (the panel was open, the row was visible
    // long enough to be clicked).
    if (trip.monitoringEvents.length > 0) {
      void acknowledgeMonitoring(trip.id);
    }

    // Reconstruct a stable ProposalRef + push the saved trip onto the
    // workspace as a settled turn. Use the saved trip's id as the
    // turnId for stability across re-clicks (de-dupe via the store).
    const proposalRef: ProposalRef = {
      turnId: trip.id,
      proposalId: trip.proposalId,
      generatedAt: trip.proposal.generatedAt,
      summary: trip.proposalSummary,
    };
    resurfaceSavedTrip({
      turnId: trip.id,
      proposal: trip.proposal,
      intent: trip.intent,
      proposalRef,
      bookmarkedAt: trip.bookmarkedAt,
    });
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSavedPanel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closeSavedPanel]);

  // Re-fetch when the panel opens - covers the post-sign-in case where
  // the migration route just promoted anonymous trips to user-owned.
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key="saved-trips"
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
            <div className="flex items-center gap-2">
              <Bookmark size={15} strokeWidth={1.8} />
              <h2
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-display-sm)',
                  fontWeight: 400,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Saved trips
              </h2>
            </div>
            <button
              type="button"
              onClick={closeSavedPanel}
              aria-label="Close saved trips"
              className="grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-[color:var(--surface-overlay)]"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-secondary)' }}
            >
              <X size={15} strokeWidth={1.8} />
            </button>
          </header>

          <div className="flex-1 px-5 py-5">
            {loading && trips.length === 0 ? (
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-body)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  color: 'var(--ink-tertiary)',
                }}
              >
                Gathering your saved trips…
              </p>
            ) : error ? (
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--accent-warning)',
                }}
              >
                Couldn&apos;t load saved trips: {error}
              </p>
            ) : trips.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {trips.map((trip, i) => (
                    <SavedTripRow
                      key={trip.id}
                      trip={trip}
                      index={i}
                      onSelect={() => handleSelect(trip)}
                      onRemove={() => void remove(trip.id)}
                      onShare={() => share(trip.id)}
                      removing={mutating}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-[14px] border p-5"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-body)',
          fontStyle: 'italic',
          fontWeight: 300,
          lineHeight: 1.5,
          color: 'var(--ink-secondary)',
        }}
      >
        Nothing saved yet. Open a trip in the canvas, look closer at any stay, and use Save trip to
        keep it here.
      </p>
    </div>
  );
}
