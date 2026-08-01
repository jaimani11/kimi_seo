import type { SitemapEntry } from '@adored/seo-routing/sitemap';
import { ITALIAN_DESTINATIONS } from '@lib/curation/destinations';
import { getSiteOrigin } from '@lib/site/origin';
import { enumerateAllSeoSlugs } from '@lib/seo/route-parser';
import { SEO_CITIES } from '@lib/seo/cities';
import { hasDestinationGuide } from '@lib/seo/destination-content';
import { allAccommodationCategories } from '@lib/seo/accommodation-categories';
import { enumerateOccasionSlugs } from '@adored/seo-data';

/**
 * Crawler-facing sitemap, split into named SECTIONS so `/sitemap.xml` serves a
 * sitemap INDEX referencing `/sitemaps/{section}.xml` children — Search Console
 * then reports discovery per page-type.
 *
 * gotript's large editorial long-tail (`enumerateAllSeoSlugs`) is further SPLIT
 * BY SLUG PATTERN into `itineraries` / `things-to-do` / `seasonal`, with
 * `editorial` as the catch-all — every slug is routed to EXACTLY ONE bucket
 * (first matching pattern wins), so the union of those four sections equals the
 * full `enumerateAllSeoSlugs` set with nothing dropped and nothing duplicated.
 *
 * Organizational only: the same canonical URLs, the same deliberate exclusions
 * (no `/search` [noindex], no `/api`, `/t`, `/admin`, `/profile` — those never
 * appear here), every URL on gotript's own canonical host, no duplicates
 * (deduped globally, first section wins), and NO per-deploy `lastmod` stamp (we
 * don't have real per-page modification dates, so we omit it rather than
 * mislead the crawler).
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
 * Pattern predicates for splitting `enumerateAllSeoSlugs`. Checked in order —
 * itineraries → things-to-do → seasonal → (catch-all) editorial — so the first
 * match wins and every slug lands in exactly one bucket.
 */
const isItinerarySlug = (slug: string): boolean =>
  /-\d+-day-itinerary$/.test(slug) || /^weekend-in-/.test(slug);
const isThingsToDoSlug = (slug: string): boolean => /^things-to-do-in-/.test(slug);
const isSeasonalSlug = (slug: string): boolean =>
  /^(summer|winter|spring|fall)-in-/.test(slug) ||
  /^best-time-to-visit-/.test(slug) ||
  /-weather-in-/.test(slug) ||
  /^where-to-go-in-/.test(slug);

interface SeoSlugBuckets {
  itineraries: string[];
  thingsToDo: string[];
  seasonal: string[];
  editorial: string[];
}

/**
 * Route every `enumerateAllSeoSlugs` slug into exactly one bucket. Iterating the
 * full set once with first-match-wins guarantees:
 *   itineraries ∪ things-to-do ∪ seasonal ∪ editorial === enumerateAllSeoSlugs
 * with no slug in two buckets and no slug dropped (editorial is the fallback).
 */
function bucketSeoSlugs(): SeoSlugBuckets {
  const buckets: SeoSlugBuckets = {
    itineraries: [],
    thingsToDo: [],
    seasonal: [],
    editorial: [],
  };
  for (const slug of enumerateAllSeoSlugs()) {
    if (isItinerarySlug(slug)) buckets.itineraries.push(slug);
    else if (isThingsToDoSlug(slug)) buckets.thingsToDo.push(slug);
    else if (isSeasonalSlug(slug)) buckets.seasonal.push(slug);
    else buckets.editorial.push(slug);
  }
  return buckets;
}

/**
 * Phase 2A off-role families (hotels/apartments/tours/cars/flights) — owned by sibling
 * brands (gobookt/numiworks/stayviaowner) or thin affiliate. Noindexed in `[slug]` and
 * excluded from the sitemap so gotript concentrates on planning/editorial. Keep this in
 * sync with the PHASE2A guard in app/[slug]/page.tsx.
 */
