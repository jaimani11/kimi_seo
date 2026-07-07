import { describe, expect, it, vi } from 'vitest';
import { CompositeTraceLogger } from '@/lib/observability/composite-trace-logger';
import type { TraceLogger } from '@core/agent';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import { agentId } from '@core/ids';

function fakeSink(): TraceLogger & { events: OrchestratorEvent[]; runs: number } {
  const events: OrchestratorEvent[] = [];
  let runs = 0;
  return {
    events,
    get runs() {
      return runs;
    },
    set runs(v: number) {
      runs = v;
    },
    recordEvent(e) {
      events.push(e);
    },
    recordAgentRun() {
      runs += 1;
    },
  } as ReturnType<typeof fakeSink>;
}

describe('CompositeTraceLogger', () => {
  const sampleEvent: OrchestratorEvent = {
    kind: 'turn.completed',
    turnId: 't1',
    durationMs: 100,
  };

  it('dispatches recordEvent to every sink', () => {
    const a = fakeSink();
    const b = fakeSink();
    const composite = new CompositeTraceLogger([a, b]);
    composite.recordEvent(sampleEvent);
    expect(a.events).toHaveLength(1);
    expect(b.events).toHaveLength(1);
  });

  it('dispatches recordAgentRun to every sink', () => {
    const a = fakeSink();
    const b = fakeSink();
    const composite = new CompositeTraceLogger([a, b]);
    composite.recordAgentRun(agentId('intent'), {}, {}, 50);
    expect(a.runs).toBe(1);
    expect(b.runs).toBe(1);
  });

  it("isolates one sink's failure from the others", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken: TraceLogger = {
      recordEvent() {
        throw new Error('boom');
      },
      recordAgentRun() {
        throw new Error('boom');
      },
    };
    const ok = fakeSink();
    const composite = new CompositeTraceLogger([broken, ok]);
    composite.recordEvent(sampleEvent);
    composite.recordAgentRun(agentId('intent'), {}, {}, 50);
    expect(ok.events).toHaveLength(1);
    expect(ok.runs).toBe(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
