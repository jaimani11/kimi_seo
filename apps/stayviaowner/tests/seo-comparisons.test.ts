import { describe, expect, it } from 'vitest';
import {
  canonicalComparisonSlug,
  comparisonsForCity,
  enumerateAllComparisonSlugs,
  findComparison,
} from '../src/lib/seo/comparisons';
import { SEO_CITIES, findCityBySlug } from '../src/lib/seo/cities';
import { enumerateAllSeoSlugs, parseSeoSlug } from '../src/lib/seo/route-parser';

describe('comparisons allowlist', () => {
  it('every comparison slug parses back to a known pair', () => {
    const slugs = enumerateAllComparisonSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const m = parseSeoSlug(slug);
      expect(m, `expected ${slug} to parse`).not.toBeNull();
      expect(m!.kind).toBe('comparison');
    }
  });

  it('every comparison slug references a known SEO city', () => {
    for (const slug of enumerateAllComparisonSlugs()) {
      const match = /^(.+)-vs-(.+)$/.exec(slug);
      expect(match).not.toBeNull();
      const [, left, right] = match!;
      expect(findCityBySlug(left!), `${left} should exist`).not.toBeNull();
      expect(findCityBySlug(right!), `${right} should exist`).not.toBeNull();
    }
  });

  it('all enumerated slugs are alphabetically canonical', () => {
    for (const slug of enumerateAllComparisonSlugs()) {
      const [left, right] = slug.split('-vs-') as [string, string];
      expect(left < right, `${slug}: left should sort before right`).toBe(true);
    }
  });
});

describe('findComparison', () => {
  it('returns the pair in canonical order regardless of input order', () => {
    const fwd = findComparison('tokyo', 'kyoto');
    const rev = findComparison('kyoto', 'tokyo');
    expect(fwd).not.toBeNull();
    expect(rev).not.toBeNull();
    expect(fwd!.a.slug).toBe(rev!.a.slug);
    expect(fwd!.b.slug).toBe(rev!.b.slug);
  });

  it('returns null for an unallowed pair', () => {
    // tulum + reykjavik isn't on the curated allowlist
    expect(findComparison('tulum', 'reykjavik')).toBeNull();
  });

  it('returns null for self-comparison', () => {
    expect(findComparison('tokyo', 'tokyo')).toBeNull();
  });

  it('returns null when either slug is unknown', () => {
    expect(findComparison('tokyo', 'atlantis')).toBeNull();
    expect(findComparison('atlantis', 'tokyo')).toBeNull();
  });
});

describe('canonicalComparisonSlug', () => {
  it('always produces alphabetical ordering', () => {
    expect(canonicalComparisonSlug('tokyo', 'kyoto')).toBe('kyoto-vs-tokyo');
    expect(canonicalComparisonSlug('kyoto', 'tokyo')).toBe('kyoto-vs-tokyo');
  });
});

describe('comparisonsForCity', () => {
  it('lists every comparison Tokyo participates in', () => {
    const list = comparisonsForCity('tokyo');
    expect(list.length).toBeGreaterThan(0);
    for (const c of list) {
      expect(c.a.slug === 'tokyo' || c.b.slug === 'tokyo').toBe(true);
    }
  });

  it('returns empty for a city with no comparisons', () => {
    // Pick a city not in any pair — Reykjavik isn't in the allowlist.
    const list = comparisonsForCity('reykjavik');
    expect(list).toEqual([]);
  });
});

describe('SEO scale-out — Phase 7 cities', () => {
  it('SEO_CITIES has at least 80 cities (Phase 7 expansion)', () => {
    expect(SEO_CITIES.length).toBeGreaterThanOrEqual(80);
  });

  it('enumerateAllSeoSlugs includes both per-city + comparison slugs', () => {
    const all = enumerateAllSeoSlugs();
    // 10 per-city patterns × 80+ cities = 800+ minimum, plus comparisons
    expect(all.length).toBeGreaterThan(800);
    // Every comparison slug must appear in the global enumeration too.
    for (const cmp of enumerateAllComparisonSlugs()) {
      expect(all).toContain(cmp);
    }
  });

  it('every enumerated slug round-trips through parseSeoSlug', () => {
    for (const slug of enumerateAllSeoSlugs()) {
      const m = parseSeoSlug(slug);
      expect(m, `slug ${slug} should parse`).not.toBeNull();
    }
  });

  it('all enumerated slugs are unique', () => {
    const all = enumerateAllSeoSlugs();
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('parseSeoSlug — comparison form', () => {
  it('matches a known canonical pair', () => {
    const m = parseSeoSlug('kyoto-vs-tokyo');
    expect(m).not.toBeNull();
    expect(m!.kind).toBe('comparison');
    if (m!.kind === 'comparison') {
      expect(m!.comparison.a.slug).toBe('kyoto');
      expect(m!.comparison.b.slug).toBe('tokyo');
    }
  });

  it('matches the reversed pair (resolves to canonical)', () => {
    const m = parseSeoSlug('tokyo-vs-kyoto');
    expect(m).not.toBeNull();
    expect(m!.kind).toBe('comparison');
    if (m!.kind === 'comparison') {
      expect(m!.comparison.a.slug).toBe('kyoto');
      expect(m!.comparison.b.slug).toBe('tokyo');
    }
  });

  it('returns null for an unallowed pair', () => {
    expect(parseSeoSlug('tulum-vs-reykjavik')).toBeNull();
  });

  it('returns null for self-comparison', () => {
    expect(parseSeoSlug('tokyo-vs-tokyo')).toBeNull();
  });

  it('handles multi-word slugs (hong-kong-vs-singapore)', () => {
    const m = parseSeoSlug('hong-kong-vs-singapore');
    expect(m).not.toBeNull();
    expect(m!.kind).toBe('comparison');
  });
});
