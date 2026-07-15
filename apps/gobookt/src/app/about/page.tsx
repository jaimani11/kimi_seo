import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

export const metadata: Metadata = {
  title: 'About gobookt · hotel discovery powered by Booking.com',
  description:
    'gobookt is an independent hotel-discovery site and official Booking.com affiliate — compare stays across thousands of destinations with data-backed city guides.',
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
        <p style={eyebrow}>About gobookt</p>
        <h1 className="mt-3" style={h1Style}>
          Find the right place to stay — powered by Booking.com.
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
            gobookt is a hotel-discovery site and an{' '}
            <strong>official Booking.com affiliate</strong>. We do one thing and try to
            do it well: help you narrow thousands of possible stays down to the few
            that actually fit your city, your dates and your budget — then hand the
            booking to Booking.com.
          </p>

          <h2 style={h2Style}>Hotel-first, on purpose</h2>
          <p>
            Plenty of sites try to sell you flights, cars and cruises in the same
            breath. gobookt stays focused on where you sleep — hotels, apartments,
            guesthouses and boutique stays — because that&apos;s the decision that
            makes or breaks a trip, and it deserves a search that isn&apos;t
            distracted.
          </p>

          <h2 style={h2Style}>City guides that do the homework</h2>
          <p>
            Every destination on gobookt comes with a data-backed guide: which
            neighborhoods suit which travelers, when prices peak, how far the
            landmarks really are from each other. You arrive at the Booking.com
            search already knowing what &quot;a good area&quot; means for that city.
          </p>

          <h2 style={h2Style}>Free to use, commission from Booking.com</h2>
          <p>
            gobookt costs you nothing. When you book on Booking.com after clicking
            through from here, Booking.com pays us a commission — and{' '}
            <strong>your rate is exactly the same</strong> as booking on Booking.com
            directly. No markup, no service fee, no rooms of our own. That commission
            is what funds the guides and the search.
          </p>

          <h2 style={h2Style}>Independent of Booking.com</h2>
          <p>
            gobookt is operated by Adored Moments LLC in the United States. We partner
            with Booking.com for inventory and send bookings their way, but we are not
            owned or operated by Booking.com — your reservation, changes and
            cancellations are governed by Booking.com&apos;s own terms.
          </p>

          <h2 style={h2Style}>Reach the team</h2>
          <p>
            Press, partnership questions or feedback on a guide — the{' '}
            <Link
              href="/contact"
              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              contact form
            </Link>{' '}
            comes straight to us, and we answer within two business days.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
