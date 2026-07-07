import type { Booking, BookingDraft, OwnerKey } from '@core/booking';
import type { BookingStore } from './booking-store';

/**
 * Process-local booking store. HMR-safe via globalThis so the dev
 * server doesn't lose state between code reloads - important here
 * because losing a confirmation that was just rendered would be
 * extremely disorienting.
 *
 * Three indexes:
 *   - drafts by idempotencyKey
 *   - bookings by id (both for owner-scoped reads + admin reads)
 *   - bookings by owner-key, push-order (most-recent-first via reverse)
 *
 * No persistence; restart clears everything. Postgres impl lands in D.x.
 */
export class InMemoryBookingStore implements BookingStore {
  private readonly drafts = new Map<string, BookingDraft>();
  private readonly bookingsById = new Map<string, Booking>();
  private readonly bookingsByOwner = new Map<string, Booking[]>();

  async putDraft(draft: BookingDraft): Promise<void> {
    this.drafts.set(draft.idempotencyKey, draft);
  }

  async getDraft(idempotencyKey: string): Promise<BookingDraft | null> {
    return this.drafts.get(idempotencyKey) ?? null;
  }

  async putBooking(booking: Booking): Promise<void> {
    const ownerKey = `${booking.ownerKind}:${booking.ownerId}`;
    const existing = this.bookingsById.get(booking.id);
    this.bookingsById.set(booking.id, booking);
    if (!existing) {
      // First time seeing this booking - append to the owner's list.
      const bucket = this.bookingsByOwner.get(ownerKey) ?? [];
      bucket.push(booking);
      this.bookingsByOwner.set(ownerKey, bucket);
    } else {
      // Update in place - replace the entry in the owner bucket too.
      const bucket = this.bookingsByOwner.get(ownerKey) ?? [];
      const idx = bucket.findIndex((b) => b.id === booking.id);
      if (idx >= 0) bucket[idx] = booking;
      this.bookingsByOwner.set(ownerKey, bucket);
    }
  }

  async getBooking(args: OwnerKey & { bookingId: string }): Promise<Booking | null> {
    const found = this.bookingsById.get(args.bookingId);
    if (!found) return null;
    if (found.ownerKind !== args.ownerKind || found.ownerId !== args.ownerId) {
      // Owner mismatch - treat as not found (defense in depth; routes
      // also check, but the store should never leak across owners).
      return null;
    }
    return found;
  }

  async listByOwner(args: OwnerKey & { limit?: number }): Promise<Booking[]> {
    const limit = args.limit ?? 50;
    const bucket = this.bookingsByOwner.get(`${args.ownerKind}:${args.ownerId}`);
    if (!bucket) return [];
    return [...bucket].reverse().slice(0, limit);
  }

  async listAll(args: { limit?: number } = {}): Promise<Booking[]> {
    const limit = args.limit ?? 100;
    // Flatten all per-owner buckets, sort by createdAt-ish (we use
    // confirmedAt or canceledAt or fall back to id which is roughly
    // creation order). For Slice D's bounded counts this is fine.
    const all: Booking[] = [];
    for (const bucket of this.bookingsByOwner.values()) all.push(...bucket);
    all.sort((a, b) => {
      const ta = effectiveTimestamp(a);
      const tb = effectiveTimestamp(b);
      return tb - ta;
    });
    return all.slice(0, limit);
  }

  /** Test-only - wipe state. */
  _reset(): void {
    this.drafts.clear();
    this.bookingsById.clear();
    this.bookingsByOwner.clear();
  }
}

function effectiveTimestamp(b: Booking): number {
  if (b.confirmedAt) return Date.parse(b.confirmedAt);
  if (b.canceledAt) return Date.parse(b.canceledAt);
  return 0;
}

declare global {
  var __stayscoutBookingStore: InMemoryBookingStore | undefined;
}

export function getInMemoryBookingStore(): InMemoryBookingStore {
  if (!globalThis.__stayscoutBookingStore) {
    globalThis.__stayscoutBookingStore = new InMemoryBookingStore();
  }
  return globalThis.__stayscoutBookingStore;
}
