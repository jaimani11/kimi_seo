import { describe, expect, it } from 'vitest';
import { Orchestrator } from '@/orchestrator/orchestrator';
import { LangGraphOrchestrator } from '@/orchestrator/langgraph';
import type { ConciergeRequest } from '@core/concierge-request';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { TripIntent } from '@core/trip-intent';
import { MockModelClient } from './helpers/mock-model-client';
import { stubStayProvider } from './helpers/stub-provider';

// Slice H2 - mock-italy is gone, so by default Italy now routes to the
// opportunity branch. Inject the stub provider so the parity test still
// exercises the proposal flow (where the engines have the most surface
// area to drift).
function withStubProvider() {
  return {
    providerRouter: () => stubStayProvider,
    routeDecider: () => ({ kind: 'inventory' as const, providers: [stubStayProvider] }),
  };
}

/**
 * Parity test - runs identical ConciergeRequests through both engines
 * and asserts the resulting event sequences are equivalent after
 * normalizing for ids and timestamps that are inherently per-run.
 *
 * What we normalize:
 *   - all `*.timestamp` fields → 0
 *   - `durationMs` fields → 0 (timing is wall-clock)
 *   - `stepId` fields → step ordinal (1st, 2nd, ...)
 *   - `proposal.generatedAt`, `proposal.agentTrace.*` durations → fixed
 *   - `concierge.message` text - the legacy hand-rolled path emits
 *      `proposal.reasoning.summary` while LangGraph builds the same
 *      proposal so the summary is identical. Kept as-is.
 *
 * Anything else differing means the engines have drifted.
 */

