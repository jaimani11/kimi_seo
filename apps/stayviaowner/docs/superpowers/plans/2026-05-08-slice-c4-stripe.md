# Slice C4 Implementation Plan - Stripe (premium tier)

> Executed inline, batched, only pausing for real blockers or missing Stripe account details.

**Goal:** Ship a real Stripe-ready billing architecture in C4 - not a stub. Stripe Checkout in test mode, signature-verified webhook with `event.id` idempotency, subscription status sync, and a local `MockBillingProvider` fallback that triggers only when Stripe env vars are absent. The "Plan day-by-day" CTA in the workspace gets a soft gate: when the destination falls through to the synthesized itinerary path AND the caller's entitlement is free, the page renders an upgrade card instead. Curated Italy stays free for everyone - the demo never breaks.

**Architecture:** A `BillingProvider` interface with two **fully implemented** providers (`MockBillingProvider`, `StripeBillingProvider`) and a `SubscriptionStore` cache keyed by owner. Server-side `requirePremium(owner)` is the only thing UI/routes ever call. Webhooks land on `/api/billing/webhook`, are signature-verified via `stripe.webhooks.constructEvent`, deduplicated by Stripe `event.id`, and update the subscription. Entitlement is sourced from server state every render - clients never claim premium.

**Tech Stack:** New dep: `stripe` (server-only Node SDK). No client-side Stripe; Checkout is the hosted page so PCI scope is zero. Tests use the SDK's own `stripe.webhooks.generateTestHeaderString` to sign fixture events - exercising **real** verification + idempotency + state-sync without needing live network calls. Stripe CLI is documented for end-to-end manual testing against a test account.

---

## Architectural Tenets (Opus-level)

**1. Stripe-first, mock-fallback.** With `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID` set → `StripeBillingProvider` (test or live keys both work; signature verification doesn't care). Without them → `MockBillingProvider`: authed user premium, anon free, fake-checkout flow available so the keyless dev demo always works. C4 ships **both** providers fully implemented + tested.

**2. Subscription state is server-side, always.** Gates call `requirePremium(owner)` server-side every render. No client cookie says "I'm premium." After Checkout, the return URL polls `/api/billing/entitlement` until the webhook lands.

**3. Webhook idempotency is non-negotiable.** Stripe retries. Every event has `event.id`. We persist processed event ids; second delivery short-circuits. Atomic check-and-set so two simultaneous deliveries don't both apply.

**4. Raw body for signature verification.** Next 16's default body parsing breaks Stripe. The webhook route reads `req.text()`, passes the raw string + signature to `stripe.webhooks.constructEvent(...)`. No JSON parsing before verification.

**5. PCI scope = zero.** We never see card numbers. Stripe Checkout (hosted) handles cards; we store `customerId`, `subscriptionId`, `priceId`, `status`, `currentPeriodEnd`. That's it.

**6. Anonymous can't checkout.** Anonymous sessions get free always. Clicking Upgrade → forced sign-in → then checkout. Sign-in promotion (B1's anonymous→user migration path) carries any saved trips/memories; entitlement attaches to the new userId from there.

**7. Soft gate, not hard gate.** Free user on a synthesized itinerary destination sees an upgrade card with a preview of what premium offers, not a 403. Curated destinations stay free for everyone (the demo always works). Only the synthesized fallback path is gated.

**8. One feature gated in C4.** The synthesized itinerary path is the only premium gate this slice. Monitoring on >3 trips, advanced share/embed, etc. are deferred to C4.x. We ship the gate machinery + one real use of it; future gates layer on the same `requirePremium(owner)` call.

---

## File Structure

