import type { Itinerary } from '@core/itinerary';

/**
 * Persistence boundary for cached itineraries. C3 ships only the
 * in-memory implementation (process-local, HMR-safe); a Postgres
 * impl lands in C3.x when itineraries become user-editable.
 *
 * Owner attribution flows through `tripId` - the page route confirms
 * trip ownership before reading the cache, so the store itself is
 * tripId-keyed without owner state.
 */

export interface ItineraryStore {
  get(tripId: string): Promise<Itinerary | null>;
  put(itinerary: Itinerary): Promise<void>;
  /** Used by tests + the (future) "regenerate" CTA. */
  invalidate(tripId: string): Promise<void>;
}
