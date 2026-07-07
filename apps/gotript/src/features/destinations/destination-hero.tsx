'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { CuratedDestination } from '@lib/curation/destinations';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

interface DestinationHeroProps {
  destination: CuratedDestination;
  /** First photo of any featured stay - used as the hero background. */
  heroImageUrl?: string;
  heroImageAlt?: string;
}

/**
 * Full-bleed hero for /destinations/[slug]. Photo background, slow
 * scale-in (mirrors the Trip Board's materialize choreography).
 * Headline is a Fraunces-italic fragment; oneLiner is editorial copy.
 */
export function DestinationHero({ destination, heroImageUrl, heroImageAlt }: DestinationHeroProps) {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate min-h-[420px] overflow-hidden md:min-h-[560px]">
      {heroImageUrl ? (
        <motion.div
          className="absolute inset-0"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0.4 : 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={heroImageUrl}
            alt={heroImageAlt ?? destination.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Vignette for text legibility */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,10,14,0.18) 0%, rgba(8,10,14,0.36) 60%, rgba(8,10,14,0.78) 100%)',
            }}
          />
        </motion.div>
      ) : null}

      <motion.div
        className="relative z-10 mx-auto flex min-h-[420px] max-w-3xl flex-col justify-end px-6 py-10 md:min-h-[560px] md:px-8 md:py-12"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.32 : 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          {destination.region} · {destination.country}
        </p>
        <h1
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-xl, 3.6rem)',
            fontWeight: 300,
            color: '#ffffff',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          {destination.name}
        </h1>
        <p
          className="mt-3 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-lg)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.4,
          }}
        >
          {destination.headline}
        </p>
        <p
          className="mt-3 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.78)',
            lineHeight: 1.55,
          }}
        >
          {destination.oneLiner}
        </p>
      </motion.div>
    </section>
  );
}
