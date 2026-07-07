'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SafePropertyPhoto } from './safe-property-photo';
import type { PropertyPhoto } from '@lib/discovery/property';

interface DestinationChipCardProps {
  /** URL-safe slug used to deeplink to `/destinations/[slug]`. */
  slug: string;
  /** Display name ("Paris", "Tuscany"). */
  name: string;
  /** Sub-label ("France", "Italy · countryside"). */
  region: string;
  photo: PropertyPhoto;
  /** Optional count surfaced under the name ("12 stays curated"). */
  stayCount?: number;
}

/**
 * Destination chip card. Used in supporting sections of the homepage
 * and the cross-link footer of each `/destinations/[slug]` page.
 *
 * Smaller and squarer than property cards because its job is purely
 * navigational: "click here to browse stays in Paris." No price, no
 * rating, no editorial pitch — that lives on the destination page.
 */
export function DestinationChipCard({
  slug,
  name,
  region,
  photo,
  stayCount,
}: DestinationChipCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
    >
      <Link
        href={`/destinations/${slug}`}
        aria-label={`Browse stays in ${name}`}
        className="group relative block w-full overflow-hidden"
        style={{
          aspectRatio: '1 / 1',
          borderRadius: '0.85rem',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)',
          boxShadow: 'var(--elev-card)',
          textDecoration: 'none',
        }}
      >
        <SafePropertyPhoto
          photo={photo}
          width={500}
          sizes="(max-width: 768px) 45vw, 18vw"
        />

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.8) 100%)',
          }}
        />

        <div className="absolute right-3 bottom-3 left-3">
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.1rem',
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              color: '#EDE6DB',
              textShadow: '0 1px 4px rgba(0,0,0,0.7)',
            }}
          >
            {name}
          </div>
          <div
            className="mt-1 flex items-center gap-1.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.08em',
              color: 'rgba(237,230,219,0.78)',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            <span>{region}</span>
            {typeof stayCount === 'number' ? (
              <>
                <span aria-hidden style={{ opacity: 0.5 }}>·</span>
                <span>{stayCount} stays</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
