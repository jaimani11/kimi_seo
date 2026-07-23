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

import {
  resolveBookingUrl,
  resolveBookingSearchUrl,
  normalizeStayParty,
  validateStayDates,
  type BookingCjSurface,
  type BookingSearchResolution,
} from './booking-cj-links';

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
 * Build a URL for a NON-stays Booking.com vertical (attractions / flights /
 * cars / taxis). `hotels` is deliberately excluded at the type level: a hotel
 * search is search-intent and must go through `resolveBookingHotelsSearch` /
 * `bookingHotelsSearchHref` (money-path safe, fail-closed), never this
 * string-returning path that can drop to a fixed homepage creative.
 */
export function buildBookingComCategoryUrl(
  category: Exclude<BookingComCategory, 'hotels'>,
  input: CategorySearchInput,
  config: BookingComMultiConfig = getBookingComMultiConfig(),
): string {
  const target = buildCategoryTargetUrl(category, input, config);
  return resolveBookingUrl(surfaceForCategory(category), target);
}

/**
 * Resolve a Booking.com HOTELS SEARCH — the money-path-safe entrypoint for
 * every destination/neighborhood/date/guest hotel CTA. Normalizes guests
 * (never group_adults=0), drops invalid dates, and routes through
 * `resolveBookingSearchUrl` (deep-link only; fail-closed; never the fixed
 * homepage creative; never flights). Returns a typed result.
 */
export function resolveBookingHotelsSearch(
  input: CategorySearchInput,
  config: BookingComMultiConfig = getBookingComMultiConfig(),
): BookingSearchResolution {
  const party = normalizeStayParty(input);
  const dates = validateStayDates(input.checkIn, input.checkOut);
  const safeDates = dates.ok
    ? { ...(dates.checkIn ? { checkIn: dates.checkIn } : {}), ...(dates.checkOut ? { checkOut: dates.checkOut } : {}) }
    : {};
  const target = buildHotelsUrl(
    { destination: input.destination, ...safeDates, adults: party.adults, children: party.children, rooms: party.rooms },
    config,
  );
  return resolveBookingSearchUrl({
    target,
    destination: input.destination,
    ...safeDates,
    adults: party.adults,
    children: party.children,
    rooms: party.rooms,
  });
}

/** Href for a hotels search CTA, or `null` when unavailable (fail-closed).
 *  Callers render the CTA only when non-null. */
export function bookingHotelsSearchHref(
  input: CategorySearchInput,
  config: BookingComMultiConfig = getBookingComMultiConfig(),
): string | null {
  const res = resolveBookingHotelsSearch(input, config);
  return res.status === 'unavailable' ? null : res.url;
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
  // Normalize guests so the target NEVER emits group_adults=0 (clamps adults≥1,
  // children≥0, rooms≥1). Idempotent when callers already normalized.
  const party = normalizeStayParty(input);
  const params = new URLSearchParams();
  params.set('ss', input.destination);
  if (input.checkIn) params.set('checkin', input.checkIn);
  if (input.checkOut) params.set('checkout', input.checkOut);
  params.set('group_adults', String(party.adults));
  params.set('group_children', String(party.children));
  params.set('no_rooms', String(party.rooms));
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
