/**
 * Shim — canonical city data lives in @adored/seo-data so every
 * brand shares one allowlist. Add cities THERE, not here.
 */
export type { SeoCity } from '@adored/seo-data';
export {
  SEO_CITIES,
  SEO_ITINERARY_DAYS,
  findCityBySlug,
  isValidItineraryDays,
  citiesByRegion,
} from '@adored/seo-data';
