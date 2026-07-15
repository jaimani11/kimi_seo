/**
 * Shim — branded URL building lives in @adored/marketing as a
 * brand-parameterized factory; this file binds stayviaowner's brand.
 */
import { STAYVIAOWNER } from '@adored/brand-config';
import { createBrandedUrlBuilder } from '@adored/marketing';

export type { BrandedUrlVariant, BrandedUrlInput } from '@adored/marketing';

/** ~30% of daily posts land on /vacation-rentals (VRBO direct, the
 *  highest-commission product); the rest go to the destination
 *  guide with its VRBO callout. */
export const brandedStayviaownerUrl = createBrandedUrlBuilder({
  siteUrl: STAYVIAOWNER.siteUrl,
  vrboRotation: { path: '/vacation-rentals', sharePct: 30 },
});

export const STAYVIAOWNER_DOMAIN_LABEL = STAYVIAOWNER.domain;
