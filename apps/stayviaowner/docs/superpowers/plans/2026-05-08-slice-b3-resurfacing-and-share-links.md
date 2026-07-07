# Slice B3 Implementation Plan - Saved Trips Resurfacing + Share Links

> **For agentic workers:** Executed inline, batched, only pausing for real blockers.

**Goal:** Make saved trips first-class - clicking one resurfaces it on the canvas; sharing one produces a public read-only URL anyone can open, with a "Save to my trips" CTA so recipients can clone it into their own bucket.

**Architecture:** A new `shareSlug` (nanoid-style) on the Trip row, minted lazily on first share via `POST /api/trips/[tripId]/share`. A public `GET /api/trips/by-slug/[slug]` returns a sanitized read-only `SharedTrip`. A public route `/t/[slug]` renders the proposal in a read-only view that mirrors the workspace canvas. Resurfacing on the workspace side adds the saved trip as a synthetic Turn in `useWorkspaceStore`.

**Tech Stack:** No new deps (uses existing Prisma + Zod). Uses `crypto.randomUUID().slice(...)` derivative for share slug to avoid pulling nanoid.

---

## Architectural Tenets (Opus-level decisions)

**1. Share slugs are unguessable, not authenticated.**
Share = "anyone with the URL." A 16-char base62 slug (≈95 bits entropy) is enough to defeat enumeration. No expiry in B3 (B3.x can add). No view counts. Zero PII in the slug; we never expose `userId`/`sessionId` on the public route.

**2. Slug is on Trip, lazy-minted.**
We add `shareSlug String? @unique` to Trip. Sharing a trip mints the slug on first call and reuses it after. Saving a trip never mints - most trips never get shared, no need to pay storage.