function isPhase2aOffRoleUrl(url: string): boolean {
  return /\/(hotels-in-|best-hotels-in-|cheap-hotels-in-|luxury-hotels-in-|boutique-hotels-in-|family-hotels-in-|pet-friendly-hotels-in-|beach-hotels-in-|hostels-in-|apartments-in-|tours-in-|private-tours-in-|walking-tours-in-|cars-in-|car-rentals-in-|cheap-car-rental-in-|airport-car-rental-in-|flights-to-|cheap-flights-to-)/.test(
    url,
  );
}

/**
 * Phase 2B climate compression: monthly-weather + where-to-go-in-{month} pages (the seasonal
 * pages are dropped by removing the 'seasonal' section). Noindexed in `[slug]` and excluded
 * from the sitemap; `best-time-to-visit-{city}` is KEPT. Keep in sync with the PHASE2B guard.
 */
const MONTHS_RE =
  '(january|february|march|april|may|june|july|august|september|october|november|december)';
function isPhase2bClimateUrl(url: string): boolean {
  return (
    new RegExp(`-weather-in-${MONTHS_RE}$`).test(url) ||
    new RegExp(`/where-to-go-in-${MONTHS_RE}$`).test(url) ||
    /\/(spring|summer|fall|winter)-in-/.test(url)
  );
}

/**
 * Named sections in index order. Deduped globally: a URL that would appear in
 * more than one section is kept only in the first (guarantees uniqueness within
 * and across child sitemaps).
 */
export function sitemapSections(): SitemapSection[] {
  const base = getSiteOrigin();
  const seo = bucketSeoSlugs();
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
    // 'itineraries' section retired: /{city}-N-day-itinerary and /weekend-in-{city}
    // now 308-redirect to /plan. A sitemap must not list redirecting URLs, so the
    // section is dropped (matches the things-to-do treatment below).
    // 'things-to-do' section retired: those /things-to-do-in-{city} pages now
    // 308-redirect to the city's destination guide (Viator editorial retired on
    // the Expedia brand; experiences live on numiworks). A sitemap must not list
    // redirecting URLs, so the section is dropped.
    {
      // Phase 2B climate compression: this bucket holds best-time + monthly-weather + the 4
      // seasonal pages. The global filter below drops monthly-weather and seasonal pages
      // (noindexed), so only `best-time-to-visit-{city}` survives here — one climate page/city.
      name: 'seasonal',
      entries: seo.seasonal.map((slug) => e(base, `/${slug}`, 0.75, 'weekly')),
    },
    {
      // Sub-brand accommodation category landing pages — /villas, /cabins,
      // /cottages, /beach-houses, … Each ranks for its category-level intent
      // and funnels clicks to Expedia + VRBO inventory. These are real,
      // indexable pages that predate the split; they get their own section so
      // the sitemap keeps discovering them (the ChatGPT section list had no
      // home for them, which would otherwise silently drop 17 valid URLs).
      name: 'accommodation',
      entries: allAccommodationCategories().map((c) => e(base, `/${c.slug}`, 0.9)),
    },
    // Phase 2A: 'stays-near' section removed — accommodation-adjacent, owned by
    // gobookt/stayviaowner. The pages are noindexed at the route level.
    {
      name: 'celebrations',
      entries: enumerateOccasionSlugs().map((slug) => e(base, `/celebrations/${slug}`, 0.6)),
    },
    {
      name: 'editorial',
      entries: seo.editorial.map((slug) => e(base, `/${slug}`, 0.75, 'weekly')),
    },
  ];

  const seen = new Set<string>();
  return raw.map((s) => ({
    name: s.name,
    entries: s.entries.filter((entry) => {
      // where-to-stay is owned by gobookt (noindex here) — keep it out of sitemap.
      if (/\/where-to-stay-in-/.test(entry.url)) return false;
      // Phase 2A: OFF-ROLE families (noindexed in [slug]) — keep them out of the sitemap.
      // hotels/apartments → gobookt; tours → numiworks; cars/flights = thin affiliate.
      if (isPhase2aOffRoleUrl(entry.url)) return false;
      // Phase 2B: monthly-weather + where-to-go-in-{month} (noindexed) — keep out of sitemap.
      if (isPhase2bClimateUrl(entry.url)) return false;
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
