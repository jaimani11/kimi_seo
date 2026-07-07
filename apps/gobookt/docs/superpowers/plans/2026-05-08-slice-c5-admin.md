# Slice C5 Implementation Plan - Admin panel extensions

> Executed inline, batched, only pausing for real blockers.

**Goal:** Grow `/admin` from a single telemetry summary into a real operator console. Four new pages - turn drill-in, affiliate click feed, per-owner aggregate, and a memory index browser - plus a billing summary card on the dashboard. Reuse every existing read seam; add only the minimum new helpers (list-by-owner, list-all-owners) where the data was already there but not enumerable.

**Architecture:** A shared `requireAdmin()` helper centralizes the auth gate (Clerk-on requires sign-in; `STAYSCOUT_ADMIN_PUBLIC=1` opens it for staging). A small `AdminShell` server component wraps each page with consistent header + nav. Each page is server-rendered, reads from existing subsystems via their interfaces, and renders simple list/detail views in the same vocabulary as the rest of the app.

**Tech Stack:** No new deps. Mock-safe: every view works against in-memory stores; Postgres pages slot in unchanged when DB is configured.

---

## Architectural Tenets (Opus-level)

**1. Surface, don't query.** The admin pages read through existing interfaces (`SessionStore`, `MemoryStore`, `BillingSubsystem`, `MemoryTelemetryStore`). Where an enumeration was missing (clicks list, memory list-by-owner), we add a method on the interface - both impls implement it. No raw Prisma queries from pages.

**2. Owner-keyed everywhere.** The aggregate view at `/admin/users/[userId]` is really `/admin/owners/<ownerKind>/<ownerId>` in spirit - anonymous sessions have data too. We use the same `OwnerKey` shape the rest of the app uses (`{ ownerKind: 'user' | 'session', ownerId }`); the URL keeps `[userId]` for readability but the path resolves both kinds via a query param (`?kind=session`).

**3. One auth gate, three modes.** `requireAdmin()` is the single decision point - Clerk-on + signed-in (production), Clerk-off (keyless dev), or any-mode + `STAYSCOUT_ADMIN_PUBLIC=1` (staging). Every admin page calls it as the first line.

**4. Pages are server components.** No client-side fetching for the lists; the page renders with the data already in hand. The dashboard's existing chart components stay as they are.

**5. Mock-safe + Postgres-ready.** Every list helper has an in-memory + Postgres impl from day one - no "schema lands later." (Postgres for `MemoryStore` is still C1.x territory; the C5 list helper joins the queue, returning empty in mock-only mode if needed.)

**6. Voice + design vocabulary unchanged.** Same Fraunces/Inter/geist-mono palette + surface hierarchy. New pages feel like extensions of the dashboard, not a separate area.

**7. No new auth surface.** All admin pages share the same gate. No per-page permission system in C5.

---

## File Structure

**Create:**
- `src/lib/admin/require-admin.ts` - single auth gate
- `src/features/admin/admin-shell.tsx` - header + nav wrapper
- `src/features/admin/admin-nav.tsx` - top-level nav links
- `src/features/admin/data-table.tsx` - small reusable table primitive (no deps)
- `src/features/admin/owner-link.tsx` - `<OwnerLink ownerKind ownerId />` → `/admin/users/...`
- `src/app/admin/turns/[turnId]/page.tsx`
- `src/app/admin/clicks/page.tsx`
- `src/app/admin/users/[userId]/page.tsx`
- `src/app/admin/memories/page.tsx`
- `tests/admin-store-extensions.test.ts`
- `tests/admin-require-admin.test.ts`

**Modify:**
- `src/lib/session/session-store.ts` - add `listClicks(args?)` to `SessionStore` interface
- `src/lib/session/in-memory-session-store.ts` - implement `listClicks`
- `src/lib/session/postgres-session-store.ts` - implement `listClicks`
- `src/lib/memory/memory-store.ts` - add `listForOwner(args)` + `listAllOwners()` to `MemoryStore` interface
- `src/lib/memory/in-memory-memory-store.ts` - implement both
- `src/app/admin/page.tsx` - add billing summary card + nav links + use `requireAdmin()`

