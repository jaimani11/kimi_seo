/**
 * numiworks affiliate configuration guard.
 *
 * Attribution only works if the provider env is set correctly in production.
 * This surfaces (and loudly logs) misconfiguration instead of silently shipping
 * untracked or fail-closed CTAs. It never throws — a missing env should degrade
 * gracefully (VRBO fails closed, Viator links go untracked) and be visible in
 * logs / an admin health check, not crash the app.
 */

import { vrboLinkMode, type VrboLinkMode } from './vrbo-link';

export interface AffiliateConfigStatus {
  vrbo: VrboLinkMode;
  /** True when VIATOR_PARTNER_ID (or its NEXT_PUBLIC alias) is set. */
  viatorPartnerId: boolean;
  /** Human-readable problems, empty when fully configured. */
  issues: string[];
  ok: boolean;
}

/** Inspect the current affiliate env. Pure — safe to call anywhere server-side. */
export function checkAffiliateConfig(): AffiliateConfigStatus {
  const vrbo = vrboLinkMode();
  const viatorPartnerId = Boolean(
    (process.env.NEXT_PUBLIC_VIATOR_PARTNER_ID || process.env.VIATOR_PARTNER_ID || '').trim(),
  );

  const issues: string[] = [];
  if (vrbo === 'unconfigured') {
    issues.push(
      'VRBO: NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE (or NEXT_PUBLIC_VRBO_CAMREF) is not set — VRBO CTAs fail closed (hidden).',
    );
  } else if (vrbo === 'emergency') {
    issues.push(
      'VRBO: running on the emergency homepage bounce — links carry no destination and no attribution.',
    );
  }
  if (!viatorPartnerId) {
    issues.push('Viator: VIATOR_PARTNER_ID is not set — outbound Viator links are untracked.');
  }

  return { vrbo, viatorPartnerId, issues, ok: issues.length === 0 };
}

/**
 * Log a loud error in production when affiliate attribution is misconfigured.
 * Idempotent per process (logs at most once) so a hot path can call it freely.
 * Never throws.
 */
let warnedOnce = false;
export function assertAffiliateConfigInProduction(): void {
  if (warnedOnce) return;
  warnedOnce = true;
  if (process.env.NODE_ENV !== 'production') return;
  const status = checkAffiliateConfig();
  if (!status.ok) {
    console.error('[affiliate-config] production affiliate attribution is misconfigured', {
      vrbo: status.vrbo,
      viatorPartnerId: status.viatorPartnerId,
      issues: status.issues,
    });
  }
}
