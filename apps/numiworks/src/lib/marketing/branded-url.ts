/**
 * Shim — branded URL building lives in @adored/marketing as a
 * brand-parameterized factory; this file binds numiworks's brand.
 */
import { NUMIWORKS } from '@adored/brand-config';
import { createBrandedUrlBuilder } from '@adored/marketing';

export type { BrandedUrlInput } from '@adored/marketing';

export const brandedNumiworksUrl = createBrandedUrlBuilder({ siteUrl: NUMIWORKS.siteUrl });

export const NUMIWORKS_DOMAIN_LABEL = NUMIWORKS.domain;
