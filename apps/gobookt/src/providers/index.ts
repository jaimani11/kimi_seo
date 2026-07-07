// Layer: providers
// Deps: core, lib

import type {
  Provider,
  ProviderBadge,
  ProviderContext,
  ProviderSearchQuery,
  ProviderSearchResult,
} from '@core/provider';
import type { ProviderId } from '@core/ids';
import type { Stay } from '@core/stay';
import type { TripIntent } from '@core/trip-intent';
import type { ModelClient } from '@core/model-client';
import { LLMSynthesizedProvider, LLMSynthesizedProviderStub } from './llm-synthesized';
import { BookingComProvider } from './booking-com';
import { ExpediaProvider } from './expedia';
import { VrboProvider } from './vrbo';

/**
 * Availability-aware registry.
 *
 *   - Real providers self-register via their `fromEnv()` factory; if
 *     keys are missing, the factory returns null and the registry
 *     skips them. No "half configured" provider ever reaches the
 *     router.
 *   - `LLMSynthesizedProvider` is the keyless-dev floor, kept dormant
 *     for the foreseeable future and surfaced only when explicitly
 *     opted in via env.
 *   - The router asks the registry for "providers that can serve this
 *     destination," which combines geographic capability + availability.
 *
 * Slice H2 removed `MockItalyProvider` and its fake Italian villa data
 * from the registry entirely. Destinations without a real provider now
 * fall through to the search-opportunity branch (partner cards + live
 * Viator experiences), never to fabricated inventory.
 *
 * The registry is built lazily on first access so changing env vars in
 * tests works without process restart. Production captures it once;
 * the cost of rebuilding is negligible.
 */

interface Registry {
  /** All available providers, in priority order (mocks last). */
  all: Provider[];
  /** Real (env-keyed) providers only - for diagnostics. */
  real: Provider[];
  /** Mock providers - always present. */
  mocks: Provider[];
}

// Process-global anchor - see comment in src/lib/session/factory.ts.
declare global {
  var __stayscoutProviderRegistry: Registry | undefined;
}

export function buildProviderRegistry(modelClient?: ModelClient): Registry {
  if (globalThis.__stayscoutProviderRegistry) return globalThis.__stayscoutProviderRegistry;

  const real: Provider[] = [];
  const bookingCom = BookingComProvider.fromEnv();
  if (bookingCom) real.push(bookingCom);
  const expedia = ExpediaProvider.fromEnv();
  if (expedia) real.push(expedia);
  const vrbo = VrboProvider.fromEnv();
  if (vrbo) real.push(vrbo);
  // Future providers slot in here (Hotelbeds, Agoda, ...) - same pattern.

  const llmProvider = modelClient
    ? new LLMSynthesizedProvider(modelClient)
    : LLMSynthesizedProviderStub;

  const mocks: Provider[] = [llmProvider];
  globalThis.__stayscoutProviderRegistry = { all: [...real, ...mocks], real, mocks };
  return globalThis.__stayscoutProviderRegistry;
}

/** Test-only - drop the cached registry so env changes take effect. */
export function _resetProviderRegistryForTesting(): void {
  globalThis.__stayscoutProviderRegistry = undefined;
}

/**
 * Diagnostic surface - what real providers are wired right now.
 * Feature flags in `getServerFeatures()` use this.
 */
export function listAvailableRealProviders(): string[] {
  return buildProviderRegistry().real.map((p) => p.id as string);
}

// ============== Routing ==============

/**
 * Single-provider router (back-compat). Picks the most-specific
 * available provider for the destination - real providers first;
 * `LLMSynthesizedProviderStub` only as a last-resort dormant floor.
 */
export function routeProvider(intent: TripIntent, modelClient?: ModelClient): Provider {
  const list = routeProviders(intent, modelClient);
  return list[0] ?? LLMSynthesizedProviderStub;
}

/**
 * Fanout list. Returns every provider that can serve the destination -
 * caller can run them in parallel via `searchWithFanout`.
 *
 * Slice H2: mock-italy is no longer in the registry, so the only
 * possible results are real env-keyed providers plus the dormant
 * LLMSynthesized fallback at the end.
 */
export function routeProviders(intent: TripIntent, modelClient?: ModelClient): Provider[] {
  const reg = buildProviderRegistry(modelClient);
  const dest = intent.destinations[0];
  if (!dest) {
    const llm = reg.mocks[reg.mocks.length - 1];
    return llm ? [llm] : [];
  }

  const result: Provider[] = [];

  // Real providers whose capabilities cover this region (or are global -
  // `regions` undefined means global).
  for (const p of reg.real) {
    const regions = p.capabilities.regions;
    if (!regions || regions.includes(dest.country.toUpperCase())) {
      result.push(p);
    }
  }

  // LLM synthesized as final fallback (always available, dormant by
  // default - actually serves only if explicitly enabled).
  const llm = reg.mocks[reg.mocks.length - 1];
  if (llm) result.push(llm);

  return result;
}

/**
 * Production factory - same shape as Slice A, but consults the new
 * registry. Mock-safe: with no real-provider keys, behavior is
 * identical to the previous slice.
 */
export function createDefaultProviderRouter(
  modelClient: ModelClient,
): (intent: TripIntent) => Provider {
  return (intent) => routeProvider(intent, modelClient);
}

// ============== Fanout helper ==============

/**
 * Run multiple providers in parallel and merge results. One provider's
 * failure doesn't stall the others (Promise.allSettled). Stays are
 * deduped by id (`{providerId}:{nativeId}`) so the same hotel from two
 * sources still surfaces twice if the providerIds differ - the
 * proposal builder handles ranking.
 *
 * Slice C will adopt this for true multi-source comparison; B5 ships
 * the helper so it's ready.
 */
export async function searchWithFanout(
  providers: Provider[],
  query: ProviderSearchQuery,
  ctx: ProviderContext,
): Promise<ProviderSearchResult> {
  if (providers.length === 0) {
    return {
      stays: [],
      badges: [],
      freshness: {
        fetchedAt: new Date().toISOString(),
        dataMaxAgeMs: 0,
        source: 'live',
      },
    };
  }
  const results = await Promise.allSettled(providers.map((p) => p.search(query, ctx)));

  const seen = new Set<string>();
  const stays: Stay[] = [];
  const badges: ProviderBadge[] = [];
  let earliestFetched = Date.now();
  let allCached = true;

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const stay of r.value.stays) {
      if (seen.has(stay.id)) continue;
      seen.add(stay.id);
      stays.push(stay);
    }
    badges.push(...r.value.badges);
    const fetchedAt = Date.parse(r.value.freshness.fetchedAt);
    if (fetchedAt < earliestFetched) earliestFetched = fetchedAt;
    if (r.value.freshness.source !== 'cached') allCached = false;
  }

  return {
    stays,
    badges,
    freshness: {
      fetchedAt: new Date(earliestFetched).toISOString(),
      dataMaxAgeMs: 30 * 60 * 1000,
      source: allCached ? 'cached' : 'live',
    },
  };
}

// ============== Re-exports ==============

export const ProviderRegistry: Readonly<Record<string, Provider>> = {
  'llm-synthesized': LLMSynthesizedProviderStub,
};

export function getProvider(id: ProviderId | string): Provider | null {
  return ProviderRegistry[id] ?? null;
}

export { LLMSynthesizedProvider, LLMSynthesizedProviderStub } from './llm-synthesized';
export { BookingComProvider } from './booking-com';
export { ExpediaProvider } from './expedia';
export { VrboProvider } from './vrbo';
