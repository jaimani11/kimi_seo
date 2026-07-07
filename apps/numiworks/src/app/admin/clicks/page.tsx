import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionStore } from '@lib/session/factory';
import { requireAdmin } from '@lib/admin/require-admin';
import type { AffiliateClickRecord } from '@lib/session/session-store';
import { AdminShell } from '@/features/admin/admin-shell';
import { OwnerLink } from '@/features/admin/owner-link';
import { DataTable, type DataTableColumn } from '@/features/admin/data-table';

export const metadata: Metadata = {
  title: 'Affiliate clicks · Admin · numiworks',
};

export const dynamic = 'force-dynamic';

/**
 * Most-recent affiliate clicks across the install. Powers the operator's
 * eye on the redirect funnel - which providers are getting taps, which
 * stays, which sessions converted. Linked back to the per-owner view.
 */
export default async function AdminClicksPage() {
  await requireAdmin();
  const clicks = await getSessionStore().listClicks({ limit: 100 });
  const conversions = clicks.filter((c) => 'converted' in c && c.converted).length;

  const columns: DataTableColumn<AffiliateClickRecord>[] = [
    {
      key: 'time',
      label: 'Time',
      width: '12rem',
      render: (c) => (
        <span
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.7rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          {new Date(c.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (c) => <OwnerLink ownerKind={c.ownerKind} ownerId={c.ownerId} />,
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (c) => (
        <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--ink-primary)' }}>
          {c.providerId}
        </code>
      ),
    },
    {
      key: 'stay',
      label: 'Stay',
      render: (c) => {
        const tail = c.stayId.length > 18 ? `…${c.stayId.slice(-15)}` : c.stayId;
        return (
          <code
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.7rem',
              color: 'var(--ink-secondary)',
            }}
          >
            {tail}
          </code>
        );
      },
    },
    {
      key: 'turn',
      label: 'Turn',
      render: (c) => {
        if (!c.turnId) return '-';
        const tail = c.turnId.length > 14 ? `…${c.turnId.slice(-12)}` : c.turnId;
        return (
          <Link
            href={`/admin/turns/${encodeURIComponent(c.turnId)}`}
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.7rem',
              color: 'var(--accent-primary)',
            }}
          >
            {tail}
          </Link>
        );
      },
    },
  ];

  return (
    <AdminShell
      section="clicks"
      title="Affiliate clicks"
      subtitle={`${clicks.length} recent · ${conversions} converted. Most recent first.`}
    >
      <DataTable
        columns={columns}
        rows={clicks}
        rowKey={(c) => c.id}
        emptyText="No clicks recorded yet - go save a trip and tap a hero card."
      />
    </AdminShell>
  );
}
