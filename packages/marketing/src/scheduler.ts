import { SEO_CITIES, findCityBySlug, type SeoCity } from '@adored/seo-data';
import type { CitySocialPack } from './social-types';
import { pickRotatedCities, todayKey } from './city-rotation';
import type {
  MarketingPlatform,
  MarketingPlatformConfig,
  MarketingPost,
  MarketingPostPayload,
  MarketingRunSummary,
  MarketingScheduleConfig,
  RecordMarketingPostArgs,
  UpdateMarketingPostArgs,
} from './types';
import { MARKETING_PLATFORMS } from './types';
import type { MarketingAdapter } from './adapter-types';
import type { BrandedUrlBuilder } from './branded-url';

/**
 * Daily marketing scheduler — brand-injected factory.
 *
 * The run loop is identical for every brand: pick rotated cities,
 * generate platform content, enqueue records, post via adapters,
 * return a summary. Everything brand-specific arrives via deps:
 *
 *   getStore / getAdapters — the app's store + adapter registry
 *   generatePack           — LLM-backed pack generator (brand voice)
 *   fallbackPack           — deterministic template generator
 *   buildBrandedUrl        — CTA link builder (brand domain + UTM)
 *   brandDomain            — used to strip pre-embedded CTA links
 *
 * Concurrency: per-platform sequential, platforms in parallel — the
 * platform APIs rate-limit per-account QPS, and a small natural
 * delay between posts looks more human anyway.
 */

export interface SchedulerStore {
  getConfig(): Promise<MarketingScheduleConfig>;
  listPosts(args: {
    platform?: MarketingPlatform;
    limit?: number;
  }): Promise<MarketingPost[]>;
  recordPost(args: RecordMarketingPostArgs): Promise<MarketingPost>;
  updatePost(args: UpdateMarketingPostArgs): Promise<MarketingPost | null>;
}

export interface MarketingSchedulerDeps {
  getStore: () => SchedulerStore;
  getAdapters: () => Map<MarketingPlatform, MarketingAdapter>;
  generatePack: (city: SeoCity) => Promise<CitySocialPack>;
  fallbackPack: (city: SeoCity) => CitySocialPack;
  buildBrandedUrl: BrandedUrlBuilder;
  /** Bare brand domain (e.g. "gotript.com") — pre-embedded CTA links
   *  matching it get stripped before the tagged URL is re-attached. */
  brandDomain: string;
}

export interface RunSchedulerArgs {
  /** Override the day bucket — admins running "manual" trigger pass
   *  the current ISO date; tests pass anything. */
  dayKey?: string;
  /** Limit the run to a specific platform; defaults to all enabled
   *  platforms. */
  onlyPlatform?: MarketingPlatform;
  /** When true, ignores the config's `enabled` flag and runs
   *  whichever platforms have a non-zero dailyCount. Used by the
   *  admin "Run now" button. */
  forceRun?: boolean;
}

export interface MarketingScheduler {
  runMarketingScheduler(args?: RunSchedulerArgs): Promise<MarketingRunSummary>;
  getRecentPosts(limit?: number): Promise<MarketingPost[]>;
}

