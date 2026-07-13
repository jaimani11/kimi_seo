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

export type { ThingsToDoFaq, ThingsToDoFaqInput } from './things-to-do-faq';
export { buildThingsToDoFaq } from './things-to-do-faq';

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
  attractionsByCity,
  cityFor,
} from './attractions';

export type { CityClimate } from './climate-data';
export { CITY_CLIMATE, MONTH_LABELS, findClimate } from './climate-data';

export type {
  MonthSlug,
  ClimateMonth,
  MonthVerdict,
  RatedMonth,
  MonthCityRanking,
} from './climate-insights';
export {
  MONTH_SLUGS,
  MONTH_NAMES,
  monthIndexFromSlug,
  monthSlug,
  monthName,
  cToF,
  monthComfortScore,
  monthVerdict,
  rateMonths,
  bestMonthIndices,
  packingList,
  monthBlurb,
  rankCitiesForMonth,
} from './climate-insights';

export type { NeighborhoodPoi } from './poi-coords';
export { NEIGHBORHOOD_COORDS, findNeighborhoodPois } from './poi-coords';

export type { SeoComparison } from './comparisons';
export {
  findComparison,
  canonicalComparisonSlug,
  enumerateAllComparisonSlugs,
  comparisonsForCity,
} from './comparisons';
