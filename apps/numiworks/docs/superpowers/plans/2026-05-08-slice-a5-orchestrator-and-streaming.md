# StayScout Slice A5 - Orchestrator + Streaming Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire IntentAgent + Provider into a typed `Orchestrator` that emits the discriminated `OrchestratorEvent` union as an `AsyncIterable`, and expose it over `POST /api/concierge` as JSONL. Refine turns compute IntentDelta and ProposalDiff against an in-memory turn record. After A5, `curl -N -X POST http://localhost:3000/api/concierge -d '{...}'` returns a real event stream that ends in `proposal.ready` carrying a Trip Board.

**Architecture:** `src/orchestrator/` owns the agent graph and event emission. `src/lib/streaming/` converts `AsyncIterable<OrchestratorEvent>` into a `ReadableStream<Uint8Array>` of JSONL. `src/lib/observability/` ships `NoOpTraceLogger` + `ConsoleTraceLogger`. `src/lib/session/` ships an anonymous-session cookie helper. The route handler at `src/app/api/concierge/route.ts` is thin glue: parse → validate → orchestrator → JSONL stream.

**Tests:** Unit tests with `MockModelClient` for the orchestrator (compose, refine, cancellation, failure), plus diff-utility tests. Live route-handler test deferred to A7 manual verification.

**Tech additions:** none - Zod, Vitest, MockModelClient already in.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §2.4, §6, §3.4

---

## Slice A5 file structure

```
src/orchestrator/
├── index.ts                 [modify] barrel - exports Orchestrator + helpers
├── orchestrator.ts          [new] Orchestrator class with async-generator run()
├── intent-delta.ts          [new] computeIntentDelta(prior, next)
├── proposal-diff.ts         [new] computeProposalDiff(prior, next)
├── proposal-builder.ts      [new] buildProposal(intent, stays) + concierge summary
└── singleton.ts             [new] getOrchestrator() - process-level singleton

src/lib/streaming/
├── jsonl-stream.ts          [new] toJsonlStream(iter): ReadableStream<Uint8Array>
└── index.ts                 [new] barrel

src/lib/observability/
├── trace-logger.ts          [new] NoOpTraceLogger + ConsoleTraceLogger
└── index.ts                 [new] barrel

src/lib/session/
├── anonymous.ts             [new] getOrCreateAnonymousSessionId()
└── index.ts                 [new] barrel

src/app/api/concierge/
└── route.ts                 [new] POST handler

tests/
├── orchestrator.test.ts     [new] compose + refine + cancel + provider-fail
├── intent-delta.test.ts     [new] diff utility tests
├── proposal-diff.test.ts    [new] diff utility tests
└── proposal-builder.test.ts [new] reasoning chip + summary builder tests
```

Total: ~14 new files.

---

## Task 1: Streaming + observability + session utilities

Three small libs in parallel - none depends on the others.

- [ ] Create `src/lib/streaming/jsonl-stream.ts`:
  ```ts
  /**
   * Convert an AsyncIterable into a JSONL ReadableStream<Uint8Array>.
   * Each yielded value is JSON.stringify'd, terminated by '\n', UTF-8
   * encoded, and enqueued. Errors thrown by the iterator close the
   * stream with a controller.error() so consumers see the failure.
   */
  export function toJsonlStream<T>(iter: AsyncIterable<T>): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const value of iter) {
            controller.enqueue(encoder.encode(JSON.stringify(value) + '\n'));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }
  ```

- [ ] `src/lib/streaming/index.ts`:
  ```ts
  export * from './jsonl-stream';
  ```

