'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Stay } from '@core/stay';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import { ALT_DURATION, ALT_STAGGER, EASE_EMPHASIZED, REDUCED_DURATION } from './motion-tokens';
import { PinButton } from './pin-button';
import { ProvenanceBadge } from '@/features/shared/provenance-badge';
import { ExpediaCta } from '@/features/shared/expedia-cta';
import type { TripIntent } from '@core/trip-intent';

/** Alternative card. Same materialize as hero, staggered 60ms per index. */
export function AlternativeCard({
  stay,
  index,
  intent,
  turnId,
}: {
  stay: Stay;
  index: number;
  intent: TripIntent;
  turnId?: string;
}) {
  const reduced = useReducedMotion();
  const openDetail = useWorkspaceStore((s) => s.openDetail);
  const photo = stay.photos[0];

  return (
    <motion.div
      layout
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
      transition={{
        duration: reduced ? REDUCED_DURATION : ALT_DURATION,
        delay: reduced ? 0 : (index + 1) * ALT_STAGGER + 0.15,
        ease: EASE_EMPHASIZED,
      }}
      whileHover={reduced ? undefined : { scale: 1.005 }}
      onClick={() => openDetail(stay.id)}
      className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-[18px] border"
      style={{
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      {photo ? (
        <Image src={photo.url} alt={photo.alt} fill sizes="30vw" className="object-cover" />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)',
          opacity: 0.92,
        }}
      />
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <ProvenanceBadge providerId={stay.providerId} />
        <PinButton stayId={stay.id} />
      </div>
      <div className="absolute right-3 bottom-2 left-3">
        <ExpediaCta stay={stay} intent={intent} {...(turnId ? { turnId } : {})} variant="compact" />
      </div>
      <div className="absolute right-3 bottom-7 left-3 flex items-end justify-between gap-2">
        <p
          className="truncate"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: '#EDE6DB',
            fontWeight: 500,
          }}
        >
          {stay.name}
        </p>
        <p
          className="flex-shrink-0"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            color: 'var(--accent-primary)',
          }}
        >
          {stay.pricing.pricePerNight.amount.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
