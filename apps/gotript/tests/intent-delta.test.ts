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
