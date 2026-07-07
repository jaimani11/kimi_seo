import type { Entitlement, OwnerKey } from '@core/billing';
import { getBillingSubsystem } from './factory';

/**
 * Server-side premium gate. The single seam every page/route uses to
 * decide whether a feature is unlocked. Returns the entitlement either
 * way so callers can render the upgrade card with the right reason
 * ('anonymous' → "sign in first" CTA; 'free' → "upgrade" CTA).
 *
 * This wraps the provider's getEntitlement so future logic (rate
 * limits, cohort overrides, A/B) lives in one place.
 */
export type RequirePremiumResult =
  | { entitled: true; entitlement: Entitlement }
  | { entitled: false; entitlement: Entitlement; reason: 'free' | 'anonymous' };

export async function requirePremium(owner: OwnerKey): Promise<RequirePremiumResult> {
  const { provider } = getBillingSubsystem();
  const entitlement = await provider.getEntitlement(owner);
  if (entitlement.plan === 'premium') {
    return { entitled: true, entitlement };
  }
  const reason: 'anonymous' | 'free' = owner.ownerKind === 'session' ? 'anonymous' : 'free';
  return { entitled: false, entitlement, reason };
}
