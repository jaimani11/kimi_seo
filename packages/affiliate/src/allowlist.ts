/**
 * Hostname allowlist for the affiliate redirect handler. Any redirect
 * target whose host doesn't match (exact or subdomain) is rejected with
 * 400 - prevents StayScout's redirect endpoint from becoming an open
 * redirector usable for phishing.
 *
 * Add a domain here when a new provider lands in B5+. Only add domains
 * that genuinely host booking deep links - don't broaden for tracking
 * subdomains unless the booking flow actually traverses them.
 */
export const AFFILIATE_HOST_ALLOWLIST: readonly string[] = [
  'example.com', // mock-italy provider (slated for removal in Slice H2)
  'booking.com',
  'expedia.com',
  'hotels.com',
  'vrbo.com',
  // Partnerize click-redirect host. Vrbo affiliate links are wrapped as
  // `prf.hn/click/camref:<camref>/destination:<vrbo.com url>` — the prf.hn
  // click URL is ITSELF the tracked outbound target (same pattern as the CJ
  // domains below), so it must pass this allowlist or the /r/[id] + /api/go
  // handlers would 400 the Vrbo hand-off.
  'prf.hn',
  'airbnb.com',
  'hotelbeds.com',
  'skyscanner.com',
  'viator.com', // Slice H1: live experience inventory
  'getyourguide.com',
  // Commission Junction (CJ) click-redirect domains. gobookt's Booking.com
  // affiliate links track through these networks, NOT via a param on
  // booking.com — a CJ click URL (e.g. anrdoezrs.net/click-101803878-XXXX)
  // is ITSELF the tracked outbound target, so it must pass this allowlist or
  // the /r/[id] + /api/go redirect handlers would 404 it.
  'anrdoezrs.net',
  'dpbolvw.net',
  'tkqlhce.com',
  'jdoqocy.com',
  'kqzyfj.com',
];

/**
 * Validate a candidate redirect URL. Must be:
 *   - parseable as URL
 *   - https:// (protocol allowlist - http drops first-party cookies)
 *   - hostname exactly matches an allowed domain OR ends with `.<allowed>`
 */
export function isAllowedAffiliateHost(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return AFFILIATE_HOST_ALLOWLIST.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}
