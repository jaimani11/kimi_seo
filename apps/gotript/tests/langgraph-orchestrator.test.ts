import { describe, expect, it } from 'vitest';
import { LangGraphOrchestrator } from '@/orchestrator/langgraph';
import type { ConciergeRequest } from '@core/concierge-request';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { TripIntent } from '@core/trip-intent';
import { MockModelClient } from './helpers/mock-model-client';
import { stubStayProvider } from './helpers/stub-provider';

// Slice H2 - the LangGraph engine, like the hand-rolled one, defaults
// to opportunity routing for Italian destinations now that mock-italy
// is gone. Inject the stub provider to force the inventory path so
// these proposal-flow tests can still run.
function withStubProvider() {
  return {
    providerRouter: () => stubStayProvider,
    routeDecider: () => ({ kind: 'inventory' as const, providers: [stubStayProvider] }),
  };
}

/**
 * Mirror tests/orchestrator.test.ts against the LangGraph engine. Same
 * scenarios, same assertions - proves behavioral parity at the unit
 * level. Stream-equivalence is enforced separately by
 * tests/orchestrator-parity.test.ts.
 */

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

describe('LangGraphOrchestrator', () => {
  it('emits the expected event sequence for a compose turn', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const client = new MockModelClient().respondGenerate(() => intentResponse);
    const orch = new LangGraphOrchestrator({ modelClient: client, ...withStubProvider() });
    const events = await collect(orch.run(baseRequest(), { signal: new AbortController().signal }));
    const kinds = events.map((e) => e.kind);

    expect(kinds[0]).toBe('session.started');
    expect(kinds).toContain('turn.started');
    expect(kinds).toContain('intent.extracted');
    expect(kinds).toContain('provider.search.completed');
    expect(kinds).toContain('proposal.shimmering');
    expect(kinds).toContain('proposal.ready');
    expect(kinds).toContain('proposal.bookmarkable');
    expect(kinds).toContain('concierge.message');
    expect(kinds).toContain('mood.snapshot.ready');
    expect(kinds[kinds.length - 1]).toBe('turn.completed');
  });

  it('emits mood.snapshot.ready after proposal.ready (curated path)', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const client = new MockModelClient().respondGenerate(() => intentResponse);
    const orch = new LangGraphOrchestrator({ modelClient: client, ...withStubProvider() });
    const events = await collect(orch.run(baseRequest(), { signal: new AbortController().signal }));
    const proposalReadyIdx = events.findIndex((e) => e.kind === 'proposal.ready');
    const moodIdx = events.findIndex((e) => e.kind === 'mood.snapshot.ready');
    expect(proposalReadyIdx).toBeGreaterThanOrEqual(0);
    expect(moodIdx).toBeGreaterThan(proposalReadyIdx);
  });

  it('does not re-emit session.started for subsequent turns in the same session', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const client = new MockModelClient().respondGenerate(() => intentResponse);
    const orch = new LangGraphOrchestrator({ modelClient: client, ...withStubProvider() });
    await collect(orch.run(baseRequest(), { signal: new AbortController().signal }));
    const second = await collect(orch.run(baseRequest(), { signal: new AbortController().signal }));
    expect(second.find((e) => e.kind === 'session.started')).toBeUndefined();
  });

  it('refine turn emits intent.refined and proposal.evolved', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const client = new MockModelClient().respondGenerate(() => intentResponse);
    const orch = new LangGraphOrchestrator({ modelClient: client, ...withStubProvider() });

    const composeReq = baseRequest();
    const composeEvents = await collect(
      orch.run(composeReq, { signal: new AbortController().signal }),
    );
    const ready = composeEvents.find((e) => e.kind === 'proposal.ready');
    if (!ready || ready.kind !== 'proposal.ready') throw new Error('proposal.ready missing');

    const refineReq = baseRequest({
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
    const refineEvents = await collect(
      orch.run(refineReq, { signal: new AbortController().signal }),
    );
    const kinds = refineEvents.map((e) => e.kind);
    expect(kinds).toContain('intent.refined');
    expect(kinds).toContain('proposal.refining');
    expect(kinds).toContain('proposal.evolved');
    expect(kinds).not.toContain('proposal.ready');
  });

  it('rejects duplicate turnIds with a turn.failed', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const client = new MockModelClient().respondGenerate(() => intentResponse);
    const orch = new LangGraphOrchestrator({ modelClient: client, ...withStubProvider() });
    const req = baseRequest();
    await collect(orch.run(req, { signal: new AbortController().signal }));
    const second = await collect(orch.run(req, { signal: new AbortController().signal }));
    const fail = second.find((e) => e.kind === 'turn.failed');
    expect(fail).toBeDefined();
    if (fail?.kind === 'turn.failed') expect(fail.error).toContain('duplicate');
  });

  it('intent-agent model errors fall back to heuristic, turn still completes', async () => {
    // Mirrors the legacy-engine test - both engines must honor the
    // post-bugfix resilience contract (model error → fallback, not
    // turn.failed).
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const client = new MockModelClient().respondGenerate(() => {
      throw new Error('intent boom');
    });
    const orch = new LangGraphOrchestrator({ modelClient: client, ...withStubProvider() });
    const events = await collect(orch.run(baseRequest(), { signal: new AbortController().signal }));
    const kinds = events.map((e) => e.kind);
    expect(kinds).not.toContain('turn.failed');
    expect(kinds[kinds.length - 1]).toBe('turn.completed');
    expect(kinds).toContain('intent.extracted');
  });

  it('classifies AbortError on intent agent as recoverable cancelled', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const ctrl = new AbortController();
    const client = new MockModelClient().respondGenerate(async () => {
      ctrl.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    const orch = new LangGraphOrchestrator({ modelClient: client, ...withStubProvider() });
    const events = await collect(orch.run(baseRequest(), { signal: ctrl.signal }));
    const fail = events.find((e) => e.kind === 'turn.failed');
    if (fail?.kind !== 'turn.failed') throw new Error('expected turn.failed');
    expect(fail.error).toBe('cancelled');
    expect(fail.recoverable).toBe(true);
  });
});
