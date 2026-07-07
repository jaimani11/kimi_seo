import { z } from 'zod';

/**
 * Slice C4 - Billing core types.
 *
 * The shape is shared between MockBillingProvider, StripeBillingProvider,
 * and the gates that read entitlement. Server-side is the source of truth
 * for premium state; the client never claims it. Anonymous owners are
 * always free (sign-in is required to check out).
 *
 * `OwnerKey` is the same shape returned by `ownerOf(authState)` in
 * `@lib/auth`. It's redefined here (not imported) so the core layer
 * doesn't depend on lib - the boundary rule. Structural typing means
 * `ownerOf()` results are compatible without ceremony.
 */

// ============== Owner ==============

export const OwnerKindSchema = z.enum(['user', 'session']);
export type OwnerKind = z.infer<typeof OwnerKindSchema>;

export const OwnerKeySchema = z.object({
  ownerKind: OwnerKindSchema,
  ownerId: z.string().min(1),
});
export type OwnerKey = z.infer<typeof OwnerKeySchema>;

// ============== Plan + Entitlement ==============

export const PlanSchema = z.enum(['free', 'premium']);
export type Plan = z.infer<typeof PlanSchema>;

/**
 * Why entitlement is what it is - useful for /admin debugging and for
 * error UI ("you signed in but the webhook hasn't landed yet").
 */
export const EntitlementSourceSchema = z.enum([
  'mock-everyone-premium', // MockBillingProvider, authenticated
  'mock-anonymous', // MockBillingProvider, anonymous → free
  'stripe-active', // status='active'
  'stripe-trialing', // status='trialing'
  'stripe-canceled-grace', // status='canceled' but currentPeriodEnd > now
  'free', // no subscription on file
]);
export type EntitlementSource = z.infer<typeof EntitlementSourceSchema>;

export const EntitlementSchema = z.object({
  plan: PlanSchema,
  premiumUntil: z.date().nullable(),
  source: EntitlementSourceSchema,
});
export type Entitlement = z.infer<typeof EntitlementSchema>;

// ============== Subscription (mirrors Stripe shape) ==============

/**
 * Mirrors Stripe's subscription.status enum exactly so we can store it
 * verbatim from webhook payloads without translation.
 * https://docs.stripe.com/api/subscriptions/object#subscription_object-status
 */
export const SubscriptionStatusSchema = z.enum([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
  ownerKind: OwnerKindSchema,
  ownerId: z.string().min(1),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  priceId: z.string().nullable(),
  status: SubscriptionStatusSchema,
  currentPeriodEnd: z.date().nullable(),
  updatedAt: z.date(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

// ============== Helpers ==============

/**
 * A status counts as premium when it's `active`, `trialing`, OR `canceled`
 * but still inside the paid-through period (the "grace" window after a
 * user cancels - Stripe stops billing but the period the user already
 * paid for is honored).
 */
export function isPremiumStatus(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): boolean {
  if (status === 'active' || status === 'trialing') return true;
  if (status === 'canceled' && currentPeriodEnd && currentPeriodEnd > now) return true;
  return false;
}

/**
 * Derive an Entitlement from a stored Subscription. The Subscription is
 * the durable record; the Entitlement is the read-model handed to gates
 * + UI. Splitting them lets us keep one row per owner while letting
 * `mockEveryonePremium` and `free-no-subscription` paths produce the
 * same Entitlement shape without ever writing to the store.
 */
export function entitlementFromSubscription(
  sub: Subscription | null,
  now: Date = new Date(),
): Entitlement {
  if (!sub) return { plan: 'free', premiumUntil: null, source: 'free' };
  const premium = isPremiumStatus(sub.status, sub.currentPeriodEnd, now);
  if (!premium) return { plan: 'free', premiumUntil: null, source: 'free' };
  const source: EntitlementSource =
    sub.status === 'trialing'
      ? 'stripe-trialing'
      : sub.status === 'canceled'
        ? 'stripe-canceled-grace'
        : 'stripe-active';
  return { plan: 'premium', premiumUntil: sub.currentPeriodEnd, source };
}

/** Stable string key for using OwnerKey as a Map key. */
export function ownerStringKey(owner: OwnerKey): string {
  return `${owner.ownerKind}:${owner.ownerId}`;
}

// ============== Errors ==============

/**
 * Thrown by createCheckoutSession when the call can't proceed for a
 * known reason (e.g. anonymous owner). The route translates this into
 * a 401 / 400 response. Anything else thrown bubbles as a 500.
 */
export class BillingError extends Error {
  constructor(
    public readonly reason:
      | 'sign-in-required'
      | 'misconfigured'
      | 'stripe-error'
      | 'no-checkout-url',
    message?: string,
  ) {
    super(message ?? reason);
    this.name = 'BillingError';
  }
}
