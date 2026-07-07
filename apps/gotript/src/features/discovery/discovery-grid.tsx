'use client';

import { PropertyCardStandard, type DiscoverySection } from '@/features/cards';
import { DiscoverySectionHeader } from './discovery-section-header';

interface DiscoveryGridProps {
  section: DiscoverySection;
}

/**
 * Balanced grid of standard cards. 2 columns on tablet, 3 on desktop.
 * Used by sections that should feel browsable rather than
 * carousel-paced - "Hidden gems," "Editorial picks of the season."
 *
 * Mobile is a single column so each card gets its full attention.
 */
export function DiscoveryGrid({ section }: DiscoveryGridProps) {
  return (
    <section className="w-full">
      <DiscoverySectionHeader section={section} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {section.properties.map((p) => (
          <PropertyCardStandard key={p.id} property={p} dense />
        ))}
      </div>
    </section>
  );
}
