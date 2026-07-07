import type { Booking, BookingDraft, OwnerKey } from '@core/booking';

/**
 * Storage seam for booking drafts + confirmed bookings.
 *
 * Slice D ships an in-memory impl (mock-safe + dev). The Postgres-
 * backed `PostgresBookingStore` lands in D.x once we have a deployed
 * DB to integration-test against. Schema is in place in `prisma/schema.prisma`.
 *
 * Owner-keyed reads. Admin reads (`listAll`) go through the same
 * interface but require admin-gated callers - the store doesn't
 * enforce that, the route does.
 */
export interface BookingStore {
  // ============== Drafts ==============
  putDraft(draft: BookingDraft): Promise<void>;
  getDraft(idempotencyKey: string): Promise<BookingDraft | null>;

  // ============== Bookings ==============
  putBooking(booking: Booking): Promise<void>;
  getBooking(args: OwnerKey & { bookingId: string }): Promise<Booking | null>;

  /**
   * Most-recent-first. Default limit 50. Owner-scoped. Used by the
   * /bookings list (D.x) + the per-owner admin view (C5 sibling).
   */
  listByOwner(args: OwnerKey & { limit?: number }): Promise<Booking[]>;

  /**
   * Most-recent-first across all owners. Default limit 100. Used by
   * `/admin/bookings`. Production traffic should NOT call this without
   * a small limit - sorting via Postgres uses an index on createdAt.
   */
  listAll(args?: { limit?: number }): Promise<Booking[]>;
}
