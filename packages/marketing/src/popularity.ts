import { SEO_CITIES, type SeoCity } from '@adored/seo-data';

/**
 * City popularity tiers for the marketing rotation.
 *
 * Tier 1 (weight 4): the global headliner destinations — these get
 * disproportionate share of the social calendar because they convert
 * better than long-tail cities. Tokyo/Paris/Rome are the canonical
 * "every travel feed in your network already mentions them" set.
 *
 * Tier 2 (weight 2): tourism-economy major cities. Strong organic
 * search volume but not the global top-10.
 *
 * Tier 3 (weight 1): the rest. Every SEO city in the allowlist gets
 * weight 1 by default so even the long-tail destinations eventually
 * cycle into the feed — just less often.
 *
 * Concrete rotation effect: in a 7-day window, a tier-1 city has ~4x
 * the chance of being picked vs. a tier-3 city. Over a year it
 * normalizes — tier-1 cities show up roughly 4× per month, tier-3
 * roughly once. The rotation is still deterministic by day+platform.
 */

const TIER_1_SLUGS = new Set<string>([
  // Global top tier (high-search-volume; everyone knows them).
  'tokyo',
  'paris',
  'rome',
  'london',
  'new-york',
  'barcelona',
  'amsterdam',
  'dubai',
  'bangkok',
  'bali',
  'santorini',
  'istanbul',
  'venice',
  'cappadocia',
  'reykjavik',
  'marrakech',
  'kyoto',
  'lisbon',
  'florence',
  'singapore',
  'maldives',
  'sydney',
  'hong-kong',
  'agra',
  'seoul',
]);

const TIER_2_SLUGS = new Set<string>([
  // Strong tourism cities; one rung below the global headliners.
  'osaka',
  'madrid',
  'berlin',
  'prague',
  'vienna',
  'budapest',
  'dublin',
  'edinburgh',
  'copenhagen',
  'stockholm',
  'milan',
  'naples',
  'athens',
  'mykonos',
  'porto',
  'granada',
  'seville',
  'bruges',
  'salzburg',
  'cinque-terre',
  'lake-como',
  'los-angeles',
  'miami',
  'san-francisco',
  'chicago',
  'las-vegas',
  'new-orleans',
  'boston',
  'washington-dc',
  'honolulu',
  'maui',
  'mexico-city',
  'cancun',
  'tulum',
  'rio-de-janeiro',
  'buenos-aires',
  'cusco',
  'cape-town',
  'cairo',
  'petra',
  'tel-aviv',
  'abu-dhabi',
  'doha',
  'phuket',
  'chiang-mai',
  'kuala-lumpur',
  'hanoi',
  'ho-chi-minh-city',
  'beijing',
  'shanghai',
  'taipei',
  'siem-reap',
  'krabi',
  'jaipur',
  'delhi',
  'mumbai',
  'goa',
  'melbourne',
  'auckland',
  'queenstown',
  'zurich',
  'lucerne',
  'bergen',
  'helsinki',
  'oaxaca',
  'medellin',
  'cartagena',
  'split',
  'dubrovnik',
  'krakow',
  'nice',
  'bordeaux',
  'lyon',
  'marseille',
  'sorrento',
  'bologna',
  'mallorca',
  'ibiza',
  'valencia',
  'hiroshima',
  'sapporo',
]);

export type PopularityTier = 1 | 2 | 3;

const TIER_WEIGHTS: Record<PopularityTier, number> = {
  1: 4,
  2: 2,
  3: 1,
};

export function tierOf(citySlug: string): PopularityTier {
  if (TIER_1_SLUGS.has(citySlug)) return 1;
  if (TIER_2_SLUGS.has(citySlug)) return 2;
  return 3;
}

export function weightOf(citySlug: string): number {
  return TIER_WEIGHTS[tierOf(citySlug)];
}

/**
 * Build the weighted city pool — each city repeats `weight` times so
 * the downstream shuffle gives popular cities more entries. Caller
 * dedups during selection to ensure no duplicate slugs in the final
 * pick.
 */
export function buildWeightedCityPool(): SeoCity[] {
  const pool: SeoCity[] = [];
  for (const city of SEO_CITIES) {
    const weight = weightOf(city.slug);
    for (let i = 0; i < weight; i++) pool.push(city);
  }
  return pool;
}
