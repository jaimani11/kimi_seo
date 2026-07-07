import type { Metadata } from 'next';
import Link from 'next/link';
import { getMemorySubsystem } from '@lib/memory';
import { requireAdmin } from '@lib/admin/require-admin';
import type { MemoryRecord } from '@lib/memory/memory-store';
import { AdminShell } from '@/features/admin/admin-shell';
import { OwnerLink } from '@/features/admin/owner-link';
import { DataTable, type DataTableColumn } from '@/features/admin/data-table';

export const metadata: Metadata = {
  title: 'Memories · Admin · gobookt',
};

export const dynamic = 'force-dynamic';

/**
 * Memory index browser.
 *
 * Two modes via query params:
 *   - No `?owner=`: list all owners with memory counts.
 *   - `?owner=user:<id>` or `?owner=session:<id>`: list that owner's
 *     memories. With `?q=<query>` also set, runs a similarity search
 *     and shows ranked results with scores.
 *
 * The memory subsystem still runs in-memory in the C-series - this
 * page is the operator's window into that ring buffer. Postgres path
 * lands in C1.x.
 */

interface PageProps {
  searchParams: Promise<{ owner?: string; q?: string; kind?: string }>;
}

function parseOwner(
  raw: string | undefined,
): { ownerKind: 'user' | 'session'; ownerId: string } | null {
  if (!raw) return null;
  const sep = raw.indexOf(':');
  if (sep < 0) return null;
  const k = raw.slice(0, sep);
  const id = raw.slice(sep + 1);
  if ((k === 'user' || k === 'session') && id.length > 0) {
    return { ownerKind: k, ownerId: id };
  }
  return null;
}

export default async function AdminMemoriesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const owner = parseOwner(params.owner);
  const subsystem = getMemorySubsystem();

  if (!owner) {
    // ============== Global owner overview ==============
    const owners = await subsystem.store.listAllOwners();
    // Get counts per owner.
    const rows = await Promise.all(
      owners.map(async (o) => {
        const memories = await subsystem.store.listForOwner({
          ownerKind: o.ownerKind,
          ownerId: o.ownerId,
        });
        return {
          ownerKind: o.ownerKind,
          ownerId: o.ownerId,
          count: memories.length,
          latest: memories[0]?.createdAt ?? null,
        };
      }),
    );
    rows.sort((a, b) => {
      const ta = a.latest ? Date.parse(a.latest) : 0;
      const tb = b.latest ? Date.parse(b.latest) : 0;
      return tb - ta;
    });

    const columns: DataTableColumn<(typeof rows)[number]>[] = [
      {
        key: 'owner',
        label: 'Owner',
        render: (r) => <OwnerLink ownerKind={r.ownerKind} ownerId={r.ownerId} />,
      },
      { key: 'count', label: 'Memories', render: (r) => String(r.count) },
      {
        key: 'latest',
        label: 'Latest',
        render: (r) => (r.latest ? new Date(r.latest).toLocaleString() : '-'),
      },
      {
        key: 'open',
        label: '',
        render: (r) => (
          <Link
            href={`/admin/memories?owner=${encodeURIComponent(`${r.ownerKind}:${r.ownerId}`)}`}
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

    return (
      <AdminShell
        section="memories"
        title="Memories"
        subtitle={`${rows.length} ${rows.length === 1 ? 'owner' : 'owners'} have stored memories. Pick one to inspect or search.`}
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => `${r.ownerKind}:${r.ownerId}`}
          emptyText="No memories recorded yet across any owner."
        />
      </AdminShell>
    );
  }

  // ============== Per-owner view ==============
  const query = (params.q ?? '').trim();
  type RowWithScore = MemoryRecord & { score?: number };

  let rows: RowWithScore[];
  if (query) {
    const results = await subsystem.store.search({
      ownerKind: owner.ownerKind,
      ownerId: owner.ownerId,
      query,
      topK: 20,
      scoreFloor: 0,
    });
    rows = results.map((r) => ({ ...r.memory, score: r.score }));
  } else {
    const list = await subsystem.store.listForOwner({
      ownerKind: owner.ownerKind,
      ownerId: owner.ownerId,
      limit: 50,
    });
    rows = list;
  }

  const showScore = !!query;
  const columns: DataTableColumn<RowWithScore>[] = [
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
        <span
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            color: 'var(--ink-primary)',
          }}
        >
          {m.content}
        </span>
      ),
    },
    {
      key: 'signal',
      label: 'Signal',
      render: (m) =>
        m.signalKey ? (
          <code style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>
            {m.signalKey}
          </code>
        ) : (
          '-'
        ),
    },
    {
      key: 'created',
      label: 'Created',
      render: (m) => (
        <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}>
          {new Date(m.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];
  if (showScore) {
    columns.splice(1, 0, {
      key: 'score',
      label: 'Score',
      width: '5rem',
      render: (m) =>
        typeof m.score === 'number' ? (
          <span
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.72rem',
              color: 'var(--accent-primary)',
            }}
          >
            {m.score.toFixed(3)}
          </span>
        ) : (
          '-'
        ),
    });
  }

  return (
    <AdminShell
      section="memories"
      title="Memories · owner"
      subtitle={
        query
          ? `Similarity search results - ranked by cosine score against the bag-of-words embedding.`
          : `Most-recent memories for this owner.`
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <OwnerLink ownerKind={owner.ownerKind} ownerId={owner.ownerId} maxLength={32} />
        <Link
          href="/admin/memories"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          ← all owners
        </Link>
        <form action="/admin/memories" method="get" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="owner" value={`${owner.ownerKind}:${owner.ownerId}`} />
          <input
            type="text"
            name="q"
            placeholder="Similarity search…"
            defaultValue={query}
            className="rounded-md border px-2.5 py-1.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              background: 'var(--surface-elevated)',
              color: 'var(--ink-primary)',
              borderColor: 'var(--border-subtle)',
              minWidth: '14rem',
            }}
          />
          <button
            type="submit"
            className="rounded-md border px-3 py-1.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              background: 'var(--surface-elevated)',
              color: 'var(--ink-primary)',
              borderColor: 'var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(m) => m.id}
        emptyText={
          query ? 'No memories matched that query.' : 'This owner has no memories recorded.'
        }
      />
    </AdminShell>
  );
}
