'use client';

import {
  PropertyCardHero,
  PropertyCardStandard,
  type DiscoverySection,
} from '@/features/cards';
import { DiscoverySectionHeader } from './discovery-section-header';

interface DiscoveryHeroRailProps {
  section: DiscoverySection;
}

/**
 * Asymmetric hero-rail layout: one big editorial hero card on the
 * left, a vertical stack of three standard cards on the right.
 *
 * Mobile collapses to a single column with the hero card on top and
 * the standard cards stacking below.
 *
 * Why exactly four properties: a single hero plus a stack of three
 * gives the column heights enough rhythm that the right-stack ends
 * at roughly the same y as the hero. Four is the layout invariant
 * the section validator enforces. If a section has more, the extras
 * are dropped (with a warning) so curated copy never breaks layout.
 */
export function DiscoveryHeroRail({ section }: DiscoveryHeroRailProps) {
  const hero = section.properties[0]!;
  const rest = section.properties.slice(1, 4);

  return (
    <section className="w-full">
      <DiscoverySectionHeader section={section} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="w-full">
          <PropertyCardHero property={hero} />
        </div>
        <div className="flex flex-col gap-4">
          {rest.map((p) => (
            <PropertyCardStandard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
