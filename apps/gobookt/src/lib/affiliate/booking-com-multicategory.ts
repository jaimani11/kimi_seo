/**
 * Booking.com multi-category affiliate URL builder.
 *
 * Booking.com is not just a hotel-search engine — they sell:
 *   - Hotels & accommodations
 *   - Attractions (tours, day trips, tickets) — competes with Viator
 *   - Flights (powered by Kayak under the Booking.com brand)
 *   - Car rentals
 *   - Airport taxis
 *
 * Gobookt routes every outbound CTA into the right Booking.com
 * vertical so commission tracks against the correct partner program.
 * Each function emits an attribution-safe URL with `aid` (affiliate
 * id), `label` (sub-channel), and `_src=gobookt` for our own
 * analytics.
 *
 * Env:
 *   BOOKING_COM_AFFILIATE_ID     — required for commission; the
 *                                   `aid` URL param. Without it the
 *                                   URLs still work, attribution
 *                                   doesn't track.
 *   BOOKING_COM_AFFILIATE_LABEL  — optional sub-channel label
 *                                   (default 'gobookt').
 */

import { resolveBookingUrl, type BookingCjSurface } from './booking-cj-links';

export type BookingComCategory =
  | 'hotels'
  | 'attractions'
  | 'flights'
  | 'cars'
  | 'taxis';

export interface BookingComMultiConfig {
  affiliateId: string | null;
  label: string;
}

export function getBookingComMultiConfig(): BookingComMultiConfig {
  const aidRaw = (
    process.env.NEXT_PUBLIC_BOOKING_COM_AFFILIATE_ID ||
    process.env.BOOKING_COM_AFFILIATE_ID ||
    ''
  ).trim();
  const labelRaw = (
    process.env.NEXT_PUBLIC_BOOKING_COM_AFFILIATE_LABEL ||
    process.env.BOOKING_COM_AFFILIATE_LABEL ||
    'gobookt'
  ).trim();
  return {
    affiliateId: aidRaw.length > 0 ? aidRaw : null,
    label: labelRaw.length > 0 ? labelRaw : 'gobookt',
  };
}

