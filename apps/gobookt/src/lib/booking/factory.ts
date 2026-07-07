import { MockBookingProvider } from './mock-booking-provider';
import { getInMemoryBookingStore, type InMemoryBookingStore } from './in-memory-booking-store';
import type { BookingProvider } from './booking-provider';
import type { BookingStore } from './booking-store';

/**
 * Slice D ships only `MockBookingProvider`. D.x adds the env-driven
 * switch to real providers (BookingComBookingProvider etc.) behind
 * the same `BookingProvider` interface - and crucially, behind a
 * separate `STAYSCOUT_LIVE_BOOKING=1` opt-in flag (provider keys
 * alone are not enough, since those keys are also used by the
 * existing search flow).
 */
export interface BookingSubsystem {
  provider: BookingProvider;
  store: BookingStore;
  /** 'mock' in Slice D. D.x surfaces 'live' when the opt-in fires. */
  kind: 'mock' | 'live';
  /** True iff `STAYSCOUT_LIVE_BOOKING=1` is set. False in Slice D
   *  even if true - the architecture seam is here, the live wiring
   *  lands in D.x. Surfaced on /admin so operators can see "live
   *  is configured but not active." */
  liveEnabled: boolean;
}

// Process-global anchor - module-local `_cached` produced two
// subsystems in Next dev (API route + server component) which meant
// MockBookingProvider's internal `bookingsByKey` Map diverged across
// contexts. Bookings made in one couldn't be seen by the other.
declare global {
  var __stayscoutBookingSubsystem: BookingSubsystem | undefined;
}

export function getBookingSubsystem(): BookingSubsystem {
  if (globalThis.__stayscoutBookingSubsystem) return globalThis.__stayscoutBookingSubsystem;
  const store: InMemoryBookingStore = getInMemoryBookingStore();
  const provider = new MockBookingProvider();
  const liveEnabled = process.env.STAYSCOUT_LIVE_BOOKING === '1';
  if (liveEnabled) {
    console.warn(
      '[booking] STAYSCOUT_LIVE_BOOKING is set but real provider booking lands in D.x - using MockBookingProvider for now.',
    );
  }
  globalThis.__stayscoutBookingSubsystem = { provider, store, kind: 'mock', liveEnabled };
  return globalThis.__stayscoutBookingSubsystem;
}

export function _resetBookingSubsystemForTesting(): void {
  globalThis.__stayscoutBookingSubsystem = undefined;
}
