import { describe, expect, it } from 'vitest';
import {
  enumerateAllSeoSlugs,
  parseSeoSlug,
  isNoindexSeoKind,
  isNoindexSeoSlug,
} from '@lib/seo/route-parser';
import { sitemapSections } from '@lib/site/sitemap-entries';

// The shared cross-brand editorial that renders near-identically across all four
// sibling brands (from @adored/seo-data) — noindexed on stayviaowner so Google
// stops deduping it to gotript and concentrates crawl budget on the unique Vrbo
// inventory. hotels-themed (Vrbo whole-home) is differentiated and stays indexed.
const SHARED_EDITORIAL_KINDS = [
  'things-to-do',
  'things-themed',
  'itinerary',
  'weekend',
  'themed-list',
  'comparison',
  'best-time',
  'weather-month',
  'where-to-stay',
  'where-to-go-month',
];

describe('stayviaowner crawl-budget concentration — noindex shared editorial', () => {
  it('flags every shared-editorial kind noindex, keeps hotels-themed (Vrbo) indexable', () => {
    for (const k of SHARED_EDITORIAL_KINDS) {
      expect(isNoindexSeoKind(k), `${k} should be noindex`).toBe(true);
    }
    expect(isNoindexSeoKind('hotels-themed')).toBe(false);
  });

  it('classifies real enumerated slugs correctly (editorial → noindex, hotels-themed → indexed)', () => {
    let sawNoindex = false;
    let sawHotelsThemed = false;
    for (const slug of enumerateAllSeoSlugs()) {
      const parsed = parseSeoSlug(slug);
      if (!parsed) continue;
      if (parsed.kind === 'hotels-themed') {
        sawHotelsThemed = true;
        expect(isNoindexSeoSlug(slug), `${slug} (hotels-themed) must stay indexed`).toBe(false);
      } else if (SHARED_EDITORIAL_KINDS.includes(parsed.kind)) {
        sawNoindex = true;
        expect(isNoindexSeoSlug(slug), `${slug} (${parsed.kind}) must be noindex`).toBe(true);
      }
    }
    // Both buckets must actually appear, or the test is vacuously green.
    expect(sawNoindex, 'expected shared-editorial slugs in the enumerate').toBe(true);
    expect(sawHotelsThemed, 'expected hotels-themed slugs in the enumerate').toBe(true);
  });

  it('sitemap editorial section lists ONLY indexable slugs (no noindex kinds leak in)', () => {
    const editorial = sitemapSections().find((s) => s.name === 'editorial');
    expect(editorial).toBeDefined();
    expect(editorial!.entries.length, 'hotels-themed should remain in the sitemap').toBeGreaterThan(0);
    for (const entry of editorial!.entries) {
      const slug = new URL(entry.url).pathname.replace(/^\//, '');
      expect(isNoindexSeoSlug(slug), `${slug} is noindex but still listed in the sitemap`).toBe(false);
    }
  });

  it('leaves the unique Vrbo sections (rentals / stays-near / group-travel) intact', () => {
    for (const n of ['rentals', 'stays-near', 'group-travel']) {
      const section = sitemapSections().find((s) => s.name === n);
      expect(section, `missing section ${n}`).toBeDefined();
      expect(section!.entries.length, `${n} should be non-empty`).toBeGreaterThan(0);
    }
  });
});
