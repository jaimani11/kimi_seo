import { describe, expect, it } from 'vitest';
import { InMemorySessionStore } from '@/lib/session/in-memory-session-store';
import { providerId, stayId } from '@core/ids';
import type { SaveTripArgs } from '@/lib/session/session-store';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

const intent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
  budget: { kind: 'unspecified' },
  vibe: { tags: [] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'r',
};

function fakeProposal(native: string): TripProposal {
  return {
    intent,
    hero: {
      id: stayId(`mock-italy:${native}`),
      providerId: providerId('mock-italy'),
      name: 'Villa',
      type: 'villa',
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
    reasoning: { highlights: [], summary: '' },
    agentTrace: { agents: [], totalDurationMs: 0 },
    generatedAt: new Date().toISOString(),
  };
}

function args(ownerId: string, proposalId: string): SaveTripArgs {
  return {
    ownerKind: 'session',
    ownerId,
    proposalId,
    proposalSummary: { destinationName: 'Tuscany', nights: 7, heroStayName: 'Villa' },
    proposal: fakeProposal(`s-${proposalId}`),
    intent,
  };
}

describe('migrateAnonymousToUser (in-memory)', () => {
  it('moves all anon trips onto the new userId', async () => {
    const s = new InMemorySessionStore();
    await s.saveTrip(args('anon_alice', 'p_1'));
    await s.saveTrip(args('anon_alice', 'p_2'));

    const result = await s.migrateAnonymousToUser({
      fromSessionId: 'anon_alice',
      toUserId: 'user_alice',
    });

    expect(result.tripsCopied).toBe(2);
    expect(result.movedUserId).toBe('user_alice');

    // Source bucket emptied; destination has both trips, owned by user.
    const anonAfter = await s.listTrips({ ownerKind: 'session', ownerId: 'anon_alice' });
    expect(anonAfter).toHaveLength(0);

    const userAfter = await s.listTrips({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(userAfter).toHaveLength(2);
    for (const trip of userAfter) {
      expect(trip.ownerKind).toBe('user');
      expect(trip.ownerId).toBe('user_alice');
    }
  });

  it('returns tripsCopied: 0 when there are no anonymous trips', async () => {
    const s = new InMemorySessionStore();
    const result = await s.migrateAnonymousToUser({
      fromSessionId: 'anon_empty',
      toUserId: 'user_empty',
    });
    expect(result.tripsCopied).toBe(0);
  });

  it('is idempotent - a second call adds nothing', async () => {
    const s = new InMemorySessionStore();
    await s.saveTrip(args('anon_bob', 'p_1'));

    await s.migrateAnonymousToUser({ fromSessionId: 'anon_bob', toUserId: 'user_bob' });
    // Second call: anon bucket is empty, so nothing to move.
    const second = await s.migrateAnonymousToUser({
      fromSessionId: 'anon_bob',
      toUserId: 'user_bob',
    });

    expect(second.tripsCopied).toBe(0);
    const userTrips = await s.listTrips({ ownerKind: 'user', ownerId: 'user_bob' });
    expect(userTrips).toHaveLength(1);
  });

  it('does not duplicate when destination already has the same proposal', async () => {
    const s = new InMemorySessionStore();
    // Bob saved p_1 anonymously, then signed in elsewhere and saved p_1
    // again as user_bob. Anon → user migration must not duplicate.
    await s.saveTrip(args('anon_bob', 'p_1'));
    await s.saveTrip({ ...args('user_bob', 'p_1'), ownerKind: 'user' });

    const result = await s.migrateAnonymousToUser({
      fromSessionId: 'anon_bob',
      toUserId: 'user_bob',
    });

    expect(result.tripsCopied).toBe(0);
    const userTrips = await s.listTrips({ ownerKind: 'user', ownerId: 'user_bob' });
    expect(userTrips).toHaveLength(1);
  });
});
