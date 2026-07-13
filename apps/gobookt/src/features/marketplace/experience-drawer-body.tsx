'use client';

import { ArrowRight } from '@/features/shared/icons';
import { viatorAffiliateHref } from '@lib/affiliate/viator-link-builder';
import { SafeExperiencePhoto } from '@/features/experience-cards/safe-experience-photo';
import {
  formatAverageRating,
  formatPerPerson,
  formatReviewCount,
} from '@/features/experience-cards/format';
import { formatExperienceDuration, type Experience } from '@core/experience';
import {
  affiliateDisclosure,
  partnerCtaLabel,
} from '@lib/branding/provider-branding';
import { DrawerChrome } from './drawer-chrome';

interface ExperienceDrawerBodyProps {
  experience: Experience;
  titleId: string;
  onClose: () => void;
}

/**
 * Experience-flavored drawer body. Same chrome as the property drawer,
 * different content: duration replaces room count, group rating
 * replaces stay rating, "Reserve on Viator" replaces "Find dates on
 * Expedia."
 *
 * The metadata Viator carries (cancellation, confirmation type,
 * duration) lands in the metadata grid; the editorial summary lives
 * above it. The card surface stays clean.
 */
export function ExperienceDrawerBody({ experience, titleId, onClose }: ExperienceDrawerBodyProps) {
  const href = viatorAffiliateHref(experience);
  const rating = formatAverageRating(experience.reviews.averageRating);
  const durationLabel = formatExperienceDuration(experience.duration);

  return (
    <DrawerChrome
      titleId={titleId}
      onClose={onClose}
      disclosure={affiliateDisclosure(experience.affiliate.providerId)}
      hero={
        <div className="relative w-full" style={{ aspectRatio: '4 / 3', minHeight: '20rem' }}>
          <SafeExperiencePhoto
            experience={experience}
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
          {rating !== null ? (
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
              <span style={{ fontWeight: 600 }}>{rating}</span>
              <span style={{ opacity: 0.75 }}>
                from {formatReviewCount(experience.reviews.total)} travelers
              </span>
            </div>
          ) : null}
        </div>
      }
    >
      <header className="flex flex-col gap-2">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {experience.location.destination || 'Bookable experience'}
          {durationLabel ? ` · ${durationLabel}` : ''}
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
          {experience.title}
        </h2>
      </header>

      {experience.summary ? (
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1.1rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            margin: 0,
            maxWidth: '38rem',
          }}
        >
          {experience.summary}
        </p>
      ) : null}

      {/* Price + practical info as a calm two-line statement.
       *  No table, no key-value grid - reads like prose. */}
      <div className="flex flex-col gap-1.5">
        {experience.pricing.fromPerPerson > 0 ? (
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
            From {formatPerPerson(experience.pricing.fromPerPerson, experience.pricing.currency)} a person.
          </p>
        ) : null}
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
          {experiencePracticalLine(durationLabel, experience.confirmation, experience.flags)}
        </p>
      </div>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
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
          {partnerCtaLabel(experience.affiliate.providerId, 'reserve', { arrow: false })}
          <ArrowRight
            size={14}
            strokeWidth={2.4}
            className="transition-transform group-hover:translate-x-1"
          />
        </a>
      ) : (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          This experience can&rsquo;t be booked through our partner right now.
        </p>
      )}
    </DrawerChrome>
  );
}

/**
 * Quiet single-line summary of the experience's practical facts.
 * Reads as a sentence ("Three hours. Instant confirmation. Free
 * to cancel.") not a chip stack. Each fact is optional - the line
 * skips what isn't known.
 */
function experiencePracticalLine(
  durationLabel: string,
  confirmation: Experience['confirmation'],
  flags: Experience['flags'],
): string {
  const parts: string[] = [];
  if (durationLabel) parts.push(`${durationLabel}.`);
  if (confirmation === 'instant') parts.push('Instant confirmation.');
  if (flags.includes('free-cancellation')) parts.push('Free to cancel.');
  if (flags.includes('skip-the-line')) parts.push('Skip the line.');
  if (parts.length === 0) return 'Live availability through Viator.';
  return parts.join(' ');
}

