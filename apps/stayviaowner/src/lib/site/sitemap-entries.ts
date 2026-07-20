import type { SitemapEntry } from '@adored/seo-routing/sitemap';
import { ITALIAN_DESTINATIONS } from '@lib/curation/destinations';
import { getSiteOrigin } from '@lib/site/origin';
import { enumerateAllSeoSlugs, isNoindexSeoSlug } from '@lib/seo/route-parser';
import { SEO_CITIES } from '@lib/seo/cities';
import { hasDestinationGuide } from '@lib/seo/destination-content';
import { allAccommodationCategories } from '@lib/seo/accommodation-categories';
import { enumerateRentalSlugs } from '@lib/seo/rental-routes';
import { clusterSitemapSections } from '@lib/seo/rental-clusters';
import { enumerateStaysNearSlugs, enumerateOccasionSlugs } from '@adored/seo-data';

/**
 * Crawler-facing sitemap, split into named SECTIONS so `/sitemap.xml` serves a
 * sitemap INDEX referencing `/sitemaps/{section}.xml` children — Search Console
 * then reports discovery per page-type.
 *
 * Organizational only: the same canonical URLs, the same deliberate exclusions
 * (no `/search` [noindex], no `/api`, `/t`, `/admin` — those never appear here),
 * every URL on stayviaowner's own canonical host, no duplicates (deduped
 * globally, first section wins), and NO per-deploy `lastmod` stamp (we don't
 * have real per-page modification dates, so we omit it rather than mislead the
 * crawler).
 */

const TRUST_PAGES: readonly string[] = ['/about', '/privacy', '/terms', '/contact'];

function e(
  base: string,
  path: string,
  priority: number,
  changeFrequency: SitemapEntry['changeFrequency'] = 'monthly',
): SitemapEntry {
  return { url: `${base}${path}`, changeFrequency, priority };
}

export interface SitemapSection {
  name: string;
  entries: SitemapEntry[];
}

/**
 * Named sections in index order. Deduped globally: a URL that would appear in
 * more than one section is kept only in the first (guarantees uniqueness within
 * and across child sitemaps).
 */
export function sitemapSections(): SitemapSection[] {
  const base = getSiteOrigin();
  const raw: SitemapSection[] = [
    {
      name: 'core',
      entries: [
        e(base, '/', 1.0, 'daily'),
        e(base, '/plan', 0.9, 'weekly'),
        ...TRUST_PAGES.map((p) => e(base, p, 0.5)),
      ],
    },
    {
      name: 'destinations',
      entries: [
        e(base, '/destinations', 0.9, 'weekly'),
        ...ITALIAN_DESTINATIONS.map((d) => e(base, `/destinations/${d.slug}`, 0.8)),
        ...SEO_CITIES.filter((c) => hasDestinationGuide(c.slug)).map((c) =>
          e(base, `/destinations/${c.slug}`, 0.85),
        ),
      ],
    },
    {
      name: 'rentals',
      entries: [
        ...enumerateRentalSlugs().map((slug) =>
          e(base, `/rentals/${slug}`, slug.includes('-in-') ? 0.7 : 0.8),
        ),
        ...allAccommodationCategories().map((c) => e(base, `/${c.slug}`, 0.9)),
      ],
    },
    {
      name: 'stays-near',
      entries: enumerateStaysNearSlugs().map((slug) => e(base, `/stays-near/${slug}`, 0.65)),
    },
    {
      name: 'group-travel',
      entries: enumerateOccasionSlugs().map((slug) => e(base, `/celebrations/${slug}`, 0.6)),
    },
    // Curated niche clusters (cabins-with-hot-tubs, farm-stays, reunion-villas)
    // — one sitemap section each so Search Console reports discovery per test
    // cluster. Hub gets 0.8, town pages 0.7.
    ...clusterSitemapSections().map((section) => ({
      name: section.name,
      entries: section.paths.map((path, i) => e(base, path, i === 0 ? 0.8 : 0.7)),
    })),
    {
      // Only the differentiated, indexable /[slug] pages remain (hotels-themed =
      // Vrbo whole-home rental themes). The shared cross-brand editorial
      // (things-to-do, itineraries, climate, comparisons) is `noindex, follow`, so
      // it's dropped from the sitemap — a sitemap should list only indexable URLs,
      // and this keeps Google's crawl budget on the unique inventory.
      name: 'editorial',
      entries: enumerateAllSeoSlugs()
        .filter((slug) => !isNoindexSeoSlug(slug))
        .map((slug) => e(base, `/${slug}`, 0.75, 'weekly')),
    },
  ];

  const seen = new Set<string>();
  return raw.map((s) => ({
    name: s.name,
    entries: s.entries.filter((entry) => {
      if (seen.has(entry.url)) return false;
      seen.add(entry.url);
      return true;
    }),
  }));
}

/** Ordered section names — drives the sitemap index. */
export function sitemapSectionNames(): string[] {
  return sitemapSections().map((s) => s.name);
}

/** One section's entries, or null for an unknown section name. */
export function sitemapSectionEntries(name: string): SitemapEntry[] | null {
  return sitemapSections().find((s) => s.name === name)?.entries ?? null;
}

/** All entries flattened — parity with the pre-split single sitemap. */
export default function buildSitemapEntries(): SitemapEntry[] {
  return sitemapSections().flatMap((s) => s.entries);
}