**Create:**
- `src/core/billing.ts` - Zod schemas + types: `Plan`, `Entitlement`, `Subscription`, `OwnerKey`
- `src/lib/billing/billing-provider.ts` - `BillingProvider` interface
- `src/lib/billing/mock-billing-provider.ts` - `MockBillingProvider`
- `src/lib/billing/stripe-billing-provider.ts` - `StripeBillingProvider` (full impl)
- `src/lib/billing/subscription-store.ts` - `SubscriptionStore` interface
- `src/lib/billing/in-memory-subscription-store.ts` - process-singleton cache
- `src/lib/billing/webhook-idempotency.ts` - `WebhookEventStore` + in-memory impl
- `src/lib/billing/gates.ts` - `requirePremium(owner)` server-side gate
- `src/lib/billing/factory.ts` - `getBillingSubsystem()`
- `src/lib/billing/index.ts` - barrel
- `src/app/api/billing/checkout/route.ts` - POST owner-gated → Checkout URL
- `src/app/api/billing/webhook/route.ts` - POST raw-body Stripe webhook
- `src/app/api/billing/entitlement/route.ts` - GET → `Entitlement`
- `src/app/billing/return/page.tsx` - post-checkout return; polls entitlement
- `src/app/billing/return/poll-entitlement.tsx` - small client-side poller
- `src/app/billing/mock-checkout/page.tsx` - dev-only fake-checkout flow
- `src/app/billing/mock-checkout/actions.ts` - server action that flips mock subscription
- `src/features/billing/upgrade-card.tsx` - soft-paywall card
- `src/features/billing/entitlement-badge.tsx` - small "Premium" chip
- `docs/billing.md` - Stripe setup walkthrough + CLI testing recipe + documented end-to-end test flow
- `.env.example` - placeholders for Stripe + (existing) other env vars
- `tests/mock-billing-provider.test.ts`
- `tests/stripe-billing-provider.test.ts` - fixture-event signature verification + state sync (real verification path)
- `tests/subscription-store.test.ts`
- `tests/webhook-idempotency.test.ts`
- `tests/billing-gates.test.ts`
- `tests/billing-routes.test.ts`
- `tests/itinerary-gate.test.ts`

**Modify:**
- `src/app/trips/[tripId]/itinerary/page.tsx` - gate when `itinerary.source === 'synthesized'` AND not premium
- `src/features/workspace/saved-trips/saved-trip-row.tsx` - show lock icon on "Plan day-by-day →" when non-curated destination + free entitlement (best-effort hint; the page is the source of truth)
- `src/lib/env/get-server-features.ts` - surface `billing: { kind: 'mock' | 'stripe' }`
- `prisma/schema.prisma` - `Subscription` + `WebhookEvent` models (schema lands in C4; PostgresSubscriptionStore wired in C4.x)
- `package.json` - add `stripe` dep
- `README.md` - Slice C4 row + roadmap update

---

## Tasks

### Task 1: Core billing types + schemas (`src/core/billing.ts`)

- [ ] Define types:
  - `Plan = 'free' | 'premium'`
  - `EntitlementSource = 'mock-everyone-premium' | 'stripe-active' | 'stripe-trialing' | 'stripe-canceled-grace' | 'free' | 'mock-anonymous'`
  - `Entitlement { plan: Plan; premiumUntil: Date | null; source: EntitlementSource }`
  - `Subscription { ownerKind: 'user' | 'session'; ownerId: string; stripeCustomerId: string | null; stripeSubscriptionId: string | null; priceId: string | null; status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid' | 'paused' | 'incomplete_expired'; currentPeriodEnd: Date | null; updatedAt: Date }`
- [ ] Zod schemas for all of them. Status enum mirrors Stripe's exactly.
- [ ] `isPremiumStatus(status): boolean` helper - `active` or `trialing` (or `canceled` while still in `currentPeriodEnd` grace).
- [ ] Verify: `pnpm typecheck`.

### Task 2: BillingProvider interface + MockBillingProvider + factory

- [ ] `src/lib/billing/billing-provider.ts`:
  ```ts
  interface BillingProvider {
    kind: 'mock' | 'stripe';
    getEntitlement(owner: OwnerKey): Promise<Entitlement>;
    createCheckoutSession(args: { owner: OwnerKey; returnUrl: string; cancelUrl: string }): Promise<{ url: string }>;
    handleWebhook(args: { rawBody: string; signature: string | null }): Promise<{ ok: true; eventType?: string; eventId?: string } | { ok: false; reason: string }>;
  }
  ```
