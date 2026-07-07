import type { SeoCity } from '@lib/seo/cities';

/**
 * VRBO cross-brand callout — sits below the destination hero on
 * every gobookt destination guide, giving VRBO commission share of
 * destination-page traffic that would otherwise go straight to
 * Booking.com hotels.
 *
 * gobookt is the Booking.com brand, so the VRBO CTA is intentionally
 * secondary (not the primary hero CTA), and uses the shortlink form
 * `vrbo.com/affiliate/{deeplink}` rather than a full search URL — the
 * shortlink is Expedia Group's affiliate-tagged bounce point and
 * commissions correctly no matter which of our brands hosts it.
 *
 * Env:
 *   NEXT_PUBLIC_VRBO_SHORTLINK  Optional override for the affiliate
 *                               shortlink. Defaults to the account's
 *                               Link Builder-generated bounce URL.
 */

const DEFAULT_SHORTLINK = 'https://vrbo.com/affiliate/zVJTNin';

export function VrboCityCallout({ city }: { city: SeoCity }) {
  const shortlink = (
    process.env.NEXT_PUBLIC_VRBO_SHORTLINK || DEFAULT_SHORTLINK
  ).trim();

  return (
    <section className="mx-auto max-w-4xl px-6 pt-6 md:pt-10">
      <a
        href={shortlink}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:border-[color:var(--accent-primary)]"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
          textDecoration: 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#0079C1',
              fontWeight: 800,
              margin: 0,
            }}
          >
            Whole homes · Vacation rentals on VRBO
          </p>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              fontWeight: 700,
              lineHeight: 1.35,
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            Prefer a full kitchen and more space than a hotel in {city.name}?
          </p>
          <p
            className="mt-0.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.82rem',
              lineHeight: 1.45,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            Browse VRBO cabins, villas and apartments (Expedia Group brand).
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-inter)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#0079C1',
            whiteSpace: 'nowrap',
          }}
        >
          See on VRBO →
        </span>
      </a>
    </section>
  );
}
