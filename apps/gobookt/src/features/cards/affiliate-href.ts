import {
  activeStaySearchHref,
  getActiveStayProviderId,
} from '@lib/affiliate/active-stay-provider';
import { encodeAffiliateLink } from '@lib/affiliate/link-encoder';
import type { Property } from '@lib/discovery/property';

/**
 * Build a `/r/[id]` redirect URL for a curated property.
 *
 * Why per-render and not pre-built at curation time:
 *
 *   - Default dates roll forward every day (today + 30, +5 nights).
 *     Pre-building once would freeze them at module-load time.
 *   - Affiliate config (campaign id, label) is read fresh from env so
 *     a config flip propagates without rebuilding the dataset.
 *   - The encoder needs `Buffer` (server) or `btoa` (browser); doing
 *     it at render time lets each environment use the right one
 *     without bundling logic.
 *
 * The outbound URL is routed through `getActiveStayProvider()` which
 * defaults to Booking.com (with Expedia preserved as a one-env-var
 * override). The redirect payload's `providerId` is set from the
 * same source so click attribution records the actual destination
 * partner.
 */
/**
 * Build a `/r/[id]` redirect URL for a curated property, or `null` when the
 * stays search hand-off is unavailable (fail-closed — e.g. the tracked
 * deep-link isn't configured). Callers render the CTA only when non-null and
 * must NEVER substitute a homepage link.
 */
export function buildPropertyAffiliateHref(property: Property): string | null {
  const { checkIn, checkOut } = defaultDates();
  const url = activeStaySearchHref({
    destination: property.affiliate.searchDestination,
    checkIn,
    checkOut,
    adults: property.affiliate.defaultAdults,
  });
  if (!url) return null; // search hand-off unavailable — hide the CTA, don't fake one
  const id = encodeAffiliateLink({
    url,
    providerId: getActiveStayProviderId(),
    stayId: property.affiliate.stayId,
    intent: 'search',
  });
  return `/r/${id}`;
}

/**
 * Forward-looking placeholder dates: 30 days out, 5 nights.
 * Matches the booking-agent + landing-page defaults so the
 * partner search lands on the same window as the rest of the app.
 */
function defaultDates(): { checkIn: string; checkOut: string } {
  const today = new Date();
  const checkIn = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const checkOut = new Date(checkIn.getTime() + 5 * 24 * 60 * 60 * 1000);
  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  };
}
