import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BookingError, type BookingDraft } from '@/core/booking';
import { MockBookingProvider } from '@/lib/booking/mock-booking-provider';

function makeDraft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return {
    id: 'bkd_test',
    idempotencyKey: 'bk_test_one',
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

describe('MockBookingProvider', () => {
  let provider: MockBookingProvider;

  beforeEach(() => {
    provider = new MockBookingProvider();
    delete process.env.STAYSCOUT_BOOKING_FAIL;
  });

  afterEach(() => {
    delete process.env.STAYSCOUT_BOOKING_FAIL;
  });

  it('book(draft) returns a confirmed booking with provider ref', async () => {
    const booking = await provider.book(makeDraft());
    expect(booking.status).toBe('confirmed');
    expect(booking.providerBookingRef).toMatch(/^mock_/);
    expect(booking.confirmedAt).toBeTruthy();
    expect(booking.idempotencyKey).toBe('bk_test_one');
    expect(booking.failureReason).toBeNull();
  });

  it('book is idempotent on idempotencyKey: same key, same booking', async () => {
    const a = await provider.book(makeDraft());
    const b = await provider.book(makeDraft());
    expect(a.id).toBe(b.id);
    expect(a.providerBookingRef).toBe(b.providerBookingRef);
  });

  it('different idempotencyKeys produce distinct bookings', async () => {
    const a = await provider.book(makeDraft({ idempotencyKey: 'bk_a' }));
    const b = await provider.book(makeDraft({ idempotencyKey: 'bk_b' }));
    expect(a.id).not.toBe(b.id);
    expect(a.providerBookingRef).not.toBe(b.providerBookingRef);
  });

  it('cancel flips status to canceled and stamps canceledAt', async () => {
    const booked = await provider.book(makeDraft());
    const ref = booked.providerBookingRef!;
    const canceled = await provider.cancel({ bookingId: ref });
    expect(canceled.status).toBe('canceled');
    expect(canceled.canceledAt).toBeTruthy();
    expect(canceled.id).toBe(booked.id);
  });

  it('cancel is idempotent: second call returns the canceled booking unchanged', async () => {
    const booked = await provider.book(makeDraft());
    const ref = booked.providerBookingRef!;
    const first = await provider.cancel({ bookingId: ref });
    const second = await provider.cancel({ bookingId: ref });
    expect(second.status).toBe('canceled');
    expect(second.canceledAt).toBe(first.canceledAt);
  });

  it('cancel for unknown ref throws BookingError(unknown-booking)', async () => {
    await expect(provider.cancel({ bookingId: 'mock_does_not_exist' })).rejects.toBeInstanceOf(
      BookingError,
    );
  });

  it('getBooking returns the booking by ref', async () => {
    const booked = await provider.book(makeDraft());
    const got = await provider.getBooking(booked.providerBookingRef!);
    expect(got?.id).toBe(booked.id);
  });

  it('getBooking returns null for unknown ref', async () => {
    expect(await provider.getBooking('mock_unknown')).toBeNull();
  });

  it('STAYSCOUT_BOOKING_FAIL=1 makes the next book throw, then self-clears', async () => {
    process.env.STAYSCOUT_BOOKING_FAIL = '1';
    await expect(provider.book(makeDraft())).rejects.toBeInstanceOf(BookingError);
    // Env is auto-cleared, so the retry succeeds.
    const retry = await provider.book(makeDraft());
    expect(retry.status).toBe('confirmed');
  });
});
