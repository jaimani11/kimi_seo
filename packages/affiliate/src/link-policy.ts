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
 * Attribution is asserted only where a brand is on a SINGLE network and the
 * rule is unambiguous: Partnerize `camref` for the pure Expedia/VRBO brands,
 * CJ `cjevent` for the Booking brand. A multi-network brand (numiworks =
 * Viator + VRBO) gets host-only coverage for now — per-host attribution is v2.
 * gotript auto-gains the camref requirement the moment its brand-config
 * providers drop the retired viator/getyourguide.
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
  const isPureBooking = providers.length === 1 && providers[0] === 'booking';
  if (isPurePartnerize && camref) {
    requiredSignals.push({
      key: 'camref',
      valuePattern: new RegExp(`camref[:=]${escapeRe(camref)}`),
      note: 'Partnerize camref',
    });
  }
  if (isPureBooking) {
    requiredSignals.push({ key: 'cjevent', note: 'CJ cjevent' });
  }

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
