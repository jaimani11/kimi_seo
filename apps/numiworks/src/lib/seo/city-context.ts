import type { SeoCity } from '@lib/seo/cities';
import {
  findDestinationGuide,
  findClimate,
  type DestinationGuide,
  type CityClimate,
} from '@adored/seo-data';

/**
 * City-specific contextual prose for the programmatic long-tail
 * (themed-list + occasion pages).
 *
 * These templates were ~92–96% token-swap-identical city-to-city — the only
 * per-city prose was `city.oneLiner`, so Google's quality heuristic shelved
 * them as thin/doorway pages ("crawled – currently not indexed"). This helper
 * harvests the RICH data numiworks already stores and returns genuinely
 * city-specific sentences + neighborhood names + FAQs, so the non-inventory
 * text diverges hard between, say, Tokyo (Shibuya/Asakusa/Roppongi) and Paris
 * (Le Marais/Montmartre/…).
 *
 * Three coverage tiers, all null-safe:
 *   T1  DestinationGuide present (~161/215) — neighborhoods + angle-matched
 *       travel-style/food + transport tip. Highest fidelity.
 *   T2  Climate only — real per-city seasonal temperature/rain facts.
 *   T3  Baseline SeoCity — a region-anchored line (still city-named).
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
function monthName(i: number): string {
  return MONTHS[i] ?? '';
}

const REGION_LABEL: Record<SeoCity['region'], string> = {
  asia: 'Asia',
  europe: 'Europe',
  americas: 'the Americas',
  mena: 'the Middle East & North Africa',
  oceania: 'Oceania',
  africa: 'Africa',
};

export interface CityContext {
  /** 1–3 city-specific sentences (already city-named). */
  sentences: string[];
  /** Up to 3 neighborhood names — for prose AND theme-relevant deep links.
   *  Empty when the city has no guide. */
  neighborhoods: string[];
  /** Up to 3 neighborhoods with their blurbs — a renderable "where to base"
   *  list of fully city-specific prose. Empty when the city has no guide. */
  areas: ReadonlyArray<{ name: string; blurb: string }>;
  /** 1–2 city-derived FAQ entries (feed straight into FAQPage JSON-LD). */
  faqs: { q: string; a: string }[];
  /** Which fidelity tier fired — asserted in the regression test. */
  tier: 1 | 2 | 3;
}

/** Angle → the DestinationGuide travel-style that best matches it. */
function travelStyleFor(angle: string, guide: DestinationGuide): string | null {
  const a = angle.toLowerCase();
  if (/honeymoon|romantic|couples|girls|bachelorette|bachelor|anniversary/.test(a)) {
    return guide.travelStyles.couples;
  }
  if (/family|kids|teens|milestone/.test(a)) return guide.travelStyles.family;
  if (/solo/.test(a)) return guide.travelStyles.solo;
  return null;
}

