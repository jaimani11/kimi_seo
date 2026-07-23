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
import {
  resolveBookingSearchUrl,
  normalizeStayParty,
  type BookingSearchResolution,
} from './booking-cj-links';

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
/**
 * Resolve a Booking.com stays SEARCH hand-off through the money-path-safe
 * search resolver (booking-com provider). Guest counts are normalized so a
 * search never emits group_adults=0. Returns a typed result — `tracked`,
 * `untracked`, or `unavailable` — never a homepage creative and never an
 * empty string. Booking.com is gobookt's active provider; the Expedia branch
 * lives in `activeStaySearchHref` since it is a different (dormant) program.
 */
export function resolveActiveStaySearch(input: ActiveStaySearchInput): BookingSearchResolution {
  const party = normalizeStayParty({
    adults: input.adults,
    children: input.childrenAges?.length ?? 0,
    rooms: input.rooms,
  });
  const bookingInput: BookingComSearchInput = {
    destination: input.destination,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: party.adults,
    children: party.children,
    rooms: party.rooms,
    ...(input.inventoryFilter ? { inventoryFilter: input.inventoryFilter } : {}),
  };
  const target = buildBookingComSearchUrl(bookingInput, getBookingComAffiliateConfig());
  return resolveBookingSearchUrl({
    target,
    destination: input.destination,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: party.adults,
    children: party.children,
    rooms: party.rooms,
  });
}

/**
 * Href for a stays search CTA, or `null` when the search hand-off is
 * unavailable (fail-closed). Callers render the CTA only when non-null and
 * show a retry/unavailable state otherwise — they must NEVER substitute a
 * homepage link. Expedia (dormant override) always yields a string.
 */
export function activeStaySearchHref(input: ActiveStaySearchInput): string | null {
  const provider = getActiveStayProvider();

  if (provider === 'expedia') {
    const expediaInput: DestinationSearchInput = {
      destination: input.destination,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: Math.max(1, input.adults),
      ...(input.childrenAges && input.childrenAges.length > 0
        ? { childrenAges: input.childrenAges }
        : {}),
      ...(typeof input.rooms === 'number' ? { rooms: input.rooms } : {}),
    };
    return buildExpediaSearchUrl(expediaInput, getExpediaAffiliateConfig());
  }

  const res = resolveActiveStaySearch(input);
  return res.status === 'unavailable' ? null : res.url;
}

/**
 * Provider id string to thread into the `/r/[id]` affiliate payload
 * so click attribution records the correct destination partner.
 */
export function getActiveStayProviderId(): ActiveStayProvider {
  return getActiveStayProvider();
}
