import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMonitoringStore } from '@/lib/monitoring/in-memory-monitoring-store';
import type { MonitoringEvent } from '@/lib/monitoring/types';

function evt(overrides: Partial<MonitoringEvent> = {}): MonitoringEvent {
  return {
    id: `mon_${Math.random().toString(36).slice(2)}`,
    tripId: 'trip_1',
    ownerKind: 'session',
    ownerId: 'anon_t',
    kind: 'price-drop',
    delta: -0.07,
    message: 'Hotel Cipriani · ↓ 7% since you saved it',
    createdAt: new Date().toISOString(),
    acknowledged: false,
    ...overrides,
  };
}

describe('InMemoryMonitoringStore', () => {
  let store: InMemoryMonitoringStore;

  beforeEach(() => {
    store = new InMemoryMonitoringStore();
  });

  it('round-trips a snapshot', async () => {
    expect(await store.getSnapshot('trip_x')).toBeNull();
    await store.putSnapshot({ tripId: 'trip_x', lastCheckAt: 1000 });
    const got = await store.getSnapshot('trip_x');
    expect(got?.tripId).toBe('trip_x');
    expect(got?.lastCheckAt).toBe(1000);
  });

  it('records an event and lists it for the owner', async () => {
    await store.recordEvent(evt());
    const list = await store.listEventsForOwner({
      ownerKind: 'session',
      ownerId: 'anon_t',
    });
    expect(list).toHaveLength(1);
    expect(list[0]?.kind).toBe('price-drop');
  });

  it("does not return another owner's events", async () => {
    await store.recordEvent(evt({ ownerId: 'anon_alice' }));
    const bobList = await store.listEventsForOwner({
      ownerKind: 'session',
      ownerId: 'anon_bob',
    });
    expect(bobList).toEqual([]);
  });

  it('listEventsForOwner filters acknowledged by default', async () => {
    await store.recordEvent(evt({ id: 'a' }));
    await store.recordEvent(evt({ id: 'b', acknowledged: true }));
    const unack = await store.listEventsForOwner({
      ownerKind: 'session',
      ownerId: 'anon_t',
    });
    expect(unack).toHaveLength(1);
    expect(unack[0]?.id).toBe('a');
    const all = await store.listEventsForOwner({
      ownerKind: 'session',
      ownerId: 'anon_t',
      includeAcknowledged: true,
    });
    expect(all).toHaveLength(2);
  });

  it('acknowledgeAll flips unacknowledged events for the matching trip', async () => {
    await store.recordEvent(evt({ id: 'a', tripId: 'trip_1' }));
    await store.recordEvent(evt({ id: 'b', tripId: 'trip_1' }));
    await store.recordEvent(evt({ id: 'c', tripId: 'trip_2' }));
    const flipped = await store.acknowledgeAll({
      ownerKind: 'session',
      ownerId: 'anon_t',
      tripId: 'trip_1',
    });
    expect(flipped).toBe(2);

    const unack = await store.listEventsForOwner({
      ownerKind: 'session',
      ownerId: 'anon_t',
    });
    // Only the trip_2 event is still unacknowledged.
    expect(unack).toHaveLength(1);
    expect(unack[0]?.id).toBe('c');
  });

  it('acknowledgeAll is idempotent', async () => {
    await store.recordEvent(evt({ id: 'a' }));
    const first = await store.acknowledgeAll({
      ownerKind: 'session',
      ownerId: 'anon_t',
      tripId: 'trip_1',
    });
    const second = await store.acknowledgeAll({
      ownerKind: 'session',
      ownerId: 'anon_t',
      tripId: 'trip_1',
    });
    expect(first).toBe(1);
    expect(second).toBe(0);
  });
});
