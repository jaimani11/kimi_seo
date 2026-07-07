import Stripe from 'stripe';
import {
  BillingError,
  entitlementFromSubscription,
  OwnerKindSchema,
  SubscriptionStatusSchema,
  type Entitlement,
  type OwnerKey,
  type Subscription,
  type SubscriptionStatus,
} from '@core/billing';
import type {
  BillingProvider,
  CreateCheckoutSessionArgs,
  HandleWebhookArgs,
  HandleWebhookResult,
} from './billing-provider';
import type { SubscriptionStore } from './subscription-store';
import type { WebhookEventStore } from './webhook-idempotency';

/** Pinned API version. Changing this is a deliberate upgrade - newer
 *  SDK builds may default to a newer API but our code shape is tied
 *  to the fields we read in webhook payloads (notably the move of
 *  `current_period_end` onto `subscription.items.data[].current_period_end`
 *  in the `dahlia` release). Keep this in sync with Stripe Dashboard. */
// `as any` widens the literal so both the pnpm-locked Stripe SDK
// (pins `2026-04-22.dahlia`) and newer SDK versions accept this
// value without type errors. Stripe's exposed apiVersion literal-
// union name has changed across SDK versions; the runtime call is
// the same regardless.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STRIPE_API_VERSION = '2026-04-22.dahlia' as any;

/**
 * Pull `current_period_end` off the first subscription item (single-item
 * subscriptions are the only shape we create in C4). In API version
 * 2026-04-22 (dahlia), Stripe moved this field from the subscription
 * root onto each item, since multi-item subscriptions can have
 * differing period boundaries. We collapse to one field for storage.
 */
function readCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const ts = subscription.items.data[0]?.current_period_end;
  return typeof ts === 'number' ? new Date(ts * 1000) : null;
}

const HANDLED_EVENT_TYPES = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

/**
 * Real Stripe-backed billing provider.
 *
 * Used when STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET + STRIPE_PRICE_ID
 * are all set (test or live keys both work - verification doesn't care).
 *
 * Three guarantees:
 *   1. Subscription state is the source of truth - getEntitlement() reads
 *      our SubscriptionStore, which is only ever written from verified
 *      webhook deliveries. Clients never claim premium.
 *   2. Webhooks are signature-verified via stripe.webhooks.constructEvent
 *      against the configured STRIPE_WEBHOOK_SECRET. Failure is logged
 *      and returned as `{ ok: false, reason: 'signature' }` - never thrown,
 *      so the route handler can map cleanly to HTTP 400.
 *   3. Webhooks are idempotent on event.id via WebhookEventStore. Stripe
 *      retries on any non-2xx, and occasionally double-delivers - the
 *      check-and-set pattern guarantees we apply state changes once.
 *
 * Customer creation is lazy: the first time a user starts checkout, we
 * create a Stripe customer + persist the id alongside their subscription
 * row. Subsequent checkouts reuse the customer.
 *
 * The provider is intentionally injected with its store + event log so
 * tests can swap them. Construction fails fast if any required arg is
 * missing - partial config never reaches this class (the factory
 * filters for that).
 */
export class StripeBillingProvider implements BillingProvider {
  readonly kind = 'stripe' as const;
  private readonly stripe: Stripe;
  private readonly priceId: string;
  private readonly webhookSecret: string;
  private readonly store: SubscriptionStore;
  private readonly eventLog: WebhookEventStore;

  constructor(args: {
    secretKey: string;
    webhookSecret: string;
    priceId: string;
    store: SubscriptionStore;
    eventLog: WebhookEventStore;
    /** For tests - inject a stubbed Stripe client instead of constructing one. */
    stripeClient?: Stripe;
  }) {
    if (!args.secretKey || !args.webhookSecret || !args.priceId) {
      throw new BillingError(
        'misconfigured',
        'StripeBillingProvider requires secretKey, webhookSecret, and priceId',
      );
    }
    this.stripe =
      args.stripeClient ??
      new Stripe(args.secretKey, {
        apiVersion: STRIPE_API_VERSION,
        typescript: true,
      });
    this.priceId = args.priceId;
    this.webhookSecret = args.webhookSecret;
    this.store = args.store;
    this.eventLog = args.eventLog;
  }

  // ============== Entitlement ==============

  async getEntitlement(owner: OwnerKey): Promise<Entitlement> {
    if (owner.ownerKind === 'session') {
      return { plan: 'free', premiumUntil: null, source: 'free' };
    }
    const sub = await this.store.getByOwner(owner);
    return entitlementFromSubscription(sub);
  }

  // ============== Checkout ==============

