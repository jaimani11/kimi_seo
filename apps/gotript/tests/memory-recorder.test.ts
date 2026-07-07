import { describe, expect, it } from 'vitest';
import { BagOfWordsEmbedding } from '@/lib/memory/embedding';
import { InMemoryMemoryStore } from '@/lib/memory/in-memory-memory-store';
import { MemoryRecorder } from '@/lib/memory/recorder';
import type { TripIntent } from '@core/trip-intent';

const sampleIntent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
  budget: { kind: 'unspecified' },
  vibe: { tags: ['walkable', 'family-friendly', 'slow'] },
  preferences: { amenities: [], avoid: [] },
  caveats: ['no kids this trip - just us'],
  rawInput: 'Tuscany 7 days, family of 4, walkable, slow',
};

function makeRecorder() {
  const store = new InMemoryMemoryStore(new BagOfWordsEmbedding(256));
  const recorder = new MemoryRecorder(store);
  return { store, recorder };
}

describe('MemoryRecorder', () => {
  it('records episodic + structural + caveat memories per turn', async () => {
    const { store, recorder } = makeRecorder();
    await recorder.observeTurn({
      turnId: 't_1',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
      intent: sampleIntent,
      rawInput: sampleIntent.rawInput,
    });
    expect(store.size()).toBe(3);
    const all = await store.search({
      ownerKind: 'session',
      ownerId: 'anon_t',
      query: 'family',
      topK: 10,
      scoreFloor: 0,
    });
    const kinds = all.map((r) => r.memory.kind);
    expect(kinds).toContain('episodic');
    expect(kinds).toContain('structural');
  });

  it('produces a structural snapshot containing destination + group + tags', async () => {
    const { store, recorder } = makeRecorder();
    await recorder.observeTurn({
      turnId: 't_1',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
      intent: sampleIntent,
      rawInput: sampleIntent.rawInput,
    });
    const all = await store.search({
      ownerKind: 'session',
      ownerId: 'anon_t',
      query: 'Tuscany family walkable',
      topK: 10,
      scoreFloor: 0,
    });
    const structural = all.find((r) => r.memory.signalKey === 'intent-snapshot')?.memory.content;
    expect(structural).toContain('Tuscany');
    expect(structural).toContain('family');
    expect(structural).toContain('walkable');
  });

  it('is idempotent on duplicate turnId', async () => {
    const { store, recorder } = makeRecorder();
    await recorder.observeTurn({
      turnId: 't_1',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
      intent: sampleIntent,
      rawInput: sampleIntent.rawInput,
    });
    await recorder.observeTurn({
      turnId: 't_1',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
      intent: sampleIntent,
      rawInput: sampleIntent.rawInput,
    });
    expect(store.size()).toBe(3);
  });

  it('does not throw if the store fails - failures only log', async () => {
    const brokenStore = {
      async record() {
        throw new Error('disk full');
      },
      async search() {
        return [];
      },
      async listForOwner() {
        return [];
      },
      async listAllOwners() {
        return [];
      },
    };
    const recorder = new MemoryRecorder(brokenStore);
    await expect(
      recorder.observeTurn({
        turnId: 't_1',
        owner: { ownerKind: 'session', ownerId: 'anon_t' },
        intent: sampleIntent,
        rawInput: sampleIntent.rawInput,
      }),
    ).resolves.not.toThrow();
  });

  it('skips episodic when rawInput is empty/whitespace', async () => {
    const { store, recorder } = makeRecorder();
    await recorder.observeTurn({
      turnId: 't_1',
      owner: { ownerKind: 'session', ownerId: 'anon_t' },
      intent: { ...sampleIntent, caveats: [] },
      rawInput: '   ',
    });
    // structural snapshot still recorded.
    expect(store.size()).toBe(1);
  });
});
