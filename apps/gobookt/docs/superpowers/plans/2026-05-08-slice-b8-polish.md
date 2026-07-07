# Slice B8 Implementation Plan - Polish (B-Series Follow-Ups)

> Executed inline, batched, only pausing for real blockers.

**Goal:** Pay down the "out of scope" items deferred across B1–B7 - the ones that turn into rough edges if left there for Slice C. Pick four with high user-visible payoff and small architectural surface.

**Scope:**
1. **B7.x** - `ModelClient.generate<T>` returns token counts so the IntentAgent (and any future `generate`-based agent) reports cost on the `/admin` dashboard.
2. **B3.x** - Resurfacing a saved trip primes the SessionStore with a synthetic turn record, so refining a resurfaced trip works end-to-end (currently silently 404s the priorTurn lookup).
3. **B5.x** - Per-provider circuit breaker on `BaseAffiliateProvider` so a misbehaving real provider doesn't repeatedly burn the cache miss + API call budget.
4. **B5.y** - Expedia provider reference impl, demonstrating that the B5 pattern + new circuit breaker scale to a second real partner without changes to the registry or fanout.

**Tech Stack:** No new deps.

---

## Architectural Tenets (Opus-level)

**1. The `Agent` contract stays invariant.**
B8.1 widens the `ModelClient.generate<T>` return so callers can opt into receiving usage info, without forcing existing call sites to change. Two flavors:
   - `generate<T>(req)` returns `T` (back-compat - every existing caller is unchanged)
   - `generateWithMeta<T>(req)` returns `{ result: T; modelMeta: { ... } }`
We could overload `generate` instead, but the explicit second method makes the cost-aware path obvious at call sites and keeps the type signature simple.

**2. Resurface server-priming is opportunistic, not authoritative.**
When the user clicks a saved trip, the workspace POSTs `/api/trips/[tripId]/resurface` which writes a synthetic `TurnRecord` to the SessionStore. If that POST fails, the resurface still proceeds locally - refine just won't work for that turn until the server catches up. Reason: the network shouldn't gate a UX action that has its own local fallback.

**3. Circuit breaker per-provider, not global.**
A failing Booking.com mustn't suppress Expedia. The breaker is an instance field on `BaseAffiliateProvider` - failure tracked per-instance. Three states (closed, open, half-open) with the standard timeout-based half-open transition.

**4. Expedia mirrors Booking.com structurally.**
Same files (`types.ts`, `client.ts`, `mapper.ts`, `index.ts`), same `fromEnv()` pattern, same shape. Anything that changed when adding a second provider exposes leak in the B5 base; the goal is for nothing to change. Reason: the value of the abstraction is proven by reuse, not by structure.

**5. Mock-safe is still the invariant.**
None of B8 changes the keyless dev experience. New env keys (`EXPEDIA_*`) are additive. Without them, Expedia is invisible to the registry.

---

## File Structure

**Create:**
- `src/providers/expedia/types.ts`, `client.ts`, `mapper.ts`, `index.ts`
- `src/providers/_shared/circuit-breaker.ts`
- `src/app/api/trips/[tripId]/resurface/route.ts`
- `tests/expedia-mapper.test.ts`
- `tests/circuit-breaker.test.ts`

**Modify:**
- `src/core/model-client.ts` - add `ModelMeta` type + `generateWithMeta` method
- `src/lib/ai/anthropic-client.ts` - implement `generateWithMeta` (read tokens from streaming response)
- `tests/helpers/mock-model-client.ts` - implement `generateWithMeta`
- `src/agents/intent-agent.ts` - call `generateWithMeta`, pass modelMeta to `recordAgentRun`
- `src/providers/_shared/affiliate-provider.ts` - wrap `fetchStays` with circuit breaker
- `src/providers/index.ts` - register Expedia
- `src/lib/env/get-server-features.ts` - add `providers.expedia`
- `src/features/workspace/saved-trips/saved-trips-panel.tsx` - call resurface endpoint before pushing local state
- `src/features/workspace/hooks/use-saved-trips.ts` - `resurface(tripId)` helper
- `.env.example` - Expedia keys

