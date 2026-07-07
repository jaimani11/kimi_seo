import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { AgentId } from '@core/ids';
import type { TraceLogger } from '@core/agent';

export const NoOpTraceLogger: TraceLogger = {
  recordEvent: () => {},
  recordAgentRun: () => {},
};

export const ConsoleTraceLogger: TraceLogger = {
  recordEvent(event: OrchestratorEvent) {
    console.info('[trace]', event.kind, event);
  },
  recordAgentRun(
    agent: AgentId,
    _input: unknown,
    _output: unknown,
    durationMs: number,
    modelMeta?: { model: string; tokensIn: number; tokensOut: number; cacheHit?: boolean },
  ) {
    console.info('[trace] agent.run', agent, `${durationMs}ms`, modelMeta);
  },
};
