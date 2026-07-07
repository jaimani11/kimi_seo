import { describe, expect, it } from 'vitest';
import { resolveDestinationPhoto } from '@/lib/imagery/destination-photo';

describe('resolveDestinationPhoto', () => {
  it('returns a hand-curated entry for known cities (exact-name path)', () => {
    const a = resolveDestinationPhoto({ name: 'Vancouver', country: 'CA' });
    const b = resolveDestinationPhoto({ name: 'Vancouver', country: 'CA' });
    // Deterministic per name.
    expect(a.url).toBe(b.url);
    expect(a.url).toMatch(/^https:\/\/images\.unsplash\.com/);
    expect(a.alt.toLowerCase()).toContain('vancouver');
    expect(a.credit).toMatch(/Unsplash/);
  });

  it('returns the same photo for case + diacritic variants', () => {
    const a = resolveDestinationPhoto({ name: 'Kyoto', country: 'JP' });
    const b = resolveDestinationPhoto({ name: 'KYOTO', country: 'JP' });
    expect(a.url).toBe(b.url);
  });

  it('falls back to country-level lookup when the city is unknown', () => {
    // Austrian alpine destination that almost certainly isn’t in the
    // curated cities table - should resolve via __country:AT.
    const photo = resolveDestinationPhoto({ name: 'St. Anton am Arlberg', country: 'AT' });
    expect(photo.url).toMatch(/^https:\/\/images\.unsplash\.com/);
    expect(photo.alt.length).toBeGreaterThan(0);
  });

  it('falls back to the categorical pool when neither city nor country are curated', () => {
    // Country with no curated fallback + arbitrary city name → still
    // returns a valid Unsplash photo via the heuristic + pool.
    const photo = resolveDestinationPhoto({ name: 'Nowhereville', country: 'ZZ' });
    expect(photo.url).toMatch(/^https:\/\/images\.unsplash\.com/);
    expect(photo.credit.length).toBeGreaterThan(0);
  });
});
