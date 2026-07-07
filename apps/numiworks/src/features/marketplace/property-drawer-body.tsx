'use client';

import { ArrowRight } from '@/features/shared/icons';
import { buildPropertyAffiliateHref } from '@/features/cards/affiliate-href';
import { SafePropertyPhoto } from '@/features/cards/safe-property-photo';
import {
  formatPrice,
  formatRating,
  formatReviewCount,
} from '@/features/cards/format';
import type { CancellationPolicy, Property } from '@lib/discovery/property';
import {
  affiliateDisclosure,
  partnerCtaLabel,
} from '@lib/branding/provider-branding';
import { getActiveStayProviderId } from '@lib/affiliate/active-stay-provider';
import { DrawerChrome } from './drawer-chrome';

interface PropertyDrawerBodyProps {
  property: Property;
  titleId: string;
  onClose: () => void;
}

/**
 * Property-flavored drawer body. The page-within-a-page that earns
 * the click before the partner hand-off.
 *
 * Layout: cinematic photo (60% viewport-height top band) → eyebrow →
 * title → italic editorial pull → quiet metadata grid → confident
 * primary CTA. No urgency, no countdowns, no "X other people viewing."
 */
export function PropertyDrawerBody({ property, titleId, onClose }: PropertyDrawerBodyProps) {
  const href = buildPropertyAffiliateHref(property);
  // Branding copy keys off the ACTIVE provider, not the curated
  // data's `affiliate.providerId` (which stays 'expedia' in
  // sections.ts intentionally so we can flip back with one env var).
  // The active provider is what the visitor's click actually lands on.
  const activeProviderId = getActiveStayProviderId();

  return (
    <DrawerChrome
      titleId={titleId}
      onClose={onClose}
      disclosure={affiliateDisclosure(activeProviderId)}
      hero={
        <div className="relative w-full" style={{ aspectRatio: '4 / 3', minHeight: '20rem' }}>
          <SafePropertyPhoto
            photo={property.photo}
            width={1600}
            sizes="(max-width: 768px) 100vw, 640px"
            hoverZoom={false}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          {/* Quiet rating chip - bottom-left. The only number on the photo. */}
          <div
            className="absolute bottom-4 left-5 flex items-baseline gap-2"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              padding: '0.32rem 0.7rem',
              background: 'rgba(12,12,14,0.55)',
              backdropFilter: 'blur(6px)',
              borderRadius: '999px',
              border: '1px solid rgba(237,230,219,0.18)',
              color: '#EDE6DB',
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ fontWeight: 600 }}>{formatRating(property.rating.score)}</span>
            <span style={{ opacity: 0.75 }}>
              from {formatReviewCount(property.rating.reviews)} stays
            </span>
          </div>
        </div>
      }
    >
      {/* Eyebrow + title block */}
      <header className="flex flex-col gap-2">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {property.destination}
          {property.neighborhood ? ` · ${property.neighborhood}` : ''}
        </p>
        <h2
          id={titleId}
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {property.name}
        </h2>
      </header>

      {/* The editorial heart - italic Fraunces, the line that earns the trip. */}
      <p
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.1rem',
          lineHeight: 1.5,
          color: 'var(--ink-secondary)',
          margin: 0,
          maxWidth: '38rem',
        }}
      >
        {property.pitch}
      </p>

      {/* Amenities - moved off the card surface. Quiet inline list,
       *  Fraunces italic so they read as editorial, not enterprise. */}
      {property.amenities.length > 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '0.92rem',
            fontWeight: 300,
            color: 'var(--ink-tertiary)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {property.amenities.join(' · ')}
        </p>
      ) : null}

      {/* Price + practical info as a calm two-line statement.
       *  No table, no key-value grid - this is editorial, not a
       *  spec sheet. */}
      <div className="flex flex-col gap-1.5">
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.4rem',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          From {formatPrice(property.pricing.fromUsd)} a {property.pricing.unit}.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '0.92rem',
            color: 'var(--ink-tertiary)',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {practicalLine(property.cancellation)}
        </p>
      </div>

      {/* The single confident CTA. Quiet, not urgent. Label is
       *  resolved via the branding layer (defaults to neutral mode:
       *  no brand name) so we can flip back to explicit branding
       *  with one env toggle once Booking.com partnership review
       *  completes. */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group inline-flex items-center justify-between gap-4 transition-all"
        style={{
          marginTop: '0.5rem',
          padding: '1rem 1.4rem',
          borderRadius: '999px',
          background: 'var(--accent-primary)',
          color: '#1a1a1a',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.82rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 500,
          textDecoration: 'none',
          alignSelf: 'flex-start',
        }}
      >
        {partnerCtaLabel(activeProviderId, 'find-dates', { arrow: false })}
        <ArrowRight
          size={14}
          strokeWidth={2.4}
          className="transition-transform group-hover:translate-x-1"
        />
      </a>
    </DrawerChrome>
  );
}

/**
 * Quiet single-line summary of the cancellation policy. Reads as a
 * sentence, not a chip stack. The phrasing leans editorial ("Free
 * to cancel.") rather than transactional ("FREE_CANCELLATION").
 *
 * The rating + review count are intentionally NOT here - the photo
 * chip already carries that. Restraint is the principle.
 */
function practicalLine(cancellation: CancellationPolicy): string {
  switch (cancellation) {
    case 'free-flexible':
      return 'Free to cancel.';
    case 'free-limited':
      return 'Cancellable up to a week out.';
    case 'non-refundable':
      return 'Non-refundable rate.';
  }
}
