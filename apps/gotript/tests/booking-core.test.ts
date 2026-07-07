import { describe, expect, it } from 'vitest';
import {
  BookingDraftSchema,
  BookingSchema,
  isCancelable,
  mintBookingId,
  mintIdempotencyKey,
  type Booking,
  type CancellationPolicy,
} from '@/core/booking';

function baseBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'bok_test',
    idempotencyKey: 'bk_test',
    ownerKind: 'user',
    ownerId: 'user_alice',
    savedTripId: 'trip_test',
    stayId: 'mock-italy:hotel_1',
    providerId: 'mock-italy',
    providerBookingRef: 'mock_ref_1',
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
    confirmedAt: '2026-05-09T00:00:00.000Z',
    canceledAt: null,
    failureReason: null,
    ...overrides,
  };
}

describe('booking core schemas', () => {
  it('round-trips a BookingDraft through the schema', () => {
    const draft = {
      id: 'bkd_test',
      idempotencyKey: 'bk_test',
      ownerKind: 'user' as const,
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
        kind: 'free-until' as const,
        freeUntil: '2099-08-25T00:00:00.000Z',
        description: 'Free until 7 days before check-in.',
      },
      placeholderDates: false,
      createdAt: '2026-05-09T00:00:00.000Z',
    };
    const parsed = BookingDraftSchema.parse(draft);
    expect(parsed.id).toBe('bkd_test');
    expect(parsed.cancellation.kind).toBe('free-until');
  });

  it('round-trips a Booking through the schema', () => {
    const parsed = BookingSchema.parse(baseBooking());
    expect(parsed.status).toBe('confirmed');
    expect(parsed.providerBookingRef).toBe('mock_ref_1');
  });

  it('rejects an email that fails RFC validation', () => {
    const bad = {
      ...baseBooking(),
      traveler: {
        primaryName: 'Bob',
        email: 'not-an-email',
        guestCount: { adults: 1, children: 0, infants: 0 },
      },
    };
    expect(() => BookingSchema.parse(bad)).toThrow();
  });
});

describe('isCancelable', () => {
  const now = new Date('2026-05-09T12:00:00.000Z');

  it('returns true for a confirmed booking with free-until in the future', () => {
    expect(isCancelable(baseBooking(), now)).toBe(true);
  });

  it('returns false when free-until has passed', () => {
    const policy: CancellationPolicy = {
      kind: 'free-until',
      freeUntil: '2026-05-01T00:00:00.000Z',
      description: 'Past',
    };
    expect(isCancelable(baseBooking({ cancellation: policy }), now)).toBe(false);
  });

  it('returns false for non-refundable bookings', () => {
    const policy: CancellationPolicy = {
      kind: 'non-refundable',
      description: 'Locked in',
    };
    expect(isCancelable(baseBooking({ cancellation: policy }), now)).toBe(false);
  });

  it('returns true for partial-refund bookings (with the refund amount being a separate concern)', () => {
    const policy: CancellationPolicy = {
      kind: 'partial-refund',
      refundPercent: 50,
      description: 'Half refund',
    };
    expect(isCancelable(baseBooking({ cancellation: policy }), now)).toBe(true);
  });

  it('returns false for canceled bookings', () => {
    expect(
      isCancelable(
        baseBooking({ status: 'canceled', canceledAt: '2026-05-01T00:00:00.000Z' }),
        now,
      ),
    ).toBe(false);
  });

  it('returns false for failed bookings', () => {
    expect(isCancelable(baseBooking({ status: 'failed' }), now)).toBe(false);
  });
});

describe('id minters', () => {
  it('mintIdempotencyKey produces unique values across calls', () => {
    const a = mintIdempotencyKey();
    const b = mintIdempotencyKey();
    expect(a).not.toBe(b);
    expect(a.startsWith('bk_')).toBe(true);
  });

  it('mintBookingId produces unique values', () => {
    const a = mintBookingId();
    const b = mintBookingId();
    expect(a).not.toBe(b);
    expect(a.startsWith('bok_')).toBe(true);
  });
});
