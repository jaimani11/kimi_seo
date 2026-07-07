import { z } from 'zod';
import {
  PinterestPinSchema,
  ShortFormVideoScriptSchema,
} from './social-types';

/**
 * Marketing-automation types.
 *
 * The daily scheduler reads a MarketingScheduleConfig, picks N cities
 * deterministically per platform, generates content using the existing
 * social-content engine (Sprint 14), enqueues MarketingPost records,
 * and hands them to the platform adapters for posting.
 *
 * The whole pipeline is best-effort by design: a failed post on one
 * platform never blocks the others, and a missing platform credential
 * resolves to a logged-only stub rather than a crash.
 */

export const MARKETING_PLATFORMS = ['pinterest', 'instagram', 'tiktok'] as const;
export type MarketingPlatform = (typeof MARKETING_PLATFORMS)[number];

/**
 * Per-platform schedule entry.
 *
 * Defaults pulled from the original spec — 20 Pinterest pins,
 * 20 Instagram posts, 10 TikTok videos per day. Admins can tune
 * any of these at /admin/marketing without a code change.
 */
export const MarketingPlatformConfigSchema = z.object({
  enabled: z.boolean(),
  /** Posts per day. 0 effectively disables, but `enabled=false` is
   *  the canonical off switch. Capped at 50 to keep the per-day
   *  spend on the LLM-backed content generator bounded. */
  dailyCount: z.number().int().min(0).max(50),
});
export type MarketingPlatformConfig = z.infer<typeof MarketingPlatformConfigSchema>;

export const MarketingScheduleConfigSchema = z.object({
  pinterest: MarketingPlatformConfigSchema,
  instagram: MarketingPlatformConfigSchema,
  tiktok: MarketingPlatformConfigSchema,
  updatedAt: z.string(), // ISO
});
export type MarketingScheduleConfig = z.infer<typeof MarketingScheduleConfigSchema>;

export const DEFAULT_MARKETING_CONFIG: MarketingScheduleConfig = {
  pinterest: { enabled: false, dailyCount: 20 },
  instagram: { enabled: false, dailyCount: 20 },
  tiktok: { enabled: false, dailyCount: 10 },
  updatedAt: '2026-06-13T00:00:00.000Z',
};

/**
 * One scheduled-or-posted piece of content. The `payload` is the
 * platform-specific shape we already generate in Sprint 14
 * (PinterestPin for pinterest/instagram; ShortFormVideoScript for
 * tiktok). Instagram reuses the PinterestPin shape — image + caption
 * + hashtags map cleanly to an IG feed post.
 */
export const MarketingPostStatusSchema = z.enum([
  'pending',
  'posted',
  'failed',
  'skipped',
]);
export type MarketingPostStatus = z.infer<typeof MarketingPostStatusSchema>;

/**
 * The payload union. We store the raw structured content so a
 * downstream change to the post format can re-render historical
 * records without a data migration.
 */
export const MarketingPostPayloadSchema = z.union([
  PinterestPinSchema,
  ShortFormVideoScriptSchema,
]);
export type MarketingPostPayload = z.infer<typeof MarketingPostPayloadSchema>;

export const MarketingPostSchema = z.object({
  id: z.string(),
  platform: z.enum(MARKETING_PLATFORMS),
  citySlug: z.string(),
  cityName: z.string(),
  payload: MarketingPostPayloadSchema,
  status: MarketingPostStatusSchema,
  /** Set after the platform adapter returns. May be the post URL,
   *  the platform's internal id, or empty when the adapter is in
   *  stub mode. */
  externalUrl: z.string().optional(),
  /** Set when status='failed'. */
  errorMessage: z.string().optional(),
  scheduledFor: z.string(), // ISO
  postedAt: z.string().optional(), // ISO
  createdAt: z.string(), // ISO
});
export type MarketingPost = z.infer<typeof MarketingPostSchema>;

export interface RecordMarketingPostArgs {
  platform: MarketingPlatform;
  citySlug: string;
  cityName: string;
  payload: MarketingPostPayload;
  scheduledFor: string;
}

export interface UpdateMarketingPostArgs {
  id: string;
  status: MarketingPostStatus;
  externalUrl?: string;
  errorMessage?: string;
  postedAt?: string;
}

/**
 * Result of a single scheduler run, summarized for the admin UI and
 * for the cron handler's response body.
 */
export interface MarketingRunSummary {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  perPlatform: Record<
    MarketingPlatform,
    {
      attempted: number;
      posted: number;
      failed: number;
      skipped: number;
    }
  >;
  totals: {
    attempted: number;
    posted: number;
    failed: number;
    skipped: number;
  };
}
