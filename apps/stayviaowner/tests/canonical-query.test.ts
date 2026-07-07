import { describe, expect, it } from 'vitest';
import { canonicalizeQuery } from '@/providers/_shared/canonical-query';
import type { ProviderSearchQuery } from '@core/provider';

function baseQuery(overrides: Partial<ProviderSearchQuery> = {}): ProviderSearchQuery {
  return {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: { kind: 'unspecified' },
    travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
    ...overrides,
  };
}

describe('canonicalizeQuery', () => {
  it('returns identical strings for equivalent queries', () => {
    const a = canonicalizeQuery(baseQuery());
    const b = canonicalizeQuery(baseQuery());
    expect(a).toBe(b);
  });

  it('is order-independent for destinations', () => {
    const a = canonicalizeQuery(
      baseQuery({
        destinations: [
          { kind: 'curated', name: 'Tuscany', country: 'IT' },
          { kind: 'curated', name: 'Amalfi Coast', country: 'IT' },
        ],
      }),
    );
    const b = canonicalizeQuery(
      baseQuery({
        destinations: [
          { kind: 'curated', name: 'Amalfi Coast', country: 'IT' },
          { kind: 'curated', name: 'Tuscany', country: 'IT' },
        ],
      }),
    );
    expect(a).toBe(b);
  });

  it('is order-independent for amenities', () => {
    const a = canonicalizeQuery(
      baseQuery({ preferences: { amenities: ['pool', 'wifi'], avoid: [] } }),
    );
    const b = canonicalizeQuery(
      baseQuery({ preferences: { amenities: ['wifi', 'pool'], avoid: [] } }),
    );
    expect(a).toBe(b);
  });

  it('produces different strings for different searches', () => {
    const a = canonicalizeQuery(baseQuery());
    const b = canonicalizeQuery(
      baseQuery({
        travelers: { adults: 4, children: { count: 0 }, infants: 0, groupKind: 'friends' },
      }),
    );
    expect(a).not.toBe(b);
  });

  it('ignores compareSet (ranking input, not search universe)', () => {
    const a = canonicalizeQuery(baseQuery());
    const b = canonicalizeQuery(baseQuery({ compareSet: ['mock-italy:s1'] }));
    expect(a).toBe(b);
  });
});
