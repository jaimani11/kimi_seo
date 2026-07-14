/**
 * stayviaowner-LOCAL rental route matrix — per-city × property-type
 * vacation-rental pages.
 *
 * This is deliberately NOT part of the shared @adored/seo-routing
 * enumerator: gotript (the Expedia hotels brand) must NOT inherit these
 * routes, or we recreate the cross-domain duplicate content that buried
 * stayviaowner in the first place. These pages are the VRBO/whole-home
 * angle that gotript structurally does not publish, so they live here,
 * local to this app only.
 *
 * URL scheme (mounted at /rentals/[slug]):
 *   /rentals/{city}                    → "Vacation rentals in {City}"   (hub, 1/city)
 *   /rentals/{category}-in-{city}      → "{Category} in {City}"         (type page)
 *
 * e.g. /rentals/santorini, /rentals/villas-in-santorini,
 *      /rentals/pet-friendly-villas-in-rome
 *
 * Eligibility: universal types render for every city; the climate-bound
 * types are gated by latitude so we never publish "ski lodges in the
 * tropics" or "beach houses in the Arctic" doorway pages.
 */

import { SEO_CITIES, findCityBySlug, type SeoCity } from '@lib/seo/cities';
import {
  ACCOMMODATION_CATEGORIES,
  findAccommodationCategory,
  type AccommodationCategory,
} from '@lib/seo/accommodation-categories';

/**
 * Terrain gating. A handful of property types only make sense in a
 * specific geography (you can't ski on a Greek island, or beach-house in
 * a landlocked alpine town). Latitude alone can't tell a warm coastal
 * island from a cold alpine valley, so we gate those types to curated
 * city sets seeded from the categories' OWN editorial `topCitySlugs` —
 * which already encode where each type actually belongs. Every other type
 * is universal (renders for all 216 cities).
 */
function seedCitySet(categorySlugs: readonly string[]): ReadonlySet<string> {
  const set = new Set<string>();
  for (const slug of categorySlugs) {
    const category = findAccommodationCategory(slug);
    if (category) for (const citySlug of category.topCitySlugs) set.add(citySlug);
  }
  return set;
}

const MOUNTAIN_LAKE_CITIES = seedCitySet(['ski-lodges', 'chalets', 'cabins', 'lake-houses']);
const COASTAL_CITIES = seedCitySet([
  'beach-houses',
  'beach-villas',
  'villas',
  'luxury-villas',
  'private-pool-villas',
]);

/** Property types gated to a terrain city set; everything else is universal. */
const TERRAIN_GATE: Record<string, ReadonlySet<string>> = {
  'ski-lodges': MOUNTAIN_LAKE_CITIES,
  chalets: MOUNTAIN_LAKE_CITIES,
  'lake-houses': MOUNTAIN_LAKE_CITIES,
  'beach-houses': COASTAL_CITIES,
  'beach-villas': COASTAL_CITIES,
};

/** Whether a category × city pair is worth publishing (terrain sanity). */
export function isRentalPairEligible(
  category: AccommodationCategory,
  city: SeoCity,
): boolean {
  const gate = TERRAIN_GATE[category.slug];
  return gate ? gate.has(city.slug) : true;
}

/** A resolved rental route: either a city hub or a category-in-city page. */
export type RentalRoute =
  | { kind: 'city'; city: SeoCity }
  | { kind: 'type'; city: SeoCity; category: AccommodationCategory };

const IN = '-in-';

/**
 * Parse a /rentals/[slug] slug into a route, or null (→ 404). Category
 * prefixes are matched explicitly (not by splitting on "-in-") so slugs
 * whose city or category name contains hyphens stay unambiguous.
 */
