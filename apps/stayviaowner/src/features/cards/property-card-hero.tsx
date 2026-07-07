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

interface PropertyCardHeroProps {
  property: Property;
}

/**
 * Hero variant - magazine cover. The biggest, most editorial shape.
 *
 * H3 visual principles (post-subtraction):
 *
 *   - Five elements on the surface: destination eyebrow, name,
 *     italic pull, price (quiet), arrow. Amenities, cancellation,
 *     review-count chip - all moved to the drawer.
 *   - One number visible (rating). One italic line (pitch). One
 *     directional arrow (no bordered button label).
 *   - Magnetic hover + scroll-linked photo parallax. The card is
 *     supposed to feel alive on the page.
 *   - Hairline gold inner border on hover - the BedroomVillas /
 *     boutique luxury cue.
 *
 * Click opens the marketplace drawer (storytelling moment) rather
 * than handing off directly to the partner. The drawer carries the
 * partner CTA.
 */
export function PropertyCardHero({ property }: PropertyCardHeroProps) {
  const href = buildPropertyAffiliateHref(property);
  const openDrawer = useMarketplaceDrawerStore((s) => s.open);
  const magnetic = useMagneticHover({ strength: 6 });
  const { containerRef, photoY } = useCardParallax<HTMLAnchorElement>({ strength: 8 });

  return (
    <motion.a
      ref={containerRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Open details for ${property.name} in ${property.destination}`}
      onClick={(e) => {
        // Cmd/ctrl/middle-click: let the browser open the partner
        // directly. Plain click: open the drawer (storytelling).
        if (e.metaKey || e.ctrlKey || e.button === 1) return;
        e.preventDefault();
        openDrawer({ kind: 'property', property });
      }}
      onPointerMove={magnetic.onPointerMove}
      onPointerLeave={magnetic.onPointerLeave}
      style={{
        x: magnetic.x,
        y: magnetic.y,
        aspectRatio: '4 / 5',
        borderRadius: '1.1rem',
        boxShadow: 'var(--elev-card)',
        textDecoration: 'none',
        background: 'var(--surface-elevated)',
      }}
      className="group relative block w-full overflow-hidden"
    >
      {/* Photo - wrapped so we can parallax-translate without
       *  affecting the card's own magnetic motion. */}
      <motion.div className="absolute inset-0" style={{ y: photoY }}>
        <SafePropertyPhoto
          photo={property.photo}
          width={1400}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
          priority
          hoverZoom={false}
        />
      </motion.div>

      {/* Editorial darkening - top-to-bottom so the bottom block is
       *  always legible without darkening the photo's heart. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.0) 36%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.82) 100%)',
        }}
      />

      {/* Hairline luxury border on hover. Sits above the photo,
       *  below the copy. */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
      />

      {/* Bottom editorial block. No floating rating chip - trust on
       *  the surface comes from the photo and the italic pull. The
       *  number lives in the drawer. */}
      <div className="absolute right-6 bottom-6 left-6 flex flex-col gap-2">
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(237,230,219,0.78)',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {property.destination}
          {property.neighborhood ? ` · ${property.neighborhood}` : ''}
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(1.7rem, 2.1vw, 2.1rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#EDE6DB',
            margin: 0,
            textShadow: '0 2px 10px rgba(0,0,0,0.55)',
          }}
        >
          {property.name}
        </h3>

        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '0.95rem',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.45,
            color: 'rgba(237,230,219,0.92)',
            margin: 0,
            maxWidth: '32rem',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          {property.pitch}
        </p>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.05rem',
              fontWeight: 400,
              color: '#EDE6DB',
              lineHeight: 1.1,
              letterSpacing: '-0.005em',
            }}
          >
            From {formatPrice(property.pricing.fromUsd)} a {property.pricing.unit}
          </div>

          {/* Quiet directional arrow - translates on card hover.
           *  Replaces the bordered "Search on Expedia" CTA chip. */}
          <span
            aria-hidden
            className="inline-flex items-center transition-transform duration-300 group-hover:translate-x-1"
            style={{
              color: 'rgba(237,230,219,0.9)',
            }}
          >
            <ArrowRight size={18} strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
