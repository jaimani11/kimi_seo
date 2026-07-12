import {
  findCityBySlug,
  isValidItineraryDays,
  SEO_CITIES,
  SEO_ITINERARY_DAYS,
  type SeoCity,
  enumerateAllComparisonSlugs,
  findComparison,
  type SeoComparison,
  findClimate,
  findDestinationGuide,
  MONTH_SLUGS,
  monthIndexFromSlug,
} from '@adored/seo-data';

/**
 * Parse a top-level slug into a structured programmatic-SEO page
 * descriptor. Returns null for unrecognized slugs — the page route
 * then 404s rather than rendering a thin generic page (which is the
 * shape Google penalizes hardest).
 *
 * Slug shapes recognized:
 *
 *   /{city}-{n}-day-itinerary               itinerary, n days
 *   /things-to-do-in-{city}                 catalog of activities
 *   /best-family-activities-in-{city}       themed: family
 *   /best-food-tours-in-{city}              themed: food
 *   /day-trips-from-{city}                  themed: day trips
 *   /weekend-in-{city}                      2-day itinerary alias
 *
 * `n` is constrained to the SEO_ITINERARY_DAYS allowlist; `{city}`
 * must exist in SEO_CITIES.
 */
export type ThemedListTheme =
  | 'family'
  | 'food'
  | 'day-trips'
  | 'honeymoon'
  | 'solo-travel'
  | 'girls-trip'
  | 'rainy-day'
  | 'night'
  | 'spring'
  | 'summer'
  | 'fall'
  | 'winter'
  | 'with-kids'
  | 'with-teens'
  | 'airport-guide'
  | 'budget-per-day'
  | 'bachelor-party'
  | 'bachelorette-party'
  | 'first-timer'
  | 'worth-visiting'
  | 'hidden-gems'
  | 'instagram'
  | 'luxury'
  | 'how-many-days'
  | 'solo-female'
  | 'bucket-list'
  | 'private-tours'
  | 'walking-tours';

export type SeoRouteMatch =
  | { kind: 'itinerary'; city: SeoCity; days: number }
  | { kind: 'things-to-do'; city: SeoCity }
  | { kind: 'themed-list'; city: SeoCity; theme: ThemedListTheme }
  | { kind: 'weekend'; city: SeoCity }
  | { kind: 'comparison'; comparison: SeoComparison }
  | { kind: 'best-time'; city: SeoCity }
  | { kind: 'weather-month'; city: SeoCity; monthIndex: number }
  | { kind: 'where-to-stay'; city: SeoCity }
  | { kind: 'where-to-go-month'; monthIndex: number };

