import type { Entitlement, OwnerKey } from '@core/billing';

/**
 * Single seam between billing logic and the rest of the app.
 *
 * Every UI gate, route handler, and admin view goes through this
 * interface - never the underlying SDK or store directly. The
 * factory (`getBillingSubsystem()`) picks the impl based on env:
 *
 *   - All Stripe vars set → StripeBillingProvider (real Checkout +
 *     webhook + subscription state).
 *   - Otherwise → MockBillingProvider (every authed user premium,
 *     anon free, fake-checkout flow at `/billing/mock-checkout`).
 *
 * Both impls are fully shipped in C4 - the mock isn't a stub, it's
 * the keyless-dev default. Tests rely on it.
 */
export interface BillingProvider {
  readonly kind: 'mock' | 'stripe';

  /**
   * Server-side source of truth for premium state. Called every render
   * by gates + UI. Anonymous owners are always free.
   */
  getEntitlement(owner: OwnerKey): Promise<Entitlement>;

  /**
   * Start a checkout flow. Returns a URL the caller should redirect
   * the user to (Stripe Checkout in real mode; an in-app
   * `/billing/mock-checkout` in mock mode). Throws BillingError with
   * `reason: 'sign-in-required'` for anonymous owners.
   */
  createCheckoutSession(args: CreateCheckoutSessionArgs): Promise<{ url: string }>;

  /**
   * Receive a webhook delivery. Always returns - never throws - so
   * the route handler can map to the right HTTP code without
   * bubbling errors that would trigger Stripe's aggressive retry.
   */
  handleWebhook(args: HandleWebhookArgs): Promise<HandleWebhookResult>;
}

export interface CreateCheckoutSessionArgs {
  owner: OwnerKey;
  returnUrl: string;
  cancelUrl: string;
}

export interface HandleWebhookArgs {
  rawBody: string;
  signature: string | null;
}

export type HandleWebhookResult =
  | {
      ok: true;
      eventType: string;
      eventId: string;
      idempotent?: boolean;
      ignored?: boolean;
    }
  | {
      ok: false;
      reason: 'no-signature' | 'signature' | 'mock-provider' | 'malformed' | 'unhandled';
    };
