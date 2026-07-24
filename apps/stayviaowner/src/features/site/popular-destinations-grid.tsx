import Link from 'next/link';
import Image from 'next/image';
import { findCityBySlug } from '@adored/seo-data';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';

/**
 * Popular destinations grid — the photo-rich tiles that carry the homepage's
 * visual weight. stayviaowner's roster is deliberately its OWN: the whole-home
 * VACATION-RENTAL market (US beach / city / mountain hubs where people book an
 * entire cabin, condo or beach house — not a hotel room), so no two brands'
 * grids look alike. Photos resolve per-city from @adored/imagery. Each tile
 * deep-links to that city's whole-home rental guide.
 *
 * Every slug here is verified to (a) resolve in @adored/seo-data and (b) have a
 * live /destinations/{slug} guide (200) — so no tile 404s or drops. Smaller
 * rental markets (Gatlinburg, Destin, Outer Banks, Broken Bow, Lake Tahoe,
 * Palm Springs, Scottsdale…) are NOT in the shared city dataset yet and need a
 * data+guide task before they can appear. No fabricated prices/ratings/counts.
 */

const ROSTER: readonly string[] = [
  'maui', 'nashville', 'new-orleans', 'miami', 'charleston', 'austin',
  'san-diego', 'whistler', 'honolulu', 'savannah', 'banff', 'santorini',
];

interface Destination {
  name: string;
  country: string;
  slug: string;
  photoUrl: string;
}

const DESTINATIONS: readonly Destination[] = ROSTER.flatMap((slug) => {
  const city = findCityBySlug(slug);
  if (!city) return [];
  const photo = resolveDestinationPhoto({ name: city.name, country: city.countryCode });
  return [{ name: city.name, country: city.countryName, slug: city.slug, photoUrl: photo.url }];
});

export function PopularDestinationsGrid() {
  return (
    <section
      className="relative w-full"
      style={{
        background:
          'linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface-base) 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
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
              Trending destinations
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'clamp(1.85rem, 3.6vw, 2.8rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: 'var(--ink-primary)',
                margin: 0,
              }}
            >
              Where travelers are{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
                renting now.
              </em>
            </h2>
            <p
              className="mt-3"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.92rem',
                lineHeight: 1.5,
                color: 'var(--ink-primary)',
                opacity: 0.72,
                margin: 0,
                maxWidth: '34rem',
              }}
            >
              Every destination, mapped for whole-home stays — the best areas to rent:
            </p>
            <ul
              className="mt-3 flex flex-wrap gap-2"
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {['Best areas to rent', 'Interactive map', 'Whole-home tips'].map(
                (feat) => (
                  <li
                    key={feat}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--ink-primary)',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '999px',
                      padding: '0.34rem 0.7rem',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: '0.34rem',
                        height: '0.34rem',
                        borderRadius: '999px',
                        background: 'var(--accent-primary)',
                      }}
                    />
                    {feat}
                  </li>
                ),
              )}
            </ul>
          </div>
          <Link
            href="/destinations"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            See all destinations →
          </Link>
        </header>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <li key={d.name}>
              <Link
                href={`/destinations/${d.slug}`}
                className="group relative block w-full overflow-hidden"
                style={{
                  aspectRatio: '3 / 4',
                  borderRadius: '1rem',
                  background: '#0c0c0e',
                  textDecoration: 'none',
                }}
              >
                <Image
                  src={d.photoUrl}
                  alt={`${d.name}, ${d.country}`}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.9) 100%)',
                  }}
                />
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1"
                  style={{
                    background: 'rgba(0,0,0,0.62)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#FFE6B5',
                    }}
                  >
                    Guide
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.62rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(237,230,219,0.8)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                      margin: 0,
                    }}
                  >
                    {d.country}
                  </p>
                  <h3
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-fraunces)',
                      fontSize: '1.45rem',
                      fontWeight: 500,
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      color: '#EDE6DB',
                      textShadow: '0 1px 6px rgba(0,0,0,0.65)',
                      margin: 0,
                    }}
                  >
                    {d.name}
                  </h3>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'rgba(237,230,219,0.92)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                      margin: 0,
                    }}
                  >
                    Areas · map · where to rent →
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
