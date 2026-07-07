'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from '@/features/shared/icons';
import { useMagneticHover } from '@/features/marketplace/use-magnetic-hover';
import { useCardParallax } from '@/features/marketplace/use-card-parallax';
import { formatExperienceDuration, type Experience } from '@core/experience';
import { SafeExperiencePhoto } from './safe-experience-photo';
import { ReasoningChips } from './reasoning-chips';
import { formatPerPerson } from './format';

interface ExperienceCardHeroProps {
  experience: Experience;
}

/**
 * Hero variant - magazine cover for an experience. Click navigates
 * to the internal detail page `/experiences/[productCode]` where the
 * full content (description, inclusions, cancellation policy, etc.)
 * + the "Reserve on Viator" CTA lives. Cmd/ctrl-click + middle-click
 * open the detail page in a new tab.
 *
 * Motion: magnetic hover + scroll-linked photo parallax + hairline
 * accent border on hover. Cinematic, restrained.
 */
export function ExperienceCardHero({ experience }: ExperienceCardHeroProps) {
  const durationLabel = formatExperienceDuration(experience.duration);
  const magnetic = useMagneticHover({ strength: 6 });
  const { containerRef, photoY } = useCardParallax<HTMLElement>({ strength: 8 });
  const detailHref = `/experiences/${experience.productCode}`;

  return (
    <motion.a
      href={detailHref}
      ref={containerRef as never}
      aria-label={`Open details for ${experience.title}`}
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
      className="group relative block w-full overflow-hidden text-left"
    >
      <motion.div className="absolute inset-0" style={{ y: photoY }}>
        <SafeExperiencePhoto
          experience={experience}
          width={1400}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
          priority
          hoverZoom={false}
        />
      </motion.div>

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.0) 36%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.82) 100%)',
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
      />

      {/* No floating chips on the photo. The duration sits below in
       *  the editorial eyebrow; the rating lives in the drawer. */}

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
          {durationLabel || 'Bookable experience'}
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(1.55rem, 2vw, 2rem)',
            fontWeight: 400,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: '#EDE6DB',
            margin: 0,
            textShadow: '0 2px 10px rgba(0,0,0,0.55)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {experience.title}
        </h3>

        {experience.summary ? (
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '0.92rem',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.45,
              color: 'rgba(237,230,219,0.92)',
              margin: 0,
              maxWidth: '32rem',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {experience.summary}
          </p>
        ) : null}

        <div className="mt-2">
          <ReasoningChips experience={experience} max={3} tone="on-dark" size="md" />
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1rem',
              color: '#EDE6DB',
              lineHeight: 1.1,
            }}
          >
            {experience.pricing.fromPerPerson > 0
              ? `From ${formatPerPerson(experience.pricing.fromPerPerson, experience.pricing.currency)} a person`
              : 'Quote on request'}
          </div>

          <span
            aria-hidden
            className="inline-flex items-center transition-transform duration-300 group-hover:translate-x-1"
            style={{ color: 'rgba(237,230,219,0.9)' }}
          >
            <ArrowRight size={18} strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
