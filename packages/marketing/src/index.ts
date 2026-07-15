/**
 * @adored/marketing — shared marketing-automation building blocks.
 *
 * Extraction status (phase 3a — brand-neutral leaves):
 *   types           — MarketingScheduleConfig / MarketingPost schemas
 *   social-types    — Pinterest pin + video script zod schemas
 *   city-rotation   — deterministic daily rotation + cooldown
 *   popularity      — weighted city pools
 *   pinterest-client— Pinterest v5 REST client
 *
 * Still app-local (phase 3b — needs brand DI):
 *   scheduler, adapters/pinterest|instagram|tiktok, branded-url,
 *   social/template-generator + generator (brand CTAs, hashtags,
 *   imagery deps). Design: createMarketingEngine(brand, deps).
 */

export {
  MARKETING_PLATFORMS,
  MarketingPlatformConfigSchema,
  MarketingScheduleConfigSchema,
  DEFAULT_MARKETING_CONFIG,
  MarketingPostStatusSchema,
  MarketingPostPayloadSchema,
  MarketingPostSchema,
} from './types';
export type {
  MarketingPlatform,
  MarketingPlatformConfig,
  MarketingScheduleConfig,
  MarketingPostStatus,
  MarketingPostPayload,
  MarketingPost,
  RecordMarketingPostArgs,
  UpdateMarketingPostArgs,
  MarketingRunSummary,
} from './types';

export { pickRotatedCities, todayKey, popularityWeightOf } from './city-rotation';

export type { PopularityTier } from './popularity';
export { tierOf, weightOf, buildWeightedCityPool } from './popularity';

export type {
  PinterestBoard,
  PinterestCreatePinInput,
  PinterestApiError,
  PinterestStatus,
} from './pinterest-client';
export { PinterestClient, pinterestClientFromEnv, checkPinterestStatus, pinterestPostedToday } from './pinterest-client';

export {
  SocialPlatformSchema,
  HashtagSchema,
  PinterestPinSchema,
  VideoSceneSchema,
  ShortFormVideoScriptSchema,
  SocialContentItemSchema,
  CitySocialPackSchema,
} from './social-types';
export type {
  SocialPlatform,
  PinterestPin,
  VideoScene,
  ShortFormVideoScript,
  SocialContentItem,
  CitySocialPack,
} from './social-types';

// ── Phase 3b: brand-injected marketing engine ────────────────────

export type {
  BrandedUrlVariant,
  BrandedUrlInput,
  BrandedUrlOptions,
  BrandedUrlBuilder,
} from './branded-url';
export { createBrandedUrlBuilder } from './branded-url';

export type {
  MarketingAdapter,
  MarketingAdapterPostInput,
  MarketingAdapterPostResult,
} from './adapter-types';

export { InstagramAdapter } from './instagram-adapter';
export { TikTokAdapter } from './tiktok-adapter';
export type { PinterestAdapterDeps } from './pinterest-adapter';
export { BasePinterestAdapter } from './pinterest-adapter';

export type { MarketingStore } from './marketing-store';
export {
  InMemoryMarketingStore,
  getMarketingStore,
  _resetMarketingStore,
} from './marketing-store';

export type { TemplateBrand } from './template-generator';
export { createSocialTemplateGenerator, clamp } from './template-generator';

export type {
  SchedulerStore,
  MarketingSchedulerDeps,
  RunSchedulerArgs,
  MarketingScheduler,
} from './scheduler';
export { createMarketingScheduler } from './scheduler';

// ── Newsletter capture (Resend-backed audience + welcome email) ──
export type {
  NewsletterBrand,
  NewsletterEnv,
  SubscribeStatus,
  SubscribeResult,
} from './newsletter';
export {
  getNewsletterEnv,
  isNewsletterConfigured,
  subscribeEmail,
  getSubscriberCount,
  sendNewsletterBroadcast,
} from './newsletter';

// ── Pinterest OAuth (authorize + automatic token refresh) ────────
export type { PinterestOAuthEnv, PinterestTokenGrant } from './pinterest-oauth';
export {
  PINTEREST_SCOPES,
  getPinterestOAuthEnv,
  buildPinterestAuthorizeUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getManagedPinterestToken,
  describePinterestAuthMode,
  _resetManagedPinterestToken,
} from './pinterest-oauth';
