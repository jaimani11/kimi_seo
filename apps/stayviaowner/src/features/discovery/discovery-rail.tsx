'use client';

import type { DiscoverySection } from '@/features/cards';
import { DiscoveryCarousel } from './discovery-carousel';
import { DiscoveryEditorialSlab } from './discovery-editorial-slab';
import { DiscoveryGrid } from './discovery-grid';
import { DiscoveryHeroRail } from './discovery-hero-rail';

interface DiscoveryRailProps {
  section: DiscoverySection;
}

/**
 * Switching component for a discovery section. Picks the right layout
 * variant by reading `section.layout.variant`.
 *
 * Keeping this as a thin switch (rather than embedding the layouts in
 * each section's data) means a curator can change a layout by editing
 * a single field, and there's exactly one place every rail layout
 * lives. New layouts (vertical-feed, story, map) get added here when
 * they exist.
 */
export function DiscoveryRail({ section }: DiscoveryRailProps) {
  switch (section.layout.variant) {
    case 'carousel':
      return <DiscoveryCarousel section={section} />;
    case 'hero-rail':
      return <DiscoveryHeroRail section={section} />;
    case 'grid':
      return <DiscoveryGrid section={section} />;
    case 'editorial-slab':
      return <DiscoveryEditorialSlab section={section} />;
  }
}