---

## Tasks

### Task 1: Store extensions

- [ ] `SessionStore.listClicks({ limit?, owner? }): Promise<AffiliateClickRecord[]>` - most-recent-first. With `owner` set, returns clicks for that owner; without, returns global recent (admin feed).
- [ ] `InMemorySessionStore.listClicks` - slice + reverse + filter.
- [ ] `PostgresSessionStore.listClicks` - `prisma.affiliateClick.findMany({ orderBy: { createdAt: 'desc' }, where, take })`.
- [ ] `MemoryStore.listForOwner({ owner, limit?, kind? }): Promise<MemoryRecord[]>` - most-recent-first.
- [ ] `MemoryStore.listAllOwners(): Promise<OwnerKey[]>` - distinct owners with at least one record. (In-memory only in C5; the Postgres impl would do `findMany(distinct: ['userId'])` once C1.x lands its store.)
- [ ] `InMemoryMemoryStore` - implement both via the existing `buckets` map.
- [ ] Tests (`tests/admin-store-extensions.test.ts`, ~7):
  - `listClicks` returns most-recent-first.
  - `listClicks` honors `limit`.
  - `listClicks` filtered by owner returns only that owner's rows.
  - `listForOwner` returns ordered records.
  - `listForOwner` honors `kind` filter.
  - `listAllOwners` returns distinct owner keys with at least one record.
  - `listAllOwners` returns empty when no memories.

### Task 2: Admin shared shell

- [ ] `src/lib/admin/require-admin.ts`:
  ```ts
  export async function requireAdmin(): Promise<AuthState>;
  ```
  - Reads `getServerFeatures().auth` + `STAYSCOUT_ADMIN_PUBLIC === '1'`.
  - If auth-on AND not public AND not signed-in → `redirect('/')`.
  - Otherwise returns the resolved `AuthState`.
