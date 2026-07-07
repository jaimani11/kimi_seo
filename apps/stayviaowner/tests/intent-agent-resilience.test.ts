import { describe, expect, it } from 'vitest';
import { IntentAgent } from '@/agents/intent-agent';
import { coerceTripIntentShortcuts, synthesizeFallbackIntent } from '@/agents/fallback-intent';
import { TripIntentSchema } from '@core/trip-intent';
import { agentId } from '@core/ids';
import { NoOpTraceLogger } from '@lib/observability/trace-logger';
import { MockModelClient } from './helpers/mock-model-client';

/**
 * Regression coverage for the bug observed in dev:
 * Anthropic tool-use sometimes emits `dates: "unspecified"` (string)
 * instead of `dates: {kind: "unspecified"}` (object), failing Zod's
 * discriminated-union parse and bubbling up as "Stream interrupted."
 *
 * The fix is two layered:
 *   1. `coerceTripIntentShortcuts` expands the bare-string form before
 *      the model client's safeParse.
 *   2. If the call fails for any other reason, `synthesizeFallbackIntent`
 *      produces a heuristic-derived intent so the demo never blocks.
 */

describe('coerceTripIntentShortcuts', () => {
  it('expands bare-string dates to {kind: <string>}', () => {
    const out = coerceTripIntentShortcuts({ dates: 'unspecified' }) as Record<string, unknown>;
    expect(out.dates).toEqual({ kind: 'unspecified' });
  });

  it('expands bare-string budget to {kind: <string>}', () => {
    const out = coerceTripIntentShortcuts({ budget: 'unspecified' }) as Record<string, unknown>;
    expect(out.budget).toEqual({ kind: 'unspecified' });
  });

  it('parses JSON-encoded object strings (model-bug variant observed in dev)', () => {
    // The model sometimes emits `"dates": "{\"kind\":\"unspecified\"}"`
    // (a JSON string containing the object) instead of the bare object.
    const out = coerceTripIntentShortcuts({
      dates: '{"kind": "unspecified"}',
      budget: '{"kind": "total", "amount": 5000, "currency": "USD", "flexibility": "flexible"}',
    }) as Record<string, unknown>;
    expect(out.dates).toEqual({ kind: 'unspecified' });
    expect(out.budget).toEqual({
      kind: 'total',
      amount: 5000,
      currency: 'USD',
      flexibility: 'flexible',
    });
  });

  it('falls through to bare-string wrapping if JSON parse fails', () => {
    const out = coerceTripIntentShortcuts({ dates: '{not valid json}' }) as Record<string, unknown>;
    expect(out.dates).toEqual({ kind: '{not valid json}' });
  });

  it('leaves object-form dates/budget untouched', () => {
    const input = {
      dates: { kind: 'specific', start: '2026-09-01', end: '2026-09-08' },
      budget: { kind: 'total', amount: 5000, currency: 'USD', flexibility: 'flexible' },
    };
    const out = coerceTripIntentShortcuts(input) as typeof input;
    expect(out.dates).toEqual(input.dates);
    expect(out.budget).toEqual(input.budget);
  });

  it('passes through non-objects unchanged', () => {
    expect(coerceTripIntentShortcuts(null)).toBeNull();
    expect(coerceTripIntentShortcuts('foo')).toBe('foo');
    expect(coerceTripIntentShortcuts(42)).toBe(42);
    expect(coerceTripIntentShortcuts([1, 2])).toEqual([1, 2]);
  });

  it('does not mutate the input object', () => {
    const input = { dates: 'unspecified' };
    const out = coerceTripIntentShortcuts(input) as Record<string, unknown>;
    expect(out).not.toBe(input);
    expect(input.dates).toBe('unspecified');
  });
});