- [ ] `src/lib/billing/mock-billing-provider.ts`:
  - Anonymous owner → `{ plan: 'free', source: 'mock-anonymous', premiumUntil: null }`.
  - Authenticated owner → `{ plan: 'premium', source: 'mock-everyone-premium', premiumUntil: null }`.
  - `createCheckoutSession` returns `{ url: '/billing/mock-checkout?return=<encoded>' }`.
  - `handleWebhook` returns `{ ok: false, reason: 'mock-provider' }`.
- [ ] `src/lib/billing/factory.ts` - picks provider based on env (`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` both set → stripe; else mock). HMR-safe singleton.
- [ ] `src/lib/billing/index.ts` - barrel.
- [ ] Tests (`tests/mock-billing-provider.test.ts`, ~6):
  - Anonymous owner returns free.
  - Authenticated owner returns premium.
  - `createCheckoutSession` returns the mock-checkout URL.
  - `handleWebhook` is no-op.
  - Factory picks mock when env unset.
  - Owner isolation: same provider serves all owners; calls don't cross-contaminate.
- [ ] Verify: `pnpm typecheck && pnpm test tests/mock-billing-provider.test.ts`.

### Task 3: SubscriptionStore + WebhookEventStore (in-memory) + tests

- [ ] `src/lib/billing/subscription-store.ts`:
  ```ts
  interface SubscriptionStore {
    getByOwner(owner: OwnerKey): Promise<Subscription | null>;
    upsert(record: Subscription): Promise<void>;
    setStatusByStripeSubscriptionId(args: { stripeSubscriptionId: string; status: SubscriptionStatus; currentPeriodEnd: Date | null }): Promise<void>;
  }
  ```
- [ ] `src/lib/billing/in-memory-subscription-store.ts`:
  - Process-singleton via globalThis.
  - Two indexes: by owner-key, by stripeSubscriptionId. Keep them in sync.
  - `upsert` overwrites; `setStatusByStripeSubscriptionId` mutates in place if found, no-op otherwise.
- [ ] `src/lib/billing/webhook-idempotency.ts`:
  ```ts
  interface WebhookEventStore {
    markProcessed(eventId: string): Promise<'new' | 'duplicate'>;
  }
  ```
  - In-memory impl: Set + atomic check-and-set (Promise-resolved Set ops are atomic in Node).
  - LRU cap (default 1000) so the dev set doesn't grow forever.
- [ ] Tests (`tests/subscription-store.test.ts`, ~6):
  - Round-trip per owner.
  - `setStatusByStripeSubscriptionId` updates only the matched row.
  - `setStatusByStripeSubscriptionId` is no-op for unknown id.
  - Owner isolation.
  - Update preserves `stripeCustomerId`.
  - `getByOwner` returns null for unknown owner.
- [ ] Tests (`tests/webhook-idempotency.test.ts`, ~5):
  - First call returns `'new'`.
  - Second call (same id) returns `'duplicate'`.
  - Different ids both return `'new'`.
  - Cap evicts oldest.
  - Concurrent calls for same id: only one returns `'new'`.
- [ ] Verify: `pnpm test tests/subscription-store.test.ts tests/webhook-idempotency.test.ts`.

### Task 4: StripeBillingProvider (real, fully implemented + tested)

