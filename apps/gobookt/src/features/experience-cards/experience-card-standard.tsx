'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from '@/features/shared/icons';
import { useMagneticHover } from '@/features/marketplace/use-magnetic-hover';
import { useCardParallax } from '@/features/marketplace/use-card-parallax';
import { formatExperienceDuration, type Experience } from '@core/experience';
import { SafeExperiencePhoto } from './safe-experience-photo';
import { ReasoningChips } from './reasoning-chips';
import { formatPerPerson } from './format';

interface ExperienceCardStandardProps {
  experience: Experience;
  /** Dense variant for grid layouts. Slightly tighter aspect + smaller
   *  type. Default false for the airy hero-rail use case. */
  dense?: boolean;
}

/**
 * Standard experience card. Mid-density variant used in hero-rail
 * supporting stacks and grid layouts. Click navigates to
 * `/experiences/[productCode]` for full content + reserve CTA.
 */
export function ExperienceCardStandard({ experience, dense = false }: ExperienceCardStandardProps) {
  const durationLabel = formatExperienceDuration(experience.duration);
  const magnetic = useMagneticHover({ strength: 5 });
  const { containerRef, photoY } = useCardParallax<HTMLElement>({ strength: 6 });
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
        borderRadius: '0.95rem',
        background: 'var(--surface-elevated)',
        boxShadow: 'var(--elev-card)',
        textDecoration: 'none',
      }}
      className="group relative flex w-full flex-col overflow-hidden text-left"
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: dense ? '4/3' : '16/10' }}>
        <motion.div className="absolute inset-0" style={{ y: photoY }}>
          <SafeExperiencePhoto
            experience={experience}
            width={1000}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 26vw"
            hoverZoom={false}
          />
        </motion.div>

        {/* No floating chips. Duration sits in the editorial eyebrow
         *  below; the rating lives in the drawer. */}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1px var(--accent-primary)' }}
      />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {durationLabel ? (
          <div
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            {durationLabel}
          </div>
        ) : null}

        <h4
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.1rem',
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            color: 'var(--ink-primary)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {experience.title}
        </h4>

        {experience.summary ? (
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '0.82rem',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.4,
              color: 'var(--ink-secondary)',
              margin: 0,
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
          <ReasoningChips experience={experience} max={dense ? 2 : 3} />
        </div>

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-3">
          <div
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '0.88rem',
              color: 'var(--ink-primary)',
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
            style={{ color: 'var(--ink-secondary)' }}
          >
            <ArrowRight size={14} strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
