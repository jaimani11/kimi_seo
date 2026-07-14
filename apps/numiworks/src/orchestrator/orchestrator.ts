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
import { IntentAgent } from '@/agents/intent-agent';
import type { MoodSnapshotAgentInput } from '@/agents/mood-snapshot-agent';
import { MoodSnapshotAgent } from '@/agents/mood-snapshot-agent';
import {
  DestinationFlavorAgent,
  type DestinationFlavor,
  type DestinationFlavorAgentInput,
} from '@/agents/destination-flavor-agent';
import { buildProviderRegistry, routeProvider } from '@/providers';
import { redactPiiText } from '@lib/privacy/redact-pii';
import { NoOpTraceLogger } from '@lib/observability/trace-logger';
import { MemoryHinter } from '@lib/memory-hinter';
import { InMemorySessionStore, type SessionStore } from '@lib/session';
import type { MemoryRecorder, MemoryRetriever, RetrievedMemories } from '@lib/memory';
import { buildSearchOpportunity } from '@lib/affiliate/search-opportunity-builder';
import { viatorProviderFromEnv } from '@/providers/viator';
import { computeIntentDelta } from './intent-delta';
import { computeProposalDiff } from './proposal-diff';
import { buildProposal, buildProposalRef } from './proposal-builder';
import { routeForIntent, type RouteDecision } from './route-search';
import { extractDestinationFallback } from './extract-destination-fallback';
import { synthesizeAdaptationNotes } from './synthesize-adaptation';

export interface OrchestratorOptions {
  modelClient: ModelClient;
  traceLogger?: TraceLogger;
  intentAgent?: Agent<IntentAgentInput, TripIntent>;
  moodSnapshotAgent?: Agent<MoodSnapshotAgentInput, MoodSnapshot>;
  destinationFlavorAgent?: Agent<DestinationFlavorAgentInput, DestinationFlavor | null>;
  providerRouter?: (intent: TripIntent) => Provider;
  /** Slice F1 - decides between real inventory path and SearchOpportunity
   *  path. Defaults to `routeForIntent` over the global provider registry.
   *  Override for tests that want to pin the route. */
  routeDecider?: (intent: TripIntent) => RouteDecision;
  /**
   * Persistence boundary. Defaults to a per-Orchestrator
   * InMemorySessionStore so unit tests don't need to wire up a store -
   * production passes the singleton from `@lib/session/factory`.
   */
  sessionStore?: SessionStore;
  /**
   * Slice C1 - optional memory subsystem. When provided, the
   * orchestrator records memories on completed turns + retrieves them
   * before intent extraction. Default: none (no memory). Tests don't
   * need to wire this up.
   */
  memoryRecorder?: MemoryRecorder;
  memoryRetriever?: MemoryRetriever;
}

/**
 * Walks the agent graph for a turn and emits a typed event stream. Slice A
 * graph is sequential - Intent → Provider.search → buildProposal. Slice B
 * replaces this class with a LangGraph.js graph; the emitted event shape
 * stays identical so consumers don't change.
 */
export class Orchestrator {
  private readonly modelClient: ModelClient;
  private readonly traceLogger: TraceLogger;
  private readonly intentAgent: Agent<IntentAgentInput, TripIntent>;
  private readonly moodSnapshotAgent: Agent<MoodSnapshotAgentInput, MoodSnapshot>;
  private readonly destinationFlavorAgent: Agent<
    DestinationFlavorAgentInput,
    DestinationFlavor | null
  >;
  private readonly providerRouter: (intent: TripIntent) => Provider;
  private readonly routeDecider: (intent: TripIntent) => RouteDecision;
  private readonly sessionStore: SessionStore;
  private readonly memoryRecorder: MemoryRecorder | null;
  private readonly memoryRetriever: MemoryRetriever | null;
  private readonly seenSessions = new Set<string>();
  private readonly seenTurnIds = new Set<string>();
  // One MemoryHinter per session - keyed by sessionId, lazy-init.
  private readonly hinterBySession = new Map<string, MemoryHinter>();

