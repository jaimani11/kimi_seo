import { beforeEach, describe, expect, it } from 'vitest';
import { BookingAgent } from '@/agents/booking-agent';
import { MockBookingProvider } from '@/lib/booking/mock-booking-provider';
import { InMemoryBookingStore } from '@/lib/booking/in-memory-booking-store';
import { BookingError, type TravelerInfo } from '@/core/booking';
import type { SavedTrip } from '@lib/session/session-store';
import { providerId, stayId } from '@core/ids';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

const traveler: TravelerInfo = {
  primaryName: 'Alice Q',
  email: 'alice@example.com',
  guestCount: { adults: 2, children: 0, infants: 0 },
};

function makeTrip(
  opts: {
    withSpecificDates?: boolean;
    totalForStay?: number;
    ownerKind?: 'user' | 'session';
    ownerId?: string;
    nights?: number;
  } = {},
): SavedTrip {
  const nights = opts.nights ?? 4;
  const intent: TripIntent = {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: opts.withSpecificDates
      ? { kind: 'specific', start: '2026-09-01', end: '2026-09-05' }
      : { kind: 'unspecified' },
    duration: { nights, flexible: false },
    travelers: { adults: 2, children: { count: 0 }, infants: 0, groupKind: 'couple' },
    budget: { kind: 'unspecified' },
    vibe: { tags: [] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'Tuscany, slow and walkable',
  };
  const proposal: TripProposal = {
    intent,
    hero: {
      id: stayId('mock-italy:hotel_test'),
      providerId: providerId('mock-italy'),
      name: 'Test Hotel',
      type: 'hotel',
      location: { country: 'IT' },
      photos: [],
      pricing: {
        pricePerNight: { amount: 200, currency: 'EUR' },
        ...(opts.totalForStay
          ? { totalForStay: { amount: opts.totalForStay, currency: 'EUR', nights } }
          : {}),
      },
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
    ownerKind: opts.ownerKind ?? 'user',
    ownerId: opts.ownerId ?? 'user_alice',
    proposalId: 'p_test',
    proposalSummary: { destinationName: 'Tuscany', nights, heroStayName: 'Test Hotel' },
    proposal,
    intent,
    bookmarkedAt: new Date().toISOString(),
  };
}

describe('BookingAgent', () => {
  let provider: MockBookingProvider;
  let store: InMemoryBookingStore;
  let agent: BookingAgent;

  beforeEach(() => {
    provider = new MockBookingProvider();
    store = new InMemoryBookingStore();
    agent = new BookingAgent(provider, store);
  });

  it('draft from a trip with specific dates → exact checkIn/checkOut, computed total', async () => {
    const trip = makeTrip({ withSpecificDates: true });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    expect(draft.checkIn).toBe('2026-09-01');
    expect(draft.checkOut).toBe('2026-09-05');
    expect(draft.nights).toBe(4);
    expect(draft.placeholderDates).toBe(false);
    // 200 EUR/night × 4 nights = 800 EUR
    expect(draft.total.amount).toBe(800);
    expect(draft.total.currency).toBe('EUR');
  });

  it('draft from a trip without specific dates → placeholderDates=true with synthesized dates', async () => {
    const trip = makeTrip({ withSpecificDates: false, nights: 5 });
    const now = new Date('2026-05-09T00:00:00.000Z');
    const draft = await agent.draftBooking({ savedTrip: trip, traveler, now });
    expect(draft.placeholderDates).toBe(true);
    expect(draft.nights).toBe(5);
    // 30 days from 2026-05-09 = 2026-06-08
    expect(draft.checkIn).toBe('2026-06-08');
    // checkIn + 5 nights = 2026-06-13
    expect(draft.checkOut).toBe('2026-06-13');
  });

  it('draft uses totalForStay when present (overriding pricePerNight × nights)', async () => {
    const trip = makeTrip({ withSpecificDates: true, totalForStay: 750, nights: 4 });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    expect(draft.total.amount).toBe(750);
  });

  it('confirm with valid idempotencyKey returns a confirmed booking with provider ref', async () => {
    const trip = makeTrip({ withSpecificDates: true });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    const booking = await agent.confirmBooking({
      ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
      idempotencyKey: draft.idempotencyKey,
    });
    expect(booking.status).toBe('confirmed');
    expect(booking.providerBookingRef).toMatch(/^mock_/);
    expect(booking.idempotencyKey).toBe(draft.idempotencyKey);
  });

  it('confirm is idempotent: same idempotencyKey twice → same booking', async () => {
    const trip = makeTrip({ withSpecificDates: true });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    const a = await agent.confirmBooking({
      ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
      idempotencyKey: draft.idempotencyKey,
    });
    const b = await agent.confirmBooking({
      ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
      idempotencyKey: draft.idempotencyKey,
    });
    expect(a.id).toBe(b.id);
    expect(a.providerBookingRef).toBe(b.providerBookingRef);
  });

  it('confirm with unknown idempotencyKey throws BookingError(unknown-draft)', async () => {
    await expect(
      agent.confirmBooking({
        ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
        idempotencyKey: 'bk_does_not_exist',
      }),
    ).rejects.toBeInstanceOf(BookingError);
  });

  it('confirm with foreign ownerKey throws BookingError(not-owner)', async () => {
    const trip = makeTrip({ withSpecificDates: true });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    await expect(
      agent.confirmBooking({
        ownerKey: { ownerKind: 'user', ownerId: 'user_someone_else' },
        idempotencyKey: draft.idempotencyKey,
      }),
    ).rejects.toBeInstanceOf(BookingError);
  });

  it('cancel a confirmed booking flips status + sets canceledAt', async () => {
    const trip = makeTrip({ withSpecificDates: true });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    const booking = await agent.confirmBooking({
      ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
      idempotencyKey: draft.idempotencyKey,
    });
    const canceled = await agent.cancelBooking({
      ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
      bookingId: booking.id,
    });
    expect(canceled.status).toBe('canceled');
    expect(canceled.canceledAt).toBeTruthy();
    expect(canceled.id).toBe(booking.id); // our id, not provider ref
  });

  it('cancel after free-until passes throws BookingError(not-cancelable)', async () => {
    const trip = makeTrip({ withSpecificDates: true });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    const booking = await agent.confirmBooking({
      ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
      idempotencyKey: draft.idempotencyKey,
    });
    // checkIn=2026-09-01, free-until = 2026-08-25, "now" past that.
    await expect(
      agent.cancelBooking({
        ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
        bookingId: booking.id,
        now: new Date('2026-08-30T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BookingError);
  });

  it('a provider failure persists a failed Booking row and rethrows', async () => {
    const trip = makeTrip({ withSpecificDates: true });
    const draft = await agent.draftBooking({ savedTrip: trip, traveler });
    process.env.STAYSCOUT_BOOKING_FAIL = '1';
    await expect(
      agent.confirmBooking({
        ownerKey: { ownerKind: 'user', ownerId: 'user_alice' },
        idempotencyKey: draft.idempotencyKey,
      }),
    ).rejects.toBeInstanceOf(BookingError);
    delete process.env.STAYSCOUT_BOOKING_FAIL;

    // The failed attempt is in the store so admins can see it.
    const all = await store.listAll();
    const failed = all.find((b) => b.status === 'failed');
    expect(failed).toBeDefined();
    expect(failed?.failureReason).toContain('mock provider was instructed to fail');
    expect(failed?.providerBookingRef).toBeNull();
  });
});
