import type { TripIntent } from '@core/trip-intent';
import type { SearchOpportunity, SearchOpportunityProvider } from '@core/search-opportunity';
import {
  buildViatorStaySearchUrl,
  getViatorStayLinkConfig,
  type ViatorStayLinkConfig,
} from './viator-stay-link-builder';
import { isAllowedAffiliateHost } from './allowlist';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import type { ExperienceProvider } from '@core/experience-provider';

/**
 * Build a SearchOpportunity from intent.
 *
 * Emitted when the orchestrator decides the destination isn't backed
 * by real or curated inventory. Instead of synthesizing fake property
 * listings, we surface three affiliate cards prefilled with the user's
 * intent. Click → /r/[id] → real Viator URL with the affiliate pid
 * attached.
 *
 * Three slots in display order:
 *
 *   1. `viator-top`        - "Top experiences" — broad query
 *   2. `viator-day-trips`  - "Day trips"       — "day trip from {dest}"
 *   3. `viator-food`       - "Food & cooking"  — "{dest} food tour"
 *
 * URL strategy (two paths, both Viator-safe):
 *
 *   PRIMARY (when VIATOR_API_KEY + VIATOR_PARTNER_ID configured) —
 *   call Viator's `/search/freetext` for each slot's query and use the
 *   first product's `productUrl` as the slot URL. Viator's API embeds
 *   the partner pid into `productUrl` server-side via the
 *   `campaign-value` request param. These URLs are canonical product
 *   pages — Viator never 302-redirects them to a destination canonical,
 *   so the pid stays visible end-to-end and commission attribution is
 *   guaranteed.
 *
 *   FALLBACK (no API key, or the API call fails) — use the
 *   manually-constructed `viator.com/searchResults/all?text=...` URL
 *   from the link builder. The visitor still lands on Viator but the
 *   pid may get stripped if Viator's destination resolver matches the
 *   query and 302-redirects to a destination canonical.
 *
 * The Booking.com / Expedia / Vrbo / Hotels.com URL builders are
 * preserved in sibling files and reachable via the
 * active-stay-provider abstraction if/when we want to flip the
 * generic stay-search routing back.
 */

export interface BuildSearchOpportunityArgs {
  intent: TripIntent;
  /** Optional one-line editorial line about the destination. */
  flavor?: string;
  /**
   * Optional Viator provider. When set, each slot's URL comes from a
   * live `productUrl` so the partner pid is guaranteed to be present
   * (Viator embeds it server-side in the response). When unset,
   * slots fall back to the constructed search URL.
   */
  viatorProvider?: ExperienceProvider | null;
  /**
   * Abort signal forwarded to Viator API calls. The opportunity builder
   * must not delay the canvas; if the user navigates away or the turn
   * gets cancelled, in-flight Viator calls abort with everyone else.
   * When omitted, a 4-second internal budget is enforced so a slow
   * Viator call never blocks the search.opportunity.ready emit.
   */
  signal?: AbortSignal;
}

const SLOT_BUDGET_MS = 4000;

export async function buildSearchOpportunity(
  args: BuildSearchOpportunityArgs,
): Promise<SearchOpportunity> {
  const config = getViatorStayLinkConfig();
  const intent = args.intent;
  const dest = intent.destinations[0];
  if (!dest) {
    throw new Error('buildSearchOpportunity: intent has no destinations');
  }

  const { checkIn, checkOut } = resolveDates(intent);
  const adults = Math.max(1, intent.travelers.adults);
  const children = Math.max(0, intent.travelers.children.count);

  const slots: SlotDescriptor[] = [
    {
      providerId: 'viator-top',
      searchTerm: `${dest.name} tours`,
      fallbackText: `${dest.name} tours`,
      hint: 'Bookable tours, tickets, and experiences.',
    },
    {
      providerId: 'viator-day-trips',
      searchTerm: `day trip from ${dest.name}`,
      fallbackText: `day trip from ${dest.name}`,
      hint: `Bookable day-trip options from ${dest.name}.`,
    },
    {
      providerId: 'viator-food',
      searchTerm: `${dest.name} food tour`,
      fallbackText: `${dest.name} food tour`,
      hint: 'Food tours, tastings, cooking classes, market visits.',
    },
  ];

  // Fire all three Viator calls in parallel. Each falls back
  // independently — a slow or failed call on one slot doesn't drag
  // down the others. The whole batch is bounded by SLOT_BUDGET_MS so
  // a slow Viator never delays the canvas more than 4 seconds.
  const providers = await Promise.all(
    slots.map((slot) =>
      resolveSlotUrl(slot, {
        viatorProvider: args.viatorProvider ?? null,
        signal: args.signal,
        config,
      }),
    ),
  );

  const photo = resolveDestinationPhoto({
    name: dest.name,
    country: dest.country,
    ...(dest.region ? { region: dest.region } : {}),
  });

  return {
    destination: {
      name: dest.name,
      country: dest.country,
      ...(dest.region ? { region: dest.region } : {}),
    },
    intentDigest: {
      vibeTags: intent.vibe.tags,
      checkIn,
      checkOut,
      adults,
      children,
    },
    providers,
    ...(args.flavor && args.flavor.trim().length > 0 ? { flavor: args.flavor.trim() } : {}),
    photoUrl: photo.url,
    photoAlt: photo.alt,
    photoCredit: photo.credit,
    fetchedAt: new Date().toISOString(),
  };
}

