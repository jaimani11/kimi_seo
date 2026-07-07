import { DESTINATION_PHOTOS } from './destination-photo-data';

/**
 * Inline category pool for the level-3 fallback. Intentionally separate
 * from `src/providers/_shared/photo-pool.ts`:
 *
 *   - lib must not depend on providers (boundary rule).
 *   - The providers pool exists for AI-synthesized stays (one per
 *     listing); this pool exists for destination heroes (one per
 *     search opportunity). Different surfaces, different curation -
 *     keeping them separate prevents a change to one inadvertently
 *     reshuffling the other.
 *
 * Each category lists ≥ 3 photos so the FNV-based selection produces
 * variety across destinations that fall through to the same heuristic.
 */
type PhotoCategory = 'cityscape' | 'beach' | 'mountains' | 'countryside';

const CATEGORY_POOL: Readonly<Record<PhotoCategory, readonly string[]>> = {
  cityscape: [
    '1502602898657-3e91760cbb34', // generic city
    '1480714378408-67cf0d13bc1b',
    '1444723121867-7a241cacace9',
  ],
  beach: ['1507525428034-b723cf961d3e', '1519046904884-53103b34b206', '1505228395891-9a51e7e86bf6'],
  mountains: [
    '1551524559-8af4e6624178',
    '1464822759023-fed622ff2c3b',
    '1486870591958-9b9d0d1dda99',
  ],
  countryside: [
    '1500382017468-9049fed747ef',
    '1418065460487-3d54b4bd0d1b',
    '1444930694458-01babe71870e',
  ],
};

/** FNV-1a 32-bit. Deterministic; same slug → same photo. */
function pickFromPool(category: PhotoCategory, slug: string): string {
  const pool = CATEGORY_POOL[category];
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return pool[hash % pool.length]!;
}

/**
 * Slice F1 - destination-aware imagery for search-opportunity cards.
 *
 * The category pool (cityscape/beach/mountains/etc.) shipped in E1
 * was generic - every "cityscape" stay shared from one ~6-photo pool.
 * For search opportunities, the user is looking at a specific
 * destination, so "Vancouver" should look like Vancouver, not just
 * "a city."
 *
 * Resolution order:
 *
 *   1. Exact destination match in the hand-curated table
 *      (`DESTINATION_PHOTOS`). ~80 high-recognition destinations.
 *   2. Country-level match (e.g. unknown Austrian town falls through
 *      to a canonical Austria photo).
 *   3. Category fallback by simple heuristic - known mountain
 *      regions → 'mountains', coastal regions → 'beach', cities →
 *      'cityscape', everything else → 'countryside'.
 *
 * Each level returns `{ url, alt, credit }` - same shape so the
 * caller never has to switch on which level matched.
 *
 * Hand-curated entries cite Unsplash photographer names per
 * Unsplash's attribution norms.
 */

export interface DestinationPhotoQuery {
  /** Free-text destination name (typically `intent.destinations[0].name`). */
  name: string;
  /** ISO-3166-1 alpha-2 country code. */
  country: string;
  /** Optional region/state hint. */
  region?: string;
}

export interface ResolvedDestinationPhoto {
  url: string;
  alt: string;
  credit: string;
}

const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';
const UNSPLASH_PARAMS = '?w=1600&q=80&fit=crop&auto=format';

/**
 * Resolve the best photo for a destination. Stable: same input →
 * same photo across renders.
 */
export function resolveDestinationPhoto(query: DestinationPhotoQuery): ResolvedDestinationPhoto {
  // (1) Exact name match (case-insensitive, normalized).
  const normalizedName = normalize(query.name);
  const exact = DESTINATION_PHOTOS[normalizedName];
  if (exact) {
    return {
      url: makeUnsplashUrl(exact.id),
      alt: exact.alt,
      credit: `Unsplash · ${exact.photographer}`,
    };
  }

  // (2) Country-level - useful for unknown cities in known countries.
  //     e.g. "Klosters, Austria" without an entry falls through to
  //     the canonical Austria photo (typically alpine).
  const country = `__country:${query.country.toUpperCase()}`;
  const countryHit = DESTINATION_PHOTOS[country];
  if (countryHit) {
    return {
      url: makeUnsplashUrl(countryHit.id),
      alt: countryHit.alt,
      credit: `Unsplash · ${countryHit.photographer}`,
    };
  }

  // (3) Category fallback via destination-name + country heuristics.
  const category = inferCategory(query);
  const id = pickFromPool(category, normalizedName);
  return {
    url: makeUnsplashUrl(id),
    alt: `${query.name} - ${category}`,
    credit: 'Unsplash',
  };
}

// ============== Helpers ==============

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeUnsplashUrl(id: string): string {
  return `${UNSPLASH_BASE}${id}${UNSPLASH_PARAMS}`;
}

const COASTAL_HINT =
  /\b(coast|beach|island|seaside|riviera|bay|bali|maldives|cabo|riviera|cancun|santorini|mykonos|ibiza|phuket|maui|oahu|kauai|hawaii)\b/i;
const MOUNTAIN_HINT =
  /\b(alps|mountain|ski|piste|sierra|andes|himalaya|patagonia|aspen|chamonix|whistler|zermatt|innsbruck|kitzbuhel|jackson hole|lake tahoe|banff|jasper|telluride)\b/i;
const URBAN_HINT =
  /\b(city|new york|tokyo|london|paris|berlin|seoul|hong kong|singapore|sydney|melbourne|dubai|toronto|boston|chicago|los angeles|san francisco|austin|miami|montreal|vancouver|mexico city|buenos aires|sao paulo|barcelona|madrid|rome|milan|amsterdam|copenhagen|stockholm|helsinki|prague|vienna|budapest|warsaw|istanbul|cairo|johannesburg|nairobi|mumbai|delhi|bangalore|bangkok|kuala lumpur|jakarta|manila|taipei|osaka|kyoto|busan|cape town|edinburgh|dublin|reykjavik|oslo)\b/i;

const KNOWN_MOUNTAINOUS_COUNTRIES = new Set([
  'CH',
  'AT',
  'NP',
  'BT',
  'GE', // Switzerland, Austria, Nepal, Bhutan, Georgia
]);
const KNOWN_COASTAL_COUNTRIES = new Set([
  'MV',
  'BS',
  'KY',
  'BB', // Maldives, Bahamas, Cayman, Barbados
]);

function inferCategory(query: DestinationPhotoQuery): PhotoCategory {
  const text = `${query.name} ${query.region ?? ''}`.toLowerCase();
  if (MOUNTAIN_HINT.test(text)) return 'mountains';
  if (COASTAL_HINT.test(text)) return 'beach';
  if (URBAN_HINT.test(text)) return 'cityscape';
  if (KNOWN_MOUNTAINOUS_COUNTRIES.has(query.country.toUpperCase())) return 'mountains';
  if (KNOWN_COASTAL_COUNTRIES.has(query.country.toUpperCase())) return 'beach';
  return 'countryside';
}
