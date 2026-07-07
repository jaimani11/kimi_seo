import {
  BookingError,
  isCancelable,
  mintBookingDraftId,
  mintIdempotencyKey,
  type Booking,
  type BookingDraft,
  type CancellationPolicy,
  type OwnerKey,
  type TravelerInfo,
} from '@core/booking';
import type { SavedTrip } from '@lib/session/session-store';
import type { BookingProvider } from '@lib/booking/booking-provider';
import type { BookingStore } from '@lib/booking/booking-store';

/**
 * Slice D - BookingAgent.
 *
 * The first agent that produces real, irreversible side effects. The
 * three operations here form the entire booking lifecycle:
 *
 *   1. `draftBooking(input)` - derives a structured draft from the
 *      saved trip + user-provided traveler info. Stamps an
 *      idempotencyKey + persists. NO provider call yet.
 *
 *   2. `confirmBooking({ ownerKey, idempotencyKey })` - pulls the
 *      draft, verifies ownership, calls the provider's idempotent
 *      `book(draft)`. Persists the resulting Booking. Re-calling
 *      with the same idempotencyKey is safe - provider returns the
 *      same Booking, store overwrites with identical content.
 *
 *   3. `cancelBooking({ ownerKey, bookingId })` - verifies ownership
 *      + cancellation policy, calls the provider's idempotent
 *      `cancel`. Persists the canceled status.
 *
 * Slice D is approval-gated for every booking, every tier - the
 * `autonomous` flag is reserved for D.x. The API in Slice D never
 * passes it; the agent ignores it.
 *
 * No LLM calls in Slice D - drafts are deterministic transformations
 * of the saved trip + form input. LLM enrichment (parsing free-text
 * traveler details, resolving date conflicts) lands in D.x.
 */

export interface DraftBookingInput {
  savedTrip: SavedTrip;
  traveler: TravelerInfo;
  /**
   * Reserved for D.x. When true, the agent would proceed straight
   * through to `confirmBooking` after `draftBooking` (premium
   * autonomous mode). Slice D ignores this for safety - the API
   * never passes it; the architectural seam exists for D.x to flip.
   */
  autonomous?: boolean;
  /** Override the auto-minted idempotencyKey (test convenience). */
  idempotencyKey?: string;
  /** Override `now` for tests / consistent timestamps. */
  now?: Date;
}

export class BookingAgent {
  constructor(
    private readonly provider: BookingProvider,
    private readonly store: BookingStore,
  ) {}

  // ============== Draft ==============

  async draftBooking(input: DraftBookingInput): Promise<BookingDraft> {
    const now = input.now ?? new Date();
    const trip = input.savedTrip;
    const { checkIn, checkOut, placeholderDates } = resolveStayDates(trip, now);
    const nights = trip.proposalSummary.nights ?? differenceInNights(checkIn, checkOut);

    const total = computeTotal(trip, nights);
    const cancellation = defaultCancellationPolicy(checkIn);
    const idempotencyKey = input.idempotencyKey ?? mintIdempotencyKey();

    const draft: BookingDraft = {
      id: mintBookingDraftId(),
      idempotencyKey,
      ownerKind: trip.ownerKind,
      ownerId: trip.ownerId,
      savedTripId: trip.id,
      stayId: trip.proposal.hero.id,
      providerId: trip.proposal.hero.providerId,
      checkIn,
      checkOut,
      nights,
      traveler: input.traveler,
      total,
      cancellation,
      placeholderDates,
      createdAt: now.toISOString(),
    };
    await this.store.putDraft(draft);
    return draft;
  }

  // ============== Confirm ==============

