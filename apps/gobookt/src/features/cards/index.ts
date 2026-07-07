/**
 * Public surface of the cards library.
 *
 * Cards are presentation components: they only consume a Property and
 * produce DOM. No data fetching, no router knowledge, no store access.
 * That keeps them reusable across the homepage rails, destination
 * pages, search-result panes, and (later) email/social previews.
 */

export type {
  CancellationPolicy,
  CountryCode,
  DiscoverySection,
  DiscoverySectionLayout,
  PriceBand,
  Property,
  PropertyAffiliate,
  PropertyPhoto,
} from '@lib/discovery/property';
export { assertValidSection, propertyPhotoUrl } from '@lib/discovery/property';

export { buildPropertyAffiliateHref } from './affiliate-href';

export { SafePropertyPhoto } from './safe-property-photo';
export { PropertyCardHero } from './property-card-hero';
export { PropertyCardStandard } from './property-card-standard';
export { PropertyCardCompact } from './property-card-compact';
export { DestinationChipCard } from './destination-chip-card';
export { EditorialCard } from './editorial-card';

export {
  cancellationLabel,
  countryFlag,
  formatPrice,
  formatRating,
  formatReviewCount,
  priceBandLabel,
} from './format';