function baseRequest(overrides: Partial<ConciergeRequest> = {}): ConciergeRequest {
  return {
    sessionId: 'parity_session',
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

/**
 * Strip per-run fields so two runs against the same request can be
 * compared. We rewrite stepIds to ordinals so the two engines agree
 * even if their stepId derivation diverges (it doesn't today, but the
 * test stays robust to that).
 */
function normalize(events: OrchestratorEvent[]): unknown[] {
  let stepOrdinal = 0;
  const stepIdMap = new Map<string, string>();

  function mapStepId(id: string | undefined): string | undefined {
    if (!id) return id;
    let mapped = stepIdMap.get(id);
    if (!mapped) {
      stepOrdinal += 1;
      mapped = `step_${stepOrdinal}`;
      stepIdMap.set(id, mapped);
    }
    return mapped;
  }

  return events.map((e) => {
    // Discriminated-union spread + selective overrides.
    const copy: Record<string, unknown> = { ...(e as unknown as Record<string, unknown>) };

    if ('timestamp' in copy) copy.timestamp = 0;
    if ('durationMs' in copy) copy.durationMs = 0;
    if ('stepId' in copy && typeof copy.stepId === 'string') {
      copy.stepId = mapStepId(copy.stepId);
    }
    // Strip turnId - both engines emit the same one (it's the request's
    // turnId), but normalizing keeps the diff clean if that ever changes.
    if ('turnId' in copy) copy.turnId = '<turnId>';

    if ('proposal' in copy && copy.proposal && typeof copy.proposal === 'object') {
      const p = copy.proposal as Record<string, unknown>;
      copy.proposal = {
        ...p,
        generatedAt: '<generatedAt>',
        agentTrace: {
          ...((p.agentTrace as Record<string, unknown>) ?? {}),
          totalDurationMs: 0,
          agents: ((p.agentTrace as { agents?: Array<Record<string, unknown>> })?.agents ?? []).map(
            (a) => ({ ...a, durationMs: 0 }),
          ),
        },
      };
    }

    if ('ref' in copy && copy.ref && typeof copy.ref === 'object') {
      copy.ref = { ...(copy.ref as Record<string, unknown>), generatedAt: '<generatedAt>' };
    }

    if (
      'priorProposalRef' in copy &&
      copy.priorProposalRef &&
      typeof copy.priorProposalRef === 'object'
    ) {
      copy.priorProposalRef = {
        ...(copy.priorProposalRef as Record<string, unknown>),
        generatedAt: '<generatedAt>',
      };
    }

    if ('freshness' in copy && copy.freshness && typeof copy.freshness === 'object') {
      const f = copy.freshness as Record<string, unknown>;
      copy.freshness = { ...f, fetchedAt: '<fetchedAt>' };
    }

    if ('snapshot' in copy && copy.snapshot && typeof copy.snapshot === 'object') {
      // mood.snapshot - stable for the same destination but strip
      // anything timestamp-like defensively.
      const s = copy.snapshot as Record<string, unknown>;
      if ('generatedAt' in s) s.generatedAt = '<generatedAt>';
    }

    return copy;
  });
}

describe('orchestrator parity (hand-rolled vs LangGraph)', () => {
  it('produces equivalent event streams for a compose turn', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const req = baseRequest();

    const handRolled = new Orchestrator({ modelClient: new MockModelClient().respondGenerate(() => intentResponse), ...withStubProvider() });
    const langgraph = new LangGraphOrchestrator({ modelClient: new MockModelClient().respondGenerate(() => intentResponse), ...withStubProvider() });

    const handEvents = await collect(handRolled.run(req, { signal: new AbortController().signal }));
    const lgEvents = await collect(langgraph.run(req, { signal: new AbortController().signal }));

    const handKinds = handEvents.map((e) => e.kind);
    const lgKinds = lgEvents.map((e) => e.kind);
    expect(lgKinds).toEqual(handKinds);

    // Deep-equal after normalization.
    expect(normalize(lgEvents)).toEqual(normalize(handEvents));
  });

  it('produces equivalent event streams for a refine turn', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';

    // Bootstrap: run a compose against each engine to get a prior proposal.
    const composeReq = baseRequest({ sessionId: 'parity_refine' });
    const handRolled = new Orchestrator({ modelClient: new MockModelClient().respondGenerate(() => intentResponse), ...withStubProvider() });
    const langgraph = new LangGraphOrchestrator({ modelClient: new MockModelClient().respondGenerate(() => intentResponse), ...withStubProvider() });
    const composeHand = await collect(
      handRolled.run(composeReq, { signal: new AbortController().signal }),
    );
    await collect(langgraph.run(composeReq, { signal: new AbortController().signal }));

    const ready = composeHand.find((e) => e.kind === 'proposal.ready');
    if (!ready || ready.kind !== 'proposal.ready') throw new Error('no proposal.ready');

    const refineReq = baseRequest({
      sessionId: 'parity_refine',
      type: 'refine',
      input: {
        rawInput: 'less touristy',
        priorProposalRef: {
          turnId: composeReq.turnId,
          proposalId: 'p_x',
          generatedAt: ready.proposal.generatedAt,
          summary: {
            destinationName: 'Tuscany',
            nights: 7,
            heroStayName: ready.proposal.hero.name,
          },
        },
      },
    });

    const handRefine = await collect(
      handRolled.run(refineReq, { signal: new AbortController().signal }),
    );
    const lgRefine = await collect(
      langgraph.run(refineReq, { signal: new AbortController().signal }),
    );

    expect(lgRefine.map((e) => e.kind)).toEqual(handRefine.map((e) => e.kind));
    expect(normalize(lgRefine)).toEqual(normalize(handRefine));
  });

  it('produces equivalent event streams for a duplicate turn', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const req = baseRequest({ sessionId: 'parity_dup' });

    const handRolled = new Orchestrator({ modelClient: new MockModelClient().respondGenerate(() => intentResponse), ...withStubProvider() });
    const langgraph = new LangGraphOrchestrator({ modelClient: new MockModelClient().respondGenerate(() => intentResponse), ...withStubProvider() });

    await collect(handRolled.run(req, { signal: new AbortController().signal }));
    await collect(langgraph.run(req, { signal: new AbortController().signal }));

    const handDup = await collect(handRolled.run(req, { signal: new AbortController().signal }));
    const lgDup = await collect(langgraph.run(req, { signal: new AbortController().signal }));

    expect(lgDup.map((e) => e.kind)).toEqual(handDup.map((e) => e.kind));
    expect(normalize(lgDup)).toEqual(normalize(handDup));
  });
});
