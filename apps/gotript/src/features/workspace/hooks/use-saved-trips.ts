'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';
import type { ProposalRef } from '@core/partial';
import type { MonitoringEvent } from '@lib/monitoring';

/**
 * Saved trip - what /api/trips/list returns. Matches SessionStore's
 * SavedTrip shape (we keep it duplicated here to avoid the workspace
 * feature reaching across layers into @lib/session - that would
 * violate the boundaries lint).
 *
 * Slice C2 - `monitoringEvents` is the unacknowledged event list for
 * this trip. Empty = no badge; non-empty = badge with the most recent
 * event.
 */
export interface SavedTripRow {
  id: string;
  ownerKind: 'user' | 'session';
  ownerId: string;
  conversationId?: string;
  proposalId: string;
  proposalSummary: ProposalRef['summary'];
  proposal: TripProposal;
  intent: TripIntent;
  shareSlug?: string;
  bookmarkedAt: string;
  monitoringEvents: MonitoringEvent[];
}

interface SaveArgs {
  proposal: TripProposal;
  intent: TripIntent;
  proposalRef: ProposalRef;
  conversationId?: string;
}

interface UseSavedTripsResult {
  trips: SavedTripRow[];
  loading: boolean;
  error: string | null;
  /** True while a save/delete request is in flight. */
  mutating: boolean;
  refresh: () => Promise<void>;
  save: (args: SaveArgs) => Promise<SavedTripRow | null>;
  remove: (tripId: string) => Promise<boolean>;
  /** True if a trip with this proposalId is already saved. */
  isSaved: (proposalId: string) => boolean;
  /** Mints (or returns existing) share slug + URL for a saved trip. */
  share: (tripId: string) => Promise<{ slug: string; url: string } | null>;
  /**
   * Fire-and-forget resurface POST. Primes the SessionStore with a
   * synthetic turn record so refining the resurfaced trip works.
   * Errors are logged but never thrown - the local resurface UX
   * proceeds regardless of network state.
   */
  resurface: (tripId: string) => Promise<void>;
  /**
   * Mark monitoring events for a trip as acknowledged. Optimistic
   * client-side: clears the local badge immediately, then POSTs
   * server-side ack. Errors logged.
   */
  acknowledgeMonitoring: (tripId: string) => Promise<void>;
}

export function useSavedTrips(): UseSavedTripsResult {
  const [trips, setTrips] = useState<SavedTripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trips/list', { cache: 'no-store' });
      if (!res.ok) throw new Error(`list ${res.status}`);
      const data = (await res.json()) as { trips: SavedTripRow[] };
      setTrips(data.trips);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'list failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // refresh() calls setLoading(true) before awaiting fetch - that's
    // the legitimate "sync external state into React" pattern the rule
    // is supposed to allow but flags anyway when the trigger is an
    // async function call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const save = useCallback(async (args: SaveArgs): Promise<SavedTripRow | null> => {
    setMutating(true);
    setError(null);
    try {
      const res = await fetch('/api/trips/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal: args.proposal,
          intent: args.intent,
          proposalRef: args.proposalRef,
          ...(args.conversationId ? { conversationId: args.conversationId } : {}),
        }),
      });
      if (!res.ok) throw new Error(`save ${res.status}`);
      const data = (await res.json()) as { ok: true; trip: Omit<SavedTripRow, 'monitoringEvents'> };
      // /api/trips/save doesn't run the monitoring runner - default to
      // empty until the next /api/trips/list fetch enriches the row.
      const tripRow: SavedTripRow = { ...data.trip, monitoringEvents: [] };
      setTrips((prev) => {
        const existing = prev.findIndex((t) => t.proposalId === tripRow.proposalId);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = tripRow;
          return next;
        }
        return [tripRow, ...prev];
      });
      return tripRow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed');
      return null;
    } finally {
      setMutating(false);
    }
  }, []);

  const remove = useCallback(async (tripId: string): Promise<boolean> => {
    setMutating(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete ${res.status}`);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed');
      return false;
    } finally {
      setMutating(false);
    }
  }, []);

  const isSaved = useCallback(
    (proposalId: string) => trips.some((t) => t.proposalId === proposalId),
    [trips],
  );

  const share = useCallback(
    async (tripId: string): Promise<{ slug: string; url: string } | null> => {
      try {
        const res = await fetch(`/api/trips/${tripId}/share`, { method: 'POST' });
        if (!res.ok) throw new Error(`share ${res.status}`);
        const data = (await res.json()) as { ok: true; slug: string; url: string };
        // Cache the slug on the local row so a re-share doesn't re-POST.
        setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, shareSlug: data.slug } : t)));
        return { slug: data.slug, url: data.url };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'share failed');
        return null;
      }
    },
    [],
  );

  const resurface = useCallback(async (tripId: string): Promise<void> => {
    try {
      await fetch(`/api/trips/${tripId}/resurface`, { method: 'POST' });
    } catch (err) {
      console.warn('[use-saved-trips] resurface failed', err);
    }
  }, []);

  const acknowledgeMonitoring = useCallback(async (tripId: string): Promise<void> => {
    // Optimistic - clear the local badge immediately so the row stops
    // pulsing the moment the user clicks. The server-side ack is a
    // background sync; failures only affect the next page load.
    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, monitoringEvents: [] } : t)));
    try {
      await fetch(`/api/trips/${tripId}/monitoring/acknowledge`, { method: 'POST' });
    } catch (err) {
      console.warn('[use-saved-trips] acknowledge failed', err);
    }
  }, []);

  return {
    trips,
    loading,
    error,
    mutating,
    refresh,
    save,
    remove,
    isSaved,
    share,
    resurface,
    acknowledgeMonitoring,
  };
}
