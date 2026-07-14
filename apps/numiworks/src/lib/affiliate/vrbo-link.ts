/**
 * numiworks VRBO affiliate links.
 *
 * The whole Adored Moments family (legal entity Adored Moments LLC) promotes
 * VRBO through ONE shared Partnerize publisher account. The camref is NOT baked
 * into source — it's supplied by env so the account/camref can change without a
 * redeploy, preview and production can differ, and numiworks can later get its
 * own camref without touching code. Precedence:
 *
 *   NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE  full wrapper with a {TARGET} placeholder
 *                                       — the PRODUCTION path, e.g.
 *                                       https://prf.hn/click/camref:1110lFruB/destination:{TARGET}
 *   NEXT_PUBLIC_VRBO_CAMREF             just the camref (we build the prf.hn wrapper)
 *   NEXT_PUBLIC_VRBO_SHORTLINK / default bounce shortlink — FAIL-SAFE ONLY
 *                                       (lands on VRBO's homepage, no destination)
 *
 * Output is byte-identical to the shared `buildVacationRentalsUrl`
 * (packages/affiliate) that gotript + stayviaowner use — numiworks keeps a thin
 * local helper only because its Expedia-hotels side is affcid-based (a different
 * account model), so it doesn't share their Partnerize ExpediaMulticategory
 * instance.
 *
 * VRBO's live search takes the location as a `destination` query param; the old
 * `/search/keywords:<x>` path is deprecated (VRBO ignores it and geolocates).
 */

/** Wrap a plain vrbo.com URL for tracking. Env-driven; bounce is fail-safe only. */
export function wrapVrboAffiliate(target: string): string {
  const template = process.env.NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE;
  if (template && template.includes('{TARGET}')) {
    return template.replace('{TARGET}', encodeURIComponent(target));
  }
  const camref = (process.env.NEXT_PUBLIC_VRBO_CAMREF || '').trim();
  if (camref) {
    return `https://prf.hn/click/camref:${camref}/destination:${encodeURIComponent(target)}`;
  }
  // Fail-safe: no Partnerize config → the tracked bounce shortlink. This lands on
  // VRBO's homepage with NO destination, so set the template above in production.
  return process.env.NEXT_PUBLIC_VRBO_SHORTLINK || 'https://vrbo.com/affiliate/zVJTNin';
}

/** Build a VRBO destination-search URL, wrapped for tracking. */
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
