import { describe, expect, it } from 'vitest';
import type { Agent, AgentContext } from '@core/agent';
import { agentId } from '@core/ids';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { TripIntent } from '@core/trip-intent';
import type { IntentAgentInput } from '@/agents/intent-agent';
import { Orchestrator } from '@/orchestrator/orchestrator';
import { MockModelClient } from './helpers/mock-model-client';

/**
 * Slice F1 - end-to-end orchestrator behavior.
 *
 * The screenshot from a live run showed "Searched StayScout Preview"
 * firing for an Austria prompt, indicating the legacy provider-search
 * path ran instead of the opportunity branch. That can only happen if
 * either:
 *   (a) the dev server was running pre-F1 code (stale `.next` cache /
 *       module graph), or
 *   (b) my routing decision falls through to the legacy path.
 *
 * This test asserts (b) is NOT true - that with a stub IntentAgent
 * returning Austria, the actual `Orchestrator.run()` emits
 * `search.opportunity.ready` and never emits `provider.search.completed`.
 */

function makeAustriaIntent(): TripIntent {
  return {
    destinations: [{ kind: 'synthesized', name: 'Austria', country: 'AT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 6, flexible: true },
    travelers: { adults: 6, children: { count: 0 }, infants: 0 },
    budget: { kind: 'unspecified' },
    vibe: { tags: ['adventure', 'group', 'mountains'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'Austria ski trip for 6 people',
  };
}

function makeTuscanyIntent(): TripIntent {
  return {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 5, flexible: true },
    travelers: { adults: 2, children: { count: 0 }, infants: 0 },
    budget: { kind: 'unspecified' },
    vibe: { tags: ['slow', 'walkable'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'Tuscany, slow and walkable',
  };
}

function makeStubIntentAgent(intent: TripIntent): Agent<IntentAgentInput, TripIntent> {
  return {
    id: agentId('intent'),
    name: 'StubIntent',
    version: 'test',
    async run(): Promise<TripIntent> {
      return intent;
    },
  };
}

function makeStubFlavorAgent() {
  return {
    id: agentId('destination-flavor'),
    name: 'StubFlavor',
    version: 'test',
    async run(_input: unknown, _ctx: AgentContext) {
      return {
        text: 'Quiet ski mornings; six people share a chalet here.',
        source: 'llm' as const,
      };
    },
  };
}

function makeStubMoodAgent() {
  return {
    id: agentId('mood'),
    name: 'StubMood',
    version: 'test',
    async run() {
      return {
        destinationName: 'Tuscany',
        text: 'Golden-hour vineyard dinners and slower mornings.',
        source: 'curated' as const,
        confidence: 0.95,
      };
    },
  };
}

async function collect(stream: AsyncIterable<OrchestratorEvent>): Promise<OrchestratorEvent[]> {
  const out: OrchestratorEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('Orchestrator F1 routing - end-to-end', () => {
  it('Austria → opportunity branch (search.opportunity.ready, no provider.search.completed)', async () => {
    const orch = new Orchestrator({
      modelClient: new MockModelClient(),
      intentAgent: makeStubIntentAgent(makeAustriaIntent()),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      destinationFlavorAgent: makeStubFlavorAgent() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      moodSnapshotAgent: makeStubMoodAgent() as any,
    });

    const events = await collect(
      orch.run(
        {
          turnId: 't-austria',
          sessionId: 's-austria',
          type: 'compose',
          input: { rawInput: 'Austria ski trip for 6 people' },
          clientCapabilities: {
            supportsAdaptationDelta: true,
            supportsMoodSnapshot: true,
            supportsMemoryHint: true,
          },
        },
        { signal: new AbortController().signal },
      ),
    );

    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain('search.opportunity.ready');
    expect(kinds).not.toContain('provider.search.completed');
    expect(kinds).not.toContain('proposal.ready');

    const oppEvent = events.find((e) => e.kind === 'search.opportunity.ready');
    expect(oppEvent).toBeDefined();
    if (oppEvent?.kind === 'search.opportunity.ready') {
      expect(oppEvent.opportunity.destination.name).toBe('Austria');
      expect(oppEvent.opportunity.providers.map((p) => p.providerId)).toEqual([
        'viator-top',
        'viator-day-trips',
        'viator-food',
      ]);
      expect(oppEvent.opportunity.intentDigest.adults).toBe(6);
    }
  });

  it('Tuscany → opportunity branch when no real provider is configured (post-H2)', async () => {
    // Slice H2 - MockItalyProvider is removed. With no real provider
    // serving IT in the default registry, every Italian destination
    // now routes to the opportunity branch, alongside live Viator on
    // the canvas. The "no provider serves IT" path is what every
    // destination outside the configured-provider footprint hits today.
    const orch = new Orchestrator({
      modelClient: new MockModelClient(),
      intentAgent: makeStubIntentAgent(makeTuscanyIntent()),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      destinationFlavorAgent: makeStubFlavorAgent() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      moodSnapshotAgent: makeStubMoodAgent() as any,
    });

    const events = await collect(
      orch.run(
        {
          turnId: 't-tuscany',
          sessionId: 's-tuscany',
          type: 'compose',
          input: { rawInput: 'Tuscany, slow and walkable' },
          clientCapabilities: {
            supportsAdaptationDelta: true,
            supportsMoodSnapshot: true,
            supportsMemoryHint: true,
          },
        },
        { signal: new AbortController().signal },
      ),
    );

    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain('search.opportunity.ready');
    expect(kinds).not.toContain('provider.search.completed');
    expect(kinds).not.toContain('proposal.ready');

    const oppEvent = events.find((e) => e.kind === 'search.opportunity.ready');
    expect(oppEvent).toBeDefined();
    if (oppEvent?.kind === 'search.opportunity.ready') {
      expect(oppEvent.opportunity.destination.name).toBe('Tuscany');
      expect(oppEvent.opportunity.destination.country).toBe('IT');
    }
  });
});