  async createCheckoutSession(args: CreateCheckoutSessionArgs): Promise<{ url: string }> {
    if (args.owner.ownerKind === 'session') {
      throw new BillingError('sign-in-required');
    }

    // Reuse an existing customer if we've created one for this owner before.
    const existing = await this.store.getByOwner(args.owner);
    let customerId = existing?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        metadata: {
          ownerKind: args.owner.ownerKind,
          ownerId: args.owner.ownerId,
        },
      });
      customerId = customer.id;
      // Persist the customer id eagerly so retries don't create dupes.
      // Status is 'incomplete' until the webhook says otherwise.
      await this.store.upsert({
        ownerKind: args.owner.ownerKind,
        ownerId: args.owner.ownerId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
        priceId: existing?.priceId ?? null,
        status: existing?.status ?? 'incomplete',
        currentPeriodEnd: existing?.currentPeriodEnd ?? null,
        updatedAt: new Date(),
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: this.priceId, quantity: 1 }],
      client_reference_id: args.owner.ownerId,
      metadata: {
        ownerKind: args.owner.ownerKind,
        ownerId: args.owner.ownerId,
      },
      subscription_data: {
        metadata: {
          ownerKind: args.owner.ownerKind,
          ownerId: args.owner.ownerId,
        },
      },
      success_url: args.returnUrl,
      cancel_url: args.cancelUrl,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new BillingError('no-checkout-url', 'Stripe did not return a checkout URL');
    }
    return { url: session.url };
  }

  // ============== Webhook ==============

  async handleWebhook(args: HandleWebhookArgs): Promise<HandleWebhookResult> {
    if (!args.signature) {
      return { ok: false, reason: 'no-signature' };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(args.rawBody, args.signature, this.webhookSecret);
    } catch (err) {
      console.warn('[billing/webhook] signature verification failed:', errMsg(err));
      return { ok: false, reason: 'signature' };
    }

    // Idempotency check BEFORE applying state changes. Atomic - second
    // delivery of the same event.id short-circuits without re-applying.
    const status = await this.eventLog.markProcessed(event.id);
    if (status === 'duplicate') {
      return {
        ok: true,
        eventType: event.type,
        eventId: event.id,
        idempotent: true,
      };
    }

    if (!HANDLED_EVENT_TYPES.has(event.type)) {
      return {
        ok: true,
        eventType: event.type,
        eventId: event.id,
        ignored: true,
      };
    }

    try {
      await this.applyEvent(event);
    } catch (err) {
      // Log + return ok:true so Stripe doesn't retry. Our state may be
      // out of sync; an admin can replay via Stripe Dashboard's "Resend"
      // (which deduplicates anyway via event.id; we'd need to clear the
      // event-log entry first in that case).
      console.error('[billing/webhook] failed to apply event', event.id, errMsg(err));
    }

    return { ok: true, eventType: event.type, eventId: event.id };
  }

  // ============== Event handlers ==============

  /**
   * Route a verified event to the right state-mutation. Each branch is
   * defensive about missing fields: production webhooks are sometimes
   * shaped differently across API versions, and we want graceful no-op
   * over crash.
   */
  private async applyEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const owner = readOwnerFromMetadata(session.metadata);
        if (!owner) return;
        const customerId = typeof session.customer === 'string' ? session.customer : null;
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription?.id ?? null);
        if (!subId) return;
        const subscription = await this.stripe.subscriptions.retrieve(subId);
        await this.store.upsert(toSubscriptionRecord(owner, customerId, subscription));
        return;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const owner = readOwnerFromMetadata(subscription.metadata);
        if (!owner) {
          // Fall back to reverse-lookup via subscription id.
          await this.applyByStripeSubscriptionId(subscription);
          return;
        }
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : (subscription.customer?.id ?? null);
        await this.store.upsert(toSubscriptionRecord(owner, customerId, subscription));
        return;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.store.setStatusByStripeSubscriptionId({
          stripeSubscriptionId: subscription.id,
          status: 'canceled',
          currentPeriodEnd: readCurrentPeriodEnd(subscription),
        });
        return;
      }
      default:
        return;
    }
  }

  private async applyByStripeSubscriptionId(subscription: Stripe.Subscription): Promise<void> {
    const status = SubscriptionStatusSchema.safeParse(subscription.status);
    if (!status.success) return;
    await this.store.setStatusByStripeSubscriptionId({
      stripeSubscriptionId: subscription.id,
      status: status.data,
      currentPeriodEnd: readCurrentPeriodEnd(subscription),
    });
  }
}

// ============== Helpers ==============

function readOwnerFromMetadata(metadata: Stripe.Metadata | null | undefined): OwnerKey | null {
  if (!metadata) return null;
  const kind = OwnerKindSchema.safeParse(metadata.ownerKind);
  const id = typeof metadata.ownerId === 'string' ? metadata.ownerId : '';
  if (!kind.success || id.length === 0) return null;
  return { ownerKind: kind.data, ownerId: id };
}

function toSubscriptionRecord(
  owner: OwnerKey,
  customerId: string | null,
  subscription: Stripe.Subscription,
): Subscription {
  const status = SubscriptionStatusSchema.safeParse(subscription.status);
  const safeStatus: SubscriptionStatus = status.success ? status.data : 'incomplete';
  const priceId = subscription.items.data[0]?.price.id ?? null;
  return {
    ownerKind: owner.ownerKind,
    ownerId: owner.ownerId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    priceId,
    status: safeStatus,
    currentPeriodEnd: readCurrentPeriodEnd(subscription),
    updatedAt: new Date(),
  };
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
