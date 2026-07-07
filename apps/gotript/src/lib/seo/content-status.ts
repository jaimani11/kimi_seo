import { SEO_CITIES, SEO_ITINERARY_DAYS, type SeoCity } from './cities';
import { hasDestinationGuide } from './destination-content';

/**
 * Per-city snapshot of what content surfaces are populated. Used by
 * the /admin/content dashboard to show coverage at a glance + drive
 * the bulk-regeneration UI.
 *
 * Pure data — no IO, no external state. Always cheap to compute, so
 * the dashboard renders deterministically on each request.
 */

/** Cities with a hand-curated social sample pack. Single source of
 *  truth — kept in sync with the registry in
 *  `src/lib/social/generator.ts:findSampleFor`. */
export const CITIES_WITH_SOCIAL_SAMPLE: ReadonlySet<string> = new Set(['tokyo']);

export interface CityContentStatus {
  city: SeoCity;
  hasGuide: boolean;
  hasSocialSample: boolean;
  itineraryCount: number;
  themedListCount: number;
  totalSeoUrls: number;
}

export function cityContentStatus(city: SeoCity): CityContentStatus {
  return {
    city,
    hasGuide: hasDestinationGuide(city.slug),
    hasSocialSample: CITIES_WITH_SOCIAL_SAMPLE.has(city.slug),
    itineraryCount: SEO_ITINERARY_DAYS.length,
    themedListCount: 3,
    // 1 things-to-do + 3 themed + 1 weekend + N itineraries
    totalSeoUrls: 1 + 3 + 1 + SEO_ITINERARY_DAYS.length,
  };
}

export interface ContentSummary {
  totalCities: number;
  citiesWithGuide: number;
  citiesWithSample: number;
  totalSeoUrls: number;
  totalSocialItems: number;
}

export function contentSummary(): ContentSummary {
  const totalCities = SEO_CITIES.length;
  let citiesWithGuide = 0;
  let citiesWithSample = 0;
  let totalSeoUrls = 0;
  for (const c of SEO_CITIES) {
    const s = cityContentStatus(c);
    if (s.hasGuide) citiesWithGuide += 1;
    if (s.hasSocialSample) citiesWithSample += 1;
    totalSeoUrls += s.totalSeoUrls;
  }
  return {
    totalCities,
    citiesWithGuide,
    citiesWithSample,
    totalSeoUrls,
    // Each city ships 40 social items (10 × 4 platforms), per Sprint 14.
    totalSocialItems: totalCities * 40,
  };
}
