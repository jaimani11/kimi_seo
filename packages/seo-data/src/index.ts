/**
 * @adored/seo-data — the single source of truth for destination data
 * across every brand.
 *
 * Add a city ONCE here (cities.ts + optionally destination-content.ts
 * + destination-scores.ts) and all four sites pick it up on their
 * next build: themed SEO routes, destination guides, quiz matches,
 * sitemap entries.
 *
 * Canonical source at extraction time: apps/numiworks (it carried the
 * superset — gotript/gobookt/stayviaowner gain the ~20 rich guides
 * they were missing from Phases 8-9).
 */

export type { SeoCity } from './cities';
export {
  SEO_CITIES,
  SEO_ITINERARY_DAYS,
  findCityBySlug,
  isValidItineraryDays,
  citiesByRegion,
} from './cities';

export type { DestinationGuide } from './destination-content';
export {
  DESTINATION_GUIDES,
  hasDestinationGuide,
  findDestinationGuide,
} from './destination-content';

export type { DestinationScores } from './destination-scores';
export {
  SCORE_DIMENSIONS,
  DESTINATION_SCORES,
  findScores,
  hasScores,
  citiesWithScores,
} from './destination-scores';

export type { Attraction } from './attractions';
export {
  ATTRACTIONS,
  findAttractionBySlug,
  allAttractions,
  cityFor,
} from './attractions';

export type { SeoComparison } from './comparisons';
export {
  findComparison,
  canonicalComparisonSlug,
  enumerateAllComparisonSlugs,
  comparisonsForCity,
} from './comparisons';
