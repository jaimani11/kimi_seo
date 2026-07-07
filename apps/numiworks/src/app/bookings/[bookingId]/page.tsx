import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerAuth, ownerOf } from '@lib/auth';
import { getBookingSubsystem } from '@lib/booking';
import { getSessionStore } from '@lib/session/factory';
import { BookingConfirmationView } from '@/features/bookings/booking-confirmation-view';

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookingId } = await params;
  return {
    title: `Booking ${bookingId} · numiworks`,
  };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Owner-gated booking confirmation page. Reads from the booking
 * subsystem store + cross-references the underlying saved trip for
 * the destination + hero stay name (which the booking carries by id
 * but not by display name - the trip is the source of truth for
 * naming).
 *
 * 404 when the booking doesn't belong to the caller.
 */
export default async function BookingConfirmationPage({ params }: PageProps) {
  const { bookingId } = await params;
  const auth = await getServerAuth();
  const owner = ownerOf(auth);

  const subsystem = getBookingSubsystem();
  const booking = await subsystem.store.getBooking({
    ownerKind: owner.ownerKind,
    ownerId: owner.ownerId,
    bookingId,
  });
  if (!booking) notFound();

  // Cross-ref the saved trip for human-readable names. If the trip
  // was deleted post-booking, fall back to placeholder strings - the
  // booking is still the source of truth for what was reserved.
  const trip = await getSessionStore().getTrip({
    ownerKind: owner.ownerKind,
    ownerId: owner.ownerId,
    tripId: booking.savedTripId,
  });

  return (
    <BookingConfirmationView
      booking={booking}
      destinationName={trip?.proposalSummary.destinationName ?? 'Saved trip'}
      heroStayName={trip?.proposalSummary.heroStayName ?? 'Booked stay'}
    />
  );
}
