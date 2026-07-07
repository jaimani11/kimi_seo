'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Stay } from '@core/stay';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import {
  BREATHE_DELAY_MS,
  BREATHE_DURATION_S,
  EASE_EMPHASIZED,
  HERO_DURATION,
  REDUCED_DURATION,
} from './motion-tokens';
import { PinButton } from './pin-button';
import { ProvenanceBadge } from '@/features/shared/provenance-badge';
import { ExpediaCta } from '@/features/shared/expedia-cta';
import type { TripIntent } from '@core/trip-intent';

/**
 * Hero stay card. Materialize choreography (spec §5.6):
 *   T+0    opacity 0→1, scale 0.96→1, blur(8px)→blur(0), 600ms ease-emphasized
 *   T+200  Top pick badge fades up
 *   T+600  switch to breathe loop - scale 1↔1.005, 5s infinite
 *
 * Reduced motion: 200ms cross-fade, no breathing.
 */
export function HeroStayCard({
  stay,
  intent,
  turnId,
}: {
  stay: Stay;
  intent: TripIntent;
  turnId?: string;
}) {
  const reduced = useReducedMotion();
  const openDetail = useWorkspaceStore((s) => s.openDetail);
  // Stay.id is the key on the AnimatePresence wrapper above us - the
  // component remounts on hero swap, so useState starts fresh at
  // 'materialize' each time. We just schedule the transition to breathe.
  const [stage, setStage] = useState<'materialize' | 'breathe'>('materialize');
  const photo = stay.photos[0];

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setStage('breathe'), BREATHE_DELAY_MS);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      animate={
        stage === 'materialize'
          ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
          : { opacity: 1, scale: reduced ? 1 : [1, 1.005, 1], filter: 'blur(0px)' }
      }
      transition={
        stage === 'materialize'
          ? {
              duration: reduced ? REDUCED_DURATION : HERO_DURATION,
              ease: EASE_EMPHASIZED,
            }
          : {
              duration: BREATHE_DURATION_S,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
      whileHover={reduced ? undefined : { scale: 1.005 }}
      onClick={() => openDetail(stay.id)}
      className="group relative w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-[22px] border"
      style={{
        aspectRatio: '4/3',
        maxHeight: '60%',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-hero)',
      }}
    >
      {photo ? (
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes="(max-width: 1280px) 60vw, 800px"
          className="object-cover"
          priority
        />
      ) : null}

      {/* Top-down warm bloom (spec §4.7) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(212,165,116,0.18) 0%, transparent 35%)',
          opacity: 0.7,
        }}
      />

      {/* Bottom-up scrim - deepens slightly on hover */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-[var(--dur-base)] group-hover:opacity-100"
        style={{
          background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.62) 100%)',
          opacity: 0.92,
        }}
      />

      <motion.span
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduced ? REDUCED_DURATION : 0.35,
          delay: reduced ? 0 : 0.2,
          ease: EASE_EMPHASIZED,
        }}
        className="absolute top-3 left-3 rounded-full px-2.5 py-1"
        style={{
          background: 'var(--accent-primary)',
          color: '#14171C',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Top pick
      </motion.span>

      <div className="absolute top-3 right-3 flex items-center gap-2">
        <ProvenanceBadge providerId={stay.providerId} />
        <PinButton stayId={stay.id} />
      </div>

      <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-3">
        <div>
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-sm)',
              fontWeight: 400,
              color: '#EDE6DB',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            {stay.name}
          </p>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: 'rgba(237,230,219,0.7)',
            }}
          >
            {stay.location.region ?? stay.location.country}
            {stay.location.neighborhood ? ` · ${stay.location.neighborhood}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-sm)',
              color: 'var(--accent-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {stay.pricing.pricePerNight.amount.toLocaleString()}{' '}
            <span style={{ fontSize: 'var(--text-body-sm)' }}>
              {stay.pricing.pricePerNight.currency}
            </span>
          </p>
          <ExpediaCta
            stay={stay}
            intent={intent}
            {...(turnId ? { turnId } : {})}
            variant="compact"
          />
        </div>
      </div>
    </motion.div>
  );
}
