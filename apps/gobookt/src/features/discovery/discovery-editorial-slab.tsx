'use client';

import { motion } from 'framer-motion';
import { EditorialCard, type DiscoverySection } from '@/features/cards';
import { DiscoverySectionHeader } from './discovery-section-header';

interface DiscoveryEditorialSlabProps {
  section: DiscoverySection;
}

/**
 * Two-up magazine slab. One EditorialCard on top, a centered copy
 * callout in the middle, a second EditorialCard below. Each card
 * alternates its photo side so the visual flow snakes down the
 * column.
 *
 * Only valid for sections with `layout.variant === 'editorial-slab'`.
 * The `layout.copy` block is required.
 */
export function DiscoveryEditorialSlab({ section }: DiscoveryEditorialSlabProps) {
  if (section.layout.variant !== 'editorial-slab') {
    throw new Error(
      `DiscoveryEditorialSlab rendered with layout=${section.layout.variant}; this is a bug`,
    );
  }
  const copy = section.layout.copy;
  const first = section.properties[0]!;
  const second = section.properties[1]!;

  return (
    <section className="w-full">
      <DiscoverySectionHeader section={section} />

      <div className="flex flex-col gap-8">
        <EditorialCard property={first} photoSide="left" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-6 py-6 text-center"
        >
          <h3
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(1.4rem, 2.2vw, 1.8rem)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {copy.headline}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '0.95rem',
              fontWeight: 300,
              lineHeight: 1.55,
              color: 'var(--ink-tertiary)',
              margin: 0,
            }}
          >
            {copy.body}
          </p>
        </motion.div>

        <EditorialCard property={second} photoSide="right" />
      </div>
    </section>
  );
}
