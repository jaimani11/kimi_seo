# StayScout - runtime demo & handoff

Last updated after the runtime stabilization pass (8 batches). Walks
through the app end-to-end, what's mocked vs real, and the highest-risk
items to address before a production deployment.

---

## Localhost

```bash
pnpm dev
# → http://localhost:3000
```

Boots in ~300ms. Defaults to keyless mock-safe mode - every flow except
real booking/checkout works without any env vars. `.env.local` controls
which subsystems flip to live mode (see [Mocked vs real](#mocked-vs-real)).

When the dev server is running, also useful:

| URL | Purpose |
|---|---|
| `http://localhost:3000/` | Workspace (the main app). |
| `http://localhost:3000/admin` | Operator console - turns/clicks/users/memories/bookings dashboards. Open without auth in keyless dev. |
| `http://localhost:3000/destinations` | SEO landing - hand-curated Italian destination pages. |
| `http://localhost:3000/destinations/tuscany` | One destination drill-in (replace slug for the others). |

---

## Demo journeys

### Journey 1 - concierge compose (curated path)

1. Open `http://localhost:3000/`.
2. In the chat sidebar, click **`Tuscany, slow and walkable`** (a suggested prompt).
3. The canvas streams: agent steps appear in the chat, then the trip board materializes with a hero stay (`Borgo Sant'Ambrogio`) and 3 alternatives.
4. Mood-snapshot card renders ("Golden-hour vineyard dinners…").
5. The chat shows the concierge's recap: _"Tuscany - slow, walkable. Hero pick plus 3 alternatives."_

**Verified:** 16 events, ~2.5s, no `turn.failed`.

### Journey 2 - concierge compose (synthesized path / luxury market)

1. Type `Tokyo for a long weekend`.
2. The same materialization completes - hero from the LLM-synthesized provider (Aman, Mandarin, capsule pod, etc., depending on what the model returns).
3. Verify the price renders correctly even for $5K+/night luxury stays (see [Bug history](#bug-history)).

**Verified:** 16 events, ~10s (the LLM call dominates), no `turn.failed`. **This used to fail** with "Couldn't find anything that fits" before the price-cap fix.

### Journey 3 - refine

1. From a saved Tuscany trip, type `more walkable, less remote` in the chat sidebar.
2. The board re-streams with adapted picks; an `adaptation.delta` chip appears explaining the change.

### Journey 4 - save trip → list trips

1. On the trip-board, click **Save trip**.
2. The trip lands in the saved-trips panel (open via the bookmark icon).
3. Refresh the page - the trip is still there (cookie persists, in-memory store keyed off the session).

### Journey 5 - plan day-by-day (curated)

1. From the saved-trips panel, click **PLAN DAY-BY-DAY →** on a Tuscany row.
2. Lands on `/trips/<id>/itinerary` with the hand-curated 3-day Tuscany plan: Florence, Chianti, Siena themes; ~5 slots per day.

### Journey 6 - plan day-by-day (synthesized → upgrade card)

1. Save a Tokyo trip (or any non-curated destination).
2. Click **PLAN DAY-BY-DAY →** on that row.
3. Lands on the **upgrade card** instead of an itinerary - _"Day-by-day for everywhere - premium."_
4. In keyless dev (mock billing + no Clerk), clicking **Upgrade to Premium** redirects to `/sign-in` - that's the correct gate, but to actually complete the flow you'll need Clerk + (optionally) Stripe configured. See [Mocked vs real](#mocked-vs-real).

### Journey 7 - billing/upgrade (mock mode)

1. With auth + keyless billing: every authenticated user is auto-premium (`source: mock-everyone-premium`). Synthesized itineraries unlock automatically.
2. With auth + Stripe configured: clicking **Upgrade to Premium** kicks off real Checkout. After the test card lands and the webhook fires, the entitlement flips. See [`docs/billing.md`](./billing.md) for the full Stripe-CLI walkthrough.

### Journey 8 - booking + cancellation

Booking requires sign-in (anonymous returns 401 by design - we need a stable owner key for the confirmation page + admin trail).

1. Sign in (Clerk).
2. From a saved trip's footer, click **BOOK THIS →**.
3. Modal step 1: enter traveler name, email, guest count.
4. Modal step 2: review the structured draft (dates, total, cancellation policy). Click **Confirm booking**.
5. Lands on `/bookings/<id>` with a confirmation card (provider reference, dates, total).
6. Click **Cancel booking** → first click flips to "Click again to confirm cancel" → second click fires.
7. Page refreshes with `× Canceled` status.

**Mock mode (default):** the booking provider is `MockBookingProvider`. Bookings live in-process and are deterministic. Real provider booking lands in D.x.

### Journey 9 - admin console

1. Open `http://localhost:3000/admin` (no auth needed in keyless dev).
2. Dashboard shows turn count, p50/p95 latency, total cost, error rate, billing mode (Mock or Stripe).
3. Click any **turn id** → drills into `/admin/turns/<id>` with the agent timeline (per-step duration, tokens, cost, errors).
4. Click any **session id** → owner aggregate at `/admin/users/<id>?kind=session` (saved trips, clicks, memories, billing entitlement, recent turns).
5. Top nav: **Clicks** (affiliate redirect feed), **Bookings** (sibling), **Memories** (per-owner index, similarity search via `?q=` param).

---

## Recommended prompts for the demo

Copy/paste these into the chat sidebar. Each exercises a different subsystem.

| Prompt | What it shows |
|---|---|
| `Tuscany, slow and walkable` | Curated Italian path (MockItalyProvider) - fastest, most polished output. |
| `Amalfi Coast for our anniversary` | Curated, romantic vibe inference, mood snapshot. |
| `Rome with two kids, walking distance to everything` | Curated, family vibe + walkability. |
| `Tokyo for a long weekend` | LLM-synthesized path; verifies the luxury price-cap fix. |
| `Patagonia in shoulder season` | Synthesized; remote vibe; wider price range. |
| `Lisbon under €200/night, near music` | Synthesized + budget constraint + niche vibe (foodie/cultural). |
| _(refine)_ `more walkable, less remote` | Adaptation flow on the existing proposal. |
| _(refine)_ `actually, prefer something quieter` | Adaptation note shows reasoning. |

---

## Mocked vs real

By default everything is mock-safe - no keys, no DB, no payments. Each
subsystem flips to live mode independently when its env vars are set.
See [`.env.example`](../.env.example) for the canonical list.

| Subsystem | Default (mock) | Live mode trigger | What changes |
|---|---|---|---|
| Anthropic model client | Stub (deterministic outputs in tests; in dev: deterministic mock that returns canned data) | `ANTHROPIC_API_KEY` | IntentAgent + LLMSynthesizedProvider call real Claude API. |
| Auth | Anonymous (cookie session) | `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sign-in/sign-out enabled; trips migrate from anon → user on sign-in. |
| Persistence | In-memory (process-local, lost on restart) | `DATABASE_URL` | Trips, turns, clicks, memories, subscriptions, bookings persist in Postgres via Prisma. |
| Provider router | MockItaly + LLMSynthesized | `BOOKING_COM_*` / `EXPEDIA_*` keys | Real provider search via the same router; mocks become fallback. |
| Memory | Bag-of-words embeddings + in-memory ring buffer | `STAYSCOUT_USE_ANTHROPIC_EMBEDDINGS=1` (+ Anthropic key); `STAYSCOUT_PGVECTOR=1` (+ DB) | Real embeddings; durable cross-session memory via pgvector. |
| Monitoring (saved-trip watcher) | Mock-checker (deterministic synthetic events) | (real-mode lands in C2.x) | Real provider re-checks for price/availability changes. |
| Itinerary generator | Curated (7 Italian dests) + synthesized fallback | (model-mode lands in C3.x) | LLM-generated itineraries for non-curated dests, with Viator activity search. |
| Billing | `MockBillingProvider` (every authed user premium; anon free) | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID` | Real Stripe Checkout + webhook + subscription state. Setup: [`docs/billing.md`](./billing.md). |
| Booking | `MockBookingProvider` (idempotent in-memory; deterministic confirmation refs) | `STAYSCOUT_LIVE_BOOKING=1` (+ provider keys) - **lands in D.x** | Real reservation API + Checkout handoff for card capture. The seam is in place; the wiring is deferred. |
| Tracing | In-memory ring buffer | `LANGFUSE_*` keys | Every turn becomes a Langfuse trace. |
| Admin gate | Open in keyless dev | Clerk + sign-in required | Or override with `STAYSCOUT_ADMIN_PUBLIC=1` for staging. |

---

## Bug history (this stabilization pass)

Eight named batches; everything verified end-to-end via the dev server.

| # | Title | What it fixed |
|---|---|---|
| 1 | Design-token consistency | 44 phantom CSS variables (`--surface-1/2/3`, `--accent`, `--accent-warning`) → real tokens; added missing `--accent-warning` family. |
| 2 | Modal a11y + booking mobile | New `useModalA11y` hook (ESC, focus trap, autofocus, scroll lock, restore); booking modal mobile-friendly + autofill. |
| 3 | Copy honesty | Removed false "We'll email you" promise; removed "in production" dev-talk leak. |
| 4 | Streaming resilience | `JsonlLineBuffer` helper with 7 unit tests; multi-byte UTF-8 + no-trailing-newline + HTTP error body propagation. |
| 5 | Featured-today price formatting | One-line consistency fix. |
| 6 | Three runtime bugs from journey verification | (a) **`pricePerNight.max(3000)`** dropped every Tokyo/Singapore/NYC luxury batch - raised to 25K + clamping in coercer. (b) **Two `Set-Cookie` headers per response** with diverging session ids - middleware now propagates the minted id to `req.cookies`. (c) **`sessionId` required in concierge body** - split body schema from canonical schema; cookie is canonical. |
| 7 | globalThis singleton sweep | All 8 subsystem factories were module-singleton - in Next 16 + Turbopack dev, server components and route handlers can have separate module bundles. Trip saved via API was invisible to the server-rendered itinerary page. Anchored every singleton to `globalThis`. |
| 8 | Surface polish | `nights = 0` no longer renders as "0 nights" anywhere; mood snapshot emission guarded against empty text. |

**Pipeline at handoff:** 468 tests across 59 files passing, 0 type errors, 0 lint warnings, format clean, build clean. 8 commits past `slice-d`.

---

## Remaining high-risk areas before production

In priority order.

### 1. Persistence is still in-memory in keyless dev - and most ops paths.

`DATABASE_URL` flips trips/turns/clicks/memories to Postgres. But several
in-memory subsystems don't yet have Postgres impls (booking, billing
subscriptions, monitoring snapshots, webhook event log, itinerary cache,
memory store). Schema is in place for some (Subscription + WebhookEvent
+ Booking + BookingDraft); impls land in C1.x, C4.x, D.x respectively.

**Risk in production:** anything in those subsystems is process-local +
lost on restart. For a single-instance deploy that's tolerable for
days; for multi-instance / blue-green / scaling it's broken.

**Mitigation:** wire the pending Postgres impls before going wide.

### 2. Session security - anonymous cookie is unsigned.

`stayscout-session=anon_<uuid>` is HttpOnly + SameSite=Lax + 90-day
Max-Age, but **not signed**. A user can mint their own cookie and
become any anonymous owner. That matters because it's the trip-ownership
key in the in-memory store + the foreign-key target in Postgres.

**Risk in production:** moderate. An attacker who can guess or steal an
`anon_<uuid>` can read+write that owner's trips. Without DB persistence
the impact is also low; with DB it grows with user count.

**Mitigation:** sign the cookie with HMAC + a server secret, or require
Clerk for anything beyond casual demo. See `slice-b1-persistence` for
the migration story.

### 3. Real provider booking is unwritten.

`MockBookingProvider` confirms idempotently, but no money moves and no
real reservation is created. `STAYSCOUT_LIVE_BOOKING=1` is read +
surfaced (`liveEnabled: true`) but doesn't flip the actual provider -
that's D.x territory. Card capture is also deferred; production booking
hands off to provider Checkout.

**Risk in production:** users see the booking flow work end-to-end in
mock mode, which could make a casual demo look more capable than it
is. The admin `/admin/bookings` feed labels the provider as `mock` so
operators can tell.

**Mitigation:** if shipping to real users, gate the **Book this** CTA
behind `subsystem.kind === 'live'` (or hide it entirely until D.x).

### 4. Webhook idempotency is in-memory.

Stripe retries on any non-2xx - safe for our `markProcessed(event.id)`
pattern, but the LRU is process-local with a 1000-entry cap. After
restart, the next replay of a previously-applied event re-applies it.
The Postgres-backed `WebhookEvent` table exists in schema but the
impl is C4.x.

**Risk in production:** double-applying a stale subscription.update
that was already processed is benign in practice (the same status set
again). Double-applying a checkout.session.completed could double-issue
entitlement, but Stripe doesn't replay the same id after a successful
2xx - only after a 5xx.

**Mitigation:** wire `PostgresWebhookEventStore` before live Stripe.

### 5. Anthropic API costs are unbounded.

Every concierge turn calls Claude (IntentAgent + LLMSynthesizedProvider
for non-Italy). No per-session rate limit, no spending cap. Burstable
attack surface: 100 concurrent users typing nonsense = ~$X/min.

**Risk in production:** moderate. Burning API credits is the obvious
risk; the deeper one is denial-of-service via cost amplification.

**Mitigation:** rate-limit per session/IP at the edge; add a per-user
spending budget surfaced via `/admin`. Slice C1's memory subsystem
already records turns per owner - extend it to count + cap.

### 6. Mobile responsiveness is partial.

The booking modal is mobile-friendly (Batch 2). The admin DataTables
are `overflow-x-auto` - functional but unpremium on phones. The
trip-board layout is desktop-first; not yet tested at 375px in the
runtime pass.

**Risk in production:** most users on mobile, lower conversion if the
shop is rough.

**Mitigation:** dedicated mobile pass on the trip-board + admin tables.
Probably 1-2 batches; out of scope for this stabilization round.

### 7. Tests don't cover the runtime journey bugs we just fixed.

The 7 new `JsonlLineBuffer` unit tests + 5 new price-clamping tests
are good. But the cookie-mismatch bug (Batch 6.b) and the
globalThis-singleton bug (Batch 7) aren't covered by automated tests -
they were found by walking journeys manually.

**Risk:** regression on either is invisible to CI.

**Mitigation:** integration tests that exercise the request → save →
read flow across multiple "module bundles" (simulated by importing
factories from different test files). At minimum a lint rule against
module-local `let _instance` patterns in factory files.

### 8. The `STAYSCOUT_BOOKING_FAIL=1` debug knob.

Convenient for local testing of the failure path; if accidentally set
in production it makes the next booking fail then self-clears. Subtle
foot-gun.

**Risk:** low - but worth gating on `NODE_ENV !== 'production'`.

**Mitigation:** one-line check; tracked but not done in this pass.

---

## What "production-ready" means specifically

Before going wide:
- [ ] Wire `DATABASE_URL` + run `pnpm exec prisma migrate deploy` against Postgres.
- [ ] Configure `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- [ ] Configure `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID`. Run the [Stripe-CLI walkthrough](./billing.md).
- [ ] Build the `PostgresBookingStore` + `PostgresWebhookEventStore` + `PostgresSubscriptionStore` impls (D.x + C4.x).
- [ ] Sign the anonymous-session cookie (HMAC).
- [ ] Add per-session rate-limiting on `/api/concierge`.
- [ ] Cron-based booking-status reconciler (D.x).
- [ ] Audit log of admin actions if `/admin` is exposed in live mode.
- [ ] Mobile responsiveness pass on trip-board + admin tables.

Before any user can book a real reservation:
- [ ] Real `BookingComBookingProvider` impl (D.x).
- [ ] Card-capture handoff to provider Checkout.
- [ ] Refund/cancellation reconciliation per provider's policy.
- [ ] Email confirmation (transactional email - Resend/Postmark).

---

## How to verify the runtime is healthy

Manual smoke:

```bash
# 1. Boot
pnpm dev   # http://localhost:3000

# 2. Compose stream completes
curl -sN -m 30 -H "Content-Type: application/json" \
  -d '{"turnId":"t_smoke","type":"compose","input":{"rawInput":"Tuscany, slow and walkable"},"clientCapabilities":{"supportsAdaptationDelta":true,"supportsMoodSnapshot":true,"supportsMemoryHint":true}}' \
  http://localhost:3000/api/concierge \
  | jq -r 'select(.kind=="turn.completed" or .kind=="turn.failed") | .kind'
# Expected: turn.completed

# 3. Admin renders
curl -s http://localhost:3000/admin -o /dev/null -w "%{http_code}\n"
# Expected: 200

# 4. Test suite
pnpm test
# Expected: 468 passed (across 59 files)
```

---

If something feels off in the demo, look at `/tmp/stayscout-dev.log` -
the dev server logs every concierge turn (`[concierge] incoming turn …`)
and every coercion + provider-error path with structured warnings.