---

## Tasks

### Task 1: ModelClient generate-with-meta + IntentAgent

- [ ] Extend `ModelClient` interface with `generateWithMeta<T>(req): Promise<{ result: T; modelMeta: { model, tokensIn, tokensOut, cacheHit? } }>`. `generate` remains as a convenience wrapper.
- [ ] Update `AnthropicModelClient`: read tokens from the streaming finish chunk (already exposed as `final.usage`).
- [ ] Update `MockModelClient` test helper to implement `generateWithMeta` (returns synthetic tokens - call sites that don't care still work via the existing `generate`).
- [ ] Update `IntentAgent.run` to call `generateWithMeta`, pass `modelMeta` to `recordAgentRun`.
- [ ] Verify: existing 239 tests still pass; `/admin` shows cost for `intent` agent runs after a turn.

### Task 2: Resurface endpoint + workspace wiring

- [ ] `POST /api/trips/[tripId]/resurface` - owner-gated. Loads the trip via `getTrip`, returns 404 if not owned. Calls `sessionStore.putTurn` with a synthetic TurnRecord (turnId = trip.id, sessionId from auth, type 'compose', completedAt parsed from bookmarkedAt). Idempotent (putTurn overwrites).
- [ ] `useSavedTrips.resurface(tripId)` - fire-and-forget POST. Errors logged but don't throw.
- [ ] Update saved-trips-panel: `handleSelect` calls `resurface(trip.id)` BEFORE invoking `resurfaceSavedTrip`. The local state push doesn't wait for the POST (network never gates UX).
- [ ] Verify: typecheck + lint. Manual test: save a trip, click it from the panel, refine - refine should succeed instead of erroring on missing priorTurn.

### Task 3: Circuit breaker

- [ ] `circuit-breaker.ts` - `CircuitBreaker` class. Three states (closed, open, half-open), threshold + cooldown configurable, default: open after 5 consecutive failures, cooldown 30s, transition to half-open on first call after cooldown.
- [ ] `BaseAffiliateProvider`: hold a `CircuitBreaker` instance. `fetchStays` is wrapped - when open, return `[]` + log warning. Recovery: half-open trial; success → closed, failure → open with renewed cooldown.
- [ ] Tests: closed→open after threshold, open→half-open after cooldown, half-open→closed on success, half-open→open on failure, no-op when disabled.
- [ ] Verify: typecheck + lint + tests.

### Task 4: Expedia provider

- [ ] Mirror `booking-com/`: `types.ts` (Zod schema for Expedia EPS Rapid response subset), `client.ts` (HTTP request with `Authorization: Basic <base64(apiKey:secret)>` header), `mapper.ts` (Expedia property → Stay), `index.ts` (`ExpediaProvider extends BaseAffiliateProvider`, `fromEnv()`).
- [ ] Register in `src/providers/index.ts` alongside Booking.com.
- [ ] Add `EXPEDIA_API_KEY` + `EXPEDIA_SHARED_SECRET` to `.env.example`.
- [ ] `getServerFeatures().providers.expedia` flag.
- [ ] Mapper test (mirrors booking-com-mapper).
- [ ] Verify: typecheck + lint + tests + with both Expedia + Booking.com env keys, both register and `routeProviders` returns both.

### Task 5: Pipeline + changelog + tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-b8.md`.
- [ ] Tag `slice-b8`.

---

## What stays unchanged

- `OrchestratorEvent` shape - no new event kinds
- LangGraph engine - same nodes, same edges
- Auth, session store, share links, redirect, destinations - all from B1-B7 unchanged
- Existing 239 tests - all should still pass

## Out of B8 scope (will not address)

- Real-provider stay augmentation on `/destinations/[slug]` (B6.x) - punted; nice-to-have, not blocking
- Click migration on sign-in (B-late) - append-only records intentionally don't migrate; keeping anon click rows accurately reflects who clicked when
- Stripe / pgvector / MonitoringAgent - Slice C territory
