import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingError } from '@/core/billing';
import { StripeBillingProvider } from '@/lib/billing/stripe-billing-provider';
import { InMemorySubscriptionStore } from '@/lib/billing/in-memory-subscription-store';
import { InMemoryWebhookEventStore } from '@/lib/billing/webhook-idempotency';

/**
 * StripeBillingProvider integration tests.
 *
 * These exercise the **real** signature-verification + idempotency +
 * state-sync code paths via the SDK's own `generateTestHeaderString`
 * helper. No live network - `customers.create`, `checkout.sessions.create`,
 * and `subscriptions.retrieve` are stubbed; everything else (signature
 * verification + crypto + payload routing) runs unmodified.
 *
 * The fixture event approach: build the same JSON Stripe would deliver,
 * sign it with a known `whsec_` test secret, and feed it to the provider.
 * The signature verification crypto runs end-to-end.
 */

const TEST_SECRET_KEY = 'sk_test_unit_dummy';
const TEST_WEBHOOK_SECRET = 'whsec_test_unit_secret_for_signing';
const TEST_PRICE_ID = 'price_test_unit';

/** Build a Stripe-shaped event payload. Fields we read are present;
 *  everything else is omitted (the SDK only validates the signature, not
 *  schema). */
function eventPayload(args: { id: string; type: string; object: Record<string, unknown> }): string {
  return JSON.stringify({
    id: args.id,
    object: 'event',
    type: args.type,
    created: Math.floor(Date.now() / 1000),
    data: { object: args.object },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
  });
}

/** A Stripe Subscription shape with the dahlia fields we read. */
function subscriptionFixture(overrides: {
  id: string;
  status: string;
  metadata?: Record<string, string>;
  customer?: string;
  currentPeriodEnd?: number;
}): Record<string, unknown> {
  const periodEnd = overrides.currentPeriodEnd ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  return {
    id: overrides.id,
    object: 'subscription',
    status: overrides.status,
    customer: overrides.customer ?? 'cus_test',
    metadata: overrides.metadata ?? {
      ownerKind: 'user',
      ownerId: 'user_alice',
    },
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test',
          object: 'subscription_item',
          price: { id: TEST_PRICE_ID, object: 'price' },
          current_period_end: periodEnd,
          current_period_start: periodEnd - 30 * 24 * 3600,
        },
      ],
      has_more: false,
      url: '',
    },
  };
}

/**
 * Build a real Stripe instance for signing test fixtures (the crypto
 * machinery is on the instance) AND a stub for outbound calls. Same
 * instance does both - we override the resource methods we care about.
 */
function buildStubbedStripeClient(opts: {
  customersCreate?: () => Promise<unknown>;
  sessionsCreate?: () => Promise<unknown>;
  subscriptionsRetrieve?: (id: string) => Promise<unknown>;
}) {
  const stripe = new Stripe(TEST_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  });
  if (opts.customersCreate) {
    stripe.customers.create = vi.fn(opts.customersCreate) as never;
  }
  if (opts.sessionsCreate) {
    stripe.checkout.sessions.create = vi.fn(opts.sessionsCreate) as never;
  }
  if (opts.subscriptionsRetrieve) {
    stripe.subscriptions.retrieve = vi.fn(opts.subscriptionsRetrieve) as never;
  }
  return stripe;
}

function buildProvider(opts: Parameters<typeof buildStubbedStripeClient>[0] = {}) {
  const store = new InMemorySubscriptionStore();
  const eventLog = new InMemoryWebhookEventStore();
  const stripeClient = buildStubbedStripeClient(opts);
  const provider = new StripeBillingProvider({
    secretKey: TEST_SECRET_KEY,
    webhookSecret: TEST_WEBHOOK_SECRET,
    priceId: TEST_PRICE_ID,
    store,
    eventLog,
    stripeClient,
  });
  return { provider, store, eventLog, stripeClient };
}

/** Sign a payload with the test webhook secret. Uses the SDK's own
 *  helper - same code Stripe uses to sign deliveries in production. */
function signPayload(stripe: Stripe, payload: string): string {
  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret: TEST_WEBHOOK_SECRET,
  });
}

describe('StripeBillingProvider - webhook signature verification', () => {
  let env: ReturnType<typeof buildProvider>;

  beforeEach(() => {
    env = buildProvider();
  });

  it('rejects request with no signature header', async () => {
    const r = await env.provider.handleWebhook({ rawBody: '{}', signature: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('no-signature');
  });

  it('rejects request signed with the wrong secret', async () => {
    const otherStripe = new Stripe('sk_test_other', {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    });
    const payload = eventPayload({
      id: 'evt_bad',
      type: 'customer.subscription.created',
      object: subscriptionFixture({ id: 'sub_bad', status: 'active' }),
    });
    const badSignature = otherStripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_wrong_secret',
    });
    const r = await env.provider.handleWebhook({ rawBody: payload, signature: badSignature });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('signature');
  });

  it('accepts request signed with the right secret', async () => {
    const payload = eventPayload({
      id: 'evt_good',
      type: 'customer.subscription.updated',
      object: subscriptionFixture({ id: 'sub_good', status: 'active' }),
    });
    const sig = signPayload(env.stripeClient, payload);
    const r = await env.provider.handleWebhook({ rawBody: payload, signature: sig });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.eventType).toBe('customer.subscription.updated');
  });
});

