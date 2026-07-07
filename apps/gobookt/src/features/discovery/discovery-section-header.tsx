'use client';

import { motion } from 'framer-motion';
import type { DiscoverySection } from '@/features/cards';

interface DiscoverySectionHeaderProps {
  section: DiscoverySection;
  /** Optional right-aligned slot used by the carousel rail for the
   *  scroll arrows. */
  rightSlot?: React.ReactNode;
}

/**
 * Header used by every rail. Eyebrow + display title + subtitle in a
 * left-aligned editorial block. Optional right-slot for layout-specific
 * controls (the carousel arrows live there).
 *
 * Motion: each line slides in on intersection. Cheap parallax that
 * doesn't fight the photos for attention.
 */
export function DiscoverySectionHeader({ section, rightSlot }: DiscoverySectionHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex max-w-2xl flex-col gap-2"
      >
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.65rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          {section.eyebrow}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {section.title}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '0.95rem',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.5,
            color: 'var(--ink-tertiary)',
            margin: 0,
            marginTop: '0.4rem',
          }}
        >
          {section.subtitle}
        </p>
      </motion.div>
      {rightSlot ? <div className="flex-shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
