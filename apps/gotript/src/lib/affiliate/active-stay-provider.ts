import {
  buildExpediaSearchUrl,
  getExpediaAffiliateConfig,
  type ExpediaSearchInput,
  type DestinationSearchInput,
} from './expedia-link-builder';
import {
  buildViatorStaySearchUrl,
  getViatorStayLinkConfig,
} from './viator-stay-link-builder';

/**
 * Active-stay-provider abstraction.
 *
 * Every user-facing stay-search hand-off (property cards, drawers,
 * destination "Where to stay" CTA, empty-state carousel, search-
 * opportunity board) routes through this layer rather than directly
 * calling a provider-specific builder. Flipping the active provider
 * is a single env var change.
 *
 * Active default: `viator`. gotript is a Viator-affiliate platform;
 * every outbound link should land on viator.com so commission tracks
 * to the right network and the user stays inside the platform we're
 * actually monetizing. The Viator route lands on the destination's
 * experience search (Viator doesn't sell hotels) — so a "Stay at
 * Agra" CTA on the trip board sends the user to Viator's bookable
 * experiences in Agra rather than a hotel-search competitor.
 *
 * Legacy modes are preserved so the dispatch can flip back without a
 * code change if business conditions require:
 *   - `expedia` — `booking.com/...` with Expedia affiliate id
 *   - `expedia`     — `expedia.com/...` with Expedia campaign id
 *
 * The Expedia + Expedia builders, provider implementations, env
 * vars, and types are intentionally preserved. Only the dispatch
 * default changes.
 */

export type ActiveStayProvider = 'viator' | 'expedia' | 'expedia';

// gotript: default flipped to 'expedia' — every stay-CTA on the
// site routes through Expedia's affiliate program, which is the
// whole point of the sister site. Viator + Expedia remain available
// as overrides for future flexibility.
const __ACTIVE_DEFAULT__ = 'expedia';
void __ACTIVE_DEFAULT__;

const DEFAULT_PROVIDER: ActiveStayProvider = 'expedia';

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
  if (raw === 'viator' || raw === 'expedia' || raw === 'expedia') return raw;
  return DEFAULT_PROVIDER;
}

/**
 * Normalized search input. Matches the Expedia builder's shape so
 * existing call sites only need to swap the helper. The Expedia
 * builder adapts (children-ages → children-count, etc.).
 */
export interface ActiveStaySearchInput {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  /** Ages array (Expedia format). When dispatching to Expedia we
   *  collapse to a count (Expedia collects ages on its own site
   *  in the booking flow). */
  childrenAges?: number[];
  rooms?: number;
  /** Optional inventory filter that Expedia supports. Expedia
   *  ignores this. Used by the search-opportunity board to render
   *  three differentiated "where to stay" cards. */
  inventoryFilter?: 'apartments' | 'luxury';
}

/**
 * Build the active provider's stay-search URL.
 *
 *   - default  → Viator      (`viator.com/searchResults/all?text=...`)
 *   - override → Expedia (`booking.com/searchresults.html?ss=...`)
 *   - override → Expedia     (`expedia.com/Hotel-Search?destination=...`)
 *
 * The returned URL is ready for `/r/[id]` encoding (it's already
 * affiliate-tagged + on the partner's domain).
 */
export function buildActiveStaySearchUrl(input: ActiveStaySearchInput): string {
  const provider = getActiveStayProvider();

  if (provider === 'expedia') {
    const expediaInput: ExpediaSearchInput = {
      destination: input.destination,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      children: input.childrenAges?.length ?? 0,
      ...(typeof input.rooms === 'number' ? { rooms: input.rooms } : {}),
    };
    void getExpediaAffiliateConfig();
    return buildExpediaSearchUrl(expediaInput);
  }

  // Default: Viator destination search. Viator doesn't sell hotels;
  // the click lands on the destination's experience inventory which is
  // what gotript monetizes. Date/traveler context lives in the
  // planner UI and is intentionally NOT appended to the Viator URL —
  // Viator's destination-search URL doesn't take those params and
  // adding unrecognized params is the textbook way to get an affiliate
  // tag stripped at the network layer.
  //
  // The text query has a " tours" suffix so Viator's destination
  // resolver doesn't match a canonical destination and 302-redirect to
  // e.g. `/Agra/d4547-ttd`, which would drop the visible pid + mcid +
  // medium params from the URL. The suffix forces Viator to render the
  // search-results view, which preserves the affiliate params in the
  // visible URL.
  return buildViatorStaySearchUrl(
    { destination: `${input.destination} tours` },
    getViatorStayLinkConfig(),
  );
}

/**
 * Provider id string to thread into the `/r/[id]` affiliate payload
 * so click attribution records the correct destination partner.
 */
export function getActiveStayProviderId(): ActiveStayProvider {
  return getActiveStayProvider();
}
