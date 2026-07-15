import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TripIntent } from '@core/trip-intent';
import { buildSearchOpportunity } from '@/lib/affiliate/search-opportunity-builder';

/**
 * Slice F1 - buildSearchOpportunity output contracts. The shape is the
 * wire format consumed by `<SearchOpportunityBoard>` and persisted in
 * the F1.x analytics path. Lock the public structure down.
 */

const ENV_KEYS = [
  'NEXT_PUBLIC_VIATOR_PARTNER_ID',
  'VIATOR_PARTNER_ID',
  'NEXT_PUBLIC_VIATOR_STAY_MCID',
  'VIATOR_STAY_MCID',
  'NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID',
  'NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL',
  'EXPEDIA_AFFILIATE_ID',
  'EXPEDIA_AFFILIATE_LABEL',
] as const;

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

function makeIntent(args: {
  name: string;
  country: string;
  adults?: number;
  children?: number;
  tags?: string[];
}): TripIntent {
  return {
    destinations: [{ kind: 'synthesized', name: args.name, country: args.country }],
    dates: { kind: 'specific', start: '2026-09-01', end: '2026-09-05' },
    duration: { nights: 4, flexible: false },
    travelers: {
      adults: args.adults ?? 2,
      children: { count: args.children ?? 0 },
      infants: 0,
    },
    budget: { kind: 'unspecified' },
    vibe: { tags: (args.tags ?? []) as TripIntent['vibe']['tags'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: '',
  };
}

describe('buildSearchOpportunity', () => {
  // Viator pivot: all three opportunity-board cards emit viator.com
  // destination-search URLs. The slot ids are now Viator-categorical
  // (viator-top / viator-day-trips / viator-food) so the branding
  // layer can name the card by category rather than by sub-brand.

  it('emits three cards in display order with Viator-category slot ids', async () => {
    const opp = await buildSearchOpportunity({ intent: makeIntent({ name: 'Vienna', country: 'AT' }) });
    expect(opp.providers.map((p) => p.providerId)).toEqual([
      'viator-top',
      'viator-day-trips',
      'viator-food',
    ]);
    expect(opp.providers).toHaveLength(3);
  });

  it('routes every card to viator.com (no hotel-partner hosts)', async () => {
    const opp = await buildSearchOpportunity({
      intent: makeIntent({ name: 'Vancouver', country: 'CA', adults: 4, children: 2 }),
    });
    for (const p of opp.providers) {
      expect(p.url).toMatch(/^https:\/\/www\.viator\.com\/searchResults\/all\?/);
      expect(p.url).not.toMatch(/expedia\.com|vrbo\.com|hotels\.com|booking\.com/);
    }
  });

  it('uses a category-specific text= query per slot', async () => {
    const opp = await buildSearchOpportunity({
      intent: makeIntent({ name: 'Vancouver', country: 'CA' }),
    });
    const top = opp.providers.find((p) => p.providerId === 'viator-top')!.url;
    const dayTrips = opp.providers.find((p) => p.providerId === 'viator-day-trips')!.url;
    const food = opp.providers.find((p) => p.providerId === 'viator-food')!.url;

    // "Vancouver tours" (not just "Vancouver") so Viator's destination
    // resolver doesn't match a canonical destination and 302-redirect
    // to /Vancouver/d{id}-ttd, which would strip the visible pid.
    expect(top).toContain('text=Vancouver+tours');
    expect(dayTrips).toContain('text=day+trip+from+Vancouver');
    expect(food).toContain('text=Vancouver+food+tour');
  });

  it('keeps the destination resolver from redirecting (top slot has a non-canonical query)', async () => {
    // Regression for "user clicked Agra → went to /Agra/d4547-ttd
    // without pid in the URL". A query that exactly matches a Viator
    // destination name triggers a 302; we always pair the destination
    // with a qualifier so we land on /searchResults/all instead.
    const opp = await buildSearchOpportunity({
      intent: makeIntent({ name: 'Agra', country: 'IN' }),
    });
    const top = opp.providers.find((p) => p.providerId === 'viator-top')!.url;
    expect(top).not.toMatch(/text=Agra(&|$)/);
    expect(top).toContain('text=Agra+tours');
  });

  it('attaches the Viator stay mcid to every card', async () => {
    const opp = await buildSearchOpportunity({
      intent: makeIntent({ name: 'Lisbon', country: 'PT' }),
    });
    for (const p of opp.providers) {
      expect(p.url).toContain('mcid=stayviaowner-stay');
      expect(p.url).toContain('medium=link');
    }
  });

  it('attaches the Viator pid to every card when configured', async () => {
    process.env.VIATOR_PARTNER_ID = 'P00012345';
    const opp = await buildSearchOpportunity({ intent: makeIntent({ name: 'Lisbon', country: 'PT' }) });
    for (const p of opp.providers) {
      expect(p.url).toContain('pid=P00012345');
    }
  });

  it('still produces a usable URL set without a pid (commission won’t track)', async () => {
    const opp = await buildSearchOpportunity({ intent: makeIntent({ name: 'Lisbon', country: 'PT' }) });
    for (const p of opp.providers) {
      expect(p.url).toMatch(/^https:\/\//);
      expect(p.url).not.toContain('pid=');
    }
  });

  it('does NOT append hotel-search params (dates / party size) to Viator URLs', async () => {
    // Viator's destination-search URL doesn't recognize them, and
    // adding unrecognized params can break affiliate-tag preservation
    // at the network layer.
    const opp = await buildSearchOpportunity({
      intent: makeIntent({ name: 'Vancouver', country: 'CA', adults: 4, children: 2 }),
    });
    for (const p of opp.providers) {
      expect(p.url).not.toContain('checkin=');
      expect(p.url).not.toContain('checkout=');
      expect(p.url).not.toContain('group_adults=');
      expect(p.url).not.toContain('group_children=');
    }
  });

  it('falls back to today+30 / +nights when dates are unspecified', async () => {
    const intent = makeIntent({ name: 'Lisbon', country: 'PT' });
    intent.dates = { kind: 'unspecified' };
    intent.duration = { nights: 3, flexible: true };
    const opp = await buildSearchOpportunity({ intent });
    // checkOut - checkIn should equal duration.nights.
    const checkIn = new Date(opp.intentDigest.checkIn + 'T00:00:00Z');
    const checkOut = new Date(opp.intentDigest.checkOut + 'T00:00:00Z');
    const diffNights = Math.round((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000));
    expect(diffNights).toBe(3);
  });

  it('attaches editorial flavor when provided', async () => {
    const opp = await buildSearchOpportunity({
      intent: makeIntent({ name: 'Vienna', country: 'AT' }),
      flavor: 'Coffee houses, gilt ceilings, Sundays that won’t hurry.',
    });
    expect(opp.flavor).toBe('Coffee houses, gilt ceilings, Sundays that won’t hurry.');
  });

  it('omits flavor when blank or whitespace-only', async () => {
    const opp = await buildSearchOpportunity({
      intent: makeIntent({ name: 'Vienna', country: 'AT' }),
      flavor: '   ',
    });
    expect(opp.flavor).toBeUndefined();
  });

  it('resolves a photo (URL + alt + credit) deterministically per destination', async () => {
    const a = await buildSearchOpportunity({ intent: makeIntent({ name: 'Vienna', country: 'AT' }) });
    const b = await buildSearchOpportunity({ intent: makeIntent({ name: 'Vienna', country: 'AT' }) });
    expect(a.photoUrl).toBe(b.photoUrl);
    expect(a.photoUrl).toMatch(/^https:\/\/images\.unsplash\.com/);
    expect(a.photoAlt.length).toBeGreaterThan(0);
    expect(a.photoCredit.length).toBeGreaterThan(0);
  });

  it('puts vibe tags in the intent digest verbatim', async () => {
    const opp = await buildSearchOpportunity({
      intent: makeIntent({
        name: 'Vancouver',
        country: 'CA',
        tags: ['luxury', 'walkable', 'foodie'],
      }),
    });
    expect(opp.intentDigest.vibeTags).toEqual(['luxury', 'walkable', 'foodie']);
  });
});
