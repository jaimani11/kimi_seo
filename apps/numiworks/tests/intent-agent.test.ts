import { describe, expect, it } from 'vitest';
import { IntentAgent } from '@/agents/intent-agent';
import type { AgentContext } from '@core/agent';
import { turnId } from '@core/ids';
import type { TripIntent } from '@core/trip-intent';
import { MockModelClient } from './helpers/mock-model-client';

function fakeContext(client: MockModelClient): AgentContext {
  return {
    turnId: turnId('t-test'),
    signal: new AbortController().signal,
    emit: {
      progress: () => {},
      explanation: () => {},
    },
    modelClient: client,
    traceLogger: {
      recordEvent: () => {},
      recordAgentRun: () => {},
    },
  };
}

const validIntent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Italy', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
  budget: { kind: 'total', amount: 6000, currency: 'USD', flexibility: 'flexible' },
  vibe: { tags: ['walkable', 'family-friendly', 'avoid-tourist-traps'] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'this will be overwritten by the agent',
};

describe('IntentAgent', () => {
  it('returns the model output validated by TripIntentSchema', async () => {
    const client = new MockModelClient().respondGenerate(() => validIntent);
    const result = await IntentAgent.run(
      { rawInput: 'Italy 7 days, family of 4, walkable, no tourist traps' },
      fakeContext(client),
    );
    expect(result.destinations[0]?.country).toBe('IT');
    expect(result.travelers.groupKind).toBe('family');
  });

  it('overwrites rawInput on the result with the input rawInput verbatim', async () => {
    const original = 'Italy 7 days, family of 4';
    const client = new MockModelClient().respondGenerate(() => validIntent);
    const result = await IntentAgent.run({ rawInput: original }, fakeContext(client));
    expect(result.rawInput).toBe(original);
    expect(result.rawInput).not.toBe(validIntent.rawInput);
  });

  it('passes responseSchema through to the model client (tool-use enforcement)', async () => {
    const client = new MockModelClient().respondGenerate(() => validIntent);
    await IntentAgent.run({ rawInput: 'whatever' }, fakeContext(client));
    const call = client.calls.generate[0];
    expect(call?.responseSchema).toBeDefined();
  });

  it('uses claude-haiku-4-5 by default', async () => {
    const client = new MockModelClient().respondGenerate(() => validIntent);
    await IntentAgent.run({ rawInput: 'whatever' }, fakeContext(client));
    expect(client.calls.generate[0]?.model).toBe('claude-haiku-4-5');
  });

  it('builds a refine prompt when priorIntent is provided', async () => {
    const client = new MockModelClient().respondGenerate(() => validIntent);
    const prior: TripIntent = { ...validIntent, rawInput: 'original prompt' };
    await IntentAgent.run({ rawInput: 'less touristy', priorIntent: prior }, fakeContext(client));
    const userMsg = (client.calls.generate[0]?.messages[0]?.content ?? '') as string;
    expect(userMsg).toContain('REFINING');
    expect(userMsg).toContain('less touristy');
  });

  it('emits progress with appropriate label', async () => {
    const client = new MockModelClient().respondGenerate(() => validIntent);
    const messages: string[] = [];
    const ctx: AgentContext = {
      ...fakeContext(client),
      emit: { progress: (m) => messages.push(m), explanation: () => {} },
    };
    await IntentAgent.run({ rawInput: 'a' }, ctx);
    expect(messages[0]).toMatch(/Reading|trip/);

    messages.length = 0;
    await IntentAgent.run({ rawInput: 'b', priorIntent: validIntent }, ctx);
    expect(messages[0]).toMatch(/Adjusting/);
  });

  it('records the agent run via traceLogger', async () => {
    const client = new MockModelClient().respondGenerate(() => validIntent);
    const runs: { agent: string; durationMs: number }[] = [];
    const ctx: AgentContext = {
      ...fakeContext(client),
      traceLogger: {
        recordEvent: () => {},
        recordAgentRun: (agent, _input, _output, durationMs) => runs.push({ agent, durationMs }),
      },
    };
    await IntentAgent.run({ rawInput: 'a' }, ctx);
    expect(runs.length).toBe(1);
    expect(runs[0]?.agent).toBe('intent');
    expect(runs[0]?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('falls back to a heuristic intent when model output fails schema', async () => {
    // Resilience contract (Slice B post-bugfix): the agent NEVER throws
    // on a malformed model response. It logs a warning and returns a
    // synthesized intent so the demo can still progress. The path that
    // previously threw is exercised here.
    const client = new MockModelClient().respondGenerate(() => ({ destinations: 'not-array' }));
    const result = await IntentAgent.run({ rawInput: 'Tuscany, slow' }, fakeContext(client));
    // Heuristic fallback recognised "Tuscany" as a curated destination.
    expect(result.destinations[0]?.name).toBe('Tuscany');
    expect(result.dates.kind).toBe('unspecified');
    expect(result.budget.kind).toBe('unspecified');
    expect(result.rawInput).toBe('Tuscany, slow');
  });
});
