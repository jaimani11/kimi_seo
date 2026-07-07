import type { ConciergeRequest } from '@core/concierge-request';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import { AnthropicModelClient } from '@lib/ai/anthropic-client';
import { getTraceLogger } from '@lib/observability';
import { getMemorySubsystem } from '@lib/memory';
import { getSessionStore } from '@lib/session';
import { getServerFeatures } from '@lib/env';
import { createDefaultProviderRouter } from '@/providers';
import { Orchestrator } from './orchestrator';
import { LangGraphOrchestrator } from './langgraph';
import { getCheckpointer } from './langgraph/checkpointer';

/**
 * The structural type both engines satisfy. Anything calling
 * `engine.run()` works against either implementation.
 */
export interface OrchestratorEngine {
  run(req: ConciergeRequest, ctx: { signal: AbortSignal }): AsyncIterable<OrchestratorEvent>;
}

export type OrchestratorEngineKind = 'hand-rolled' | 'langgraph';

/**
 * Read STAYSCOUT_ORCHESTRATOR at call time. Default `hand-rolled`. Any
 * other value (including missing) falls back to default - typo-safe.
 */
export function getOrchestratorEngineKind(): OrchestratorEngineKind {
  const v = process.env.STAYSCOUT_ORCHESTRATOR;
  return v === 'langgraph' ? 'langgraph' : 'hand-rolled';
}

/**
 * Construct a fresh engine instance honoring the env flag. Async so the
 * LangGraph path can await PostgresSaver.setup() when DATABASE_URL is
 * present. The hand-rolled path resolves immediately.
 */
export async function createOrchestratorEngine(): Promise<OrchestratorEngine> {
  const modelClient = new AnthropicModelClient();
  const sessionStore = getSessionStore();
  const providerRouter = createDefaultProviderRouter(modelClient);
  const traceLogger = getTraceLogger();
  const memory = getMemorySubsystem();
  const kind = getOrchestratorEngineKind();

  let inner: OrchestratorEngine;
  if (kind === 'langgraph') {
    const checkpointer = await getCheckpointer();
    inner = new LangGraphOrchestrator({
      modelClient,
      traceLogger,
      providerRouter,
      sessionStore,
      checkpointer,
      memoryRecorder: memory.recorder,
      memoryRetriever: memory.retriever,
    });
  } else {
    inner = new Orchestrator({
      modelClient,
      traceLogger,
      providerRouter,
      sessionStore,
      memoryRecorder: memory.recorder,
      memoryRetriever: memory.retriever,
    });
  }

  // Wrap so every yielded event also flows through TraceLogger.recordEvent.
  // The orchestrators emit events but don't (yet) auto-pipe them to the
  // logger - doing it here keeps both engines telemetry-aligned without
  // duplicating the wrapping in their internals.
  return {
    async *run(req, ctx) {
      for await (const event of inner.run(req, ctx)) {
        try {
          traceLogger.recordEvent(event);
        } catch (err) {
          console.warn('[trace] recordEvent failed:', err);
        }
        yield event;
      }
    },
  };
}

// For diagnostics / future telemetry.
export { getServerFeatures };
