import Link from 'next/link';

/**
 * On-brand SEO footer — the internal-link surface that funnels crawlers and
 * visitors into gotript's real planning + booking pages.
 *
 * Replaces the retired Viator `/search?q=…` footer: every link now points at an
 * indexable gotript page — the "where to stay in {city}" decision pages (each
 * ranks the best neighborhoods + hands off to tracked Expedia/VRBO), the full
 * destination guides, and the property-type landings — and the disclaimer is
 * Expedia, not Viator. Cities are guide-backed, so every link resolves.
 */

const CITIES = [
  { name: 'Rome', slug: 'rome' },
  { name: 'Paris', slug: 'paris' },
  { name: 'Tokyo', slug: 'tokyo' },
  { name: 'Barcelona', slug: 'barcelona' },
  { name: 'Lisbon', slug: 'lisbon' },
  { name: 'New York', slug: 'new-york' },
  { name: 'Bali', slug: 'bali' },
  { name: 'Santorini', slug: 'santorini' },
  { name: 'Dubai', slug: 'dubai' },
  { name: 'Marrakech', slug: 'marrakech' },
  { name: 'Reykjavík', slug: 'reykjavik' },
  { name: 'Cappadocia', slug: 'cappadocia' },
] as const;

const STAY_TYPES = [
  { label: 'Vacation rentals', href: '/vacation-rentals' },
  { label: 'Villas', href: '/villas' },
  { label: 'Cabins', href: '/cabins' },
  { label: 'Cottages', href: '/cottages' },
  { label: 'Beach houses', href: '/beach-houses' },
  { label: 'Lake houses', href: '/lake-houses' },
  { label: 'Luxury villas', href: '/luxury-villas' },
  { label: 'Family villas', href: '/family-villas' },
  { label: 'Pet-friendly rentals', href: '/pet-friendly-villas' },
  { label: 'Hotels & stays', href: '/stays' },
] as const;

const STATIC_LINKS = [
  { label: 'Plan a trip', href: '/plan' },
  { label: 'All destinations', href: '/destinations' },
  { label: 'Vacation rentals', href: '/vacation-rentals' },
] as const;

export function SeoLinkFooter() {
  return (
    <section
      className="relative w-full border-t"
      style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-18">
        <div className="grid gap-10 md:grid-cols-3">
          <FooterColumn
            title="Where to stay"
            links={CITIES.map((c) => ({
              label: `Where to stay in ${c.name}`,
              href: `/where-to-stay-in-${c.slug}`,
            }))}
          />
          <FooterColumn
            title="Destination guides"
            links={CITIES.map((c) => ({
              label: `${c.name} travel guide`,
              href: `/destinations/${c.slug}`,
            }))}
          />
          <FooterColumn title="Stays by type" links={[...STAY_TYPES]} />
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
            gotript.com is an Expedia affiliate. We earn a commission on bookings made through our
            links; the price you pay is identical to booking direct.
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
        className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {links.map((l) => (
          <li key={l.href}>
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
