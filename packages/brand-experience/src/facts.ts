import type { CityFacts } from './contracts';

/**
 * Structural input for `toCityFacts` — the app's already-loaded SeoCity +
 * DestinationGuide + climate + neighborhood POIs satisfy this shape without a
 * hard type dependency on @adored/seo-data, keeping the engine decoupled.
 */
export interface CityFactsInput {
  city: {
    slug: string;
    name: string;
    countryName: string;
    countryCode: string;
    region: string;
    coordinates: { lat: number; lng: number };
  };
  guide: {
    bestTimeToVisit: { months: string; blurb: string };
    budget: { budgetDailyUSD: number; midDailyUSD: number; luxuryDailyUSD: number; blurb: string };
    travelStyles: { family: string; couples: string; solo: string };
    food: ReadonlyArray<{ dish: string; note: string }>;
    transportation: { primary: string; tips: string };
    neighborhoods: ReadonlyArray<{ name: string; blurb: string }>;
    safety: string;
  };
  climate?: { tz: string } | null;
  neighborhoodPois?: ReadonlyArray<{ name: string; lat: number; lng: number }>;
}

/** Adapt raw app data into the brand-agnostic CityFacts model. */
export function toCityFacts(input: CityFactsInput): CityFacts {
  return {
    slug: input.city.slug,
    name: input.city.name,
    countryName: input.city.countryName,
    countryCode: input.city.countryCode,
    region: input.city.region,
    coordinates: input.city.coordinates,
    bestTime: input.guide.bestTimeToVisit,
    budget: input.guide.budget,
    travelStyles: input.guide.travelStyles,
    foods: input.guide.food,
    transportation: input.guide.transportation,
    neighborhoods: input.guide.neighborhoods,
    neighborhoodPois: input.neighborhoodPois ?? [],
    safety: input.guide.safety,
    ...(input.climate ? { climate: { tz: input.climate.tz } } : {}),
  };
}
