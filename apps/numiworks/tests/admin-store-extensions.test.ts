import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionStore } from '@/lib/session/in-memory-session-store';
import { InMemoryMemoryStore } from '@/lib/memory/in-memory-memory-store';
import { BagOfWordsEmbedding } from '@/lib/memory/embedding';
import type { OwnerArgs } from '@/lib/memory/memory-store';

describe('SessionStore.listClicks', () => {
  let store: InMemorySessionStore;

  beforeEach(async () => {
    store = new InMemorySessionStore();
    // Seed three clicks across two owners with detectable order.
    await store.recordClick({
      ownerKind: 'session',
      ownerId: 'anon_a',
      sessionId: 'anon_a',
      stayId: 'stay_1',
      providerId: 'mock-italy',
      affiliateUrl: 'https://example.com/1',
    });
    await store.recordClick({
      ownerKind: 'user',
      ownerId: 'user_b',
      sessionId: 'anon_b',
      stayId: 'stay_2',
      providerId: 'mock-italy',
      affiliateUrl: 'https://example.com/2',
    });
    await store.recordClick({
      ownerKind: 'session',
      ownerId: 'anon_a',
      sessionId: 'anon_a',
      stayId: 'stay_3',
      providerId: 'booking-com',
      affiliateUrl: 'https://example.com/3',
    });
  });

  it('returns most-recent-first (insertion-order reversed)', async () => {
    const list = await store.listClicks();
    expect(list.map((c) => c.stayId)).toEqual(['stay_3', 'stay_2', 'stay_1']);
  });

  it('honors `limit` (truncates from the head of the reversed view)', async () => {
    const list = await store.listClicks({ limit: 2 });
    expect(list).toHaveLength(2);
    expect(list[0]?.stayId).toBe('stay_3');
    expect(list[1]?.stayId).toBe('stay_2');
  });

  it("filtered by owner returns only that owner's rows", async () => {
    const list = await store.listClicks({
      owner: { ownerKind: 'session', ownerId: 'anon_a' },
    });
    expect(list).toHaveLength(2);
    expect(list.every((c) => c.ownerKind === 'session' && c.ownerId === 'anon_a')).toBe(true);
  });

  it('default limit is 50 (no implicit cap surprise on smaller logs)', async () => {
    // With our 3-row seed, default limit should still return all 3.
    const list = await store.listClicks();
    expect(list).toHaveLength(3);
  });
});

describe('MemoryStore.listForOwner + listAllOwners', () => {
  let store: InMemoryMemoryStore;

  beforeEach(async () => {
    store = new InMemoryMemoryStore(new BagOfWordsEmbedding());
    await store.record({
      ownerKind: 'user',
      ownerId: 'user_alice',
      kind: 'episodic',
      content: 'Tuscany, slow and walkable',
    });
    await store.record({
      ownerKind: 'user',
      ownerId: 'user_alice',
      kind: 'structural',
      content: 'family of 4, vegetarian',
    });
    await store.record({
      ownerKind: 'session',
      ownerId: 'anon_bob',
      kind: 'episodic',
      content: 'Tokyo cherry blossom week',
    });
  });

  it('listForOwner returns most-recent-first', async () => {
    const list = await store.listForOwner({
      ownerKind: 'user',
      ownerId: 'user_alice',
    });
    expect(list).toHaveLength(2);
    // Last recorded came back first.
    expect(list[0]?.content).toContain('vegetarian');
    expect(list[1]?.content).toContain('Tuscany');
  });

  it('listForOwner honors `kind` filter', async () => {
    const list = await store.listForOwner({
      ownerKind: 'user',
      ownerId: 'user_alice',
      kind: 'structural',
    });
    expect(list).toHaveLength(1);
    expect(list[0]?.kind).toBe('structural');
  });

  it('listForOwner returns empty for an unknown owner', async () => {
    const list = await store.listForOwner({
      ownerKind: 'user',
      ownerId: 'never_seen',
    });
    expect(list).toEqual([]);
  });

  it('listAllOwners returns distinct owners with at least one record', async () => {
    const owners: OwnerArgs[] = await store.listAllOwners();
    expect(owners).toHaveLength(2);
    const keys = owners.map((o) => `${o.ownerKind}:${o.ownerId}`).sort();
    expect(keys).toEqual(['session:anon_bob', 'user:user_alice']);
  });

  it('listAllOwners returns empty when no memories exist', async () => {
    const empty = new InMemoryMemoryStore(new BagOfWordsEmbedding());
    expect(await empty.listAllOwners()).toEqual([]);
  });
});
