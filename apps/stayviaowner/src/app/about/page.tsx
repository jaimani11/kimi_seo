import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

export const metadata: Metadata = {
  title: 'About stayviaowner · whole-home vacation rentals via Vrbo',
  description:
    'stayviaowner is an independent vacation-rental discovery site and Vrbo affiliate — whole homes, villas, cabins and cottages compared in one search, booked through Vrbo.',
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
        <p style={eyebrow}>About stayviaowner</p>
        <h1 className="mt-3" style={h1Style}>
          Rent the whole place — homes, villas, cabins, cottages.
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
            stayviaowner is an independent vacation-rental discovery site and a{' '}
            <strong>Vrbo affiliate</strong>. We&apos;re built around one idea: for a
            family, a group or a longer stay, the whole home — with its kitchen, its
            bedrooms and its space to spread out — usually beats a row of hotel rooms.
            We help you find that home and book it through Vrbo.
          </p>

          <h2 style={h2Style}>Whole homes, for the trips that need them</h2>
          <p>
            Hotels are great for a night in transit. But a week with the family, a
            reunion, a ski trip or a work-from-anywhere month is a different problem —
            you want a door that closes, a kitchen you can cook in and a living room
            everyone fits in. That&apos;s the trip stayviaowner is for.
          </p>

          <h2 style={h2Style}>Every property type in one search</h2>
          <ul style={{ marginLeft: '1.25rem' }}>
            <li><strong>Villas &amp; luxury homes</strong> — space, privacy, often a pool</li>
            <li><strong>Cabins &amp; chalets</strong> — mountain and lake escapes</li>
            <li><strong>Cottages &amp; beach houses</strong> — smaller, characterful stays</li>
            <li><strong>Condos &amp; apartments</strong> — city bases with room to breathe</li>
          </ul>
          <p>
            Filter by the property type you actually want instead of scrolling past a
            thousand hotel rooms to reach the homes.
          </p>

          <h2 style={h2Style}>How the Vrbo partnership works</h2>
          <p>
            stayviaowner is free to use. When you book a home on Vrbo after coming from
            here, Vrbo pays us a referral commission — and{' '}
            <strong>you pay exactly what you&apos;d pay booking on Vrbo directly</strong>.
            We don&apos;t add fees, we don&apos;t mark up the nightly rate, and we
            don&apos;t list any properties of our own.
          </p>

          <h2 style={h2Style}>Independent of Vrbo</h2>
          <p>
            stayviaowner is operated by Adored Moments LLC in the United States. We send
            bookings to Vrbo but aren&apos;t owned or operated by them; Vrbo&apos;s terms
            and the individual owner&apos;s house rules govern your stay, changes and
            cancellations.
          </p>

          <h2 style={h2Style}>Get in touch</h2>
          <p>
            Questions, partnership ideas or feedback on a listing page — the{' '}
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
