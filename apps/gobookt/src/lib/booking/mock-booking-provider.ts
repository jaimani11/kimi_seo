import { BookingError, mintBookingId, type Booking, type BookingDraft } from '@core/booking';
import type { BookingProvider } from './booking-provider';

/**
 * Slice D default - every authed user can complete the full booking
 * flow without keys. Real provider booking integrations land in D.x
 * behind the same interface.
 *
 * Idempotency: holds a `Map<idempotencyKey, Booking>` in-process so
 * `book()` truly is idempotent on the user's confirm click. Restart
 * clears it; the persistent dedup lives in `BookingStore` (also
 * in-process in Slice D, Postgres in D.x).
 *
 * Failure simulation: setting `STAYSCOUT_BOOKING_FAIL=1` makes the
 * next `book()` call throw `BookingError('provider-error')` (then
 * the variable self-clears so a retry succeeds). Useful for manually
 * exercising the failure path without writing live integration tests.
 */
export class MockBookingProvider implements BookingProvider {
  readonly kind = 'mock' as const;

  private readonly bookingsByKey = new Map<string, Booking>();
  private readonly bookingsByRef = new Map<string, Booking>();

  async book(draft: BookingDraft): Promise<Booking> {
    // Idempotency check FIRST - so a retry of a successful book never
    // double-creates, even if the env failure flag is set.
    const existing = this.bookingsByKey.get(draft.idempotencyKey);
    if (existing) return existing;

    if (process.env.STAYSCOUT_BOOKING_FAIL === '1') {
      // Self-clear so the next call succeeds - convenient for manual
      // testing of the "first try fails, retry works" path.
      delete process.env.STAYSCOUT_BOOKING_FAIL;
      throw new BookingError('provider-error', 'mock provider was instructed to fail on this call');
    }

    const ref = `mock_${cryptoRandom()}`;
    const now = new Date().toISOString();
    const booking: Booking = {
      id: mintBookingId(),
      idempotencyKey: draft.idempotencyKey,
      ownerKind: draft.ownerKind,
      ownerId: draft.ownerId,
      savedTripId: draft.savedTripId,
      stayId: draft.stayId,
      providerId: draft.providerId,
      providerBookingRef: ref,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      nights: draft.nights,
      traveler: draft.traveler,
      total: draft.total,
      cancellation: draft.cancellation,
      status: 'confirmed',
      confirmedAt: now,
      canceledAt: null,
      failureReason: null,
    };
    this.bookingsByKey.set(draft.idempotencyKey, booking);
    this.bookingsByRef.set(ref, booking);
    return booking;
  }

  async cancel(args: { bookingId: string; reason?: string }): Promise<Booking> {
    const found = this.bookingsByRef.get(args.bookingId);
    if (!found) {
      throw new BookingError('unknown-booking', `mock provider has no booking ${args.bookingId}`);
    }
    if (found.status === 'canceled') {
      // Idempotent: second cancel returns the same object.
      return found;
    }
    const canceled: Booking = {
      ...found,
      status: 'canceled',
      canceledAt: new Date().toISOString(),
    };
    this.bookingsByKey.set(found.idempotencyKey, canceled);
    this.bookingsByRef.set(args.bookingId, canceled);
    return canceled;
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    return this.bookingsByRef.get(bookingId) ?? null;
  }

  /** Test-only - wipe state. */
  _reset(): void {
    this.bookingsByKey.clear();
    this.bookingsByRef.clear();
  }
}

function cryptoRandom(): string {
  return (
    globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 16) ??
    Math.random().toString(36).slice(2, 18)
  );
}
