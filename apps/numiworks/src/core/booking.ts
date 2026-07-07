import { z } from 'zod';

/**
 * Slice D - Booking core types.
 *
 * Bookings produce real, irreversible side effects. The shapes here
 * are designed for that:
 *
 *   - `idempotencyKey` is the user's confirm-click token. Stamped
 *     onto the draft at draft-time; the confirm endpoint requires it;
 *     the provider's `book()` is idempotent on it. Double-clicks
 *     coalesce to one booking. Mirrors C4's webhook-event-id pattern.
 *
 *   - `BookingStatus` mirrors the lifecycle. Drafts are pre-confirm;
 *     bookings are post-provider. `failed` exists for the provider-
 *     errored path; admin can see + replay it.
 *
 *   - Dates are ISO strings on the wire so the BookingDraft serializes
 *     cleanly. The Zod schemas keep them as strings; helpers in this
 *     module convert when comparing.
 *
 *   - `OwnerKey` shape (re-defined here, not imported from auth) keeps
 *     the core layer free of lib dependencies - same approach as
 *     `@core/billing`. Structural typing means `ownerOf()` results
 *     drop in without ceremony.
 */

// ============== Owner ==============

export const OwnerKindSchema = z.enum(['user', 'session']);
export type OwnerKind = z.infer<typeof OwnerKindSchema>;

export const OwnerKeySchema = z.object({
  ownerKind: OwnerKindSchema,
  ownerId: z.string().min(1),
});
export type OwnerKey = z.infer<typeof OwnerKeySchema>;

// ============== Status ==============

export const BookingStatusSchema = z.enum(['draft', 'confirmed', 'canceled', 'failed']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

// ============== Cancellation policy ==============

/**
 * Three shapes a real provider's cancellation policy maps onto:
 *   - `free-until`  - full refund if canceled before `freeUntil` (most common).
 *   - `partial-refund` - flat percentage refund regardless of timing.
 *   - `non-refundable` - no refund possible. (Admin still allows mark-as-canceled
 *     for record-keeping; the user's money is gone.)
 *
 * `description` is the human-readable line shown in the modal - providers
 * give this verbatim; the kind + numeric fields are the structured form
 * we evaluate `isCancelable()` against.
 */
export const CancellationPolicySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('free-until'),
    freeUntil: z.string().datetime(),
    description: z.string().min(1).max(280),
  }),
  z.object({
    kind: z.literal('partial-refund'),
    refundPercent: z.number().min(0).max(100),
    description: z.string().min(1).max(280),
  }),
  z.object({
    kind: z.literal('non-refundable'),
    description: z.string().min(1).max(280),
  }),
]);
export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>;

// ============== Traveler ==============

export const GuestCountSchema = z.object({
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  infants: z.number().int().min(0).max(10),
});
export type GuestCount = z.infer<typeof GuestCountSchema>;

export const TravelerInfoSchema = z.object({
  primaryName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  guestCount: GuestCountSchema,
});
export type TravelerInfo = z.infer<typeof TravelerInfoSchema>;

// ============== Money ==============

export const MoneySchema = z.object({
  amount: z.number().min(0),
  currency: z.string().length(3),
});
export type Money = z.infer<typeof MoneySchema>;

// ============== Draft ==============

export const BookingDraftSchema = z.object({
  id: z.string().min(1),
  idempotencyKey: z.string().min(1),
  ownerKind: OwnerKindSchema,
  ownerId: z.string().min(1),
  savedTripId: z.string().min(1),
  stayId: z.string().min(1),
  providerId: z.string().min(1),
  /** ISO date - `YYYY-MM-DD` granularity is fine, but full ISO strings
   *  are the shape we receive from the saved trip. */
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  nights: z.number().int().min(1).max(365),
  traveler: TravelerInfoSchema,
  total: MoneySchema,
  cancellation: CancellationPolicySchema,
  /** True when checkIn/checkOut were synthesized because the saved
   *  trip didn't have specific dates. The approval modal calls this
   *  out so the user knows to override before confirming. */
  placeholderDates: z.boolean(),
  createdAt: z.string().datetime(),
});
export type BookingDraft = z.infer<typeof BookingDraftSchema>;

// ============== Booking ==============

export const BookingSchema = z.object({
  id: z.string().min(1),
  idempotencyKey: z.string().min(1),
  ownerKind: OwnerKindSchema,
  ownerId: z.string().min(1),
  savedTripId: z.string().min(1),
  stayId: z.string().min(1),
  providerId: z.string().min(1),
  /** Provider-assigned reference (mock_… in dev; real-provider id in
   *  D.x). Null for `failed` bookings where the provider call errored
   *  before issuing a reference. */
  providerBookingRef: z.string().nullable(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  nights: z.number().int().min(1).max(365),
  traveler: TravelerInfoSchema,
  total: MoneySchema,
  cancellation: CancellationPolicySchema,
  status: BookingStatusSchema,
  confirmedAt: z.string().datetime().nullable(),
  canceledAt: z.string().datetime().nullable(),
  failureReason: z.string().nullable(),
});
export type Booking = z.infer<typeof BookingSchema>;

// ============== Helpers ==============

/**
 * Stable random key the user's confirm click is gated on. Returned at
 * draft-time so the client can echo it back; the provider's `book()`
 * is idempotent on it.
 */
export function mintIdempotencyKey(): string {
  return `bk_${cryptoRandom()}`;
}

export function mintBookingId(): string {
  return `bok_${cryptoRandom()}`;
}

export function mintBookingDraftId(): string {
  return `bkd_${cryptoRandom()}`;
}

function cryptoRandom(): string {
  return (
    globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 22) ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
  );
}

/**
 * Cancellation eligibility derived from booking status + policy + clock.
 * Used by the cancel route + the confirmation page to decide whether
 * to render the cancel button.
 */
export function isCancelable(booking: Booking, now: Date = new Date()): boolean {
  if (booking.status !== 'confirmed') return false;
  const policy = booking.cancellation;
  if (policy.kind === 'non-refundable') return false;
  if (policy.kind === 'free-until') {
    return new Date(policy.freeUntil) > now;
  }
  // partial-refund - always allowed; refund amount is communicated in description.
  return true;
}

// ============== Errors ==============

/**
 * Typed booking failures. The route handlers map these to HTTP statuses;
 * the agent throws them so callers don't need to inspect message strings.
 */
export type BookingErrorReason =
  | 'unknown-draft'
  | 'unknown-booking'
  | 'already-confirmed'
  | 'not-cancelable'
  | 'not-owner'
  | 'idempotency-collision'
  | 'provider-error'
  | 'invalid-traveler';

export class BookingError extends Error {
  constructor(
    public readonly reason: BookingErrorReason,
    message?: string,
  ) {
    super(message ?? reason);
    this.name = 'BookingError';
  }
}
