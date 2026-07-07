import type { Entitlement } from '@core/billing';

/**
 * Tiny "Premium" chip shown in workspace surfaces when entitled.
 * Renders nothing for free / anonymous so it's safe to drop into
 * server components unconditionally.
 */
export function EntitlementBadge({ entitlement }: { entitlement: Entitlement }) {
  if (entitlement.plan !== 'premium') return null;
  return (
    <span
      className="inline-flex items-center"
      style={{
        fontFamily: 'var(--font-geist-mono)',
        fontSize: '0.55rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.4rem',
        background: 'var(--surface-overlay)',
        border: '1px solid var(--accent-primary)',
        color: 'var(--accent-primary)',
        borderRadius: '0.2rem',
      }}
    >
      Premium
    </span>
  );
}
