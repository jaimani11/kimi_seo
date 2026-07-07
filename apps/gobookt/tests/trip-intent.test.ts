import { describe, expect, it } from 'vitest';
import { TripIntentSchema } from '@core/trip-intent';

const validIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'flexible-month', month: 'September', year: 2026 },
  duration: { nights: 7, flexible: false },
  travelers: {
    adults: 2,
    children: { count: 2, ages: [9, 12] },
    infants: 0,
    groupKind: 'family',
  },
  budget: { kind: 'total', amount: 6000, currency: 'USD', flexibility: 'flexible' },
  vibe: { tags: ['walkable', 'family-friendly', 'avoid-tourist-traps'] },
  preferences: { amenities: ['pool', 'breakfast'], avoid: [] },
  caveats: ['gluten-free options helpful'],
  rawInput: 'Italy 7 days, family of 4, walkable, no tourist traps',
  confidence: { destinations: 0.95, vibe: 0.78 },
};

describe('TripIntentSchema', () => {
  it('parses a valid intent', () => {
    const parsed = TripIntentSchema.parse(validIntent);
    expect(parsed.destinations[0]?.name).toBe('Tuscany');
  });

  it('rejects invalid country code', () => {
    const bad = {
      ...validIntent,
      destinations: [{ kind: 'curated', name: 'Tuscany', country: 'ITA' }],
    };
    expect(() => TripIntentSchema.parse(bad)).toThrow();
  });

  it('rejects unknown vibe tag', () => {
    const bad = { ...validIntent, vibe: { tags: ['walkable', 'unknown-vibe'] } };
    expect(() => TripIntentSchema.parse(bad)).toThrow();
  });

  it('rejects malformed dates discriminator', () => {
    const bad = { ...validIntent, dates: { kind: 'specific' } };
    expect(() => TripIntentSchema.parse(bad)).toThrow();
  });

  it('confidence is optional', () => {
    const { confidence: _confidence, ...rest } = validIntent;
    expect(() => TripIntentSchema.parse(rest)).not.toThrow();
  });
});
