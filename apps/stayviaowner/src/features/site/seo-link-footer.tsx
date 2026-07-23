import Link from 'next/link';

/**
 * On-brand SEO footer — the internal-link surface that funnels crawlers and
 * visitors into stayviaowner's real whole-home rental pages.
 *
 * Replaces the inherited Viator `/search?q=…` experiences footer (a fork
 * leak from numiworks): every link now points at an indexable stayviaowner
 * page — the property-type hubs (villas, cabins, beach houses…), the
 * amenity/vibe hubs, and the destination rental guides — and the disclosure
 * is Vrbo, not Viator. Every href resolves to a live route.
 */

const HOME_TYPES = [
  { label: 'Villas', href: '/villas' },
  { label: 'Cabins', href: '/cabins' },
  { label: 'Beach houses', href: '/beach-houses' },
  { label: 'Lake houses', href: '/lake-houses' },
  { label: 'Cottages', href: '/cottages' },
  { label: 'Chalets', href: '/chalets' },
  { label: 'Farmhouses', href: '/farmhouses' },
  { label: 'Mansions', href: '/mansions' },
  { label: 'Condos', href: '/condos' },
  { label: 'Penthouses', href: '/penthouses' },
] as const;

const HOME_VIBES = [
  { label: 'Luxury villas', href: '/luxury-villas' },
  { label: 'Family villas', href: '/family-villas' },
  { label: 'Private-pool villas', href: '/private-pool-villas' },
  { label: 'Pet-friendly rentals', href: '/pet-friendly-villas' },
  { label: 'Beach villas', href: '/beach-villas' },
  { label: 'Ski lodges', href: '/ski-lodges' },
  { label: 'Glamping', href: '/glamping' },
  { label: 'All vacation rentals', href: '/vacation-rentals' },
] as const;

const CITIES = [
  { name: 'Santorini', slug: 'santorini' },
  { name: 'Bali', slug: 'bali' },
  { name: 'Cappadocia', slug: 'cappadocia' },
  { name: 'Reykjavík', slug: 'reykjavik' },
  { name: 'Lisbon', slug: 'lisbon' },
  { name: 'Barcelona', slug: 'barcelona' },
  { name: 'Rome', slug: 'rome' },
  { name: 'Marrakech', slug: 'marrakech' },
  { name: 'Paris', slug: 'paris' },
  { name: 'Dubai', slug: 'dubai' },
  { name: 'Tokyo', slug: 'tokyo' },
  { name: 'New York', slug: 'new-york' },
] as const;

const STATIC_LINKS = [
  { label: 'Plan a trip', href: '/plan' },
  { label: 'All destinations', href: '/destinations' },
  { label: 'All vacation rentals', href: '/vacation-rentals' },
] as const;

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
          <FooterColumn title="Homes by type" links={[...HOME_TYPES]} />
          <FooterColumn title="Homes by vibe" links={[...HOME_VIBES]} />
          <FooterColumn
            title="Vacation rentals by destination"
            links={CITIES.map((c) => ({
              label: c.name,
              href: `/destinations/${c.slug}`,
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
              <li key={s.href}>
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
            stayviaowner.com is a Vrbo affiliate. We earn a referral commission on bookings made
            through our links; the price you pay is identical to booking on Vrbo directly.
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
