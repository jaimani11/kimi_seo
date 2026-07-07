import type { Stay } from '@core/stay';

/**
 * Build the redirect URL for a stay's "Continue to Booking" CTA. Returns
 * a relative path so the browser resolves against the current origin -
 * works for both local dev and prod without env coupling.
 *
 * Short keys keep URLs scannable in browser status bars during the
 * brief 302 window:
 *   s - stayId
 *   p - providerId
 *   u - affiliateUrl (encoded)
 *   t - turnId (optional)
 *   c - conversationId (optional)
 */
export interface GenerateGoUrlArgs {
  stay: Stay;
  turnId?: string;
  conversationId?: string;
}

export function generateGoUrl({ stay, turnId, conversationId }: GenerateGoUrlArgs): string {
  const params = new URLSearchParams();
  params.set('s', stay.id);
  params.set('p', stay.providerId);
  params.set('u', stay.bookingLink.url);
  if (turnId) params.set('t', turnId);
  if (conversationId) params.set('c', conversationId);
  return `/api/go?${params.toString()}`;
}