- [ ] Tests (`tests/admin-require-admin.test.ts`, ~4):
  - Public override returns auth state regardless of mode.
  - Auth-off mode returns auth state without redirecting.
  - Auth-on + signed-out → throws (or returns redirect-marker - depends on Next runtime; we'll handle by mocking `redirect` to throw).
  - Auth-on + signed-in returns the authenticated state.
- [ ] `src/features/admin/admin-nav.tsx` - small horizontal nav: Dashboard / Turns / Clicks / Users / Memories. Active link uses accent border-bottom.
- [ ] `src/features/admin/admin-shell.tsx` - wraps a page with: top breadcrumb (Operator › Section), AdminNav, then `{children}`. Padding/typography match the existing dashboard.
- [ ] `src/features/admin/data-table.tsx` - bare primitive: takes `columns: { key, label, render }[]` and `rows: T[]`. Renders semantic `<table>` with surface-elevated styling.
- [ ] `src/features/admin/owner-link.tsx` - small Link that renders ownerId truncated, links to `/admin/users/[ownerId]?kind=<ownerKind>`.

### Task 3: `/admin/turns/[turnId]`

- [ ] Server-render. `requireAdmin()` first.
- [ ] `getMemoryTelemetryStore().turnIndex.get(turnId)` - but `turnIndex` is private. Add a public `getTurn(turnId): TurnRecord | null` to the telemetry store first.
- [ ] If null → `notFound()`.
- [ ] Render:
  - Header: "Turn `<turnId>`", status badge (streaming/completed/failed), session id (links to `/admin/users/<sessionId>?kind=session`), duration, type.
  - Failure block (if status === 'failed'): `failureError` text in a surface-2 card.
  - Agent timeline: `<DataTable columns={agent, duration, model, tokens, cost, cache}>`. Hide cost/cache columns when all rows are zero.
- [ ] Voice: same hero header pattern as itinerary view.

### Task 4: `/admin/clicks`

- [ ] `requireAdmin()` first.
- [ ] `getSessionStore().listClicks({ limit: 100 })`.
- [ ] Render: header "Affiliate clicks", count badge, table with columns: time, owner (OwnerLink), provider, stayId (truncated), turnId (link to `/admin/turns/[turnId]` if present), converted (✓/-), commission ($, when present).
- [ ] Empty state: italic "No clicks recorded yet - go save a trip and tap a hero card."

### Task 5: `/admin/users/[userId]`

- [ ] `requireAdmin()` first.
- [ ] Resolve owner from URL: `params.userId` + `?kind=session|user` (default `user`).
- [ ] Aggregate reads:
  - `getSessionStore().listTrips({ owner })`
  - `getSessionStore().listClicks({ owner, limit: 50 })`
  - `getBillingSubsystem().provider.getEntitlement(owner)` (server-side; we already use this elsewhere)
  - `getMemorySubsystem().store.listForOwner({ owner, limit: 50 })`
  - `getMemoryTelemetryStore().getRecentTurns(...)` filtered to this `sessionId` (when ownerKind=session)
- [ ] Render: header with ownerKind chip + ownerId, four sections (Entitlement, Saved trips, Memories, Affiliate clicks). Each section has a small count + a 5-row preview + "see all" link if exceeded.
- [ ] Empty: "No data for this owner."

### Task 6: `/admin/memories`

- [ ] `requireAdmin()` first.
- [ ] Two modes via search params:
  - No `?owner=`: list all owners with memory counts (linked to per-owner view).
  - `?owner=user:<id>` or `?owner=session:<id>`: list that owner's memories most-recent-first.
- [ ] Optional `?q=<query>`: when present + owner specified, run a similarity search and show ranked results with scores.
- [ ] Render with `<DataTable>`. Empty state per mode.

### Task 7: Update `/admin/page.tsx`

- [ ] Replace the existing inline auth gate with `requireAdmin()`.
- [ ] Wrap in `<AdminShell section="dashboard">`.
- [ ] Add a billing summary card to the existing summary grid: shows `getServerFeatures().billing.kind`, plus a count of premium subscriptions (in-memory store: `Subscription` rows with active/trialing/canceled-grace).
- [ ] Add a small monitoring summary card: count of unack monitoring events across all owners (existing `getMonitoringSubsystem().store` already supports this read; if not, add one).
- [ ] Each existing recent-turn row gets a "drill in →" link to `/admin/turns/[turnId]`.

### Task 8: Pipeline + changelog + slice-c5 tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`. Fix anything that flares.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-c5.md` matching the C1–C4 format.
- [ ] Update README - Slice C5 status entry, roadmap row, mark slice-c5 in tags list.
- [ ] Tag `slice-c5`. Commit at logical milestones (per-task commits or grouped where related).

---

## What stays unchanged

- `OrchestratorEvent` shape, LangGraph engine, providers, redirect, share, persistence - none touched.
- Public APIs of `SessionStore`, `MemoryStore`, `BillingProvider` - only additive (new methods).
- Existing `/admin` page's chart + summary card components - reused as-is.
- Voice rule + design tokens unchanged.

## Out of C5 scope (deferred to C5.x or later)

- Postgres `MemoryStore.listForOwner` + `listAllOwners` - wired when C1.x lands the impl.
- Search/filter UI on clicks (date range, provider filter) - current view is most-recent-first only.
- Click-to-conversion linking with revenue (currently shows commission if recorded, no aggregation).
- Audit log of admin actions (read-only in C5 anyway).
- Per-page authz beyond the single gate.
- Real-time updates (no SSE on admin pages - refresh to see new data).

## Mock-safe matrix

| Vars | Behavior |
|---|---|
| (none) | All admin pages render against in-memory data. Dashboard shows whatever turns/clicks/memories were created in this process. |
| `DATABASE_URL` | Trips + clicks lists hit Postgres via `PostgresSessionStore.listClicks`. Memories still in-memory until C1.x. |
| `STAYSCOUT_ADMIN_PUBLIC=1` | Admin gate opens regardless of auth mode (staging convenience). |
| Clerk on | Auth gate enforced; non-signed-in redirected to `/`. |