describe('StripeBillingProvider - event handlers update store', () => {
  it('checkout.session.completed → upsert subscription with priceId + status', async () => {
    const subFixture = subscriptionFixture({
      id: 'sub_checkout_done',
      status: 'active',
      customer: 'cus_alice',
      metadata: { ownerKind: 'user', ownerId: 'user_alice' },
    });
    const env = buildProvider({
      subscriptionsRetrieve: async () => subFixture,
    });
    const payload = eventPayload({
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      object: {
        id: 'cs_test',
        object: 'checkout.session',
        customer: 'cus_alice',
        subscription: 'sub_checkout_done',
        metadata: { ownerKind: 'user', ownerId: 'user_alice' },
      },
    });
    const sig = signPayload(env.stripeClient, payload);
    const r = await env.provider.handleWebhook({ rawBody: payload, signature: sig });
    expect(r.ok).toBe(true);

    const stored = await env.store.getByOwner({
      ownerKind: 'user',
      ownerId: 'user_alice',
    });
    expect(stored).not.toBeNull();
    expect(stored?.stripeSubscriptionId).toBe('sub_checkout_done');
    expect(stored?.stripeCustomerId).toBe('cus_alice');
    expect(stored?.priceId).toBe(TEST_PRICE_ID);
    expect(stored?.status).toBe('active');
  });

  it('customer.subscription.updated flips status (active → past_due)', async () => {
    const env = buildProvider();
    // Seed an existing 'active' row.
    await env.store.upsert({
      ownerKind: 'user',
      ownerId: 'user_alice',
      stripeCustomerId: 'cus_alice',
      stripeSubscriptionId: 'sub_alice',
      priceId: TEST_PRICE_ID,
      status: 'active',
      currentPeriodEnd: new Date('2099-01-01'),
      updatedAt: new Date(),
    });
    const payload = eventPayload({
      id: 'evt_updated',
      type: 'customer.subscription.updated',
      object: subscriptionFixture({
        id: 'sub_alice',
        status: 'past_due',
        customer: 'cus_alice',
      }),
    });
    const sig = signPayload(env.stripeClient, payload);
    const r = await env.provider.handleWebhook({ rawBody: payload, signature: sig });
    expect(r.ok).toBe(true);
    const stored = await env.store.getByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(stored?.status).toBe('past_due');
  });

  it("customer.subscription.deleted flips status to 'canceled' (preserving period)", async () => {
    const env = buildProvider();
    await env.store.upsert({
      ownerKind: 'user',
      ownerId: 'user_alice',
      stripeCustomerId: 'cus_alice',
      stripeSubscriptionId: 'sub_alice',
      priceId: TEST_PRICE_ID,
      status: 'active',
      currentPeriodEnd: new Date('2099-01-01'),
      updatedAt: new Date(),
    });
    const futureTs = Math.floor(new Date('2099-06-01').getTime() / 1000);
    const payload = eventPayload({
      id: 'evt_deleted',
      type: 'customer.subscription.deleted',
      object: subscriptionFixture({
        id: 'sub_alice',
        status: 'canceled',
        customer: 'cus_alice',
        currentPeriodEnd: futureTs,
      }),
    });
    const sig = signPayload(env.stripeClient, payload);
    const r = await env.provider.handleWebhook({ rawBody: payload, signature: sig });
    expect(r.ok).toBe(true);
    const stored = await env.store.getByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(stored?.status).toBe('canceled');
    expect(stored?.currentPeriodEnd?.getTime()).toBe(futureTs * 1000);
  });

  it("ignores unknown event types ('ignored: true')", async () => {
    const env = buildProvider();
    const payload = eventPayload({
      id: 'evt_unknown',
      type: 'invoice.paid', // not in HANDLED_EVENT_TYPES
      object: { id: 'in_test', object: 'invoice' },
    });
    const sig = signPayload(env.stripeClient, payload);
    const r = await env.provider.handleWebhook({ rawBody: payload, signature: sig });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ignored).toBe(true);
  });
});

