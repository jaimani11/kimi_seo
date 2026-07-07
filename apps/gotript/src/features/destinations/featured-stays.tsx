import Image from 'next/image';
import Link from 'next/link';
import type { Stay } from '@core/stay';

interface FeaturedStaysProps {
  stays: readonly Stay[];
  /** Encoded prompt to seed the workspace input bar on click. */
  prefillPrompt: string;
}

/**
 * Grid of featured stays for a destination page. Read-only - clicking
 * a card lands the visitor in the workspace with the destination's
 * prompt pre-filled, so they can run their own search.
 */
export function FeaturedStays({ stays, prefillPrompt }: FeaturedStaysProps) {
  if (stays.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-12">
      <h2
        className="mb-5"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        Featured stays
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stays.map((stay) => (
          <Link
            key={stay.id}
            href={`/?prompt=${encodeURIComponent(prefillPrompt)}`}
            className="group block overflow-hidden rounded-[14px] border transition-colors hover:border-[color:var(--border-emphasis)]"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {stay.photos[0] ? (
              <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                <Image
                  src={stay.photos[0].url}
                  alt={stay.photos[0].alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            ) : null}
            <div className="p-4">
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                }}
              >
                {stay.location.locality ?? stay.location.region ?? stay.location.country}
              </p>
              <h3
                className="mt-1 truncate"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-body-lg)',
                  fontWeight: 400,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {stay.name}
              </h3>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--accent-primary)',
                  letterSpacing: '-0.005em',
                }}
              >
                {stay.pricing.pricePerNight.amount.toLocaleString()}{' '}
                {stay.pricing.pricePerNight.currency}{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    color: 'var(--ink-tertiary)',
                  }}
                >
                  / night
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
