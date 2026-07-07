# Slice C2 Implementation Plan - MonitoringAgent (saved-trip watcher)

> Executed inline, batched, only pausing for real blockers.

**Goal:** Saved trips become living. When the price drops, availability changes, or a featured stay opens up at a destination, the saved-trips panel surfaces a small badge on the row ("↓ 12% since saved", "New top match"). Mock-safe end-to-end - the dev demo produces visible, deterministic monitoring events without real providers or DB.

**Architecture:** A `MonitoringStore` interface owns persistence (snapshot per trip + event log). A `MonitoringChecker` decides what counts as a material change; in C2 it ships as a deterministic synthetic generator (real provider re-search + diff lands in C2.x when real providers are stable). A `MonitoringRunner` is the on-demand entry point - called from `/api/trips/list`, it iterates the user's trips, runs the checker for any that's due, persists events, and returns the enriched trip list. The saved-trips UI grows a badge. An `acknowledge` endpoint marks events seen.

**Tech Stack:** No new deps.

---

## Architectural Tenets (Opus-level)

**1. Pull, not push.** No WebSockets, no Server-Sent Events, no background scheduler. The runner triggers on `/api/trips/list` calls. Reason: serverless-friendly (Vercel cron is a B-late upgrade), demo works without process-level singletons, and the user-perceived experience ("I refreshed and it has updates") is correct without infra.

**2. The checker is real OR mock, behind one interface.** `MonitoringChecker` has two impls: `RealMonitoringChecker` (re-runs `provider.search`, diffs against the saved proposal) and `MockMonitoringChecker` (deterministic synthetic events seeded on `(trip.id, last-check-time)`). In C2 we ship only the mock; the real path lands in C2.x when real provider keys + cache invalidation behavior are tuned. Both share the interface so the factory swap is one line.

**3. Trip-scoped due-check throttling.** A trip is "due" if `lastMonitoredAt` is older than `MONITORING_INTERVAL_MS` (default 60s). Newly-saved trips: snapshotted at save time, first check fires on the next list-fetch ≥ 60s later. Reasoning: opening the panel within a second of saving shouldn't generate a synthetic "look, the price moved" event (confusing). 60s is the demo cadence; production overrides via `STAYSCOUT_MONITORING_INTERVAL_MS`.

**4. Event budget.** Each check produces 0 or 1 event. Reason: a single visible badge per row keeps the UI calm; if multiple things changed, the checker picks the most user-relevant one. Mock checker uses a weighted lottery (price-drop most common, hero-unavailable rare).

**5. Owner-scoped, append-only.** Events are owned by the trip's owner (`{ownerKind, ownerId}` from B1). They never delete; `acknowledged` flips to true on user interaction. Audit trail for B-late admin views.

**6. Mock-safe is the invariant.** Without any env keys / DB, the runner runs in-memory; checker produces synthetic events; UI shows badges. Adding `DATABASE_URL` would in C2.x persist events; adding real provider keys would in C2.x switch the checker to real diffing. The behavior visible to the user is unchanged.

**7. Failure isolation.** A check that throws never blocks the trips list response - the runner catches per-trip, logs, and continues. The user always gets their trips, possibly without fresh monitoring data. (Same B4/B7 pattern: telemetry/auxiliary side effects never block the user-visible path.)

---

## File Structure

**Create:**
- `src/lib/monitoring/types.ts` - `MonitoringEvent`, `MonitoringSnapshot`, `MonitoringEventKind`
- `src/lib/monitoring/monitoring-store.ts` - interface
- `src/lib/monitoring/in-memory-monitoring-store.ts` - impl
- `src/lib/monitoring/checker.ts` - `MonitoringChecker` interface + `MockMonitoringChecker`
- `src/lib/monitoring/runner.ts` - `MonitoringRunner.checkOwner(args)` returns trip-id → events map
- `src/lib/monitoring/factory.ts` - `getMonitoringSubsystem()`
- `src/lib/monitoring/index.ts` - barrel
- `src/app/api/trips/[tripId]/monitoring/acknowledge/route.ts` - POST mark events seen
- `src/features/workspace/saved-trips/monitoring-badge.tsx` - UI badge component
- `tests/monitoring-store.test.ts`
- `tests/monitoring-mock-checker.test.ts`
- `tests/monitoring-runner.test.ts`

**Modify:**
- `src/app/api/trips/list/route.ts` - call the runner, enrich response with `monitoringEvents` per trip
- `src/features/workspace/hooks/use-saved-trips.ts` - surface `monitoringEvents` on `SavedTripRow`, expose `acknowledgeMonitoring(tripId)`
- `src/features/workspace/saved-trips/saved-trip-row.tsx` - render the badge
- `src/lib/env/get-server-features.ts` - surface monitoring kind ('mock' | 'real') for the admin dashboard

---

## Tasks

### Task 1: Types + MonitoringStore interface + InMemory impl + tests

