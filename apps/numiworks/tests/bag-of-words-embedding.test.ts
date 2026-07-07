import { describe, expect, it } from 'vitest';
import { BagOfWordsEmbedding, cosineSimilarity } from '@/lib/memory/embedding';

describe('BagOfWordsEmbedding', () => {
  const emb = new BagOfWordsEmbedding(256);

  it('produces vectors of the configured dimension', async () => {
    const v = await emb.embed('Tuscany, slow and walkable');
    expect(v).toHaveLength(256);
  });

  it('is deterministic - same input → identical vector', async () => {
    const a = await emb.embed('we always travel in September');
    const b = await emb.embed('we always travel in September');
    expect(a).toEqual(b);
  });

  it('returns a unit vector (L2-normalized) when there are any tokens', async () => {
    const v = await emb.embed('Tuscany, slow and walkable');
    const sumSq = v.reduce((s, x) => s + x * x, 0);
    expect(sumSq).toBeCloseTo(1, 6);
  });

  it('returns the zero vector for an empty / token-less string', async () => {
    const v = await emb.embed('   ...   ');
    expect(v.every((x) => x === 0)).toBe(true);
  });

  it('semantically related strings score higher than unrelated', async () => {
    const a = await emb.embed('Italy with kids, walkable, slow');
    const b = await emb.embed('Italy family trip, walkable village');
    const c = await emb.embed('crypto trading desk in Singapore');
    const ab = cosineSimilarity(a, b);
    const ac = cosineSimilarity(a, c);
    expect(ab).toBeGreaterThan(ac);
  });

  it('cosine similarity is bounded in [-1, 1]', async () => {
    const a = await emb.embed('Tuscany, slow');
    const b = await emb.embed('Tokyo, fast');
    const s = cosineSimilarity(a, b);
    expect(s).toBeGreaterThanOrEqual(-1);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('cosine similarity of a vector with itself is ~1', async () => {
    const a = await emb.embed('Tuscany, slow and walkable');
    expect(cosineSimilarity(a, a)).toBeCloseTo(1, 6);
  });

  it('rejects implausibly small dimensions', () => {
    expect(() => new BagOfWordsEmbedding(8)).toThrow();
  });
});
