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

// The SEO sections carved out of the shared programmatic long-tail
// (enumerateAllSeoSlugs). The 'itineraries' and 'things-to-do' sections were retired
// (those families now 308-redirect and must not be listed in a sitemap), so only
// 'seasonal' + 'editorial' are emitted. where-to-stay is also filtered out (owned by
// gobookt). Their union must equal enumerateAllSeoSlugs MINUS those excluded families.
const SEO_SPLIT_SECTIONS = ['seasonal', 'editorial'] as const;
const seoSplitEntries = SEO_SPLIT_SECTIONS.flatMap((n) => sitemapSectionEntries(n) ?? []);
/** Families intentionally kept OUT of the sitemap (retired/redirected or single-owner). */
const isExcludedFromSitemap = (slug: string): boolean =>
  /-\d+-day-itinerary$/.test(slug) ||
  /^weekend-in-/.test(slug) ||
  /^things-to-do-in-/.test(slug) ||
  /^where-to-stay-in-/.test(slug);

describe('gotript sitemap index', () => {
  it('exposes the expected named sections in order', () => {
    expect(sitemapSectionNames()).toEqual([
      'core',
      'destinations',
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

  it('parity: seasonal ∪ editorial === enumerateAllSeoSlugs MINUS excluded families (no extra, no dupe)', () => {
    const splitUrls = seoSplitEntries.map((x) => x.url);
    const splitSet = new Set(splitUrls);
    const expected = new Set(
      enumerateAllSeoSlugs()
        .filter((slug) => !isExcludedFromSitemap(slug))
        .map((slug) => `${origin}/${slug}`),
    );

    // No slug lands in two of the SEO sections.
    expect(splitUrls.length).toBe(splitSet.size);
    // Exact set equality: every NON-excluded enumerated slug is present, nothing extra,
    // and every excluded family (itinerary/weekend/things-to-do/where-to-stay) is absent.
    expect([...splitSet].sort()).toEqual([...expected].sort());
  });

  it('renders a valid sitemap index + valid child urlsets', () => {
    const idx = renderSitemapIndexXml(
      sitemapSectionNames().map((n) => ({ loc: `${origin}/sitemaps/${n}.xml` })),
    );
    expect(idx).toContain('<sitemapindex');
    expect(idx).toContain(`${origin}/sitemaps/editorial.xml`);
    expect(idx).not.toContain('<?xml-stylesheet'); // an index is machine-only

    const child = renderSitemapXml(sitemapSectionEntries('editorial') ?? []);
    expect(child).toContain('<urlset');
    expect(child).toContain('<loc>');
    expect(child).toContain('<?xml-stylesheet'); // children keep the human stylesheet
  });

  it('unknown section resolves to null (route will 404)', () => {
    expect(sitemapSectionEntries('does-not-exist')).toBeNull();
  });
});
