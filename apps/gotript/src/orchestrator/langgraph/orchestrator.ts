import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { Agent, TraceLogger } from '@core/agent';
import type { ConciergeRequest } from '@core/concierge-request';
import type { ModelClient } from '@core/model-client';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { Provider } from '@core/provider';
import type { TripIntent } from '@core/trip-intent';
import type { MoodSnapshot } from '@core/reasoning';
import type { IntentAgentInput } from '@/agents/intent-agent';
import { IntentAgent } from '@/agents/intent-agent';
import type { MoodSnapshotAgentInput } from '@/agents/mood-snapshot-agent';
import { MoodSnapshotAgent } from '@/agents/mood-snapshot-agent';
import {
  DestinationFlavorAgent,
  type DestinationFlavor,
  type DestinationFlavorAgentInput,
} from '@/agents/destination-flavor-agent';
import { buildProviderRegistry, routeProvider } from '@/providers';
import { routeForIntent, type RouteDecision } from '../route-search';
import { NoOpTraceLogger } from '@lib/observability/trace-logger';
import { MemoryHinter } from '@lib/memory-hinter';
import { InMemorySessionStore, type SessionStore } from '@lib/session';
import type { MemoryRecorder, MemoryRetriever } from '@lib/memory';
import { createEventQueue } from './event-queue';
import { buildGraph } from './graph';
import type { GraphDeps } from './nodes';
import { RUNTIME_CONTEXT_KEY, type RuntimeContext } from './state';

export interface LangGraphOrchestratorOptions {
  modelClient: ModelClient;
  traceLogger?: TraceLogger;
  intentAgent?: Agent<IntentAgentInput, TripIntent>;
  moodSnapshotAgent?: Agent<MoodSnapshotAgentInput, MoodSnapshot>;
  destinationFlavorAgent?: Agent<DestinationFlavorAgentInput, DestinationFlavor | null>;
  providerRouter?: (intent: TripIntent) => Provider;
  /** Slice F1 - decides inventory vs opportunity path. Defaults to
   *  `routeForIntent` over the global provider registry. */
  routeDecider?: (intent: TripIntent) => RouteDecision;
  sessionStore?: SessionStore;
  /** Optional LangGraph checkpoint saver. MemorySaver if omitted. */
  checkpointer?: BaseCheckpointSaver;
  /** Slice C1 - optional memory subsystem. Same opt-in shape as the
   *  legacy Orchestrator. */
  memoryRecorder?: MemoryRecorder;
  memoryRetriever?: MemoryRetriever;
}

/**
 * LangGraph-driven orchestrator. Same `run()` shape as the legacy
 * `Orchestrator` class - `(req, ctx) → AsyncIterable<OrchestratorEvent>`
 * - so consumers (route handler, tests) don't change.
 *
 * Internally:
 *   1. A typed event queue captures events emitted by graph nodes.
 *   2. The compiled graph is invoked with `{request: req}` initial state
 *      and a RuntimeContext (emit, signal) plumbed through configurable.
 *   3. The runner returns the queue's async iterable; the consumer pumps
 *      it. When the graph invocation resolves, the queue is closed.
 *      Errors close the queue with the error so iteration re-throws.
 *
 * Stateful helpers (seenSessions, seenTurnIds, hinterBySession) live on
 * this class and are passed to the graph via closure (`GraphDeps`).
 * They survive across turns within the same instance, matching the
 * legacy orchestrator's semantics.
 */
export class LangGraphOrchestrator {
  private readonly seenSessions = new Set<string>();
  private readonly seenTurnIds = new Set<string>();
  private readonly hinterBySession = new Map<string, MemoryHinter>();
  private readonly compiledGraph: ReturnType<typeof buildGraph>;

  constructor(opts: LangGraphOrchestratorOptions) {
    const sessionStore = opts.sessionStore ?? new InMemorySessionStore();
    const modelClient = opts.modelClient;
    const deps: GraphDeps = {
      modelClient,
      traceLogger: opts.traceLogger ?? NoOpTraceLogger,
      intentAgent: opts.intentAgent ?? IntentAgent,
      moodSnapshotAgent: opts.moodSnapshotAgent ?? MoodSnapshotAgent,
      destinationFlavorAgent: opts.destinationFlavorAgent ?? DestinationFlavorAgent,
      providerRouter: opts.providerRouter ?? routeProvider,
      routeDecider:
        opts.routeDecider ??
        ((intent) => {
          const reg = buildProviderRegistry(modelClient);
          return routeForIntent(intent, { real: reg.real });
        }),
      sessionStore,
      getHinter: (sid) => this.getHinter(sid),
      hasSeenSession: (sid) => this.seenSessions.has(sid),
      markSessionSeen: (sid) => {
        this.seenSessions.add(sid);
      },
      hasSeenTurn: (tid) => this.seenTurnIds.has(tid),
      markTurnSeen: (tid) => {
        this.seenTurnIds.add(tid);
      },
      memoryRecorder: opts.memoryRecorder ?? null,
      memoryRetriever: opts.memoryRetriever ?? null,
    };
    this.compiledGraph = buildGraph(deps, opts.checkpointer);
  }

  private getHinter(sessionId: string): MemoryHinter {
    let h = this.hinterBySession.get(sessionId);
    if (!h) {
      h = new MemoryHinter();
      this.hinterBySession.set(sessionId, h);
    }
    return h;
  }

  run(req: ConciergeRequest, ctx: { signal: AbortSignal }): AsyncIterable<OrchestratorEvent> {
    const queue = createEventQueue<OrchestratorEvent>();
    const runtime: RuntimeContext = {
      emit: (event) => queue.emit(event),
      signal: ctx.signal,
    };

    // Run invocation in the background; surface result via queue close.
    void this.compiledGraph
      .invoke(
        { request: req },
        {
          configurable: {
            // thread_id is required when a checkpointer is configured.
            // Use sessionId so multiple turns of the same session share
            // a thread (B3 will resurface saved-trip state via thread).
            thread_id: req.sessionId,
            [RUNTIME_CONTEXT_KEY]: runtime,
          },
          signal: ctx.signal,
        },
      )
      .then(() => {
        queue.close();
      })
      .catch((err: unknown) => {
        // If the graph threw before nodes had a chance to emit
        // turn.failed, surface a synthetic one so the consumer's stream
        // ends with a proper failure event (mirrors legacy behavior).
        if (err instanceof DOMException && err.name === 'AbortError') {
          queue.emit({
            kind: 'turn.failed',
            turnId: req.turnId,
            error: 'cancelled',
            recoverable: true,
          });
        } else {
          queue.emit({
            kind: 'turn.failed',
            turnId: req.turnId,
            error: err instanceof Error ? err.message : String(err),
            recoverable: false,
          });
        }
        queue.close();
      });

    return queue.iterate();
  }
}
