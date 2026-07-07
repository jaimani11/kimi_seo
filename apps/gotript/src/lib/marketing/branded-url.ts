/**
 * Shim — branded URL building lives in @adored/marketing as a
 * brand-parameterized factory; this file binds gotript's brand.
 */
import { GOTRIPT } from '@adored/brand-config';
import { createBrandedUrlBuilder } from '@adored/marketing';

export type { BrandedUrlVariant, BrandedUrlInput } from '@adored/marketing';

/** ~30% of daily posts land on /vacation-rentals (VRBO direct, the
 *  highest-commission product); the rest go to the destination
 *  guide with its VRBO callout. */
export const brandedGotriptUrl = createBrandedUrlBuilder({
  siteUrl: GOTRIPT.siteUrl,
  vrboRotation: { path: '/vacation-rentals', sharePct: 30 },
});

export const GOTRIPT_DOMAIN_LABEL = GOTRIPT.domain;
