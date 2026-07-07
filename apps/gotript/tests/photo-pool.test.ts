import { describe, expect, it } from 'vitest';
import { _photoPoolSizes, pickPhotoId } from '@/providers/_shared/photo-pool';

describe('photo pool', () => {
  it('every category pool has at least 5 entries (so a 4-stay batch never collides)', () => {
    const sizes = _photoPoolSizes();
    for (const [cat, n] of Object.entries(sizes)) {
      expect(n, `pool size for ${cat}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('same slug → same photo id (deterministic across renders)', () => {
    const a = pickPhotoId('cityscape', 'tokyo-shibuya-pod');
    const b = pickPhotoId('cityscape', 'tokyo-shibuya-pod');
    expect(a).toBe(b);
  });

  it('different slugs in the same category produce diversification, not collapse', () => {
    // Hashing collisions are probabilistic - the meaningful guarantee
    // is "not all collapse to one photo." Tested with 8 well-spread
    // slugs against a 6-entry pool; expect at least 3 distinct ids.
    const slugs = [
      'tokyo-yanaka-tatami',
      'shibuya-pod-1',
      'shinjuku-tower',
      'asakusa-edo-house',
      'kyoto-machiya',
      'osaka-modern-loft',
      'nara-park-stay',
      'sapporo-snow-villa',
    ];
    const ids = new Set(slugs.map((s) => pickPhotoId('cityscape', s)));
    expect(ids.size).toBeGreaterThanOrEqual(3);
  });

  it('same slug across different categories picks from the appropriate pool', () => {
    const slug = 'shared-slug';
    const cityscape = pickPhotoId('cityscape', slug);
    const beach = pickPhotoId('beach', slug);
    expect(cityscape).not.toBe(beach);
  });
});
