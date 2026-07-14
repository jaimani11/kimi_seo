/**
 * numiworks VRBO affiliate links.
 *
 * numiworks has no dedicated Partnerize camref of its own, but the whole
 * Adored Moments family shares one Partnerize publisher account
 * (id 1011l430591). So VRBO links deep-link through that account's camref by
 * default — which carries the searched destination AND tracks commission —
 * rather than bouncing to VRBO's homepage via the plain affiliate shortlink.
 *
 * Overrides (Vercel env, numiworks project):
 *   NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE  full wrapper with a {TARGET} placeholder
 *   NEXT_PUBLIC_VRBO_CAMREF             just the Partnerize camref to use
 *
 * VRBO's live search takes the location as a `destination` query param; the
 * old `/search/keywords:<x>` path is deprecated (VRBO ignores it and
 * geolocates the visitor instead), so we always build the query form.
 */

const DEFAULT_CAMREF = '1110lFruB';

/** Wrap a plain vrbo.com URL for tracking (Partnerize deep-link by default). */
export function wrapVrboAffiliate(target: string): string {
  const template = process.env.NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE;
  if (template && template.includes('{TARGET}')) {
    return template.replace('{TARGET}', encodeURIComponent(target));
  }
  const camref = (process.env.NEXT_PUBLIC_VRBO_CAMREF || DEFAULT_CAMREF).trim();
  return `https://prf.hn/click/camref:${camref}/destination:${encodeURIComponent(target)}`;
}

/** Build a tracked VRBO destination-search URL. */
export function buildVrboSearchUrl(
  destination: string,
  checkIn?: string,
  checkOut?: string,
): string {
  const params = new URLSearchParams();
  params.set('destination', destination);
  if (checkIn) params.set('startDate', checkIn);
  if (checkOut) params.set('endDate', checkOut);
  return wrapVrboAffiliate(`https://www.vrbo.com/search?${params.toString()}`);
}
