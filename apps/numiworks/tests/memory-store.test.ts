import { describe, expect, it } from 'vitest';
import { BagOfWordsEmbedding } from '@/lib/memory/embedding';
import { InMemoryMemoryStore } from '@/lib/memory/in-memory-memory-store';

function makeStore(cap?: number) {
  const opts = cap !== undefined ? { cap } : {};
  return new InMemoryMemoryStore(new BagOfWordsEmbedding(256), opts);
}

describe('InMemoryMemoryStore', () => {
  it('returns empty when no memories exist for the owner', async () => {
    const store = makeStore();
    const out = await store.search({
      ownerKind: 'session',
      ownerId: 'anon_test',
      query: 'Italy',
    });
    expect(out).toEqual([]);
  });

  it('records and round-trips a memory', async () => {
    const store = makeStore();
    const rec = await store.record({
      ownerKind: 'session',
      ownerId: 'anon_alice',
      kind: 'episodic',
      content: 'we always travel in September',
    });
    expect(rec.id).toMatch(/^mem_/);
    expect(rec.embedding.length).toBe(256);
    const out = await store.search({
      ownerKind: 'session',
      ownerId: 'anon_alice',
      query: 'september travel',
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]?.memory.content).toBe('we always travel in September');
  });

  it('isolates memory by owner - different owners do not see each other', async () => {
    const store = makeStore();
    await store.record({
      ownerKind: 'session',
      ownerId: 'anon_alice',
      kind: 'episodic',
      content: 'Alice loves Italy',
    });
    await store.record({
      ownerKind: 'session',
      ownerId: 'anon_bob',
      kind: 'episodic',
      content: 'Bob loves Japan',
    });
    const aliceResults = await store.search({
      ownerKind: 'session',
      ownerId: 'anon_alice',
      query: 'travel',
    });
    expect(aliceResults.every((r) => r.memory.ownerId === 'anon_alice')).toBe(true);
    expect(aliceResults.some((r) => r.memory.content.includes('Bob'))).toBe(false);
  });

  it('returns top-K results, sorted by score descending', async () => {
    const store = makeStore();
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    await store.record({ ...owner, kind: 'episodic', content: 'family of four, walkable, slow' });
    await store.record({ ...owner, kind: 'episodic', content: 'wine country, vineyard dinners' });
    await store.record({ ...owner, kind: 'episodic', content: 'tokyo solo trip foodie' });
    await store.record({ ...owner, kind: 'episodic', content: 'crypto trading desk Singapore' });
    const out = await store.search({ ...owner, query: 'family walkable slow', topK: 2 });
    expect(out.length).toBeLessThanOrEqual(2);
    // First result is the family-walkable-slow memory.
    expect(out[0]?.memory.content).toContain('family of four');
  });

  it('honors the score floor (skips low-similarity memories)', async () => {
    const store = makeStore();
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    await store.record({ ...owner, kind: 'episodic', content: 'crypto trading desk Singapore' });
    const out = await store.search({
      ...owner,
      query: 'family walkable slow Italy vineyard',
      topK: 5,
      scoreFloor: 0.5, // very high floor
    });
    expect(out).toEqual([]);
  });

  it('evicts oldest memories when the per-owner cap is hit (FIFO)', async () => {
    const store = makeStore(3);
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    for (let i = 0; i < 5; i += 1) {
      await store.record({ ...owner, kind: 'episodic', content: `memory ${i}` });
    }
    expect(store.size()).toBe(3);
    // The oldest 2 (memory 0, 1) should be gone.
    const all = await store.search({
      ...owner,
      query: 'memory',
      topK: 10,
      scoreFloor: 0,
    });
    const contents = all.map((r) => r.memory.content);
    expect(contents).not.toContain('memory 0');
    expect(contents).not.toContain('memory 1');
  });

  it('clearOwner wipes one owner without affecting the other', async () => {
    const store = makeStore();
    await store.record({
      ownerKind: 'session',
      ownerId: 'anon_a',
      kind: 'episodic',
      content: 'A',
    });
    await store.record({
      ownerKind: 'session',
      ownerId: 'anon_b',
      kind: 'episodic',
      content: 'B',
    });
    await store.clearOwner({ ownerKind: 'session', ownerId: 'anon_a' });
    expect(store.size()).toBe(1);
    const aResults = await store.search({
      ownerKind: 'session',
      ownerId: 'anon_a',
      query: 'A',
      scoreFloor: 0,
    });
    expect(aResults).toEqual([]);
  });

  it('preserves the embedding on recorded memory', async () => {
    const store = makeStore();
    const rec = await store.record({
      ownerKind: 'session',
      ownerId: 'anon_t',
      kind: 'episodic',
      content: 'walkable Italian villages',
    });
    const sumSq = rec.embedding.reduce((s, x) => s + x * x, 0);
    expect(sumSq).toBeCloseTo(1, 6); // L2-normalized
  });
});
