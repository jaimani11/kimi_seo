import { findBrand } from '@adored/brand-config';

/**
 * Brand-policy guard.
 *
 * Each brand may only monetize through the providers declared in its
 * brand-config `affiliate.providers` — the single source of truth (so the
 * policy can never drift from the config the app actually runs on). This is the
 * enforcement point that stops cross-brand / cross-network leakage:
 *
 *   - gobookt is Booking.com-only → never an Expedia/VRBO/Viator link
 *   - numiworks is Viator/VRBO → never a Booking.com link
 *   - gotript is Expedia/VRBO(+experiences) → not approved for Booking
 *   - stayviaowner is VRBO-first → no cross-brand ids
 *
 * Fails CLOSED: an out-of-policy (brand, provider) pair throws rather than let a
 * builder silently emit a wrong-network URL that pays the wrong account — or
 * nothing. Wrap `assertBrandProvider` around every outbound handoff / builder.
 */
export function brandAllowsProvider(brandKey: string, provider: string): boolean {
  const brand = findBrand(brandKey);
  if (!brand) return false;
  return (brand.affiliate.providers as readonly string[]).includes(provider);
}

/** Throwing variant — the guard the forwarders/builders call. */
export function assertBrandProvider(brandKey: string, provider: string): void {
  if (brandAllowsProvider(brandKey, provider)) return;
  const brand = findBrand(brandKey);
  const allowed = brand
    ? (brand.affiliate.providers as readonly string[]).join(', ') || '(none)'
    : '(unknown brand)';
  throw new Error(
    `Brand-policy violation: '${brandKey}' may not monetize through '${provider}' ` +
      `(allowed: ${allowed}). Refusing to emit a cross-brand / cross-network URL.`,
  );
}
