import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryItineraryStore } from '@/lib/itinerary/in-memory-itinerary-store';
import type { Itinerary } from '@core/itinerary';

function fakeItinerary(tripId: string): Itinerary {
  return {
    tripId,
    generatedAt: new Date().toISOString(),
    source: 'curated',
    summary: 'Three days here.',
    days: [
      {
        dayNumber: 1,
        theme: 'Day one',
        slots: [
          {
            id: 'a',
            kind: 'meal',
            startHint: 'morning',
            title: 'Coffee',
            detail: 'Have a coffee somewhere local.',
          },
          {
            id: 'b',
            kind: 'activity',
            startHint: 'morning',
            title: 'Walk',
            detail: 'Walk through the central neighborhood for an hour.',
          },
          {
            id: 'c',
            kind: 'meal',
            startHint: 'midday',
            title: 'Lunch',
            detail: 'Eat where the locals eat - cheap, busy, no English menu.',
          },
          {
            id: 'd',
            kind: 'activity',
            startHint: 'afternoon',
            title: 'Explore',
            detail: 'Pick one thing this afternoon. The rest can wait.',
          },
        ],
      },
    ],
  };
}

describe('InMemoryItineraryStore', () => {
  let store: InMemoryItineraryStore;

  beforeEach(() => {
    store = new InMemoryItineraryStore();
  });

  it('returns null for an unknown tripId', async () => {
    expect(await store.get('missing')).toBeNull();
  });

  it('round-trips an itinerary', async () => {
    const itin = fakeItinerary('trip_a');
    await store.put(itin);
    const got = await store.get('trip_a');
    expect(got?.tripId).toBe('trip_a');
    expect(got?.days).toHaveLength(1);
  });

  it('overwrites on put with the same tripId', async () => {
    await store.put(fakeItinerary('trip_a'));
    const itin2 = fakeItinerary('trip_a');
    itin2.summary = 'Different summary';
    await store.put(itin2);
    const got = await store.get('trip_a');
    expect(got?.summary).toBe('Different summary');
    expect(store.size()).toBe(1);
  });

  it('invalidate removes the cached entry', async () => {
    await store.put(fakeItinerary('trip_a'));
    await store.invalidate('trip_a');
    expect(await store.get('trip_a')).toBeNull();
  });

  it('isolates by tripId', async () => {
    await store.put(fakeItinerary('trip_a'));
    await store.put(fakeItinerary('trip_b'));
    expect((await store.get('trip_a'))?.tripId).toBe('trip_a');
    expect((await store.get('trip_b'))?.tripId).toBe('trip_b');
  });
});
