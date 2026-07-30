import { describe, expect, it } from 'vitest';
import { renderSitemapIndexXml, renderSitemapXml } from '@adored/seo-routing/sitemap';
import buildSitemapEntries, {
  sitemapSections,
  sitemapSectionNames,
  sitemapSectionEntries,
} from '@lib/site/sitemap-entries';
import { getSiteOrigin } from '@lib/site/origin';
import { enumerateOccasionSlugs, enumerateStaysNearSlugs } from '@adored/seo-data';
import { enumerateTourCategorySlugs } from '@lib/seo/tour-category-routes';
import { allAttractions } from '@lib/seo/attractions';
import { enumerateAllSeoSlugs, parseSeoSlug } from '@lib/seo/route-parser';

const origin = getSiteOrigin();
const sections = sitemapSections();
const all = buildSitemapEntries();

describe('numiworks sitemap index', () => {
  it('exposes the expected named sections in order', () => {
    expect(sitemapSectionNames()).toEqual(['core', 'destinations', 'tours', 'occasion-pages', 'editorial']);
  });

  it('every URL uses the canonical origin host — no wrong-host, no cross-brand', () => {
    for (const s of sections) {
      for (const entry of s.entries) {
        expect(entry.url === origin || entry.url.startsWith(`${origin}/`)).toBe(true);
      }
    }
    const joined = all.map((x) => x.url).join(' ');
    for (const sibling of ['gobookt', 'gotript', 'stayviaowner']) {
      expect(joined).not.toContain(sibling);
    }
  });

  it('has no duplicate URLs within or across child sitemaps', () => {
    const urls = all.map((x) => x.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('excludes utility / noindex / robots-blocked routes', () => {
    const bad = all.filter((x) => /\/(api|admin|search|t|profile)\//.test(x.url) || x.url.endsWith('/search'));
    expect(bad).toEqual([]);
  });

  it('carries no per-deploy lastmod stamp', () => {
    expect(all.every((x) => x.lastModified === undefined)).toBe(true);
  });

  it('parity: the split preserves every indexable programmatic URL', () => {
    const urlset = new Set(all.map((x) => x.url));
    for (const slug of enumerateOccasionSlugs()) expect(urlset.has(`${origin}/celebrations/${slug}`)).toBe(true);
    for (const slug of enumerateTourCategorySlugs()) expect(urlset.has(`${origin}/tours/${slug}`)).toBe(true);
    for (const slug of enumerateStaysNearSlugs()) expect(urlset.has(`${origin}/stays-near/${slug}`)).toBe(true);
    for (const a of allAttractions()) expect(urlset.has(`${origin}/attractions/${a.slug}`)).toBe(true);
    // Families that are intentionally NOINDEXED + excluded from the sitemap while
    // still rendering (200) for crawling. Must match the exclusion list in
    // lib/site/sitemap-entries.ts. Climate = single-owner gotript (added earlier);
    // itinerary = single-owner gotript (seo-recovery-phase-1).
    const SITEMAP_EXCLUDED_KINDS = new Set([
      'best-time', 'weather-month', 'where-to-go-month', 'where-to-stay', 'itinerary',
    ]);
    for (const slug of enumerateAllSeoSlugs()) {
      const p = parseSeoSlug(slug);
      const inSitemap = urlset.has(`${origin}/${slug}`);
      if (p && SITEMAP_EXCLUDED_KINDS.has(p.kind)) {
        expect(inSitemap).toBe(false);
      } else {
        expect(inSitemap).toBe(true);
      }
    }
    expect(all.length).toBe(sections.reduce((n, s) => n + s.entries.length, 0));
  });

  it('renders a valid sitemap index + valid child urlsets', () => {
    const idx = renderSitemapIndexXml(sitemapSectionNames().map((n) => ({ loc: `${origin}/sitemaps/${n}.xml` })));
    expect(idx).toContain('<sitemapindex');
    expect(idx).toContain(`${origin}/sitemaps/tours.xml`);
    expect(idx).not.toContain('<?xml-stylesheet'); // an index is machine-only

    const child = renderSitemapXml(sitemapSectionEntries('occasion-pages') ?? []);
    expect(child).toContain('<urlset');
    expect(child).toContain('<loc>');
    expect(child).toContain('<?xml-stylesheet'); // children keep the human stylesheet
  });

  it('unknown section resolves to null (route will 404)', () => {
    expect(sitemapSectionEntries('does-not-exist')).toBeNull();
  });
});