export interface CategorySearchInput {
  destination: string;
  /** ISO YYYY-MM-DD. Optional — when omitted, the partner shows a
   *  date-picker default. */
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

/**
 * Build a URL for the given Booking.com vertical. Returns the
 * canonical Booking.com search URL with our affiliate id attached.
 */
export function buildBookingComCategoryUrl(
  category: BookingComCategory,
  input: CategorySearchInput,
  config: BookingComMultiConfig = getBookingComMultiConfig(),
): string {
  // The specific booking.com page we'd ideally land on. Used directly
  // only as the evergreen deep-link target, or as an untracked fail-safe
  // when no CJ creative is configured. Otherwise the CJ creative link for
  // the surface wins — Booking.com is approved via CJ, which tracks
  // through its own redirect links, not an `aid` param.
  const target = buildCategoryTargetUrl(category, input, config);
  return resolveBookingUrl(surfaceForCategory(category), target);
}

/** Maps a vertical to its CJ creative surface (null = no CJ creative yet). */
function surfaceForCategory(category: BookingComCategory): BookingCjSurface | null {
  switch (category) {
    case 'hotels':
      return 'stays';
    case 'attractions':
      return 'attractions';
    case 'flights':
      return 'flights';
    case 'cars':
      return 'cars';
    case 'taxis':
      return null; // Airport Taxis: no CJ creative yet — stays hidden / Coming Soon
  }
}

/** The canonical booking.com destination URL for a vertical. */
function buildCategoryTargetUrl(
  category: BookingComCategory,
  input: CategorySearchInput,
  config: BookingComMultiConfig,
): string {
  switch (category) {
    case 'hotels':
      return buildHotelsUrl(input, config);
    case 'attractions':
      return buildAttractionsUrl(input, config);
    case 'flights':
      return buildFlightsUrl(input, config);
    case 'cars':
      return buildCarsUrl(input, config);
    case 'taxis':
      return buildTaxisUrl(input, config);
  }
}

function buildHotelsUrl(input: CategorySearchInput, config: BookingComMultiConfig): string {
  const params = new URLSearchParams();
  params.set('ss', input.destination);
  if (input.checkIn) params.set('checkin', input.checkIn);
  if (input.checkOut) params.set('checkout', input.checkOut);
  params.set('group_adults', String(input.adults ?? 2));
  params.set('group_children', String(input.children ?? 0));
  params.set('no_rooms', String(input.rooms ?? 1));
  return withAffiliate(
    `https://www.booking.com/searchresults.html?${params.toString()}`,
    config,
  );
}

function buildAttractionsUrl(input: CategorySearchInput, config: BookingComMultiConfig): string {
  // Booking.com Attractions search. The shape is similar to hotels
  // but lives on a different sub-product.
  const params = new URLSearchParams();
  params.set('ss', input.destination);
  return withAffiliate(
    `https://www.booking.com/attractions/searchresults.html?${params.toString()}`,
    config,
  );
}

function buildFlightsUrl(input: CategorySearchInput, config: BookingComMultiConfig): string {
  // Booking.com Flights is a separate top-level surface. We pass the
  // destination as a free-text city; their resolver handles airport
  // matching.
  const params = new URLSearchParams();
  params.set('to', input.destination);
  if (input.checkIn) params.set('depart', input.checkIn);
  if (input.checkOut) params.set('return', input.checkOut);
  params.set('adults', String(input.adults ?? 1));
  if (input.children && input.children > 0) {
    params.set('children', String(input.children));
  }
  return withAffiliate(
    `https://flights.booking.com/flights/?${params.toString()}`,
    config,
  );
}

function buildCarsUrl(input: CategorySearchInput, config: BookingComMultiConfig): string {
  // `cars.booking.com/searchresults` returns 404. The canonical Cars
  // landing lives on the main www domain — `www.booking.com/cars/
  // index.html` accepts an `ss=` destination param the same way the
  // hotels search does.
  const params = new URLSearchParams();
  params.set('ss', input.destination);
  if (input.checkIn) params.set('from_date', input.checkIn);
  if (input.checkOut) params.set('to_date', input.checkOut);
  return withAffiliate(
    `https://www.booking.com/cars/index.html?${params.toString()}`,
    config,
  );
}

function buildTaxisUrl(_input: CategorySearchInput, config: BookingComMultiConfig): string {
  // `taxi.booking.com/?to=...` returns 405 (method not allowed on the
  // root). The www-domain landing handles the request properly.
  return withAffiliate(
    'https://www.booking.com/taxi/index.html',
    config,
  );
}

function withAffiliate(url: string, config: BookingComMultiConfig): string {
  const u = new URL(url);
  if (config.affiliateId) u.searchParams.set('aid', config.affiliateId);
  u.searchParams.set('label', config.label);
  u.searchParams.set('_src', 'gobookt');
  return u.toString();
}

/**
 * Display label + ordering for the home hero + AI concierge. Single
 * source of truth for which verticals gobookt surfaces and in what
 * order. gobookt is accommodation-first: Stays leads; things-to-do,
 * cars, and flights are supporting. Cruises are removed entirely
 * (Booking.com pays $0 on cruises).
 */
export const CATEGORY_META: ReadonlyArray<{
  id: BookingComCategory;
  label: string;
  description: string;
  iconHint: string;
}> = [
  {
    id: 'hotels',
    label: 'Stays',
    description: 'Hotels, apartments, vacation homes, villas, resorts, cabins.',
    iconHint: 'bed',
  },
  {
    id: 'attractions',
    label: 'Things to do',
    description: 'Tours, tickets, and experiences to plan around your stay.',
    iconHint: 'ticket',
  },
  {
    id: 'cars',
    label: 'Car rentals',
    description: 'Pick-up at airports + city locations.',
    iconHint: 'car',
  },
  {
    id: 'flights',
    label: 'Flights',
    description: 'Round-trip + one-way, every major carrier.',
    iconHint: 'plane',
  },
];
