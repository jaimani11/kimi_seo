import { describe, expect, it } from 'vitest';
import {
  CuratedItineraryGenerator,
  SynthesizedItineraryGenerator,
} from '@/lib/itinerary/generator';
import type { SavedTrip } from '@lib/session/session-store';
import { providerId, stayId } from '@core/ids';
import { ItinerarySchema } from '@core/itinerary';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

function makeTrip(overrides: { destinationName: string; tags?: string[] }): SavedTrip {
  const intent: TripIntent = {
    destinations: [{ kind: 'curated', name: overrides.destinationName, country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 7, flexible: false },
    travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
    budget: { kind: 'unspecified' },
    vibe: { tags: (overrides.tags ?? []) as TripIntent['vibe']['tags'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: `${overrides.destinationName} 7 days`,
  };
  const proposal: TripProposal = {
    intent,
    hero: {
      id: stayId('mock-italy:test'),
      providerId: providerId('mock-italy'),
      name: 'Test Hotel',
      type: 'hotel',
      location: { country: 'IT' },
      photos: [],
      pricing: { pricePerNight: { amount: 100, currency: 'EUR' } },
      capacity: { sleeps: 2 },
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
  return {
    id: 'trip_test',
    ownerKind: 'session',
    ownerId: 'anon_t',
    proposalId: 'p_test',
    proposalSummary: {
      destinationName: overrides.destinationName,
      nights: 7,
      heroStayName: 'Test Hotel',
    },
    proposal,
    intent,
    bookmarkedAt: new Date().toISOString(),
  };
}

describe('CuratedItineraryGenerator', () => {
  const synthesized = new SynthesizedItineraryGenerator();
  const curated = new CuratedItineraryGenerator(synthesized);

  it('returns a curated itinerary for a known destination (Tuscany)', async () => {
    const itin = await curated.generate(makeTrip({ destinationName: 'Tuscany' }));
    expect(itin.source).toBe('curated');
    expect(itin.tripId).toBe('trip_test');
    expect(itin.days).toHaveLength(3);
    expect(ItinerarySchema.safeParse(itin).success).toBe(true);
  });

  it('returns a curated itinerary by destination alias (Florence → Tuscany)', async () => {
    const itin = await curated.generate(makeTrip({ destinationName: 'Florence' }));
    expect(itin.source).toBe('curated');
    // First day theme references Florence (the curated Tuscany template).
    expect(itin.days[0]?.theme).toContain('Florence');
  });

  it('falls through to synthesized for non-curated destinations', async () => {
    const itin = await curated.generate(makeTrip({ destinationName: 'Tokyo' }));
    expect(itin.source).toBe('synthesized');
    expect(ItinerarySchema.safeParse(itin).success).toBe(true);
    expect(itin.days).toHaveLength(3);
  });

  it('synthesized output incorporates vibe tags into copy', async () => {
    const itin = await curated.generate(
      makeTrip({ destinationName: 'Reykjavik', tags: ['walkable', 'slow'] }),
    );
    expect(itin.source).toBe('synthesized');
    // The morning title varies by walkable; "walk through" appears.
    const day1 = itin.days[0];
    expect(day1).toBeDefined();
    const allTitles = day1!.slots.map((s) => s.title).join(' | ');
    expect(allTitles.toLowerCase()).toContain('walk');
  });

  it('produced itinerary stamps tripId from the SavedTrip', async () => {
    const trip = makeTrip({ destinationName: 'Tuscany' });
    const trip2 = { ...trip, id: 'trip_other' };
    const itin1 = await curated.generate(trip);
    const itin2 = await curated.generate(trip2);
    expect(itin1.tripId).toBe('trip_test');
    expect(itin2.tripId).toBe('trip_other');
    // But the underlying day content is the same template.
    expect(itin1.days[0]?.theme).toBe(itin2.days[0]?.theme);
  });
});

describe('SynthesizedItineraryGenerator', () => {
  const gen = new SynthesizedItineraryGenerator();

  it('always produces a valid 3-day itinerary', async () => {
    const itin = await gen.generate(makeTrip({ destinationName: 'Anywhere' }));
    expect(ItinerarySchema.safeParse(itin).success).toBe(true);
    expect(itin.days).toHaveLength(3);
  });

  it('handles missing destinations gracefully', async () => {
    const trip = makeTrip({ destinationName: '' });
    trip.intent.destinations = [];
    trip.proposalSummary = {
      destinationName: 'Unknown',
      nights: 7,
      heroStayName: 'Test Hotel',
    };
    const itin = await gen.generate(trip);
    expect(ItinerarySchema.safeParse(itin).success).toBe(true);
    expect(itin.summary).toContain('Unknown');
  });
});
