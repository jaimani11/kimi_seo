import {
  getInMemorySubscriptionStore,
  type InMemorySubscriptionStore,
} from './in-memory-subscription-store';
import {
  getInMemoryWebhookEventStore,
  type InMemoryWebhookEventStore,
} from './webhook-idempotency';
import { MockBillingProvider } from './mock-billing-provider';
import { StripeBillingProvider } from './stripe-billing-provider';
import type { BillingProvider } from './billing-provider';
import type { SubscriptionStore } from './subscription-store';
import type { WebhookEventStore } from './webhook-idempotency';

export interface BillingSubsystem {
  provider: BillingProvider;
  store: SubscriptionStore;
  eventLog: WebhookEventStore;
  /** Surfaced via getServerFeatures() - `mock` (default) or `stripe`. */
  kind: 'mock' | 'stripe';
}

// Process-global anchor - see comment in src/lib/session/factory.ts.
declare global {
  var __stayscoutBillingSubsystem: BillingSubsystem | undefined;
}

/**
 * Pick the billing provider once per process.
 *
 *   - All three required Stripe vars set → StripeBillingProvider.
 *   - Any required var missing → MockBillingProvider, with a clear
 *     warning naming the missing var(s) so partial configs don't
 *     silently fall back.
 *
 * Cached so we don't re-read env on every call. Reset for tests via
 * `_resetBillingSubsystemForTesting()`.
 */
export function getBillingSubsystem(): BillingSubsystem {
  if (globalThis.__stayscoutBillingSubsystem) return globalThis.__stayscoutBillingSubsystem;

  const store: InMemorySubscriptionStore = getInMemorySubscriptionStore();
  const eventLog: InMemoryWebhookEventStore = getInMemoryWebhookEventStore();

  const secretKey = nonEmpty(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = nonEmpty(process.env.STRIPE_WEBHOOK_SECRET);
  const priceId = nonEmpty(process.env.STRIPE_PRICE_ID);

  const allSet = secretKey && webhookSecret && priceId;
  const someSet = secretKey || webhookSecret || priceId;

  if (allSet) {
    const provider = new StripeBillingProvider({
      secretKey,
      webhookSecret,
      priceId,
      store,
      eventLog,
    });
    globalThis.__stayscoutBillingSubsystem = { provider, store, eventLog, kind: 'stripe' };
    return globalThis.__stayscoutBillingSubsystem;
  }

  if (someSet) {
    const missing: string[] = [];
    if (!secretKey) missing.push('STRIPE_SECRET_KEY');
    if (!webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET');
    if (!priceId) missing.push('STRIPE_PRICE_ID');
    console.warn(
      `[billing] partial Stripe configuration - falling back to MockBillingProvider. Missing: ${missing.join(', ')}.`,
    );
  }

  globalThis.__stayscoutBillingSubsystem = {
    provider: new MockBillingProvider(),
    store,
    eventLog,
    kind: 'mock',
  };
  return globalThis.__stayscoutBillingSubsystem;
}

export function _resetBillingSubsystemForTesting(): void {
  globalThis.__stayscoutBillingSubsystem = undefined;
}

function nonEmpty(v: string | undefined): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}
