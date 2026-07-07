import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryBookingStore } from '@/lib/booking/in-memory-booking-store';
import type { Booking, BookingDraft } from '@/core/booking';

function makeDraft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return {
    id: 'bkd_test',
    idempotencyKey: 'bk_test',
    ownerKind: 'user',
    ownerId: 'user_alice',
    savedTripId: 'trip_test',
    stayId: 'mock-italy:hotel_1',
    providerId: 'mock-italy',
    checkIn: '2026-09-01',
    checkOut: '2026-09-05',
    nights: 4,
    traveler: {
      primaryName: 'Alice Q',
      email: 'alice@example.com',
      guestCount: { adults: 2, children: 0, infants: 0 },
    },
    total: { amount: 800, currency: 'EUR' },
    cancellation: {
      kind: 'free-until',
      freeUntil: '2099-08-25T00:00:00.000Z',
      description: 'Cancel free until 7 days before check-in.',
    },
    placeholderDates: false,
    createdAt: '2026-05-09T00:00:00.000Z',
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'bok_test',
    idempotencyKey: 'bk_test',
    ownerKind: 'user',
    ownerId: 'user_alice',
    savedTripId: 'trip_test',
    stayId: 'mock-italy:hotel_1',
    providerId: 'mock-italy',
    providerBookingRef: 'mock_ref_test',
    checkIn: '2026-09-01',
    checkOut: '2026-09-05',
    nights: 4,
    traveler: {
      primaryName: 'Alice Q',
      email: 'alice@example.com',
      guestCount: { adults: 2, children: 0, infants: 0 },
    },
    total: { amount: 800, currency: 'EUR' },
    cancellation: {
      kind: 'free-until',
      freeUntil: '2099-08-25T00:00:00.000Z',
      description: 'Cancel free until 7 days before check-in.',
    },
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    canceledAt: null,
    failureReason: null,
    ...overrides,
  };
}

describe('InMemoryBookingStore', () => {
  let store: InMemoryBookingStore;

  beforeEach(() => {
    store = new InMemoryBookingStore();
  });

  it('round-trips a draft by idempotencyKey', async () => {
    const draft = makeDraft({ idempotencyKey: 'bk_round' });
    await store.putDraft(draft);
    const got = await store.getDraft('bk_round');
    expect(got?.idempotencyKey).toBe('bk_round');
  });

  it('returns null for unknown draft key', async () => {
    expect(await store.getDraft('bk_unknown')).toBeNull();
  });

  it('round-trips a booking by id, owner-gated', async () => {
    const booking = makeBooking({ id: 'bok_a' });
    await store.putBooking(booking);
    const got = await store.getBooking({
      ownerKind: 'user',
      ownerId: 'user_alice',
      bookingId: 'bok_a',
    });
    expect(got?.id).toBe('bok_a');
  });

  it('returns null when the requested booking belongs to a different owner', async () => {
    await store.putBooking(makeBooking({ id: 'bok_b' }));
    const got = await store.getBooking({
      ownerKind: 'user',
      ownerId: 'user_other',
      bookingId: 'bok_b',
    });
    expect(got).toBeNull();
  });

  it('listByOwner returns most-recent-first', async () => {
    await store.putBooking(
      makeBooking({ id: 'bok_first', confirmedAt: '2026-05-09T00:00:00.000Z' }),
    );
    await store.putBooking(
      makeBooking({ id: 'bok_second', confirmedAt: '2026-05-09T01:00:00.000Z' }),
    );
    const list = await store.listByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(list.map((b) => b.id)).toEqual(['bok_second', 'bok_first']);
  });

  it('listByOwner honors limit', async () => {
    for (let i = 0; i < 5; i += 1) {
      await store.putBooking(makeBooking({ id: `bok_${i}`, idempotencyKey: `bk_${i}` }));
    }
    const list = await store.listByOwner({
      ownerKind: 'user',
      ownerId: 'user_alice',
      limit: 2,
    });
    expect(list).toHaveLength(2);
  });

  it('listAll spans owners, most-recent-first', async () => {
    await store.putBooking(
      makeBooking({
        id: 'bok_alice',
        ownerId: 'user_alice',
        confirmedAt: '2026-05-09T00:00:00.000Z',
      }),
    );
    await store.putBooking(
      makeBooking({
        id: 'bok_bob',
        idempotencyKey: 'bk_bob',
        ownerId: 'user_bob',
        confirmedAt: '2026-05-09T01:00:00.000Z',
      }),
    );
    const list = await store.listAll();
    expect(list.map((b) => b.id)).toEqual(['bok_bob', 'bok_alice']);
  });

  it('putBooking updates an existing row in place (no duplicate in owner bucket)', async () => {
    await store.putBooking(makeBooking({ id: 'bok_x', status: 'confirmed' }));
    await store.putBooking(
      makeBooking({ id: 'bok_x', status: 'canceled', canceledAt: new Date().toISOString() }),
    );
    const list = await store.listByOwner({ ownerKind: 'user', ownerId: 'user_alice' });
    expect(list).toHaveLength(1);
    expect(list[0]?.status).toBe('canceled');
  });
});
