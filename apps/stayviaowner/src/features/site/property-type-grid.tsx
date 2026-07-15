import Link from 'next/link';

/**
 * Property-type grid on the stayviaowner home page — 6 cards linking
 * to the sub-brand category pages that already exist under
 * /villas, /cabins, /cottages, /beach-houses, /ski-lodges,
 * /lake-houses.
 */

const NAVY = '#0f2340';
const NAVY_DEEP = '#0a1930';

const TYPES: readonly {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  imageUrl: string;
}[] = [
  {
    slug: 'villas',
    name: 'Villas',
    emoji: '🏛️',
    tagline: 'Private pool + full staff — Tuscany to Bali.',
    imageUrl:
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'cabins',
    name: 'Cabins',
    emoji: '🪵',
    tagline: 'Wood-stove nights + no signal — Rockies to Alps.',
    imageUrl:
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'cottages',
    name: 'Cottages',
    emoji: '🏡',
    tagline: 'Small, cozy, lake-facing or thatched-roof.',
    imageUrl:
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'beach-houses',
    name: 'Beach houses',
    emoji: '🏖️',
    tagline: 'Sand outside the door, sunset from the deck.',
    imageUrl:
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'ski-lodges',
    name: 'Ski lodges',
    emoji: '⛷️',
    tagline: 'Ski-in ski-out, fireplace roaring.',
    imageUrl:
      'https://images.unsplash.com/photo-1548786811-dc0dfd9d59a3?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'lake-houses',
    name: 'Lake houses',
    emoji: '🛶',
    tagline: 'Dock outside, pontoon included, sunset on the water.',
    imageUrl:
      'https://images.unsplash.com/photo-1439130490301-25e322d88054?w=1200&q=80&auto=format&fit=crop',
  },
];

export function PropertyTypeGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="text-center">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#37d0a1',
            fontWeight: 700,
          }}
        >
          Browse by property type
        </p>
        <h2
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: NAVY_DEEP,
            margin: 0,
          }}
        >
          Every kind of stay — bookable through Vrbo.
        </h2>
      </div>

      <div
        className="mt-10 grid gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        {TYPES.map((t) => (
          <Link
            key={t.slug}
            href={`/${t.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '0.85rem',
              overflow: 'hidden',
              background: '#fff',
              border: '1px solid rgba(15,35,64,0.10)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '210px',
                backgroundImage: `url(${t.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '0.85rem',
                  left: '0.85rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  background: 'rgba(15,35,64,0.7)',
                  color: '#fff',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {t.emoji} {t.name}
              </div>
            </div>
            <div style={{ padding: '1.2rem 1.35rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: NAVY_DEEP,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Browse {t.name.toLowerCase()}
              </h3>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.45,
                  color: 'rgba(15,35,64,0.7)',
                  margin: '0.4rem 0 0',
                }}
              >
                {t.tagline}
              </p>
              <span
                className="mt-3 inline-flex items-center"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: NAVY,
                  gap: '0.35rem',
                }}
              >
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
