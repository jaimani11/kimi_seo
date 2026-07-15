import {
  buildViatorStaySearchUrl,
  getViatorStayLinkConfig,
} from './viator-stay-link-builder';
import { buildExpediaCategoryUrl } from './expedia-multicategory';

/**
 * Active-stay-provider abstraction.
 *
 * Every user-facing stay-search hand-off (property cards, drawers,
 * destination "where to stay" CTA, empty-state carousel, search-
 * opportunity board) routes through this layer rather than calling a
 * provider-specific builder directly. Flipping the active provider is a
 * single env-var change.
 *
 * Active default: `vrbo`. stayviaowner is a Vrbo whole-home rental brand,
 * so every stay CTA lands on vrbo.com's vacation-rental search — wrapped
 * through Partnerize (`prf.hn/click/camref:…`), the same affiliate program
 * and camref the rental-matrix pages already use, and the highest-
 * commission inventory in the Expedia Group family. `viator` and `expedia`
 * remain available as env overrides for future flexibility.
 */

export type ActiveStayProvider = 'viator' | 'expedia' | 'vrbo';

const DEFAULT_PROVIDER: ActiveStayProvider = 'vrbo';

/**
 * Read the active stay-search provider from env. Reads at call time (not
 * module load) so a config flip + reload picks up immediately. Both
 * server- and client-safe (the `NEXT_PUBLIC_*` prefix).
 */
export function getActiveStayProvider(): ActiveStayProvider {
  const raw = (process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'viator' || raw === 'expedia' || raw === 'vrbo') return raw;
  return DEFAULT_PROVIDER;
}

/**
 * Normalized search input. Matches the Expedia builder's shape so call
 * sites only need to swap the helper.
 */
export interface ActiveStaySearchInput {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  /** Ages array. Collapsed to a count when dispatching to Vrbo/Expedia
   *  (both collect exact ages in their own booking flow). */
  childrenAges?: number[];
  rooms?: number;
  /** Optional inventory filter used by the search-opportunity board to
   *  render differentiated "where to stay" cards. */
  inventoryFilter?: 'apartments' | 'luxury';
}

/**
 * Build the active provider's stay-search URL.
 *
 *   - default  → Vrbo    (`prf.hn/click/…/vrbo.com/search?destination=…`)
 *   - override → Viator  (`viator.com/searchResults/all?text=…`)
 *   - override → Expedia (`expedia.com/Hotel-Search?destination=…`)
 *
 * The returned URL is affiliate-tagged + on an allowlisted partner host,
 * ready for `/r/[id]` encoding.
 */
export function buildActiveStaySearchUrl(input: ActiveStaySearchInput): string {
  const provider = getActiveStayProvider();

  if (provider === 'expedia') {
    // Route through the shared Partnerize builder so the Expedia hotel handoff
    // is wrapped in prf.hn/camref (tracked), never a plain untracked expedia.com URL.
    return buildExpediaCategoryUrl('hotels', {
      destination: input.destination,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      children: input.childrenAges?.length ?? 0,
      ...(typeof input.rooms === 'number' ? { rooms: input.rooms } : {}),
    });
  }

  if (provider === 'viator') {
    // Viator doesn't sell stays; the click lands on the destination's
    // experience inventory. The " tours" suffix forces the search-results
    // view so the affiliate params survive in the visible URL.
    return buildViatorStaySearchUrl(
      { destination: `${input.destination} tours` },
      getViatorStayLinkConfig(),
    );
  }

  // Default: Vrbo vacation-rental search. Reuses the same category builder
  // (and Partnerize camref) as the rental-matrix pages, so concierge /
  // workspace stays monetize through the exact Vrbo program the rest of the
  // site uses — on-brand for a whole-home rental site.
  return buildExpediaCategoryUrl('vacation-rentals', {
    destination: input.destination,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    children: input.childrenAges?.length ?? 0,
    ...(typeof input.rooms === 'number' ? { rooms: input.rooms } : {}),
  });
}

/**
 * Provider id string to thread into the `/r/[id]` affiliate payload so
 * click attribution records the correct destination partner.
 */
export function getActiveStayProviderId(): ActiveStayProvider {
  return getActiveStayProvider();
}