- [ ] `types.ts`: `MonitoringEventKind = 'price-drop' | 'price-rise' | 'unavailable' | 'new-alternative' | 'better-match'`. `MonitoringEvent {id, tripId, ownerKind, ownerId, kind, delta?, message, createdAt, acknowledged}`. `MonitoringSnapshot {tripId, lastCheckAt, lastEventAt?}`.
- [ ] `monitoring-store.ts`: interface - `getSnapshot(tripId)`, `putSnapshot`, `recordEvent`, `listEventsForOwner(owner, {includeAcknowledged?})`, `acknowledgeAll(owner, tripId)`.
- [ ] `in-memory-monitoring-store.ts`: process-singleton (HMR-safe via globalThis). Maps `Map<tripId, MonitoringSnapshot>` + `Map<ownerKey, MonitoringEvent[]>`.
- [ ] Tests: snapshot round-trip, event append + list, acknowledgeAll filtering, owner isolation.
- [ ] Verify: typecheck.

### Task 2: MonitoringChecker (mock) + tests

- [ ] `checker.ts`: `MonitoringChecker` interface with `check(trip, prevSnapshot, now): Promise<MonitoringEvent | null>`. `MockMonitoringChecker` implementation:
  - Seeded RNG via FNV-1a hash of `(trip.id, now-rounded-to-minute)` for stability across same-second calls.
  - Weighted lottery: 45% price-drop (delta -2% to -12%), 15% price-rise (+2% to +6%), 10% better-match, 5% unavailable, 25% no event.
  - Returns at most one event per check.
- [ ] Tests: deterministic for same `(trip.id, now)`, distribution roughly matches weights over 1000 trials, message templates render the price/hero name correctly.

### Task 3: MonitoringRunner

- [ ] `runner.ts`: `MonitoringRunner.checkOwner({owner, trips, now}) → Map<tripId, MonitoringEvent[]>`.
  - For each trip: check `lastMonitoredAt` against `MONITORING_INTERVAL_MS` (default 60s, env-overridable). Skip if not due.
  - Run checker; persist event (if any) + new snapshot.
  - Wrap each per-trip iteration in try/catch - failures don't stall others.
  - Return all unacknowledged events for the owner (not just the ones generated this call) so the UI badge stays consistent across reloads.
- [ ] Tests: due-throttling, event persistence, owner isolation, per-trip failure isolation, returns full unack list (not just freshly-generated).

### Task 4: Wire into /api/trips/list

- [ ] Modify the route to call `MonitoringRunner.checkOwner({owner, trips, now: Date.now()})` after listing trips, attach `monitoringEvents: MonitoringEvent[]` per trip in the response.
- [ ] Returned shape: `{ trips: SavedTripWithMonitoring[] }` where `SavedTripWithMonitoring = SavedTrip & {monitoringEvents: MonitoringEvent[]}`.

### Task 5: Acknowledge endpoint

- [ ] `POST /api/trips/[tripId]/monitoring/acknowledge` - owner-gated. Calls `store.acknowledgeAll(owner, tripId)`. Idempotent.
- [ ] Used by the saved-trips panel when the user clicks a row (already triggers resurface; we add a fire-and-forget acknowledge call alongside).

### Task 6: UI - badge + hook wiring

- [ ] `monitoring-badge.tsx` - small chip on the row. Color-coded by kind (price-drop = accent green, price-rise/unavailable = warning, others = neutral). Shows the message on hover via `title` attribute. `aria-label` for screen readers.
- [ ] `useSavedTrips`:
  - Surface `monitoringEvents` on the `SavedTripRow` type.
  - `acknowledgeMonitoring(tripId)` POSTs the new endpoint, updates local state to clear the events array on the row.
- [ ] `saved-trip-row.tsx`: when `trip.monitoringEvents.length > 0`, render `<MonitoringBadge>` between the destination line and the hero name.
- [ ] `saved-trips-panel.tsx`: `handleSelect` already exists for resurface; add `void acknowledgeMonitoring(trip.id)` alongside.

### Task 7: Pipeline + changelog + slice-c2 tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-c2.md`.
- [ ] Tag `slice-c2`. Commit at logical milestones.

---

## What stays unchanged

- `OrchestratorEvent` shape - no new event kinds. Monitoring is a side-channel, not part of the turn flow.
- Saved-trip routes (B1) - `save`, `[tripId]`, `share`, `resurface` all unchanged. Only `list` grows the `monitoringEvents` field.
- Auth, persistence, share links, redirect - all from B1-B6 unchanged.
- LangGraph engine - untouched.

## Out of C2 scope (deferred to C2.x)

- `RealMonitoringChecker` impl - re-runs `provider.search` + diffs against saved proposal. Lands when real provider keys are stable.
- `PostgresMonitoringStore` - schema + migration. Drop-in once we have DB to test against.
- Background scheduler (Vercel cron / `pg_cron`) - push model. The on-demand pull works for the demo + is forward-compatible.
- Email / push notifications.
- Cross-trip "you might like this new destination" suggestions.
