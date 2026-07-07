/**
 * Major cruise embarkation ports — Expedia lost their cruise
 * product, but pre/post-cruise hotel nights at the embarkation port
 * are real, high-intent revenue (real travelers always need a hotel
 * the night before sailing). This list powers the gotript Cruises
 * tab + the /cruises landing + the 5 regional cruise pages.
 *
 * Each entry maps a port to its `region` (so we can group on the
 * regional landing pages) and a `bookingDestination` — the string we
 * pass to Expedia's hotel search as `ss=`. Expedia's resolver
 * usually wants city name (not the port name) — e.g. "Athens" works
 * better than "Piraeus".
 */

/**
 * Re-export of the canonical CruiseRegion type lives in route-parser.ts
 * (so the SEO slug parser stays the single source of truth for the
 * allowed region enum). We import it here rather than re-define.
 */
import type { CruiseRegion } from '@lib/seo/route-parser';
export type { CruiseRegion };

export interface CruisePort {
  slug: string;
  name: string;
  /** What we send to Expedia `ss=` for hotel search. */
  bookingDestination: string;
  /** City context shown to the visitor. */
  city: string;
  country: string;
  region: CruiseRegion;
  /** One-line context — why people sail from here. */
  blurb: string;
}

export const CRUISE_PORTS: ReadonlyArray<CruisePort> = [
  // Caribbean — North America's biggest cruise gateways
  {
    slug: 'miami',
    name: 'Miami',
    bookingDestination: 'Miami',
    city: 'Miami',
    country: 'USA',
    region: 'caribbean',
    blurb: 'The world\'s busiest cruise port. Royal Caribbean, Carnival, NCL, MSC, Virgin.',
  },
  {
    slug: 'fort-lauderdale',
    name: 'Fort Lauderdale (Port Everglades)',
    bookingDestination: 'Fort Lauderdale',
    city: 'Fort Lauderdale',
    country: 'USA',
    region: 'caribbean',
    blurb: 'Princess, Celebrity, Holland America, Royal Caribbean. 30 min from MIA.',
  },
  {
    slug: 'san-juan',
    name: 'San Juan',
    bookingDestination: 'San Juan, Puerto Rico',
    city: 'San Juan',
    country: 'Puerto Rico',
    region: 'caribbean',
    blurb: 'Southern Caribbean home port — closer to Aruba, Barbados, St. Lucia.',
  },
  {
    slug: 'tampa',
    name: 'Tampa',
    bookingDestination: 'Tampa',
    city: 'Tampa',
    country: 'USA',
    region: 'caribbean',
    blurb: 'Western Caribbean specialist — Carnival, Royal Caribbean, NCL, Holland America.',
  },
  {
    slug: 'galveston',
    name: 'Galveston',
    bookingDestination: 'Galveston',
    city: 'Galveston',
    country: 'USA',
    region: 'caribbean',
    blurb: 'Texas Gulf gateway — Carnival, Royal Caribbean, Disney. Drive-to from Houston.',
  },

  // Mediterranean
  {
    slug: 'barcelona',
    name: 'Barcelona',
    bookingDestination: 'Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    region: 'mediterranean',
    blurb: 'Western Med flagship port. Royal Caribbean, MSC, NCL, Princess, Celebrity.',
  },
  {
    slug: 'civitavecchia-rome',
    name: 'Civitavecchia (Rome)',
    bookingDestination: 'Rome',
    city: 'Rome',
    country: 'Italy',
    region: 'mediterranean',
    blurb: 'Italy\'s biggest cruise port. 80 km from Rome — most travelers stay in Rome.',
  },
  {
    slug: 'athens-piraeus',
    name: 'Athens (Piraeus)',
    bookingDestination: 'Athens',
    city: 'Athens',
    country: 'Greece',
    region: 'mediterranean',
    blurb: 'Greek isles + Eastern Med home port. 30 min from central Athens.',
  },
  {
    slug: 'venice',
    name: 'Venice',
    bookingDestination: 'Venice',
    city: 'Venice',
    country: 'Italy',
    region: 'mediterranean',
    blurb: 'Adriatic departures to Croatia, Greece, the Greek isles.',
  },

  // Alaska
  {
    slug: 'seattle',
    name: 'Seattle',
    bookingDestination: 'Seattle',
    city: 'Seattle',
    country: 'USA',
    region: 'alaska',
    blurb: 'Alaska Inside Passage round-trips. NCL, Royal Caribbean, Princess, Holland America.',
  },
  {
    slug: 'vancouver',
    name: 'Vancouver',
    bookingDestination: 'Vancouver',
    city: 'Vancouver',
    country: 'Canada',
    region: 'alaska',
    blurb: 'Gulf of Alaska one-ways to Whittier/Seward. Scenic embarkation.',
  },

  // Northern Europe
  {
    slug: 'southampton',
    name: 'Southampton',
    bookingDestination: 'Southampton',
    city: 'Southampton',
    country: 'UK',
    region: 'northern-europe',
    blurb: 'UK\'s main cruise port. Norwegian fjords, Iceland, transatlantic, Baltic.',
  },
  {
    slug: 'copenhagen',
    name: 'Copenhagen',
    bookingDestination: 'Copenhagen',
    city: 'Copenhagen',
    country: 'Denmark',
    region: 'northern-europe',
    blurb: 'Baltic capitals + Norwegian fjords gateway. Royal Caribbean, MSC, NCL.',
  },
  {
    slug: 'bergen',
    name: 'Bergen',
    bookingDestination: 'Bergen',
    city: 'Bergen',
    country: 'Norway',
    region: 'northern-europe',
    blurb: 'Heart of the Norwegian fjords. Hurtigruten coastal voyages start here.',
  },

  // Asia
  {
    slug: 'singapore',
    name: 'Singapore',
    bookingDestination: 'Singapore',
    city: 'Singapore',
    country: 'Singapore',
    region: 'asia',
    blurb: 'Southeast Asia hub. Royal Caribbean, Princess, Genting Dream — Oct–Apr peak.',
  },
  {
    slug: 'tokyo-yokohama',
    name: 'Tokyo (Yokohama)',
    bookingDestination: 'Yokohama',
    city: 'Yokohama',
    country: 'Japan',
    region: 'asia',
    blurb: 'Japan round-trips — cherry blossom + autumn-leaves itineraries are the draw.',
  },
  {
    slug: 'hong-kong',
    name: 'Hong Kong',
    bookingDestination: 'Hong Kong',
    city: 'Hong Kong',
    country: 'Hong Kong',
    region: 'asia',
    blurb: 'Southeast Asia + Japan crossover. Star Cruises, Princess, Royal Caribbean.',
  },
];

export function findCruisePortBySlug(slug: string): CruisePort | null {
  return CRUISE_PORTS.find((p) => p.slug === slug) ?? null;
}

export function cruisePortsForRegion(region: CruiseRegion): CruisePort[] {
  return CRUISE_PORTS.filter((p) => p.region === region);
}
