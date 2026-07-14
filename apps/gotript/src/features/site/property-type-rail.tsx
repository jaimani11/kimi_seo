import Link from 'next/link';

/**
 * "Browse by home type" — the accommodation-first rail that makes GoTript
 * read as a whole-home platform, not a generic OTA. Each card deep-links to
 * an existing property-type landing (/villas, /cabins, …) — pure internal
 * linking to the SEO sub-brand pages, no affiliate redirect here (the CTAs
 * on those pages carry the tracked Expedia/VRBO links).
 *
 * Gradient + emoji cards rather than photos: property *types* don't map to a
 * single destination photo, and self-hosted gradients never 404. Theme-aware
 * via a white ink on a saturated ground that reads in both light + dark.
 */

interface HomeType {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  bg: string;
}

const HOME_TYPES: readonly HomeType[] = [
  { slug: 'beach-houses', name: 'Beach houses', tagline: 'Wake up to the water', emoji: '🏖️', bg: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)' },
  { slug: 'villas', name: 'Villas', tagline: 'Private pools & space to spread out', emoji: '🏛️', bg: 'linear-gradient(135deg, #b45309 0%, #e08a1e 100%)' },
  { slug: 'cabins', name: 'Cabins', tagline: 'Log fires & mountain air', emoji: '🌲', bg: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)' },
  { slug: 'cottages', name: 'Cottages', tagline: 'Cozy countryside escapes', emoji: '🏡', bg: 'linear-gradient(135deg, #3f6212 0%, #84cc16 100%)' },
  { slug: 'luxury-villas', name: 'Luxury villas', tagline: 'Concierge & chef optional', emoji: '✨', bg: 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)' },
  { slug: 'family-villas', name: 'Family villas', tagline: 'Room for the whole crew', emoji: '🧺', bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' },
  { slug: 'private-pool-villas', name: 'Villas with pools', tagline: 'Your own private pool', emoji: '🏊', bg: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)' },
  { slug: 'pet-friendly-villas', name: 'Pet-friendly rentals', tagline: 'Bring the whole family', emoji: '🐾', bg: 'linear-gradient(135deg, #9a3412 0%, #f97316 100%)' },
];

export function PropertyTypeRail() {
  return (
    <section
      className="relative w-full"
      style={{ background: 'var(--surface-base)' }}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <header className="mb-8 max-w-2xl">
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
            Whole-home rentals
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
            More space. More privacy.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              A place of your own.
            </em>
          </h2>
          <p
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: '0.75rem 0 0',
            }}
          >
            Whole homes with kitchens, room for groups, and no shared walls — booked through
            Expedia&nbsp;Group and VRBO.
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {HOME_TYPES.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="group relative flex w-full flex-col justify-between overflow-hidden transition-transform hover:scale-[1.02]"
                style={{
                  aspectRatio: '4 / 3',
                  borderRadius: '1rem',
                  background: t.bg,
                  padding: '1.1rem 1.15rem',
                  textDecoration: 'none',
                  boxShadow: '0 10px 30px -14px rgba(0,0,0,0.35)',
                }}
              >
                <span
                  aria-hidden
                  style={{ fontSize: '1.9rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
                >
                  {t.emoji}
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '1.02rem',
                      fontWeight: 700,
                      lineHeight: 1.15,
                      letterSpacing: '-0.01em',
                      color: '#ffffff',
                      textShadow: '0 1px 4px rgba(0,0,0,0.28)',
                      margin: 0,
                    }}
                  >
                    {t.name}
                  </h3>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.76rem',
                      lineHeight: 1.35,
                      color: 'rgba(255,255,255,0.92)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.28)',
                      margin: '0.25rem 0 0',
                    }}
                  >
                    {t.tagline}
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
