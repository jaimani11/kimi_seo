/**
 * Next.js instrumentation hook — runs once when the server process boots.
 * Used for lightweight startup validation. Keep it fast and side-effect-light.
 */
export async function register(): Promise<void> {
  // Only the Node.js server runtime serves the concierge / affiliate paths.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertAffiliateConfigInProduction } = await import('@lib/affiliate/config-guard');
    // Loudly logs (once) in production if VRBO/Viator attribution is
    // misconfigured, so a missing env is visible instead of silently shipping
    // fail-closed or untracked CTAs. Never throws.
    assertAffiliateConfigInProduction();
  }
}
