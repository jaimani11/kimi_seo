import { describe, expect, it } from 'vitest';
import { InMemorySessionStore } from '@/lib/session/in-memory-session-store';
import type { SessionStore, SaveTripArgs } from '@/lib/session/session-store';
import { providerId, stayId } from '@core/ids';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

/**
 * Contract test for SessionStore. Re-run against PostgresSessionStore
 * via tests/integration/postgres-session-store.test.ts when DATABASE_URL
 * is set.
 */

const intent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
  budget: { kind: 'unspecified' },
  vibe: { tags: ['walkable'] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'Italy 7 days',
};

function fakeProposal(heroNativeId: string): TripProposal {
  return {
    intent,
    hero: {
      id: stayId(`mock-italy:${heroNativeId}`),
      providerId: providerId('mock-italy'),
      name: 'Villa Test',
      type: 'villa',
      location: { country: 'IT', region: 'Tuscany' },
      photos: [],
      pricing: { pricePerNight: { amount: 200, currency: 'EUR' } },
      capacity: { sleeps: 4, bedrooms: 2, bathrooms: 2 },
      amenities: [],
      signals: { tags: ['walkable'] },
      description: 'A villa.',
      bookingLink: {
        url: 'https://example.com/redirect',
        type: 'redirect',
      },
      fetchedAt: new Date().toISOString(),
    },
    alternatives: [],
    reasoning: { highlights: [], summary: 'Test' },
    agentTrace: { agents: [], totalDurationMs: 0 },
    generatedAt: new Date().toISOString(),
  };
}

function saveArgs(overrides: Partial<SaveTripArgs> = {}): SaveTripArgs {
  return {
    ownerKind: 'session',
    ownerId: 'anon_test',
    proposalId: 'p_1',
    proposalSummary: { destinationName: 'Tuscany', nights: 7, heroStayName: 'Villa Test' },
    proposal: fakeProposal('s-1'),
    intent,
    ...overrides,
  };
}