- [ ] Add dep: `pnpm add stripe` (latest server SDK).
- [ ] `src/lib/billing/stripe-billing-provider.ts`:
  - Constructor takes `{ secretKey, webhookSecret, priceId, store, eventLog }` - fail fast if any missing.
  - Holds a singleton `Stripe(secretKey, { apiVersion: <pin>, typescript: true })`.
  - `kind: 'stripe'`.
  - `getEntitlement(owner)`:
    - Anonymous → free (`source: 'free'`).
    - User → look up `Subscription` via store. If none → free. If found, derive plan from `isPremiumStatus(status, currentPeriodEnd)`. `canceled` while `currentPeriodEnd > now` → premium with `source: 'stripe-canceled-grace'`.
  - `createCheckoutSession(args)`:
    - Anonymous → throw `BillingError('sign-in-required')`.
    - User → ensure customer exists (lookup by stored `stripeCustomerId`; if none, `stripe.customers.create({ metadata: { ownerKind, ownerId } })` + persist via store).
    - `stripe.checkout.sessions.create({ mode: 'subscription', customer, line_items: [{ price: priceId, quantity: 1 }], client_reference_id: ownerId, metadata: { ownerKind, ownerId }, success_url: returnUrl, cancel_url: cancelUrl, allow_promotion_codes: true })`.
    - Return `{ url: session.url }`.
  - `handleWebhook({ rawBody, signature })`:
    - If no signature header → `{ ok: false, reason: 'no-signature' }`.
    - Verify with `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`. Throw → `{ ok: false, reason: 'signature' }` (logged, not re-thrown).
    - Idempotency: `const r = await eventLog.markProcessed(event.id)`. If `'duplicate'` → `{ ok: true, eventType: event.type, eventId: event.id, idempotent: true }` (DO NOT re-apply).
    - Switch on `event.type`:
      - `checkout.session.completed`: extract `metadata.ownerKind/ownerId`, `customer`, `subscription` from session. Fetch full subscription via `stripe.subscriptions.retrieve(...)`. Upsert: ownerKind/ownerId, stripeCustomerId, stripeSubscriptionId, priceId (from `subscription.items.data[0].price.id`), status, currentPeriodEnd.
      - `customer.subscription.created` | `customer.subscription.updated`: extract from event payload directly; lookup ownerKind/ownerId via `metadata` (set during checkout). Upsert with current status + currentPeriodEnd.
      - `customer.subscription.deleted`: `setStatusByStripeSubscriptionId({ stripeSubscriptionId: subscription.id, status: 'canceled', currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null })`.
      - Other event types: ignore (return `{ ok: true, eventType: event.type, ignored: true }`).
    - Return `{ ok: true, eventType: event.type, eventId: event.id }`.
- [ ] Update `src/lib/billing/factory.ts`:
  - Both `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID` set → `StripeBillingProvider`.
  - Any subset present (partial config) → log a clear warning + fall back to `MockBillingProvider`. Don't half-construct.
  - `kind` reflects which path was taken so `/admin` can show it.
- [ ] Tests (`tests/stripe-billing-provider.test.ts`, ~10) - these exercise the **real** verification + state-sync paths via SDK fixture helpers, no live network:
  - Use a fixed `webhookSecret = 'whsec_test_secret_for_unit_tests'` and a stubbed `Stripe` checkout client.
  - `handleWebhook` rejects request with no signature.
  - `handleWebhook` rejects request with invalid signature (constructed with wrong secret).
  - Valid signature for `checkout.session.completed` → upsert lands with correct ownerKey, customerId, subscriptionId, priceId, status='active'.
  - Valid signature for `customer.subscription.updated` → status flips ('active' → 'past_due') + currentPeriodEnd updates.
  - Valid signature for `customer.subscription.deleted` → status flips to 'canceled', currentPeriodEnd preserved for grace.
  - Same `event.id` delivered twice → second call returns `idempotent: true`, store mutated only once.
  - Unknown event type → `{ ok: true, ignored: true }`, store untouched.
  - `createCheckoutSession` for anonymous owner → throws BillingError.
  - `createCheckoutSession` for user owner with no existing customer → calls `customers.create` then `checkout.sessions.create` with correct args (assert via stub-call records).
  - `getEntitlement` returns 'stripe-canceled-grace' source when status='canceled' but currentPeriodEnd in future.
  - **Implementation note for the test file:** sign payloads with `Stripe.webhooks.generateTestHeaderString({ payload, secret })`. Stub `Stripe.checkout.sessions.create`, `Stripe.customers.create`, `Stripe.subscriptions.retrieve` via Vitest spy on a thin client wrapper or via `vi.mock('stripe', ...)`.
