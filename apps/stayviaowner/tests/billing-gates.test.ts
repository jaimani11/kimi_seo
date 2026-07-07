import { beforeEach, describe, expect, it } from 'vitest';
import { _resetBillingSubsystemForTesting, getBillingSubsystem } from '@/lib/billing/factory';
import { requirePremium } from '@/lib/billing/gates';
import { getInMemorySubscriptionStore } from '@/lib/billing/in-memory-subscription-store';
import { getInMemoryWebhookEventStore } from '@/lib/billing/webhook-idempotency';

describe('requirePremium gate (mock provider)', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_ID;
    _resetBillingSubsystemForTesting();
    getInMemorySubscriptionStore()._reset();
    getInMemoryWebhookEventStore()._reset();
    // Force the subsystem to reconstruct on first call.
    getBillingSubsystem();
  });

  it('returns entitled=true for an authenticated user (mock-everyone-premium)', async () => {
    const r = await requirePremium({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(r.entitled).toBe(true);
    if (r.entitled) {
      expect(r.entitlement.plan).toBe('premium');
      expect(r.entitlement.source).toBe('mock-everyone-premium');
    }
  });

  it('returns entitled=false reason=anonymous for a session owner', async () => {
    const r = await requirePremium({ ownerKind: 'session', ownerId: 'anon_bob' });
    expect(r.entitled).toBe(false);
    if (!r.entitled) {
      expect(r.reason).toBe('anonymous');
      expect(r.entitlement.plan).toBe('free');
      expect(r.entitlement.source).toBe('mock-anonymous');
    }
  });

  it('does not cache between calls - each call re-reads provider state', async () => {
    const r1 = await requirePremium({ ownerKind: 'user', ownerId: 'user_carol' });
    const r2 = await requirePremium({ ownerKind: 'user', ownerId: 'user_carol' });
    expect(r1.entitled).toBe(true);
    expect(r2.entitled).toBe(true);
  });

  it('different owners get independent entitlements', async () => {
    const a = await requirePremium({ ownerKind: 'user', ownerId: 'user_a' });
    const b = await requirePremium({ ownerKind: 'session', ownerId: 'anon_b' });
    expect(a.entitled).toBe(true);
    expect(b.entitled).toBe(false);
  });

  it('always returns the entitlement object even when not entitled (for upgrade UI)', async () => {
    const r = await requirePremium({ ownerKind: 'session', ownerId: 'anon_x' });
    expect(r.entitlement).toBeDefined();
    expect(r.entitlement.plan).toBe('free');
  });
});
