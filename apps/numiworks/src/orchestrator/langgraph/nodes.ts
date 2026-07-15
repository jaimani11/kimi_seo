import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { Agent, AgentContext, TraceLogger } from '@core/agent';
import type { ConciergeRequest } from '@core/concierge-request';
import { stepId, turnId as turnIdBrand } from '@core/ids';
import type { ModelClient } from '@core/model-client';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { Provider, ProviderContext, ProviderSearchQuery } from '@core/provider';
import type { Destination, TripIntent } from '@core/trip-intent';
import type { AgentTraceSummary } from '@core/trip-proposal';
import type { MoodSnapshot } from '@core/reasoning';
import type { IntentAgentInput } from '@/agents/intent-agent';
import type { MoodSnapshotAgentInput } from '@/agents/mood-snapshot-agent';
import type {
  DestinationFlavor,
  DestinationFlavorAgentInput,
} from '@/agents/destination-flavor-agent';
import type { MemoryHinter } from '@lib/memory-hinter';
import type { MemoryRecorder, MemoryRetriever, RetrievedMemories } from '@lib/memory';
import type { SessionStore } from '@lib/session/session-store';
import { buildSearchOpportunity } from '@lib/affiliate/search-opportunity-builder';
import { viatorProviderFromEnv } from '@/providers/viator';
import { computeIntentDelta } from '../intent-delta';
import { buildTripStateSnapshot } from '@lib/concierge/trip-state';
import { computeProposalDiff } from '../proposal-diff';
import { buildProposal, buildProposalRef } from '../proposal-builder';
import type { RouteDecision } from '../route-search';
import { extractDestinationFallback } from '../extract-destination-fallback';
import { synthesizeAdaptationNotes } from '../synthesize-adaptation';
import {
  RUNTIME_CONTEXT_KEY,
  type GraphState,
  type GraphUpdate,
  type RuntimeContext,
} from './state';

/**
 * Per-Orchestrator dependencies the graph nodes need. Held in closure
 * by buildGraph(); the same compiled graph is reused across invocations.
 * Stateful helpers (getHinter, hasSeenSession, ...) are backed by the
 * Orchestrator instance's Maps so they survive across turns.
 */
export interface GraphDeps {
  modelClient: ModelClient;
  traceLogger: TraceLogger;
  intentAgent: Agent<IntentAgentInput, TripIntent>;
  moodSnapshotAgent: Agent<MoodSnapshotAgentInput, MoodSnapshot>;
  destinationFlavorAgent: Agent<DestinationFlavorAgentInput, DestinationFlavor | null>;
  providerRouter: (intent: TripIntent) => Provider;
  /** Slice F1 - route decision after intent extraction. */
  routeDecider: (intent: TripIntent) => RouteDecision;
  sessionStore: SessionStore;
  getHinter: (sessionId: string) => MemoryHinter;
  hasSeenSession: (sessionId: string) => boolean;
  markSessionSeen: (sessionId: string) => void;
  hasSeenTurn: (turnId: string) => boolean;
  markTurnSeen: (turnId: string) => void;
  /** Slice C1 - optional memory subsystem. Same opt-in shape as the
   *  legacy Orchestrator: when null, the graph uses only the in-session
   *  MemoryHinter. When supplied, retrieval runs before intent + the
   *  recorder fires after turn.completed. */
  memoryRecorder: MemoryRecorder | null;
  memoryRetriever: MemoryRetriever | null;
}

function readRuntime(config: LangGraphRunnableConfig): RuntimeContext {
  const ctx = config.configurable?.[RUNTIME_CONTEXT_KEY] as RuntimeContext | undefined;
  if (!ctx) {
    throw new Error('LangGraph node missing RuntimeContext - runner did not wire emit/signal');
  }
  return ctx;
}

function buildAgentContext(
  req: ConciergeRequest,
  signal: AbortSignal,
  deps: GraphDeps,
): AgentContext {
  return {
    turnId: turnIdBrand(req.turnId),
    signal,
    emit: { progress: () => {}, explanation: () => {} },
    modelClient: deps.modelClient,
    traceLogger: deps.traceLogger,
  };
}

