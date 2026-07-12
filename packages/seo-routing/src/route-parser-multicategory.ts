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
 * Slug shapes recognized — every shape that resolves to a city must
 * route to the brand's booking partner via the right vertical (hotels, flights, cars,
 * attractions, cruises).
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

export type HotelTheme =
  | 'best'
  | 'cheap'
  | 'luxury'
  | 'family'
  | 'boutique'
  | 'pet-friendly'
  | 'beach'
  | 'apartments';

export type FlightTheme = 'cheap';

export type CarTheme = 'cheap' | 'airport';

export type ThingsToDoVariant =
  | 'top-attractions'
  | 'free'
  | 'museums'
  | 'tours';

export type CruiseRegion =
  | 'mediterranean'
  | 'caribbean'
  | 'alaska'
  | 'northern-europe'
  | 'asia';

export const CRUISE_REGIONS: ReadonlyArray<CruiseRegion> = [
  'mediterranean',
  'caribbean',
  'alaska',
  'northern-europe',
  'asia',
];

export type SeoRouteMatch =
  | { kind: 'itinerary'; city: SeoCity; days: number }
  | { kind: 'things-to-do'; city: SeoCity }
  | { kind: 'themed-list'; city: SeoCity; theme: ThemedListTheme }
  | { kind: 'weekend'; city: SeoCity }
  | { kind: 'comparison'; comparison: SeoComparison }
  | { kind: 'hotels-in'; city: SeoCity }
  | { kind: 'flights-to'; city: SeoCity }
  | { kind: 'cars-in'; city: SeoCity }
  | { kind: 'hotels-themed'; city: SeoCity; theme: HotelTheme }
  | { kind: 'flights-themed'; city: SeoCity; theme: FlightTheme }
  | { kind: 'cars-themed'; city: SeoCity; theme: CarTheme }
  | { kind: 'things-themed'; city: SeoCity; variant: ThingsToDoVariant }
  | { kind: 'cruise-region'; region: CruiseRegion }
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
 * Each fans out to one page per city; regexes are distinctive so they
 * never collide with the hardcoded patterns. `build` inverts `re`.
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

// Partner vertical landings (one per city).
const HOTELS_IN_RE = /^hotels-in-([a-z][a-z0-9-]*)$/;
const FLIGHTS_TO_RE = /^flights-to-([a-z][a-z0-9-]*)$/;
const CARS_IN_RE = /^car-rentals-in-([a-z][a-z0-9-]*)$/;

// Hotel-themed sub-shapes — each routes to the partner's hotels surface with a
// curation overlay (the best-rated, the cheapest, the most luxurious,
// family-friendly, boutique, pet-friendly, beachfront, apartment).
const BEST_HOTELS_RE = /^best-hotels-in-([a-z][a-z0-9-]*)$/;
const CHEAP_HOTELS_RE = /^cheap-hotels-in-([a-z][a-z0-9-]*)$/;
const LUXURY_HOTELS_RE = /^luxury-hotels-in-([a-z][a-z0-9-]*)$/;
const FAMILY_HOTELS_RE = /^family-hotels-in-([a-z][a-z0-9-]*)$/;
const BOUTIQUE_HOTELS_RE = /^boutique-hotels-in-([a-z][a-z0-9-]*)$/;
const PET_HOTELS_RE = /^pet-friendly-hotels-in-([a-z][a-z0-9-]*)$/;
const BEACH_HOTELS_RE = /^beach-hotels-in-([a-z][a-z0-9-]*)$/;
const APARTMENTS_RE = /^apartments-in-([a-z][a-z0-9-]*)$/;

// Flight-themed sub-shapes.
const CHEAP_FLIGHTS_RE = /^cheap-flights-to-([a-z][a-z0-9-]*)$/;

// Car-themed sub-shapes.
const CHEAP_CARS_RE = /^cheap-car-rental-in-([a-z][a-z0-9-]*)$/;
const AIRPORT_CARS_RE = /^airport-car-rental-in-([a-z][a-z0-9-]*)$/;

// Things-to-do themed sub-shapes — these route to the partner
// Attractions with the matching filter / search term.
const TOP_ATTRACTIONS_RE = /^top-attractions-in-([a-z][a-z0-9-]*)$/;
const FREE_THINGS_RE = /^free-things-to-do-in-([a-z][a-z0-9-]*)$/;
const MUSEUMS_RE = /^museums-in-([a-z][a-z0-9-]*)$/;
const TOURS_RE = /^tours-in-([a-z][a-z0-9-]*)$/;

