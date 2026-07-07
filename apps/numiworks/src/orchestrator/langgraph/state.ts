import { Annotation } from '@langchain/langgraph';
import type { ConciergeRequest } from '@core/concierge-request';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { ProposalRef } from '@core/partial';
import type { ProviderSearchResult } from '@core/provider';
import type { TripIntent } from '@core/trip-intent';
import type { AgentTraceSummary, TripProposal } from '@core/trip-proposal';
import type { TurnRecord } from '@lib/session/session-store';
import type { RetrievedMemories } from '@lib/memory';
import type { RouteDecision } from '../route-search';

/**
 * Graph state - the **minimum** data flowing between nodes. Events are
 * emitted via a side-channel (RuntimeContext.emit), not state. State is
 * what we'd want to checkpoint + resume; events are the wire format.
 *
 * Every channel uses the default LastValue reducer (last write wins).
 * `terminated` uses logical-OR so any node can short-circuit downstream
 * execution by setting it once.
 */
export const GraphAnnotation = Annotation.Root({
  request: Annotation<ConciergeRequest>(),
  priorTurn: Annotation<TurnRecord | null>({
    default: () => null,
    reducer: (_l, r) => r,
  }),
  intent: Annotation<TripIntent | null>({
    default: () => null,
    reducer: (_l, r) => r,
  }),
  searchResult: Annotation<ProviderSearchResult | null>({
    default: () => null,
    reducer: (_l, r) => r,
  }),
  proposal: Annotation<TripProposal | null>({
    default: () => null,
    reducer: (_l, r) => r,
  }),
  proposalRef: Annotation<ProposalRef | null>({
    default: () => null,
    reducer: (_l, r) => r,
  }),
  agentTrace: Annotation<AgentTraceSummary>({
    default: () => ({ agents: [], totalDurationMs: 0 }),
    reducer: (_l, r) => r,
  }),
  /**
   * Hard termination - set when a node has already emitted turn.failed.
   * Skip everything downstream including the complete node (no turn.completed).
   */
  hardEnded: Annotation<boolean>({
    default: () => false,
    reducer: (l, r) => l || r,
  }),
  /**
   * Soft termination - set on empty-search. Skip compose/mood/memory but
   * still run complete (which emits turn.completed + persists).
   */
  softEnded: Annotation<boolean>({
    default: () => false,
    reducer: (l, r) => l || r,
  }),
  /** Wall-clock ms when bootstrap ran - basis for turn duration. */
  turnStartedAt: Annotation<number>({
    default: () => 0,
    reducer: (_l, r) => r,
  }),
  /** Slice F1 - route decision computed after intent extraction.
   *  When `kind === 'opportunity'`, the graph branches into the
   *  opportunity node instead of running search/compose/mood/hint. */
  route: Annotation<RouteDecision | null>({
    default: () => null,
    reducer: (_l, r) => r,
  }),
  /** Slice C1 - retrieval result, populated by the bootstrap node when
   *  a memory retriever is wired. The intent node threads it into the
   *  prompt; the memory_hint node uses it to decide whether to fire
   *  the retrieval-driven hint vs. the heuristic. */
  retrievedMemories: Annotation<RetrievedMemories | null>({
    default: () => null,
    reducer: (_l, r) => r,
  }),
});

export type GraphState = typeof GraphAnnotation.State;
export type GraphUpdate = typeof GraphAnnotation.Update;

/**
 * RuntimeContext - non-state runtime concerns flowing alongside the
 * graph via the LangGraph config.configurable bag. Held by reference, so
 * each node sees the same emit/signal as the runner.
 */
export interface RuntimeContext {
  emit: (event: OrchestratorEvent) => void;
  signal: AbortSignal;
}

/** Key used in config.configurable to retrieve the runtime context. */
export const RUNTIME_CONTEXT_KEY = '__stayscout_runtime' as const;