function buildProviderQuery(intent: TripIntent, req: ConciergeRequest): ProviderSearchQuery {
  return {
    destinations: intent.destinations,
    dates: intent.dates,
    travelers: intent.travelers,
    ...(intent.budget.kind !== 'unspecified' ? { budget: intent.budget } : {}),
    preferences: intent.preferences,
    ...(req.input.compareSet ? { compareSet: req.input.compareSet } : {}),
  };
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function failStepEvent(turnId: string, sId: string, err: unknown): OrchestratorEvent {
  return {
    kind: 'agent.step.failed',
    turnId,
    stepId: sId,
    error: errorMessage(err),
    recoverable: false,
  };
}

function failTurnEvent(turnId: string, err: unknown, recoverable: boolean): OrchestratorEvent {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { kind: 'turn.failed', turnId, error: 'cancelled', recoverable: true };
  }
  return { kind: 'turn.failed', turnId, error: errorMessage(err), recoverable };
}

// ============== Bootstrap ==============

export function makeBootstrapNode(deps: GraphDeps) {
  return async (state: GraphState, config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit } = readRuntime(config);
    const req = state.request;
    const turnStartedAt = performance.now();

    if (deps.hasSeenTurn(req.turnId)) {
      emit({
        kind: 'turn.failed',
        turnId: req.turnId,
        error: 'duplicate turnId',
        recoverable: false,
      });
      return { hardEnded: true, turnStartedAt };
    }
    deps.markTurnSeen(req.turnId);

    if (!deps.hasSeenSession(req.sessionId)) {
      deps.markSessionSeen(req.sessionId);
      emit({
        kind: 'session.started',
        sessionId: req.sessionId,
        timestamp: Date.now(),
      });
    }

    const priorTurn = req.input.priorProposalRef
      ? await deps.sessionStore.getTurn(req.input.priorProposalRef.turnId)
      : null;

    emit({
      kind: 'turn.started',
      turnId: req.turnId,
      type: req.type,
      ...(priorTurn ? { priorTurnId: priorTurn.turnId } : {}),
    });

    // Slice C1: pre-intent memory retrieval. Failures are logged + the
    // turn proceeds without retrieved memories.
    let retrievedMemories: RetrievedMemories | null = null;
    if (deps.memoryRetriever) {
      try {
        retrievedMemories = await deps.memoryRetriever.searchForTurn({
          rawInput: req.input.rawInput,
          owner: { ownerKind: 'session', ownerId: req.sessionId },
        });
      } catch (err) {
        console.warn('[langgraph] memory retrieval failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { priorTurn, turnStartedAt, retrievedMemories };
  };
}

// ============== Intent ==============

export function makeIntentNode(deps: GraphDeps) {
  return async (state: GraphState, config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit, signal } = readRuntime(config);
    const req = state.request;
    const intentStepId = stepId(`${req.turnId}-intent`);

    emit({
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: intentStepId,
      agentId: 'intent',
      label: req.type === 'refine' ? 'Adjusting your trip' : 'Reading your trip',
    });

    const startedAt = performance.now();
    let intent: TripIntent;
    try {
      const agentCtx = buildAgentContext(req, signal, deps);
      const agentInput: IntentAgentInput = {
        rawInput: req.input.rawInput,
        ...(state.priorTurn?.intent ? { priorIntent: state.priorTurn.intent } : {}),
        ...(state.retrievedMemories?.promptBlock
          ? { priorMemoryBlock: state.retrievedMemories.promptBlock }
          : {}),
      };
      intent = await deps.intentAgent.run(agentInput, agentCtx);
    } catch (err) {
      emit(failStepEvent(req.turnId, intentStepId, err));
      emit(failTurnEvent(req.turnId, err, false));
      return { hardEnded: true };
    }
    const durationMs = Math.round(performance.now() - startedAt);

    const agentTrace: AgentTraceSummary = {
      agents: [...state.agentTrace.agents, { id: 'intent', durationMs }],
      totalDurationMs: state.agentTrace.totalDurationMs,
    };

    emit({
      kind: 'agent.step.completed',
      turnId: req.turnId,
      stepId: intentStepId,
      durationMs,
    });

    if (req.type === 'refine' && state.priorTurn?.intent) {
      emit({
        kind: 'intent.refined',
        turnId: req.turnId,
        intent,
        delta: computeIntentDelta(state.priorTurn.intent, intent),
      });
    } else {
      emit({ kind: 'intent.extracted', turnId: req.turnId, intent });
    }

    // Phase B — trip-state snapshot (parity with the hand-rolled orchestrator).
    emit({
      kind: 'concierge.trip_state',
      turnId: req.turnId,
      ...buildTripStateSnapshot(intent, req.type === 'refine' ? state.priorTurn?.intent : undefined),
    });

    // Recover a destination by keyword-matching the raw input when
    // the IntentAgent returned an empty destinations array (terse
    // prompts like "Austria ski trip for 6 people" sometimes trip
    // the model). Mirrors the same fallback in the hand-rolled
    // orchestrator so both engines behave identically.
    let resolvedIntent = intent;
    if (resolvedIntent.destinations.length === 0) {
      const fallback = extractDestinationFallback(req.input.rawInput);
      if (fallback) {
        resolvedIntent = {
          ...resolvedIntent,
          destinations: [
            {
              kind: 'synthesized',
              name: fallback.name,
              country: fallback.country,
            },
          ],
        };
      }
    }

    // Slice F1 - compute the route decision here so `routeAfterIntent`
    // (a pure router function) can branch without re-running deciders.
    const route = deps.routeDecider(resolvedIntent);
    return { intent: resolvedIntent, agentTrace, route };
  };
}

// ============== Opportunity (F1) ==============

/**
 * Slice F1 - opportunity branch node.
 *
 * Runs when the route decider returns `{ kind: 'opportunity', ... }`.
 * Best-effort calls DestinationFlavorAgent (decorative; never fails the
 * turn), then builds + emits a SearchOpportunity. Skips search/compose/
 * mood/memory-hint - those are tied to real inventory.
 *
 * Persistence is handled by the complete node (it already persists when
 * `state.intent` is set, with optional `proposal`).
 */
export function makeOpportunityNode(deps: GraphDeps) {
  return async (state: GraphState, config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit, signal } = readRuntime(config);
    if (!state.intent) return {};
    const req = state.request;
    const intent = state.intent;
    const dest: Destination | undefined = intent.destinations[0];

    // Defensive: routeDecider should only route here with a destination.
    if (!dest) {
      emit({
        kind: 'concierge.message',
        turnId: req.turnId,
        message: "*Tell me where you'd like to go - a city, region, or country.*",
        tone: 'apologize',
      });
      return { softEnded: true };
    }

    const flavorStepId = stepId(`${req.turnId}-flavor`);
    emit({
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: flavorStepId,
      agentId: 'destination-flavor',
      label: `Reading the feel of ${dest.name}`,
    });

    const startedAt = performance.now();
    let flavor: DestinationFlavor | null = null;
    try {
      const agentCtx = buildAgentContext(req, signal, deps);
      flavor = await deps.destinationFlavorAgent.run(
        {
          destination: dest,
          vibeTags: intent.vibe.tags,
          travelers: {
            adults: intent.travelers.adults,
            children: intent.travelers.children.count,
          },
        },
        agentCtx,
      );
    } catch (err) {
      // Decorative - never fails the turn.
      console.warn('[langgraph] destination flavor threw', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    const durationMs = Math.round(performance.now() - startedAt);
    const agentTrace: AgentTraceSummary = {
      agents: [...state.agentTrace.agents, { id: 'destination-flavor', durationMs }],
      totalDurationMs: state.agentTrace.totalDurationMs,
    };
    emit({
      kind: 'agent.step.completed',
      turnId: req.turnId,
      stepId: flavorStepId,
      durationMs,
    });

    // Pass the live Viator provider so the builder can use Viator's
    // API-returned productUrls (pid baked in by Viator server-side
    // via campaign-value). Without the provider the builder falls
    // back to the manually-constructed search URL.
    const opportunity = await buildSearchOpportunity({
      intent,
      ...(flavor?.text ? { flavor: flavor.text } : {}),
      viatorProvider: viatorProviderFromEnv(),
      signal,
    });
    emit({
      kind: 'search.opportunity.ready',
      turnId: req.turnId,
      opportunity,
    });

    // softEnded → graph skips mood + hint, still runs complete (which
    // emits turn.completed + persists the intent).
    return { agentTrace, softEnded: true };
  };
}

// ============== Search ==============

export function makeSearchNode(deps: GraphDeps) {
  return async (state: GraphState, config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit, signal } = readRuntime(config);
    if (!state.intent) return {};
    const req = state.request;
    const intent = state.intent;
    const provider = deps.providerRouter(intent);
    const searchStepId = stepId(`${req.turnId}-search`);

    emit({
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: searchStepId,
      agentId: 'search',
      label: `Searching ${provider.displayName}`,
    });

    const startedAt = performance.now();
    let searchResult;
    try {
      const providerCtx: ProviderContext = { signal, secrets: {} };
      searchResult = await provider.search(buildProviderQuery(intent, req), providerCtx);
    } catch (err) {
      emit(failStepEvent(req.turnId, searchStepId, err));
      emit(failTurnEvent(req.turnId, err, false));
      return { hardEnded: true };
    }
    const durationMs = Math.round(performance.now() - startedAt);

    const agentTrace: AgentTraceSummary = {
      agents: [...state.agentTrace.agents, { id: 'search', durationMs }],
      totalDurationMs: state.agentTrace.totalDurationMs,
    };

    emit({
      kind: 'provider.search.completed',
      turnId: req.turnId,
      providerId: provider.id,
      staysFound: searchResult.stays.length,
      badges: searchResult.badges,
      freshness: searchResult.freshness,
    });
    emit({
      kind: 'agent.step.completed',
      turnId: req.turnId,
      stepId: searchStepId,
      durationMs,
    });

    if (searchResult.stays.length === 0) {
      emit({
        kind: 'concierge.message',
        turnId: req.turnId,
        message: "*Couldn't find anything that fits - try broadening the dates?*",
        tone: 'apologize',
      });
      return { searchResult, agentTrace, softEnded: true };
    }

    return { searchResult, agentTrace };
  };
}

// ============== Compose / Refine ==============

export function makeComposeNode(_deps: GraphDeps) {
  return async (state: GraphState, config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit } = readRuntime(config);
    if (!state.intent || !state.searchResult) return {};
    const req = state.request;

    const totalSoFar = Math.round(performance.now() - state.turnStartedAt);
    const agentTrace: AgentTraceSummary = {
      agents: state.agentTrace.agents,
      totalDurationMs: totalSoFar,
    };
    const proposal = buildProposal({
      intent: state.intent,
      stays: state.searchResult.stays,
      agentTrace,
    });
    const proposalRef = buildProposalRef(proposal, req.turnId);

    if (req.type === 'refine' && state.priorTurn?.proposal) {
      emit({
        kind: 'proposal.refining',
        turnId: req.turnId,
        priorProposalRef: buildProposalRef(state.priorTurn.proposal, state.priorTurn.turnId),
      });
      const synthDelta = computeIntentDelta(state.priorTurn.intent, state.intent);
      const notes = synthesizeAdaptationNotes(synthDelta);
      if (notes.length > 0) {
        emit({ kind: 'proposal.adaptation', turnId: req.turnId, notes });
      }
      emit({
        kind: 'proposal.evolved',
        turnId: req.turnId,
        proposal,
        diff: computeProposalDiff(state.priorTurn.proposal, proposal),
      });
    } else {
      emit({
        kind: 'proposal.shimmering',
        turnId: req.turnId,
        expectedCount: 1 + proposal.alternatives.length,
      });
      emit({ kind: 'proposal.ready', turnId: req.turnId, proposal });
    }

    emit({
      kind: 'proposal.bookmarkable',
      turnId: req.turnId,
      ref: proposalRef,
      storage: 'session',
    });

    emit({
      kind: 'concierge.message',
      turnId: req.turnId,
      message: proposal.reasoning.summary,
      ...(req.type === 'refine' ? { tone: 'narrate' as const } : {}),
    });

    return { proposal, proposalRef, agentTrace };
  };
}

