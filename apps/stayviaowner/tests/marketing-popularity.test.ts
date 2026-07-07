import { describe, expect, it } from 'vitest';
import {
  buildWeightedCityPool,
  tierOf,
  weightOf,
} from '../src/lib/marketing/popularity';
import { pickRotatedCities } from '../src/lib/marketing/city-rotation';
import { SEO_CITIES } from '../src/lib/seo/cities';

describe('popularity tiers', () => {
  it('classifies global headliners as tier 1 (weight 4)', () => {
    for (const slug of ['tokyo', 'paris', 'rome', 'new-york', 'london']) {
      expect(tierOf(slug)).toBe(1);
      expect(weightOf(slug)).toBe(4);
    }
  });

  it('classifies major tourism cities as tier 2 (weight 2)', () => {
    for (const slug of ['osaka', 'prague', 'madrid', 'milan', 'budapest']) {
      expect(tierOf(slug)).toBe(2);
      expect(weightOf(slug)).toBe(2);
    }
  });

  it('classifies long-tail cities as tier 3 (weight 1)', () => {
    // Wellington isn't on either tier list, so falls to tier 3.
    expect(tierOf('wellington')).toBe(3);
    expect(weightOf('wellington')).toBe(1);
  });

  it('every SEO city has a defined weight (>= 1)', () => {
    for (const c of SEO_CITIES) {
      expect(weightOf(c.slug)).toBeGreaterThanOrEqual(1);
    }
  });

  it('weighted pool is larger than the SEO city set', () => {
    // Tier-1 cities multiply 4×, tier-2 2×, so the pool > raw count.
    expect(buildWeightedCityPool().length).toBeGreaterThan(SEO_CITIES.length);
  });

  it('tier-1 cities dominate the daily pick over a 30-day window', () => {
    // Over many days, tier-1 cities should appear roughly 4× more
    // often than tier-3 — verify Tokyo (T1) shows up more than
    // Wellington (T3).
    let tokyoCount = 0;
    let wellingtonCount = 0;
    for (let d = 1; d <= 30; d++) {
      const dayKey = `2026-06-${String(d).padStart(2, '0')}`;
      const slugs = pickRotatedCities({ dayKey, platform: 'pinterest', count: 20 });
      if (slugs.includes('tokyo')) tokyoCount += 1;
      if (slugs.includes('wellington')) wellingtonCount += 1;
    }
    expect(tokyoCount).toBeGreaterThan(wellingtonCount);
  });
});

describe('pickRotatedCities — cooldown', () => {
  it('respects excludeSlugs so excluded cities never appear in the pick', () => {
    const exclude = new Set(['tokyo', 'paris', 'rome']);
    const out = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'pinterest',
      count: 20,
      excludeSlugs: exclude,
    });
    for (const s of out) expect(exclude.has(s)).toBe(false);
  });

  it('still returns the requested count even when exclusion shrinks the pool slightly', () => {
    const exclude = new Set(['tokyo', 'paris', 'rome']);
    const out = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'pinterest',
      count: 20,
      excludeSlugs: exclude,
    });
    expect(out).toHaveLength(20);
  });

  it('determinism survives the exclusion filter', () => {
    const exclude = new Set(['kyoto']);
    const a = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'pinterest',
      count: 15,
      excludeSlugs: exclude,
    });
    const b = pickRotatedCities({
      dayKey: '2026-06-13',
      platform: 'pinterest',
      count: 15,
      excludeSlugs: exclude,
    });
    expect(a).toEqual(b);
  });
});
