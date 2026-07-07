import type { TelemetrySummary } from '@lib/observability';

interface AgentLatencyChartProps {
  agentLatency: TelemetrySummary['agentLatency'];
}

/**
 * Compact horizontal-bar chart of P50/P95 latency per agent. CSS-only -
 * no chart lib, no client component. The widest P95 sets the scale.
 */
export function AgentLatencyChart({ agentLatency }: AgentLatencyChartProps) {
  const entries = Object.entries(agentLatency).sort((a, b) => b[1].p95 - a[1].p95);
  if (entries.length === 0) {
    return (
      <p
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-body-sm)',
          fontStyle: 'italic',
          color: 'var(--ink-tertiary)',
        }}
      >
        No agent runs yet - start a turn to populate.
      </p>
    );
  }
  const maxP95 = Math.max(...entries.map(([, v]) => v.p95));

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([agent, stats]) => (
        <div key={agent}>
          <div className="flex items-baseline justify-between gap-3">
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--ink-primary)',
                fontWeight: 500,
              }}
            >
              {agent}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.7rem',
                color: 'var(--ink-tertiary)',
                letterSpacing: '0.02em',
              }}
            >
              p50 {stats.p50}ms · p95 {stats.p95}ms · n={stats.count}
            </span>
          </div>
          <div
            className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--surface-overlay)' }}
          >
            {/* P95 bar (lighter) */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${maxP95 === 0 ? 0 : (stats.p95 / maxP95) * 100}%`,
                background: 'var(--border-emphasis)',
              }}
            />
            {/* P50 bar (accent overlay) */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${maxP95 === 0 ? 0 : (stats.p50 / maxP95) * 100}%`,
                background: 'var(--accent-primary)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
