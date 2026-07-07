import { beforeEach, describe, expect, it } from 'vitest';
import { _resetBillingSubsystemForTesting, getBillingSubsystem } from '@/lib/billing/factory';
import { requirePremium } from '@/lib/billing/gates';
import { getInMemorySubscriptionStore } from '@/lib/billing/in-memory-subscription-store';
import { getInMemoryWebhookEventStore } from '@/lib/billing/webhook-idempotency';
import {
  CuratedItineraryGenerator,
  SynthesizedItineraryGenerator,
} from '@/lib/itinerary/generator';
import type { SavedTrip } from '@lib/session/session-store';
import { providerId, stayId } from '@core/ids';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

/**
 * The itinerary page wraps two pieces in C4: a generator that produces
 * either a curated or synthesized itinerary, and the requirePremium
 * gate. The page renders the upgrade card iff
 *   itinerary.source === 'synthesized' && !gate.entitled
 *
 * These tests verify that decision matrix end-to-end (curated vs
 * synthesized × premium vs free × stripe vs mock).
 */

function makeTrip(args: {
  destinationName: string;
  ownerKind?: 'user' | 'session';
  ownerId?: string;
}): SavedTrip {
  const intent: TripIntent = {
    destinations: [{ kind: 'curated', name: args.destinationName, country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 5, flexible: false },
    travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
    budget: { kind: 'unspecified' },
    vibe: { tags: [] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: `${args.destinationName} 5 days`,
  };
  const proposal: TripProposal = {
    intent,
    hero: {
      id: stayId('mock:test'),
      providerId: providerId('mock'),
      name: `Hotel ${args.destinationName}`,
      type: 'hotel',
      location: { country: 'IT' },
      photos: [],
      pricing: { pricePerNight: { amount: 100, currency: 'EUR' } },
      capacity: { sleeps: 2 },
      amenities: [],
      signals: { tags: [] },
      description: '',
      bookingLink: { url: 'https://example.com', type: 'redirect' },
      fetchedAt: new Date().toISOString(),
    },
    alternatives: [],
    reasoning: { highlights: [], summary: 'Test' },
    agentTrace: { agents: [], totalDurationMs: 0 },
    generatedAt: new Date().toISOString(),
  };
  return {
    id: 'trip_test',
    ownerKind: args.ownerKind ?? 'user',
    ownerId: args.ownerId ?? 'user_alice',
    proposalId: 'p_test',
    proposalSummary: {
      destinationName: args.destinationName,
      nights: 5,
      heroStayName: `Hotel ${args.destinationName}`,
    },
    proposal,
    intent,
    bookmarkedAt: new Date().toISOString(),
  };
}

describe('itinerary gate (mock provider)', () => {
  const gen = new CuratedItineraryGenerator(new SynthesizedItineraryGenerator());

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_ID;
    _resetBillingSubsystemForTesting();
    getInMemorySubscriptionStore()._reset();
    getInMemoryWebhookEventStore()._reset();
    getBillingSubsystem();
  });

  it('curated destination → page never reaches the gate (source !== synthesized)', async () => {
    const trip = makeTrip({ destinationName: 'Tuscany' });
    const itin = await gen.generate(trip);
    expect(itin.source).toBe('curated');
    // The page logic: `if (itinerary.source === 'synthesized') { gate-check }`.
    // Curated short-circuits before the gate fires.
    expect(itin.source === 'synthesized').toBe(false);
  });

  it("alias resolution still hits curated ('Florence' → Tuscany template)", async () => {
    const trip = makeTrip({ destinationName: 'Florence' });
    const itin = await gen.generate(trip);
    expect(itin.source).toBe('curated');
  });

  it('synthesized destination + anonymous owner → gate returns reason=anonymous', async () => {
    const trip = makeTrip({
      destinationName: 'Tokyo', // not in curated library
      ownerKind: 'session',
      ownerId: 'anon_test',
    });
    const itin = await gen.generate(trip);
    expect(itin.source).toBe('synthesized');
    const gate = await requirePremium({
      ownerKind: 'session',
      ownerId: 'anon_test',
    });
    expect(gate.entitled).toBe(false);
    if (!gate.entitled) expect(gate.reason).toBe('anonymous');
  });

  it('synthesized destination + authenticated user (mock mode) → gate grants premium', async () => {
    const trip = makeTrip({
      destinationName: 'Tokyo',
      ownerKind: 'user',
      ownerId: 'user_premium_in_mock',
    });
    const itin = await gen.generate(trip);
    expect(itin.source).toBe('synthesized');
    const gate = await requirePremium({
      ownerKind: 'user',
      ownerId: 'user_premium_in_mock',
    });
    expect(gate.entitled).toBe(true);
    if (gate.entitled) expect(gate.entitlement.source).toBe('mock-everyone-premium');
  });
});

describe('itinerary gate (stripe mode)', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_for_gate_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_for_gate_test';
    process.env.STRIPE_PRICE_ID = 'price_test_for_gate_test';
    _resetBillingSubsystemForTesting();
    getInMemorySubscriptionStore()._reset();
    getInMemoryWebhookEventStore()._reset();
  });

  it('synthesized destination + free authed user → gate returns reason=free', async () => {
    const sub = getBillingSubsystem();
    expect(sub.kind).toBe('stripe');
    const gate = await requirePremium({ ownerKind: 'user', ownerId: 'user_no_sub' });
    expect(gate.entitled).toBe(false);
    if (!gate.entitled) expect(gate.reason).toBe('free');
    if (!gate.entitled) expect(gate.entitlement.source).toBe('free');
  });
});
