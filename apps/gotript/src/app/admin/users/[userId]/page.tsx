import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionStore } from '@lib/session/factory';
import { getMemorySubsystem } from '@lib/memory';
import { getBillingSubsystem } from '@lib/billing';
import { getMemoryTelemetryStore, type TurnRecord } from '@lib/observability';
import { requireAdmin } from '@lib/admin/require-admin';
import type { SavedTrip, AffiliateClickRecord } from '@lib/session/session-store';
import type { MemoryRecord } from '@lib/memory/memory-store';
import { AdminShell } from '@/features/admin/admin-shell';
import { DataTable, type DataTableColumn } from '@/features/admin/data-table';

export const metadata: Metadata = {
  title: 'Owner detail · Admin · gotript',
};

export const dynamic = 'force-dynamic';

/**
 * Owner aggregate. Pulls trips, clicks, billing entitlement, memories,
 * and recent turns for the resolved owner. Mirrors what an operator
 * needs to debug a single user's flow without bouncing between pages.
 *
 * The `?kind=session|user` query param disambiguates anonymous vs
 * authenticated owners - the route's `[userId]` segment is the
 * literal id; ownerKind is metadata. Defaults to `user` for the
 * "click an authenticated id" common case.
 */

interface PageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ kind?: string }>;
}

export default async function AdminUserPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { userId } = await params;
  const { kind } = await searchParams;
  const ownerKind: 'user' | 'session' = kind === 'session' ? 'session' : 'user';
  const owner = { ownerKind, ownerId: userId };

  const sessionStore = getSessionStore();
  const memorySubsystem = getMemorySubsystem();
  const billingSubsystem = getBillingSubsystem();

  const [trips, clicks, memories, entitlement] = await Promise.all([
    sessionStore.listTrips(owner),
    sessionStore.listClicks({ owner, limit: 50 }),
    memorySubsystem.store.listForOwner({ ...owner, limit: 50 }),
    billingSubsystem.provider.getEntitlement(owner),
  ]);

  // Recent turns from this session (telemetry store is keyed by sessionId).
  // For ownerKind='session', the userId is itself the sessionId.
  const recentTurns =
    ownerKind === 'session'
      ? getMemoryTelemetryStore()
          .getRecentTurns(50)
          .filter((t) => t.sessionId === userId)
          .slice(0, 10)
      : [];

  return (
    <AdminShell
      section="users"
      title="Owner detail"
      subtitle={`Saved trips, billing, memories, and recent activity for one owner.`}
    >
      <section
        className="mb-6 rounded-[14px] border p-5"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-tertiary)',
              }}
            >
              {ownerKind === 'user' ? 'User id' : 'Session id'}
            </p>
            <code
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.85rem',
                color: 'var(--ink-primary)',
              }}
            >
              {userId}
            </code>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Stat label="Saved trips" value={String(trips.length)} />
            <Stat label="Clicks" value={String(clicks.length)} />
            <Stat label="Memories" value={String(memories.length)} />
            <Stat
              label="Plan"
              value={entitlement.plan === 'premium' ? 'Premium' : 'Free'}
              accent={entitlement.plan === 'premium'}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            Entitlement source
          </span>
          <code
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.7rem',
              color: 'var(--ink-secondary)',
            }}
          >
            {entitlement.source}
          </code>
          {entitlement.premiumUntil ? (
            <span
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontStyle: 'italic',
                fontSize: '0.78rem',
                color: 'var(--ink-tertiary)',
              }}
            >
              · until {entitlement.premiumUntil.toLocaleString()}
            </span>
          ) : null}
        </div>
      </section>

      <Section title="Saved trips">
        <DataTable
          columns={tripColumns}
          rows={trips.slice(0, 10)}
          rowKey={(t) => t.id}
          emptyText="No saved trips for this owner."
        />
      </Section>

      <Section title="Affiliate clicks">
        <DataTable
          columns={clickColumns}
          rows={clicks.slice(0, 10)}
          rowKey={(c) => c.id}
          emptyText="No clicks recorded for this owner."
        />
      </Section>

      <Section title="Memories">
        <DataTable
          columns={memoryColumns}
          rows={memories.slice(0, 10)}
          rowKey={(m) => m.id}
          emptyText="No memories recorded for this owner."
        />
        {memories.length > 0 ? (
          <p className="mt-2">
            <Link
              href={`/admin/memories?owner=${encodeURIComponent(`${ownerKind}:${userId}`)}`}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
              }}
            >
              All memories →
            </Link>
          </p>
        ) : null}
      </Section>

      {ownerKind === 'session' ? (
        <Section title="Recent turns from this session">
          <DataTable
            columns={turnColumns}
            rows={recentTurns}
            rowKey={(t) => t.turnId}
            emptyText="No recent turns from this session in the local telemetry buffer."
          />
        </Section>
      ) : null}
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="mb-3"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-display-sm)',
          fontWeight: 400,
          color: 'var(--ink-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '1.1rem',
          fontWeight: 400,
          color: accent ? 'var(--accent-primary)' : 'var(--ink-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const tripColumns: DataTableColumn<SavedTrip>[] = [
  {
    key: 'destination',
    label: 'Destination',
    render: (t) => (
      <span
        style={{
          fontFamily: 'var(--font-fraunces)',
          color: 'var(--ink-primary)',
        }}
      >
        {t.proposalSummary.destinationName}
      </span>
    ),
  },
  {
    key: 'hero',
    label: 'Hero stay',
    render: (t) => t.proposalSummary.heroStayName,
  },
  {
    key: 'nights',
    label: 'Nights',
    render: (t) => String(t.proposalSummary.nights ?? '-'),
  },
  {
    key: 'bookmarked',
    label: 'Bookmarked',
    render: (t) => (
      <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>
        {new Date(t.bookmarkedAt).toLocaleDateString()}
      </span>
    ),
  },
];

const clickColumns: DataTableColumn<AffiliateClickRecord>[] = [
  {
    key: 'time',
    label: 'Time',
    width: '11rem',
    render: (c) => (
      <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>
        {new Date(c.createdAt).toLocaleString()}
      </span>
    ),
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
        <code style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>{tail}</code>
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

const memoryColumns: DataTableColumn<MemoryRecord>[] = [
  {
    key: 'kind',
    label: 'Kind',
    width: '7rem',
    render: (m) => (
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0.1rem 0.4rem',
          background: 'var(--surface-overlay)',
          color: m.kind === 'structural' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '0.2rem',
        }}
      >
        {m.kind}
      </span>
    ),
  },
  {
    key: 'content',
    label: 'Content',
    render: (m) => (
      <span style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic' }}>{m.content}</span>
    ),
  },
  {
    key: 'when',
    label: 'When',
    render: (m) => (
      <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>
        {new Date(m.createdAt).toLocaleString()}
      </span>
    ),
  },
];

const turnColumns: DataTableColumn<TurnRecord>[] = [
  {
    key: 'id',
    label: 'Turn',
    render: (t) => {
      const tail = t.turnId.length > 14 ? `…${t.turnId.slice(-12)}` : t.turnId;
      return (
        <Link
          href={`/admin/turns/${encodeURIComponent(t.turnId)}`}
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
  { key: 'type', label: 'Type', render: (t) => t.type ?? '-' },
  { key: 'status', label: 'Status', render: (t) => t.status },
  {
    key: 'duration',
    label: 'Duration',
    render: (t) => (t.durationMs ? `${t.durationMs}ms` : '-'),
  },
  {
    key: 'started',
    label: 'Started',
    render: (t) => (
      <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>
        {new Date(t.startedAt).toLocaleTimeString()}
      </span>
    ),
  },
];
