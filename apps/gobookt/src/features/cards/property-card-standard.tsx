'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from '@/features/shared/icons';
import { useMagneticHover } from '@/features/marketplace/use-magnetic-hover';
import { useCardParallax } from '@/features/marketplace/use-card-parallax';
import { useMarketplaceDrawerStore } from '@/features/marketplace/use-marketplace-drawer-store';
import { buildPropertyAffiliateHref } from './affiliate-href';
import { SafePropertyPhoto } from './safe-property-photo';
import { formatPrice } from './format';
import type { Property } from '@lib/discovery/property';

interface PropertyCardStandardProps {
  property: Property;
  /** When true the card uses a denser layout suitable for grids
   *  rendered at the same width as carousel cards. Default false
   *  gives the airy hero-rail-supporting-stack layout. */
  dense?: boolean;
}

/**
 * Standard card. Photo on top, editorial info on the bottom rail.
 *
 * Post-H3: subtraction. One rating chip, one editorial pull, one
 * price line, one arrow. Cancellation / amenities / price band
 * all moved to the drawer (which the card now opens on click).
 */
export function PropertyCardStandard({ property, dense = false }: PropertyCardStandardProps) {
  const href = buildPropertyAffiliateHref(property);
  const openDrawer = useMarketplaceDrawerStore((s) => s.open);
  const magnetic = useMagneticHover({ strength: 5 });
  const { containerRef, photoY } = useCardParallax<HTMLAnchorElement>({ strength: 6 });

  return (
    <motion.a
      ref={containerRef}
      href={href ?? undefined}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      aria-label={`Open details for ${property.name} in ${property.destination}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.button === 1) return;
        e.preventDefault();
        openDrawer({ kind: 'property', property });
      }}
      onPointerMove={magnetic.onPointerMove}
      onPointerLeave={magnetic.onPointerLeave}
      style={{
        x: magnetic.x,
        y: magnetic.y,
        borderRadius: '0.95rem',
        background: 'var(--surface-elevated)',
        boxShadow: 'var(--elev-card)',
        textDecoration: 'none',
      }}
      className="group relative flex w-full flex-col overflow-hidden"
    >
      {/* Photo wrapper - parallax-translated. */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: dense ? '4/3' : '16/10' }}>
        <motion.div className="absolute inset-0" style={{ y: photoY }}>
          <SafePropertyPhoto
            photo={property.photo}
            width={1000}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 26vw"
            hoverZoom={false}
          />
        </motion.div>

        {/* No floating chips on the photo. Trust on the card surface
         *  is the photo + the italic pull below. Practical numbers
         *  live one click deeper, in the drawer. */}
      </div>

      {/* Hairline luxury border. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
      />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {property.destination}
          {property.neighborhood ? ` · ${property.neighborhood}` : ''}
        </div>

        <h4
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.25rem',
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {property.name}
        </h4>

        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.45,
            color: 'var(--ink-secondary)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {property.pitch}
        </p>

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-3">
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '0.92rem',
              color: 'var(--ink-primary)',
              lineHeight: 1.1,
            }}
          >
            From {formatPrice(property.pricing.fromUsd)} a {property.pricing.unit}
          </div>
          <span
            aria-hidden
            className="inline-flex items-center transition-transform duration-300 group-hover:translate-x-1"
            style={{ color: 'var(--ink-secondary)' }}
          >
            <ArrowRight size={14} strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
