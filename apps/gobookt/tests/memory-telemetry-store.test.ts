import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryTelemetryStore } from '@/lib/observability/memory-telemetry-store';

describe('MemoryTelemetryStore', () => {
  let store: MemoryTelemetryStore;

  beforeEach(() => {
    store = new MemoryTelemetryStore();
  });

  it('records turns + agent runs', () => {
    store.beginTurn({ turnId: 't1', sessionId: 's1', type: 'compose' });
    store.recordAgentRun('t1', { agent: 'intent', durationMs: 120, model: 'claude-haiku-4-7' });
    store.completeTurn('t1', { durationMs: 1500 });

    const recent = store.getRecentTurns();
    expect(recent).toHaveLength(1);
    expect(recent[0]?.status).toBe('completed');
    expect(recent[0]?.agentRuns).toHaveLength(1);
    expect(recent[0]?.durationMs).toBe(1500);
  });

  it('beginTurn is idempotent on duplicate turnId', () => {
    store.beginTurn({ turnId: 't1', sessionId: 's1' });
    store.beginTurn({ turnId: 't1', sessionId: 's1' });
    expect(store.getRecentTurns()).toHaveLength(1);
  });

  it('recordAgentRun on unknown turn is a no-op (not an error)', () => {
    store.recordAgentRun('missing', { agent: 'intent', durationMs: 50 });
    expect(store.getRecentTurns()).toHaveLength(0);
  });

  it('failTurn marks status + records error', () => {
    store.beginTurn({ turnId: 't1', sessionId: 's1' });
    store.failTurn('t1', { error: 'boom' });
    const turn = store.getRecentTurns()[0];
    expect(turn?.status).toBe('failed');
    expect(turn?.failureError).toBe('boom');
  });

  it('caps the buffer at 200 turns (FIFO eviction)', () => {
    for (let i = 0; i < 250; i += 1) {
      store.beginTurn({ turnId: `t${i}`, sessionId: 's' });
    }
    const recent = store.getRecentTurns(500); // ask for more than the cap
    expect(recent).toHaveLength(200);
    // Oldest retained should be t50 (0..49 evicted).
    expect(recent[recent.length - 1]?.turnId).toBe('t50');
    expect(recent[0]?.turnId).toBe('t249');
  });

  it('caps agent runs per turn at 10', () => {
    store.beginTurn({ turnId: 't1', sessionId: 's' });
    for (let i = 0; i < 25; i += 1) {
      store.recordAgentRun('t1', { agent: `a${i}`, durationMs: i });
    }
    expect(store.getRecentTurns()[0]?.agentRuns).toHaveLength(10);
  });

  it('summary aggregates total cost + counts', () => {
    store.beginTurn({ turnId: 't1', sessionId: 's' });
    store.recordAgentRun('t1', { agent: 'intent', durationMs: 100, costUsd: 0.0012 });
    store.recordAgentRun('t1', { agent: 'mood', durationMs: 200, costUsd: 0.0008 });
    store.completeTurn('t1', { durationMs: 1500 });

    store.beginTurn({ turnId: 't2', sessionId: 's' });
    store.recordAgentRun('t2', { agent: 'intent', durationMs: 80, costUsd: 0.0005 });
    store.failTurn('t2', { error: 'rate limited' });

    const summary = store.getSummary();
    expect(summary.turns).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.totalCostUsd).toBeCloseTo(0.0025, 6);
    expect(summary.agentLatency.intent?.count).toBe(2);
    expect(summary.agentLatency.mood?.count).toBe(1);
  });

  it('summary p50/p95 are computed when there are completed turns', () => {
    for (let i = 1; i <= 10; i += 1) {
      store.beginTurn({ turnId: `t${i}`, sessionId: 's' });
      store.completeTurn(`t${i}`, { durationMs: i * 100 });
    }
    const summary = store.getSummary();
    // 10 samples: p50 ≈ 5th = 500, p95 ≈ 9th = 900 (zero-indexed floor).
    expect(summary.p50DurationMs).toBe(600);
    expect(summary.p95DurationMs).toBe(1000);
  });
});