- [ ] Verify: `pnpm typecheck && pnpm lint && pnpm test tests/stripe-billing-provider.test.ts`.

### Task 5: API routes

- [ ] `src/app/api/billing/checkout/route.ts`:
  - `runtime = 'nodejs'`.
  - POST. Resolve auth via `getServerAuth()`. If anonymous → 401 `{ error: 'sign-in-required' }`.
  - Body: `{ returnUrl, cancelUrl }` - Zod-parse.
  - Call `provider.createCheckoutSession({ owner, returnUrl, cancelUrl })`.
  - Return `{ url }`.
- [ ] `src/app/api/billing/webhook/route.ts`:
  - `runtime = 'nodejs'`. `dynamic = 'force-dynamic'`.
  - POST. `const rawBody = await req.text()`. `const signature = req.headers.get('stripe-signature')`.
  - Call `provider.handleWebhook({ rawBody, signature })`.
  - On `{ ok: false, reason: 'signature' }` → 400. Else → 200.
  - Always return JSON; never throw to Stripe (it'll retry forever).
- [ ] `src/app/api/billing/entitlement/route.ts`:
  - GET. Resolve `getServerAuth()` + `ownerOf()` + `provider.getEntitlement(owner)`.
  - Return `Entitlement`.
- [ ] Tests (`tests/billing-routes.test.ts`, ~7):
  - Checkout 401 for anonymous (mock).
  - Checkout returns mock URL for authenticated (mock).
  - Entitlement returns free for anonymous.
  - Entitlement returns premium for authenticated (mock).
  - Webhook signature failure returns 400 (with stripe provider stubbed via `STRIPE_SECRET_KEY` env in test).
  - Webhook returns 200 on duplicate event.
  - Webhook applies once per event id.
- [ ] Verify: `pnpm test tests/billing-routes.test.ts`.

### Task 6: Server-side gates + itinerary integration

- [ ] `src/lib/billing/gates.ts`:
  ```ts
  export async function requirePremium(owner: OwnerKey): Promise<{ entitled: true; entitlement: Entitlement } | { entitled: false; entitlement: Entitlement; reason: 'free' | 'anonymous' }>;
  ```
  - Calls `getBillingSubsystem().provider.getEntitlement(owner)`. Returns shape above.
- [ ] Modify `src/app/trips/[tripId]/itinerary/page.tsx`:
  - After loading itinerary + before rendering, if `itinerary.source === 'synthesized'`:
    - `const gate = await requirePremium(owner)`.
    - If `!gate.entitled` → render `<UpgradeView>` with destination + reason instead of `<ItineraryView>`.
  - Curated path is unchanged - no gate.
- [ ] Tests (`tests/billing-gates.test.ts`, ~5):
  - `requirePremium` returns entitled for premium.
  - Returns not-entitled with reason 'anonymous' for session owner.
  - Returns not-entitled with reason 'free' for free authed user (only reachable in stripe mode).
  - Idempotent across calls.
  - Reads provider's current state (no caching across calls).
- [ ] Tests (`tests/itinerary-gate.test.ts`, ~5):
  - Curated itinerary on free user shows itinerary (no upgrade).
  - Synthesized itinerary on premium user shows itinerary.
  - Synthesized itinerary on anonymous shows upgrade.
  - Synthesized itinerary on free authed user shows upgrade (stripe mode).
  - Trip-not-owned still 404s before gate (gate doesn't bypass auth).
- [ ] Verify: `pnpm typecheck && pnpm test`.

### Task 7: UI (upgrade card + badge + lock + return + mock-checkout)

- [ ] `src/features/billing/upgrade-card.tsx`:
  - Surface-elevated card. Heading (Fraunces): "Day-by-day for everywhere - premium."
  - Italic detail (Fraunces italic): destination-specific copy ("we hand-write three days for the seven Italian regions; everywhere else needs the model - that's premium.").
  - Bulleted preview of premium features (current + planned).
  - Primary CTA → starts checkout via `POST /api/billing/checkout`.
  - Secondary "Sign in" link if `reason === 'anonymous'`.
- [ ] `src/features/billing/entitlement-badge.tsx`:
  - Tiny chip - "PREMIUM" geist-mono uppercase, surface-2 bg, accent border. Shown in workspace header when entitled.
  - Hides itself on free / anonymous.
  - Server-rendered; takes `entitlement: Entitlement` as prop.
- [ ] Modify `src/features/workspace/saved-trips/saved-trip-row.tsx`:
  - Add a small lock glyph (Unicode `🔒` or SVG) to the "PLAN DAY-BY-DAY →" link when destination would synthesize AND entitlement is free.
  - This is a hint only - the page is the source of truth. Reuse the existing curated-destination set: `isCuratedDestinationSlug(slug)` helper from `src/lib/curation` (export it if not already).
- [ ] `src/app/billing/return/page.tsx`:
  - Server component. After Checkout, Stripe redirects here.
  - Polls `/api/billing/entitlement` client-side (small client component) every 1s up to 10s, then renders state.
  - Once entitled, redirects to `/` (workspace).
- [ ] `src/app/billing/mock-checkout/page.tsx`:
  - Dev-only mock-checkout. Shows "[mock] this would be Stripe Checkout in real mode" + a "Pretend to pay" button.
  - Clicking calls a server action that flips the in-memory subscription to active for the user, then redirects to the return URL.
  - Only mounted when factory is in mock mode.
- [ ] Verify: `pnpm typecheck && pnpm lint && pnpm format:check`.

### Task 8: `.env.example` + `docs/billing.md` (Stripe CLI walkthrough)

- [ ] Create `.env.example` (or update if exists). Include placeholders for **all** env vars the project reads, with comments. The Stripe block:
  ```dotenv
  # ============== Billing (Slice C4) ==============
  # All three must be set for StripeBillingProvider; otherwise MockBillingProvider is used.
  # Use sk_test_... / whsec_... / price_... for development against Stripe's test mode.
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  STRIPE_PRICE_ID=
  # Optional: override the URL Stripe redirects to after checkout. Defaults to
  # `${request origin}/billing/return`.
  # STRIPE_RETURN_URL=
  ```
- [ ] Create `docs/billing.md` covering:
  - **What ships in C4**: BillingProvider interface, MockBillingProvider, StripeBillingProvider, soft-gate on synthesized itinerary.
  - **Mock-mode (no keys)**: every authed user is premium, anon free, `/billing/mock-checkout` simulates the flow. Curated Italian destinations stay free for everyone.
  - **Stripe test-mode setup**:
    1. Create a Stripe account (or use an existing one in test mode).
    2. Dashboard → Products → New Product ("StayScout Premium", recurring monthly, e.g. $9.99). Note the `price_...` id.
    3. Dashboard → Developers → API keys → copy `sk_test_...` (Secret key).
    4. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (or platform equivalent).
    5. `stripe login`.
    6. `stripe listen --forward-to localhost:3000/api/billing/webhook` - copy the printed `whsec_...`.
    7. Drop `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` into `.env.local`.
    8. Restart `pnpm dev`.
  - **Documented end-to-end test flow**:
    - Sign in to the app (any auth method that resolves to a `userId`).
    - Open a saved trip in a non-curated destination (anything outside the 7 Italian regions, e.g. "Tokyo, slow week").
    - Click "Plan day-by-day →" - page renders the upgrade card (synthesized + free).
    - Click "Upgrade to Premium" - redirects to Stripe Checkout test page.
    - Use test card `4242 4242 4242 4242`, any future expiry, any 3-digit CVC, any zip.
    - Stripe redirects to `/billing/return`, which polls entitlement.
    - The `stripe listen` CLI logs the `checkout.session.completed` event being forwarded to our webhook.
    - Within ~1s the webhook lands; entitlement flips to premium; the return page redirects to the workspace.
    - Re-open the same itinerary URL - synthesized itinerary now renders (gate cleared).
    - Verify in Stripe Dashboard → Customers → the customer row exists with the active subscription.
    - Trigger a status change: `stripe trigger customer.subscription.updated` - webhook receives it; `getEntitlement` reflects the new state.
    - Trigger cancellation: `stripe trigger customer.subscription.deleted` - status flips to 'canceled'; entitlement remains premium until `currentPeriodEnd` (grace period).
  - **Idempotency check**: Re-deliver an event from the Stripe Dashboard ("Resend") - webhook returns 200 with `idempotent: true` and store state is unchanged. Verify in server logs.
  - **Test cards reference**: `4242...` (success), `4000 0000 0000 0002` (declined), `4000 0027 6000 3184` (3DS required). Link to Stripe's test cards page.
  - **Production switch**: Replace `sk_test_...` with `sk_live_...` and update the webhook endpoint's signing secret in production. No code change.
  - **Care points** (cross-link to architectural tenets in this plan):
    - Webhook is idempotent on `event.id` - Stripe retries are safe.
    - Subscription state is server-side source of truth; no client cookie ever claims premium.
    - Anonymous sessions can't check out; sign-in is required first.
    - PCI scope = zero; Stripe Checkout is the hosted page.
- [ ] Verify: `docs/billing.md` reads top-to-bottom as a working setup guide for someone with zero prior context.

### Task 9: Pipeline + changelog + slice-c4 tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`. Fix anything that flares.
- [ ] Update `prisma/schema.prisma`:
  ```prisma
  model Subscription {
    id                    String   @id @default(cuid())
    userId                String   @unique
    user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    stripeCustomerId      String?  @unique
    stripeSubscriptionId  String?  @unique
    priceId               String?
    status                String
    currentPeriodEnd      DateTime?
    updatedAt             DateTime @updatedAt
    @@index([status])
  }

  model WebhookEvent {
    id        String   @id // stripe event.id
    type      String
    processedAt DateTime @default(now())
  }
  ```
  - Run `pnpm exec prisma generate` (no migrate - schema lands in C4; PostgresSubscriptionStore impl in C4.x).
- [ ] Update `src/lib/env/get-server-features.ts` to surface `billing: { kind: 'mock' | 'stripe' }`.
- [ ] Update README - Slice C4 status entry, roadmap row, brief Stripe-test-mode note pointing at `docs/billing.md`.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-c4.md` matching the C1/C2/C3 format. Include the documented end-to-end test flow as the "Demo behavior" section.
- [ ] Tag `slice-c4`. Commit at logical milestones (per-task commits or grouped where related).

---

## What stays unchanged

- Auth model - same `getServerAuth()` + `ownerOf()` everywhere.
- Saved-trips API + share + redirect - untouched.
- Memory + monitoring + itinerary subsystems - read-only consumers of the gate.
- Mock-safe end-to-end: keyless dev still ships every flow (curated itineraries are unaffected; synthesized fallback shows upgrade in mock mode for anonymous, and "everyone premium" for authenticated dev users).

## Out of C4 scope (deferred to C4.x)

- `PostgresSubscriptionStore` impl (schema lands in C4; impl in C4.x with a real DB to integration-test against).
- Refunds + proration handling beyond what Stripe surfaces in `customer.subscription.updated`.
- Annual vs monthly + multi-tier (C4 ships single "Premium" plan).
- Stripe Customer Portal (cancel + update card without leaving the app).
- Per-feature granular gating beyond synthesized-itinerary.
- Email/transactional notifications on subscription change.
- Live integration tests run against an actual Stripe test account in CI (current C4 tests use SDK fixture-signing, which exercises the same verification code path without network).
- `ModelItineraryGenerator` itself - C3 deferred this; C4 unlocks the demand but the impl arrives when Viator is wired.

## Mock-safe matrix (Slice C4 end state)

| Vars | Provider | Behavior |
|---|---|---|
| (none) | Mock | Authed = premium, anon = free. Mock-checkout flow available. |
| All three: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID` (test or live) | Stripe | Real Checkout + webhook. Subscription state is source of truth. Use `sk_test_...` for development. |
| Partial: any subset of the three | Mock + warning | Logs a clear warning naming the missing var(s), falls back to mock so dev never silently breaks. |
