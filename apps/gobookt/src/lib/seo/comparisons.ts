import { findCityBySlug, type SeoCity } from './cities';

/**
 * Curated city-vs-city comparison pairs.
 *
 * Phase 7 adds programmatic `/{a}-vs-{b}` pages. Unlike the per-city
 * fan-out (which can scale to the full SEO_CITIES allowlist without
 * thinning out, because each surface is anchored to bookable
 * inventory), comparison pages only make sense for pairs people
 * actually compare. Two cities in the same region usually do; two
 * cities on opposite continents almost never do — and Google
 * penalizes pages that are obviously generated for SEO without
 * matching real search intent.
 *
 * So the pair list is a curated allowlist, NOT a cartesian product.
 *
 * Canonical ordering: pairs are stored as the alphabetical tuple
 * `[a.slug, b.slug]` so the URL `/tokyo-vs-kyoto` and the URL
 * `/kyoto-vs-tokyo` resolve to the same canonical page (we 301 the
 * non-canonical to the canonical at the route level — see
 * canonicalComparisonSlug).
 */

const RAW_PAIRS: ReadonlyArray<readonly [string, string]> = [
  // Japan
  ['kyoto', 'tokyo'],
  ['osaka', 'tokyo'],
  ['kyoto', 'osaka'],
  // Italy
  ['florence', 'rome'],
  ['rome', 'venice'],
  ['florence', 'venice'],
  ['florence', 'milan'],
  ['milan', 'rome'],
  ['naples', 'rome'],
  // Iberia
  ['barcelona', 'madrid'],
  ['barcelona', 'lisbon'],
  // British Isles
  ['edinburgh', 'london'],
  ['dublin', 'edinburgh'],
  // Northern Europe
  ['amsterdam', 'copenhagen'],
  ['copenhagen', 'stockholm'],
  // Eastern + Central Europe
  ['budapest', 'prague'],
  ['krakow', 'prague'],
  ['budapest', 'vienna'],
  ['berlin', 'munich'],
  ['berlin', 'prague'],
  // Greece / Eastern Med
  ['athens', 'santorini'],
  // Levant / MENA
  ['abu-dhabi', 'dubai'],
  // South-East Asia
  ['bangkok', 'singapore'],
  ['bangkok', 'chiang-mai'],
  ['bali', 'phuket'],
  ['hanoi', 'ho-chi-minh-city'],
  ['hong-kong', 'singapore'],
  ['seoul', 'tokyo'],
  // US
  ['los-angeles', 'new-york'],
  ['las-vegas', 'miami'],
  ['miami', 'new-orleans'],
  ['chicago', 'new-york'],
  ['san-francisco', 'new-york'],
  // Mexico
  ['cancun', 'tulum'],
  ['cancun', 'mexico-city'],
  // South America
  ['buenos-aires', 'rio-de-janeiro'],
  // Africa
  ['cape-town', 'marrakech'],
  // Oceania
  ['melbourne', 'sydney'],
  ['auckland', 'queenstown'],
];

/**
 * Normalize a slug pair to its canonical, alphabetical ordering.
 * Used both when parsing an incoming URL and when emitting the
 * sitemap / internal links.
 */
function canonicalize(a: string, b: string): readonly [string, string] {
  return a < b ? [a, b] : [b, a];
}

const CANONICAL_PAIRS: ReadonlySet<string> = new Set(
  RAW_PAIRS.map(([a, b]) => {
    const [x, y] = canonicalize(a, b);
    return `${x}|${y}`;
  }),
);

export interface SeoComparison {
  /** Alphabetically-first city. */
  a: SeoCity;
  /** Alphabetically-second city. */
  b: SeoCity;
}

/**
 * Look up a comparison from a raw (potentially reversed) slug pair.
 * Returns null if the pair isn't on the allowlist, or if either slug
 * isn't a known SEO city.
 *
 * Caller is responsible for redirecting from non-canonical ordering
 * to canonical (e.g. `/tokyo-vs-kyoto` → `/kyoto-vs-tokyo`) when
 * desired; this function just resolves the pair without caring which
 * direction the URL came in.
 */
export function findComparison(slugA: string, slugB: string): SeoComparison | null {
  if (slugA === slugB) return null;
  const [x, y] = canonicalize(slugA, slugB);
  if (!CANONICAL_PAIRS.has(`${x}|${y}`)) return null;
  const a = findCityBySlug(x);
  const b = findCityBySlug(y);
  if (!a || !b) return null;
  return { a, b };
}

/**
 * Build the canonical URL slug for a comparison pair. Always emits
 * the alphabetical order so internal links don't drift between
 * representations.
 */
export function canonicalComparisonSlug(a: string, b: string): string {
  const [x, y] = canonicalize(a, b);
  return `${x}-vs-${y}`;
}

/**
 * Enumerate every comparison slug. Used by both `generateStaticParams`
 * and the sitemap so every page is statically generated + crawled.
 */
export function enumerateAllComparisonSlugs(): string[] {
  return Array.from(CANONICAL_PAIRS).map((key) => {
    const [x, y] = key.split('|');
    return `${x}-vs-${y}`;
  });
}

/**
 * For a given city, list every other city it's compared against on
 * the curated allowlist. Used by the per-city SEO link rail so each
 * city page can deep-link to all of its comparison pages.
 */
export function comparisonsForCity(citySlug: string): SeoComparison[] {
  const out: SeoComparison[] = [];
  for (const key of CANONICAL_PAIRS) {
    const [x, y] = key.split('|') as [string, string];
    if (x !== citySlug && y !== citySlug) continue;
    const comp = findComparison(x, y);
    if (comp) out.push(comp);
  }
  return out;
}
