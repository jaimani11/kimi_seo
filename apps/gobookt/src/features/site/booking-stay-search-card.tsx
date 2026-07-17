'use client';

import { BookingSearchWidget } from './booking-widget';

/**
 * City-page stays search — the tracked Booking.com widget with a heading.
 *
 * Used on the programmatic stays pages (hotels-in, best/cheap/luxury/family/
 * boutique/pet/beach hotels, apartments, hotel-type facets, occasions,
 * stays-near) IN PLACE OF a static "Search {city}" button. Only Booking's
 * widget keeps CJ commission tracking on a destination search — every fixed CJ
 * creative deep-links to the Booking HOMEPAGE, so a plain link tracks but loses
 * the city. Booking won't let us pre-fill the widget, so the heading names the
 * city and the visitor confirms it in the box.
 *
 * One widget per page (the WIDGET_ID in booking-widget.tsx is shared) — every
 * stays page renders exactly one of these.
 */
export function BookingStaySearchCard({
  cityName,
  heading,
}: {
  /** City to name in the heading/hint. Omit for a generic hub search box. */
  cityName?: string;
  heading?: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '0.9rem',
        border: '1px solid rgba(15,23,42,0.10)',
        boxShadow: '0 18px 44px -22px rgba(0,0,0,0.4)',
        padding: '1.05rem 1.1rem 1.15rem',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.98rem',
          fontWeight: 800,
          color: '#0c1426',
        }}
      >
        {heading ?? (cityName ? `Search stays in ${cityName} on Booking.com` : 'Search stays on Booking.com')}
      </p>
      <p
        style={{
          margin: '0.2rem 0 0.7rem',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          lineHeight: 1.5,
          color: '#5b6472',
        }}
      >
        {cityName ? (
          <>
            Type <strong style={{ color: '#0c1426' }}>{cityName}</strong> below, pick your dates, and
            search.{' '}
          </>
        ) : (
          <>Search hundreds of thousands of hotels, homes, and apartments worldwide. </>
        )}
        Free cancellation on most stays — the price you pay is the same as booking direct.
      </p>
      <BookingSearchWidget />
    </div>
  );
}