  constructor(opts: OrchestratorOptions) {
    this.modelClient = opts.modelClient;
    this.traceLogger = opts.traceLogger ?? NoOpTraceLogger;
    this.intentAgent = opts.intentAgent ?? IntentAgent;
    this.moodSnapshotAgent = opts.moodSnapshotAgent ?? MoodSnapshotAgent;
    this.destinationFlavorAgent = opts.destinationFlavorAgent ?? DestinationFlavorAgent;
    this.providerRouter = opts.providerRouter ?? routeProvider;
    this.routeDecider =
      opts.routeDecider ??
      ((intent) => {
        const reg = buildProviderRegistry(this.modelClient);
        return routeForIntent(intent, { real: reg.real });
      });
    this.sessionStore = opts.sessionStore ?? new InMemorySessionStore();
    this.memoryRecorder = opts.memoryRecorder ?? null;
    this.memoryRetriever = opts.memoryRetriever ?? null;
  }

  private getHinter(sessionId: string): MemoryHinter {
    let h = this.hinterBySession.get(sessionId);
    if (!h) {
      h = new MemoryHinter();
      this.hinterBySession.set(sessionId, h);
    }
    return h;
  }

  async *run(
    req: ConciergeRequest,
    ctx: { signal: AbortSignal },
  ): AsyncIterable<OrchestratorEvent> {
    const turnStartedAt = performance.now();

    // Idempotency guard (spec §6.6) - same turnId twice = early exit.
    if (this.seenTurnIds.has(req.turnId)) {
      yield {
        kind: 'turn.failed',
        turnId: req.turnId,
        error: 'duplicate turnId',
        recoverable: false,
      };
      return;
    }
    this.seenTurnIds.add(req.turnId);

    // First turn of session → emit session.started.
    if (!this.seenSessions.has(req.sessionId)) {
      this.seenSessions.add(req.sessionId);
      yield {
        kind: 'session.started',
        sessionId: req.sessionId,
        timestamp: Date.now(),
      };
    }

    const priorTurn = req.input.priorProposalRef
      ? await this.sessionStore.getTurn(req.input.priorProposalRef.turnId)
      : null;

    yield {
      kind: 'turn.started',
      turnId: req.turnId,
      type: req.type,
      ...(priorTurn ? { priorTurnId: priorTurn.turnId } : {}),
    };

    const agentTrace: AgentTraceSummary = { agents: [], totalDurationMs: 0 };

    // ============== Step 1 - Intent ==============
    const intentStepId = stepId(`${req.turnId}-intent`);
    yield {
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: intentStepId,
      agentId: 'intent',
      label: req.type === 'refine' ? 'Adjusting your trip' : 'Reading your trip',
    };

    // Slice C1: retrieve relevant prior memories before intent
    // extraction. The owner-key mirrors trip ownership (sessionId for
    // anonymous; userId for authenticated, surfaced via auth in route).
    // Failures here NEVER block the intent step - fall through with
    // null + log.
    const memoryOwner = { ownerKind: 'session' as const, ownerId: req.sessionId };
    let retrievedMemories: RetrievedMemories | null = null;
    if (this.memoryRetriever) {
      try {
        retrievedMemories = await this.memoryRetriever.searchForTurn({
          rawInput: req.input.rawInput,
          owner: memoryOwner,
        });
      } catch (err) {
        console.warn('[orchestrator] memory retrieval failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const intentStartedAt = performance.now();
    let intent: TripIntent;
    try {
      const agentCtx = this.buildAgentContext(req, ctx.signal);
      const agentInput: IntentAgentInput = {
        rawInput: req.input.rawInput,
        ...(priorTurn?.intent ? { priorIntent: priorTurn.intent } : {}),
        ...(retrievedMemories?.promptBlock
          ? { priorMemoryBlock: retrievedMemories.promptBlock }
          : {}),
      };
      intent = await this.intentAgent.run(agentInput, agentCtx);
    } catch (err) {
      yield this.failStep(req.turnId, intentStepId, err);
      yield this.failTurn(req.turnId, err, false);
      return;
    }
    const intentDurationMs = Math.round(performance.now() - intentStartedAt);
    agentTrace.agents.push({ id: 'intent', durationMs: intentDurationMs });

    yield {
      kind: 'agent.step.completed',
      turnId: req.turnId,
      stepId: intentStepId,
      durationMs: intentDurationMs,
    };

    if (req.type === 'refine' && priorTurn?.intent) {
      yield {
        kind: 'intent.refined',
        turnId: req.turnId,
        intent,
        delta: computeIntentDelta(priorTurn.intent, intent),
      };
    } else {
      yield { kind: 'intent.extracted', turnId: req.turnId, intent };
    }

    // ============== Step 1.5 - Route decision (F1) ==============
    // Decide between real-inventory path (existing) and SearchOpportunity
    // path (new). Opportunity short-circuits the proposal flow: we emit
    // `search.opportunity.ready` + complete the turn. No fake hotels.

    // Defensive: the IntentAgent occasionally returns an intent with an
    // empty destinations array (e.g. for terse prompts like "Austria
    // ski trip for 6 people" where the model can't pick a single city).
    // Try a keyword-based fallback against our known cities + countries
    // before we route - this saves the user a "tell me where" bounce.
    if (intent.destinations.length === 0) {
      const fallback = extractDestinationFallback(req.input.rawInput);
      if (fallback) {
        intent = {
          ...intent,
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

    const route = this.routeDecider(intent);
    if (route.kind === 'opportunity') {
      yield* this.runOpportunityBranch(req, ctx.signal, intent, agentTrace, turnStartedAt);
      return;
    }

    // ============== Step 2 - Provider search ==============
    const provider = this.providerRouter(intent);
    const searchStepId = stepId(`${req.turnId}-search`);
    yield {
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: searchStepId,
      agentId: 'search',
      label: `Searching ${provider.displayName}`,
    };

    const searchStartedAt = performance.now();
    let searchResult;
    try {
      const providerCtx: ProviderContext = { signal: ctx.signal, secrets: {} };
      const query = this.buildProviderQuery(intent, req);
      searchResult = await provider.search(query, providerCtx);
    } catch (err) {
      yield this.failStep(req.turnId, searchStepId, err);
      yield this.failTurn(req.turnId, err, false);
      return;
    }
    const searchDurationMs = Math.round(performance.now() - searchStartedAt);
    agentTrace.agents.push({ id: 'search', durationMs: searchDurationMs });

    yield {
      kind: 'provider.search.completed',
      turnId: req.turnId,
      providerId: provider.id,
      staysFound: searchResult.stays.length,
      badges: searchResult.badges,
      freshness: searchResult.freshness,
    };
    yield {
      kind: 'agent.step.completed',
      turnId: req.turnId,
      stepId: searchStepId,
      durationMs: searchDurationMs,
    };

    if (searchResult.stays.length === 0) {
      yield {
        kind: 'concierge.message',
        turnId: req.turnId,
        message: "*Couldn't find anything that fits - try broadening the dates?*",
        tone: 'apologize',
      };
      yield {
        kind: 'turn.completed',
        turnId: req.turnId,
        durationMs: Math.round(performance.now() - turnStartedAt),
      };
      return;
    }

    // ============== Step 3 - Compose proposal ==============
    // Slice A has no separate ranking agent - the provider's order is the
    // ranking. Slice B inserts RankingAgent here behind the same step id.
    agentTrace.totalDurationMs = Math.round(performance.now() - turnStartedAt);
    const proposal = buildProposal({ intent, stays: searchResult.stays, agentTrace });
    const proposalRef = buildProposalRef(proposal, req.turnId);

    if (req.type === 'refine' && priorTurn?.proposal) {
      yield {
        kind: 'proposal.refining',
        turnId: req.turnId,
        priorProposalRef: buildProposalRef(priorTurn.proposal, priorTurn.turnId),
      };
      // Slice A: synthesize adaptation notes from the IntentDelta we
      // already computed. Slice B's RankingAgent replaces this with real
      // reasoning - same wire format, banner UI unchanged.
      const synthDelta = computeIntentDelta(priorTurn.intent, intent);
      const notes = synthesizeAdaptationNotes(synthDelta);
      if (notes.length > 0) {
        yield { kind: 'proposal.adaptation', turnId: req.turnId, notes };
      }
      yield {
        kind: 'proposal.evolved',
        turnId: req.turnId,
        proposal,
        diff: computeProposalDiff(priorTurn.proposal, proposal),
      };
    } else {
      yield {
        kind: 'proposal.shimmering',
        turnId: req.turnId,
        expectedCount: 1 + proposal.alternatives.length,
      };
      yield { kind: 'proposal.ready', turnId: req.turnId, proposal };
    }

    yield {
      kind: 'proposal.bookmarkable',
      turnId: req.turnId,
      ref: proposalRef,
      storage: 'session',
    };

    yield {
      kind: 'concierge.message',
      turnId: req.turnId,
      message: proposal.reasoning.summary,
      ...(req.type === 'refine' ? { tone: 'narrate' as const } : {}),
    };

    // ============== Step 4 - Mood snapshot (post-proposal, non-blocking) ==============
    // Failures here NEVER block the turn - proposal already shipped.
    const dest = intent.destinations[0];
    if (dest) {
      yield* this.runMoodSnapshotEvents(req, dest, ctx.signal);
    }

    // ============== Memory hint ==============
    // Two sources of memory hints:
    //   1. Slice C1 retrieval: cross-session semantic recall via the
    //      MemoryRetriever (when wired). Takes precedence - surfaces
    //      a richer hint based on prior memory, even on the first
    //      turn of a new session.
    //   2. Slice A9 heuristic: the in-session MemoryHinter that
    //      accrues signal across turns. Fallback when retrieval
    //      didn't fire.
    // Only one hint fires per turn (the workspace renders one slot).
    if (retrievedMemories && retrievedMemories.entries.length > 0) {
      const top = retrievedMemories.entries[0]!;
      yield {
        kind: 'concierge.memory.hint',
        turnId: req.turnId,
        message: `Remembered from earlier - ${top.content}`,
        signalKey: 'memory-retrieval',
        confidence: clampUnit(top.score),
      };
    } else {
      const hinter = this.getHinter(req.sessionId);
      hinter.observeTurn({ intent });
      const hint = hinter.evaluate();
      if (hint) {
        hinter.markFired();
        yield {
          kind: 'concierge.memory.hint',
          turnId: req.turnId,
          message: hint.message,
          signalKey: hint.signalKey,
          confidence: hint.confidence,
        };
      }
    }

    yield {
      kind: 'turn.completed',
      turnId: req.turnId,
      durationMs: Math.round(performance.now() - turnStartedAt),
    };

    // Slice C1 - record memories AFTER turn.completed so we don't
    // block the user-visible event stream. Failures inside the
    // recorder are caught + logged there.
    if (this.memoryRecorder) {
      void this.memoryRecorder.observeTurn({
        turnId: req.turnId,
        owner: memoryOwner,
        intent,
        rawInput: req.input.rawInput,
      });
    }

    await this.sessionStore.putTurn({
      turnId: req.turnId,
      sessionId: req.sessionId,
      type: req.type,
      // Persist a PII-redacted copy — the model already ran on the raw input;
      // the stored turn is only read back for structured priorIntent + admin.
      rawInput: redactPiiText(req.input.rawInput),
      intent,
      proposal,
      durationMs: Math.round(performance.now() - turnStartedAt),
      completedAt: Date.now(),
    });
  }

  /**
   * Slice F1 - opportunity branch.
   *
   * Runs when the route decider says we don't have inventory for this
   * destination. Steps:
   *   1. DestinationFlavorAgent (best-effort, optional) - produces a
   *      one-line "feel of the place" for the hero band.
   *   2. buildSearchOpportunity - three provider search URLs prefilled
   *      with intent (dates, party, vibe).
   *   3. Emit `search.opportunity.ready`.
   *   4. Persist the turn (intent only - no proposal; F1.x will add
   *      opportunity persistence for refine analytics).
   *   5. Complete the turn.
   *
   * Mood + memory hint are deliberately skipped here - they're tied to
   * the proposal flow. The opportunity board is its own complete UX.
   */
  private async *runOpportunityBranch(
    req: ConciergeRequest,
    signal: AbortSignal,
    intent: TripIntent,
    agentTrace: AgentTraceSummary,
    turnStartedAt: number,
  ): AsyncIterable<OrchestratorEvent> {
    const dest = intent.destinations[0];

    // Defensive: routeDecider only returns opportunity with a usable
    // destination, but the type system allows `destinations` to be
    // empty. Fall back to the no-results message + complete.
    if (!dest) {
      yield {
        kind: 'concierge.message',
        turnId: req.turnId,
        message: "*Tell me where you'd like to go - a city, region, or country.*",
        tone: 'apologize',
      };
      yield {
        kind: 'turn.completed',
        turnId: req.turnId,
        durationMs: Math.round(performance.now() - turnStartedAt),
      };
      return;
    }

    // ============== Step F1.A - Destination flavor (best-effort) ==============
    const flavorStepId = stepId(`${req.turnId}-flavor`);
    yield {
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: flavorStepId,
      agentId: 'destination-flavor',
      label: `Reading the feel of ${dest.name}`,
    };

    const flavorStartedAt = performance.now();
    let flavor: DestinationFlavor | null = null;
    try {
      const agentCtx = this.buildAgentContext(req, signal);
      flavor = await this.destinationFlavorAgent.run(
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
      // Flavor is decorative - never fail the turn on its account.
      console.warn('[orchestrator] flavor agent threw', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    const flavorDurationMs = Math.round(performance.now() - flavorStartedAt);
    agentTrace.agents.push({ id: 'destination-flavor', durationMs: flavorDurationMs });
    yield {
      kind: 'agent.step.completed',
      turnId: req.turnId,
      stepId: flavorStepId,
      durationMs: flavorDurationMs,
    };

    // ============== Step F1.B - Build opportunity ==============
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

    yield {
      kind: 'search.opportunity.ready',
      turnId: req.turnId,
      opportunity,
    };

    // ============== Step F1.C - Complete ==============
    agentTrace.totalDurationMs = Math.round(performance.now() - turnStartedAt);
    yield {
      kind: 'turn.completed',
      turnId: req.turnId,
      durationMs: agentTrace.totalDurationMs,
    };

    // Persist the turn so /refine can find priorIntent. Proposal field
    // stays unset - F1.x adds opportunity-aware persistence (per plan).
    await this.sessionStore.putTurn({
      turnId: req.turnId,
      sessionId: req.sessionId,
      type: req.type,
      rawInput: redactPiiText(req.input.rawInput),
      intent,
      durationMs: agentTrace.totalDurationMs,
      completedAt: Date.now(),
    });
  }

  private async *runMoodSnapshotEvents(
    req: ConciergeRequest,
    destination: Destination,
    signal: AbortSignal,
  ): AsyncIterable<OrchestratorEvent> {
    const moodStepId = stepId(`${req.turnId}-mood`);
    yield {
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: moodStepId,
      agentId: 'mood',
      label: 'Composing the vibe',
    };

    const startedAt = performance.now();
    try {
      const agentCtx = this.buildAgentContext(req, signal);
      const snapshot = await this.moodSnapshotAgent.run({ destination }, agentCtx);
      const durationMs = Math.round(performance.now() - startedAt);
      yield {
        kind: 'agent.step.completed',
        turnId: req.turnId,
        stepId: moodStepId,
        durationMs,
      };
      // Only emit when the agent actually produced renderable text -
      // a snapshot with empty `text` reaches the UI as blank chrome.
      // Curated paths always produce text; LLM paths can occasionally
      // return empty on flaky model calls. Defense-in-depth.
      if (snapshot.text.trim().length > 0) {
        yield {
          kind: 'mood.snapshot.ready',
          turnId: req.turnId,
          destinationName: snapshot.destinationName,
          snapshot,
        };
      }
    } catch (err) {
      yield {
        kind: 'agent.step.failed',
        turnId: req.turnId,
        stepId: moodStepId,
        error: errorMessage(err),
        recoverable: true,
      };
    }
  }

  private buildAgentContext(req: ConciergeRequest, signal: AbortSignal): AgentContext {
    return {
      turnId: turnIdBrand(req.turnId),
      signal,
      emit: { progress: () => {}, explanation: () => {} },
      modelClient: this.modelClient,
      traceLogger: this.traceLogger,
    };
  }

  private buildProviderQuery(intent: TripIntent, req: ConciergeRequest): ProviderSearchQuery {
    return {
      destinations: intent.destinations,
      dates: intent.dates,
      travelers: intent.travelers,
      ...(intent.budget.kind !== 'unspecified' ? { budget: intent.budget } : {}),
      preferences: intent.preferences,
      ...(req.input.compareSet ? { compareSet: req.input.compareSet } : {}),
    };
  }

  private failStep(turnId: string, stepIdValue: string, err: unknown): OrchestratorEvent {
    return {
      kind: 'agent.step.failed',
      turnId,
      stepId: stepIdValue,
      error: errorMessage(err),
      recoverable: false,
    };
  }

  private failTurn(turnId: string, err: unknown, recoverable: boolean): OrchestratorEvent {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        kind: 'turn.failed',
        turnId,
        error: 'cancelled',
        recoverable: true,
      };
    }
    return {
      kind: 'turn.failed',
      turnId,
      error: errorMessage(err),
      recoverable,
    };
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Clamp a number to [0, 1] for the `confidence` field on hint events. */
function clampUnit(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