export function parseRentalSlug(slug: string): RentalRoute | null {
  // Type page: {category}-in-{city}
  for (const category of ACCOMMODATION_CATEGORIES) {
    const marker = `${category.slug}${IN}`;
    if (slug.startsWith(marker)) {
      const citySlug = slug.slice(marker.length);
      const city = findCityBySlug(citySlug);
      if (city && isRentalPairEligible(category, city)) {
        return { kind: 'type', city, category };
      }
      return null; // known category prefix but bad/ineligible city → 404
    }
  }
  // City hub: bare {city} slug
  const city = findCityBySlug(slug);
  if (city) return { kind: 'city', city };
  return null;
}

/** The URL path for a route (leading slash, no origin). */
export function rentalPath(route: RentalRoute): string {
  return route.kind === 'city'
    ? `/rentals/${route.city.slug}`
    : `/rentals/${route.category.slug}${IN}${route.city.slug}`;
}

/** The slug (no /rentals/ prefix) for a route. */
export function rentalSlug(route: RentalRoute): string {
  return route.kind === 'city'
    ? route.city.slug
    : `${route.category.slug}${IN}${route.city.slug}`;
}

/**
 * Every eligible slug — the full matrix. Used for the sitemap and as the
 * validation universe. ~3,700 entries (216 city hubs + eligible pairs).
 */
export function enumerateRentalSlugs(): string[] {
  const slugs: string[] = [];
  for (const city of SEO_CITIES) {
    slugs.push(city.slug); // hub
    for (const category of ACCOMMODATION_CATEGORIES) {
      if (isRentalPairEligible(category, city)) {
        slugs.push(`${category.slug}${IN}${city.slug}`);
      }
    }
  }
  return slugs;
}

/**
 * The subset to statically prerender at build time (fast build, clean
 * first paint on the pages most likely to be crawled first): every city
 * hub + each category's editorially-chosen top cities. The long tail
 * renders on-demand (ISR) on first request and is cached thereafter.
 */
export function staticRentalSlugs(): string[] {
  const slugs = new Set<string>();
  for (const city of SEO_CITIES) slugs.add(city.slug); // all hubs
  for (const category of ACCOMMODATION_CATEGORIES) {
    for (const citySlug of category.topCitySlugs) {
      const city = findCityBySlug(citySlug);
      if (city && isRentalPairEligible(category, city)) {
        slugs.add(`${category.slug}${IN}${city.slug}`);
      }
    }
  }
  return [...slugs];
}

// ── Internal-linking helpers ─────────────────────────────────────────

/** Other property types available in the same city (sibling links). */
export function siblingTypeLinks(
  city: SeoCity,
  currentCategorySlug: string | null,
  limit = 8,
): { label: string; href: string; emoji: string }[] {
  return ACCOMMODATION_CATEGORIES.filter(
    (c) => c.slug !== currentCategorySlug && isRentalPairEligible(c, city),
  )
    .slice(0, limit)
    .map((c) => ({
      label: `${c.name} in ${city.name}`,
      href: `/rentals/${c.slug}${IN}${city.slug}`,
      emoji: c.emoji,
    }));
}

/** The same property type in the category's other top cities. */
export function sameTypeCityLinks(
  category: AccommodationCategory,
  currentCitySlug: string,
  limit = 8,
): { label: string; href: string; oneLiner: string }[] {
  const out: { label: string; href: string; oneLiner: string }[] = [];
  for (const citySlug of category.topCitySlugs) {
    if (citySlug === currentCitySlug) continue;
    const city = findCityBySlug(citySlug);
    if (!city || !isRentalPairEligible(category, city)) continue;
    out.push({
      label: `${category.name} in ${city.name}`,
      href: `/rentals/${category.slug}${IN}${city.slug}`,
      oneLiner: city.oneLiner,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** All property-type links for a city hub page. */
export function cityTypeLinks(
  city: SeoCity,
): { label: string; href: string; emoji: string; tagline: string }[] {
  return ACCOMMODATION_CATEGORIES.filter((c) => isRentalPairEligible(c, city)).map(
    (c) => ({
      label: `${c.name} in ${city.name}`,
      href: `/rentals/${c.slug}${IN}${city.slug}`,
      emoji: c.emoji,
      tagline: c.tagline,
    }),
  );
}
