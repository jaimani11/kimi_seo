import { beforeEach, describe, expect, it } from 'vitest';
import type { Subscription } from '@/core/billing';
import { InMemorySubscriptionStore } from '@/lib/billing/in-memory-subscription-store';

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    ownerKind: 'user',
    ownerId: 'user_alice',
    stripeCustomerId: 'cus_test_1',
    stripeSubscriptionId: 'sub_test_1',
    priceId: 'price_test_1',
    status: 'active',
    currentPeriodEnd: new Date('2099-12-31T00:00:00Z'),
    updatedAt: new Date('2026-05-08T00:00:00Z'),
    ...overrides,
  };
}

describe('InMemorySubscriptionStore', () => {
  let store: InMemorySubscriptionStore;

  beforeEach(() => {
    store = new InMemorySubscriptionStore();
  });

  it('returns null for an owner with no subscription', async () => {
    const got = await store.getByOwner({ ownerKind: 'user', ownerId: 'unknown' });
    expect(got).toBeNull();
  });

  it('round-trips a subscription per owner', async () => {
    const sub = makeSub();
    await store.upsert(sub);
    const got = await store.getByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(got?.stripeSubscriptionId).toBe('sub_test_1');
    expect(got?.status).toBe('active');
  });

  it('keeps owners isolated', async () => {
    await store.upsert(makeSub({ ownerId: 'user_alice' }));
    await store.upsert(makeSub({ ownerId: 'user_bob', stripeSubscriptionId: 'sub_test_2' }));
    const a = await store.getByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    const b = await store.getByOwner({ ownerKind: 'user', ownerId: 'user_bob' });
    expect(a?.stripeSubscriptionId).toBe('sub_test_1');
    expect(b?.stripeSubscriptionId).toBe('sub_test_2');
  });

  it('setStatusByStripeSubscriptionId mutates only the matched row', async () => {
    await store.upsert(makeSub({ ownerId: 'user_alice', stripeSubscriptionId: 'sub_a' }));
    await store.upsert(makeSub({ ownerId: 'user_bob', stripeSubscriptionId: 'sub_b' }));
    const newPeriod = new Date('2030-01-01');
    await store.setStatusByStripeSubscriptionId({
      stripeSubscriptionId: 'sub_a',
      status: 'past_due',
      currentPeriodEnd: newPeriod,
    });
    const a = await store.getByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    const b = await store.getByOwner({ ownerKind: 'user', ownerId: 'user_bob' });
    expect(a?.status).toBe('past_due');
    expect(a?.currentPeriodEnd?.getTime()).toBe(newPeriod.getTime());
    expect(b?.status).toBe('active');
  });

  it('setStatusByStripeSubscriptionId is a no-op for unknown id', async () => {
    await store.setStatusByStripeSubscriptionId({
      stripeSubscriptionId: 'sub_does_not_exist',
      status: 'canceled',
      currentPeriodEnd: null,
    });
    // No throw, no panic. Verify nothing was created.
    const got = await store.getByOwner({ ownerKind: 'user', ownerId: 'anyone' });
    expect(got).toBeNull();
  });

  it('upsert preserves stripeCustomerId across status updates', async () => {
    await store.upsert(makeSub({ stripeCustomerId: 'cus_keep_me' }));
    await store.upsert(makeSub({ stripeCustomerId: 'cus_keep_me', status: 'past_due' }));
    const got = await store.getByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(got?.stripeCustomerId).toBe('cus_keep_me');
    expect(got?.status).toBe('past_due');
  });

  it('upsert with a new stripeSubscriptionId drops the old reverse-index entry', async () => {
    await store.upsert(makeSub({ stripeSubscriptionId: 'sub_old' }));
    await store.upsert(makeSub({ stripeSubscriptionId: 'sub_new' }));
    // The reverse lookup for sub_old should now be a no-op.
    await store.setStatusByStripeSubscriptionId({
      stripeSubscriptionId: 'sub_old',
      status: 'canceled',
      currentPeriodEnd: null,
    });
    const got = await store.getByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(got?.stripeSubscriptionId).toBe('sub_new');
    expect(got?.status).toBe('active'); // not canceled
  });
});
