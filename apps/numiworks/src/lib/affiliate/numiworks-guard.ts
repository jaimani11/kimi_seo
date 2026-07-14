/**
 * numiworks cross-brand affiliate guard.
 *
 * numiworks belongs to the "Adored Moments LLC" family but MUST only ever emit
 * its OWN affiliate attribution (Viator via VIATOR_PARTNER_ID, VRBO via the
 * numiworks Partnerize camref). These publisher/PID markers belong to sibling
 * brands — or to a provider numiworks deliberately does not run — and must NEVER
 * appear in a numiworks outbound URL. A leak would misattribute the commission
 * to the wrong account, or route a numiworks visitor through a brand we don't
 * operate here:
 *
 *   101803878  gobookt   (Booking.com via CJ)
 *   101803920  gotript   (Booking.com via CJ)
 *   101827399  numiworks Booking.com CJ — Booking.com is NOT part of the
 *              numiworks product strategy, so even our own Booking PID is
 *              off-limits on this brand.
 *
 * This is defense-in-depth. The builders are already scoped to numiworks' own
 * ids, but the outbound redirect handlers (`/api/go`, `/r/[id]`) re-check every
 * URL so a stray hardcode, a copy-paste, or a future refactor can never silently
 * ship a cross-brand link. Fail closed: a URL carrying a forbidden marker is
 * rejected, not "fixed".
 */

/** Sibling-brand / off-strategy affiliate ids that must never appear on numiworks. */
export const FORBIDDEN_AFFILIATE_IDS: readonly string[] = [
  '101803878', // gobookt (Booking.com via CJ)
  '101803920', // gotript (Booking.com via CJ)
  '101827399', // numiworks Booking.com CJ — out of strategy on this brand
];

/**
 * Return the first forbidden affiliate id found in `url`, or null. The id is
 * matched only on non-digit boundaries, so a longer number that merely CONTAINS
 * one of these (e.g. a timestamp) can't cause a false positive. Never throws.
 */
export function findForeignAffiliateMarker(url: string): string | null {
  if (!url) return null;
  for (const id of FORBIDDEN_AFFILIATE_IDS) {
    let from = 0;
    for (;;) {
      const idx = url.indexOf(id, from);
      if (idx === -1) break;
      const before = url.charAt(idx - 1); // '' when idx === 0
      const after = url.charAt(idx + id.length); // '' at end of string
      const beforeIsDigit = before >= '0' && before <= '9';
      const afterIsDigit = after >= '0' && after <= '9';
      if (!beforeIsDigit && !afterIsDigit) return id;
      from = idx + 1;
    }
  }
  return null;
}

/** True when `url` carries no sibling-brand / off-strategy affiliate attribution. */
export function isNumiworksAffiliateSafe(url: string): boolean {
  return findForeignAffiliateMarker(url) === null;
}
