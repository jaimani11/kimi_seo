import type { Metadata } from 'next';
import { getServerFeatures } from '@lib/env';
import { getMemoryTelemetryStore, getTraceLogger } from '@lib/observability';
import { requireAdmin } from '@lib/admin/require-admin';
import { SummaryCard } from '@/features/admin/summary-card';
import { AgentLatencyChart } from '@/features/admin/agent-latency-chart';
import { TurnRow } from '@/features/admin/turn-row';
import { AdminShell } from '@/features/admin/admin-shell';

export const metadata: Metadata = {
  title: 'Admin · stayviaowner',
  description: 'Operator dashboard for traces, costs, and latency.',
};

export const dynamic = 'force-dynamic';

/**
 * Operator dashboard. Reads from the in-memory telemetry buffer
 * populated by the orchestrator's TraceLogger composite. Always shows
 * locally-captured data; Langfuse (when wired) holds the durable copy.
 *
 * Slice C5 - auth gate centralized in `requireAdmin()`. Layout wrapped
 * by `AdminShell` so the new admin pages share a consistent header +
 * nav. Recent turn rows now link to `/admin/turns/[turnId]` for the
 * full trace drill-in.
 */
export default async function AdminPage() {
  await requireAdmin();
  const features = getServerFeatures();

  // Touch the trace logger so its singleton is constructed (idempotent).
  getTraceLogger();
  const store = getMemoryTelemetryStore();
  const summary = store.getSummary();
  const turns = store.getRecentTurns(40);

  const errorRate = summary.turns > 0 ? (summary.failed / summary.turns) * 100 : 0;

  return (
    <AdminShell
      section="dashboard"
      title="Dashboard"
      subtitle={`Recent turns, agent latency, model cost. Process-local - restarts clear it.${
        features.langfuse ? ' Durable copy lives in Langfuse.' : ''
      }`}
    >
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label="Turns"
          value={String(summary.turns)}
          caption={`${summary.completed} completed · ${summary.failed} failed`}
        />
        <SummaryCard
          label="P50 latency"
          value={summary.p50DurationMs ? `${summary.p50DurationMs}ms` : '-'}
          caption={summary.p95DurationMs ? `p95 ${summary.p95DurationMs}ms` : 'no completed turns'}
        />
        <SummaryCard
          label="Total cost"
          value={summary.totalCostUsd > 0 ? `$${summary.totalCostUsd.toFixed(4)}` : '$0'}
          caption={summary.totalCostUsd > 0 ? 'across recent turns' : 'no priced calls'}
          emphasized={summary.totalCostUsd > 0}
        />
        <SummaryCard
          label="Error rate"
          value={`${errorRate.toFixed(1)}%`}
          caption={summary.failed > 0 ? `${summary.failed} failed` : 'all clean'}
        />
        <SummaryCard
          label="Billing"
          value={features.billing.kind === 'stripe' ? 'Stripe' : 'Mock'}
          caption={
            features.billing.kind === 'stripe'
              ? 'real Checkout + webhook'
              : 'authed users premium · anon free'
          }
          emphasized={features.billing.kind === 'stripe'}
        />
        <SummaryCard
          label="Affiliate"
          value={features.affiliate.expediaConfigured ? 'Vrbo · Live' : 'Untracked'}
          caption={
            features.affiliate.expediaConfigured
              ? 'affcid attached on every CTA'
              : 'CTAs work · commission not tracked'
          }
          emphasized={features.affiliate.expediaConfigured}
        />
      </section>

      <section className="mb-8">
        <h2
          className="mb-4"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Agent latency
        </h2>
        <div
          className="rounded-[14px] border p-4"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <AgentLatencyChart agentLatency={summary.agentLatency} />
        </div>
      </section>

      <section>
        <h2
          className="mb-4"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Recent turns
        </h2>
        {turns.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body-sm)',
              fontStyle: 'italic',
              color: 'var(--ink-tertiary)',
            }}
          >
            No turns yet - run a search to populate.
          </p>
        ) : (
          <div
            className="overflow-hidden rounded-[14px] border"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: 'var(--surface-overlay)',
                  }}
                >
                  {(['Turn', 'Type', 'Session', 'Duration', 'Agents', 'Cost'] as const).map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2 ${i >= 3 ? 'text-right' : ''}`}
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-tertiary)',
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {turns.map((t) => (
                  <TurnRow key={t.turnId} turn={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
