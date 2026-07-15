import { describe, expect, it } from 'vitest';
import { renderSitemapIndexXml, renderSitemapXml } from '@adored/seo-routing/sitemap';
import buildSitemapEntries, {
  sitemapSections,
  sitemapSectionNames,
  sitemapSectionEntries,
} from '@lib/site/sitemap-entries';
import { getSiteOrigin } from '@lib/site/origin';
import { enumerateOccasionSlugs, enumerateStaysNearSlugs } from '@adored/seo-data';
import { enumerateRentalSlugs } from '@lib/seo/rental-routes';

const origin = getSiteOrigin();
const sections = sitemapSections();
const all = buildSitemapEntries();

describe('stayviaowner sitemap index', () => {
  it('exposes the expected named sections in order', () => {
    expect(sitemapSectionNames()).toEqual([
      'core',
      'destinations',
      'rentals',
      'stays-near',
      'group-travel',
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
    for (const sibling of ['gotript', 'numiworks', 'gobookt']) {
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

  it('parity: the split preserves every programmatic URL (nothing dropped)', () => {
    const urlset = new Set(all.map((x) => x.url));
    for (const slug of enumerateOccasionSlugs()) expect(urlset.has(`${origin}/celebrations/${slug}`)).toBe(true);
    for (const slug of enumerateRentalSlugs()) expect(urlset.has(`${origin}/rentals/${slug}`)).toBe(true);
    for (const slug of enumerateStaysNearSlugs()) expect(urlset.has(`${origin}/stays-near/${slug}`)).toBe(true);
    expect(all.length).toBe(sections.reduce((n, s) => n + s.entries.length, 0));
  });

  it('renders a valid sitemap index + valid child urlsets', () => {
    const idx = renderSitemapIndexXml(sitemapSectionNames().map((n) => ({ loc: `${origin}/sitemaps/${n}.xml` })));
    expect(idx).toContain('<sitemapindex');
    expect(idx).toContain(`${origin}/sitemaps/rentals.xml`);
    expect(idx).not.toContain('<?xml-stylesheet'); // an index is machine-only

    const child = renderSitemapXml(sitemapSectionEntries('group-travel') ?? []);
    expect(child).toContain('<urlset');
    expect(child).toContain('<loc>');
    expect(child).toContain('<?xml-stylesheet'); // children keep the human stylesheet
  });

  it('unknown section resolves to null (route will 404)', () => {
    expect(sitemapSectionEntries('does-not-exist')).toBeNull();
  });
});
