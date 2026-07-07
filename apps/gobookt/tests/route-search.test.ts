import { describe, expect, it } from 'vitest';
import type { Provider } from '@core/provider';
import { providerId } from '@core/ids';
import type { TripIntent } from '@core/trip-intent';
import { routeForIntent } from '@/orchestrator/route-search';

/**
 * Slice F1 - routeForIntent semantics. The router decides inventory vs
 * opportunity. These tests pin the decision matrix so future provider
 * additions don't accidentally re-enable fake-hotel paths.
 */

function makeIntent(destination: { name: string; country: string }): TripIntent {
  return {
    destinations: [{ kind: 'curated', name: destination.name, country: destination.country }],
    dates: { kind: 'unspecified' },
    duration: { nights: 4, flexible: true },
    travelers: { adults: 2, children: { count: 0 }, infants: 0 },
    budget: { kind: 'unspecified' },
    vibe: { tags: [] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: '',
  };
}

const fakeProvider = (id: string, regions?: string[]): Provider =>
  ({
    id: providerId(id),
    displayName: id,
    capabilities: {
      realtime: true,
      affiliateAttribution: true,
      supportsAvailability: true,
      supportsBooking: false,
      ...(regions ? { regions } : {}),
    },
    async search() {
      throw new Error('not implemented');
    },
  }) as Provider;

describe('routeForIntent', () => {
  it('routes Italian destination to opportunity when no real providers cover it', () => {
    // Slice H2 - MockItalyProvider was removed. With no real Italy
    // provider configured, every Italian destination now routes to the
    // opportunity branch (partner-search cards + live Viator rail).
    const decision = routeForIntent(makeIntent({ name: 'Tuscany', country: 'IT' }), { real: [] });
    expect(decision.kind).toBe('opportunity');
    if (decision.kind !== 'opportunity') return;
    expect(decision.destination.name).toBe('Tuscany');
    expect(decision.destination.country).toBe('IT');
  });

  it('routes unknown Austrian destination to opportunity when no real providers configured', () => {
    const decision = routeForIntent(makeIntent({ name: 'St. Anton', country: 'AT' }), {
      real: [],
    });
    expect(decision.kind).toBe('opportunity');
    if (decision.kind !== 'opportunity') return;
    expect(decision.destination.name).toBe('St. Anton');
    expect(decision.destination.country).toBe('AT');
  });

  it('uses a global real provider (no regions field) for any destination', () => {
    const globalProvider = fakeProvider('booking-com'); // no regions = global
    const decision = routeForIntent(makeIntent({ name: 'Vancouver', country: 'CA' }), {
      real: [globalProvider],
    });
    expect(decision.kind).toBe('inventory');
    if (decision.kind !== 'inventory') return;
    expect(decision.providers).toHaveLength(1);
    expect(decision.providers[0]?.id).toBe('booking-com');
  });

  it('filters region-scoped providers by country', () => {
    const itOnly = fakeProvider('expedia', ['IT']);
    const usOnly = fakeProvider('vrbo', ['US']);
    const decision = routeForIntent(makeIntent({ name: 'Berlin', country: 'DE' }), {
      real: [itOnly, usOnly],
    });
    // Neither matches Germany → opportunity.
    expect(decision.kind).toBe('opportunity');
  });

  it('routes Italian destination to a real global provider when one is configured', () => {
    const globalProvider = fakeProvider('booking-com');
    const decision = routeForIntent(makeIntent({ name: 'Tuscany', country: 'IT' }), {
      real: [globalProvider],
    });
    expect(decision.kind).toBe('inventory');
    if (decision.kind !== 'inventory') return;
    expect(decision.providers.map((p) => p.id as string)).toEqual(['booking-com']);
  });

  it('routes to opportunity (with synthesized destination) when intent has no destinations', () => {
    const intent: TripIntent = {
      ...makeIntent({ name: 'placeholder', country: 'US' }),
      destinations: [],
    };
    const decision = routeForIntent(intent, { real: [] });
    expect(decision.kind).toBe('opportunity');
  });
});
