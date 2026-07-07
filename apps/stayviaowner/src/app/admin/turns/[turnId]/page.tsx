import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMemoryTelemetryStore, type AgentRunRecord } from '@lib/observability';
import { requireAdmin } from '@lib/admin/require-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { OwnerLink } from '@/features/admin/owner-link';
import { DataTable, type DataTableColumn } from '@/features/admin/data-table';

export const metadata: Metadata = {
  title: 'Turn detail · Admin · stayviaowner',
};

export const dynamic = 'force-dynamic';

/**
 * Drill-in for a single turn. Reads from the in-process telemetry
 * store (the same buffer the dashboard renders summaries from).
 *
 * `notFound()` when the turn has scrolled out of the ring buffer -
 * dev-only data is meant to be ephemeral. Langfuse holds the durable
 * copy when wired.
 */

interface PageProps {
  params: Promise<{ turnId: string }>;
}

export default async function TurnDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { turnId } = await params;
  const turn = getMemoryTelemetryStore().getTurn(turnId);
  if (!turn) notFound();

  const totalCost = turn.agentRuns.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
  const totalTokensIn = turn.agentRuns.reduce((sum, r) => sum + (r.tokensIn ?? 0), 0);
  const totalTokensOut = turn.agentRuns.reduce((sum, r) => sum + (r.tokensOut ?? 0), 0);
  const someCost = turn.agentRuns.some((r) => (r.costUsd ?? 0) > 0);
  const someCache = turn.agentRuns.some((r) => r.cacheHit);

  const columns: DataTableColumn<AgentRunRecord>[] = [
    {
      key: 'agent',
      label: 'Agent',
      render: (r) => (
        <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--ink-primary)' }}>
          {r.agent}
        </code>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (r) => `${r.durationMs}ms`,
    },
    {
      key: 'model',
      label: 'Model',
      render: (r) => r.model ?? '-',
    },
    {
      key: 'tokens',
      label: 'Tokens',
      render: (r) =>
        r.tokensIn === undefined && r.tokensOut === undefined
          ? '-'
          : `${r.tokensIn ?? 0} → ${r.tokensOut ?? 0}`,
    },
  ];
  if (someCost) {
    columns.push({
      key: 'cost',
      label: 'Cost',
      render: (r) =>
        r.costUsd === undefined || r.costUsd === 0 ? '-' : `$${r.costUsd.toFixed(4)}`,
    });
  }
  if (someCache) {
    columns.push({
      key: 'cache',
      label: 'Cache',
      render: (r) => (r.cacheHit ? 'hit' : '-'),
    });
  }
  columns.push({
    key: 'error',
    label: 'Error',
    render: (r) =>
      r.error ? <span style={{ color: 'var(--accent-warning)' }}>{r.error}</span> : '-',
  });

  const statusColor =
    turn.status === 'completed'
      ? 'var(--accent-primary)'
      : turn.status === 'failed'
        ? 'var(--accent-warning)'
        : 'var(--ink-tertiary)';

  return (
    <AdminShell
      section="turns"
      title="Turn detail"
      subtitle={`A single trace through the orchestrator: agents, tokens, latency, and any failures.`}
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
              Turn id
            </p>
            <code
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.85rem',
                color: 'var(--ink-primary)',
              }}
            >
              {turn.turnId}
            </code>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Field label="Status" value={turn.status} valueColor={statusColor} />
            <Field label="Type" value={turn.type ?? '-'} valueColor="var(--ink-primary)" />
            <Field
              label="Duration"
              value={turn.durationMs ? `${turn.durationMs}ms` : '-'}
              valueColor="var(--ink-primary)"
            />
            {someCost ? (
              <Field
                label="Total cost"
                value={`$${totalCost.toFixed(4)}`}
                valueColor="var(--accent-primary)"
              />
            ) : null}
            {totalTokensIn + totalTokensOut > 0 ? (
              <Field
                label="Tokens"
                value={`${totalTokensIn} → ${totalTokensOut}`}
                valueColor="var(--ink-primary)"
              />
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Field
            label="Started"
            value={new Date(turn.startedAt).toLocaleString()}
            valueColor="var(--ink-secondary)"
          />
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
              Session
            </span>
            <OwnerLink ownerKind="session" ownerId={turn.sessionId} maxLength={20} />
          </div>
        </div>
        {turn.failureError ? (
          <div
            className="mt-4 rounded-md p-3"
            style={{
              background: 'var(--surface-overlay)',
              border: '1px solid var(--accent-warning)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-warning)',
              }}
            >
              Failure
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.78rem',
                color: 'var(--ink-secondary)',
                lineHeight: 1.5,
              }}
            >
              {turn.failureError}
            </p>
          </div>
        ) : null}
      </section>

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
        Agent timeline
      </h2>
      <DataTable
        columns={columns}
        rows={turn.agentRuns}
        rowKey={(r, idx) => `${r.agent}-${idx}-${r.recordedAt}`}
        emptyText="No agents reported runs for this turn."
      />
    </AdminShell>
  );
}

function Field({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
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
          fontSize: '1rem',
          fontWeight: 400,
          color: valueColor,
        }}
      >
        {value}
      </span>
    </div>
  );
}
