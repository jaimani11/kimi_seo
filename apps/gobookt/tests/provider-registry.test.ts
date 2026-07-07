import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  _resetProviderRegistryForTesting,
  buildProviderRegistry,
  listAvailableRealProviders,
  routeProvider,
  routeProviders,
  searchWithFanout,
} from '@/providers';
import type {
  Provider,
  ProviderContext,
  ProviderSearchQuery,
  ProviderSearchResult,
} from '@core/provider';
import { providerId, stayId } from '@core/ids';
import type { Stay } from '@core/stay';
import type { TripIntent } from '@core/trip-intent';

const SAVED = [
  'BOOKING_COM_AFFILIATE_ID',
  'BOOKING_COM_API_KEY',
  'EXPEDIA_API_KEY',
  'EXPEDIA_SHARED_SECRET',
] as const;

const baseIntent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
  budget: { kind: 'unspecified' },
  vibe: { tags: [] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: '',
};

describe('availability-aware provider registry', () => {
  const saved: Partial<Record<(typeof SAVED)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const k of SAVED) saved[k] = process.env[k];
    for (const k of SAVED) delete process.env[k];
    _resetProviderRegistryForTesting();
  });

  afterEach(() => {
    for (const k of SAVED) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    _resetProviderRegistryForTesting();
  });

  it('omits Booking.com when env keys are missing', () => {
    const reg = buildProviderRegistry();
    expect(reg.real).toHaveLength(0);
    expect(listAvailableRealProviders()).toEqual([]);
  });

  it('includes Booking.com when both env keys are present', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = 'partner_42';
    process.env.BOOKING_COM_API_KEY = 'key_xyz';
    _resetProviderRegistryForTesting();
    const reg = buildProviderRegistry();
    expect(reg.real).toHaveLength(1);
    expect(reg.real[0]?.id).toBe('booking-com');
    expect(listAvailableRealProviders()).toEqual(['booking-com']);
  });

  it('routeProvider falls back to LLM synthesized when no real providers are configured', () => {
    // Slice H2 removed the MockItalyProvider fallback for Italy queries.
    // With no real providers, every destination - Italian or otherwise -
    // falls through to the dormant LLM synthesized stub.
    const p = routeProvider(baseIntent);
    expect(p.id).toBe('llm-synthesized');
  });

  it('routeProvider promotes Booking.com to first when keys are set', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = 'partner_42';
    process.env.BOOKING_COM_API_KEY = 'key_xyz';
    _resetProviderRegistryForTesting();
    const p = routeProvider(baseIntent);
    expect(p.id).toBe('booking-com');
  });

  it('routeProviders fans out real providers plus the dormant LLM fallback', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = 'partner_42';
    process.env.BOOKING_COM_API_KEY = 'key_xyz';
    _resetProviderRegistryForTesting();
    const list = routeProviders(baseIntent);
    const ids = list.map((p) => p.id as string);
    expect(ids[0]).toBe('booking-com');
    expect(ids).toContain('llm-synthesized');
  });

  it('falls back to LLM synthesized for non-Italy with no real providers', () => {
    const greeceIntent: TripIntent = {
      ...baseIntent,
      destinations: [{ kind: 'curated', name: 'Santorini', country: 'GR' }],
    };
    const p = routeProvider(greeceIntent);
    expect(p.id).toBe('llm-synthesized');
  });

  it('registers Booking.com + Expedia together when both have keys', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = 'partner_42';
    process.env.BOOKING_COM_API_KEY = 'key_xyz';
    process.env.EXPEDIA_API_KEY = 'eps_key';
    process.env.EXPEDIA_SHARED_SECRET = 'eps_secret';
    _resetProviderRegistryForTesting();
    const reg = buildProviderRegistry();
    const realIds = reg.real.map((p) => p.id as string);
    expect(realIds).toContain('booking-com');
    expect(realIds).toContain('expedia');
  });

  it('routeProviders fans out to all available real providers', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = 'partner_42';
    process.env.BOOKING_COM_API_KEY = 'key_xyz';
    process.env.EXPEDIA_API_KEY = 'eps_key';
    process.env.EXPEDIA_SHARED_SECRET = 'eps_secret';
    _resetProviderRegistryForTesting();
    const list = routeProviders(baseIntent);
    const ids = list.map((p) => p.id as string);
    expect(ids.filter((id) => id === 'booking-com')).toHaveLength(1);
    expect(ids.filter((id) => id === 'expedia')).toHaveLength(1);
  });
});

describe('searchWithFanout', () => {
  function fakeStay(provider: string, native: string, name: string): Stay {
    return {
      id: stayId(`${provider}:${native}`),
      providerId: providerId(provider),
      name,
      type: 'hotel',
      location: { country: 'IT' },
      photos: [],
      pricing: { pricePerNight: { amount: 200, currency: 'EUR' } },
      capacity: { sleeps: 2 },
      amenities: [],
      signals: { tags: [] },
      description: '',
      bookingLink: { url: 'https://example.com', type: 'redirect' },
      fetchedAt: new Date().toISOString(),
    };
  }

  function makeFakeProvider(id: string, stays: Stay[], shouldThrow = false): Provider {
    return {
      id: providerId(id),
      displayName: id,
      capabilities: {
        realtime: true,
        affiliateAttribution: false,
        supportsAvailability: false,
        supportsBooking: false,
      },
      async search(): Promise<ProviderSearchResult> {
        if (shouldThrow) throw new Error('boom');
        return {
          stays,
          badges: [{ kind: 'preview', label: id }],
          freshness: {
            fetchedAt: new Date().toISOString(),
            dataMaxAgeMs: 60_000,
            source: 'live',
          },
        };
      },
    };
  }

  const ctx: ProviderContext = {
    signal: new AbortController().signal,
    secrets: {},
  };
  const query: ProviderSearchQuery = {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: { kind: 'unspecified' },
    travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
  };

  it('merges stays from multiple providers, deduped by id', async () => {
    const a = makeFakeProvider('alpha', [
      fakeStay('alpha', 's1', 'A1'),
      fakeStay('alpha', 's2', 'A2'),
    ]);
    const b = makeFakeProvider('beta', [fakeStay('beta', 's1', 'B1')]);
    const result = await searchWithFanout([a, b], query, ctx);
    expect(result.stays).toHaveLength(3);
  });

  it('does not stall when one provider throws', async () => {
    const a = makeFakeProvider('alpha', [fakeStay('alpha', 's1', 'A1')]);
    const broken = makeFakeProvider('broken', [], true);
    const result = await searchWithFanout([broken, a], query, ctx);
    expect(result.stays).toHaveLength(1);
    expect(result.stays[0]?.name).toBe('A1');
  });

  it('returns empty result when given no providers', async () => {
    const result = await searchWithFanout([], query, ctx);
    expect(result.stays).toHaveLength(0);
  });
});
