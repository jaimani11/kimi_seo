/**
 * Shim — branded URL building lives in @adored/marketing as a
 * brand-parameterized factory; this file binds gobookt's brand.
 */
import { GOBOOKT } from '@adored/brand-config';
import { createBrandedUrlBuilder } from '@adored/marketing';

export type { BrandedUrlInput } from '@adored/marketing';

export const brandedGobooktUrl = createBrandedUrlBuilder({ siteUrl: GOBOOKT.siteUrl });

export const GOBOOKT_DOMAIN_LABEL = GOBOOKT.domain;
