# Slice D Implementation Plan - BookingAgent (approval-gated)

> Executed inline, batched, only pausing for real blockers.

**Goal:** Ship the booking machinery end-to-end. From a saved trip, the user clicks "Book this" → BookingAgent produces a structured `BookingDraft` (dates, guest count, total, cancellation policy, traveler placeholder) → an approval modal shows the draft → on confirm, `BookingProvider.book(draft)` creates a `Booking` and the user lands on `/bookings/[bookingId]` with the confirmation. Mock-safe end-to-end via `MockBookingProvider`. Real provider booking + autonomous mode are explicitly **deferred to D.x** (booking touches money + irreversible side effects; the architecture lands here, the live wiring + premium gate land separately).

**Architecture:** A `BookingProvider` interface (`book`, `cancel`, `getBooking`) with one mock impl in Slice D. Two API routes - `POST /api/bookings/draft` (create a draft from a saved trip + traveler info) and `POST /api/bookings/confirm` (idempotently book a draft) - plus `POST /api/bookings/[bookingId]/cancel`. A `BookingStore` (in-memory in Slice D, Postgres in D.x) keyed by booking id + owner. The `BookingAgent` is a thin orchestrator: input is `(savedTrip, traveler, idempotencyKey)`, output is a draft (during planning) or a confirmed `Booking` (after approval). No LLM calls in Slice D - drafts are derived deterministically from the saved-trip's hero stay + the user's traveler info. LLM enrichment (parsing free-text traveler details, resolving conflicts) lands in D.x.

**Tech Stack:** No new deps. Mock-safe by default; real provider booking integrations slot in behind the same `BookingProvider` interface in D.x as separate impls (`BookingComBookingProvider`, etc.).

---

## Architectural Tenets (Opus-level)

**1. Approval-gated, every booking, every tier.** Slice D ships *only* the approval-gated path. Even premium users explicitly confirm a draft before any provider call. Autonomous mode is a separate policy decision - it gets its own design pass + premium gate + a clear "you've authorized autonomous" affordance in D.x.

**2. Idempotency on the user's confirm click.** The first thing the agent does on draft creation is mint an `idempotencyKey` and stamp it onto the draft. The confirm endpoint requires it; double-clicks coalesce to a single booking. Mirrors C4's webhook idempotency pattern - same discipline, different actor.

**3. Provider state is the source of truth.** `BookingProvider.getBooking(id)` is the canonical read. We cache locally in `BookingStore` so the confirmation page is fast, but stale-on-write is acceptable: we re-fetch on display when the booking is < 5 min old (covers "did the provider actually book it" concerns mid-flow).

**4. No card capture in-app.** Slice D never collects credit cards. The `BookingDraft.total` is what *would* be charged; in mock mode the booking just confirms. Real-mode integrations (D.x) hand off to provider Checkout (Booking.com's hosted checkout, Expedia EPS Rapid's payment URL, etc.). PCI scope = zero, matching C4.

**5. Mock-safe + opt-in real.** `MockBookingProvider` is the keyless dev default - every authenticated user can complete the full draft → approve → confirm → view confirmation flow without keys. Real provider booking lands in D.x, gated by the existing `BOOKING_COM_API_KEY` etc. set + a new `STAYSCOUT_LIVE_BOOKING=1` opt-in (default off even with provider keys, because provider keys are also used for the existing search flow).

