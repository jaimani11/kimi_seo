import { beforeEach, describe, expect, it } from 'vitest';
import { BillingError } from '@/core/billing';
import { MockBillingProvider } from '@/lib/billing/mock-billing-provider';
import { _resetBillingSubsystemForTesting, getBillingSubsystem } from '@/lib/billing/factory';
import { getInMemorySubscriptionStore } from '@/lib/billing/in-memory-subscription-store';
import { getInMemoryWebhookEventStore } from '@/lib/billing/webhook-idempotency';

describe('MockBillingProvider', () => {
  let provider: MockBillingProvider;

  beforeEach(() => {
    provider = new MockBillingProvider();
  });

  it('returns free entitlement for anonymous owner', async () => {
    const ent = await provider.getEntitlement({
      ownerKind: 'session',
      ownerId: 'anon_alice',
    });
    expect(ent.plan).toBe('free');
    expect(ent.source).toBe('mock-anonymous');
    expect(ent.premiumUntil).toBeNull();
  });

  it('returns premium entitlement for authenticated owner', async () => {
    const ent = await provider.getEntitlement({
      ownerKind: 'user',
      ownerId: 'user_bob',
    });
    expect(ent.plan).toBe('premium');
    expect(ent.source).toBe('mock-everyone-premium');
  });

  it('createCheckoutSession returns the in-app mock-checkout URL for users', async () => {
    const { url } = await provider.createCheckoutSession({
      owner: { ownerKind: 'user', ownerId: 'user_carol' },
      returnUrl: 'http://localhost:3000/billing/return',
      cancelUrl: 'http://localhost:3000/',
    });
    expect(url).toContain('/billing/mock-checkout');
    expect(url).toContain('return=');
    expect(url).toContain('cancel=');
  });

  it('createCheckoutSession throws sign-in-required for anonymous', async () => {
    await expect(
      provider.createCheckoutSession({
        owner: { ownerKind: 'session', ownerId: 'anon_dave' },
        returnUrl: '/r',
        cancelUrl: '/c',
      }),
    ).rejects.toBeInstanceOf(BillingError);
  });

  it('handleWebhook is a no-op (mock-provider reason)', async () => {
    const r = await provider.handleWebhook({ rawBody: '{}', signature: 'sig' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('mock-provider');
  });
});

describe('billing subsystem factory (no Stripe env)', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_ID;
    _resetBillingSubsystemForTesting();
    getInMemorySubscriptionStore()._reset();
    getInMemoryWebhookEventStore()._reset();
  });

  it('selects MockBillingProvider when env unset', () => {
    const sub = getBillingSubsystem();
    expect(sub.kind).toBe('mock');
    expect(sub.provider.kind).toBe('mock');
  });

  it('keeps owner state isolated across calls', async () => {
    const { provider } = getBillingSubsystem();
    const a = await provider.getEntitlement({ ownerKind: 'user', ownerId: 'a' });
    const b = await provider.getEntitlement({ ownerKind: 'session', ownerId: 'b' });
    expect(a.plan).toBe('premium');
    expect(b.plan).toBe('free');
  });

  it('falls back to mock with a warning when only some Stripe vars are set', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_partial';
    _resetBillingSubsystemForTesting();
    const sub = getBillingSubsystem();
    expect(sub.kind).toBe('mock');
  });
});
