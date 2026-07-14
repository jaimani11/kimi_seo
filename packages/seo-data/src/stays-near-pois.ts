/**
 * POI enumerator for "stays near {POI} in {city}" landing pages.
 *
 * This is a DATA helper (a list of real, per-city points of interest) —
 * NOT rendered content. Each brand renders its own differentiated template
 * over this list (gobookt = "Hotels near X", stayviaowner = "Rentals near X",
 * etc.), so sharing the POI list here does not create cross-domain duplicate
 * pages: the page bodies differ per brand.
 *
 * Two POI sources, both real (no LLM/hallucinated venues):
 *   1. Neighborhoods — the ~500 districts already in DESTINATION_GUIDES /
 *      NEIGHBORHOOD_COORDS (name + coords + blurb), e.g. "Le Marais" (Paris).
 *   2. Universal anchors — "{City} city centre" and "{City} airport", which
 *      are real for essentially every city and carry very high search intent
 *      ("hotels near {city} airport"). Partners resolve these free-text
 *      location queries natively (the hotala mechanism).
 *
 * The POI name is fed as the free-text destination/ss/text query into each
 * brand's affiliate builder; no builder change or POI whitelist is needed.
 */

import { SEO_CITIES, findCityBySlug, type SeoCity } from './cities';
import { findNeighborhoodPois } from './poi-coords';
import { DESTINATION_GUIDES } from './destination-content';

export type PoiKind = 'city-centre' | 'airport' | 'neighborhood';

export interface StaysNearPoi {
  /** URL slug fragment, unique within a city, e.g. 'le-marais' or 'airport'. */
  poiSlug: string;
  /** Display name, e.g. 'Le Marais' or the city centre / airport label. */
  poiName: string;
  /** The free-text location query handed to the affiliate builder. */
  searchQuery: string;
  kind: PoiKind;
  city: SeoCity;
  /** Editorial blurb when we have one (neighborhoods from the city guide). */
  blurb: string | null;
}

/** Slugify a POI name: ASCII-fold, drop parentheticals, kebab-case. */
export function slugifyPoi(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/\([^)]*\)/g, '') // drop "(Yaowarat)" style parentheticals
    .replace(/[/&]+/g, ' ') // "Aker Brygge / Tjuvholmen" -> space
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Neighborhood blurb from the city guide, matched by exact name. */
function neighborhoodBlurb(citySlug: string, name: string): string | null {
  const guide = DESTINATION_GUIDES[citySlug];
  if (!guide) return null;
  const hit = guide.neighborhoods.find((n) => n.name === name);
  return hit ? hit.blurb : null;
}

/** Every POI for a city: two universal anchors + its real neighborhoods. */
export function poisForCity(city: SeoCity): StaysNearPoi[] {
  const out: StaysNearPoi[] = [
    {
      poiSlug: 'city-centre',
      poiName: `${city.name} city centre`,
      searchQuery: `${city.name} city centre, ${city.countryName}`,
      kind: 'city-centre',
      city,
      blurb: null,
    },
    {
      poiSlug: 'airport',
      poiName: `${city.name} Airport`,
      searchQuery: `${city.name} airport, ${city.countryName}`,
      kind: 'airport',
      city,
      blurb: null,
    },
  ];
  const seen = new Set(out.map((p) => p.poiSlug));
  for (const n of findNeighborhoodPois(city.slug)) {
    const poiSlug = slugifyPoi(n.name);
    if (!poiSlug || seen.has(poiSlug)) continue;
    seen.add(poiSlug);
    out.push({
      poiSlug,
      poiName: n.name,
      searchQuery: `${n.name}, ${city.name}, ${city.countryName}`,
      kind: 'neighborhood',
      city,
      blurb: neighborhoodBlurb(city.slug, n.name),
    });
  }
  return out;
}

/**
 * Parse a `/stays-near/[slug]` slug of the form `{poiSlug}-in-{citySlug}`
 * (e.g. `le-marais-in-paris`, `airport-in-tokyo`) into a POI, or null (→404).
 * Matched against the enumerated POIs so only real slugs resolve.
 */
export function parseStaysNearSlug(slug: string): StaysNearPoi | null {
  const marker = '-in-';
  const idx = slug.lastIndexOf(marker);
  if (idx === -1) return null;
  const citySlug = slug.slice(idx + marker.length);
  const poiSlug = slug.slice(0, idx);
  const city = findCityBySlug(citySlug);
  if (!city) return null;
  return poisForCity(city).find((p) => p.poiSlug === poiSlug) ?? null;
}

/** The slug for a POI, `{poiSlug}-in-{citySlug}`. */
export function staysNearSlug(poi: StaysNearPoi): string {
  return `${poi.poiSlug}-in-${poi.city.slug}`;
}

/** Every stays-near slug across all cities — for sitemaps + validation. */
export function enumerateStaysNearSlugs(): string[] {
  const slugs: string[] = [];
  for (const city of SEO_CITIES) {
    for (const poi of poisForCity(city)) slugs.push(staysNearSlug(poi));
  }
  return slugs;
}

/**
 * A curated subset to prerender at build (the two universal anchors for
 * every city); neighborhoods render on-demand (ISR) + cache.
 */
export function staticStaysNearSlugs(): string[] {
  const slugs: string[] = [];
  for (const city of SEO_CITIES) {
    slugs.push(`city-centre-in-${city.slug}`, `airport-in-${city.slug}`);
  }
  return slugs;
}

/** Other POIs in the same city (sibling internal links). */
export function siblingPois(poi: StaysNearPoi, limit = 8): StaysNearPoi[] {
  return poisForCity(poi.city)
    .filter((p) => p.poiSlug !== poi.poiSlug)
    .slice(0, limit);
}