function runContract(name: string, makeStore: () => SessionStore) {
  describe(`SessionStore contract: ${name}`, () => {
    it('returns null for an unknown turn', async () => {
      const s = makeStore();
      expect(await s.getTurn('missing')).toBeNull();
    });

    it('round-trips a turn record', async () => {
      const s = makeStore();
      await s.putTurn({
        turnId: 't1',
        sessionId: 'anon_a',
        type: 'compose',
        rawInput: 'Italy 7 days',
        intent,
        completedAt: Date.now(),
      });
      const got = await s.getTurn('t1');
      expect(got?.turnId).toBe('t1');
      expect(got?.intent.destinations[0]?.name).toBe('Tuscany');
    });

    it('saves a trip and lists it for the same owner', async () => {
      const s = makeStore();
      const saved = await s.saveTrip(saveArgs());
      expect(saved.id).toMatch(/^trip_/);
      expect(saved.ownerKind).toBe('session');
      expect(saved.ownerId).toBe('anon_test');
      const list = await s.listTrips({ ownerKind: 'session', ownerId: 'anon_test' });
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe(saved.id);
    });

    it('does not leak trips across owners', async () => {
      const s = makeStore();
      await s.saveTrip(saveArgs({ ownerId: 'anon_a' }));
      await s.saveTrip(saveArgs({ ownerId: 'anon_b', proposalId: 'p_2' }));
      const a = await s.listTrips({ ownerKind: 'session', ownerId: 'anon_a' });
      const b = await s.listTrips({ ownerKind: 'session', ownerId: 'anon_b' });
      expect(a).toHaveLength(1);
      expect(b).toHaveLength(1);
      expect(a[0]?.proposalId).toBe('p_1');
      expect(b[0]?.proposalId).toBe('p_2');
    });

    it('saveTrip is idempotent on (owner, proposalId)', async () => {
      const s = makeStore();
      const first = await s.saveTrip(saveArgs());
      const second = await s.saveTrip(saveArgs());
      expect(second.id).toBe(first.id);
      const list = await s.listTrips({ ownerKind: 'session', ownerId: 'anon_test' });
      expect(list).toHaveLength(1);
    });

    it('getTrip returns null when the owner does not match', async () => {
      const s = makeStore();
      const saved = await s.saveTrip(saveArgs({ ownerId: 'anon_a' }));
      const got = await s.getTrip({
        ownerKind: 'session',
        ownerId: 'anon_b',
        tripId: saved.id,
      });
      expect(got).toBeNull();
    });

    it('deleteTrip removes a trip and returns true', async () => {
      const s = makeStore();
      const saved = await s.saveTrip(saveArgs());
      const deleted = await s.deleteTrip({
        ownerKind: 'session',
        ownerId: 'anon_test',
        tripId: saved.id,
      });
      expect(deleted).toBe(true);
      expect(await s.listTrips({ ownerKind: 'session', ownerId: 'anon_test' })).toHaveLength(0);
    });

    it('deleteTrip returns false for an unknown id', async () => {
      const s = makeStore();
      const deleted = await s.deleteTrip({
        ownerKind: 'session',
        ownerId: 'anon_test',
        tripId: 'trip_missing',
      });
      expect(deleted).toBe(false);
    });

    // ============== Share links ==============

    it('mintShareSlug returns a slug and is idempotent', async () => {
      const s = makeStore();
      const saved = await s.saveTrip(saveArgs());
      const first = await s.mintShareSlug({
        ownerKind: 'session',
        ownerId: 'anon_test',
        tripId: saved.id,
      });
      expect(first).not.toBeNull();
      expect(first).toHaveLength(16);

      const second = await s.mintShareSlug({
        ownerKind: 'session',
        ownerId: 'anon_test',
        tripId: saved.id,
      });
      expect(second).toBe(first);
    });

    it('mintShareSlug returns null when the trip is not owned', async () => {
      const s = makeStore();
      const saved = await s.saveTrip(saveArgs({ ownerId: 'anon_a' }));
      const result = await s.mintShareSlug({
        ownerKind: 'session',
        ownerId: 'anon_b',
        tripId: saved.id,
      });
      expect(result).toBeNull();
    });

    it('getTripBySlug returns a sanitized SharedTrip (no rawInput)', async () => {
      const s = makeStore();
      const saved = await s.saveTrip(saveArgs());
      const slug = await s.mintShareSlug({
        ownerKind: 'session',
        ownerId: 'anon_test',
        tripId: saved.id,
      });
      if (!slug) throw new Error('mint failed');

      const shared = await s.getTripBySlug(slug);
      expect(shared).not.toBeNull();
      expect(shared?.proposalId).toBe(saved.proposalId);
      expect(shared?.intent.rawInput).toBe(''); // masked
      // Owner-identifying fields must not be on SharedTrip's surface.
      expect(shared && 'ownerId' in shared).toBe(false);
      expect(shared && 'ownerKind' in shared).toBe(false);
    });

    it('getTripBySlug returns null for an unknown slug', async () => {
      const s = makeStore();
      const result = await s.getTripBySlug('Nonexistent12345');
      expect(result).toBeNull();
    });

    // ============== Affiliate clicks ==============

    it('recordClick stores an attributed row and returns it', async () => {
      const s = makeStore();
      const click = await s.recordClick({
        ownerKind: 'session',
        ownerId: 'anon_alice',
        sessionId: 'anon_alice',
        stayId: 'mock-italy:aman-venice',
        providerId: 'mock-italy',
        affiliateUrl: 'https://example.com/redirect?id=aman-venice',
        turnId: 't_1',
      });
      expect(click.id).toMatch(/^click_|^c[a-z0-9]+/); // in-mem prefix or cuid
      expect(click.ownerKind).toBe('session');
      expect(click.ownerId).toBe('anon_alice');
      expect(click.stayId).toBe('mock-italy:aman-venice');
      expect(click.providerId).toBe('mock-italy');
      expect(click.affiliateUrl).toContain('aman-venice');
      expect(click.turnId).toBe('t_1');
      expect(click.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('recordClick attributes authenticated clicks to userId', async () => {
      const s = makeStore();
      const click = await s.recordClick({
        ownerKind: 'user',
        ownerId: 'user_bob',
        sessionId: 'anon_bob_session',
        stayId: 'mock-italy:cipriani',
        providerId: 'mock-italy',
        affiliateUrl: 'https://example.com/redirect?id=cipriani',
      });
      expect(click.ownerKind).toBe('user');
      expect(click.ownerId).toBe('user_bob');
      // sessionId still recorded - needed for cross-device reconciliation.
      expect(click.sessionId).toBe('anon_bob_session');
    });

    it('recordEvent stores ref + metadata and listEvents returns it', async () => {
      const s = makeStore();
      const stored = await s.recordEvent({
        kind: 'experience_view',
        ownerKind: 'session',
        ownerId: 'anon_a',
        sessionId: 'sess_a',
        ref: 'TOK-001',
        metadata: {
          title: 'Senso-ji at sunrise',
          imageUrl: 'https://cdn.example/sensoji.jpg',
          priceFromUsd: 18,
        },
      });
      expect(stored.ref).toBe('TOK-001');
      expect(stored.metadata).toEqual({
        title: 'Senso-ji at sunrise',
        imageUrl: 'https://cdn.example/sensoji.jpg',
        priceFromUsd: 18,
      });
      const listed = await s.listEvents({ kind: 'experience_view' });
      expect(listed).toHaveLength(1);
      expect(listed[0]!.metadata?.title).toBe('Senso-ji at sunrise');
    });

    it('listEvents filters by sessionId', async () => {
      const s = makeStore();
      await s.recordEvent({
        kind: 'experience_view',
        ownerKind: 'session',
        ownerId: 'anon_a',
        sessionId: 'sess_a',
        ref: 'A1',
      });
      await s.recordEvent({
        kind: 'experience_view',
        ownerKind: 'session',
        ownerId: 'anon_b',
        sessionId: 'sess_b',
        ref: 'B1',
      });
      const onlyA = await s.listEvents({ sessionId: 'sess_a' });
      expect(onlyA.map((e) => e.ref)).toEqual(['A1']);
    });

    it('listEvents combines kind + sessionId filters', async () => {
      const s = makeStore();
      await s.recordEvent({
        kind: 'experience_view',
        ownerKind: 'session',
        ownerId: 'anon_a',
        sessionId: 'sess_a',
        ref: 'A1',
      });
      await s.recordEvent({
        kind: 'save_click',
        ownerKind: 'session',
        ownerId: 'anon_a',
        sessionId: 'sess_a',
        ref: 'A1',
      });
      const views = await s.listEvents({
        sessionId: 'sess_a',
        kind: 'experience_view',
      });
      expect(views).toHaveLength(1);
      expect(views[0]!.kind).toBe('experience_view');
    });
  });
}

runContract('InMemorySessionStore', () => new InMemorySessionStore());
