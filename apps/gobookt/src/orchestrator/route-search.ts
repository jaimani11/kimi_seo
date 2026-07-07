import type { Provider } from '@core/provider';
import type { Destination, TripIntent } from '@core/trip-intent';

/**
 * Slice F1 - Route decision: real inventory vs search opportunity.
 *
 * StayScout's promise: we do not synthesize fake hotel cards. Either we
 * have inventory worth showing (a real provider that serves the region)
 * or we surface the next-best thing - a `SearchOpportunity` with
 * prefilled affiliate-search URLs to Expedia/Vrbo/Hotels.com plus a
 * live Viator "Things to do" rail on the canvas.
 *
 * This module owns that decision. It looks at:
 *
 *   - the destination on the intent (or absence thereof)
 *   - which real providers are available in the supplied registry
 *
 * and returns one of two shapes:
 *
 *   - `{ kind: 'inventory', providers }` - go down the existing
 *     `proposal.ready` path with these providers (in order). Caller
 *     fanouts them as before.
 *   - `{ kind: 'opportunity', destination }` - go down the
 *     `search.opportunity.ready` path. No provider search runs.
 *
 * Slice H2 removed the MockItalyProvider fallback. The opportunity
 * branch now covers every destination not served by a real stay
 * provider, with live Viator experiences rendered alongside the
 * partner-search cards.
 *
 * `LLMSynthesizedProvider` is intentionally excluded from the inventory
 * path here - it produces fake stays, which is the exact thing F1 is
 * killing. The class stays in the codebase (dormant) so we can revive
 * it if/when we want LLM-only preview mode.
 */

export type RouteDecision =
  | { kind: 'inventory'; providers: Provider[] }
  | { kind: 'opportunity'; destination: Destination };

export interface RouteRegistry {
  /** Real (env-keyed) providers in the registry. */
  real: Provider[];
}

/**
 * Decide whether to fanout real/curated providers or to surface a
 * SearchOpportunity for the first destination on the intent.
 *
 * The decision is deliberately conservative: we only take the inventory
 * path when we can name a provider whose footprint covers the
 * destination. Anything else routes to opportunity - including the
 * "no destination at all" case (the UI shows a gentle empty state via
 * the existing concierge.message flow downstream, not here).
 */
export function routeForIntent(intent: TripIntent, registry: RouteRegistry): RouteDecision {
  const destination = intent.destinations[0];

  // No destination → no provider can serve it. The orchestrator will
  // emit a concierge.message and stop; we just default to opportunity
  // so the type stays a discriminated union (the caller checks the
  // destination separately).
  if (!destination) {
    return {
      kind: 'opportunity',
      destination: {
        kind: 'synthesized',
        name: 'Unknown destination',
        country: 'US',
      },
    };
  }

  const matchedReal = matchRealProviders(destination, registry.real);
  if (matchedReal.length > 0) {
    return { kind: 'inventory', providers: matchedReal };
  }

  return { kind: 'opportunity', destination };
}

/**
 * Filter real providers by region capability. A provider with
 * `regions: undefined` is treated as global (matches every country).
 */
function matchRealProviders(destination: Destination, providers: Provider[]): Provider[] {
  const country = destination.country.toUpperCase();
  const matched: Provider[] = [];
  for (const p of providers) {
    const regions = p.capabilities.regions;
    if (!regions || regions.includes(country)) {
      matched.push(p);
    }
  }
  return matched;
}
