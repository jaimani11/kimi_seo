import type { CSSProperties } from 'react';

/**
 * One cross-brand booking card. Kept structurally identical to
 * `CityBookingLink` in @adored/brand-config, but declared here so this
 * package stays presentational and dependency-free.
 */
export interface CrossBrandBookingLink {
  name: string;
  href: string;
  books: string;
  blurb: string;
  partner: string;
}

/**
 * "Book your trip to {city}" — the network funnel block. Rendered at the
 * foot of an intelligence-hub content page (numiworks destination guides,
 * itineraries, things-to-do), it hands the reader off to the booking brands
 * with city-specific, crawlable links.
 *
 * Presentational only: the caller computes `links` (e.g. via
 * `cityBookingLinks(slug, { exclude: 'numiworks' })`). Links are real
 * <a href> in the static HTML — followed on purpose, to pass the hub's
 * authority to the booking brands. Renders nothing when `links` is empty.
 */
export function CrossBrandBooking({
  cityName,
  links,
}: {
  cityName: string;
  links: CrossBrandBookingLink[];
}) {
  if (!links || links.length === 0) return null;

  return (
    <section
      aria-labelledby="book-trip-heading"
      style={{ margin: '0 auto 3.5rem', maxWidth: '64rem', padding: '0 1.5rem', width: '100%' }}
    >
      <div
        style={{
          borderRadius: '1rem',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-raised)',
          padding: '2rem 1.5rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label, 0.75rem)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
            margin: 0,
          }}
        >
          Ready to go?
        </p>
        <h2
          id="book-trip-heading"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)',
            fontWeight: 500,
            color: 'var(--ink-primary)',
            margin: '0.3rem 0 0.5rem',
          }}
        >
          Book your trip to {cityName}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            margin: '0 0 1.5rem',
            maxWidth: '40rem',
          }}
        >
          Continue to our booking sites for live prices in {cityName} — hotels, whole-home
          vacation rentals, and flights.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {links.map((l) => (
            <a key={l.name} href={l.href} target="_blank" rel="noopener" style={cardStyle}>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1.02rem',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                }}
              >
                {l.books} in {cityName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: 'var(--ink-secondary)',
                  flex: 1,
                }}
              >
                {l.blurb}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                }}
              >
                {l.name} · via {l.partner} <span aria-hidden>→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-base)',
  padding: '1.1rem 1.15rem',
  textDecoration: 'none',
};
