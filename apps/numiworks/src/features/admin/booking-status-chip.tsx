import type { BookingStatus } from '@core/booking';

const COLORS: Record<BookingStatus, { bg: string; fg: string; border: string }> = {
  confirmed: {
    bg: 'rgba(0,0,0,0)',
    fg: 'var(--accent-primary)',
    border: 'var(--accent-primary)',
  },
  canceled: {
    bg: 'var(--surface-overlay)',
    fg: 'var(--ink-tertiary)',
    border: 'var(--border-subtle)',
  },
  failed: {
    bg: 'rgba(255,142,107,0.08)',
    fg: 'var(--accent-warning)',
    border: 'var(--accent-warning)',
  },
  draft: {
    bg: 'var(--surface-overlay)',
    fg: 'var(--ink-secondary)',
    border: 'var(--border-subtle)',
  },
};

/**
 * Color-coded status pill for the admin bookings table. Matches the
 * EntitlementBadge pattern from C4 (geist-mono uppercase).
 */
export function BookingStatusChip({ status }: { status: BookingStatus }) {
  const c = COLORS[status];
  return (
    <span
      style={{
        fontFamily: 'var(--font-geist-mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '0.15rem 0.45rem',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        borderRadius: '0.2rem',
      }}
    >
      {status}
    </span>
  );
}
