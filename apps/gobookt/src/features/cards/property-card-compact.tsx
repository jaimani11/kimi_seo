'use client';

import { motion } from 'framer-motion';
import { buildPropertyAffiliateHref } from './affiliate-href';
import { SafePropertyPhoto } from './safe-property-photo';
import { formatPrice } from './format';
import type { Property } from '@lib/discovery/property';

interface PropertyCardCompactProps {
  property: Property;
}

/**
 * Compact carousel card. Used inside the horizontal carousel rail.
 *
 * Per H3 hybrid booking flow: compact stays *direct hand-off* to the
 * partner. Carousel browsing is meant to feel fluid and exploratory,
 * especially on mobile - the drawer would interrupt that rhythm.
 * The bigger storytelling moment lives on hero / standard / editorial.
 *
 * Visual: photo dominates (5/6 aspect), rating chip on the photo
 * (the one number), destination eyebrow + name + price on the bottom
 * rail. No amenities, no badges, no cancellation chips.
 */
export function PropertyCardCompact({ property }: PropertyCardCompactProps) {
  const href = buildPropertyAffiliateHref(property);

  return (
    <motion.a
      href={href ?? undefined}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      aria-label={`${property.name} in ${property.destination} (affiliate link)`}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      className="group relative block w-full flex-shrink-0 overflow-hidden"
      style={{
        borderRadius: '0.85rem',
        background: 'var(--surface-elevated)',
        boxShadow: 'var(--elev-card)',
        textDecoration: 'none',
      }}
    >
      <div className="relative w-full" style={{ aspectRatio: '5/6' }}>
        <SafePropertyPhoto
          photo={property.photo}
          width={700}
          sizes="(max-width: 768px) 70vw, 22vw"
        />

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.8) 100%)',
          }}
        />

        {/* Hairline luxury border on hover. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
        />

        <div className="absolute right-3.5 bottom-3 left-3.5 flex flex-col gap-0.5">
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
            {property.destination}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.05rem',
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: '#EDE6DB',
              textShadow: '0 1px 4px rgba(0,0,0,0.65)',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {property.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.68rem',
              color: 'rgba(237,230,219,0.9)',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              marginTop: '0.2rem',
            }}
          >
            From {formatPrice(property.pricing.fromUsd)} a {property.pricing.unit}
          </div>
        </div>
      </div>
    </motion.a>
  );
}
