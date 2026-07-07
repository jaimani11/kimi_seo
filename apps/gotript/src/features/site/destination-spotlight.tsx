import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@/features/shared/icons';

/**
 * Browse-by-destination grid. Each card links to /search?q=<city> so
 * the visitor lands on real Viator results for that city. Static
 * metadata, but the destination card itself is a live entry point.
 */

interface DestinationTile {
  name: string;
  country: string;
  photoId: string;
  alt: string;
  query: string;
}

const DESTINATIONS: readonly DestinationTile[] = [
  {
    name: 'Tokyo',
    country: 'Japan',
    photoId: '1540959733332-eab4deabeeaf',
    alt: 'Tokyo Shibuya at night',
    query: 'Tokyo',
  },
  {
    name: 'Paris',
    country: 'France',
    photoId: '1502602898657-3e91760cbb34',
    alt: 'Paris rooftops at dusk',
    query: 'Paris',
  },
  {
    name: 'Rome',
    country: 'Italy',
    photoId: '1531572753322-ad063cecc140',
    alt: 'Rome via Italica at dusk',
    query: 'Rome',
  },
  {
    name: 'Cappadocia',
    country: 'Türkiye',
    photoId: '1641128324972-af3212f0f6bd',
    alt: 'Cappadocia balloons at sunrise',
    query: 'Cappadocia',
  },
  {
    name: 'Iceland',
    country: 'Reykjavík',
    photoId: '1500530855697-b586d89ba3ee',
    alt: 'Iceland glacier landscape',
    query: 'Iceland',
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    photoId: '1537996194471-e657df975ab4',
    alt: 'Bali rice terraces',
    query: 'Bali',
  },
  {
    name: 'New York',
    country: 'USA',
    photoId: '1492571350019-22de08371fd3',
    alt: 'New York skyline at night',
    query: 'New York',
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    photoId: '1539020140153-e8c81bb6b8a4',
    alt: 'Marrakech medina rooftops',
    query: 'Marrakech',
  },
];

function unsplashUrl(id: string, width: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&fit=crop&auto=format`;
}

export function DestinationSpotlight() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <header className="mb-10 flex max-w-2xl flex-col gap-2">
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.65rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          Browse by destination
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Eight cities to start with.
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '0.95rem',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.5,
            color: 'var(--ink-tertiary)',
            margin: 0,
          }}
        >
          Tap any to see what&rsquo;s bookable there right now.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {DESTINATIONS.map((d) => (
          <DestinationCard key={d.name} tile={d} />
        ))}
      </div>
    </section>
  );
}

function DestinationCard({ tile }: { tile: DestinationTile }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(tile.query)}`}
      aria-label={`Browse experiences in ${tile.name}`}
      className="group relative block overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        aspectRatio: '4/5',
        borderRadius: '0.85rem',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
        textDecoration: 'none',
      }}
    >
      <Image
        src={unsplashUrl(tile.photoId, 800)}
        alt={tile.alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.82) 100%)',
        }}
      />

      {/* Hairline accent border on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
      />

      <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-2">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.6rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(237,230,219,0.82)',
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
            }}
          >
            {tile.country}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.35rem',
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: '#EDE6DB',
              textShadow: '0 1px 6px rgba(0,0,0,0.7)',
            }}
          >
            {tile.name}
          </div>
        </div>
        <span
          aria-hidden
          className="transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: 'rgba(237,230,219,0.9)' }}
        >
          <ArrowRight size={16} strokeWidth={1.8} />
        </span>
      </div>
    </Link>
  );
}
