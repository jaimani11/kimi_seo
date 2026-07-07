import Link from 'next/link';

/**
 * Wide SEO footer — the column-rich link grid that every successful
 * affiliate marketplace runs at the very bottom. Each link is an
 * indexable entry-point for Google. Cities × categories × intent
 * keywords compound the long-tail surface area.
 *
 * All links point at /search?q=… so they share the existing SSR'd
 * surface (no maintenance burden of one-off pages per city).
 */

const TOP_CITIES = [
  'Tokyo, Japan',
  'Paris, France',
  'Rome, Italy',
  'New York, USA',
  'London, UK',
  'Bali, Indonesia',
  'Barcelona, Spain',
  'Lisbon, Portugal',
  'Marrakech, Morocco',
  'Dubai, UAE',
  'Bangkok, Thailand',
  'Istanbul, Türkiye',
  'Reykjavík, Iceland',
  'Cappadocia, Türkiye',
  'Santorini, Greece',
  'Cancún, Mexico',
  'Sydney, Australia',
  'Cape Town, South Africa',
  'Buenos Aires, Argentina',
  'Mumbai, India',
];

const CATEGORIES = [
  { label: 'Food tours', q: 'food tour' },
  { label: 'Cooking classes', q: 'cooking class' },
  { label: 'Wine tastings', q: 'wine tasting' },
  { label: 'Private tours', q: 'private tour' },
  { label: 'Day trips', q: 'day trip' },
  { label: 'Adventure', q: 'adventure outdoor' },
  { label: 'Boat & sailing', q: 'boat sail cruise' },
  { label: 'Snorkel & diving', q: 'snorkel scuba' },
  { label: 'Skip-the-line', q: 'skip the line' },
  { label: 'Family-friendly', q: 'family kids' },
  { label: 'Walking tours', q: 'walking tour' },
  { label: 'Historical', q: 'historical tour' },
  { label: 'Hot-air balloon', q: 'hot air balloon' },
  { label: 'Sunset cruises', q: 'sunset cruise' },
  { label: 'Cultural shows', q: 'cultural show' },
  { label: 'Multi-day tours', q: 'multi day tour' },
];

const INTENT_PAIRS = [
  { label: 'Cooking class Tokyo', q: 'cooking class Tokyo' },
  { label: 'Cooking class Rome', q: 'cooking class Rome' },
  { label: 'Food tour Lisbon', q: 'food tour Lisbon' },
  { label: 'Food tour Paris', q: 'food tour Paris' },
  { label: 'Hot-air balloon Cappadocia', q: 'hot air balloon Cappadocia' },
  { label: 'Northern Lights Iceland', q: 'Northern Lights Iceland' },
  { label: 'Glacier hike Iceland', q: 'glacier hike Iceland' },
  { label: 'Snorkel Bali', q: 'snorkel Bali' },
  { label: 'Desert safari Marrakech', q: 'desert safari Marrakech' },
  { label: 'Sunset cruise Santorini', q: 'sunset cruise Santorini' },
  { label: 'Vatican skip the line', q: 'Vatican skip the line' },
  { label: 'Louvre tour', q: 'Louvre tour' },
  { label: 'Eiffel Tower tour', q: 'Eiffel Tower tour' },
  { label: 'Pompeii day trip', q: 'Pompeii day trip' },
  { label: 'Wine tour Florence', q: 'wine tour Florence' },
  { label: 'Day trip from Tokyo', q: 'day trip from Tokyo' },
];

const STATIC_LINKS = [
  { label: 'AI concierge', href: '/' },
  { label: 'Plan a trip', href: '/plan' },
  { label: 'All destinations', href: '/destinations' },
  { label: 'Search experiences', href: '/search' },
];

export function SeoLinkFooter() {
  return (
    <section
      className="relative w-full border-t"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-18">
        <div className="grid gap-10 md:grid-cols-3">
          <FooterColumn
            title="Top destinations"
            links={TOP_CITIES.map((city) => ({
              label: city,
              href: `/search?q=${encodeURIComponent(city)}`,
            }))}
          />
          <FooterColumn
            title="Things to do"
            links={CATEGORIES.map((c) => ({
              label: c.label,
              href: `/search?q=${encodeURIComponent(c.q)}`,
            }))}
          />
          <FooterColumn
            title="High-intent searches"
            links={INTENT_PAIRS.map((p) => ({
              label: p.label,
              href: `/search?q=${encodeURIComponent(p.q)}`,
            }))}
          />
        </div>

        <div
          className="mt-12 grid gap-4 border-t pt-8 md:grid-cols-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <ul
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {STATIC_LINKS.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--ink-primary)',
                    textDecoration: 'none',
                  }}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
          <p
            className="md:text-right"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.74rem',
              color: 'var(--ink-tertiary)',
              margin: 0,
            }}
          >
            stayviaowner.com is a Viator affiliate. We earn a small commission on bookings made
            through our links; the price you pay is identical to booking direct.
          </p>
        </div>
      </div>
    </section>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          fontWeight: 600,
          margin: 0,
          marginBottom: '1rem',
        }}
      >
        {title}
      </h3>
      <ul
        className="grid grid-cols-2 gap-x-4 gap-y-1.5"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                lineHeight: 1.5,
                color: 'var(--ink-secondary)',
                textDecoration: 'none',
              }}
              className="hover:text-[color:var(--ink-primary)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