  async confirmBooking(args: { ownerKey: OwnerKey; idempotencyKey: string }): Promise<Booking> {
    const draft = await this.store.getDraft(args.idempotencyKey);
    if (!draft) {
      throw new BookingError(
        'unknown-draft',
        `no draft found for idempotency key ${args.idempotencyKey}`,
      );
    }
    if (draft.ownerKind !== args.ownerKey.ownerKind || draft.ownerId !== args.ownerKey.ownerId) {
      throw new BookingError('not-owner', 'draft belongs to a different owner');
    }

    let booking: Booking;
    try {
      booking = await this.provider.book(draft);
    } catch (err) {
      // Persist the failed attempt so admins can see what was tried.
      // Re-throw so the route surfaces the error to the user.
      const failed: Booking = {
        id: `bok_failed_${draft.idempotencyKey}`,
        idempotencyKey: draft.idempotencyKey,
        ownerKind: draft.ownerKind,
        ownerId: draft.ownerId,
        savedTripId: draft.savedTripId,
        stayId: draft.stayId,
        providerId: draft.providerId,
        providerBookingRef: null,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        nights: draft.nights,
        traveler: draft.traveler,
        total: draft.total,
        cancellation: draft.cancellation,
        status: 'failed',
        confirmedAt: null,
        canceledAt: null,
        failureReason: err instanceof Error ? err.message : String(err),
      };
      await this.store.putBooking(failed);
      throw err;
    }
    await this.store.putBooking(booking);
    return booking;
  }

  // ============== Cancel ==============

  async cancelBooking(args: {
    ownerKey: OwnerKey;
    bookingId: string;
    reason?: string;
    now?: Date;
  }): Promise<Booking> {
    const booking = await this.store.getBooking({
      ownerKind: args.ownerKey.ownerKind,
      ownerId: args.ownerKey.ownerId,
      bookingId: args.bookingId,
    });
    if (!booking) {
      throw new BookingError(
        'unknown-booking',
        `booking ${args.bookingId} not found for this owner`,
      );
    }
    if (booking.status === 'canceled') {
      return booking; // idempotent at the agent level too
    }
    if (!isCancelable(booking, args.now ?? new Date())) {
      throw new BookingError(
        'not-cancelable',
        `booking ${args.bookingId} is not cancelable (status=${booking.status})`,
      );
    }
    if (!booking.providerBookingRef) {
      throw new BookingError(
        'not-cancelable',
        `booking ${args.bookingId} has no provider reference to cancel`,
      );
    }
    const canceled = await this.provider.cancel({
      bookingId: booking.providerBookingRef,
      ...(args.reason ? { reason: args.reason } : {}),
    });
    // Provider returns its own canonical Booking shape; preserve our
    // canonical id (which differs from the provider ref).
    const next: Booking = {
      ...booking,
      status: canceled.status,
      canceledAt: canceled.canceledAt,
    };
    await this.store.putBooking(next);
    return next;
  }
}

// ============== Helpers ==============

function resolveStayDates(
  trip: SavedTrip,
  now: Date,
): { checkIn: string; checkOut: string; placeholderDates: boolean } {
  const intentDates = trip.intent.dates;
  if (intentDates.kind === 'specific') {
    return {
      checkIn: intentDates.start,
      checkOut: intentDates.end,
      placeholderDates: false,
    };
  }
  // Synthesize a placeholder: today + 30 days for checkIn,
  // checkIn + nights for checkOut. Saves us from "what dates?"
  // dialogue at draft time; the modal flags this so users override
  // before confirm.
  const nights = trip.proposalSummary.nights ?? trip.proposal.intent.duration.nights ?? 5;
  const checkInDate = addDays(now, 30);
  const checkOutDate = addDays(checkInDate, nights);
  return {
    checkIn: toIsoDate(checkInDate),
    checkOut: toIsoDate(checkOutDate),
    placeholderDates: true,
  };
}

function computeTotal(trip: SavedTrip, nights: number): { amount: number; currency: string } {
  const pricing = trip.proposal.hero.pricing;
  if (pricing.totalForStay) {
    return {
      amount: pricing.totalForStay.amount,
      currency: pricing.totalForStay.currency,
    };
  }
  return {
    amount: roundToCents(pricing.pricePerNight.amount * nights),
    currency: pricing.pricePerNight.currency,
  };
}

function defaultCancellationPolicy(checkInIso: string): CancellationPolicy {
  // Free until 7 days before check-in - a friendly default that
  // matches the dominant industry shape. Real providers will
  // return their own policies in D.x.
  const checkIn = new Date(checkInIso);
  const freeUntil = new Date(checkIn.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    kind: 'free-until',
    freeUntil: freeUntil.toISOString(),
    description: 'Cancel free until 7 days before check-in. After that, non-refundable.',
  };
}

function differenceInNights(checkIn: string, checkOut: string): number {
  const a = Date.parse(checkIn);
  const b = Date.parse(checkOut);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  const diff = Math.round((b - a) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function roundToCents(n: number): number {
  return Math.round(n * 100) / 100;
}