// ============== Mood (post-proposal, non-blocking) ==============

export function makeMoodNode(deps: GraphDeps) {
  return async (state: GraphState, config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit, signal } = readRuntime(config);
    if (!state.proposal || !state.intent) return {};

    const dest: Destination | undefined = state.intent.destinations[0];
    if (!dest) return {};

    const req = state.request;
    const moodStepId = stepId(`${req.turnId}-mood`);
    emit({
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: moodStepId,
      agentId: 'mood',
      label: 'Composing the vibe',
    });

    const startedAt = performance.now();
    try {
      const agentCtx = buildAgentContext(req, signal, deps);
      const snapshot = await deps.moodSnapshotAgent.run({ destination: dest }, agentCtx);
      const durationMs = Math.round(performance.now() - startedAt);
      emit({
        kind: 'agent.step.completed',
        turnId: req.turnId,
        stepId: moodStepId,
        durationMs,
      });
      // Defense-in-depth: skip emission when text is empty (rare LLM
      // edge; curated paths always produce text). Avoids blank mood
      // chrome in the UI.
      if (snapshot.text.trim().length > 0) {
        emit({
          kind: 'mood.snapshot.ready',
          turnId: req.turnId,
          destinationName: snapshot.destinationName,
          snapshot,
        });
      }
    } catch (err) {
      emit({
        kind: 'agent.step.failed',
        turnId: req.turnId,
        stepId: moodStepId,
        error: errorMessage(err),
        recoverable: true,
      });
    }
    return {};
  };
}

