import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { AgentId } from '@core/ids';
import type { TraceLogger } from '@core/agent';

/**
 * Stack multiple TraceLoggers behind one interface. Each call dispatches
 * to every sink; one sink's failure is isolated and never affects the
 * others (or the request flow). Pattern matches B4's `recordClick`
 * try/catch: telemetry never blocks the user-visible path.
 */
export class CompositeTraceLogger implements TraceLogger {
  constructor(private readonly sinks: readonly TraceLogger[]) {}

  recordEvent(event: OrchestratorEvent): void {
    for (const sink of this.sinks) {
      try {
        sink.recordEvent(event);
      } catch (err) {
        console.warn('[trace] sink.recordEvent failed:', err);
      }
    }
  }

  recordAgentRun(
    agent: AgentId,
    input: unknown,
    output: unknown,
    durationMs: number,
    modelMeta?: { model: string; tokensIn: number; tokensOut: number; cacheHit?: boolean },
  ): void {
    for (const sink of this.sinks) {
      try {
        sink.recordAgentRun(agent, input, output, durationMs, modelMeta);
      } catch (err) {
        console.warn('[trace] sink.recordAgentRun failed:', err);
      }
    }
  }
}