const ITINERARY_RE = /^([a-z][a-z0-9-]*)-(\d+)-day-itinerary$/;
const THINGS_TO_DO_RE = /^things-to-do-in-([a-z][a-z0-9-]*)$/;
const FAMILY_RE = /^best-family-activities-in-([a-z][a-z0-9-]*)$/;
const FOOD_RE = /^best-food-tours-in-([a-z][a-z0-9-]*)$/;
const DAY_TRIPS_RE = /^day-trips-from-([a-z][a-z0-9-]*)$/;
const HONEYMOON_RE = /^honeymoon-in-([a-z][a-z0-9-]*)$/;
const SOLO_TRAVEL_RE = /^solo-travel-in-([a-z][a-z0-9-]*)$/;
const GIRLS_TRIP_RE = /^girls-trip-in-([a-z][a-z0-9-]*)$/;
const RAINY_DAY_RE = /^rainy-day-in-([a-z][a-z0-9-]*)$/;
const NIGHT_RE = /^night-in-([a-z][a-z0-9-]*)$/;
const SPRING_RE = /^spring-in-([a-z][a-z0-9-]*)$/;
const SUMMER_RE = /^summer-in-([a-z][a-z0-9-]*)$/;
const FALL_RE = /^fall-in-([a-z][a-z0-9-]*)$/;
const WINTER_RE = /^winter-in-([a-z][a-z0-9-]*)$/;
// Suffix-shaped patterns (city goes first in the URL).
const WITH_KIDS_RE = /^([a-z][a-z0-9-]*)-with-kids$/;
const WITH_TEENS_RE = /^([a-z][a-z0-9-]*)-with-teens$/;
const AIRPORT_GUIDE_RE = /^([a-z][a-z0-9-]*)-airport-guide$/;
const BUDGET_PER_DAY_RE = /^([a-z][a-z0-9-]*)-budget-per-day$/;
// Prefix-shaped occasion patterns.
const BACHELOR_PARTY_RE = /^bachelor-party-in-([a-z][a-z0-9-]*)$/;
const BACHELORETTE_PARTY_RE = /^bachelorette-party-in-([a-z][a-z0-9-]*)$/;
const WEEKEND_RE = /^weekend-in-([a-z][a-z0-9-]*)$/;
const COMPARISON_RE = /^([a-z][a-z0-9-]*)-vs-([a-z][a-z0-9-]*)$/;
// Climate-powered surfaces (Phase A data). Month alternation keeps the
// weather shape unambiguous against every other suffix pattern.
const MONTH_ALT = MONTH_SLUGS.join('|');
const BEST_TIME_RE = /^best-time-to-visit-([a-z][a-z0-9-]*)$/;
const WHERE_TO_STAY_RE = /^where-to-stay-in-([a-z][a-z0-9-]*)$/;
const WEATHER_MONTH_RE = new RegExp(`^([a-z][a-z0-9-]*)-weather-in-(${MONTH_ALT})$`);
const WHERE_TO_GO_RE = new RegExp(`^where-to-go-in-(${MONTH_ALT})$`);

/** Guide neighborhoods make a where-to-stay page; require enough to rank. */
function whereToStayEligible(citySlug: string): boolean {
  return (findDestinationGuide(citySlug)?.neighborhoods.length ?? 0) >= 3;
}

/**
 * Phase 11 themed page types — data-driven so the parser stays lean.
 * Each fans out to one page per city; the regexes are distinctive so
 * they never collide with the hardcoded patterns above. `build` is the
 * inverse of `re` (used by enumerate + internal links).
 */
const EXTRA_THEMED: ReadonlyArray<{
  theme: ThemedListTheme;
  re: RegExp;
  build: (citySlug: string) => string;
  label: (city: SeoCity) => string;
}> = [
  { theme: 'first-timer', re: /^first-time-in-([a-z][a-z0-9-]*)$/, build: (s) => `first-time-in-${s}`, label: (c) => `First time in ${c.name}` },
  { theme: 'worth-visiting', re: /^is-([a-z][a-z0-9-]*)-worth-visiting$/, build: (s) => `is-${s}-worth-visiting`, label: (c) => `Is ${c.name} worth visiting?` },
  { theme: 'hidden-gems', re: /^hidden-gems-in-([a-z][a-z0-9-]*)$/, build: (s) => `hidden-gems-in-${s}`, label: (c) => `Hidden gems in ${c.name}` },
  { theme: 'instagram', re: /^most-instagrammable-places-in-([a-z][a-z0-9-]*)$/, build: (s) => `most-instagrammable-places-in-${s}`, label: (c) => `Most instagrammable places in ${c.name}` },
  { theme: 'luxury', re: /^luxury-travel-in-([a-z][a-z0-9-]*)$/, build: (s) => `luxury-travel-in-${s}`, label: (c) => `Luxury travel in ${c.name}` },
  { theme: 'how-many-days', re: /^how-many-days-in-([a-z][a-z0-9-]*)$/, build: (s) => `how-many-days-in-${s}`, label: (c) => `How many days in ${c.name}?` },
  { theme: 'solo-female', re: /^([a-z][a-z0-9-]*)-for-solo-female-travelers$/, build: (s) => `${s}-for-solo-female-travelers`, label: (c) => `${c.name} for solo female travelers` },
  { theme: 'bucket-list', re: /^([a-z][a-z0-9-]*)-bucket-list$/, build: (s) => `${s}-bucket-list`, label: (c) => `${c.name} bucket list` },
  { theme: 'private-tours', re: /^private-tours-in-([a-z][a-z0-9-]*)$/, build: (s) => `private-tours-in-${s}`, label: (c) => `Private tours in ${c.name}` },
  { theme: 'walking-tours', re: /^walking-tours-in-([a-z][a-z0-9-]*)$/, build: (s) => `walking-tours-in-${s}`, label: (c) => `Walking tours in ${c.name}` },
];

