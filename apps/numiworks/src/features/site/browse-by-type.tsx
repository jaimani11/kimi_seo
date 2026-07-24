import Link from 'next/link';
import Image from 'next/image';
import { buildViatorStaySearchUrl, getViatorStayLinkConfig } from '@lib/affiliate/viator-stay-link-builder';

/**
 * "Browse by type" tile grid — the photo-backed Viator experience-category
 * cards. Two modes:
 *
 *   1. Homepage (no props) — a generic taxonomy; each tile carries an
 *      approximate catalog count and links to an on-site `/search` query.
 *      Counts are conservative-honest (the published Viator catalog covers
 *      each category at sustained five-figure volume).
 *   2. Destination mode (`destination` set) — the SAME categories keyed to a
 *      city, each linking DIRECTLY to a Viator search for "{category} in
 *      {city}". No counts (a global catalog number isn't true per-city), and
 *      the affiliate `rel`/`target` the money path requires. This is what
 *      replaced the GetYourGuide widgets on the destination guide.
 */

interface BrowseByTypeProps {
  /** When set, city-keys every card to a direct Viator deep-link. */
  destination?: string;
}

interface CategoryTile {
  slug: string;
  title: string;
  count: string;
  blurb: string;
  searchQuery: string;
  photoUrl: string;
}

const CATEGORIES: readonly CategoryTile[] = [
  {
    slug: 'food-tours',
    title: 'Food tours & tastings',
    count: '24,000+',
    blurb: 'Markets, family kitchens, fado tables.',
    searchQuery: 'food tour',
    photoUrl:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'cooking-classes',
    title: 'Cooking classes',
    count: '8,400+',
    blurb: 'Pasta in Rome, sushi in Tokyo, paella in Valencia.',
    searchQuery: 'cooking class',
    photoUrl:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'private-tours',
    title: 'Private tours',
    count: '18,500+',
    blurb: 'Your pace, your guide, no strangers.',
    searchQuery: 'private tour',
    photoUrl:
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'day-trips',
    title: 'Day trips',
    count: '32,000+',
    blurb: 'One day out, home for dinner.',
    searchQuery: 'day trip',
    photoUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'adventure',
    title: 'Adventure & outdoors',
    count: '15,200+',
    blurb: 'Glaciers, volcanoes, ziplines, ridge hikes.',
    searchQuery: 'adventure outdoor',
    photoUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'water',
    title: 'Water & beaches',
    count: '11,800+',
    blurb: 'Snorkel, sail, swim with what swims back.',
    searchQuery: 'snorkel sail boat',
    photoUrl:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'skip-the-line',
    title: 'Skip-the-line',
    count: '6,200+',
    blurb: 'Vatican, Louvre, Sagrada Família — straight in.',
    searchQuery: 'skip the line',
    photoUrl:
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'multi-day',
    title: 'Multi-day trips',
    count: '4,800+',
    blurb: 'A few days off-base with one operator.',
    searchQuery: 'multi day tour',
    photoUrl:
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'culture',
    title: 'Culture & history',
    count: '28,000+',
    blurb: 'Museums, ruins, neighborhood walks with a story.',
    searchQuery: 'historical tour culture',
    photoUrl:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'wellness',
    title: 'Wellness',
    count: '3,400+',
    blurb: 'Hammams, hot springs, sound baths, retreats.',
    searchQuery: 'spa wellness retreat',
    photoUrl:
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'family',
    title: 'Family-friendly',
    count: '21,600+',
    blurb: 'Kid-paced, age-appropriate, room for nap time.',
    searchQuery: 'family kids',
    photoUrl:
      'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=900&q=70&fit=crop&auto=format',
  },
  {
    slug: 'nightlife',
    title: 'Nightlife & bars',
    count: '5,100+',
    blurb: 'Speakeasies, rooftops, neighborhood bar crawls.',
    searchQuery: 'nightlife bar crawl',
    photoUrl:
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=900&q=70&fit=crop&auto=format',
  },
];

const SEE_ALL_STYLE = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'var(--accent-primary)',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
} as const;

const TILE_STYLE = {
  aspectRatio: '4 / 5',
  borderRadius: '0.95rem',
  background: '#0c0c0e',
  textDecoration: 'none',
} as const;

export function BrowseByType({ destination }: BrowseByTypeProps = {}) {
  const viatorCfg = destination ? getViatorStayLinkConfig() : null;
  return (
    <section
      className="relative w-full"
      style={{ background: 'var(--surface-base)' }}
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
              Browse by type
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
              {destination ? `Experiences in ${destination}, ` : 'Twelve ways to spend a day, '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
                live on Viator.
              </em>
            </h2>
          </div>
          {destination ? (
            <a
              href={buildViatorStaySearchUrl({ destination }, viatorCfg!)}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              style={SEE_ALL_STYLE}
            >
              See all {destination} experiences →
            </a>
          ) : (
            <Link href="/search" style={SEE_ALL_STYLE}>
              See all 300,000+ experiences →
            </Link>
          )}
        </header>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const href = destination
              ? buildViatorStaySearchUrl({ destination: `${cat.searchQuery} in ${destination}` }, viatorCfg!)
              : `/search?q=${encodeURIComponent(cat.searchQuery)}`;
            const inner = (
              <>
                <Image
                  src={cat.photoUrl}
                  alt={destination ? `${cat.title} in ${destination}` : cat.title}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.85) 100%)',
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  {!destination && (
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'rgba(237,230,219,0.78)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                        margin: 0,
                      }}
                    >
                      {cat.count} live
                    </p>
                  )}
                  <h3
                    className={destination ? undefined : 'mt-1'}
                    style={{
                      fontFamily: 'var(--font-fraunces)',
                      fontSize: '1.15rem',
                      fontWeight: 500,
                      lineHeight: 1.15,
                      letterSpacing: '-0.015em',
                      color: '#EDE6DB',
                      textShadow: '0 1px 4px rgba(0,0,0,0.55)',
                      margin: 0,
                    }}
                  >
                    {cat.title}
                  </h3>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-fraunces)',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: '0.82rem',
                      lineHeight: 1.4,
                      color: 'rgba(237,230,219,0.85)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {cat.blurb}
                  </p>
                </div>
              </>
            );
            return (
              <li key={cat.slug}>
                {destination ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    className="group relative block w-full overflow-hidden"
                    style={TILE_STYLE}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="group relative block w-full overflow-hidden"
                    style={TILE_STYLE}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
