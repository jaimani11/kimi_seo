import Link from 'next/link';
import { hasDestinationGuide } from '@adored/seo-data';
import type { SeoCity } from '@lib/seo/cities';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * Interim render for a HELD editorial page (a pure-experience themed-list or a
 * city-vs-city comparison) during the Viator retirement.
 *
 * These pages previously depended on the live Viator API and, without a key,
 * showed a broken "temporarily unavailable" banner. Until the GSC/backlink
 * review decides each one's final action (rewrite / redirect / 410), we replace
 * that broken state with this honest, static, Viator-free bridge: no fake
 * inventory, no experiences we can't actually book — just a clear hand-off to
 * gobookt's real Booking.com stays surfaces for the city (or cities). The page
 * is `noindex` (set in the route's generateMetadata) so it neither ranks nor
 * misleads searchers while it's in this holding state.
 */
export function HeldEditorialBridge({
  title,
  city,
  secondaryCity,
}: {
  title: string;
  city: SeoCity;
  secondaryCity?: SeoCity;
}) {
  const cities = secondaryCity ? [city, secondaryCity] : [city];
  return (
    <>
      <SiteHeader />
      <main
        style={{ background: 'var(--surface-base)' }}
        className="min-h-[60vh]"
      >
        <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              margin: 0,
            }}
          >
            Plan your stay
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            className="mt-4 max-w-xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontWeight: 300,
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'var(--ink-secondary)',
              margin: '1rem 0 0',
            }}
          >
            gobookt is a Booking.com stays specialist. Start with where to stay —
            real availability and prices, free cancellation on most bookings.
          </p>

          {cities.map((c) => (
            <div key={c.slug} className="mt-8">
              {secondaryCity ? (
                <h2
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    margin: '0 0 0.6rem',
                  }}
                >
                  {c.name}
                </h2>
              ) : null}
              <ul className="flex flex-wrap gap-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <BridgeLink href={`/hotels-in-${c.slug}`} label={`Hotels in ${c.name}`} />
                {hasDestinationGuide(c.slug) ? (
                  <BridgeLink href={`/destinations/${c.slug}`} label={`${c.name} travel guide`} />
                ) : null}
                <BridgeLink href={`/top-attractions-in-${c.slug}`} label={`Top attractions in ${c.name}`} />
                <BridgeLink href={`/best-time-to-visit-${c.slug}`} label={`Best time to visit ${c.name}`} />
              </ul>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function BridgeLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.92rem',
          fontWeight: 600,
          color: 'var(--ink-primary)',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '999px',
          padding: '0.6rem 1.1rem',
          textDecoration: 'none',
        }}
      >
        {label}
      </Link>
    </li>
  );
}