export function createMarketingScheduler(
  deps: MarketingSchedulerDeps,
): MarketingScheduler {
  const domainRe = new RegExp(
    `\\s*(https?:\\/\\/)?(www\\.)?${deps.brandDomain.replace(/\./g, '\\.')}[^\\s]*$`,
    'i',
  );

  async function runMarketingScheduler(
    args: RunSchedulerArgs = {},
  ): Promise<MarketingRunSummary> {
    const startedAt = new Date();
    const startedAtIso = startedAt.toISOString();
    const dayKey = args.dayKey ?? todayKey(startedAt);

    const store = deps.getStore();
    const adapters = deps.getAdapters();
    const config = await store.getConfig();

    const platforms = (
      args.onlyPlatform ? [args.onlyPlatform] : MARKETING_PLATFORMS
    ).filter((p) => shouldRun(config[p], args.forceRun ?? false));

    // Look back ~14 days of history per platform: cooldown (no city
    // two days in a row on the same platform) + anti-repeat (prefer
    // pack items not yet posted for this city).
    const HISTORY_LOOKBACK = 200;
    const COOLDOWN_DAYS = 2;
    const historyByPlatform = new Map<MarketingPlatform, MarketingPost[]>();
    for (const p of platforms) {
      historyByPlatform.set(
        p,
        await store.listPosts({ platform: p, limit: HISTORY_LOOKBACK }),
      );
    }

    // Union of cities across platforms → one pack per city (avoids
    // duplicate LLM calls when platforms overlap on a city).
    const cityUnion: string[] = [];
    const perPlatformCities: Record<MarketingPlatform, string[]> = {
      pinterest: [],
      instagram: [],
      tiktok: [],
    };
    for (const platform of platforms) {
      const cooldownSlugs = slugsWithinCooldown(
        historyByPlatform.get(platform) ?? [],
        dayKey,
        COOLDOWN_DAYS,
      );
      const slugs = pickRotatedCities({
        dayKey,
        platform,
        count: config[platform].dailyCount,
        excludeSlugs: cooldownSlugs,
      });
      perPlatformCities[platform] = slugs;
      for (const s of slugs) {
        if (!cityUnion.includes(s)) cityUnion.push(s);
      }
    }

    const packs = new Map<string, CitySocialPack>();
    for (const slug of cityUnion) {
      const city = findCityBySlug(slug) ?? SEO_CITIES[0]!;
      let pack: CitySocialPack;
      try {
        pack = await deps.generatePack(city);
      } catch (err) {
        // The LLM-backed generator falls back to template internally,
        // but a programmer bug or import-time failure could still
        // throw. Belt-and-braces: catch and force the template path.
        console.warn(
          '[marketing/scheduler] generatePack threw, falling back to template',
          { slug, error: err instanceof Error ? err.message : String(err) },
        );
        pack = deps.fallbackPack(city);
      }
      packs.set(slug, pack);
    }

    const perPlatformSummary: MarketingRunSummary['perPlatform'] = {
      pinterest: { attempted: 0, posted: 0, failed: 0, skipped: 0 },
      instagram: { attempted: 0, posted: 0, failed: 0, skipped: 0 },
      tiktok: { attempted: 0, posted: 0, failed: 0, skipped: 0 },
    };

    await Promise.all(
      platforms.map(async (platform) => {
        const slugs = perPlatformCities[platform];
        const adapter = adapters.get(platform);
        if (!adapter) return;
        for (let i = 0; i < slugs.length; i++) {
          const slug = slugs[i]!;
          const city = findCityBySlug(slug);
          if (!city) {
            perPlatformSummary[platform].skipped += 1;
            continue;
          }
          const pack = packs.get(slug);
          if (!pack) {
            perPlatformSummary[platform].skipped += 1;
            continue;
          }
          const platformHistory = historyByPlatform.get(platform) ?? [];
          const rawPayload = pickPayload({
            pack,
            platform,
            slotIndex: i,
            citySlug: slug,
            history: platformHistory,
          });
          if (!rawPayload) {
            perPlatformSummary[platform].skipped += 1;
            continue;
          }

          // Rewrite the CTA to embed the branded URL + platform UTM
          // so the analytics dashboard can attribute traffic per
          // (platform, city).
          const payload = withBrandedCta(rawPayload, {
            citySlug: city.slug,
            cityName: city.name,
            platform,
            dayKey,
          });

          perPlatformSummary[platform].attempted += 1;

          const stored = await store.recordPost({
            platform,
            citySlug: city.slug,
            cityName: city.name,
            payload,
            scheduledFor: startedAtIso,
          });

          try {
            const result = await adapter.post({
              citySlug: city.slug,
              cityName: city.name,
              payload,
            });
            await store.updatePost({
              id: stored.id,
              status: 'posted',
              externalUrl: result.externalUrl,
              postedAt: new Date().toISOString(),
            });
            perPlatformSummary[platform].posted += 1;
          } catch (err) {
            await store.updatePost({
              id: stored.id,
              status: 'failed',
              errorMessage: err instanceof Error ? err.message : String(err),
            });
            perPlatformSummary[platform].failed += 1;
          }
        }
      }),
    );

    const finishedAt = new Date();
    const summary: MarketingRunSummary = {
      startedAt: startedAtIso,
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      perPlatform: perPlatformSummary,
      totals: sumTotals(perPlatformSummary),
    };
    console.info('[marketing/scheduler] run complete', summary);
    return summary;
  }

  /**
   * Rewrite the CTA on a payload to point at the brand domain with a
   * UTM-tagged link. Templates + LLM both embed bare domain mentions;
   * normalize unconditionally so the CTA URL is always present and
   * correctly tagged.
   */
  function withBrandedCta(
    payload: MarketingPostPayload,
    args: {
      citySlug: string;
      cityName?: string;
      platform: 'pinterest' | 'instagram' | 'tiktok';
      dayKey?: string;
    },
  ): MarketingPostPayload {
    const brandedUrl = deps.buildBrandedUrl(args);
    const original = (payload as { cta?: string }).cta ?? '';
    const stripped = original.replace(domainRe, '').trim();
    const surface =
      stripped.length > 0
        ? `${stripped} · ${brandedUrl}`
        : `Plan it on ${brandedUrl}`;
    return { ...(payload as object), cta: surface } as MarketingPostPayload;
  }

  async function getRecentPosts(limit = 60): Promise<MarketingPost[]> {
    return deps.getStore().listPosts({ limit });
  }

  return { runMarketingScheduler, getRecentPosts };
}