**3. Public read returns a sanitized projection.**
`SharedTrip` excludes `userId`, `sessionId`, `conversationId`, `intent.rawInput` (which can echo the user's exact words including names/locations), and any owner-identifying field. Only the proposal + a sanitized intent (just the structured trip parameters) leak through. Implemented at the SessionStore boundary, not the route handler - owner stripping is invariant.

**4. Resurfacing rehydrates as a synthetic turn.**
Clicking a saved trip in the panel pushes a `Turn` onto `useWorkspaceStore.turns` with `type: 'compose'`, `status: 'settled'`, the saved `proposal` + `intent` + `proposalRef`. The canvas then renders it like any other turn. No ripple changes downstream - pin/compare/detail/refine UIs already work against a `Turn`.

**5. Save-from-share is a fork.**
The recipient's "Save to my trips" CTA on `/t/[slug]` calls `POST /api/trips/save` against the SAME proposal. The existing idempotency guard (`@@unique([userId, proposalId])`) ensures a recipient who saves the same trip twice gets one row. The original owner's trip is untouched - forks are independent rows owned by the recipient.

**6. Mock-safe end-to-end.**
Both `InMemorySessionStore` and `PostgresSessionStore` get the same new methods (`mintShareSlug`, `getTripBySlug`). In-memory shares survive within a dev session; Postgres shares are durable. The `/t/[slug]` route works in either mode.

**7. Refining a resurfaced trip is out of B3 scope.**
A resurfaced trip's `priorTurn` lives on a Turn record that may not exist in the current process's `SessionStore.turns`. A refine attempt would 404 the lookup. We document this as a B3.x follow-up and gracefully degrade: the Refine button on a resurfaced trip is shown but produces a "Re-search this prompt" experience (the rawInput drops into the input bar; the model runs a fresh compose).

---

## File Structure

**Create:**
- `src/lib/session/share-slug.ts` - `mintShareSlug()` helper (16-char base62, crypto-random)
- `src/app/api/trips/[tripId]/share/route.ts` - POST mint slug
- `src/app/api/trips/by-slug/[slug]/route.ts` - GET public read
- `src/app/t/[slug]/page.tsx` - public read-only view
- `src/features/shared-trip/shared-trip-view.tsx` - read-only canvas-like view
- `src/features/workspace/saved-trips/share-modal.tsx` - copy-link modal
- `src/features/workspace/hooks/use-share-trip.ts` - POST share + clipboard
- `tests/share-slug.test.ts`
- `tests/share-trip.contract.test.ts` - SessionStore contract for share methods

**Modify:**
- `prisma/schema.prisma` - add `shareSlug` field + index
- `src/lib/session/session-store.ts` - add `mintShareSlug`, `getTripBySlug` methods + `SharedTrip` type
- `src/lib/session/in-memory-session-store.ts` - implement
- `src/lib/session/postgres-session-store.ts` - implement
- `src/features/workspace/saved-trips/saved-trip-row.tsx` - add share button + click-to-resurface
- `src/features/workspace/store/workspace-store.ts` - `resurfaceSavedTrip(savedTrip)` action
- `src/features/workspace/hooks/use-saved-trips.ts` - add `share(tripId)` returning slug
- `tests/session-store.test.ts` - extend contract tests for share methods

---

## Tasks

### Task 1: Schema + share-slug helper + types

- [ ] Add `shareSlug String? @unique` to `Trip` model. Run `pnpm db:generate`.
- [ ] `src/lib/session/share-slug.ts`: `mintShareSlug(): string` returns 16-char base62 string. `crypto.getRandomValues` for entropy.
- [ ] Extend `SessionStore` interface: `mintShareSlug({tripId, ownerKind, ownerId})`, `getTripBySlug(slug)` returning `SharedTrip | null`. Add `SharedTrip` type - sanitized projection of SavedTrip (no ownerId, no conversationId, sanitized intent).
- [ ] Verify: `pnpm typecheck`.

### Task 2: SessionStore implementations

- [ ] `InMemorySessionStore.mintShareSlug()` - find trip by (owner, tripId); if `shareSlug` exists return it; else mint, set, return. Stores a side index `tripsBySlug: Map<slug, SavedTrip>`.
- [ ] `InMemorySessionStore.getTripBySlug(slug)` - lookup, return sanitized `SharedTrip`.
- [ ] `PostgresSessionStore.mintShareSlug()` - `findUnique({tripId})`, if `shareSlug` set return; else update with new slug. Owner must match.
- [ ] `PostgresSessionStore.getTripBySlug(slug)` - `findUnique({shareSlug})`, project to sanitized SharedTrip.
- [ ] Sanitization helper: `toSharedTrip(savedTrip)` strips ownerId, conversationId, intent.rawInput.
- [ ] Verify: `pnpm typecheck`.

### Task 3: Tests for share methods

- [ ] Extend `tests/session-store.test.ts` - adds 4 cases: mint returns stable slug on second call, mint refuses for non-owner, getTripBySlug returns sanitized trip, getTripBySlug returns null for unknown slug.
- [ ] `tests/share-slug.test.ts` - slug is 16 chars base62, all calls produce distinct slugs (1000 trial), URL-safe.
- [ ] Verify: `pnpm test`.

### Task 4: API routes

- [ ] `POST /api/trips/[tripId]/share` - owner-gated. Calls `store.mintShareSlug`, returns `{slug, url}`. 404 if trip not owned by caller.
- [ ] `GET /api/trips/by-slug/[slug]` - public (no auth check). Returns `SharedTrip | 404`. CORS not needed (same-origin).
- [ ] Verify: typecheck + lint.

### Task 5: Public /t/[slug] page

- [ ] `src/app/t/[slug]/page.tsx` - server component. Fetches via `getSessionStore().getTripBySlug(slug)`. 404 if not found.
- [ ] `SharedTripView` component - read-only canvas-like layout. Reuses `HeroStayCard`, `AlternativeCard`, `ReasoningStrip` from existing trip-board components. Header reads "Shared trip from StayScout."
- [ ] CTA: "Save this trip to my StayScout" → POSTs to `/api/trips/save` with the proposal+intent+proposalRef from the shared trip. On success, redirects to `/` and opens the saved-trips panel.
- [ ] CTA: "Try this prompt myself" → links to `/?prompt=<urlencoded>` (workspace pre-fills the input bar - small URL-driven init).
- [ ] Verify: typecheck + lint + manual visit.

### Task 6: Workspace integration

- [ ] `useWorkspaceStore.resurfaceSavedTrip(saved)` - pushes a Turn with the saved proposal + intent + proposalRef. Sets `currentTurnId` to the new turn id. Closes saved panel.
- [ ] `SavedTripRow` - clicking the row body (not the X) calls `resurfaceSavedTrip`. Add a small share icon button next to the X - opens `ShareModal`.
- [ ] `ShareModal` - modal with copy-link button. Uses Web Share API when available; falls back to clipboard. Mounts the Sparkle motion on copy success.
- [ ] `useSavedTrips.share(tripId)` - POSTs to `/api/trips/[tripId]/share`, returns `{slug, url}`. Caches the slug in the local trip state once minted so subsequent shares don't re-POST.
- [ ] Verify: typecheck + lint.

### Task 7: URL-driven prompt prefill

- [ ] Workspace reads `?prompt=` query param on mount; if present, sets `inputDraft` and clears the param via `router.replace('/')`. (Avoids re-applying on back-nav.)
- [ ] Verify: typecheck.

### Task 8: Pipeline + changelog + tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`. Fix anything that flares.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-b3.md`.
- [ ] Commit at logical milestones. Tag `slice-b3`.

---

## What stays unchanged

- `OrchestratorEvent` shape - no new event kinds.
- LangGraph engine - no node changes; resurfacing is purely a workspace-side action.
- Auth abstraction - share routes don't auth-gate the GET, do auth-gate the POST.
- Anonymous session model - anonymous users can share their trips just like authenticated ones (the slug is the auth).