describe('StripeBillingProvider - idempotency', () => {
  it('re-delivery of the same event.id returns idempotent: true and does not re-apply', async () => {
    let retrieveCount = 0;
    const env = buildProvider({
      subscriptionsRetrieve: async () => {
        retrieveCount += 1;
        return subscriptionFixture({
          id: 'sub_idem',
          status: 'active',
          customer: 'cus_idem',
          metadata: { ownerKind: 'user', ownerId: 'user_idem' },
        });
      },
    });
    const payload = eventPayload({
      id: 'evt_idem_one',
      type: 'checkout.session.completed',
      object: {
        id: 'cs_idem',
        object: 'checkout.session',
        customer: 'cus_idem',
        subscription: 'sub_idem',
        metadata: { ownerKind: 'user', ownerId: 'user_idem' },
      },
    });
    const sig = signPayload(env.stripeClient, payload);
    const r1 = await env.provider.handleWebhook({ rawBody: payload, signature: sig });
    const r2 = await env.provider.handleWebhook({ rawBody: payload, signature: sig });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (r1.ok) expect(r1.idempotent ?? false).toBe(false);
    if (r2.ok) expect(r2.idempotent).toBe(true);
    // The state-mutation only ran once (one retrieve call).
    expect(retrieveCount).toBe(1);
  });
});

describe('StripeBillingProvider - checkout', () => {
  it("createCheckoutSession throws BillingError 'sign-in-required' for anonymous", async () => {
    const env = buildProvider();
    await expect(
      env.provider.createCheckoutSession({
        owner: { ownerKind: 'session', ownerId: 'anon_x' },
        returnUrl: 'http://localhost:3000/billing/return',
        cancelUrl: 'http://localhost:3000/',
      }),
    ).rejects.toBeInstanceOf(BillingError);
  });

  it('createCheckoutSession creates customer + session and returns URL', async () => {
    const customerCreate = vi.fn(async () => ({ id: 'cus_new_test', object: 'customer' }));
    const sessionCreate = vi.fn(async () => ({
      id: 'cs_test',
      url: 'https://checkout.stripe.com/c/test',
    }));
    const env = buildProvider({
      customersCreate: customerCreate,
      sessionsCreate: sessionCreate,
    });
    const { url } = await env.provider.createCheckoutSession({
      owner: { ownerKind: 'user', ownerId: 'user_new' },
      returnUrl: 'http://localhost:3000/billing/return',
      cancelUrl: 'http://localhost:3000/',
    });
    expect(url).toBe('https://checkout.stripe.com/c/test');
    expect(customerCreate).toHaveBeenCalledOnce();
    expect(sessionCreate).toHaveBeenCalledOnce();
    // Customer id should be persisted for retry safety.
    const stored = await env.store.getByOwner({ ownerKind: 'user', ownerId: 'user_new' });
    expect(stored?.stripeCustomerId).toBe('cus_new_test');
  });

  it('reuses existing customerId on a second checkout (no extra create call)', async () => {
    const customerCreate = vi.fn(async () => ({ id: 'cus_should_not_be_called' }));
    const sessionCreate = vi.fn(async () => ({
      id: 'cs_test_2',
      url: 'https://checkout.stripe.com/c/test_2',
    }));
    const env = buildProvider({
      customersCreate: customerCreate,
      sessionsCreate: sessionCreate,
    });
    // Pre-seed a customer id.
    await env.store.upsert({
      ownerKind: 'user',
      ownerId: 'user_seeded',
      stripeCustomerId: 'cus_already_exists',
      stripeSubscriptionId: null,
      priceId: null,
      status: 'incomplete',
      currentPeriodEnd: null,
      updatedAt: new Date(),
    });
    await env.provider.createCheckoutSession({
      owner: { ownerKind: 'user', ownerId: 'user_seeded' },
      returnUrl: 'http://localhost:3000/billing/return',
      cancelUrl: 'http://localhost:3000/',
    });
    expect(customerCreate).not.toHaveBeenCalled();
    expect(sessionCreate).toHaveBeenCalledOnce();
  });
});

describe('StripeBillingProvider - getEntitlement', () => {
  it("returns 'stripe-canceled-grace' when canceled but currentPeriodEnd is in future", async () => {
    const env = buildProvider();
    await env.store.upsert({
      ownerKind: 'user',
      ownerId: 'user_grace',
      stripeCustomerId: 'cus_g',
      stripeSubscriptionId: 'sub_g',
      priceId: TEST_PRICE_ID,
      status: 'canceled',
      currentPeriodEnd: new Date('2099-01-01'),
      updatedAt: new Date(),
    });
    const ent = await env.provider.getEntitlement({
      ownerKind: 'user',
      ownerId: 'user_grace',
    });
    expect(ent.plan).toBe('premium');
    expect(ent.source).toBe('stripe-canceled-grace');
  });

  it('returns free for anonymous owner', async () => {
    const env = buildProvider();
    const ent = await env.provider.getEntitlement({
      ownerKind: 'session',
      ownerId: 'anon_z',
    });
    expect(ent.plan).toBe('free');
    expect(ent.source).toBe('free');
  });

  it('returns free for user with no subscription', async () => {
    const env = buildProvider();
    const ent = await env.provider.getEntitlement({
      ownerKind: 'user',
      ownerId: 'user_none',
    });
    expect(ent.plan).toBe('free');
    expect(ent.source).toBe('free');
  });
});
