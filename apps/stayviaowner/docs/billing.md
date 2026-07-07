# Billing - Stripe setup + test-mode walkthrough

Slice C4 ships a real Stripe-backed paid tier with a mock fallback for keyless dev. This doc walks through:

1. [What ships in C4](#what-ships-in-c4)
2. [Mock mode (no keys)](#mock-mode-no-keys)
3. [Stripe test-mode setup](#stripe-test-mode-setup)
4. [Documented end-to-end test flow](#documented-end-to-end-test-flow)
5. [Idempotency check](#idempotency-check)
6. [Test cards reference](#test-cards-reference)
7. [Production switch](#production-switch)
8. [Architecture care points](#architecture-care-points)

---

## What ships in C4

- **`BillingProvider` interface** - single seam for entitlement, checkout, and webhook handling. `MockBillingProvider` and `StripeBillingProvider` both implement it; the factory picks one based on env.
- **`StripeBillingProvider`** - full Stripe integration. Hosted Checkout for cards (PCI scope = zero), signature-verified webhooks, idempotent on Stripe `event.id`, owner state synced from `checkout.session.completed` + `customer.subscription.{created,updated,deleted}`.
- **`MockBillingProvider`** - keyless dev default. Every authed user is premium, anon = free. Mock-checkout flow at `/billing/mock-checkout` simulates the Stripe redirect cycle so the UI is exercisable without keys.
- **`requirePremium(owner)` gate** - server-side source of truth. The synthesized-itinerary path is the one feature gated in C4. Curated Italian destinations stay free for everyone - the demo never breaks.
- **API surface** - `POST /api/billing/checkout` (owner-gated), `POST /api/billing/webhook` (raw-body, signature-verified), `GET /api/billing/entitlement` (current entitlement read).
- **UI** - `UpgradeCard` on the itinerary page when gated, `EntitlementBadge` for the workspace header, lock icon on saved-trip rows for non-curated destinations, `/billing/return` post-checkout poll page.
- **Schema (deferred impl)** - `Subscription` + `WebhookEvent` tables in `prisma/schema.prisma`. C4 stays in-memory; the Postgres impl wires up in C4.x against a real DB.

## Mock mode (no keys)

When `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` are all unset, the factory returns `MockBillingProvider`:

- Authenticated users → `entitlement.plan === 'premium'`, `source: 'mock-everyone-premium'`.
- Anonymous (session) owners → `entitlement.plan === 'free'`, `source: 'mock-anonymous'`.
- `/api/billing/checkout` returns a URL pointing at the in-app `/billing/mock-checkout` page (a stand-in showing what the real Stripe Checkout flow looks like).
- `/api/billing/webhook` returns `503 billing-not-configured` if hit - the mock provider has no webhooks. (If you've pointed the Stripe CLI at this endpoint by accident in mock mode, this 503 + the warning log is your signal.)

Curated Italian destinations (Tuscany, Umbria, Amalfi, Rome, Venice, Lake Como, Cinque Terre) **never hit the gate** - the curated itinerary renders for free, anonymous or signed-in. Only the synthesized fallback (any other destination) requires premium.

## Stripe test-mode setup

You need a Stripe account in test mode. (If you have a live account, the same dashboard switches between test and live with one toggle.)

### 1. Create a recurring product

Stripe Dashboard → **Products** → **New product**. Anything works for the demo:

- Name: `StayScout Premium`
- Pricing model: **Recurring**, monthly, e.g. `$9.99 USD`

After saving, copy the **Price ID** (`price_…`) - you'll set it as `STRIPE_PRICE_ID`.

### 2. Get your test API key

Stripe Dashboard → **Developers** → **API keys** → **Secret key**. Copy `sk_test_…` (don't share - it's the bearer token for your account in test mode).

### 3. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux / Windows: see https://docs.stripe.com/stripe-cli
```

Then authenticate:

```bash
stripe login
```

A browser opens; approve, come back to the terminal.

### 4. Forward webhooks to your local dev server

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

The CLI prints a one-time webhook signing secret like `whsec_…`. Copy it - that's your `STRIPE_WEBHOOK_SECRET` for this terminal session. (Restart the CLI = new secret. In production you'd configure a permanent webhook in the Dashboard with its own signing secret.)

Keep this terminal running while you test - it pipes Stripe events into your local app.

### 5. Drop env vars into `.env.local`

```dotenv
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME_FROM_STRIPE_LISTEN
STRIPE_PRICE_ID=price_REPLACE_ME_FROM_DASHBOARD
```

### 6. Restart `pnpm dev`

The app re-reads env on boot. The factory now constructs `StripeBillingProvider`. `/admin` (when wired in C5) will show `billing.kind === 'stripe'`.

## Documented end-to-end test flow

This is the canonical demo flow. Each step is verifiable.

1. **Sign in.** Open the app, complete a sign-in (Clerk or whatever auth path you have configured). The owner is now `{ ownerKind: 'user', ownerId: <clerkUserId> }`.

2. **Save a non-curated trip.** In the concierge, ask for somewhere outside the seven Italian regions - `"Tokyo, slow week"`, `"Paris, art weekend"`, anything. Save it.

3. **Click "PLAN DAY-BY-DAY →" on the saved trip.** The row's footer shows the link with a small lock glyph (since the destination isn't curated). Click it.

4. **You hit the upgrade card.** The page renders `UpgradeCard` instead of `ItineraryView` because the itinerary's `source === 'synthesized'` AND your entitlement is free. Heading: _"Day-by-day for everywhere - premium."_

5. **Click "Upgrade to Premium".** The client `POST`s to `/api/billing/checkout`. The route calls `provider.createCheckoutSession`, which hits Stripe and returns a Checkout URL. The browser redirects there.

6. **Pay with the test card.** Use:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/34`)
   - CVC: any 3 digits (`123`)
   - Zip: any 5 digits (`12345`)

7. **Stripe redirects to `/billing/return`.** The page kicks off a client-side poll against `/api/billing/entitlement` every 1s.

8. **Watch the Stripe CLI window.** It logs the `checkout.session.completed` event being forwarded:
   ```
   2026-05-09 12:34:56  --> checkout.session.completed [evt_...]
   2026-05-09 12:34:56  <-- [200]   POST http://localhost:3000/api/billing/webhook [evt_...]
   ```

9. **Within ~1s the webhook lands.** The poll picks up `plan === 'premium'`, briefly shows _"You're premium. Heading back to your trip…"_, then redirects to the original itinerary URL.

10. **Re-render the itinerary.** The gate now passes (your entitlement is premium). The synthesized itinerary renders. The lock glyph on the saved-trip row remains until you reload the trips panel.

11. **Verify in Stripe Dashboard.** Customers tab shows your customer with the active subscription. Subscriptions tab shows status = active.

### Trigger status changes via CLI

```bash
# Update an existing subscription
stripe trigger customer.subscription.updated

# Cancel a subscription
stripe trigger customer.subscription.deleted
```

Each trigger fires a synthetic event matching the type. Watch the dev server logs - `[billing/webhook]` lines confirm the event was applied. `getEntitlement` reflects the new state immediately.

When you run `customer.subscription.deleted`, the subscription's status flips to `canceled` but `currentPeriodEnd` is preserved. Premium remains until that date - that's the **canceled-grace** entitlement source. After the period ends, `getEntitlement` would return free (in C4 we don't run a cron to flip it; this becomes relevant in C4.x).

## Idempotency check

Stripe retries deliveries aggressively on any non-2xx, and occasionally double-delivers on flaky network. The webhook handler dedupes on `event.id`.

To verify locally:

1. Open Stripe Dashboard → **Developers** → **Events**.
2. Pick any past event your local server handled (filter by event type or by your endpoint).
3. Click **Resend**.

The CLI logs the resend; the dev server returns `{ ok: true, eventType: ..., idempotent: true }`. Subscription state is unchanged. The lib test `tests/stripe-billing-provider.test.ts > idempotency` covers this code path against fixture-signed events.

## Test cards reference

Stripe's full test-cards page: https://docs.stripe.com/testing#cards

The most useful cards in test mode:

| Card | Behavior |
|---|---|
| `4242 4242 4242 4242` | Charge succeeds. Use this for the happy path. |
| `4000 0000 0000 0002` | Charge declined (`generic_decline`). Use this to verify failure handling on Stripe Checkout. |
| `4000 0027 6000 3184` | 3D Secure required. Use this to verify the SCA-required flow. |
| `4000 0000 0000 9995` | Charge succeeds but funds dispute later. Useful in C4.x for testing dispute webhooks. |

Any future expiry, any 3-digit CVC, any zip works.

## Production switch

When you're ready to go live:

1. In Stripe Dashboard, toggle to **live mode** (top-left switch).
2. Repeat product + price creation (live mode has its own data - test products don't carry over).
3. Get your **live secret key** (`sk_live_…`).
4. Configure a webhook endpoint at your production URL (`https://yourdomain.com/api/billing/webhook`). Stripe gives you a new signing secret tied to that endpoint.
5. Set `STRIPE_SECRET_KEY=sk_live_…`, `STRIPE_WEBHOOK_SECRET=whsec_…`, `STRIPE_PRICE_ID=price_…` in your production env.
6. Deploy. **No code change required** - the same `StripeBillingProvider` handles both test and live.

## Architecture care points

These are the invariants C4's design rests on:

1. **Webhook idempotency on `event.id`.** `WebhookEventStore.markProcessed(id)` is the atomic check-and-set. First call returns `'new'`; second returns `'duplicate'` and the handler short-circuits without re-applying state.

2. **Subscription state is server-side.** Gates always call `provider.getEntitlement(owner)` - clients never claim premium via cookie or localStorage. Even after Checkout success, the return page polls; it doesn't trust a query param.

3. **Anonymous can't checkout.** `createCheckoutSession` throws `BillingError('sign-in-required')` for `ownerKind === 'session'`. The route maps that to 401. The upgrade card sends anon users to sign-in first; the existing B1 anonymous→user migration carries any saved trips/memories with them.

4. **Raw body for signature verification.** The webhook route reads `req.text()` and never parses JSON before verification. Next 16's default parsers don't run on this route; the `'force-dynamic'` export ensures the route is never optimized away.

5. **PCI scope = zero.** Stripe Checkout is the hosted page - we never see card numbers. We store: customer id, subscription id, price id, status, currentPeriodEnd. That's the entire surface.

6. **Refunds + cancellation grace.** `customer.subscription.deleted` flips status to `'canceled'` but preserves `currentPeriodEnd`. The `entitlementFromSubscription()` helper grants premium with `source: 'stripe-canceled-grace'` while we're inside that period.

7. **One feature gated in C4.** Synthesized-itinerary fallback is the only premium gate this slice. Future gates (monitoring on >3 trips, advanced share/embed) layer onto the same `requirePremium(owner)` seam without changing the billing lib.

8. **Partial config is loud.** If `STRIPE_SECRET_KEY` is set but `STRIPE_WEBHOOK_SECRET` or `STRIPE_PRICE_ID` is missing, the factory logs a clear warning naming the missing var and falls back to mock. Dev never silently breaks; misconfiguration surfaces immediately.

---

Look in `src/lib/billing/` for the implementations, `src/app/api/billing/` for the routes, and `tests/stripe-billing-provider.test.ts` for the fixture-signed integration tests.
