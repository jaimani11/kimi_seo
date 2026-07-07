import Link from 'next/link';
import type { Booking } from '@core/booking';
import { isCancelable } from '@core/booking';
import { ArrowRight } from '@/features/shared/icons';
import { CancelBookingButton } from './cancel-booking-button';

interface BookingConfirmationViewProps {
  booking: Booking;
  /** From the SavedTrip we drafted against - gives the page a hero name + destination. */
  destinationName: string;
  heroStayName: string;
}

/**
 * Server-rendered confirmation page for a single booking. Mirrors the
 * itinerary-view layout vocabulary so the post-booking landing feels
 * like the rest of the app.
 *
 * `CancelBookingButton` is the only client component in this view and
 * only renders when `isCancelable(booking)`.
 */
export function BookingConfirmationView({
  booking,
  destinationName,
  heroStayName,
}: BookingConfirmationViewProps) {
  const cancelable = isCancelable(booking);
  const isCanceled = booking.status === 'canceled';
  const statusColor =
    booking.status === 'confirmed'
      ? 'var(--accent-primary)'
      : booking.status === 'canceled'
        ? 'var(--ink-tertiary)'
        : booking.status === 'failed'
          ? 'var(--accent-warning)'
          : 'var(--ink-secondary)';

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 md:px-8 md:py-14">
      <header className="mb-8 flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 self-start"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          <ArrowRight size={11} strokeWidth={2.2} style={{ transform: 'rotate(180deg)' }} />
          Back to workspace
        </Link>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: statusColor,
          }}
        >
          {booking.status === 'confirmed' && '✓ Booking confirmed'}
          {booking.status === 'canceled' && '× Canceled'}
          {booking.status === 'failed' && '! Booking failed'}
          {booking.status === 'draft' && 'Draft'}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-lg, 3.5rem)',
            fontWeight: 300,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {heroStayName}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            color: 'var(--ink-secondary)',
          }}
        >
          {destinationName} · {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
        </p>
      </header>

      <section
        className="mb-6 rounded-[14px] border p-6"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <Row label="Dates" value={`${booking.checkIn} → ${booking.checkOut}`} />
        <Row
          label="Guests"
          value={`${booking.traveler.guestCount.adults} adult${booking.traveler.guestCount.adults === 1 ? '' : 's'}${
            booking.traveler.guestCount.children > 0
              ? ` · ${booking.traveler.guestCount.children} child${booking.traveler.guestCount.children === 1 ? '' : 'ren'}`
              : ''
          }`}
        />
        <Row label="Primary traveler" value={booking.traveler.primaryName} />
        <Row label="Email" value={booking.traveler.email} mono />
        <Row
          label="Total"
          value={`${booking.total.amount.toLocaleString()} ${booking.total.currency}`}
          emphasis
        />
        {booking.providerBookingRef && (
          <Row label="Provider reference" value={booking.providerBookingRef} mono />
        )}
        {booking.confirmedAt && (
          <Row label="Confirmed" value={new Date(booking.confirmedAt).toLocaleString()} mono />
        )}
        {booking.canceledAt && (
          <Row label="Canceled" value={new Date(booking.canceledAt).toLocaleString()} mono />
        )}
      </section>

      <section
        className="mb-6 rounded-[14px] border p-5"
        style={{
          background: 'var(--surface-overlay)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
            marginBottom: '0.5rem',
          }}
        >
          Cancellation policy
        </p>
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          {booking.cancellation.description}
        </p>
      </section>

      {booking.status === 'failed' && booking.failureReason && (
        <section
          className="mb-6 rounded-[14px] border p-5"
          style={{
            background: 'var(--accent-warning-soft)',
            borderColor: 'var(--accent-warning)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-warning)',
              marginBottom: '0.5rem',
            }}
          >
            Failure reason
          </p>
          <p
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.78rem',
              color: 'var(--ink-secondary)',
              lineHeight: 1.5,
            }}
          >
            {booking.failureReason}
          </p>
        </section>
      )}

      {cancelable && !isCanceled && <CancelBookingButton bookingId={booking.id} />}

      <footer className="mt-10">
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontStyle: 'italic',
            color: 'var(--ink-tertiary)',
            lineHeight: 1.55,
          }}
        >
          {booking.status === 'confirmed'
            ? 'This page is your confirmation - bookmark it, or keep the provider reference handy for check-in.'
            : booking.status === 'canceled'
              ? 'Refund timing depends on the cancellation policy above.'
              : 'You can try again from the saved-trips panel - drafts are not double-charged.'}
        </p>
      </footer>
    </main>
  );
}

function Row({
  label,
  value,
  emphasis = false,
  mono = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </span>
      <span
        className="text-right"
        style={{
          fontFamily: mono ? 'var(--font-geist-mono)' : 'var(--font-fraunces)',
          fontSize: emphasis ? '1.1rem' : mono ? '0.78rem' : 'var(--text-body)',
          fontWeight: emphasis ? 500 : 400,
          color: emphasis ? 'var(--accent-primary)' : 'var(--ink-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
