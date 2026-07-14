import type { MetadataRoute } from 'next';
import { ITALIAN_DESTINATIONS } from '@lib/curation/destinations';
import { getSiteOrigin } from '@lib/site/origin';
import { enumerateAllSeoSlugs } from '@lib/seo/route-parser';
import { SEO_CITIES } from '@lib/seo/cities';
import { hasDestinationGuide } from '@lib/seo/destination-content';
import { allAccommodationCategories } from '@lib/seo/accommodation-categories';
import { enumerateStaysNearSlugs, enumerateOccasionSlugs } from '@adored/seo-data';
import { enumerateHotelTypeSlugs } from '@lib/seo/hotel-type-routes';

/**
 * Crawler-facing sitemap. Includes:
 *   - `/` homepage
 *   - `/search` (entry point) + high-intent `/search?q=…` queries
 *   - `/destinations` (curated index)
 *   - `/destinations/[slug]` (one per curated entry)
 *   - `/plan` (itinerary builder entry point)
 *   - `/faq`, `/about`, `/privacy`, `/terms`, `/contact` (trust pages)
 *
 * Deliberately EXCLUDES `/t/[slug]` - share slugs are unguessable
 * (~95 bits of entropy) and meant for direct sharing, not indexing.
 *
 * Deliberately EXCLUDES `/experiences/[productCode]` from the static
 * sitemap because the product catalog is enormous and changes
 * frequently. Surface the catalog via a separate dynamic sitemap or
 * via Viator's own canonicals once the volume justifies it.
 */

/**
 * High-intent queries that map to common travel searches. Adding them
 * to the sitemap gives Google an indexable surface for each — every
 * one is an entry point that can rank for "<query>".
 */
const HIGH_INTENT_QUERIES: readonly string[] = [
  'Tokyo',
  'Paris',
  'Rome',
  'Cappadocia',
  'Reykjavik',
  'Bali',
  'New York',
  'Marrakech',
  'Lisbon',
  'Santorini',
  'Barcelona',
  'Amsterdam',
  'cooking class Tokyo',
  'cooking class Rome',
  'cooking class Paris',
  'food tour Lisbon',
  'wine tour Florence',
  'snorkel Bali',
  'hot air balloon Cappadocia',
  'glacier hike Iceland',
  'private tour Rome',
  'day trip from Paris',
  'day trip from Tokyo',
  'sunset cruise Santorini',
  'desert safari Marrakech',
  'Vatican skip the line',
  'Louvre tour',
  'Eiffel Tower tour',
  'Pompeii day trip',
  'Northern Lights Iceland',
];

const TRUST_PAGES: readonly string[] = ['/faq', '/about', '/privacy', '/terms', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteOrigin();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    // /search is noindex — omitted from sitemap.
    { url: `${base}/plan`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${base}/destinations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...ITALIAN_DESTINATIONS.map((d) => ({
      url: `${base}/destinations/${d.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // HIGH_INTENT_QUERIES excluded — /search is noindex.
    ...TRUST_PAGES.map((p) => ({
      url: `${base}${p}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    // Programmatic SEO surfaces — every itinerary length × every
    // city, plus a things-to-do page per city. Each is statically
    // generated at build time (generateStaticParams in app/[slug]/
    // page.tsx) and lives behind a slug allowlist so the SEO surface
    // can scale by tens of thousands of pages without ever serving
    // an empty / thin / spam-shape page.
    ...enumerateAllSeoSlugs().map((slug) => ({
      url: `${base}/${slug}`,
      lastModified: now,
      changeFrequency: slug.includes('itinerary')
        ? ('weekly' as const)
        : ('weekly' as const),
      priority: 0.75,
    })),
    // Rich destination guide pages — only the SEO cities that have
    // hand-authored content in DESTINATION_GUIDES. As content gets
    // authored for more cities (Sprint 13+), this list grows
    // automatically.
    ...SEO_CITIES.filter((c) => hasDestinationGuide(c.slug)).map((c) => ({
      url: `${base}/destinations/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    // Accommodation-type landing pages — /villas, /luxury-villas,
    // /beach-villas, etc. Each ranks for its category-level search
    // intent and funnels clicks to Booking.com stay inventory.
    ...allAccommodationCategories().map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    // "Hotels near {POI}" pages — city-centre + airport + real neighborhoods
    // per city (hotala-style hyperlocal hotel intent, Booking.com angle).
    ...enumerateStaysNearSlugs().map((slug) => ({
      url: `${base}/stays-near/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Occasion / celebration pages — in the sitemap (indexable) but NOT linked
    // from nav/homepage.
    ...enumerateOccasionSlugs().map((slug) => ({
      url: `${base}/celebrations/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Hotel-facet pages — spa / adults-only / ski / all-inclusive etc. per
    // city. gobookt-local Booking.com hotel long-tail; targets only the
    // facets the shared hotels-themed matrix doesn't already publish.
    ...enumerateHotelTypeSlugs().map((slug) => ({
      url: `${base}/hotels/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  return entries;
}
