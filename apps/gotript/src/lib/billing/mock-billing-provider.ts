import type { Entitlement, OwnerKey } from '@core/billing';
import { BillingError } from '@core/billing';
import type {
  BillingProvider,
  CreateCheckoutSessionArgs,
  HandleWebhookArgs,
  HandleWebhookResult,
} from './billing-provider';

/**
 * Default provider when no Stripe env vars are present.
 *
 * - Authenticated owners → premium ('mock-everyone-premium').
 * - Anonymous (session) owners → free ('mock-anonymous').
 * - createCheckoutSession returns a URL into our in-app
 *   `/billing/mock-checkout` page, which simulates the Stripe Checkout
 *   flow + flips the subscription state via a server action.
 * - handleWebhook is a no-op - there are no webhooks in mock mode.
 *
 * Keyless dev experience never breaks. The synthesized-itinerary
 * upgrade path is exercisable end-to-end from the UI.
 */
export class MockBillingProvider implements BillingProvider {
  readonly kind = 'mock' as const;

  async getEntitlement(owner: OwnerKey): Promise<Entitlement> {
    if (owner.ownerKind === 'session') {
      return { plan: 'free', premiumUntil: null, source: 'mock-anonymous' };
    }
    return { plan: 'premium', premiumUntil: null, source: 'mock-everyone-premium' };
  }

  async createCheckoutSession(args: CreateCheckoutSessionArgs): Promise<{ url: string }> {
    if (args.owner.ownerKind === 'session') {
      throw new BillingError('sign-in-required');
    }
    const params = new URLSearchParams({
      return: args.returnUrl,
      cancel: args.cancelUrl,
    });
    return { url: `/billing/mock-checkout?${params.toString()}` };
  }

  async handleWebhook(_args: HandleWebhookArgs): Promise<HandleWebhookResult> {
    // No webhooks in mock mode. The /api/billing/webhook route surfaces
    // a 503 when this is hit, so a misconfigured Stripe Dashboard
    // pointed here while we're in mock mode fails loudly.
    return { ok: false, reason: 'mock-provider' };
  }
}
