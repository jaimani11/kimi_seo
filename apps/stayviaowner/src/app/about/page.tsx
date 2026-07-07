import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

export const metadata: Metadata = {
  title: 'About stayviaowner · multi-category Expedia affiliate',
  description:
    'stayviaowner is an independent travel publisher and official Expedia affiliate. We help travelers search hotels, flights, packages, things to do, cars, and cruises with Expedia\'s bundle-and-save angle.',
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 700,
            margin: 0,
          }}
        >
          About stayviaowner
        </p>
        <h1
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          A traveler-first search hub, powered by Expedia.
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
            stayviaowner is an independent travel publisher and an{' '}
            <strong>official Expedia affiliate partner</strong>. We built stayviaowner
            because travelers deserve a calm, opinionated search experience — one
            surface that covers every leg of the trip, without the
            twenty-tab-comparison ritual most trip planning devolves into.
          </p>

          <h2
            className="mt-10"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--ink-primary)',
              margin: '2rem 0 0.5rem',
            }}
          >
            What we do
          </h2>
          <p>
            From one search box, stayviaowner hands you off to Expedia&apos;s live
            inventory across every vertical they sell:
          </p>
          <ul style={{ marginLeft: '1.25rem' }}>
            <li>Hotels, apartments, and vacation rentals worldwide</li>
            <li>Flights across every major airline (round-trip, one-way, multi-city)</li>
            <li>
              <strong>Vacation packages</strong> — bundle hotel + flight in one
              search; Expedia&apos;s bundle prices routinely beat à-la-carte
            </li>
            <li>Things to do — tours, day trips, skip-the-line tickets, food walks</li>
            <li>Car rentals at airports and city pick-up points, every major brand</li>
            <li>Cruises across Royal Caribbean, Carnival, NCL, MSC, Princess, and more</li>
          </ul>
          <p>
            We also publish 5,000+ programmatic destination guides — city
            itineraries, day-trip roundups, themed hotel lists — because the best
            time to book is when you already know what you&apos;re booking.
          </p>

          <h2
            className="mt-10"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--ink-primary)',
              margin: '2rem 0 0.5rem',
            }}
          >
            How we make money
          </h2>
          <p>
            stayviaowner is 100% free for travelers. When you click through to
            Expedia from our site and complete a booking, Expedia pays stayviaowner a
            small commission — <strong>the price you pay is exactly the same</strong>{' '}
            as if you&apos;d gone to Expedia directly. No booking fees. No hidden
            markups. No inventory of our own.
          </p>
          <p>
            This is the standard affiliate model that publishers like NerdWallet
            and The Points Guy use. The commission funds our editorial +
            technical work; it does not change your price. Expedia&apos;s Terms
            and Privacy Notice govern the actual booking — we&apos;re the search +
            editorial layer on top.
          </p>

          <h2
            className="mt-10"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--ink-primary)',
              margin: '2rem 0 0.5rem',
            }}
          >
            Who we are
          </h2>
          <p>
            stayviaowner is a solo-founded travel publisher based in the United States.
            The site was built by a small technical team with a background in
            marketplace + search design. Our editorial voice is calm, opinionated,
            and traveler-first — the goal is to help you decide, then hand you off
            to Expedia to actually book.
          </p>

          <h2
            className="mt-10"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--ink-primary)',
              margin: '2rem 0 0.5rem',
            }}
          >
            Get in touch
          </h2>
          <p>
            Media enquiries, partnership questions, feedback on the site — the
            best way to reach us is the{' '}
            <Link
              href="/contact"
              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              contact form
            </Link>
            . We read everything and respond within 2 business days.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
