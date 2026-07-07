import type { Itinerary } from '@core/itinerary';
import type { ItineraryStore } from './itinerary-store';

/**
 * Process-local cached itineraries. Survives across HMR via globalThis
 * so dev iteration doesn't regenerate every save.
 */
export class InMemoryItineraryStore implements ItineraryStore {
  private readonly cache = new Map<string, Itinerary>();

  async get(tripId: string): Promise<Itinerary | null> {
    return this.cache.get(tripId) ?? null;
  }

  async put(itinerary: Itinerary): Promise<void> {
    this.cache.set(itinerary.tripId, itinerary);
  }

  async invalidate(tripId: string): Promise<void> {
    this.cache.delete(tripId);
  }

  /** Test-only - wipe everything. */
  _reset(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

declare global {
  var __stayscoutItineraryStore: InMemoryItineraryStore | undefined;
}

export function getInMemoryItineraryStore(): InMemoryItineraryStore {
  if (!globalThis.__stayscoutItineraryStore) {
    globalThis.__stayscoutItineraryStore = new InMemoryItineraryStore();
  }
  return globalThis.__stayscoutItineraryStore;
}
