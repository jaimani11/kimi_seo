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
  'airbnb.com',
  'hotelbeds.com',
  'skyscanner.com',
  'viator.com', // Slice H1: live experience inventory
  'getyourguide.com',
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
