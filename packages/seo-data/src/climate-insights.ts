import { SEO_CITIES, type SeoCity } from './cities';
import { CITY_CLIMATE, type CityClimate } from './climate-data';

/**
 * Climate-derived editorial logic — powers the "best time to visit",
 * "{city} weather in {month}", and "where to go in {month}" SEO
 * surfaces. Everything here is DETERMINISTIC math over the baked
 * ERA5 normals in climate-data.ts: same inputs, same verdicts, so
 * pages are stable between builds and consistent across brands.
 *
 * The comfort model is deliberately simple and explainable:
 *   temperature — daily highs of 18-28°C score full marks, with an
 *     asymmetric falloff (heat is punished harder than cool, because
 *     38°C ruins a trip faster than 8°C)
 *   rain        — each rain day costs 4.5 points of the rain score
 * blended 65/35. It ranks Tokyo-in-October above Tokyo-in-July and
 * Dubai-in-January above Dubai-in-August, which is the sniff test.
 */

export const MONTH_SLUGS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export type MonthSlug = (typeof MONTH_SLUGS)[number];

/** [avgHighC, avgLowC, rainDays, precipMm] — matches CityClimate.months rows. */
export type ClimateMonth = readonly [number, number, number, number];

export function monthIndexFromSlug(slug: string): number | null {
  const i = (MONTH_SLUGS as readonly string[]).indexOf(slug);
  return i >= 0 ? i : null;
}

export function monthSlug(index: number): string {
  return MONTH_SLUGS[index] ?? 'january';
}

export function monthName(index: number): string {
  return MONTH_NAMES[index] ?? 'January';
}

export const cToF = (c: number): number => Math.round((c * 9) / 5 + 32);

/** 0-100 comfort score for one month of climate normals. */
export function monthComfortScore(m: ClimateMonth): number {
  const hi = m[0];
  const rainDays = m[2];
  let temp: number;
  if (hi >= 18 && hi <= 28) temp = 100;
  else if (hi < 18) temp = Math.max(0, 100 - (18 - hi) * 5);
  else temp = Math.max(0, 100 - (hi - 28) * 7);
  const rain = Math.max(0, 100 - rainDays * 4.5);
  return Math.round(temp * 0.65 + rain * 0.35);
}

export type MonthVerdict = 'excellent' | 'good' | 'fair' | 'challenging';

export function monthVerdict(score: number): MonthVerdict {
  if (score >= 80) return 'excellent';
  if (score >= 62) return 'good';
  if (score >= 45) return 'fair';
  return 'challenging';
}

export interface RatedMonth {
  index: number;
  month: ClimateMonth;
  score: number;
  verdict: MonthVerdict;
}

/** All 12 months rated, in calendar order. */
export function rateMonths(climate: CityClimate): RatedMonth[] {
  return climate.months.map((m, index) => {
    const score = monthComfortScore(m);
    return { index, month: m, score, verdict: monthVerdict(score) };
  });
}

/** Month indices sorted best-first (ties break toward drier). */
export function bestMonthIndices(climate: CityClimate): number[] {
  return rateMonths(climate)
    .slice()
    .sort((a, b) => b.score - a.score || a.month[2] - b.month[2])
    .map((r) => r.index);
}

/**
 * Deterministic packing guidance from temperature + rain bands.
 * Bands, not randomness — the same month always packs the same bag.
 */
export function packingList(m: ClimateMonth): string[] {
  const [hi, lo, rainDays, precipMm] = m;
  const out: string[] = [];
  if (hi >= 30) out.push('Light, breathable clothing — linen and technical fabrics earn their keep');
  else if (hi >= 22) out.push('Summer clothes, plus one light layer for air-con and evenings');
  else if (hi >= 12) out.push('Layers — t-shirts under a light jacket or sweater');
  else if (hi >= 5) out.push('A proper warm jacket, and a hat for mornings');
  else out.push('Full winter kit — insulated coat, gloves, warm hat');
  if (hi >= 27) out.push('High-SPF sunscreen, sunglasses, and a refillable water bottle');
  if (lo <= 8 && hi >= 16) out.push('Evenings turn genuinely cool — pack a warm layer for after dark');
  if (rainDays >= 12) out.push(`Rain gear is non-negotiable — expect rain on roughly ${rainDays} days`);
  else if (rainDays >= 7) out.push('A packable rain shell or compact umbrella earns its space');
  if (precipMm >= 250) out.push('Quick-dry shoes — downpours are short but heavy');
  out.push('Comfortable walking shoes — every guide on this site assumes you\'ll use them');
  return out;
}