export function parseSeoSlug(slug: string): SeoRouteMatch | null {
  if (typeof slug !== 'string' || slug.length === 0 || slug.length > 80) {
    return null;
  }

  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  // Phase 11 themed types — distinctive shapes, safe to check first.
  for (const t of EXTRA_THEMED) {
    const m = t.re.exec(slug);
    if (m) {
      const city = findCityBySlug(m[1] ?? '');
      if (!city) return null;
      return { kind: 'themed-list', city, theme: t.theme };
    }
  }

  // Order matters: more-specific patterns first so a `weekend-in-tokyo`
  // doesn't accidentally match a more generic `*-day-itinerary` shape
  // in the future. The comparison shape (`a-vs-b`) is also distinctive
  // enough that it can't collide with the other patterns, but we run
  // it first to keep "specific before generic" as the rule.
  const comparison = COMPARISON_RE.exec(slug);
  if (comparison) {
    const left = comparison[1] ?? '';
    const right = comparison[2] ?? '';
    const pair = findComparison(left, right);
    if (pair) return { kind: 'comparison', comparison: pair };
    // Regex matched the shape but the pair isn't on the allowlist —
    // fall through to the other patterns. In practice nothing else
    // matches a `*-vs-*` slug, so this almost always returns null
    // overall, but the fall-through keeps the parser permissive in
    // case a future slug shape ever overlaps.
  }

  // Climate surfaces — prefix/suffix shapes are distinct from every
  // legacy pattern, but run them early to keep "specific first".
  const whereToGo = WHERE_TO_GO_RE.exec(slug);
  if (whereToGo) {
    const monthIndex = monthIndexFromSlug(whereToGo[1] ?? '');
    if (monthIndex === null) return null;
    return { kind: 'where-to-go-month', monthIndex };
  }

  const whereToStay = WHERE_TO_STAY_RE.exec(slug);
  if (whereToStay) {
    const city = findCityBySlug(whereToStay[1] ?? '');
    if (!city || !whereToStayEligible(city.slug)) return null;
    return { kind: 'where-to-stay', city };
  }

  const bestTime = BEST_TIME_RE.exec(slug);
  if (bestTime) {
    const city = findCityBySlug(bestTime[1] ?? '');
    if (!city || !findClimate(city.slug)) return null;
    return { kind: 'best-time', city };
  }

  const weatherMonth = WEATHER_MONTH_RE.exec(slug);
  if (weatherMonth) {
    const city = findCityBySlug(weatherMonth[1] ?? '');
    const monthIndex = monthIndexFromSlug(weatherMonth[2] ?? '');
    if (!city || monthIndex === null || !findClimate(city.slug)) return null;
    return { kind: 'weather-month', city, monthIndex };
  }

  const weekend = WEEKEND_RE.exec(slug);
  if (weekend) {
    const city = findCityBySlug(weekend[1] ?? '');
    if (!city) return null;
    return { kind: 'weekend', city };
  }

  const family = FAMILY_RE.exec(slug);
  if (family) {
    const city = findCityBySlug(family[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'family' };
  }

  const food = FOOD_RE.exec(slug);
  if (food) {
    const city = findCityBySlug(food[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'food' };
  }

  const honeymoon = HONEYMOON_RE.exec(slug);
  if (honeymoon) {
    const city = findCityBySlug(honeymoon[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'honeymoon' };
  }

  const soloTravel = SOLO_TRAVEL_RE.exec(slug);
  if (soloTravel) {
    const city = findCityBySlug(soloTravel[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'solo-travel' };
  }

  const girlsTrip = GIRLS_TRIP_RE.exec(slug);
  if (girlsTrip) {
    const city = findCityBySlug(girlsTrip[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'girls-trip' };
  }

  const rainyDay = RAINY_DAY_RE.exec(slug);
  if (rainyDay) {
    const city = findCityBySlug(rainyDay[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'rainy-day' };
  }

  const nightIn = NIGHT_RE.exec(slug);
  if (nightIn) {
    const city = findCityBySlug(nightIn[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'night' };
  }

  const springIn = SPRING_RE.exec(slug);
  if (springIn) {
    const city = findCityBySlug(springIn[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'spring' };
  }

  const summerIn = SUMMER_RE.exec(slug);
  if (summerIn) {
    const city = findCityBySlug(summerIn[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'summer' };
  }

  const fallIn = FALL_RE.exec(slug);
  if (fallIn) {
    const city = findCityBySlug(fallIn[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'fall' };
  }

  const winterIn = WINTER_RE.exec(slug);
  if (winterIn) {
    const city = findCityBySlug(winterIn[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'winter' };
  }

  const withKids = WITH_KIDS_RE.exec(slug);
  if (withKids) {
    const city = findCityBySlug(withKids[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'with-kids' };
  }

  const withTeens = WITH_TEENS_RE.exec(slug);
  if (withTeens) {
    const city = findCityBySlug(withTeens[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'with-teens' };
  }

  const airportGuide = AIRPORT_GUIDE_RE.exec(slug);
  if (airportGuide) {
    const city = findCityBySlug(airportGuide[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'airport-guide' };
  }

  const budgetPerDay = BUDGET_PER_DAY_RE.exec(slug);
  if (budgetPerDay) {
    const city = findCityBySlug(budgetPerDay[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'budget-per-day' };
  }

  const bachelorParty = BACHELOR_PARTY_RE.exec(slug);
  if (bachelorParty) {
    const city = findCityBySlug(bachelorParty[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'bachelor-party' };
  }

  const bacheloretteParty = BACHELORETTE_PARTY_RE.exec(slug);
  if (bacheloretteParty) {
    const city = findCityBySlug(bacheloretteParty[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'bachelorette-party' };
  }

  const dayTrips = DAY_TRIPS_RE.exec(slug);
  if (dayTrips) {
    const city = findCityBySlug(dayTrips[1] ?? '');
    if (!city) return null;
    return { kind: 'themed-list', city, theme: 'day-trips' };
  }

  const itinerary = ITINERARY_RE.exec(slug);
  if (itinerary) {
    const citySlug = itinerary[1] ?? '';
    const daysStr = itinerary[2] ?? '';
    const days = Number.parseInt(daysStr, 10);
    if (!Number.isFinite(days) || !isValidItineraryDays(days)) return null;
    const city = findCityBySlug(citySlug);
    if (!city) return null;
    return { kind: 'itinerary', city, days };
  }

  const thingsToDo = THINGS_TO_DO_RE.exec(slug);
  if (thingsToDo) {
    const city = findCityBySlug(thingsToDo[1] ?? '');
    if (!city) return null;
    return { kind: 'things-to-do', city };
  }

  return null;
}

/**
 * Build the canonical SEO URL set for one city — used by the
 * SeoPageShell related-links rail so every page deep-links to every
 * other valid SEO surface for the same city (internal-linking
 * density compounds long-tail authority — Phase 8).
 */
export function buildCitySeoLinks(city: SeoCity): Array<{ label: string; href: string }> {
  return [
    ...(findClimate(city.slug)
      ? [{ label: `Best time to visit ${city.name}`, href: `/best-time-to-visit-${city.slug}` }]
      : []),
    ...(whereToStayEligible(city.slug)
      ? [{ label: `Where to stay in ${city.name}`, href: `/where-to-stay-in-${city.slug}` }]
      : []),
    { label: `Things to do in ${city.name}`, href: `/things-to-do-in-${city.slug}` },
    { label: `Best family activities in ${city.name}`, href: `/best-family-activities-in-${city.slug}` },
    { label: `Best food tours in ${city.name}`, href: `/best-food-tours-in-${city.slug}` },
    { label: `Day trips from ${city.name}`, href: `/day-trips-from-${city.slug}` },
    { label: `Honeymoon in ${city.name}`, href: `/honeymoon-in-${city.slug}` },
    { label: `Solo travel in ${city.name}`, href: `/solo-travel-in-${city.slug}` },
    { label: `Girls' trip in ${city.name}`, href: `/girls-trip-in-${city.slug}` },
    { label: `Rainy day in ${city.name}`, href: `/rainy-day-in-${city.slug}` },
    { label: `${city.name} at night`, href: `/night-in-${city.slug}` },
    { label: `Spring in ${city.name}`, href: `/spring-in-${city.slug}` },
    { label: `Summer in ${city.name}`, href: `/summer-in-${city.slug}` },
    { label: `Fall in ${city.name}`, href: `/fall-in-${city.slug}` },
    { label: `Winter in ${city.name}`, href: `/winter-in-${city.slug}` },
    { label: `${city.name} with kids`, href: `/${city.slug}-with-kids` },
    { label: `${city.name} with teens`, href: `/${city.slug}-with-teens` },
    { label: `${city.name} airport guide`, href: `/${city.slug}-airport-guide` },
    { label: `${city.name} budget per day`, href: `/${city.slug}-budget-per-day` },
    { label: `Bachelor party in ${city.name}`, href: `/bachelor-party-in-${city.slug}` },
    { label: `Bachelorette party in ${city.name}`, href: `/bachelorette-party-in-${city.slug}` },
    { label: `A weekend in ${city.name}`, href: `/weekend-in-${city.slug}` },
    ...SEO_ITINERARY_DAYS.map((n) => ({
      label: `${n}-day ${city.name} itinerary`,
      href: `/${city.slug}-${n}-day-itinerary`,
    })),
    ...EXTRA_THEMED.map((t) => ({ label: t.label(city), href: `/${t.build(city.slug)}` })),
  ];
}

/**
 * Enumerate every valid SEO slug. Used by both `generateStaticParams`
 * (so each page is statically generated at build time) and the
 * sitemap (so every URL is crawled).
 */
export function enumerateAllSeoSlugs(): string[] {
  const out: string[] = [];
  for (const month of MONTH_SLUGS) {
    out.push(`where-to-go-in-${month}`);
  }
  for (const city of SEO_CITIES) {
    if (findClimate(city.slug)) {
      out.push(`best-time-to-visit-${city.slug}`);
      for (const month of MONTH_SLUGS) {
        out.push(`${city.slug}-weather-in-${month}`);
      }
    }
    if (whereToStayEligible(city.slug)) {
      out.push(`where-to-stay-in-${city.slug}`);
    }
    out.push(`things-to-do-in-${city.slug}`);
    out.push(`best-family-activities-in-${city.slug}`);
    out.push(`best-food-tours-in-${city.slug}`);
    out.push(`day-trips-from-${city.slug}`);
    out.push(`honeymoon-in-${city.slug}`);
    out.push(`solo-travel-in-${city.slug}`);
    out.push(`girls-trip-in-${city.slug}`);
    out.push(`rainy-day-in-${city.slug}`);
    out.push(`night-in-${city.slug}`);
    out.push(`spring-in-${city.slug}`);
    out.push(`summer-in-${city.slug}`);
    out.push(`fall-in-${city.slug}`);
    out.push(`winter-in-${city.slug}`);
    out.push(`${city.slug}-with-kids`);
    out.push(`${city.slug}-with-teens`);
    out.push(`${city.slug}-airport-guide`);
    out.push(`${city.slug}-budget-per-day`);
    out.push(`bachelor-party-in-${city.slug}`);
    out.push(`bachelorette-party-in-${city.slug}`);
    out.push(`weekend-in-${city.slug}`);
    for (const days of SEO_ITINERARY_DAYS) {
      out.push(`${city.slug}-${days}-day-itinerary`);
    }
    for (const t of EXTRA_THEMED) out.push(t.build(city.slug));
  }
  for (const slug of enumerateAllComparisonSlugs()) {
    out.push(slug);
  }
  return out;
}