// ============== per-slot resolution ==============

type SlotProviderId = 'viator-top' | 'viator-day-trips' | 'viator-food';

interface SlotDescriptor {
  providerId: SlotProviderId;
  /** Query passed to Viator's /search/freetext for this slot. */
  searchTerm: string;
  /** `text=` value when falling back to a constructed search URL. */
  fallbackText: string;
  hint: string;
}

interface SlotResolutionContext {
  viatorProvider: ExperienceProvider | null;
  signal: AbortSignal | undefined;
  config: ViatorStayLinkConfig;
}

async function resolveSlotUrl(
  slot: SlotDescriptor,
  ctx: SlotResolutionContext,
): Promise<SearchOpportunityProvider> {
  const productUrl = await tryFetchProductUrl(slot.searchTerm, ctx);
  if (productUrl) {
    return {
      providerId: slot.providerId,
      displayName: 'Viator',
      url: productUrl,
      hint: slot.hint,
    };
  }
  // Fallback: constructed search URL. The pid may get stripped by
  // Viator's redirect, but at least the visitor lands on Viator.
  const url = buildViatorStaySearchUrl({ destination: slot.fallbackText }, ctx.config);
  return {
    providerId: slot.providerId,
    displayName: 'Viator',
    url,
    hint: slot.hint,
  };
}

/**
 * Call Viator's API for the top product matching `searchTerm`. Returns
 * the product's `affiliate.url` (the API-embedded productUrl with pid
 * baked in) on success, or null on any failure path.
 *
 * Failures we silently fall back from:
 *   - API key not configured (viatorProvider is null)
 *   - Network error / timeout / abort
 *   - Response has zero results
 *   - Top product has no usable affiliate URL or the URL is off-host
 *
 * Falling back to the constructed search URL is always safe — it lands
 * on viator.com either way.
 */
async function tryFetchProductUrl(
  searchTerm: string,
  ctx: SlotResolutionContext,
): Promise<string | null> {
  const provider = ctx.viatorProvider;
  if (!provider) return null;

  const slotController = new AbortController();
  const timer = setTimeout(() => slotController.abort(new Error('slot timeout')), SLOT_BUDGET_MS);
  const parentAbort = () => slotController.abort(ctx.signal!.reason);
  if (ctx.signal) {
    if (ctx.signal.aborted) {
      clearTimeout(timer);
      return null;
    }
    ctx.signal.addEventListener('abort', parentAbort);
  }

  try {
    const result = await provider.search(
      { searchTerm, limit: 1 },
      { signal: slotController.signal, secrets: {} },
    );
    const top = result.experiences[0];
    if (!top) return null;
    const url = top.affiliate?.url ?? '';
    if (!url) return null;
    // Defence in depth — the allowlist also runs in the redirect
    // handler, but rejecting an off-host URL here means we fall back
    // to the constructed search URL on this surface too.
    if (!isAllowedAffiliateHost(url)) return null;
    return url;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    if (ctx.signal) ctx.signal.removeEventListener('abort', parentAbort);
  }
}

// ============== helpers ==============

function resolveDates(intent: TripIntent): { checkIn: string; checkOut: string } {
  if (intent.dates.kind === 'specific') {
    return { checkIn: intent.dates.start, checkOut: intent.dates.end };
  }
  // Same fallback used elsewhere in the app (booking-agent, drawers,
  // empty-state): today + 30 days check-in, +nights check-out.
  const nights = intent.duration.nights > 0 ? intent.duration.nights : 5;
  const today = new Date();
  const checkIn = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const checkOut = new Date(checkIn.getTime() + nights * 24 * 60 * 60 * 1000);
  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  };
}
