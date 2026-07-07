import { describe, expect, it } from 'vitest';
import { isValidShareSlug, mintShareSlug } from '@/lib/session/share-slug';

describe('share slug', () => {
  it('mintShareSlug returns 16-char base62 strings', () => {
    for (let i = 0; i < 50; i += 1) {
      const slug = mintShareSlug();
      expect(slug).toHaveLength(16);
      expect(slug).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it('mintShareSlug produces distinct slugs across many trials', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      const slug = mintShareSlug();
      expect(seen.has(slug)).toBe(false);
      seen.add(slug);
    }
  });

  it('isValidShareSlug accepts a freshly minted slug', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(isValidShareSlug(mintShareSlug())).toBe(true);
    }
  });

  it('isValidShareSlug rejects wrong lengths', () => {
    expect(isValidShareSlug('')).toBe(false);
    expect(isValidShareSlug('abc')).toBe(false);
    expect(isValidShareSlug('a'.repeat(15))).toBe(false);
    expect(isValidShareSlug('a'.repeat(17))).toBe(false);
  });

  it('isValidShareSlug rejects invalid characters', () => {
    // 16 chars but with a dash
    expect(isValidShareSlug('Abcdefghij-12345')).toBe(false);
    // 16 chars but with a slash (URL-unsafe)
    expect(isValidShareSlug('Abcdefghij/12345')).toBe(false);
    // 16 chars but with a space
    expect(isValidShareSlug('Abcdefghij 12345')).toBe(false);
  });
});
