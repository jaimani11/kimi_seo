import { describe, expect, it } from 'vitest';
import { renderSitemapIndexXml, renderSitemapXml } from '@adored/seo-routing/sitemap';
import buildSitemapEntries, {
  sitemapSections,
  sitemapSectionNames,
  sitemapSectionEntries,
} from '@lib/site/sitemap-entries';
import { getSiteOrigin } from '@lib/site/origin';
import { enumerateAllSeoSlugs } from '@lib/seo/route-parser';
import { allAccommodationCategories } from '@lib/seo/accommodation-categories';
import { enumerateOccasionSlugs, enumerateStaysNearSlugs } from '@adored/seo-data';

const origin = getSiteOrigin();
const sections = sitemapSections();
const all = buildSitemapEntries();

// The four sections carved out of the shared programmatic long-tail
// (enumerateAllSeoSlugs). Their union must equal the full slug set.
const SEO_SPLIT_SECTIONS = ['itineraries', 'things-to-do', 'seasonal', 'editorial'] as const;
const seoSplitEntries = SEO_SPLIT_SECTIONS.flatMap((n) => sitemapSectionEntries(n) ?? []);

describe('gotript sitemap index', () => {
  it('exposes the expected named sections in order', () => {
    expect(sitemapSectionNames()).toEqual([
      'core',
      'destinations',
      'itineraries',
      'things-to-do',
      'seasonal',
      'accommodation',
      'stays-near',
      'celebrations',
      'editorial',
    ]);
  });

  it('every URL uses the canonical origin host — no wrong-host, no cross-brand', () => {
    for (const s of sections) {
      for (const entry of s.entries) {
        expect(entry.url === origin || entry.url.startsWith(`${origin}/`)).toBe(true);
      }
    }
    const joined = all.map((x) => x.url).join(' ');
    for (const sibling of ['gobookt', 'numiworks', 'stayviaowner']) {
      expect(joined).not.toContain(sibling);
    }
  });

  it('has no duplicate URLs within or across child sitemaps', () => {
    const urls = all.map((x) => x.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('excludes utility / noindex / robots-blocked routes', () => {
    const bad = all.filter(
      (x) => /\/(api|admin|search|t|profile)\//.test(x.url) || x.url.endsWith('/search'),
    );
    expect(bad).toEqual([]);
  });

  it('carries no per-deploy lastmod stamp', () => {
    expect(all.every((x) => x.lastModified === undefined)).toBe(true);
  });

  it('parity: the split preserves every programmatic URL (nothing dropped)', () => {
    const urlset = new Set(all.map((x) => x.url));
    for (const slug of enumerateOccasionSlugs())
      expect(urlset.has(`${origin}/celebrations/${slug}`)).toBe(true);
    for (const slug of enumerateStaysNearSlugs())
      expect(urlset.has(`${origin}/stays-near/${slug}`)).toBe(true);
    // Accommodation category pages (/villas, /cabins, …) predate the split and
    // must survive it — the section list must not silently drop these.
    for (const c of allAccommodationCategories())
      expect(urlset.has(`${origin}/${c.slug}`)).toBe(true);
    expect(all.length).toBe(sections.reduce((n, s) => n + s.entries.length, 0));
  });

  it('parity: itineraries ∪ things-to-do ∪ seasonal ∪ editorial === full enumerateAllSeoSlugs (no drop, no cross-section dupe)', () => {
    const splitUrls = seoSplitEntries.map((x) => x.url);
    const splitSet = new Set(splitUrls);
    const expected = new Set(enumerateAllSeoSlugs().map((slug) => `${origin}/${slug}`));

    // No slug lands in two of the four SEO sections.
    expect(splitUrls.length).toBe(splitSet.size);
    // Exact set equality: every enumerated slug is present, and nothing extra.
    expect([...splitSet].sort()).toEqual([...expected].sort());
  });

  it('renders a valid sitemap index + valid child urlsets', () => {
    const idx = renderSitemapIndexXml(
      sitemapSectionNames().map((n) => ({ loc: `${origin}/sitemaps/${n}.xml` })),
    );
    expect(idx).toContain('<sitemapindex');
    expect(idx).toContain(`${origin}/sitemaps/itineraries.xml`);
    expect(idx).not.toContain('<?xml-stylesheet'); // an index is machine-only

    const child = renderSitemapXml(sitemapSectionEntries('things-to-do') ?? []);
    expect(child).toContain('<urlset');
    expect(child).toContain('<loc>');
    expect(child).toContain('<?xml-stylesheet'); // children keep the human stylesheet
  });

  it('unknown section resolves to null (route will 404)', () => {
    expect(sitemapSectionEntries('does-not-exist')).toBeNull();
  });
});