// Cruise regional pages — not per-city, so they're fixed slugs.
const CRUISE_REGION_RE = /^(mediterranean|caribbean|alaska|northern-europe|asia)-cruises$/;

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
    // fall through to the other patterns.
  }

  // Fixed cruise regional pages. Check first because they're not
  // city-keyed.
  const cruiseRegion = CRUISE_REGION_RE.exec(slug);
  if (cruiseRegion) {
    const region = cruiseRegion[1] as CruiseRegion;
    return { kind: 'cruise-region', region };
  }

  // Hotel-themed shapes — check before `hotels-in-X` (less specific).
  const bestHotels = BEST_HOTELS_RE.exec(slug);
  if (bestHotels) {
    const city = findCityBySlug(bestHotels[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'best' };
  }
  const cheapHotels = CHEAP_HOTELS_RE.exec(slug);
  if (cheapHotels) {
    const city = findCityBySlug(cheapHotels[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'cheap' };
  }
  const luxuryHotels = LUXURY_HOTELS_RE.exec(slug);
  if (luxuryHotels) {
    const city = findCityBySlug(luxuryHotels[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'luxury' };
  }
  const familyHotels = FAMILY_HOTELS_RE.exec(slug);
  if (familyHotels) {
    const city = findCityBySlug(familyHotels[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'family' };
  }
  const boutiqueHotels = BOUTIQUE_HOTELS_RE.exec(slug);
  if (boutiqueHotels) {
    const city = findCityBySlug(boutiqueHotels[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'boutique' };
  }
  const petHotels = PET_HOTELS_RE.exec(slug);
  if (petHotels) {
    const city = findCityBySlug(petHotels[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'pet-friendly' };
  }
  const beachHotels = BEACH_HOTELS_RE.exec(slug);
  if (beachHotels) {
    const city = findCityBySlug(beachHotels[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'beach' };
  }
  const apartments = APARTMENTS_RE.exec(slug);
  if (apartments) {
    const city = findCityBySlug(apartments[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-themed', city, theme: 'apartments' };
  }

  // Flight-themed.
  const cheapFlights = CHEAP_FLIGHTS_RE.exec(slug);
  if (cheapFlights) {
    const city = findCityBySlug(cheapFlights[1] ?? '');
    if (!city) return null;
    return { kind: 'flights-themed', city, theme: 'cheap' };
  }

  // Car-themed.
  const cheapCars = CHEAP_CARS_RE.exec(slug);
  if (cheapCars) {
    const city = findCityBySlug(cheapCars[1] ?? '');
    if (!city) return null;
    return { kind: 'cars-themed', city, theme: 'cheap' };
  }
  const airportCars = AIRPORT_CARS_RE.exec(slug);
  if (airportCars) {
    const city = findCityBySlug(airportCars[1] ?? '');
    if (!city) return null;
    return { kind: 'cars-themed', city, theme: 'airport' };
  }

  // Things-to-do themed sub-shapes.
  const topAttractions = TOP_ATTRACTIONS_RE.exec(slug);
  if (topAttractions) {
    const city = findCityBySlug(topAttractions[1] ?? '');
    if (!city) return null;
    return { kind: 'things-themed', city, variant: 'top-attractions' };
  }
  const freeThings = FREE_THINGS_RE.exec(slug);
  if (freeThings) {
    const city = findCityBySlug(freeThings[1] ?? '');
    if (!city) return null;
    return { kind: 'things-themed', city, variant: 'free' };
  }
  const museums = MUSEUMS_RE.exec(slug);
  if (museums) {
    const city = findCityBySlug(museums[1] ?? '');
    if (!city) return null;
    return { kind: 'things-themed', city, variant: 'museums' };
  }
  const tours = TOURS_RE.exec(slug);
  if (tours) {
    const city = findCityBySlug(tours[1] ?? '');
    if (!city) return null;
    return { kind: 'things-themed', city, variant: 'tours' };
  }

  // Partner base verticals (one per city).
  const hotelsIn = HOTELS_IN_RE.exec(slug);
  if (hotelsIn) {
    const city = findCityBySlug(hotelsIn[1] ?? '');
    if (!city) return null;
    return { kind: 'hotels-in', city };
  }

  const flightsTo = FLIGHTS_TO_RE.exec(slug);
  if (flightsTo) {
    const city = findCityBySlug(flightsTo[1] ?? '');
    if (!city) return null;
    return { kind: 'flights-to', city };
  }

  const carsIn = CARS_IN_RE.exec(slug);
  if (carsIn) {
    const city = findCityBySlug(carsIn[1] ?? '');
    if (!city) return null;
    return { kind: 'cars-in', city };
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
    // Climate surfaces — gated on the same data the parser gates on.
    ...(findClimate(city.slug)
      ? [{ label: `Best time to visit ${city.name}`, href: `/best-time-to-visit-${city.slug}` }]
      : []),
    ...(whereToStayEligible(city.slug)
      ? [{ label: `Where to stay in ${city.name}`, href: `/where-to-stay-in-${city.slug}` }]
      : []),
    // Hotels — base + all 8 themes.
    { label: `Hotels in ${city.name}`, href: `/hotels-in-${city.slug}` },
    { label: `Best hotels in ${city.name}`, href: `/best-hotels-in-${city.slug}` },
    { label: `Cheap hotels in ${city.name}`, href: `/cheap-hotels-in-${city.slug}` },
    { label: `Luxury hotels in ${city.name}`, href: `/luxury-hotels-in-${city.slug}` },
    { label: `Family hotels in ${city.name}`, href: `/family-hotels-in-${city.slug}` },
    { label: `Boutique hotels in ${city.name}`, href: `/boutique-hotels-in-${city.slug}` },
    { label: `Pet-friendly hotels in ${city.name}`, href: `/pet-friendly-hotels-in-${city.slug}` },
    { label: `Beach hotels in ${city.name}`, href: `/beach-hotels-in-${city.slug}` },
    { label: `Apartments in ${city.name}`, href: `/apartments-in-${city.slug}` },
    // Flights — base + cheap.
    { label: `Flights to ${city.name}`, href: `/flights-to-${city.slug}` },
    { label: `Cheap flights to ${city.name}`, href: `/cheap-flights-to-${city.slug}` },
    // Cars — base + 2 themes.
    { label: `Car rentals in ${city.name}`, href: `/car-rentals-in-${city.slug}` },
    { label: `Cheap car rental in ${city.name}`, href: `/cheap-car-rental-in-${city.slug}` },
    { label: `Airport car rental in ${city.name}`, href: `/airport-car-rental-in-${city.slug}` },
    // Things to do — base + 4 variants + 3 themed editorial.
    { label: `Things to do in ${city.name}`, href: `/things-to-do-in-${city.slug}` },
    { label: `Top attractions in ${city.name}`, href: `/top-attractions-in-${city.slug}` },
    { label: `Free things to do in ${city.name}`, href: `/free-things-to-do-in-${city.slug}` },
    { label: `Museums in ${city.name}`, href: `/museums-in-${city.slug}` },
    { label: `Tours in ${city.name}`, href: `/tours-in-${city.slug}` },
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
 * Per-city slug count contributed by `enumerateAllSeoSlugs`. Kept as
 * a named constant so the route-parser test can re-derive the
 * expected fan-out math without duplicating the formula by hand.
 *
 *   3 base verticals (hotels-in, flights-to, car-rentals-in)
 * + 8 hotel themes
 * + 1 flight theme
 * + 2 car themes
 * + 4 things-to-do variants
 * + 1 things-to-do base
 * + 3 themed-list (family, food, day-trips)
 * + 1 weekend
 * + SEO_ITINERARY_DAYS itineraries
 */
export const SEO_SLUGS_PER_CITY =
  3 + 8 + 1 + 2 + 4 + 1 + 18 + 1 + SEO_ITINERARY_DAYS.length;

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
    // Climate surfaces.
    if (findClimate(city.slug)) {
      out.push(`best-time-to-visit-${city.slug}`);
      for (const month of MONTH_SLUGS) {
        out.push(`${city.slug}-weather-in-${month}`);
      }
    }
    if (whereToStayEligible(city.slug)) {
      out.push(`where-to-stay-in-${city.slug}`);
    }
    // Hotels — base + 8 themes.
    out.push(`hotels-in-${city.slug}`);
    out.push(`best-hotels-in-${city.slug}`);
    out.push(`cheap-hotels-in-${city.slug}`);
    out.push(`luxury-hotels-in-${city.slug}`);
    out.push(`family-hotels-in-${city.slug}`);
    out.push(`boutique-hotels-in-${city.slug}`);
    out.push(`pet-friendly-hotels-in-${city.slug}`);
    out.push(`beach-hotels-in-${city.slug}`);
    out.push(`apartments-in-${city.slug}`);
    // Flights — base + cheap.
    out.push(`flights-to-${city.slug}`);
    out.push(`cheap-flights-to-${city.slug}`);
    // Cars — base + 2 themes.
    out.push(`car-rentals-in-${city.slug}`);
    out.push(`cheap-car-rental-in-${city.slug}`);
    out.push(`airport-car-rental-in-${city.slug}`);
    // Things to do — base + 4 variants.
    out.push(`things-to-do-in-${city.slug}`);
    out.push(`top-attractions-in-${city.slug}`);
    out.push(`free-things-to-do-in-${city.slug}`);
    out.push(`museums-in-${city.slug}`);
    out.push(`tours-in-${city.slug}`);
    // Experience-themed editorial pages.
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
  // Cruise regions — not per-city.
  for (const region of CRUISE_REGIONS) {
    out.push(`${region}-cruises`);
  }
  for (const slug of enumerateAllComparisonSlugs()) {
    out.push(slug);
  }
  return out;
}
