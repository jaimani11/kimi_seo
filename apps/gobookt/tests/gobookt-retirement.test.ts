import { describe, expect, it } from 'vitest';
import {
  enumerateAllSeoSlugs as enumerateBase,
  parseSeoSlug,
} from '@adored/seo-routing/multicategory';
import { hasDestinationGuide } from '@adored/seo-data';
import { retirementFor, heldPageTitle } from '@lib/seo/gobookt-retirement';
import { enumerateAllSeoSlugs } from '@lib/seo/route-parser';

/** Every base slug + its parsed route (non-null), grouped for assertions. */
const PARSED = enumerateBase()
  .map((slug) => ({ slug, parsed: parseSeoSlug(slug) }))
  .filter((x): x is { slug: string; parsed: NonNullable<typeof x.parsed> } => x.parsed !== null);

function sample(kind: string) {
  return PARSED.filter((x) => x.parsed.kind === kind);
}

const REDIRECT_THEMES = new Set([
  'family',
  'with-kids',
  'with-teens',
  'luxury',
  'honeymoon',
  'budget-per-day',
  'spring',
  'summer',
  'fall',
  'winter',
]);

describe('retirementFor — redirected families', () => {
  it('itinerary + weekend → destination guide if it exists, else hotels-in (one target per city)', () => {
    for (const { parsed } of [...sample('itinerary'), ...sample('weekend')]) {
      const r = retirementFor(parsed);
      expect(r?.kind).toBe('redirect');
      if (r?.kind === 'redirect' && 'city' in parsed) {
        const c = parsed.city.slug;
        expect(r.to).toBe(hasDestinationGuide(c) ? `/destinations/${c}` : `/hotels-in-${c}`);
      }
    }
  });

  it('things-to-do → /top-attractions-in-{city}', () => {
    const rows = sample('things-to-do');
    expect(rows.length).toBeGreaterThan(0);
    for (const { parsed } of rows) {
      const r = retirementFor(parsed);
      expect(r?.kind).toBe('redirect');
      if (r?.kind === 'redirect' && 'city' in parsed) {
        expect(r.to).toBe(`/top-attractions-in-${parsed.city.slug}`);
      }
    }
  });

  it('accommodation-mapped themed-list themes → the matching hotel/best-time page', () => {
    const expected: Record<string, (c: string) => string> = {
      family: (c) => `/family-hotels-in-${c}`,
      'with-kids': (c) => `/family-hotels-in-${c}`,
      'with-teens': (c) => `/family-hotels-in-${c}`,
      luxury: (c) => `/luxury-hotels-in-${c}`,
      honeymoon: (c) => `/luxury-hotels-in-${c}`,
      'budget-per-day': (c) => `/cheap-hotels-in-${c}`,
      spring: (c) => `/best-time-to-visit-${c}`,
      summer: (c) => `/best-time-to-visit-${c}`,
      fall: (c) => `/best-time-to-visit-${c}`,
      winter: (c) => `/best-time-to-visit-${c}`,
    };
    for (const { parsed } of sample('themed-list')) {
      if (parsed.kind !== 'themed-list') continue;
      const build = expected[parsed.theme];
      const r = retirementFor(parsed);
      if (build) {
        expect(r?.kind).toBe('redirect');
        if (r?.kind === 'redirect') expect(r.to).toBe(build(parsed.city.slug));
      }
    }
  });
});

describe('retirementFor — held families', () => {
  it('pure-experience themed-list themes → held', () => {
    for (const { parsed } of sample('themed-list')) {
      if (parsed.kind !== 'themed-list') continue;
      if (!REDIRECT_THEMES.has(parsed.theme)) {
        expect(retirementFor(parsed)).toEqual({ kind: 'held' });
      }
    }
  });

  it('comparison → held', () => {
    const rows = sample('comparison');
    expect(rows.length).toBeGreaterThan(0);
    for (const { parsed } of rows) {
      expect(retirementFor(parsed)).toEqual({ kind: 'held' });
    }
  });

  it('held pages get a clean, Viator-free title', () => {
    for (const { parsed } of [...sample('themed-list'), ...sample('comparison')]) {
      if (retirementFor(parsed)?.kind !== 'held') continue;
      const t = heldPageTitle(parsed);
      expect(t.length).toBeGreaterThan(0);
      expect(t.toLowerCase()).not.toContain('viator');
    }
  });
});

describe('retirementFor — kept (non-retired) families', () => {
  it('hotels/climate/things-themed/cruise families are never retired', () => {
    const keptKinds = [
      'hotels-in',
      'hotels-themed',
      'flights-to',
      'flights-themed',
      'cars-in',
      'cars-themed',
      'things-themed',
      'best-time',
      'weather-month',
      'where-to-stay',
      'where-to-go-month',
      'cruise-region',
    ];
    for (const kind of keptKinds) {
      for (const { parsed } of sample(kind)) {
        expect(retirementFor(parsed)).toBeNull();
      }
    }
  });
});

describe('redirect integrity', () => {
  it('every redirect target is ONE HOP — the target itself is never retired', () => {
    for (const { parsed } of PARSED) {
      const r = retirementFor(parsed);
      if (r?.kind !== 'redirect') continue;
      const targetSlug = r.to.replace(/^\//, '');
      const targetParsed = parseSeoSlug(targetSlug);
      // /destinations/{city} is a separate route (not an editorial slug) → null.
      // Any editorial target MUST be non-retired, or we'd chain redirects.
      if (targetParsed) expect(retirementFor(targetParsed)).toBeNull();
    }
  });
});

describe('enumerateAllSeoSlugs (shim)', () => {
  it('drops every REDIRECTED slug from the sitemap/static-params set', () => {
    const kept = new Set(enumerateAllSeoSlugs());
    for (const { slug, parsed } of PARSED) {
      if (retirementFor(parsed)?.kind === 'redirect') {
        expect(kept.has(slug)).toBe(false);
      }
    }
  });

  it('KEEPS held pages + all non-retired pages (until the traffic review)', () => {
    const kept = new Set(enumerateAllSeoSlugs());
    for (const { slug, parsed } of PARSED) {
      const r = retirementFor(parsed);
      if (r?.kind === 'held' || r === null) {
        expect(kept.has(slug)).toBe(true);
      }
    }
  });

  it('drops a meaningful share (redirected families are thousands of URLs)', () => {
    expect(enumerateAllSeoSlugs().length).toBeLessThan(enumerateBase().length);
    const dropped = enumerateBase().length - enumerateAllSeoSlugs().length;
    expect(dropped).toBeGreaterThan(2000);
  });
});
