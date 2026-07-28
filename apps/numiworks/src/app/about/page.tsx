import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

export const metadata: Metadata = {
  title: 'About numiworks · AI-native travel & Viator affiliate',
  description:
    'numiworks is an independent travel publisher and official Viator affiliate. AI-native trip planning with bookable Viator experiences in destinations worldwide.',
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
          About numiworks
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
          Plan every trip in one place — AI-native, Viator-powered.
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
            numiworks is an independent travel publisher and an{' '}
            <strong>official Viator affiliate partner</strong>. We built numiworks
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
            numiworks combines an AI travel concierge with editorial destination
            guides so you can go from &quot;maybe Japan?&quot; to a bookable
            itinerary in one session. Every experience recommendation is a live,
            bookable Viator listing:
          </p>
          <ul style={{ marginLeft: '1.25rem' }}>
            <li>300K+ Viator experiences — tours, day trips, skip-the-line tickets, food walks</li>
            <li>Worldwide inventory, with prices and availability from our booking partners</li>
            <li>AI concierge that turns free-text prompts into day-by-day plans</li>
            <li>Curated destination guides — itineraries, budgets, neighborhoods, when to go</li>
            <li>Whole-home rentals via VRBO for groups who want kitchens + space</li>
          </ul>
          <p>
            We also publish 2,000+ programmatic destination pages — city
            itineraries, day-trip roundups, themed activity lists — because the
            best time to plan is when you already know what you want to book.
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
            numiworks is 100% free for travelers. When you click through to
            Viator from our site and complete a booking, Viator pays
            numiworks a small commission — <strong>the price you pay is exactly the
            same</strong> as if you&apos;d gone to Viator directly. No booking fees.
            No hidden markups. No inventory of our own.
          </p>
          <p>
            This is the standard affiliate model that publishers like NerdWallet
            and The Points Guy use. The commission funds our editorial + technical
            work; it does not change your price. Viator&apos;s Terms and Privacy
            Notice govern the actual booking — we&apos;re the search + editorial layer
            on top.
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
            numiworks is a solo-founded travel publisher based in the United States.
            The site was built by a small technical team with a background in
            marketplace + search design. Our editorial voice is calm, opinionated,
            and traveler-first — the goal is to help you decide, then hand you off
            to Viator to actually book.
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
