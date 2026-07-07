/**
 * Shim — the scheduler run-loop lives in @adored/marketing as a
 * brand-injected factory. This file wires gobookt's store, adapters,
 * generators, and branded-URL builder into it and re-exports the
 * exact surface the cron route + admin UI have always imported.
 */
import { GOBOOKT } from '@adored/brand-config';
import { createMarketingScheduler } from '@adored/marketing';
import { generateCitySocialPack } from '@lib/social/generator';
import { buildSocialPackFromTemplate } from '@lib/social/template-generator';
import { getMarketingStore } from './marketing-store';
import { getMarketingAdapters } from './adapters';
import { brandedGobooktUrl } from './branded-url';

export type { RunSchedulerArgs } from '@adored/marketing';

const scheduler = createMarketingScheduler({
  getStore: getMarketingStore,
  getAdapters: getMarketingAdapters,
  generatePack: generateCitySocialPack,
  fallbackPack: buildSocialPackFromTemplate,
  buildBrandedUrl: brandedGobooktUrl,
  brandDomain: GOBOOKT.domain,
});

export const runMarketingScheduler = scheduler.runMarketingScheduler;
export const getRecentPosts = scheduler.getRecentPosts;
