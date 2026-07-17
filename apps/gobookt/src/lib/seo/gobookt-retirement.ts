/**
 * gobookt Viator-retirement policy — single source of truth.
 *
 * gobookt is a Booking.com stays-first brand. The numiworks fork left behind a
 * set of Viator-API-dependent editorial page families (itinerary, weekend,
 * things-to-do, ~experience-themed lists, city-vs-city comparisons). gobookt has
 * no Viator key, so those pages render a broken "temporarily unavailable" banner.
 *
 * We DON'T mass-delete them. Per the phased plan:
 *   - REDIRECT (one-hop 308) the families that have a genuinely close, live
 *     Booking.com/stays equivalent.
 *   - HOLD the pure-experience remainder: render an honest, no-Viator interim
 *     bridge (never a broken banner) + noindex, pending a GSC/backlink traffic
 *     review that decides their final fate (rewrite / 410 / keep).
 *
 * Every redirect target below is a real, live, non-Viator gobookt route that
 * returns 200 (verified against the shared route taxonomy):
 *   /destinations/{city} (guide cities), /hotels-in-{city}, /top-attractions-in-{city},
 *   /family-hotels-in-{city}, /luxury-hotels-in-{city}, /cheap-hotels-in-{city},
 *   /best-time-to-visit-{city}.
 */
import { parseSeoSlug } from '@adored/seo-routing/multicategory';
import { hasDestinationGuide } from '@adored/seo-data';

/** The non-null parsed-route union from the shared multi-category parser. */
export type SeoRoute = NonNullable<ReturnType<typeof parseSeoSlug>>;

export type Retirement =
  | { kind: 'redirect'; to: string }
  | { kind: 'held' }
  | null;

/**
 * themed-list themes with a genuinely close, live accommodation/stays equivalent
 * → one-hop 308. Everything NOT listed here is a pure-experience theme → held.
 */
const THEME_REDIRECT: Readonly<Record<string, (citySlug: string) => string>> = {
  // family-travel intent → family hotels
  family: (c) => `/family-hotels-in-${c}`,
  'with-kids': (c) => `/family-hotels-in-${c}`,
  'with-teens': (c) => `/family-hotels-in-${c}`,
  // luxury / honeymoon lodging intent → luxury hotels
  // (gobookt has no /romantic-hotels- route; luxury is the closest live target)
  luxury: (c) => `/luxury-hotels-in-${c}`,
  honeymoon: (c) => `/luxury-hotels-in-${c}`,
  // budget intent → cheap hotels
  'budget-per-day': (c) => `/cheap-hotels-in-${c}`,
  // seasonal trip-timing intent → the (live, non-Viator) best-time climate page
  spring: (c) => `/best-time-to-visit-${c}`,
  summer: (c) => `/best-time-to-visit-${c}`,
  fall: (c) => `/best-time-to-visit-${c}`,
  winter: (c) => `/best-time-to-visit-${c}`,
};

/**
 * Retirement action for a parsed route, or null for routes that are NOT retired
 * (all the healthy Booking.com families — hotels, hotel-themed, things-themed,
 * flights, cars, climate). Cruises are RETIRED (Booking.com pays $0 on cruises).
 */
export function retirementFor(parsed: SeoRoute): Retirement {
  switch (parsed.kind) {
    case 'itinerary':
    case 'weekend': {
      // Trip-planning intent → the city's destination guide when it exists,
      // otherwise its Booking.com hotels page (exists for every SEO city).
      const c = parsed.city.slug;
      return {
        kind: 'redirect',
        to: hasDestinationGuide(c) ? `/destinations/${c}` : `/hotels-in-${c}`,
      };
    }
    case 'things-to-do':
      // → the live, non-Viator things-themed "top attractions" page (same intent).
      return { kind: 'redirect', to: `/top-attractions-in-${parsed.city.slug}` };
    case 'themed-list': {
      const build = THEME_REDIRECT[parsed.theme];
      return build
        ? { kind: 'redirect', to: build(parsed.city.slug) }
        : { kind: 'held' };
    }
    case 'comparison':
      // city-vs-city — no single close accommodation target; hold for review.
      return { kind: 'held' };
    case 'cruise-region':
      // Cruises removed — Booking.com pays $0 commission on cruises. One-hop 308
      // to the stays hub; enumerateAllSeoSlugs() drops these from the sitemap.
      return { kind: 'redirect', to: '/stays' };
    default:
      return null;
  }
}

/** Clean, honest, Viator-free H1/title for a HELD themed-list page. */
const HELD_THEME_TITLE: Readonly<Record<string, (cityName: string) => string>> = {
  food: (n) => `Food & dining in ${n}`,
  'solo-travel': (n) => `Solo travel in ${n}`,
  'girls-trip': (n) => `A girls' trip to ${n}`,
  'rainy-day': (n) => `A rainy day in ${n}`,
  night: (n) => `${n} at night`,
  'bachelor-party': (n) => `A bachelor party in ${n}`,
  'bachelorette-party': (n) => `A bachelorette party in ${n}`,
  'day-trips': (n) => `Day trips from ${n}`,
  'airport-guide': (n) => `${n} airport guide`,
  'first-timer': (n) => `First time in ${n}`,
  'worth-visiting': (n) => `Is ${n} worth visiting?`,
  'hidden-gems': (n) => `Hidden gems in ${n}`,
  instagram: (n) => `Most instagrammable places in ${n}`,
  'how-many-days': (n) => `How many days in ${n}?`,
  'solo-female': (n) => `${n} for solo female travelers`,
  'bucket-list': (n) => `${n} bucket list`,
  'private-tours': (n) => `Private tours in ${n}`,
  'walking-tours': (n) => `Walking tours in ${n}`,
};

/** Title for a HELD page (themed-list or comparison). */
export function heldPageTitle(parsed: SeoRoute): string {
  if (parsed.kind === 'comparison') {
    return `${parsed.comparison.a.name} vs ${parsed.comparison.b.name}`;
  }
  if (parsed.kind === 'themed-list') {
    const build = HELD_THEME_TITLE[parsed.theme];
    return build ? build(parsed.city.name) : `Plan your trip to ${parsed.city.name}`;
  }
  return 'Plan your trip';
}