function neighborhoodList(names: string[]): string {
  if (names.length >= 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return names[0] ?? '';
}

/** One fully city-specific sentence from real climate normals (temps differ
 *  per city, so this is a strong dedup break). Null if data is unusable. */
function climateLine(city: SeoCity, climate: CityClimate): string | null {
  if (climate.months.length !== 12) return null;
  let peakI = 0;
  let lowI = 0;
  for (let i = 1; i < 12; i++) {
    const h = climate.months[i]?.[0];
    if (h === undefined) continue;
    if (h > (climate.months[peakI]?.[0] ?? -Infinity)) peakI = i;
    if (h < (climate.months[lowI]?.[0] ?? Infinity)) lowI = i;
  }
  const pk = climate.months[peakI];
  const lo = climate.months[lowI];
  if (!pk || !lo) return null;
  return `Weather-wise, ${city.name} peaks around ${monthName(peakI)} (highs near ${pk[0]}°C) and is coolest in ${monthName(lowI)} (about ${lo[0]}°C) — line the outdoor experiences up for the milder, drier weeks.`;
}

/**
 * Build city-specific context for a themed/occasion page. `angle` is the theme
 * key or occasion name/vibe; it steers which guide fields get surfaced.
 */
export function buildCityContext(city: SeoCity, angle: string): CityContext {
  const guide = findDestinationGuide(city.slug);
  const climate = findClimate(city.slug);
  const sentences: string[] = [];
  const faqs: { q: string; a: string }[] = [];

  // ── Tier 1: rich guide ────────────────────────────────────────────────
  if (guide) {
    const hoods = guide.neighborhoods.slice(0, 3);
    const neighborhoods = hoods.map((n) => n.name);
    const lead = hoods[0];
    if (neighborhoods.length >= 2) {
      sentences.push(
        `In ${city.name}, base yourself around ${neighborhoodList(neighborhoods)} — the areas that anchor most trips.`,
      );
      // The lead-neighborhood blurb is fully city-specific — a strong dedup break.
      if (lead) sentences.push(`${lead.name}: ${lead.blurb}`);
    }

    const style = travelStyleFor(angle, guide);
    if (style) sentences.push(style);
    if (/food|culinary|foodie/.test(angle.toLowerCase()) && guide.food.length > 0) {
      sentences.push(
        `Save room for ${guide.food.slice(0, 3).map((f) => f.dish).join(', ')} — ${city.name} specialties worth planning a food tour around.`,
      );
    }
    if (guide.bestTimeToVisit.blurb) sentences.push(guide.bestTimeToVisit.blurb);
    if (guide.transportation.tips) sentences.push(guide.transportation.tips);
    const climLine = climate ? climateLine(city, climate) : null;
    if (climLine) sentences.push(climLine);

    if (lead) {
      faqs.push({
        q: `Which area of ${city.name} should we stay in?`,
        a: `${lead.name} — ${lead.blurb}`,
      });
    }
    faqs.push({
      q: `When's the best time to visit ${city.name}?`,
      a: `${guide.bestTimeToVisit.months}. ${guide.bestTimeToVisit.blurb}`,
    });

    return { sentences: sentences.slice(0, 5), neighborhoods, areas: hoods, faqs, tier: 1 };
  }

  // ── Tier 2: climate-informed seasonal fallback ────────────────────────
  if (climate && climate.months.length === 12) {
    let peakI = 0;
    let lowI = 0;
    for (let i = 1; i < 12; i++) {
      const h = climate.months[i]?.[0];
      if (h === undefined) continue;
      if (h > (climate.months[peakI]?.[0] ?? -Infinity)) peakI = i;
      if (h < (climate.months[lowI]?.[0] ?? Infinity)) lowI = i;
    }
    const pk = climate.months[peakI];
    const lo = climate.months[lowI];
    if (pk && lo) {
      const avgRain = Math.round(
        climate.months.reduce((s, m) => s + (m[2] ?? 0), 0) / climate.months.length,
      );
      sentences.push(
        `${city.name} is warmest around ${monthName(peakI)} (highs near ${pk[0]}°C) and coolest in ${monthName(lowI)} (about ${lo[0]}°C) — line the outdoor experiences up for the milder, drier weeks.`,
      );
      faqs.push({
        q: `What's the weather like in ${city.name}?`,
        a: `Daytime highs run from about ${lo[0]}°C in ${monthName(lowI)} to ${pk[0]}°C in ${monthName(peakI)}, with roughly ${avgRain} rainy days in an average month.`,
      });
      return { sentences, neighborhoods: [], areas: [], faqs, tier: 2 };
    }
  }

  // ── Tier 3: baseline region anchor ────────────────────────────────────
  sentences.push(
    `A ${REGION_LABEL[city.region]} destination worth planning ahead for, ${city.name} rewards travelers who book the standout experiences early and leave room to wander.`,
  );
  return { sentences, neighborhoods: [], areas: [], faqs, tier: 3 };
}
