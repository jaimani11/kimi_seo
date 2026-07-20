import { findBrand } from '@adored/brand-config';
import {
  checkLinks,
  type LinkHealthReport,
  type LinkPolicy,
  type RequiredSignal,
} from '@adored/portfolio-revenue';

/**
 * Travel adapter for the domain-neutral link-health core.
 *
 * Composes the existing per-brand PROVIDER policy (brand-config
 * `affiliate.providers` — the single source of truth) into a per-brand URL
 * policy that `checkLink`/`checkLinks` can enforce structurally:
 *
 *   - allowedHosts   : every host one of the brand's providers legitimately
 *                      lands on (incl. the redirect hosts that ARE the tracked
 *                      target — prf.hn for Partnerize, the CJ domains).
 *   - forbiddenHosts : every OTHER provider's host — the cross-brand leakage
 *                      guard (gobookt → vrbo.com is a $0-earning leak).
 *   - requiredSignals: the attribution the network needs to credit the sale.
 *
 * Attribution is asserted only where it's an unambiguous BUILD-time signal: the
 * Partnerize `camref` (path-encoded in every prf.hn link) for the pure
 * Expedia/VRBO brands. The Booking brand's CJ attribution is a REDIRECT-time
 * signal — cjevent is minted by CJ's click redirect, so it is NOT in the built
 * URL — so Booking gets host + leak coverage here (a runtime CJ-tracking audit
 * is v2). Multi-network brands (numiworks = Viator + VRBO) are host-only too.
 * gotript auto-gains the camref rule the moment its brand-config drops the
 * retired viator/getyourguide.
 */

/** Hosts a link for each provider may legitimately resolve to. */
const PROVIDER_HOSTS: Record<string, readonly string[]> = {
  expedia: ['expedia.com', 'hotels.com', 'prf.hn'],
  vrbo: ['vrbo.com', 'prf.hn'],
  viator: ['viator.com'],
  getyourguide: ['getyourguide.com'],
  booking: ['booking.com', 'anrdoezrs.net', 'dpbolvw.net', 'tkqlhce.com', 'jdoqocy.com', 'kqzyfj.com'],
};

const EVERY_PROVIDER_HOST: readonly string[] = [
  ...new Set(Object.values(PROVIDER_HOSTS).flat()),
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Derive the link-health policy for one brand from its brand-config. */
export function linkPolicyForBrand(brandKey: string): LinkPolicy {
  const brand = findBrand(brandKey);
  const providers = (brand?.affiliate.providers ?? []) as readonly string[];

  const allowedHosts = [...new Set(providers.flatMap((p) => PROVIDER_HOSTS[p] ?? []))];
  const forbiddenHosts = EVERY_PROVIDER_HOST.filter((h) => !allowedHosts.includes(h));

  const requiredSignals: RequiredSignal[] = [];
  const camref = brand?.affiliate.expediaCamref?.trim();
  const isPurePartnerize =
    providers.length > 0 && providers.every((p) => p === 'expedia' || p === 'vrbo');
  if (isPurePartnerize && camref) {
    requiredSignals.push({
      key: 'camref',
      valuePattern: new RegExp(`camref[:=]${escapeRe(camref)}`),
      note: 'Partnerize camref',
    });
  }
  // Booking (CJ) attribution is redirect-time (cjevent), not in the built URL,
  // so the Booking brand gets host + leak coverage only; a runtime CJ-tracking
  // audit is v2.

  return { id: brandKey, allowedHosts, forbiddenHosts, requiredSignals };
}

/**
 * Audit a set of a brand's outbound money-links → a link-health report.
 * Call from a build guard / admin route / cron with the URLs a brand's
 * builders actually emit for a representative sample of pages.
 */
export function auditBrandLinks(brandKey: string, urls: readonly string[]): LinkHealthReport {
  return checkLinks(urls, linkPolicyForBrand(brandKey));
}