function shouldRun(cfg: MarketingPlatformConfig, forceRun: boolean): boolean {
  if (cfg.dailyCount <= 0) return false;
  if (forceRun) return true;
  return cfg.enabled;
}

/**
 * Pick the payload for a given (city, platform, slot-index).
 * Three-tier preference for variety across days:
 *   1. pack items NOT in this city's platform history
 *   2. all used → the LEAST recently posted one
 *   3. fallback: slotIndex % pack.length
 */
function pickPayload(args: {
  pack: CitySocialPack;
  platform: MarketingPlatform;
  slotIndex: number;
  citySlug: string;
  history: readonly MarketingPost[];
}): MarketingPostPayload | null {
  const items =
    args.platform === 'tiktok'
      ? args.pack.tiktok
      : args.platform === 'instagram'
        ? args.pack.pinterest // same shape, instagram-friendly
        : args.pack.pinterest;
  if (items.length === 0) return null;

  const lastUsedAt = new Map<string, string>();
  for (const post of args.history) {
    if (post.citySlug !== args.citySlug) continue;
    const key = payloadKey(post.payload);
    const prev = lastUsedAt.get(key);
    if (!prev || prev < post.createdAt) {
      lastUsedAt.set(key, post.createdAt);
    }
  }

  const unused: MarketingPostPayload[] = [];
  const used: { item: MarketingPostPayload; lastUsedAt: string }[] = [];
  for (const item of items) {
    const ts = lastUsedAt.get(payloadKey(item));
    if (ts) used.push({ item, lastUsedAt: ts });
    else unused.push(item);
  }
  if (unused.length > 0) {
    const idx = args.slotIndex % unused.length;
    return unused[idx] ?? null;
  }
  if (used.length > 0) {
    used.sort((a, b) => a.lastUsedAt.localeCompare(b.lastUsedAt));
    return used[0]!.item;
  }
  return items[args.slotIndex % items.length] ?? null;
}

/** Compact identity for a payload — pin title / video hook. */
function payloadKey(payload: MarketingPostPayload): string {
  const p = payload as { title?: string; hook?: string };
  return (p.title ?? p.hook ?? '').slice(0, 200);
}

/** citySlugs posted to this platform within the cooldown window. */
function slugsWithinCooldown(
  history: readonly MarketingPost[],
  dayKey: string,
  cooldownDays: number,
): Set<string> {
  const slugs = new Set<string>();
  const cutoff = new Date(dayKey + 'T00:00:00Z');
  cutoff.setUTCDate(cutoff.getUTCDate() - cooldownDays);
  const cutoffIso = cutoff.toISOString();
  for (const post of history) {
    if (post.createdAt >= cutoffIso) slugs.add(post.citySlug);
  }
  return slugs;
}

function sumTotals(
  per: MarketingRunSummary['perPlatform'],
): MarketingRunSummary['totals'] {
  const totals = { attempted: 0, posted: 0, failed: 0, skipped: 0 };
  for (const k of MARKETING_PLATFORMS) {
    totals.attempted += per[k].attempted;
    totals.posted += per[k].posted;
    totals.failed += per[k].failed;
    totals.skipped += per[k].skipped;
  }
  return totals;
}
