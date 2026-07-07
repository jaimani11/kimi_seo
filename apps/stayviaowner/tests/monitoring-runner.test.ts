import { describe, expect, it } from 'vitest';
import { InMemoryMonitoringStore } from '@/lib/monitoring/in-memory-monitoring-store';
import { MonitoringRunner } from '@/lib/monitoring/runner';
import type { MonitoringChecker } from '@/lib/monitoring/checker';
import type { MonitoringEvent } from '@/lib/monitoring/types';
import type { SavedTrip } from '@lib/session/session-store';
import { providerId, stayId } from '@core/ids';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

const intent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 1, children: { count: 0 }, infants: 0 },
  budget: { kind: 'unspecified' },
  vibe: { tags: [] },
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
    location: { country: 'IT' },
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

function makeTrip(id: string, ownerId = 'anon_t'): SavedTrip {
  return {
    id,
    ownerKind: 'session',
    ownerId,
    proposalId: `p_${id}`,
    proposalSummary: { destinationName: 'Tuscany', nights: 7, heroStayName: 'Aman Venice' },
    proposal,
    intent,
    bookmarkedAt: new Date(0).toISOString(),
  };
}

/** Always-fires checker - emits a price-drop on every check. */
function alwaysFiresChecker(): MonitoringChecker {
  return {
    async check({ trip, now }): Promise<MonitoringEvent | null> {
      return {
        id: `mon_${trip.id}_${now}`,
        tripId: trip.id,
        ownerKind: trip.ownerKind,
        ownerId: trip.ownerId,
        kind: 'price-drop',
        delta: -0.05,
        message: `${trip.proposalSummary.heroStayName} ↓ 5%`,
        createdAt: new Date(now).toISOString(),
        acknowledged: false,
      };
    },
  };
}

/** Never-fires checker. */
function neverFiresChecker(): MonitoringChecker {
  return {
    async check() {
      return null;
    },
  };
}

/** Always-throws checker - exercises failure isolation. */
function alwaysThrowsChecker(): MonitoringChecker {
  return {
    async check() {
      throw new Error('upstream timeout');
    },
  };
}

describe('MonitoringRunner', () => {
  it('skips trips that are within the throttle window', async () => {
    const store = new InMemoryMonitoringStore();
    const runner = new MonitoringRunner(store, alwaysFiresChecker(), { intervalMs: 60_000 });
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    const trip = makeTrip('trip_a');

    // First call generates an event.
    const t0 = 1_000_000;
    await runner.checkOwner({ owner, trips: [trip], now: t0 });
    expect((await store.listEventsForOwner(owner)).length).toBe(1);

    // Second call within 60s: no new event.
    await runner.checkOwner({ owner, trips: [trip], now: t0 + 30_000 });
    expect((await store.listEventsForOwner(owner)).length).toBe(1);

    // Third call after 60s: new event.
    await runner.checkOwner({ owner, trips: [trip], now: t0 + 70_000 });
    expect((await store.listEventsForOwner(owner)).length).toBe(2);
  });

  it('persists snapshot even when no event was generated', async () => {
    const store = new InMemoryMonitoringStore();
    const runner = new MonitoringRunner(store, neverFiresChecker(), { intervalMs: 60_000 });
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    const trip = makeTrip('trip_silent');
    await runner.checkOwner({ owner, trips: [trip], now: 1_000_000 });
    const snap = await store.getSnapshot('trip_silent');
    expect(snap).not.toBeNull();
    expect(snap?.lastCheckAt).toBe(1_000_000);
    expect(snap?.lastEventAt).toBeUndefined();
  });

  it('isolates owner - does not check or list across owners', async () => {
    const store = new InMemoryMonitoringStore();
    const runner = new MonitoringRunner(store, alwaysFiresChecker(), { intervalMs: 60_000 });

    // Alice's trip - generates event for Alice.
    await runner.checkOwner({
      owner: { ownerKind: 'session', ownerId: 'anon_alice' },
      trips: [makeTrip('trip_a', 'anon_alice')],
      now: 1_000_000,
    });

    // Bob requests his (empty) list - should not see Alice's event.
    const bobMap = await runner.checkOwner({
      owner: { ownerKind: 'session', ownerId: 'anon_bob' },
      trips: [],
      now: 2_000_000,
    });
    expect(bobMap.size).toBe(0);
    expect(await store.listEventsForOwner({ ownerKind: 'session', ownerId: 'anon_bob' })).toEqual(
      [],
    );
  });

  it("does not check trips whose owner doesn't match the requesting owner", async () => {
    const store = new InMemoryMonitoringStore();
    const runner = new MonitoringRunner(store, alwaysFiresChecker(), { intervalMs: 60_000 });

    // Pass a trip owned by alice while requesting as bob - defense-in-depth.
    await runner.checkOwner({
      owner: { ownerKind: 'session', ownerId: 'anon_bob' },
      trips: [makeTrip('trip_alice', 'anon_alice')],
      now: 1_000_000,
    });
    expect(await store.listEventsForOwner({ ownerKind: 'session', ownerId: 'anon_alice' })).toEqual(
      [],
    );
  });

  it('isolates per-trip failures - one bad trip does not stall others', async () => {
    // Use a checker that throws only on a specific tripId.
    const partialChecker: MonitoringChecker = {
      async check({ trip, now }) {
        if (trip.id === 'trip_broken') throw new Error('boom');
        return {
          id: `mon_${trip.id}`,
          tripId: trip.id,
          ownerKind: trip.ownerKind,
          ownerId: trip.ownerId,
          kind: 'price-drop',
          delta: -0.05,
          message: 'ok',
          createdAt: new Date(now).toISOString(),
          acknowledged: false,
        };
      },
    };
    const store = new InMemoryMonitoringStore();
    const runner = new MonitoringRunner(store, partialChecker, { intervalMs: 60_000 });
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    await runner.checkOwner({
      owner,
      trips: [makeTrip('trip_broken'), makeTrip('trip_good')],
      now: 1_000_000,
    });
    const events = await store.listEventsForOwner(owner);
    // The good trip generated an event; the broken one logged + skipped.
    expect(events).toHaveLength(1);
    expect(events[0]?.tripId).toBe('trip_good');
  });

  it('also tolerates a checker that throws unconditionally', async () => {
    const store = new InMemoryMonitoringStore();
    const runner = new MonitoringRunner(store, alwaysThrowsChecker(), { intervalMs: 60_000 });
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    const result = await runner.checkOwner({
      owner,
      trips: [makeTrip('trip_a')],
      now: 1_000_000,
    });
    expect(result.size).toBe(0);
  });

  it('returns the full unacknowledged-event list (not just freshly generated)', async () => {
    const store = new InMemoryMonitoringStore();
    const runner = new MonitoringRunner(store, alwaysFiresChecker(), { intervalMs: 60_000 });
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };

    // Generate an event then acknowledge nothing.
    await runner.checkOwner({ owner, trips: [makeTrip('trip_a')], now: 1_000_000 });
    // Second call - within throttle, no new event, but the prior unack event is still surfaced.
    const map = await runner.checkOwner({
      owner,
      trips: [makeTrip('trip_a')],
      now: 1_000_000 + 30_000,
    });
    expect(map.get('trip_a')?.length).toBe(1);
  });
});
