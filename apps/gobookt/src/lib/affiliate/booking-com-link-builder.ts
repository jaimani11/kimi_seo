/**
 * Booking.com affiliate URL builder.
 *
 * Booking.com is the active stay-search partner during partnership
 * review (H3.x compliance pivot). Clicks from cards, drawers, the
 * destination "Where to stay" CTA, and the search-opportunity board
 * all route here via the `active-stay-provider` abstraction in
 * `src/lib/affiliate/active-stay-provider.ts`.
 *
 * The Expedia builder (sibling file) stays untouched so we can flip
 * the active provider back with one env toggle if/when business
 * conditions change.
 *
 * Affiliate model:
 *
 *   - `aid=<BOOKING_COM_AFFILIATE_ID>` carries the partnership for
 *     commission tracking. Without it the URL still resolves to a
 *     valid Booking.com search; commission just doesn't attribute.
 *   - `label=<channel>` is optional sub-channel attribution
 *     (web / email / social).
 *
 * URL shape mirrors what Booking.com's own search form submits when
 * the user types a destination + dates + occupancy. We DON'T use the
 * deeplink-builder endpoint (`/index.html?...&offset_request=1`)
 * because the standard search URL has the broadest compatibility
 * across locales + future Booking.com UI changes.
 */

export interface BookingComAffiliateConfig {
  /** Booking.com affiliate id (their "aid" param). Required for
   *  commission to track; unset still produces a valid URL without
   *  the param. */
  affiliateId: string | null;
  /** Optional sub-channel label. */
  label: string | null;
  /** Locale-specific Booking.com hostname. Default www.booking.com.
   *  Booking.com auto-redirects locale via their own logic, so the
   *  default is fine for the vast majority of traffic. */
  baseUrl: string;
}

const DEFAULT_BASE_URL = 'https://www.booking.com';

export function getBookingComAffiliateConfig(): BookingComAffiliateConfig {
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
  const base = (
    process.env.NEXT_PUBLIC_BOOKING_COM_BASE_URL ||
    process.env.BOOKING_COM_BASE_URL ||
    ''
  ).trim();
  return {
    affiliateId: aidRaw.length > 0 ? aidRaw : null,
    label: labelRaw.length > 0 ? labelRaw : null,
    baseUrl: base.length > 0 ? stripTrailingSlash(base) : DEFAULT_BASE_URL,
  };
}

export interface BookingComSearchInput {
  /** Free-text destination ("Tuscany", "Tokyo", "Lisbon").
   *  Booking.com's destination resolver handles fuzzy strings. */
  destination: string;
  /** ISO `YYYY-MM-DD`. */
  checkIn: string;
  checkOut: string;
  adults: number;
  /** Number of children (Booking.com only needs the count for the
   *  search URL; per-child ages are collected on Booking.com's site
   *  in the booking flow). */
  children?: number;
  /** Number of rooms. Default 1. */
  rooms?: number;
  /** Optional inventory filter. Booking.com's `nflt` param accepts
   *  pipe-delimited filter clauses; we expose a small typed set
   *  that matches the three opportunity-board card differentiations.
   *
   *   - 'apartments' → `ht_id=204` (apartments / vacation rentals)
   *   - 'luxury'     → `class=4|class=5` (4+ star hotels)
   *   - undefined    → no filter (broad hotel search) */
  inventoryFilter?: 'apartments' | 'luxury';
}

/**
 * Build a destination-level Booking.com search URL.
 *
 *   https://www.booking.com/searchresults.html?
 *     ss=Tuscany&checkin=2026-09-01&checkout=2026-09-05
 *     &group_adults=2&group_children=0&no_rooms=1
 *     &aid=AID&label=stayscout
 */
export function buildBookingComSearchUrl(
  input: BookingComSearchInput,
  config: BookingComAffiliateConfig = getBookingComAffiliateConfig(),
): string {
  const params = new URLSearchParams();
  params.set('ss', input.destination.trim());
  params.set('checkin', input.checkIn);
  params.set('checkout', input.checkOut);
  params.set('group_adults', String(Math.max(1, input.adults)));
  params.set('group_children', String(Math.max(0, input.children ?? 0)));
  params.set('no_rooms', String(Math.max(1, input.rooms ?? 1)));
  if (config.affiliateId) params.set('aid', config.affiliateId);
  if (config.label) params.set('label', config.label);
  // Source tag for post-click analytics. Same convention as the
  // Expedia builder so reports line up across providers.
  params.set('_src', 'gobookt');

  if (input.inventoryFilter === 'apartments') {
    // Booking.com's "Apartments" filter id is 204. Pass the raw
    // clause; URLSearchParams encodes `=` → `%3D` to match
    // Booking.com's own URL shape.
    params.set('nflt', 'ht_id=204');
  } else if (input.inventoryFilter === 'luxury') {
    // 4-star + 5-star hotels. URLSearchParams encodes `=` → `%3D`
    // and `;` → `%3B`.
    params.set('nflt', 'class=4;class=5');
  }

  return `${config.baseUrl}/searchresults.html?${params.toString()}`;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}
