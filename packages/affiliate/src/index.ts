/**
 * @adored/affiliate — shared affiliate URL builders.
 *
 * Extraction status:
 *   allowlist              — shared verbatim (identical in all 4 apps)
 *   getyourguide           — shared verbatim (identical in 3 apps)
 *   expedia-multicategory  — brand-parameterized factory; apps bind
 *                            their label/src/camref from
 *                            @adored/brand-config
 *
 * Still app-local (deliberately, until a second consumer appears or
 * brand parameterization is designed):
 *   booking-com-multicategory (gobookt), viator provider (typed
 *   against app-local core/experience), link builders, go-url.
 */

export {
  AFFILIATE_HOST_ALLOWLIST,
  isAllowedAffiliateHost,
} from './allowlist';

export type { GygSearchInput } from './getyourguide';
export {
  GYG_PARTNER_ID,
  buildGygSearchUrl,
  buildGygActivityUrl,
} from './getyourguide';

export type {
  ExpediaCategory,
  ExpediaMultiConfig,
  CategorySearchInput,
  ExpediaBrandBinding,
  ExpediaMulticategory,
} from './expedia-multicategory';
export {
  createExpediaMulticategory,
  CATEGORY_META,
} from './expedia-multicategory';

export type { CruiseCreativeSlug, CruiseCreative } from './cruisedirect-creatives';
export {
  CRUISE_CREATIVES,
  GOTRIPT_CRUISE_COLLECTIONS,
  NUMIWORKS_CRUISE_COLLECTIONS,
} from './cruisedirect-creatives';
export {
  cruiseDirectEnabled,
  cruiseDirectPid,
  resolveCruiseDirectUrl,
  describeCruiseDirectUrl,
} from './cruisedirect';

// Brand-policy guard — enforces each brand's declared providers (Portfolio
// Revenue Engine); fails closed on cross-brand / cross-network leakage.
export { brandAllowsProvider, assertBrandProvider } from './brand-policy';

// Link-health adapter — per-brand URL policy + audit over the domain-neutral
// checkLink core (@adored/portfolio-revenue): host + attribution + leak guard.
export { linkPolicyForBrand, auditBrandLinks } from './link-policy';
