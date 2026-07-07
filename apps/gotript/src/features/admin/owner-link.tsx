import Link from 'next/link';

interface OwnerLinkProps {
  ownerKind: 'user' | 'session';
  ownerId: string;
  /** Optional: control how aggressively the id gets truncated. */
  maxLength?: number;
}

/**
 * Renders an owner reference as a link to `/admin/users/[ownerId]?kind=...`.
 * Anonymous and authenticated owners both get the same affordance.
 */
export function OwnerLink({ ownerKind, ownerId, maxLength = 16 }: OwnerLinkProps) {
  const display =
    ownerId.length > maxLength
      ? `${ownerId.slice(0, 4)}…${ownerId.slice(-Math.max(4, maxLength - 5))}`
      : ownerId;
  const href = `/admin/users/${encodeURIComponent(ownerId)}?kind=${ownerKind}`;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 hover:text-[color:var(--ink-primary)]"
      style={{
        fontFamily: 'var(--font-geist-mono)',
        fontSize: '0.72rem',
        color: 'var(--ink-secondary)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0.05rem 0.3rem',
          background: 'var(--surface-overlay)',
          color: 'var(--ink-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '0.2rem',
        }}
      >
        {ownerKind}
      </span>
      <code>{display}</code>
    </Link>
  );
}
