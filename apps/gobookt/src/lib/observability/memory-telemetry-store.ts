/**
 * In-process ring buffer of recent turns + agent runs. Always-on; the
 * dashboard reads from here. Bounded so a long-running process can't
 * leak memory.
 *
 * No persistence - this is intentionally local. Postgres telemetry +
 * Langfuse handle archival; this is the operator's quick "what just
 * happened?" view in the admin UI.
 */

export interface AgentRunRecord {
  agent: string;
  durationMs: number;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  cacheHit?: boolean;
  error?: string;
  recordedAt: number;
}

export interface TurnRecord {
  turnId: string;
  sessionId: string;
  type?: 'compose' | 'refine';
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  status: 'streaming' | 'completed' | 'failed';
  failureError?: string;
  agentRuns: AgentRunRecord[];
}

export interface TelemetrySummary {
  turns: number;
  completed: number;
  failed: number;
  totalCostUsd: number;
  /** Median (P50) end-to-end turn duration, in ms. */
  p50DurationMs: number;
  /** 95th percentile end-to-end turn duration, in ms. */
  p95DurationMs: number;
  /** Per-agent latency P50/P95. */
  agentLatency: Record<string, { p50: number; p95: number; count: number }>;
}

const MAX_TURNS = 200;
const MAX_RUNS_PER_TURN = 10;

export class MemoryTelemetryStore {
  private readonly turns: TurnRecord[] = [];
  private readonly turnIndex = new Map<string, TurnRecord>();

  beginTurn(args: { turnId: string; sessionId: string; type?: 'compose' | 'refine' }): void {
    if (this.turnIndex.has(args.turnId)) return; // idempotent
    const rec: TurnRecord = {
      turnId: args.turnId,
      sessionId: args.sessionId,
      ...(args.type ? { type: args.type } : {}),
      startedAt: Date.now(),
      status: 'streaming',
      agentRuns: [],
    };
    this.turns.push(rec);
    this.turnIndex.set(args.turnId, rec);
    while (this.turns.length > MAX_TURNS) {
      const oldest = this.turns.shift();
      if (oldest) this.turnIndex.delete(oldest.turnId);
    }
  }

  recordAgentRun(turnId: string, run: Omit<AgentRunRecord, 'recordedAt'>): void {
    const turn = this.turnIndex.get(turnId);
    if (!turn) return; // unknown turn - not an error, just not tracked here
    if (turn.agentRuns.length >= MAX_RUNS_PER_TURN) return; // bound per-turn list
    turn.agentRuns.push({ ...run, recordedAt: Date.now() });
  }

  completeTurn(turnId: string, args: { durationMs: number }): void {
    const turn = this.turnIndex.get(turnId);
    if (!turn) return;
    turn.status = 'completed';
    turn.completedAt = Date.now();
    turn.durationMs = args.durationMs;
  }

  failTurn(turnId: string, args: { error: string }): void {
    const turn = this.turnIndex.get(turnId);
    if (!turn) return;
    turn.status = 'failed';
    turn.completedAt = Date.now();
    turn.failureError = args.error;
  }

  getRecentTurns(limit = 50): TurnRecord[] {
    // Most recent first (turns array is push-order so reverse a slice).
    return this.turns.slice(-limit).reverse();
  }

  getSummary(): TelemetrySummary {
    const finished = this.turns.filter((t) => t.status !== 'streaming');
    const completed = finished.filter((t) => t.status === 'completed');
    const failed = finished.filter((t) => t.status === 'failed');

    const totalCostUsd = finished.reduce((sum, t) => {
      for (const run of t.agentRuns) sum += run.costUsd ?? 0;
      return sum;
    }, 0);

    const durations = completed
      .map((t) => t.durationMs ?? 0)
      .filter((d) => d > 0)
      .sort((a, b) => a - b);

    // Per-agent latency aggregates.
    const agentBuckets = new Map<string, number[]>();
    for (const turn of finished) {
      for (const run of turn.agentRuns) {
        const bucket = agentBuckets.get(run.agent) ?? [];
        bucket.push(run.durationMs);
        agentBuckets.set(run.agent, bucket);
      }
    }
    const agentLatency: TelemetrySummary['agentLatency'] = {};
    for (const [agent, samples] of agentBuckets) {
      samples.sort((a, b) => a - b);
      agentLatency[agent] = {
        p50: percentile(samples, 0.5),
        p95: percentile(samples, 0.95),
        count: samples.length,
      };
    }

    return {
      turns: finished.length,
      completed: completed.length,
      failed: failed.length,
      totalCostUsd,
      p50DurationMs: percentile(durations, 0.5),
      p95DurationMs: percentile(durations, 0.95),
      agentLatency,
    };
  }

  /** Slice C5 - admin drill-in lookup. Returns null when the turn has
   *  scrolled out of the ring buffer (no surfaceable error; the page
   *  renders 404). */
  getTurn(turnId: string): TurnRecord | null {
    return this.turnIndex.get(turnId) ?? null;
  }

  /** Test-only - wipe state. */
  _reset(): void {
    this.turns.length = 0;
    this.turnIndex.clear();
  }
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(p * sortedAsc.length)));
  return sortedAsc[idx] ?? 0;
}

// Process-singleton - same buffer across the orchestrator + the
// dashboard's read API. HMR-safe on globalThis.
declare global {
  var __stayscoutTelemetryStore: MemoryTelemetryStore | undefined;
}

export function getMemoryTelemetryStore(): MemoryTelemetryStore {
  if (!globalThis.__stayscoutTelemetryStore) {
    globalThis.__stayscoutTelemetryStore = new MemoryTelemetryStore();
  }
  return globalThis.__stayscoutTelemetryStore;
}
