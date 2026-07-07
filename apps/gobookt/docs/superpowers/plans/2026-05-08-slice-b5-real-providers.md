# Slice B5 Implementation Plan - Real Provider Integrations

> Executed inline, batched, only pausing for real blockers.

**Goal:** Make the system ready to plug in real provider APIs (Booking.com, Expedia, Vrbo, Hotelbeds) without breaking the keyless dev experience. Ship a reference real-provider implementation pattern, an availability-aware registry, response caching, and multi-provider fanout merging - all mock-safe.

**Architecture:** A `BaseAffiliateProvider` abstract class encapsulates the boring concerns (HTTP, retry, timeout, caching, error wrapping). One concrete reference provider - `BookingComProvider` - extends it. The provider self-registers only when its env keys are present; without keys it's invisible to the router and the existing MockItaly + LLMSynthesized providers keep handling everything (current Slice A behavior unchanged). When a real provider is available + covers the destination, the router fans out, merges results by `(providerId, nativeId)`, and lets the orchestrator rank.

**Tech Stack:** No new deps. Uses the standard fetch + AbortSignal. In-memory LRU cache (no Redis yet - that's a B-late or C concern).

---

## Architectural Tenets (Opus-level)

**1. Availability is per-instance, not per-class.**
A `BookingComProvider` instance is constructed by the registry only when `BOOKING_COM_AFFILIATE_ID` + `BOOKING_COM_API_KEY` are both set. Without them, the class isn't instantiated - the registry doesn't expose it. Reason: cleaner than "real provider returns empty result"; the router never sees an unhealthy provider, so failure modes are fewer.

**2. Real providers always have HTTP + mapper + cache.**
The base class encapsulates these. A new provider is a thin subclass: declare endpoint, declare auth header, declare response → Stay mapper. Everything else is inherited.

**3. Cache is aggressive but bounded.**
30-minute TTL on availability, keyed on canonical query hash. In-memory LRU (max 500 entries per provider). Misses fall through to the API; hits skip the call entirely. This isn't perfect (a price change within 30 min won't surface) but matches industry norms for hotel meta-search.

**4. Router fanout is parallel + merge.**
When multiple providers can serve a destination, run them in parallel via `Promise.allSettled` (one provider's outage shouldn't stall the trip). Merge by `(providerId, nativeId)`; the same hotel from two providers stays as two entries (different prices/affiliate links). The orchestrator's existing ranking handles ordering.

**5. Capabilities drive routing.**
Each provider declares `regions: string[]` (ISO 3166 alpha-2). The router checks `intent.destinations[0].country` against capabilities. Mock providers cover everything (catch-all); real providers cover what the API can fulfill.

**6. Mock-safe is the invariant.**
Without ANY real provider keys, the app behaves identically to Slice B4 (MockItaly + LLMSynthesized handle everything). Setting one key flips one provider on; setting all keys flips all on. No graceful-degradation paths to maintain - providers either exist or don't.

**7. Affiliate URLs go through the existing /api/go redirect.**
Real providers produce `Stay.bookingLink.url` exactly as B4 expects; the redirect allowlist already covers booking.com, expedia.com, vrbo.com, hotelbeds.com. Adding a provider doesn't require new redirect plumbing - just an allowlist entry if the host is new.

---

## File Structure

**Create:**
- `src/providers/_shared/cache.ts` - `LRUCache<K, V>` with TTL + max size
- `src/providers/_shared/http.ts` - `httpJson(url, init)` - fetch wrapper with retry + AbortSignal handling
- `src/providers/_shared/canonical-query.ts` - stable hash of `ProviderSearchQuery` for cache keys
- `src/providers/_shared/affiliate-provider.ts` - `BaseAffiliateProvider` abstract class
- `src/providers/booking-com/index.ts` - `BookingComProvider` class + factory
- `src/providers/booking-com/client.ts` - HTTP client for Booking.com Demand API
- `src/providers/booking-com/mapper.ts` - Booking.com response → `Stay`
- `src/providers/booking-com/fixtures/sample-response.json` - for mapper tests
- `tests/cache.test.ts`
- `tests/canonical-query.test.ts`
- `tests/booking-com-mapper.test.ts`
- `tests/provider-registry.test.ts` - availability-aware routing

**Modify:**
- `src/providers/index.ts` - availability-aware registry + multi-provider fanout
- `.env.example` - new optional vars for each real provider
- `src/lib/env/get-server-features.ts` - surface per-provider availability for diagnostics

**Untouched:** `mock-italy/`, `llm-synthesized/`, the orchestrator, the LangGraph engine, the trip routes - all keep working unchanged.

