import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

export const metadata: Metadata = {
  title: 'About gotript · one search across every Expedia vertical',
  description:
    'gotript is an independent travel-search site and Expedia affiliate — hotels, vacation rentals, flights, cars and things to do compared in a single place.',
};

const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.66rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--accent-primary)',
  fontWeight: 700,
  margin: 0,
};
const h1Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  fontWeight: 800,
  lineHeight: 1.05,
  letterSpacing: '-0.025em',
  color: 'var(--ink-primary)',
  margin: 0,
};
const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1.35rem',
  fontWeight: 800,
  color: 'var(--ink-primary)',
  margin: '2rem 0 0.5rem',
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p style={eyebrow}>About gotript</p>
        <h1 className="mt-3" style={h1Style}>
          Every way to travel, compared in one search.
        </h1>

        <div
          className="prose mt-8"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.02rem',
            lineHeight: 1.7,
            color: 'var(--ink-secondary)',
          }}
        >
          <p>
            gotript is an independent travel-search site and an{' '}
            <strong>independent Expedia affiliate</strong>. Most trips get booked across
            half a dozen tabs — a hotel here, a flight there, the rental car forgotten
            until the last minute. gotript pulls Expedia&apos;s travel verticals onto
            one screen so you can line up the whole trip and compare it in a single
            pass.
          </p>

          <h2 style={h2Style}>Five verticals, one query</h2>
          <p>Enter a destination once and gotript searches across:</p>
          <ul style={{ marginLeft: '1.25rem' }}>
            <li><strong>Hotels</strong> — chains, boutiques and everything between</li>
            <li><strong>Vacation rentals</strong> — whole homes for groups and longer stays</li>
            <li><strong>Flights</strong> — routes and fares into your destination</li>
            <li><strong>Cars</strong> — pickups at the airport or in town</li>
            <li><strong>Things to do</strong> — tours, tickets and day trips once you land</li>
          </ul>

          <h2 style={h2Style}>Data-backed, not just a wall of links</h2>
          <p>
            Underneath the search sits our own layer of destination intelligence —
            when-to-go windows, typical costs, neighborhood notes and multi-day
            itineraries for hundreds of cities. The goal isn&apos;t to bury you in
            options; it&apos;s to hand you a defensible shortlist and let Expedia close
            the booking.
          </p>

          <h2 style={h2Style}>What a click costs you: nothing extra</h2>
          <p>
            gotript is free to use. When you book through Expedia after arriving from
            gotript, Expedia pays us a referral commission — and{' '}
            <strong>your price is identical</strong> to booking on Expedia directly. No
            markup, no booking fee, no inventory of our own. The commission funds the
            search and the editorial work; it never touches your total.
          </p>

          <h2 style={h2Style}>Independent — we don&apos;t work for Expedia</h2>
          <p>
            gotript is operated by Adored Moments LLC in the United States. We&apos;re a
            search-and-editorial layer that routes bookings to Expedia; we aren&apos;t
            owned or run by Expedia, and their terms and privacy notice govern the
            reservation itself.
          </p>

          <h2 style={h2Style}>Press &amp; partnerships</h2>
          <p>
            Coverage requests, partnership ideas or a bug you hit — the{' '}
            <Link
              href="/contact"
              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              contact form
            </Link>{' '}
            reaches us directly, and we reply within two business days.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
