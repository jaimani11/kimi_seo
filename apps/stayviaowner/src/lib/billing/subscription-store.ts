import type { OwnerKey, Subscription, SubscriptionStatus } from '@core/billing';

/**
 * Storage seam for Subscription rows. C4 ships an in-memory impl
 * (mock-safe + dev). The Postgres-backed impl lands in C4.x - schema
 * for it is already in `prisma/schema.prisma`.
 *
 * All reads/writes are owner-scoped. The webhook handler also needs a
 * reverse lookup by `stripeSubscriptionId` (events arrive carrying
 * that id, not the owner key) - that's `setStatusByStripeSubscriptionId`.
 */
export interface SubscriptionStore {
  getByOwner(owner: OwnerKey): Promise<Subscription | null>;
  upsert(record: Subscription): Promise<void>;

  /**
   * Updates a subscription's status + currentPeriodEnd by its Stripe
   * subscription id (received in webhook payloads). No-op when the id
   * is unknown - covers the "subscription was created on Stripe but
   * we haven't heard the `checkout.session.completed` event yet" race.
   */
  setStatusByStripeSubscriptionId(args: {
    stripeSubscriptionId: string;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
  }): Promise<void>;
}