**6. Bookings tie to saved trips.** Same ownership model as C3 itineraries. A `Booking` references its `SavedTrip` by id; cascade rules: deleting a trip leaves its bookings intact (you don't un-book by un-saving) but flags them as orphaned for admin visibility.

**7. Cancellation is part of the contract.** A booking that can't be canceled is an operational nightmare. `BookingProvider.cancel(id, reason)` returns a result with refund eligibility; mock provider always returns "fully refundable in dev." Cancellation is owner-gated.

**8. Admin-visible from day one.** `/admin/bookings` lands in Slice D alongside the user-facing flow. Operators need eyes on a side-effecting feature from the moment it ships.

**9. No new OrchestratorEvent kinds.** Bookings are out-of-band from the turn flow, same as itineraries in C3. The orchestrator engine, intent agent, and providers are untouched.

**10. Premium gate is wired but inactive in Slice D.** The `BookingAgent` accepts an `autonomous: boolean` flag in its input; in Slice D the API always passes `false`. D.x flips it to `true` for premium users via the existing `requirePremium(owner)` seam. Architectural seam in place; behavior change behind a deliberate gate.

---

## File Structure

**Create:**
- `src/core/booking.ts` - Zod schemas + types: `BookingDraft`, `Booking`, `BookingStatus`, `CancellationPolicy`, `TravelerInfo`, errors.
- `src/lib/booking/booking-provider.ts` - `BookingProvider` interface.
- `src/lib/booking/mock-booking-provider.ts` - `MockBookingProvider`.
- `src/lib/booking/booking-store.ts` - `BookingStore` interface.
- `src/lib/booking/in-memory-booking-store.ts` - process-singleton cache.
- `src/lib/booking/factory.ts` - `getBookingSubsystem()`.
- `src/lib/booking/index.ts` - barrel.
- `src/agents/booking-agent.ts` - draft + confirm orchestrator.
- `src/app/api/bookings/draft/route.ts` - POST owner-gated → `{ draft }`.
- `src/app/api/bookings/confirm/route.ts` - POST owner-gated → `{ booking }` (idempotent on `draft.idempotencyKey`).
- `src/app/api/bookings/[bookingId]/cancel/route.ts` - POST owner-gated → `{ booking }` (idempotent).
- `src/app/bookings/[bookingId]/page.tsx` - confirmation detail page.
- `src/app/admin/bookings/page.tsx` - admin booking feed.
- `src/features/bookings/book-this-button.tsx` - CTA on saved-trip rows (client).
- `src/features/bookings/booking-draft-modal.tsx` - approval modal (client).
- `src/features/bookings/booking-confirmation-view.tsx` - confirmation page layout.
- `src/features/admin/booking-status-chip.tsx` - color-coded status pill.
- `tests/booking-core.test.ts` - schema + helpers (≈5).
- `tests/mock-booking-provider.test.ts` - provider behavior + idempotency (≈8).
- `tests/booking-store.test.ts` - round-trip + owner-isolation (≈6).
- `tests/booking-agent.test.ts` - draft creation, confirm flow, cancellation (≈7).

**Modify:**
- `src/features/workspace/saved-trips/saved-trip-row.tsx` - add "Book this" CTA in the row footer.
- `src/features/admin/admin-nav.tsx` - add `Bookings` tab.
- `src/lib/env/get-server-features.ts` - surface `bookings: { kind: 'mock' | 'live'; liveEnabled: boolean }`.
- `prisma/schema.prisma` - add `Booking` + `BookingDraft` models (schema only; impl in D.x).
- `README.md` - Slice D status entry + roadmap row.

---

## Tasks

### Task 1: Core booking types + schemas (`src/core/booking.ts`)

- [ ] Define types:
  - `BookingStatus = 'draft' | 'confirmed' | 'canceled' | 'failed'`
  - `CancellationPolicy { kind: 'free-until' | 'partial-refund' | 'non-refundable'; freeUntil?: Date; refundPercent?: number; description: string }`
  - `TravelerInfo { primaryName: string; email: string; guestCount: { adults: number; children: number; infants: number } }`
  - `BookingDraft { id, idempotencyKey, ownerKind, ownerId, savedTripId, stayId, providerId, checkIn, checkOut, nights, traveler, total: { amount, currency }, cancellation: CancellationPolicy, createdAt }`
  - `Booking { id, idempotencyKey, ownerKind, ownerId, savedTripId, stayId, providerId, providerBookingRef, checkIn, checkOut, nights, traveler, total, cancellation, status, confirmedAt, canceledAt? }`
- [ ] Zod schemas for all of them (round-trip safe - dates as ISO strings on the wire).
- [ ] Helpers:
  - `mintIdempotencyKey()` - `bk_<uuid>`.
  - `mintBookingId()` - `bok_<uuid>`.
  - `isCancelable(booking, now)` - true when status === 'confirmed' AND (cancellation.kind !== 'non-refundable' OR free-until > now).
- [ ] Errors:
  - `BookingError` - typed (`unknown-draft`, `already-confirmed`, `provider-error`, `not-cancelable`, `not-owner`, `idempotency-collision`).
- [ ] Tests (`tests/booking-core.test.ts`, ~5):
  - Schema parse round-trip for `BookingDraft` + `Booking`.
  - `isCancelable` truth table (free-until past → false, non-refundable → false, free-until future → true, status=canceled → false, status=draft → false).
  - `mintIdempotencyKey` produces unique values across calls.
- [ ] Verify: `pnpm typecheck && pnpm test tests/booking-core.test.ts`.

### Task 2: BookingProvider interface + MockBookingProvider

- [ ] `src/lib/booking/booking-provider.ts`:
  ```ts
  interface BookingProvider {
    readonly kind: 'mock' | 'booking-com' | 'expedia';
    book(draft: BookingDraft): Promise<Booking>; // idempotent on draft.idempotencyKey
    cancel(args: { bookingId: string; reason?: string }): Promise<Booking>;
    getBooking(bookingId: string): Promise<Booking | null>;
  }
  ```
- [ ] `src/lib/booking/mock-booking-provider.ts`:
  - Internal `Map<idempotencyKey, Booking>` so `book` is genuinely idempotent.
  - `book(draft)`: returns a `Booking` with `status: 'confirmed'`, `providerBookingRef: 'mock_<random>'`, `confirmedAt: now`. Re-calling with the same idempotencyKey returns the same `Booking`.
  - `cancel({bookingId})`: flips status to 'canceled', stamps `canceledAt`. Returns the canceled booking. No-op if already canceled (returns the same object).
  - `getBooking(id)`: read.
  - Failure simulation: env `STAYSCOUT_BOOKING_FAIL=1` → `book` throws `BookingError('provider-error')` on first call (then succeeds). Useful for manual testing the failure path; not exercised in the default tests.
- [ ] Tests (`tests/mock-booking-provider.test.ts`, ~8):
  - Fresh draft → confirmed booking with stable id, providerBookingRef shape, status='confirmed'.
  - Same idempotencyKey called twice → same `Booking` (id stable, no second confirmation).
  - Different idempotencyKeys produce distinct bookings.
  - `cancel` flips status + sets `canceledAt`.
  - `cancel` second call is a no-op.
  - `getBooking` returns the booking.
  - `getBooking` returns null for unknown id.
  - `STAYSCOUT_BOOKING_FAIL=1` → first `book` throws, retry without the env succeeds.
- [ ] Verify: `pnpm test tests/mock-booking-provider.test.ts`.

### Task 3: BookingStore (in-memory)

- [ ] `src/lib/booking/booking-store.ts`:
  ```ts
  interface BookingStore {
    putDraft(d: BookingDraft): Promise<void>;
    getDraft(idempotencyKey: string): Promise<BookingDraft | null>;
    putBooking(b: Booking): Promise<void>;
    getBooking(args: { ownerKind, ownerId, bookingId }): Promise<Booking | null>;
    listByOwner(args: { ownerKind, ownerId, limit?: number }): Promise<Booking[]>;
    listAll(args: { limit?: number }): Promise<Booking[]>; // admin
  }
  ```
- [ ] `in-memory-booking-store.ts`:
  - Process-singleton via globalThis (HMR-safe).
  - Three indexes: drafts by idempotencyKey; bookings by id; bookings by ownerKey ring (most-recent push).
  - `listByOwner` returns most-recent-first, default limit 50.
  - `listAll` returns most-recent-first, default limit 100 (admin feed).
- [ ] Tests (`tests/booking-store.test.ts`, ~6):
  - Draft round-trip by idempotencyKey.
  - Booking round-trip by id + owner gating (other owner gets null).
  - listByOwner returns most-recent-first.
  - listByOwner honors limit.
  - listAll spans owners.
  - listAll honors limit.
- [ ] `factory.ts`: `getBookingSubsystem(): { provider, store, kind }`. Mock provider only in Slice D - D.x adds the env-driven switch.
- [ ] `index.ts`: barrel.
- [ ] Verify: `pnpm test tests/booking-store.test.ts`.

### Task 4: BookingAgent

- [ ] `src/agents/booking-agent.ts`:
  ```ts
  interface DraftBookingInput {
    savedTrip: SavedTrip;
    traveler: TravelerInfo;
    /** When false (Slice D default), confirm() must be called explicitly.
     *  When true (D.x), book() runs end-to-end without a separate confirm.
     *  Slice D ignores this for safety; the API always passes false. */
    autonomous?: boolean;
  }
  export const BookingAgent = {
    async draftBooking(input): Promise<BookingDraft>;
    async confirmBooking(args: { ownerKey: OwnerKey; idempotencyKey: string }): Promise<Booking>;
    async cancelBooking(args: { ownerKey: OwnerKey; bookingId: string }): Promise<Booking>;
  };
  ```
- [ ] `draftBooking`:
  - Pull dates: `savedTrip.proposalSummary.checkIn` + `checkOut` (existing fields). If absent (compose with no specific dates), use `today + 30 days` for checkIn + `+ nights` for checkOut as a placeholder. The approval modal lets the user override before confirm - D.x.
  - Compute total: `pricing.pricePerNight.amount * nights` (currency from pricing). If `totalForStay` exists, use it.
  - Cancellation policy: defaults to `free-until: checkIn - 7 days` (mock-safe friendly default). Real providers will return their own.
  - Mint `idempotencyKey` + `id`, persist via `store.putDraft`.
- [ ] `confirmBooking`:
  - `store.getDraft(idempotencyKey)` → 404 if missing.
  - Check `draft.ownerKind/ownerId` matches `ownerKey` → throw `BookingError('not-owner')` otherwise.
  - Call `provider.book(draft)`. The provider is idempotent on the draft's key - so a re-confirm returns the same `Booking`.
  - `store.putBooking(booking)` → return.
- [ ] `cancelBooking`:
  - `store.getBooking({ owner, bookingId })` → 404 if missing/not-owned.
  - `isCancelable(booking, now)` → throw `BookingError('not-cancelable')` if not.
  - `provider.cancel({ bookingId: booking.providerBookingRef })`.
  - `store.putBooking(canceled)`.
- [ ] Tests (`tests/booking-agent.test.ts`, ~7):
  - Draft from a saved trip with checkIn/checkOut → correct dates + nights + total.
  - Draft from a saved trip without dates → today+30 default, dates are flagged via `placeholderDates: true` field on the draft (admin can see this).
  - Confirm with valid idempotencyKey → confirmed booking with provider ref.
  - Confirm with unknown idempotencyKey → BookingError('unknown-draft').
  - Confirm with foreign ownerKey → BookingError('not-owner').
  - Cancel a confirmed booking → status='canceled', canceledAt set.
  - Cancel a non-cancelable booking (status='draft' / non-refundable past free-until) → BookingError('not-cancelable').
- [ ] Verify: `pnpm typecheck && pnpm test tests/booking-agent.test.ts`.

### Task 5: API routes

- [ ] `POST /api/bookings/draft`:
  - Owner-gated; body: `{ savedTripId, traveler }`. Zod-parse traveler.
  - Resolve saved trip via `getSessionStore().getTrip({owner, tripId: savedTripId})` → 404 if not owned.
  - `BookingAgent.draftBooking({ savedTrip, traveler, autonomous: false })` → `{ draft }`.
- [ ] `POST /api/bookings/confirm`:
  - Body: `{ idempotencyKey }`. Zod-parse.
  - `BookingAgent.confirmBooking({ ownerKey, idempotencyKey })`.
  - `BillingError`-style mapping: 404 unknown-draft, 403 not-owner, 502 provider-error.
- [ ] `POST /api/bookings/[bookingId]/cancel`:
  - Owner-gated. Optional body: `{ reason }`.
  - `BookingAgent.cancelBooking({ ownerKey, bookingId })`.
  - 404 unknown, 409 not-cancelable.
- [ ] No dedicated route tests - the agent + provider tests cover the substantive logic. Routes are thin glue (matches the C4 / C5 convention).

### Task 6: User-facing UI

- [ ] `src/features/bookings/book-this-button.tsx` (client component):
  - Renders an inline "BOOK THIS →" link in the saved-trip row footer (alongside "PLAN DAY-BY-DAY →").
  - On click → opens `<BookingDraftModal>` with the saved trip context.
- [ ] `src/features/bookings/booking-draft-modal.tsx` (client component):
  - Form: traveler primary name, email, guest count.
  - On submit → POST `/api/bookings/draft` → renders the draft summary (dates, total, cancellation policy).
  - "Confirm booking" button → POST `/api/bookings/confirm` with the draft's idempotencyKey → on success, redirect to `/bookings/[bookingId]`.
  - "Cancel" closes the modal.
  - Error states: shown inline under the relevant input or as a banner if it's a provider error.
- [ ] `src/features/bookings/booking-confirmation-view.tsx`:
  - Server component layout for the confirmation page.
  - Renders: header "Booking confirmed" + ✓ glyph, hero stay name + dates, providerBookingRef, total, cancellation policy detail, traveler summary.
  - "Cancel booking" button (if `isCancelable`) - small client component that POSTs `/api/bookings/[bookingId]/cancel` and re-renders.
- [ ] `src/app/bookings/[bookingId]/page.tsx`:
  - Server component, owner-gated via `getServerAuth + ownerOf`.
  - `getBookingSubsystem().store.getBooking({owner, bookingId})` → 404 if not owned.
  - Renders `<BookingConfirmationView>`.
  - `generateMetadata` for OG / browser title.
- [ ] Modify `saved-trip-row.tsx` to render `<BookThisButton tripId={trip.id} />` next to the Plan-day-by-day link in the row footer.

### Task 7: Admin booking feed

- [ ] `src/features/admin/booking-status-chip.tsx`:
  - Color-coded pill: confirmed → accent-primary, canceled → ink-tertiary, failed → accent-warning, draft → ink-secondary.
- [ ] `src/app/admin/bookings/page.tsx`:
  - `requireAdmin()`.
  - `getBookingSubsystem().store.listAll({limit: 100})`.
  - `<AdminShell section="bookings">` (need to add `'bookings'` to `AdminSection` type + AdminNav links list).
  - `<DataTable>` columns: time (confirmedAt or createdAt for drafts), owner (OwnerLink), stay (truncated), provider, dates, total, status (chip), actions (link to `/bookings/[id]`).
- [ ] Update `src/features/admin/admin-nav.tsx` to add `bookings` link.
- [ ] Update `requireAdmin`-aware places only - no other admin-page changes.

### Task 8: Schema + features + pipeline + changelog + slice-d tag

- [ ] Update `prisma/schema.prisma`: add `BookingDraft` + `Booking` models. Schema only; impl in D.x (PostgresBookingStore).
  ```prisma
  model BookingDraft {
    id              String   @id
    idempotencyKey  String   @unique
    userId          String
    user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    tripId          String
    payload         Json
    createdAt       DateTime @default(now())
    @@index([userId, createdAt])
  }

  model Booking {
    id                  String    @id
    idempotencyKey      String    @unique
    userId              String
    user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    tripId              String?
    stayId              String
    providerId          String
    providerBookingRef  String?
    status              String
    payload             Json
    confirmedAt         DateTime?
    canceledAt          DateTime?
    createdAt           DateTime  @default(now())
    @@index([userId, createdAt])
    @@index([status])
  }
  ```
- [ ] Update `User` inverse relations: `bookings Booking[]`, `bookingDrafts BookingDraft[]`.
- [ ] `pnpm exec prisma generate`.
- [ ] Update `src/lib/env/get-server-features.ts` to surface `bookings: { kind: 'mock' | 'live'; liveEnabled: boolean }` (false in Slice D since live is deferred).
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`. Fix anything that flares.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-d.md` matching the C-series format.
- [ ] Update `README.md` - Slice D status entry, roadmap row, `slice-d` in tags list.
- [ ] Tag `slice-d`. Commit at logical milestones.

---

## What stays unchanged

- `OrchestratorEvent` - bookings are out-of-band from the turn flow.
- Intent agent, providers, redirect, share, persistence, memory, monitoring, itinerary, billing - all preserved.
- Public APIs of `SessionStore`, `MemoryStore`, `BillingProvider` - none touched.
- Voice + design vocabulary unchanged.
- Mock-safe end-to-end remains the invariant - bookings work without keys.

## Out of Slice D scope (deferred to D.x)

- **Real provider booking integrations.** `BookingComBookingProvider` + `ExpediaBookingProvider` slot in via the same `BookingProvider` interface in D.x. They require provider sandbox credentials + a `STAYSCOUT_LIVE_BOOKING=1` opt-in flag.
- **Card capture.** Even with live providers, Slice D's flow ends at the agreement to book. Real-mode integrations hand off to provider Checkout for card capture; D.x decides which providers we trust to host that.
- **Autonomous mode.** `BookingAgent.draftBooking({ autonomous: true })` runs draft → confirm in one shot. D.x adds the premium gate (via the existing `requirePremium(owner)` from C4) + a deliberate "you've authorized autonomous" affordance + per-trip authorization scopes.
- **LLM enrichment.** Free-text traveler parsing ("me + my partner + 2 kids"), conflict resolution ("dates not available, closest is..."), special-request interpretation. Drafts in Slice D are deterministic transformations of the saved trip + form input.
- **Modifications.** Change dates, change guest count, change room type. D.x territory.
- **Group / multi-stay bookings.** Single hero stay only in Slice D. Multi-leg itineraries become separate bookings in D.x.
- **Postgres `BookingStore` impl.** Schema lands in Slice D; impl when we have a DB to integration-test against.
- **Email confirmation.** No transactional email in Slice D - the confirmation page is the only acknowledgment. Resend / Postmark wiring lands later.
- **Refund settlement.** Mock cancellations are "fully refundable in dev." Real providers vary; D.x handles per-provider refund semantics.
- **Cron-based booking-status reconciliation.** A real provider booking can be modified out-of-band (overbooking, force-canceled). A periodic reconciler that polls `provider.getBooking(id)` for any non-terminal booking lands in D.x.
- **Rate limiting on `/api/bookings/confirm`.** Slice D relies on the idempotencyKey to coalesce double-clicks; production-grade abuse protection (per-IP rate limit) is D.x.

## Mock-safe matrix (Slice D end state)

| Vars | Provider | Behavior |
|---|---|---|
| (none) | Mock | Authed user can complete the full draft → approve → confirm flow. Bookings persist in-process; restart clears. |
| (Slice D shipped, real-mode deferred) | Mock | Same - `STAYSCOUT_LIVE_BOOKING` is unread until D.x. Provider keys for search remain unrelated. |
| (D.x: real-mode flag + provider keys set) | Live (per provider) | Real Checkout handoff; webhook for booking-status updates; periodic reconciler. |