// ============== Memory hint ==============

export function makeMemoryHintNode(deps: GraphDeps) {
  return async (state: GraphState, _config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit } = readRuntime(_config);
    if (!state.intent || !state.proposal) return {};
    const req = state.request;

    // Slice C1: retrieval-driven hint takes precedence over the
    // in-session heuristic. Only one hint fires per turn (the workspace
    // renders a single slot).
    if (state.retrievedMemories && state.retrievedMemories.entries.length > 0) {
      const top = state.retrievedMemories.entries[0]!;
      emit({
        kind: 'concierge.memory.hint',
        turnId: req.turnId,
        message: `Remembered from earlier - ${top.content}`,
        signalKey: 'memory-retrieval',
        confidence: clampUnit(top.score),
      });
      return {};
    }

    const hinter = deps.getHinter(req.sessionId);
    hinter.observeTurn({ intent: state.intent });
    const hint = hinter.evaluate();
    if (hint) {
      hinter.markFired();
      emit({
        kind: 'concierge.memory.hint',
        turnId: req.turnId,
        message: hint.message,
        signalKey: hint.signalKey,
        confidence: hint.confidence,
      });
    }
    return {};
  };
}

function clampUnit(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// ============== Complete + persist ==============

export function makeCompleteNode(deps: GraphDeps) {
  return async (state: GraphState, config: LangGraphRunnableConfig): Promise<GraphUpdate> => {
    const { emit } = readRuntime(config);
    const req = state.request;
    const durationMs = Math.round(performance.now() - state.turnStartedAt);

    emit({
      kind: 'turn.completed',
      turnId: req.turnId,
      durationMs,
    });

    if (state.intent) {
      await deps.sessionStore.putTurn({
        turnId: req.turnId,
        sessionId: req.sessionId,
        type: req.type,
        rawInput: req.input.rawInput,
        intent: state.intent,
        ...(state.proposal ? { proposal: state.proposal } : {}),
        durationMs,
        completedAt: Date.now(),
      });

      // Slice C1 - record memories asynchronously. Recorder catches
      // its own failures internally; never blocks the user.
      if (deps.memoryRecorder) {
        void deps.memoryRecorder.observeTurn({
          turnId: req.turnId,
          owner: { ownerKind: 'session', ownerId: req.sessionId },
          intent: state.intent,
          rawInput: req.input.rawInput,
        });
      }
    }
    return {};
  };
}

// ============== Routers ==============
// Routers return abstract keys ('next', 'end', ...) that the graph maps
// to actual node names - keeps node renames isolated from this file.

export function routeAfterBootstrap(state: GraphState): 'next' | 'end' {
  return state.hardEnded ? 'end' : 'next';
}

export function routeAfterIntent(state: GraphState): 'search' | 'opportunity' | 'end' {
  if (state.hardEnded) return 'end';
  if (state.route?.kind === 'opportunity') return 'opportunity';
  return 'search';
}

export function routeAfterSearch(state: GraphState): 'compose' | 'complete' | 'end' {
  if (state.hardEnded) return 'end';
  if (state.softEnded) return 'complete';
  return 'compose';
}
