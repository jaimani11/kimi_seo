import type {
  MarketingPlatform,
  MarketingPost,
  MarketingPostStatus,
  MarketingScheduleConfig,
  RecordMarketingPostArgs,
  UpdateMarketingPostArgs,
} from './types';
import { DEFAULT_MARKETING_CONFIG } from './types';

/**
 * Persistence boundary for the marketing-automation slice.
 *
 * Two stores:
 *
 *   - InMemoryMarketingStore — default, lives in the same process,
 *     state lost on restart. Fine for dev + the first production
 *     deploy without a DB.
 *
 *   - PostgresMarketingStore would mirror the in-memory pattern with
 *     a Prisma model. Not implemented in v1 — the in-memory store is
 *     wrapped in a singleton so swapping it later is a one-line
 *     factory change, same pattern as session-store.
 */

export interface MarketingStore {
  getConfig(): Promise<MarketingScheduleConfig>;
  putConfig(config: MarketingScheduleConfig): Promise<void>;

  recordPost(args: RecordMarketingPostArgs): Promise<MarketingPost>;
  updatePost(args: UpdateMarketingPostArgs): Promise<MarketingPost | null>;
  listPosts(args?: {
    platform?: MarketingPlatform;
    status?: MarketingPostStatus;
    limit?: number;
  }): Promise<MarketingPost[]>;

  /** Test/reset helper. */
  reset(): void;
}

export class InMemoryMarketingStore implements MarketingStore {
  private config: MarketingScheduleConfig = { ...DEFAULT_MARKETING_CONFIG };
  private readonly posts: MarketingPost[] = [];

  async getConfig(): Promise<MarketingScheduleConfig> {
    return applyEnvOverrides({ ...this.config });
  }

  async putConfig(config: MarketingScheduleConfig): Promise<void> {
    this.config = { ...config };
  }

  async recordPost(args: RecordMarketingPostArgs): Promise<MarketingPost> {
    const now = new Date().toISOString();
    const post: MarketingPost = {
      id: `mp_${cryptoRandomId()}`,
      platform: args.platform,
      citySlug: args.citySlug,
      cityName: args.cityName,
      payload: args.payload,
      status: 'pending',
      scheduledFor: args.scheduledFor,
      createdAt: now,
    };
    this.posts.push(post);
    return post;
  }

  async updatePost(args: UpdateMarketingPostArgs): Promise<MarketingPost | null> {
    const idx = this.posts.findIndex((p) => p.id === args.id);
    if (idx === -1) return null;
    const prev = this.posts[idx]!;
    const next: MarketingPost = {
      ...prev,
      status: args.status,
      ...(args.externalUrl !== undefined ? { externalUrl: args.externalUrl } : {}),
      ...(args.errorMessage !== undefined ? { errorMessage: args.errorMessage } : {}),
      ...(args.postedAt !== undefined ? { postedAt: args.postedAt } : {}),
    };
    this.posts[idx] = next;
    return next;
  }

  async listPosts(args: {
    platform?: MarketingPlatform;
    status?: MarketingPostStatus;
    limit?: number;
  } = {}): Promise<MarketingPost[]> {
    let view = [...this.posts];
    if (args.platform) view = view.filter((p) => p.platform === args.platform);
    if (args.status) view = view.filter((p) => p.status === args.status);
    view.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const limit = args.limit ?? 100;
    return view.slice(0, limit);
  }

  reset(): void {
    this.config = { ...DEFAULT_MARKETING_CONFIG };
    this.posts.length = 0;
  }
}

let cached: MarketingStore | null = null;

/**
 * Singleton accessor. Same pattern as session-store's factory —
 * swap to a Postgres-backed store with one line when ready.
 */
export function getMarketingStore(): MarketingStore {
  if (!cached) cached = new InMemoryMarketingStore();
  return cached;
}

/** Test-only — reset the module-level singleton. */
export function _resetMarketingStore(): void {
  cached = null;
}

function cryptoRandomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

/**
 * Env-var overlay for the schedule config.
 *
 * The in-memory store does not survive serverless instances, so a
 * config toggled in the admin UI is lost before the daily cron reads
 * it — the cron would see `enabled: false` forever. These env vars
 * make scheduling deterministic per deployment:
 *
 *   MARKETING_PINTEREST_ENABLED=true    MARKETING_PINTEREST_DAILY=10
 *   MARKETING_INSTAGRAM_ENABLED=...     MARKETING_INSTAGRAM_DAILY=...
 *   MARKETING_TIKTOK_ENABLED=...        MARKETING_TIKTOK_DAILY=...
 *
 * Unset vars leave the stored (or default) value untouched, so the
 * admin UI still works for same-instance experimentation. A
 * database-backed store is the long-term fix for history/analytics.
 */
function applyEnvOverrides(config: MarketingScheduleConfig): MarketingScheduleConfig {
  const platforms = ['pinterest', 'instagram', 'tiktok'] as const;
  for (const p of platforms) {
    const enabledRaw = (process.env[`MARKETING_${p.toUpperCase()}_ENABLED`] ?? '').trim().toLowerCase();
    if (enabledRaw === 'true' || enabledRaw === '1') config[p].enabled = true;
    else if (enabledRaw === 'false' || enabledRaw === '0') config[p].enabled = false;
    const dailyRaw = (process.env[`MARKETING_${p.toUpperCase()}_DAILY`] ?? '').trim();
    const daily = Number.parseInt(dailyRaw, 10);
    if (Number.isFinite(daily) && daily >= 0 && daily <= 50) config[p].dailyCount = daily;
  }
  return config;
}
