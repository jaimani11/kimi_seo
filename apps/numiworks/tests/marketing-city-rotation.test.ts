import { describe, expect, it } from 'vitest';
import { pickRotatedCities, todayKey } from '../src/lib/marketing/city-rotation';
import { SEO_CITIES } from '../src/lib/seo/cities';

describe('pickRotatedCities', () => {
  it('returns the requested count when count <= SEO_CITIES.length', () => {
    const out = pickRotatedCities({ dayKey: '2026-06-13', platform: 'pinterest', count: 20 });
    expect(out).toHaveLength(20);
  });

  it('caps at SEO_CITIES.length when count is too large', () => {
    const out = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'pinterest',
      count: 9999,
    });
    expect(out).toHaveLength(SEO_CITIES.length);
  });

  it('returns empty for count=0', () => {
    expect(
      pickRotatedCities({ dayKey: '2026-06-13', platform: 'pinterest', count: 0 }),
    ).toEqual([]);
  });

  it('every returned slug is a known SEO city', () => {
    const validSlugs = new Set(SEO_CITIES.map((c) => c.slug));
    const out = pickRotatedCities({ dayKey: '2026-06-13', platform: 'pinterest', count: 30 });
    for (const slug of out) expect(validSlugs.has(slug)).toBe(true);
  });

  it('returns the same set on the same (day, platform) call', () => {
    const a = pickRotatedCities({ dayKey: '2026-06-13', platform: 'pinterest', count: 20 });
    const b = pickRotatedCities({ dayKey: '2026-06-13', platform: 'pinterest', count: 20 });
    expect(a).toEqual(b);
  });

  it('returns a different set on a different day', () => {
    const day1 = pickRotatedCities({ dayKey: '2026-06-13', platform: 'pinterest', count: 20 });
    const day2 = pickRotatedCities({ dayKey: '2026-06-14', platform: 'pinterest', count: 20 });
    expect(day1).not.toEqual(day2);
  });

  it('returns a different set on a different platform (same day)', () => {
    const pinterest = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'pinterest',
      count: 20,
    });
    const instagram = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'instagram',
      count: 20,
    });
    expect(pinterest).not.toEqual(instagram);
  });

  it('returns no duplicate slugs within a single pick', () => {
    const out = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'pinterest',
      count: 50,
    });
    expect(new Set(out).size).toBe(out.length);
  });

  it('cycles through every SEO city over a 30-day window', () => {
    // Run 30 days × 3 platforms with count 30 each — every slug
    // should appear at least once. Acts as a smoke test that the
    // rotation actually reaches every city in reasonable time.
    const seen = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      const dayKey = `2026-06-${String(d).padStart(2, '0')}`;
      for (const platform of ['pinterest', 'instagram', 'tiktok']) {
        const slugs = pickRotatedCities({ dayKey, platform, count: 30 });
        for (const s of slugs) seen.add(s);
      }
    }
    expect(seen.size).toBe(SEO_CITIES.length);
  });
});

describe('todayKey', () => {
  it('formats a date as YYYY-MM-DD in UTC', () => {
    expect(todayKey(new Date('2026-06-13T15:23:00Z'))).toBe('2026-06-13');
  });

  it('is stable across times within the same UTC day', () => {
    const morning = new Date('2026-06-13T01:00:00Z');
    const evening = new Date('2026-06-13T23:00:00Z');
    expect(todayKey(morning)).toBe(todayKey(evening));
  });
});
