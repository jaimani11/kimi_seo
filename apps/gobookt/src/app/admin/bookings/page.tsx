import type { Metadata } from 'next';
import Link from 'next/link';
import { getBookingSubsystem } from '@lib/booking';
import { requireAdmin } from '@lib/admin/require-admin';
import type { Booking } from '@core/booking';
import { AdminShell } from '@/features/admin/admin-shell';
import { OwnerLink } from '@/features/admin/owner-link';
import { DataTable, type DataTableColumn } from '@/features/admin/data-table';
import { BookingStatusChip } from '@/features/admin/booking-status-chip';

export const metadata: Metadata = {
  title: 'Bookings · Admin · gobookt',
};

export const dynamic = 'force-dynamic';

/**
 * Admin booking feed. Sibling to /admin/clicks - same shape, same
 * vocabulary. Operators can see what the booking-agent is doing
 * (drafts, confirmed, canceled, failed) without leaving the console.
 *
 * Status counts in the subtitle give a quick health pulse at a glance.
 */
export default async function AdminBookingsPage() {
  await requireAdmin();
  const subsystem = getBookingSubsystem();
  const bookings = await subsystem.store.listAll({ limit: 100 });

  const counts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const columns: DataTableColumn<Booking>[] = [
    {
      key: 'time',
      label: 'Time',
      width: '11rem',
      render: (b) => {
        const ts = b.confirmedAt ?? b.canceledAt;
        return (
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>
            {ts ? new Date(ts).toLocaleString() : '-'}
          </span>
        );
      },
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (b) => <OwnerLink ownerKind={b.ownerKind} ownerId={b.ownerId} />,
    },
    {
      key: 'stay',
      label: 'Stay',
      render: (b) => {
        const tail = b.stayId.length > 22 ? `…${b.stayId.slice(-19)}` : b.stayId;
        return (
          <code style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>{tail}</code>
        );
      },
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (b) => (
        <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--ink-primary)' }}>
          {b.providerId}
        </code>
      ),
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (b) => (
        <span
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.72rem',
            color: 'var(--ink-secondary)',
          }}
        >
          {b.checkIn} → {b.checkOut}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (b) => `${b.total.amount.toLocaleString()} ${b.total.currency}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (b) => <BookingStatusChip status={b.status} />,
    },
    {
      key: 'open',
      label: '',
      render: (b) => (
        <Link
          href={`/bookings/${encodeURIComponent(b.id)}`}
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          View →
        </Link>
      ),
    },
  ];

  const subtitle = bookings.length
    ? `${bookings.length} recent · ${counts.confirmed ?? 0} confirmed · ${counts.canceled ?? 0} canceled${
        (counts.failed ?? 0) > 0 ? ` · ${counts.failed} failed` : ''
      } · provider mode: ${subsystem.kind}${subsystem.liveEnabled ? ' (live flag set; D.x)' : ''}.`
    : `No bookings recorded yet - try one from a saved trip. Provider mode: ${subsystem.kind}${
        subsystem.liveEnabled ? ' (live flag set; D.x)' : ''
      }.`;

  return (
    <AdminShell section="bookings" title="Bookings" subtitle={subtitle}>
      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(b) => b.id}
        emptyText="No bookings recorded yet - try one from a saved trip."
      />
    </AdminShell>
  );
}