describe('synthesizeFallbackIntent', () => {
  it('extracts curated Italian destinations + vibe tags', () => {
    const intent = synthesizeFallbackIntent('Tuscany, slow and walkable');
    expect(TripIntentSchema.safeParse(intent).success).toBe(true);
    expect(intent.destinations[0]).toEqual({
      kind: 'curated',
      name: 'Tuscany',
      country: 'IT',
    });
    expect(intent.vibe.tags).toContain('slow');
    expect(intent.vibe.tags).toContain('walkable');
    expect(intent.dates.kind).toBe('unspecified');
    expect(intent.budget.kind).toBe('unspecified');
  });

  it('handles "family of N" → 2 adults + (N-2) children', () => {
    const intent = synthesizeFallbackIntent('Italy 7 days, family of 4, walkable');
    expect(intent.travelers.adults).toBe(2);
    expect(intent.travelers.children.count).toBe(2);
    expect(intent.travelers.groupKind).toBe('family');
    expect(intent.duration).toEqual({ nights: 7, flexible: false });
  });

  it('handles "couple" / "solo" group kinds', () => {
    expect(synthesizeFallbackIntent('Paris with my partner').travelers.groupKind).toBe('couple');
    expect(synthesizeFallbackIntent('Solo trip to Tokyo').travelers.groupKind).toBe('solo');
  });

  it('produces a valid TripIntent for an empty/unknown query', () => {
    const intent = synthesizeFallbackIntent('something completely random');
    const parse = TripIntentSchema.safeParse(intent);
    expect(parse.success).toBe(true);
    expect(intent.destinations).toEqual([]);
  });

  it('rejects banned vibe tags (only the closed taxonomy makes it through)', () => {
    const intent = synthesizeFallbackIntent('a journey to discover hidden gems');
    // None of "discover" / "journey" / "hidden gem" map to a vibe tag.
    expect(intent.vibe.tags).toEqual([]);
  });
});

describe('IntentAgent resilience integration', () => {
  it('uses coerce hook so {dates: "unspecified"} no longer kills the parse', async () => {
    const client = new MockModelClient().respondGenerate(() => ({
      destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
      // Intentionally bare-string - what the model occasionally emits
      dates: 'unspecified',
      duration: { nights: 0, flexible: true },
      travelers: { adults: 1, children: { count: 0 }, infants: 0 },
      budget: 'unspecified',
      vibe: { tags: ['slow', 'walkable'] },
      preferences: { amenities: [], avoid: [] },
      caveats: [],
      rawInput: 'Tuscany, slow and walkable',
    }));

    const ctx = {
      turnId: 't_test' as never,
      signal: new AbortController().signal,
      emit: { progress: () => {}, explanation: () => {} },
      modelClient: client,
      traceLogger: NoOpTraceLogger,
    } as never as Parameters<typeof IntentAgent.run>[1];

    const result = await IntentAgent.run({ rawInput: 'Tuscany, slow and walkable' }, ctx);
    expect(result.dates.kind).toBe('unspecified');
    expect(result.budget.kind).toBe('unspecified');
    expect(result.destinations[0]?.name).toBe('Tuscany');
  });

  it('falls back to heuristic intent when the model throws', async () => {
    const client = new MockModelClient().respondGenerate(() => {
      throw new Error('simulated upstream outage');
    });
    const ctx = {
      turnId: 't_test' as never,
      signal: new AbortController().signal,
      emit: { progress: () => {}, explanation: () => {} },
      modelClient: client,
      traceLogger: NoOpTraceLogger,
    } as never as Parameters<typeof IntentAgent.run>[1];

    const result = await IntentAgent.run({ rawInput: 'Tuscany, slow and walkable' }, ctx);
    // Heuristic intent - exact same shape, populated from rawInput.
    expect(result.destinations[0]?.name).toBe('Tuscany');
    expect(result.vibe.tags).toContain('slow');
    expect(result.dates.kind).toBe('unspecified');
  });

  it('propagates AbortError without falling back', async () => {
    const client = new MockModelClient().respondGenerate(() => {
      throw new DOMException('aborted', 'AbortError');
    });
    const ctx = {
      turnId: 't_test' as never,
      signal: new AbortController().signal,
      emit: { progress: () => {}, explanation: () => {} },
      modelClient: client,
      traceLogger: NoOpTraceLogger,
    } as never as Parameters<typeof IntentAgent.run>[1];

    await expect(IntentAgent.run({ rawInput: 'Tuscany' }, ctx)).rejects.toThrow(DOMException);
  });
});

// silence lint about unused import
void agentId;
