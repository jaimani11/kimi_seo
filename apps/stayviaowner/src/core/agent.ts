import type { AgentId, StepId, TurnId } from './ids';
import type { MemoryContext } from './memory';
import type { ModelClient } from './model-client';
import type { OrchestratorEvent } from './orchestrator-event';

export interface Agent<I, O> {
  readonly id: AgentId;
  readonly name: string;
  readonly version: string;
  run(input: I, ctx: AgentContext): Promise<O>;
}

export interface AgentContext {
  readonly turnId: TurnId;
  readonly signal: AbortSignal;
  readonly emit: AgentEventEmitter;
  readonly modelClient: ModelClient;
  readonly traceLogger: TraceLogger;
  readonly memory?: MemoryContext; // Slice C populates
}

export interface AgentEventEmitter {
  progress(message: string, counter?: { current: number; total: number }): void;
  explanation(topic: string, summary: string, confidence?: number): void;
}

export interface TraceLogger {
  recordEvent(event: OrchestratorEvent): void;
  recordAgentRun(
    agent: AgentId,
    input: unknown,
    output: unknown,
    durationMs: number,
    modelMeta?: {
      model: string;
      tokensIn: number;
      tokensOut: number;
      cacheHit?: boolean;
    },
  ): void;
}

// Stable agent step descriptor - used by the orchestrator when emitting
// agent.step.* events.
export interface AgentStep {
  stepId: StepId;
  agentId: AgentId;
  label: string;
}
