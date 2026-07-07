import { describe, expect, it } from 'vitest';
import { BagOfWordsEmbedding } from '@/lib/memory/embedding';
import { InMemoryMemoryStore } from '@/lib/memory/in-memory-memory-store';
import { MemoryRecorder } from '@/lib/memory/recorder';
import { MemoryRetriever } from '@/lib/memory/retriever';
import type { TripIntent } from '@core/trip-intent';

function makeRetrieverWithSeed(seedRaw: string, seedIntent: TripIntent) {
  const store = new InMemoryMemoryStore(new BagOfWordsEmbedding(256));
  const recorder = new MemoryRecorder(store);
  const retriever = new MemoryRetriever(store, { topK: 3, scoreFloor: 0.2 });
  return { store, recorder, retriever, seedRaw, seedIntent };
}

const intent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
  budget: { kind: 'unspecified' },
  vibe: { tags: ['walkable', 'family-friendly', 'slow'] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'Tuscany 7 days, family of 4, walkable, slow',
};

describe('MemoryRetriever', () => {
  it('returns null when no memories are stored', async () => {
    const { retriever } = makeRetrieverWithSeed('', intent);
    const result = await retriever.searchForTurn({
      rawInput: 'Italy with kids',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
    });
    expect(result).toBeNull();
  });

  it('returns null when no memory clears the score floor', async () => {
    const { store, retriever } = makeRetrieverWithSeed('', intent);
    await store.record({
      ownerKind: 'session',
      ownerId: 'anon_t',
      kind: 'episodic',
      content: 'crypto trading desk Singapore',
    });
    const result = await retriever.searchForTurn({
      rawInput: 'family Italy walkable slow',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
    });
    // Either null (below floor) or empty entries - both acceptable.
    if (result) expect(result.entries.length).toBe(0);
    else expect(result).toBeNull();
  });

  it('retrieves a relevant prior memory and formats a prompt block', async () => {
    const { recorder, retriever } = makeRetrieverWithSeed('', intent);
    await recorder.observeTurn({
      turnId: 't_prior',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
      intent,
      rawInput: 'Tuscany 7 days, family of 4, walkable, slow',
    });
    const result = await retriever.searchForTurn({
      rawInput: 'Italy walkable slow with the family',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
    });
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.topScore).toBeGreaterThan(0.2);
    expect(result.promptBlock).toContain('<memory>');
    expect(result.promptBlock).toContain('</memory>');
    // The first entry's content shows up in the block.
    expect(result.promptBlock).toContain(result.entries[0]!.content);
  });

  it('respects the per-instance topK cap', async () => {
    const store = new InMemoryMemoryStore(new BagOfWordsEmbedding(256));
    const retriever = new MemoryRetriever(store, { topK: 2, scoreFloor: 0 });
    const owner = { ownerKind: 'session' as const, ownerId: 'anon_t' };
    for (let i = 0; i < 5; i += 1) {
      await store.record({
        ...owner,
        kind: 'episodic',
        content: `family walkable slow trip number ${i}`,
      });
    }
    const result = await retriever.searchForTurn({
      rawInput: 'family walkable trip',
      owner,
    });
    expect(result).not.toBeNull();
    expect(result?.entries.length).toBe(2);
  });

  it("isolates by owner - does not retrieve another owner's memories", async () => {
    const { recorder, retriever } = makeRetrieverWithSeed('', intent);
    await recorder.observeTurn({
      turnId: 't_alice',
      owner: { ownerKind: 'session', ownerId: 'anon_alice' },
      intent,
      rawInput: 'Tuscany family walkable',
    });
    const bob = await retriever.searchForTurn({
      rawInput: 'Tuscany family walkable',
      owner: { ownerKind: 'session', ownerId: 'anon_bob' },
    });
    expect(bob).toBeNull();
  });
});