---

## Tasks

### Task 1: Shared infrastructure (cache + http + canonical-query)

- [ ] `cache.ts`: `LRUCache<K, V>` class with `get(k)`, `set(k, v, ttlMs)`, internal Map + access-order linked list. Eviction on `size > max`.
- [ ] `canonical-query.ts`: `canonicalizeQuery(q): string` - sorts arrays + drops noisy fields, JSON.stringify. Stable across runs.
- [ ] `http.ts`: `httpJson<T>(url, {method, body?, headers?, signal, timeoutMs?})` - fetch + AbortController + 1 retry on 5xx + parses JSON. Throws `ProviderError` subclasses.
- [ ] Tests: cache eviction + TTL, canonical-query stability, http retry behavior.
- [ ] Verify: typecheck.

### Task 2: BaseAffiliateProvider + BookingComProvider

- [ ] `affiliate-provider.ts`: `abstract class BaseAffiliateProvider implements Provider`. Holds `cache: LRUCache`, `id`, `displayName`, `capabilities`. `search()` is concrete: canonical-key → cache lookup → cache miss runs `fetchStays(q, ctx)` (abstract) → maps via `mapResponse` (abstract) → returns `ProviderSearchResult`. Subclasses just implement the two abstracts.
- [ ] `booking-com/client.ts`: `searchAvailability(query, secrets, signal)` calls Booking.com's Demand API endpoint with affiliate id + api key. Returns the raw response shape (typed via Zod for validation).
- [ ] `booking-com/mapper.ts`: `mapBookingResponse(raw, affiliateId): Stay[]` - converts Booking.com's hotel/property fields to our `Stay`. Builds the affiliate URL with the affiliate id baked in.
- [ ] `booking-com/index.ts`: `BookingComProvider` class extending `BaseAffiliateProvider`. Implements `fetchStays + mapResponse` by composing client + mapper. `BookingComProvider.fromEnv()` static factory: returns instance if both env keys present, else null.
- [ ] Tests: mapper transforms a fixture correctly; BookingComProvider.fromEnv() returns null without keys.
- [ ] Verify: typecheck.

### Task 3: Availability-aware registry + multi-provider router

- [ ] `src/providers/index.ts` rework:
  - `buildProviderRegistry()` - checks env, instantiates available real providers, returns `{providersByRegion: Map<countryCode, Provider[]>, allProviders: Provider[]}`. Mock providers always included.
  - `routeProvider(intent)` - backward compat: returns single Provider for the orchestrator's current `provider.search()` call.
  - `routeProviders(intent)` - NEW: returns array of Providers covering the destination (mocks + any real provider whose `capabilities.regions` includes the country).
  - `searchWithFanout(providers, query, ctx)` - NEW: `Promise.allSettled` fanout, merges by `(providerId:nativeId)`, badges merged. Used by the orchestrator when multi-provider routing matters (Slice C will adopt; B5 ships the helper).
- [ ] `createDefaultProviderRouter(modelClient)` - keep API stable but consult the new registry. Mock-safe: no keys = current Slice A/B behavior.
- [ ] Tests: registry omits real provider without keys, includes it with keys (env-mock); fanout merges correctly; router falls through.
- [ ] Verify: typecheck + lint.

### Task 4: Env, features surface, allowlist verification

- [ ] `.env.example`: add commented `BOOKING_COM_AFFILIATE_ID` + `BOOKING_COM_API_KEY` block with a note that adding both turns on the provider.
- [ ] `getServerFeatures()`: add `providers: { bookingCom: boolean }` (extensible - new providers add here).
- [ ] Verify the existing affiliate allowlist already covers `booking.com` (it does - added in B4).
- [ ] Verify: typecheck.

### Task 5: Pipeline + changelog + tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-b5.md`.
- [ ] Commit at logical milestones. Tag `slice-b5`.

---

## What stays unchanged

- `OrchestratorEvent` shape - no new event kinds.
- `Provider` interface - no breaking changes; capabilities just get a richer `regions` list.
- LangGraph engine - same provider-search node.
- Auth, persistence, share links, redirect - all from B1-B4 unchanged.

## Out of B5 scope (explicit)

- Real Expedia, Vrbo, Hotelbeds, Skyscanner, Viator providers. Pattern is reusable; concrete impls land per-partner-approval as keys arrive.
- Per-provider rate limit budget. The cache + provider-side rate limits are good enough for v1.
- Distributed cache (Redis). In-memory works for one-pod dev; B-late or C handles multi-pod.
- Provider health metrics + circuit breaker. The fanout's `Promise.allSettled` already isolates failures.
