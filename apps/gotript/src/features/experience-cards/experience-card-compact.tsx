'use client';

import { motion } from 'framer-motion';
import { formatExperienceDuration, type Experience } from '@core/experience';
import { SafeExperiencePhoto } from './safe-experience-photo';
import { ReasoningChips, pickReasoningChips } from './reasoning-chips';
import { formatPerPerson } from './format';

interface ExperienceCardCompactProps {
  experience: Experience;
}

/**
 * Compact carousel card. Click navigates to the experience detail
 * page (`/experiences/[productCode]`) where the user picks dates +
 * lands on the Reserve CTA.
 */
export function ExperienceCardCompact({ experience }: ExperienceCardCompactProps) {
  const durationLabel = formatExperienceDuration(experience.duration);
  const detailHref = `/experiences/${experience.productCode}`;

  return (
    <motion.a
      href={detailHref}
      aria-label={`Open details for ${experience.title}`}
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
        <SafeExperiencePhoto
          experience={experience}
          width={700}
          sizes="(max-width: 768px) 70vw, 22vw"
        />

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.84) 100%)',
          }}
        />

        {/* No floating chips on the photo. The duration sits below
         *  with the rest of the editorial copy. Compact carousel
         *  cards should feel quick and exploratory - nothing on the
         *  photo to interpret before the title lands. */}

        {/* Hairline luxury border on hover. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
        />

        <div className="absolute right-3.5 bottom-3 left-3.5 flex flex-col gap-1">
          {durationLabel ? (
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.58rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(237,230,219,0.78)',
                textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              }}
            >
              {durationLabel}
            </div>
          ) : null}
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1rem',
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: '#EDE6DB',
              textShadow: '0 1px 4px rgba(0,0,0,0.65)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {experience.title}
          </div>
          {experience.pricing.fromPerPerson > 0 ? (
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.66rem',
                color: 'rgba(237,230,219,0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                marginTop: '0.15rem',
              }}
            >
              From {formatPerPerson(experience.pricing.fromPerPerson, experience.pricing.currency)} a person
            </div>
          ) : null}
          {pickReasoningChips(experience).length > 0 ? (
            <div className="mt-1">
              <ReasoningChips experience={experience} max={1} tone="on-dark" size="sm" />
            </div>
          ) : null}
        </div>
      </div>
    </motion.a>
  );
}
