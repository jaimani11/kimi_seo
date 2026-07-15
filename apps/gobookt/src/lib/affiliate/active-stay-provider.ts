import {
  buildBookingComSearchUrl,
  getBookingComAffiliateConfig,
  type BookingComSearchInput,
} from './booking-com-link-builder';
import {
  buildExpediaSearchUrl,
  getExpediaAffiliateConfig,
  type DestinationSearchInput,
} from './expedia-link-builder';
import { resolveBookingUrl } from './booking-cj-links';

/**
 * Active-stay-provider abstraction.
 *
 * Every user-facing stay-search hand-off (property cards, drawers,
 * destination "Where to stay" CTA, empty-state carousel, search-
 * opportunity board) routes through this layer rather than directly
 * calling a provider-specific builder. Flipping the active provider
 * is a single env var change.
 *
 * Active default: `booking-com`. gobookt is a Booking.com CJ affiliate;
 * every stay-search hand-off routes through Booking.com's affiliate
 * program. `expedia` is preserved only as an override for future
 * flexibility.
 */

export type ActiveStayProvider = 'booking-com' | 'expedia';

const DEFAULT_PROVIDER: ActiveStayProvider = 'booking-com';

/**
 * Read the active stay-search provider from env. Reads at call time
 * (not module load) so a config flip + page reload picks up
 * immediately. Both server- and client-safe because we use the
 * `NEXT_PUBLIC_*` prefix.
 */
export function getActiveStayProvider(): ActiveStayProvider {
  const raw = (process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'booking-com' || raw === 'expedia') return raw;
  return DEFAULT_PROVIDER;
}

/**
 * Normalized search input. Matches the Expedia builder's shape so
 * existing call sites only need to swap the helper. The Booking.com
 * builder adapts (children-ages → children-count, etc.).
 */
export interface ActiveStaySearchInput {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  /** Ages array (Expedia format). When dispatching to Booking.com we
   *  collapse to a count (Booking.com collects ages on its own site
   *  in the booking flow). */
  childrenAges?: number[];
  rooms?: number;
  /** Optional inventory filter that Booking.com supports. Expedia
   *  ignores this. Used by the search-opportunity board to render
   *  three differentiated "where to stay" cards. */
  inventoryFilter?: 'apartments' | 'luxury';
}

/**
 * Build the active provider's stay-search URL.
 *
 *   - default  → Booking.com (`booking.com/searchresults.html?ss=...`)
 *   - override → Expedia     (`expedia.com/Hotel-Search?destination=...`)
 *
 * The returned URL is ready for `/r/[id]` encoding (it's already
 * affiliate-tagged + on the partner's domain).
 */
export function buildActiveStaySearchUrl(input: ActiveStaySearchInput): string {
  const provider = getActiveStayProvider();

  if (provider === 'expedia') {
    const expediaInput: DestinationSearchInput = {
      destination: input.destination,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      ...(input.childrenAges && input.childrenAges.length > 0
        ? { childrenAges: input.childrenAges }
        : {}),
      ...(typeof input.rooms === 'number' ? { rooms: input.rooms } : {}),
    };
    return buildExpediaSearchUrl(expediaInput, getExpediaAffiliateConfig());
  }

  // Default: Booking.com (gobookt's CJ affiliate program). gobookt is a
  // Booking.com *CJ* affiliate — a raw booking.com URL with a label earns
  // nothing on CJ, so we route through the CJ resolver, which uses the tracked
  // CJ link (BOOKING_STAYS_AFFILIATE_URL) when configured and falls back to the
  // plain URL only when it isn't.
  const bookingInput: BookingComSearchInput = {
    destination: input.destination,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    children: input.childrenAges?.length ?? 0,
    ...(typeof input.rooms === 'number' ? { rooms: input.rooms } : {}),
    ...(input.inventoryFilter ? { inventoryFilter: input.inventoryFilter } : {}),
  };
  const target = buildBookingComSearchUrl(bookingInput, getBookingComAffiliateConfig());
  return resolveBookingUrl('stays', target);
}

/**
 * Provider id string to thread into the `/r/[id]` affiliate payload
 * so click attribution records the correct destination partner.
 */
export function getActiveStayProviderId(): ActiveStayProvider {
  return getActiveStayProvider();
}
