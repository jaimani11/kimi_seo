import { PinterestAdapter } from './pinterest';
import { InstagramAdapter } from './instagram';
import { TikTokAdapter } from './tiktok';
import type { MarketingAdapter } from './types';
import type { MarketingPlatform } from '../types';

export type { MarketingAdapter, MarketingAdapterPostInput, MarketingAdapterPostResult } from './types';

let cached: Map<MarketingPlatform, MarketingAdapter> | null = null;

/**
 * Lazy registry of the three adapters. Re-reading env vars at
 * construction time lets a config flip take effect on the next
 * process restart (Vercel cycles serverless instances often, so
 * this is effectively per-request).
 */
export function getMarketingAdapters(): Map<MarketingPlatform, MarketingAdapter> {
  if (!cached) {
    cached = new Map<MarketingPlatform, MarketingAdapter>([
      ['pinterest', new PinterestAdapter()],
      ['instagram', new InstagramAdapter()],
      ['tiktok', new TikTokAdapter()],
    ]);
  }
  return cached;
}

/** Test/dev helper — re-read env vars between checks. */
export function _resetMarketingAdapters(): void {
  cached = null;
}
