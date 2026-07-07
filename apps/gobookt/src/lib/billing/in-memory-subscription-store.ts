import {
  ownerStringKey,
  type OwnerKey,
  type Subscription,
  type SubscriptionStatus,
} from '@core/billing';
import type { SubscriptionStore } from './subscription-store';

/**
 * Process-local subscription cache. HMR-safe via globalThis so dev
 * reloads don't lose state between webhook deliveries.
 *
 * Two indexes kept in sync:
 *   - byOwner: ownerKey → Subscription
 *   - byStripeSub: stripeSubscriptionId → Subscription (only set when
 *     the row has a stripeSubscriptionId)
 *
 * In-memory deliberately - Postgres impl lands in C4.x.
 */
export class InMemorySubscriptionStore implements SubscriptionStore {
  private readonly byOwner = new Map<string, Subscription>();
  private readonly byStripeSub = new Map<string, Subscription>();

  async getByOwner(owner: OwnerKey): Promise<Subscription | null> {
    return this.byOwner.get(ownerStringKey(owner)) ?? null;
  }

  async upsert(record: Subscription): Promise<void> {
    const owner = ownerStringKey(record);

    // If a previous row had a stripeSubscriptionId different from this
    // one, drop the old reverse index entry. Defensive - shouldn't
    // happen in normal flow.
    const existing = this.byOwner.get(owner);
    if (
      existing &&
      existing.stripeSubscriptionId &&
      existing.stripeSubscriptionId !== record.stripeSubscriptionId
    ) {
      this.byStripeSub.delete(existing.stripeSubscriptionId);
    }

    this.byOwner.set(owner, record);
    if (record.stripeSubscriptionId) {
      this.byStripeSub.set(record.stripeSubscriptionId, record);
    }
  }

  async setStatusByStripeSubscriptionId(args: {
    stripeSubscriptionId: string;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
  }): Promise<void> {
    const sub = this.byStripeSub.get(args.stripeSubscriptionId);
    if (!sub) return; // race: subscription deleted before checkout.session.completed seen
    const updated: Subscription = {
      ...sub,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      updatedAt: new Date(),
    };
    this.byStripeSub.set(args.stripeSubscriptionId, updated);
    this.byOwner.set(ownerStringKey(sub), updated);
  }

  /** Test-only - wipe state. */
  _reset(): void {
    this.byOwner.clear();
    this.byStripeSub.clear();
  }
}

declare global {
  var __stayscoutSubscriptionStore: InMemorySubscriptionStore | undefined;
}

export function getInMemorySubscriptionStore(): InMemorySubscriptionStore {
  if (!globalThis.__stayscoutSubscriptionStore) {
    globalThis.__stayscoutSubscriptionStore = new InMemorySubscriptionStore();
  }
  return globalThis.__stayscoutSubscriptionStore;
}
