'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from '@/features/shared/icons';
import { useMarketplaceDrawerStore } from '@/features/marketplace/use-marketplace-drawer-store';
import { useMagneticHover } from '@/features/marketplace/use-magnetic-hover';
import { useCardParallax } from '@/features/marketplace/use-card-parallax';
import { buildPropertyAffiliateHref } from './affiliate-href';
import { SafePropertyPhoto } from './safe-property-photo';
import { formatPrice } from './format';
import type { Property } from '@lib/discovery/property';

interface EditorialCardProps {
  property: Property;
  /** Side the photo sits on. Default 'left' - the copy block then
   *  appears to the right. The editorial-slab layout alternates
   *  sides to give the column visual rhythm. */
  photoSide?: 'left' | 'right';
}

/**
 * Magazine-style "feature" card. Half photo, half copy column. The
 * widest variant, used in `editorial-slab` rails.
 *
 * Post-H3: subtraction + the cinematic treatment. No amenity chips,
 * no rating-count breakdown, no bordered CTA button. The editorial
 * pull line carries the value; the photo carries the desire; the
 * arrow signals "more inside" (i.e. the drawer).
 *
 * The copy column gets a quiet hairline border on hover; the photo
 * gently parallaxes as the card scrolls.
 */
export function EditorialCard({ property, photoSide = 'left' }: EditorialCardProps) {
  const href = buildPropertyAffiliateHref(property);
  const openDrawer = useMarketplaceDrawerStore((s) => s.open);
  const magnetic = useMagneticHover({ strength: 5 });
  const { containerRef, photoY } = useCardParallax<HTMLAnchorElement>({ strength: 6 });

  return (
    <motion.a
      ref={containerRef}
      href={href}
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
        borderRadius: '1.1rem',
        background: 'var(--surface-elevated)',
        boxShadow: 'var(--elev-card)',
        textDecoration: 'none',
        minHeight: '24rem',
      }}
      className="group relative grid w-full grid-cols-1 overflow-hidden md:grid-cols-2"
    >
      {/* Hairline border on hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
      />

      {/* Photo column */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '4 / 3',
          gridRow: 1,
          gridColumn: photoSide === 'right' ? 'md / 2' : 1,
        }}
      >
        <motion.div className="absolute inset-0" style={{ y: photoY }}>
          <SafePropertyPhoto
            photo={property.photo}
            width={1200}
            sizes="(max-width: 768px) 100vw, 45vw"
            hoverZoom={false}
          />
        </motion.div>

        {/* Quiet eyebrow on the photo, top-left.
         *  Plain shadow text, no chip background - the chip-shape
         *  read OTA-like at editorial scale. */}
        <div
          className="absolute top-5 left-5"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#EDE6DB',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
          }}
        >
          {property.destination}
          {property.neighborhood ? ` · ${property.neighborhood}` : ''}
        </div>
      </div>

      {/* Copy column */}
      <div
        className="flex w-full flex-col justify-between gap-5 p-7 md:p-10"
        style={{
          gridRow: 1,
          gridColumn: photoSide === 'right' ? 1 : 'md / 2',
        }}
      >
        <div className="flex flex-col gap-3">
          <h3
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(1.7rem, 2.6vw, 2.2rem)',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {property.name}
          </h3>

          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.02rem',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            {property.pitch}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.05rem',
              color: 'var(--ink-primary)',
              lineHeight: 1.1,
            }}
          >
            From {formatPrice(property.pricing.fromUsd)} a {property.pricing.unit}
          </div>

          <span
            aria-hidden
            className="inline-flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            See more
            <ArrowRight size={14} strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
