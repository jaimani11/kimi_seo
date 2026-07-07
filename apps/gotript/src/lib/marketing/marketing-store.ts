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
    return { ...this.config };
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
