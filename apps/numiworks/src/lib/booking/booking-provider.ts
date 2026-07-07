import type { Booking, BookingDraft } from '@core/booking';

/**
 * Single seam between booking logic and the underlying provider.
 *
 * Slice D ships only `MockBookingProvider`. D.x adds real-mode impls
 * (`BookingComBookingProvider`, `ExpediaBookingProvider`) behind the
 * same interface. Switching is one factory line, gated by the existing
 * provider keys + a new `STAYSCOUT_LIVE_BOOKING=1` opt-in.
 *
 * All three methods are owner-blind - gating + ownership are the
 * agent's + route handler's responsibility. The provider just talks
 * to its remote (or in mock mode, an in-memory map).
 */
export interface BookingProvider {
  readonly kind: 'mock' | 'booking-com' | 'expedia';

  /**
   * Idempotent on `draft.idempotencyKey`. Re-calling with the same
   * key returns the same `Booking` (matches the user's confirm-click
   * semantic). Throws `BookingError('provider-error')` on remote
   * failure; the agent maps that to a `failed` Booking row in the
   * store so admins can see what was attempted.
   */
  book(draft: BookingDraft): Promise<Booking>;

  /**
   * Idempotent. Second call returns the already-canceled booking
   * unchanged. Throws `BookingError('not-cancelable')` if the
   * provider rejects (e.g. policy violation that the local
   * `isCancelable()` check missed).
   */
  cancel(args: { bookingId: string; reason?: string }): Promise<Booking>;

  /** Provider-side authoritative read. Returns null for unknown ids. */
  getBooking(bookingId: string): Promise<Booking | null>;
}