- [ ] `src/lib/observability/trace-logger.ts`:
  ```ts
  import type { OrchestratorEvent } from '@core/orchestrator-event';
  import type { AgentId } from '@core/ids';
  import type { TraceLogger } from '@core/agent';

  export const NoOpTraceLogger: TraceLogger = {
    recordEvent: () => {},
    recordAgentRun: () => {},
  };

  export const ConsoleTraceLogger: TraceLogger = {
    recordEvent(event: OrchestratorEvent) {
      // eslint-disable-next-line no-console
      console.info('[trace]', event.kind, event);
    },
    recordAgentRun(
      agent: AgentId,
      _input: unknown,
      _output: unknown,
      durationMs: number,
      modelMeta?: { model: string; tokensIn: number; tokensOut: number; cacheHit?: boolean },
    ) {
      // eslint-disable-next-line no-console
      console.info('[trace] agent.run', agent, `${durationMs}ms`, modelMeta);
    },
  };
  ```

- [ ] `src/lib/observability/index.ts`:
  ```ts
  export * from './trace-logger';
  ```

- [ ] `src/lib/session/anonymous.ts`:
  ```ts
  /**
   * Anonymous session cookie. Slice A keeps things minimal - a UUID v4
   * stored in an HttpOnly cookie. Slice B replaces with a signed cookie
   * once we have real user accounts and need tamper-detection.
   */
  export const SESSION_COOKIE = 'stayscout-session';
  const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

  export interface SessionResolution {
    sessionId: string;
    isNew: boolean;
  }

  export function resolveSession(cookieHeader: string | null): SessionResolution {
    if (cookieHeader) {
      const match = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`).exec(cookieHeader);
      if (match?.[1]) {
        return { sessionId: match[1], isNew: false };
      }
    }
    return { sessionId: `anon_${crypto.randomUUID()}`, isNew: true };
  }

  export function setSessionCookieHeader(sessionId: string): string {
    return `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; HttpOnly`;
  }
  ```

- [ ] `src/lib/session/index.ts`:
  ```ts
  export * from './anonymous';
  ```

- [ ] Run `pnpm typecheck`. Expect clean.
- [ ] Commit: `feat(lib): add streaming + observability + session utilities`

## Task 2: Diff utilities

- [ ] Create `src/orchestrator/intent-delta.ts`:
  ```ts
  import type { IntentDelta } from '@core/intent-delta';
  import type { TripIntent } from '@core/trip-intent';

  const TRIP_INTENT_KEYS: readonly (keyof TripIntent)[] = [
    'destinations',
    'dates',
    'duration',
    'travelers',
    'budget',
    'vibe',
    'preferences',
    'caveats',
    'rawInput',
    'confidence',
  ] as const;

  /**
   * Structurally diff two TripIntents. Top-level fields only - sub-tree
   * deep-equal is good enough for the UI's "what changed" banner.
   */
  export function computeIntentDelta(prior: TripIntent, next: TripIntent): IntentDelta {
    const changed: IntentDelta['changed'] = [];
    for (const key of TRIP_INTENT_KEYS) {
      const before = prior[key];
      const after = next[key];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changed.push({ key, before, after });
      }
    }
    return { added: {}, changed, removed: [] };
  }
  ```

- [ ] Create `src/orchestrator/proposal-diff.ts`:
  ```ts
  import type { TripProposal } from '@core/trip-proposal';
  import type { ProposalDiff } from '@core/intent-delta';

  /**
   * Diff between two TripProposals - drives the canvas's diff transition
   * (cards present in both freeze; removed fade; added materialize; hero
   * cross-fades on swap). All identity tracking is by Stay.id.
   */
  export function computeProposalDiff(prior: TripProposal, next: TripProposal): ProposalDiff {
    const heroChanged: ProposalDiff['heroChanged'] =
      prior.hero.id === next.hero.id
        ? null
        : { before: prior.hero.id, after: next.hero.id };

    const priorAlts = new Set(prior.alternatives.map((s) => s.id));
    const nextAlts = new Set(next.alternatives.map((s) => s.id));
    const alternativesAdded = next.alternatives
      .filter((s) => !priorAlts.has(s.id))
      .map((s) => s.id as string);
    const alternativesRemoved = prior.alternatives
      .filter((s) => !nextAlts.has(s.id))
      .map((s) => s.id as string);

    const sameSet =
      alternativesAdded.length === 0 && alternativesRemoved.length === 0;
    const alternativesReordered =
      sameSet &&
      prior.alternatives.map((s) => s.id).join('|') !==
        next.alternatives.map((s) => s.id).join('|');

    const priorChips = new Set(
      prior.reasoning.highlights.map((c) => `${c.source}:${c.label}`),
    );
    const nextChips = new Set(
      next.reasoning.highlights.map((c) => `${c.source}:${c.label}`),
    );
    const reasoningChanged = {
      added: next.reasoning.highlights.filter(
        (c) => !priorChips.has(`${c.source}:${c.label}`),
      ),
      removed: prior.reasoning.highlights.filter(
        (c) => !nextChips.has(`${c.source}:${c.label}`),
      ),
    };

    const totalCostDelta =
      prior.reasoning.totalCost && next.reasoning.totalCost
        ? {
            before: prior.reasoning.totalCost.amount,
            after: next.reasoning.totalCost.amount,
          }
        : undefined;

    return {
      heroChanged,
      alternativesAdded,
      alternativesRemoved,
      alternativesReordered,
      reasoningChanged,
      ...(totalCostDelta ? { totalCostDelta } : {}),
    };
  }
  ```

- [ ] Tests in Tasks 7–8 (after the orchestrator).

## Task 3: Proposal builder

- [ ] Create `src/orchestrator/proposal-builder.ts`:
  ```ts
  import type { ReasoningChip, TripProposal, AgentTraceSummary } from '@core/trip-proposal';
  import type { Stay } from '@core/stay';
  import type { TripIntent } from '@core/trip-intent';
  import type { ProposalRef } from '@core/partial';

  /**
   * Stitch the ranked stays from the provider into a TripProposal. The
   * hero is the top-ranked stay; up to 3 alternatives follow. Reasoning
   * highlights are derived from the user's intent (source: 'intent') -
   * Slice B's RankingAgent will add 'agent'-source chips on top.
   */
  export function buildProposal(args: {
    intent: TripIntent;
    stays: readonly Stay[];
    agentTrace: AgentTraceSummary;
  }): TripProposal {
    const [hero, ...rest] = args.stays;
    if (!hero) {
      throw new Error('buildProposal: no stays provided');
    }
    const alternatives = rest.slice(0, 3);

    const highlights: ReasoningChip[] = args.intent.vibe.tags.map((tag) => ({
      label: humanizeTag(tag),
      source: 'intent',
    }));

    const totalCost = args.intent.duration.nights > 0
      ? {
          amount: hero.pricing.pricePerNight.amount * args.intent.duration.nights,
          currency: hero.pricing.pricePerNight.currency,
        }
      : undefined;

    return {
      intent: args.intent,
      hero,
      alternatives,
      reasoning: {
        highlights,
        summary: buildConciergeSummary(args.intent, hero, alternatives.length),
        ...(totalCost ? { totalCost } : {}),
      },
      agentTrace: args.agentTrace,
      generatedAt: new Date().toISOString(),
    };
  }

  export function buildConciergeSummary(
    intent: TripIntent,
    hero: Stay,
    altCount: number,
  ): string {
    const dest = intent.destinations[0]?.name ?? hero.location.region ?? hero.location.country;
    const tags = intent.vibe.tags.slice(0, 2).map(humanizeTag);
    const tagPart = tags.length > 0 ? ` - ${tags.join(', ')}` : '';
    return `${dest}${tagPart}. Hero pick plus ${altCount} alternative${altCount === 1 ? '' : 's'}.`;
  }

  export function buildProposalRef(proposal: TripProposal, turnId: string): ProposalRef {
    const proposalId = stableProposalId(proposal);
    return {
      turnId,
      proposalId,
      generatedAt: proposal.generatedAt,
      summary: {
        destinationName:
          proposal.intent.destinations[0]?.name ??
          proposal.hero.location.region ??
          proposal.hero.location.country,
        nights: proposal.intent.duration.nights,
        heroStayName: proposal.hero.name,
      },
    };
  }

  function stableProposalId(proposal: TripProposal): string {
    // Slice A: derive a stable id from hero + alternatives ids. Slice B
    // can replace with a hash of the full proposal contents.
    const ids = [proposal.hero.id, ...proposal.alternatives.map((a) => a.id)];
    return `p_${Buffer.from(ids.join('|')).toString('base64url').slice(0, 22)}`;
  }

  function humanizeTag(tag: string): string {
    return tag.replace(/-/g, ' ');
  }
  ```

## Task 4: The Orchestrator class

- [ ] Create `src/orchestrator/orchestrator.ts`:
  ```ts
  import type { Agent, AgentContext, TraceLogger } from '@core/agent';
  import type { ConciergeRequest } from '@core/concierge-request';
  import { agentId, sessionId as sessionIdBrand, stepId, turnId as turnIdBrand } from '@core/ids';
  import type { ModelClient } from '@core/model-client';
  import type { OrchestratorEvent } from '@core/orchestrator-event';
  import type { Provider, ProviderContext, ProviderSearchQuery } from '@core/provider';
  import type { TripIntent } from '@core/trip-intent';
  import type { TripProposal, AgentTraceSummary } from '@core/trip-proposal';
  import type { IntentAgentInput } from '@/agents/intent-agent';
  import { IntentAgent } from '@/agents/intent-agent';
  import { routeProvider } from '@/providers';
  import { NoOpTraceLogger } from '@lib/observability/trace-logger';
  import { computeIntentDelta } from './intent-delta';
  import { computeProposalDiff } from './proposal-diff';
  import { buildProposal, buildProposalRef } from './proposal-builder';

  interface TurnRecord {
    turnId: string;
    sessionId: string;
    intent: TripIntent;
    proposal: TripProposal;
    completedAt: number;
  }

  export interface OrchestratorOptions {
    modelClient: ModelClient;
    traceLogger?: TraceLogger;
    intentAgent?: Agent<IntentAgentInput, TripIntent>;
    providerRouter?: (intent: TripIntent) => Provider;
  }

  /**
   * Walks the agent graph for a turn and emits a typed event stream. Slice
   * A graph is sequential - Intent → Provider.search → buildProposal.
   * Slice B replaces this class with a LangGraph.js graph; the emitted
   * event shape stays identical so consumers don't change.
   */
  export class Orchestrator {
    private readonly modelClient: ModelClient;
    private readonly traceLogger: TraceLogger;
    private readonly intentAgent: Agent<IntentAgentInput, TripIntent>;
    private readonly providerRouter: (intent: TripIntent) => Provider;
    private readonly turns = new Map<string, TurnRecord>();
    private readonly seenSessions = new Set<string>();
    private readonly seenTurnIds = new Set<string>();

    constructor(opts: OrchestratorOptions) {
      this.modelClient = opts.modelClient;
      this.traceLogger = opts.traceLogger ?? NoOpTraceLogger;
      this.intentAgent = opts.intentAgent ?? IntentAgent;
      this.providerRouter = opts.providerRouter ?? routeProvider;
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
        ? this.turns.get(req.input.priorProposalRef.turnId)
        : undefined;

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

      const intentStartedAt = performance.now();
      let intent: TripIntent;
      try {
        const agentCtx = this.buildAgentContext(req, ctx.signal);
        intent = await this.intentAgent.run(
          {
            rawInput: req.input.rawInput,
            ...(priorTurn?.intent ? { priorIntent: priorTurn.intent } : {}),
          },
          agentCtx,
        );
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
      const proposal = buildProposal({
        intent,
        stays: searchResult.stays,
        agentTrace,
      });
      const proposalRef = buildProposalRef(proposal, req.turnId);

      // Canvas trigger: shimmer for compose, refining ripple for refine.
      if (req.type === 'refine' && priorTurn?.proposal) {
        yield {
          kind: 'proposal.refining',
          turnId: req.turnId,
          priorProposalRef: buildProposalRef(priorTurn.proposal, priorTurn.turnId),
        };
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

      // (MoodSnapshotAgent runs here in Slice A6 - non-blocking, post-proposal.)

      yield {
        kind: 'turn.completed',
        turnId: req.turnId,
        durationMs: Math.round(performance.now() - turnStartedAt),
      };

      this.turns.set(req.turnId, {
        turnId: req.turnId,
        sessionId: req.sessionId,
        intent,
        proposal,
        completedAt: Date.now(),
      });
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

    private failStep(
      turnId: string,
      stepId: string,
      err: unknown,
    ): OrchestratorEvent {
      return {
        kind: 'agent.step.failed',
        turnId,
        stepId,
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
  ```

- [ ] `src/orchestrator/index.ts`:
  ```ts
  // Layer: orchestrator
  // Deps: core, agents, providers, lib

  export * from './orchestrator';
  export * from './intent-delta';
  export * from './proposal-diff';
  export * from './proposal-builder';
  ```

## Task 5: Process-singleton + route handler

- [ ] Create `src/orchestrator/singleton.ts`:
  ```ts
  import { Orchestrator } from './orchestrator';
  import { AnthropicModelClient } from '@lib/ai/anthropic-client';
  import { NoOpTraceLogger } from '@lib/observability/trace-logger';

  /**
   * Process-level singleton so the in-memory turn map persists across
   * requests within the same Node process. Lazily constructs on first
   * use because route handler imports run at build time and we don't
   * want to require ANTHROPIC_API_KEY at build.
   */
  let _instance: Orchestrator | null = null;

  export function getOrchestrator(): Orchestrator {
    if (_instance) return _instance;
    const modelClient = new AnthropicModelClient();
    _instance = new Orchestrator({
      modelClient,
      traceLogger: NoOpTraceLogger,
    });
    return _instance;
  }

  // Test-only: replace the instance with one that uses a MockModelClient
  // or similar.
  export function _setOrchestratorForTesting(instance: Orchestrator | null): void {
    _instance = instance;
  }
  ```

- [ ] Create `src/app/api/concierge/route.ts`:
  ```ts
  import type { NextRequest } from 'next/server';
  import { ConciergeRequestSchema } from '@core/concierge-request';
  import { getOrchestrator } from '@/orchestrator/singleton';
  import { toJsonlStream } from '@lib/streaming/jsonl-stream';
  import { resolveSession, setSessionCookieHeader } from '@lib/session/anonymous';

  export const runtime = 'nodejs';

  export async function POST(req: NextRequest): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'invalid JSON body' }, { status: 400 });
    }

    const parsed = ConciergeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'invalid request', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // Ensure the session id from the cookie matches the request (or trust
    // the request body if no cookie exists). Slice A is loose; Slice B
    // can tighten with signed cookies + stronger validation.
    const session = resolveSession(req.headers.get('cookie'));
    const requestSessionId = parsed.data.sessionId || session.sessionId;

    const orchestrator = getOrchestrator();
    const stream = toJsonlStream(
      orchestrator.run(
        { ...parsed.data, sessionId: requestSessionId },
        { signal: req.signal },
      ),
    );

    const headers: HeadersInit = {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-cache',
      'X-Accel-Buffering': 'no',
    };
    if (session.isNew) {
      (headers as Record<string, string>)['Set-Cookie'] =
        setSessionCookieHeader(requestSessionId);
    }

    return new Response(stream, { headers });
  }
  ```

## Task 6: Diff utility tests

- [ ] Create `tests/intent-delta.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { computeIntentDelta } from '@/orchestrator/intent-delta';
  import type { TripIntent } from '@core/trip-intent';

  const base: TripIntent = {
    destinations: [{ kind: 'curated', name: 'Italy', country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 7, flexible: false },
    travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
    budget: { kind: 'total', amount: 6000, currency: 'USD', flexibility: 'flexible' },
    vibe: { tags: ['walkable', 'family-friendly'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'Italy 7d family',
  };

  describe('computeIntentDelta', () => {
    it('returns no changes when intents are identical', () => {
      const delta = computeIntentDelta(base, { ...base });
      expect(delta.changed).toEqual([]);
    });

    it('records a single changed field', () => {
      const next: TripIntent = {
        ...base,
        vibe: { tags: ['walkable', 'family-friendly', 'avoid-tourist-traps'] },
      };
      const delta = computeIntentDelta(base, next);
      expect(delta.changed.length).toBe(1);
      expect(delta.changed[0]?.key).toBe('vibe');
    });

    it('records multiple changed fields', () => {
      const next: TripIntent = {
        ...base,
        duration: { nights: 10, flexible: false },
        rawInput: 'longer trip',
      };
      const delta = computeIntentDelta(base, next);
      const keys = delta.changed.map((c) => c.key).sort();
      expect(keys).toEqual(['duration', 'rawInput']);
    });
  });
  ```

- [ ] Create `tests/proposal-diff.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { computeProposalDiff } from '@/orchestrator/proposal-diff';
  import { ALL_STAYS } from '@/providers/mock-italy/data';
  import type { TripProposal } from '@core/trip-proposal';
  import type { TripIntent } from '@core/trip-intent';
  import type { Stay } from '@core/stay';

  const intent: TripIntent = {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 7, flexible: false },
    travelers: { adults: 2, children: { count: 0 }, infants: 0 },
    budget: { kind: 'unspecified' },
    vibe: { tags: [] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'a',
  };

  function build(stays: Stay[]): TripProposal {
    const [hero, ...alts] = stays;
    if (!hero) throw new Error('need at least one stay');
    return {
      intent,
      hero,
      alternatives: alts.slice(0, 3),
      reasoning: { highlights: [], summary: '' },
      agentTrace: { agents: [], totalDurationMs: 0 },
      generatedAt: new Date().toISOString(),
    };
  }

  describe('computeProposalDiff', () => {
    it('reports null heroChanged when hero is the same', () => {
      const p = build([...ALL_STAYS].slice(0, 4));
      const diff = computeProposalDiff(p, p);
      expect(diff.heroChanged).toBeNull();
      expect(diff.alternativesAdded).toEqual([]);
      expect(diff.alternativesRemoved).toEqual([]);
    });

    it('reports heroChanged when hero swaps', () => {
      const a = build([...ALL_STAYS].slice(0, 4));
      const b = build([...ALL_STAYS].slice(1, 5));
      const diff = computeProposalDiff(a, b);
      expect(diff.heroChanged).not.toBeNull();
      expect(diff.heroChanged?.before).toBe(a.hero.id);
      expect(diff.heroChanged?.after).toBe(b.hero.id);
    });

    it('reports added/removed alternatives', () => {
      const a = build([...ALL_STAYS].slice(0, 4));
      const b = build([
        a.hero,
        ...[...ALL_STAYS].slice(4, 7),
      ]);
      const diff = computeProposalDiff(a, b);
      expect(diff.alternativesAdded.length).toBeGreaterThan(0);
      expect(diff.alternativesRemoved.length).toBeGreaterThan(0);
    });
  });
  ```

- [ ] Create `tests/proposal-builder.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { buildProposal, buildProposalRef } from '@/orchestrator/proposal-builder';
  import { ALL_STAYS } from '@/providers/mock-italy/data';
  import type { TripIntent } from '@core/trip-intent';

  const intent: TripIntent = {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 7, flexible: false },
    travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
    budget: { kind: 'unspecified' },
    vibe: { tags: ['walkable', 'family-friendly'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'a',
  };

  describe('buildProposal', () => {
    it('throws when no stays given', () => {
      expect(() => buildProposal({ intent, stays: [], agentTrace: { agents: [], totalDurationMs: 0 } })).toThrow();
    });

    it('uses first stay as hero and up to 3 alternatives', () => {
      const stays = [...ALL_STAYS].slice(0, 6);
      const p = buildProposal({ intent, stays, agentTrace: { agents: [], totalDurationMs: 0 } });
      expect(p.hero.id).toBe(stays[0]?.id);
      expect(p.alternatives.length).toBe(3);
    });

    it('derives reasoning chips from intent vibe tags', () => {
      const stays = [...ALL_STAYS].slice(0, 4);
      const p = buildProposal({ intent, stays, agentTrace: { agents: [], totalDurationMs: 0 } });
      const labels = p.reasoning.highlights.map((c) => c.label);
      expect(labels).toContain('walkable');
      expect(labels).toContain('family friendly');
    });

    it('computes totalCost when nights > 0', () => {
      const stays = [...ALL_STAYS].slice(0, 4);
      const p = buildProposal({ intent, stays, agentTrace: { agents: [], totalDurationMs: 0 } });
      const hero = stays[0];
      expect(p.reasoning.totalCost?.amount).toBe((hero?.pricing.pricePerNight.amount ?? 0) * 7);
    });
  });

  describe('buildProposalRef', () => {
    it('returns a stable proposalId for the same proposal', () => {
      const stays = [...ALL_STAYS].slice(0, 4);
      const p = buildProposal({ intent, stays, agentTrace: { agents: [], totalDurationMs: 0 } });
      const r1 = buildProposalRef(p, 't1');
      const r2 = buildProposalRef(p, 't1');
      expect(r1.proposalId).toBe(r2.proposalId);
    });
  });
  ```

## Task 7: Orchestrator end-to-end test

- [ ] Create `tests/orchestrator.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { Orchestrator } from '@/orchestrator/orchestrator';
  import { agentId } from '@core/ids';
  import type { ConciergeRequest } from '@core/concierge-request';
  import type { OrchestratorEvent } from '@core/orchestrator-event';
  import type { TripIntent } from '@core/trip-intent';
  import { MockModelClient } from './helpers/mock-model-client';

  function baseRequest(overrides: Partial<ConciergeRequest> = {}): ConciergeRequest {
    return {
      sessionId: 'anon_test',
      turnId: `t-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'compose',
      input: { rawInput: 'Italy 7 days family' },
      clientCapabilities: {
        supportsAdaptationDelta: true,
        supportsMoodSnapshot: true,
        supportsMemoryHint: true,
      },
      ...overrides,
    };
  }

  const intentResponse: TripIntent = {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 7, flexible: false },
    travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
    budget: { kind: 'unspecified' },
    vibe: { tags: ['walkable', 'family-friendly'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'Italy 7 days family',
  };

  async function collect(iter: AsyncIterable<OrchestratorEvent>): Promise<OrchestratorEvent[]> {
    const events: OrchestratorEvent[] = [];
    for await (const e of iter) events.push(e);
    return events;
  }

  describe('Orchestrator', () => {
    it('emits the expected event sequence for a compose turn', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const client = new MockModelClient().respondGenerate(() => intentResponse);
      const orch = new Orchestrator({ modelClient: client });
      const events = await collect(
        orch.run(baseRequest(), { signal: new AbortController().signal }),
      );
      const kinds = events.map((e) => e.kind);

      expect(kinds[0]).toBe('session.started');
      expect(kinds).toContain('turn.started');
      expect(kinds).toContain('intent.extracted');
      expect(kinds).toContain('provider.search.completed');
      expect(kinds).toContain('proposal.shimmering');
      expect(kinds).toContain('proposal.ready');
      expect(kinds).toContain('proposal.bookmarkable');
      expect(kinds).toContain('concierge.message');
      expect(kinds[kinds.length - 1]).toBe('turn.completed');
    });

    it('does not re-emit session.started for subsequent turns in the same session', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const client = new MockModelClient().respondGenerate(() => intentResponse);
      const orch = new Orchestrator({ modelClient: client });
      await collect(orch.run(baseRequest(), { signal: new AbortController().signal }));
      const second = await collect(
        orch.run(baseRequest(), { signal: new AbortController().signal }),
      );
      expect(second.find((e) => e.kind === 'session.started')).toBeUndefined();
    });

    it('refine turn emits intent.refined and proposal.evolved', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const client = new MockModelClient().respondGenerate(() => intentResponse);
      const orch = new Orchestrator({ modelClient: client });

      const composeReq = baseRequest();
      const composeEvents = await collect(orch.run(composeReq, { signal: new AbortController().signal }));
      const ready = composeEvents.find((e) => e.kind === 'proposal.ready');
      if (!ready || ready.kind !== 'proposal.ready') throw new Error('proposal.ready missing');

      // Now refine - same prior intent (mock returns the same), so the diff
      // is empty, but the events should still flow.
      const refineReq = baseRequest({
        type: 'refine',
        input: {
          rawInput: 'less touristy',
          priorProposalRef: {
            turnId: composeReq.turnId,
            proposalId: 'p_x',
            generatedAt: ready.proposal.generatedAt,
            summary: { destinationName: 'Tuscany', nights: 7, heroStayName: ready.proposal.hero.name },
          },
        },
      });
      const refineEvents = await collect(orch.run(refineReq, { signal: new AbortController().signal }));
      const kinds = refineEvents.map((e) => e.kind);
      expect(kinds).toContain('intent.refined');
      expect(kinds).toContain('proposal.refining');
      expect(kinds).toContain('proposal.evolved');
      expect(kinds).not.toContain('proposal.ready');
    });

    it('rejects duplicate turnIds with a turn.failed', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const client = new MockModelClient().respondGenerate(() => intentResponse);
      const orch = new Orchestrator({ modelClient: client });
      const req = baseRequest();
      await collect(orch.run(req, { signal: new AbortController().signal }));
      const second = await collect(orch.run(req, { signal: new AbortController().signal }));
      const fail = second.find((e) => e.kind === 'turn.failed');
      expect(fail).toBeDefined();
      if (fail?.kind === 'turn.failed') expect(fail.error).toContain('duplicate');
    });

    it('emits agent.step.failed when intent agent throws', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const client = new MockModelClient().respondGenerate(() => {
        throw new Error('intent boom');
      });
      const orch = new Orchestrator({ modelClient: client });
      const events = await collect(
        orch.run(baseRequest(), { signal: new AbortController().signal }),
      );
      const kinds = events.map((e) => e.kind);
      expect(kinds).toContain('agent.step.failed');
      expect(kinds).toContain('turn.failed');
    });

    it('classifies AbortError on intent agent as recoverable cancelled', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const ctrl = new AbortController();
      const client = new MockModelClient().respondGenerate(async () => {
        ctrl.abort();
        throw new DOMException('Aborted', 'AbortError');
      });
      const orch = new Orchestrator({ modelClient: client });
      const events = await collect(orch.run(baseRequest(), { signal: ctrl.signal }));
      const fail = events.find((e) => e.kind === 'turn.failed');
      if (fail?.kind !== 'turn.failed') throw new Error('expected turn.failed');
      expect(fail.error).toBe('cancelled');
      expect(fail.recoverable).toBe(true);
    });
  });
  ```

## Task 8: Final pipeline + manual curl + tag

- [ ] Run:
  ```bash
  pnpm format
  pnpm typecheck
  pnpm lint
  pnpm format:check
  pnpm test
  pnpm build
  ```

- [ ] Manual smoke (requires `ANTHROPIC_API_KEY` in `.env.local`):
  ```bash
  pnpm dev &
  curl -N -X POST http://localhost:3000/api/concierge \
    -H 'Content-Type: application/json' \
    -d '{
      "sessionId": "anon_smoke",
      "turnId": "t-smoke-1",
      "type": "compose",
      "input": { "rawInput": "Italy 7 days, family of 4, walkable, no tourist traps" },
      "clientCapabilities": {
        "supportsAdaptationDelta": true,
        "supportsMoodSnapshot": true,
        "supportsMemoryHint": true
      }
    }'
  ```
  Expect a JSONL stream that includes `intent.extracted`, `proposal.ready`, `concierge.message`, `turn.completed`.

- [ ] Tag:
  ```bash
  git tag -a slice-a5 -m "Slice A5 complete: Orchestrator + Streaming Protocol over JSONL"
  ```

- [ ] After A5 ships, write the Slice A6 plan (LLM-Synthesized Provider + MoodSnapshotAgent).
