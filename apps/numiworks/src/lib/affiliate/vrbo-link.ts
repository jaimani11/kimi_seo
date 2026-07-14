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
 *   (nothing)                           → FAIL CLOSED: no VRBO link.
 *
 * FAIL-CLOSED contract (Phase A safety): when neither the template nor the
 * camref is configured, the builders return `null`. Callers MUST treat null as
 * "no VRBO CTA" and hide it, rather than fall back to an untracked homepage
 * bounce. The old `vrbo.com/affiliate/zVJTNin` shortlink dropped BOTH the
 * searched destination AND the attribution, so it must never be presented as a
 * destination result. It now lives ONLY behind an explicit emergency opt-in
 * (`NEXT_PUBLIC_VRBO_ALLOW_EMERGENCY_FALLBACK=true`) and even then never carries
 * a destination — use `vrboCarriesDestination()` before labelling a CTA.
 *
 * VRBO's live search takes the location as a `destination` query param; the old
 * `/search/keywords:<x>` path is deprecated (VRBO ignores it and geolocates).
 */

export type VrboLinkMode = 'template' | 'camref' | 'emergency' | 'unconfigured';

/** How VRBO tracking is currently configured (env-driven). */
export function vrboLinkMode(): VrboLinkMode {
  const template = process.env.NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE;
  if (template && template.includes('{TARGET}')) return 'template';
  if ((process.env.NEXT_PUBLIC_VRBO_CAMREF || '').trim()) return 'camref';
  if (process.env.NEXT_PUBLIC_VRBO_ALLOW_EMERGENCY_FALLBACK === 'true') return 'emergency';
  return 'unconfigured';
}

/**
 * Whether the current VRBO config carries the searched destination. Template and
 * camref do; the emergency bounce does NOT (it lands on VRBO's homepage). Use
 * this before presenting a VRBO CTA as a destination-specific result.
 */
export function vrboCarriesDestination(): boolean {
  const mode = vrboLinkMode();
  return mode === 'template' || mode === 'camref';
}

/**
 * Wrap a plain vrbo.com URL for tracking. Returns null when VRBO is not
 * configured (fail closed) so callers can hide the CTA rather than bounce the
 * user to VRBO's homepage with no destination and no attribution. The target is
 * URL-encoded exactly once.
 */
export function wrapVrboAffiliate(target: string): string | null {
  const template = process.env.NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE;
  if (template && template.includes('{TARGET}')) {
    return template.replace('{TARGET}', encodeURIComponent(target));
  }
  const camref = (process.env.NEXT_PUBLIC_VRBO_CAMREF || '').trim();
  if (camref) {
    return `https://prf.hn/click/camref:${camref}/destination:${encodeURIComponent(target)}`;
  }
  // No Partnerize config. Only surface the (destination-less, homepage) emergency
  // bounce when an operator has EXPLICITLY opted in; otherwise fail closed.
  if (process.env.NEXT_PUBLIC_VRBO_ALLOW_EMERGENCY_FALLBACK === 'true') {
    return process.env.NEXT_PUBLIC_VRBO_SHORTLINK || 'https://vrbo.com/affiliate/zVJTNin';
  }
  return null;
}

/**
 * Build a VRBO destination-search URL, wrapped for tracking. Returns null when
 * VRBO is unconfigured (fail closed) — callers hide the CTA.
 */
export function buildVrboSearchUrl(
  destination: string,
  checkIn?: string,
  checkOut?: string,
): string | null {
  const params = new URLSearchParams();
  params.set('destination', destination);
  if (checkIn) params.set('startDate', checkIn);
  if (checkOut) params.set('endDate', checkOut);
  return wrapVrboAffiliate(`https://www.vrbo.com/search?${params.toString()}`);
}
