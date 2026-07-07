import { describe, expect, it } from 'vitest';
import { MockMonitoringChecker } from '@/lib/monitoring/checker';
import type { SavedTrip } from '@lib/session/session-store';
import { providerId, stayId } from '@core/ids';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

const intent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
  budget: { kind: 'unspecified' },
  vibe: { tags: ['walkable'] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'Tuscany',
};

const proposal: TripProposal = {
  intent,
  hero: {
    id: stayId('mock-italy:aman-venice'),
    providerId: providerId('mock-italy'),
    name: 'Aman Venice',
    type: 'palazzo',
    location: { country: 'IT', region: 'Veneto' },
    photos: [],
    pricing: { pricePerNight: { amount: 1850, currency: 'EUR' } },
    capacity: { sleeps: 3 },
    amenities: [],
    signals: { tags: [] },
    description: '',
    bookingLink: { url: 'https://example.com', type: 'redirect' },
    fetchedAt: new Date().toISOString(),
  },
  alternatives: [],
  reasoning: { highlights: [], summary: 'Test' },
  agentTrace: { agents: [], totalDurationMs: 0 },
  generatedAt: new Date().toISOString(),
};

const baseTrip: SavedTrip = {
  id: 'trip_test',
  ownerKind: 'session',
  ownerId: 'anon_t',
  proposalId: 'p_x',
  proposalSummary: { destinationName: 'Tuscany', nights: 7, heroStayName: 'Aman Venice' },
  proposal,
  intent,
  bookmarkedAt: new Date(0).toISOString(),
};

describe('MockMonitoringChecker', () => {
  const checker = new MockMonitoringChecker();
  const FIXED_NOW = 1_700_000_000_000; // arbitrary - keeps minute bucket stable

  it('returns the same result for the same (tripId, minute) - deterministic', async () => {
    const a = await checker.check({ trip: baseTrip, prevSnapshot: null, now: FIXED_NOW });
    const b = await checker.check({ trip: baseTrip, prevSnapshot: null, now: FIXED_NOW + 5_000 });
    expect(a?.id).toBe(b?.id);
    expect(a?.kind).toBe(b?.kind);
    expect(a?.message).toBe(b?.message);
  });

  it('returns owner attribution from the trip', async () => {
    const trip: SavedTrip = { ...baseTrip, id: 'trip_attrib_test' };
    const event = await checker.check({ trip, prevSnapshot: null, now: FIXED_NOW });
    if (event) {
      expect(event.ownerKind).toBe('session');
      expect(event.ownerId).toBe('anon_t');
      expect(event.tripId).toBe('trip_attrib_test');
    }
  });

  it('lottery distribution matches weights over many trials (within tolerance)', async () => {
    // Run across many minute buckets to get an empirical distribution.
    const trip: SavedTrip = { ...baseTrip, id: 'trip_dist' };
    const counts = {
      null: 0,
      'price-drop': 0,
      'price-rise': 0,
      'better-match': 0,
      'new-alternative': 0,
      unavailable: 0,
    };
    const trials = 1000;
    for (let i = 0; i < trials; i += 1) {
      const event = await checker.check({
        trip,
        prevSnapshot: null,
        // Vary the minute bucket for distinct seeds
        now: 1_700_000_000_000 + i * 60_000,
      });
      if (!event) counts.null += 1;
      else counts[event.kind] += 1;
    }
    // No-event ~20%, price-drop ~45%, price-rise ~15%, better-match ~10%,
    // new-alt ~5%, unavailable ~5%. Generous tolerance - randomness.
    expect(counts.null / trials).toBeGreaterThan(0.1);
    expect(counts.null / trials).toBeLessThan(0.3);
    expect(counts['price-drop'] / trials).toBeGreaterThan(0.35);
    expect(counts['price-drop'] / trials).toBeLessThan(0.55);
    expect(counts['price-rise'] / trials).toBeGreaterThan(0.07);
    expect(counts['price-rise'] / trials).toBeLessThan(0.23);
  });

  it('price-drop events have negative delta + message references hero name', async () => {
    // Find a seed that produces a price-drop event.
    const trip: SavedTrip = { ...baseTrip, id: 'trip_drop_test' };
    let found: Awaited<ReturnType<typeof checker.check>> | null = null;
    for (let i = 0; i < 50; i += 1) {
      const e = await checker.check({
        trip,
        prevSnapshot: null,
        now: 1_700_000_000_000 + i * 60_000,
      });
      if (e?.kind === 'price-drop') {
        found = e;
        break;
      }
    }
    expect(found).not.toBeNull();
    if (found) {
      expect(found.delta).toBeLessThan(0);
      expect(found.message).toContain('Aman Venice');
    }
  });
});