/**
 * 2-3 sentence editorial verdict for one city-month, assembled from
 * data bands. Sentences interpolate the actual numbers so every page
 * reads specific, not templated-vague.
 */
export function monthBlurb(cityName: string, monthIndex: number, m: ClimateMonth): string {
  const [hi, lo, rainDays] = m;
  const name = monthName(monthIndex);
  const score = monthComfortScore(m);
  const verdict = monthVerdict(score);

  let temperature: string;
  if (hi >= 33) temperature = `${name} is seriously hot in ${cityName} — days average ${hi}°C (${cToF(hi)}°F), so plan mornings out and afternoons in the shade or the water`;
  else if (hi >= 27) temperature = `${name} runs warm in ${cityName}, with daily highs around ${hi}°C (${cToF(hi)}°F) and nights near ${lo}°C (${cToF(lo)}°F)`;
  else if (hi >= 18) temperature = `${name} hits the sweet spot in ${cityName} — highs around ${hi}°C (${cToF(hi)}°F), ideal for a full day on foot`;
  else if (hi >= 10) temperature = `${name} is mild-to-cool in ${cityName}, topping out near ${hi}°C (${cToF(hi)}°F) — comfortable with a layer on`;
  else if (hi >= 2) temperature = `${name} is properly cold in ${cityName}, with highs of only ${hi}°C (${cToF(hi)}°F)`;
  else temperature = `${name} is deep-winter territory in ${cityName} — daily highs around ${hi}°C (${cToF(hi)}°F) and lows near ${lo}°C (${cToF(lo)}°F)`;

  let rain: string;
  if (rainDays >= 15) rain = `It's also the wet side of the calendar: rain falls on about ${rainDays} days, so build flexibility into plans.`;
  else if (rainDays >= 9) rain = `Expect showers on roughly ${rainDays} days of the month — rarely trip-ruining, worth planning around.`;
  else if (rainDays >= 4) rain = `Rain is occasional — about ${rainDays} wet days in a typical year.`;
  else rain = `Rain is a non-issue, with only ~${rainDays} wet day${rainDays === 1 ? '' : 's'} in an average year.`;

  const verdictLine =
    verdict === 'excellent'
      ? `Overall, ${name} is one of the best months of the year to be in ${cityName}.`
      : verdict === 'good'
        ? `Overall, ${name} is a solid month to visit ${cityName}.`
        : verdict === 'fair'
          ? `${name} is workable in ${cityName} if your dates are fixed — just plan around the conditions.`
          : `If your dates are flexible, most travelers will have a better time in ${cityName} outside ${name}.`;

  return `${temperature}. ${rain} ${verdictLine}`;
}

export interface MonthCityRanking {
  city: SeoCity;
  month: ClimateMonth;
  score: number;
  verdict: MonthVerdict;
}

/**
 * Every city with climate data, ranked best-first for one calendar
 * month — the engine behind /where-to-go-in-{month}.
 */
export function rankCitiesForMonth(monthIndex: number): MonthCityRanking[] {
  const out: MonthCityRanking[] = [];
  for (const city of SEO_CITIES) {
    const climate = CITY_CLIMATE[city.slug];
    const m = climate?.months[monthIndex];
    if (!m) continue;
    const score = monthComfortScore(m);
    out.push({ city, month: m, score, verdict: monthVerdict(score) });
  }
  return out.sort((a, b) => b.score - a.score || a.month[2] - b.month[2]);
}
