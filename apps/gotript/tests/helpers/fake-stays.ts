import type { Stay } from '@core/stay';
import { providerId, stayId } from '@core/ids';

/**
 * Inline stay factory for unit tests that need stays as fixture data
 * (proposal-builder, proposal-diff, ranking-refine).
 *
 * Pre-H2 these tests imported `ALL_STAYS` from the now-deleted
 * mock-italy provider. Constructing stays inline keeps the tests
 * stand-alone and removes the temptation to revive the mock provider
 * just for fixture data.
 *
 * The returned stays are intentionally bland - same destination, same
 * shape, varying only id/name/price - so tests can assert on diff /
 * ranking behavior without worrying about incidental fixture variance.
 */

interface FakeStayOverrides {
  slug?: string;
  name?: string;
  pricePerNight?: number;
  region?: string;
}

// Fixed reference time. The orchestrator parity test deep-equals event
// streams from two engines that call the provider milliseconds apart;
// using a live `new Date()` here would drift them, defeating the test.
// Tests that care about freshness staleness should override the helper.
const FAKE_FETCHED_AT = new Date('2026-05-12T07:00:00Z').toISOString();

export function makeFakeStay(i: number, overrides: FakeStayOverrides = {}): Stay {
  const slug = overrides.slug ?? `villa-${i}`;
  const price = overrides.pricePerNight ?? 320 + i * 50;
  return {
    id: stayId(`fake:${slug}`),
    providerId: providerId('fake'),
    name: overrides.name ?? `Villa ${i}`,
    type: 'villa',
    location: {
      country: 'IT',
      region: overrides.region ?? 'Tuscany',
      locality: 'Tuscany',
    },
    description: `A stone villa with olive groves and a pool. Walkable to the village.`,
    photos: [
      {
        url: `https://images.unsplash.com/photo-${slug}`,
        source: 'curated',
        alt: `Villa ${i}`,
      },
    ],
    pricing: {
      pricePerNight: { amount: price, currency: 'EUR' },
    },
    amenities: [
      { id: 'pool', label: 'Pool' },
      { id: 'wifi', label: 'Wi-Fi' },
    ],
    capacity: { sleeps: 4, bedrooms: 2, bathrooms: 2 },
    signals: { tags: ['walkable', 'family-friendly'] },
    bookingLink: { url: 'https://example.com/villa', type: 'redirect' },
    fetchedAt: FAKE_FETCHED_AT,
  };
}

/** Convenience: a stable pool of stays. Each call returns the same N. */
export function fakeStayPool(count: number): Stay[] {
  return Array.from({ length: count }, (_, i) => makeFakeStay(i));
}
