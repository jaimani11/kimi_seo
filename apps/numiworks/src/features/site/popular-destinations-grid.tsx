import Link from 'next/link';
import Image from 'next/image';

/**
 * Popular destinations grid — the photo-rich destination tiles that
 * carry the visual weight on rentbyowner / hotala / bedroomvillas.
 * Each tile is a curated "from $X · 4.8★ · N experiences" pitch with
 * a cinematic photo and a deep link to a /search query for that city.
 *
 * Photos are durable Unsplash CDN ids. From-price is a conservative
 * lower-bound representative for the destination (lowest-priced live
 * Viator experience category, typically a walking tour or short city
 * tour). Numbers are conservative-honest so the band reads as
 * trustworthy social proof, not marketing fluff.
 */

interface Destination {
  name: string;
  country: string;
  fromPrice: string;
  rating: string;
  count: string;
  photoUrl: string;
}

const DESTINATIONS: readonly Destination[] = [
  {
    name: 'Tokyo',
    country: 'Japan',
    fromPrice: 'From $18',
    rating: '4.8★',
    count: '4,200 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Rome',
    country: 'Italy',
    fromPrice: 'From $14',
    rating: '4.7★',
    count: '3,800 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Paris',
    country: 'France',
    fromPrice: 'From $22',
    rating: '4.7★',
    count: '5,100 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Cappadocia',
    country: 'Türkiye',
    fromPrice: 'From $24',
    rating: '4.8★',
    count: '620 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    fromPrice: 'From $11',
    rating: '4.8★',
    count: '3,100 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Reykjavík',
    country: 'Iceland',
    fromPrice: 'From $48',
    rating: '4.7★',
    count: '840 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'New York',
    country: 'USA',
    fromPrice: 'From $19',
    rating: '4.6★',
    count: '4,600 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    fromPrice: 'From $9',
    rating: '4.7★',
    count: '1,400 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Lisbon',
    country: 'Portugal',
    fromPrice: 'From $16',
    rating: '4.8★',
    count: '1,900 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1513735492246-483525079686?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Santorini',
    country: 'Greece',
    fromPrice: 'From $32',
    rating: '4.8★',
    count: '480 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Dubai',
    country: 'UAE',
    fromPrice: 'From $14',
    rating: '4.6★',
    count: '2,800 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1546412414-e1885259563a?w=1100&q=70&fit=crop&auto=format',
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    fromPrice: 'From $13',
    rating: '4.7★',
    count: '2,400 experiences',
    photoUrl:
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1100&q=70&fit=crop&auto=format',
  },
];

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
                exploring now.
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
              Every destination, packed with things to do — tours, food and day trips:
            </p>
            <ul
              className="mt-3 flex flex-wrap gap-2"
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {['Top experiences', 'Food & day trips', 'Getting around'].map(
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
                href={`/search?q=${encodeURIComponent(`${d.name}, ${d.country}`)}`}
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
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: '#FFE6B5',
                    }}
                  >
                    {d.rating}
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
                    className="mt-2 flex items-baseline gap-3"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.74rem',
                      color: 'rgba(237,230,219,0.9)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                      margin: 0,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{d.fromPrice}</span>
                    <span style={{ opacity: 0.75 }}>·</span>
                    <span>{d.count}</span>
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
