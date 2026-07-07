import Image from 'next/image';
import Link from 'next/link';
import type { CuratedDestination } from '@lib/curation/destinations';

interface DestinationCardProps {
  destination: CuratedDestination;
  /** Optional photo to use as the card visual. */
  imageUrl?: string;
  imageAlt?: string;
}

/**
 * Card used on the /destinations index. Photo + name + headline +
 * oneLiner. Click → /destinations/[slug].
 */
export function DestinationCard({ destination, imageUrl, imageAlt }: DestinationCardProps) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group block overflow-hidden rounded-[16px] border transition-colors hover:border-[color:var(--border-emphasis)]"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {imageUrl ? (
        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
          <Image
            src={imageUrl}
            alt={imageAlt ?? destination.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="p-5">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {destination.region}
        </p>
        <h3
          className="mt-1"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-sm)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {destination.name}
        </h3>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.45,
          }}
        >
          {destination.headline}
        </p>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 300,
            color: 'var(--ink-tertiary)',
            lineHeight: 1.5,
          }}
        >
          {destination.oneLiner}
        </p>
      </div>
    </Link>
  );
}
