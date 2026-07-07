import { SEO_CITIES, findCityBySlug } from '@lib/seo/cities';
import { generateCitySocialPack } from '@lib/social/generator';
import { buildSocialPackFromTemplate } from '@lib/social/template-generator';
import type { CitySocialPack } from '@lib/social/types';
import { pickRotatedCities, todayKey } from './city-rotation';
import { getMarketingStore } from './marketing-store';
import { getMarketingAdapters } from './adapters';
import { brandedGotriptUrl } from './branded-url';
import type {
  MarketingPlatform,
  MarketingPlatformConfig,
  MarketingPost,
  MarketingPostPayload,
  MarketingRunSummary,
} from './types';
import { MARKETING_PLATFORMS } from './types';

/**
 * Daily scheduler. Picks rotated cities, generates platform content,
 * enqueues records, posts via adapters, and returns a summary.
 *
 * Concurrency: per-platform sequential, platforms in parallel. The
 * scheduler's hot path is the LLM-backed `buildSocialPack` — running
 * 50+ packs in parallel is wasteful (the same city would be requested
 * three times). v1 generates one pack per city and reuses it across
 * platforms, so the platform fan-out is just adapter calls.
 *
 * Concurrency note v2: as soon as Pinterest's daily count moves past
 * one rotation cycle the city set gets reused — that's fine, the
 * social pack has 10 pins per pack and we only post 1 per city per
 * day for now. Bumping daily counts beyond `SEO_CITIES.length` will
 * start repeating cities and warrants a fuller queue.
 */

export interface RunSchedulerArgs {
  /** Override the day bucket — admins running "manual" trigger pass
   *  the current ISO date; tests pass anything. */
  dayKey?: string;
  /** Limit the run to a specific platform; defaults to all enabled
   *  platforms. */
  onlyPlatform?: MarketingPlatform;
  /** When true, ignores the config's `enabled` flag and runs
   *  whichever platforms have a non-zero dailyCount. Used by the
   *  admin "Run now" button so an operator can preview content
   *  without flipping the live switch. */
  forceRun?: boolean;
}

export async function runMarketingScheduler(
  args: RunSchedulerArgs = {},
): Promise<MarketingRunSummary> {
  const startedAt = new Date();
  const startedAtIso = startedAt.toISOString();
  const dayKey = args.dayKey ?? todayKey(startedAt);

  const store = getMarketingStore();
  const adapters = getMarketingAdapters();
  const config = await store.getConfig();

  const platforms = (args.onlyPlatform ? [args.onlyPlatform] : MARKETING_PLATFORMS).filter(
    (p) => shouldRun(config[p], args.forceRun ?? false),
  );

  // Look back ~14 days of history per platform. Two uses:
  //   1. Cooldown — the slugs posted in the last 2 days on this
  //      platform get excluded from today's rotation, so a city
  //      can't be posted two days in a row on the same platform.
  //   2. Anti-repeat — for each city+platform we look up which pack
  //      items have already been posted and prefer ones we haven't
  //      used. After all items have been used we rotate to the
  //      oldest-used one.
  const HISTORY_LOOKBACK = 200;
  const COOLDOWN_DAYS = 2;
  const historyByPlatform = new Map<MarketingPlatform, MarketingPost[]>();
  for (const p of platforms) {
    historyByPlatform.set(
      p,
      await store.listPosts({ platform: p, limit: HISTORY_LOOKBACK }),
    );
  }

  // Pre-collect the union of cities we'll need (the largest
  // dailyCount across selected platforms) and generate one pack per
  // city. This avoids redundant LLM calls when two platforms happen
  // to overlap on the same city.
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
      pack = await generateCitySocialPack(city);
    } catch (err) {
      // The LLM-backed generator falls back to template internally,
      // but a programmer bug or import-time failure could still
      // throw. Belt-and-braces: catch and force the template path.
      console.warn('[marketing/scheduler] buildSocialPack threw, falling back to template', {
        slug,
        error: err instanceof Error ? err.message : String(err),
      });
      pack = buildSocialPackFromTemplate(city);
    }
    packs.set(slug, pack);
  }

  const perPlatformSummary: MarketingRunSummary['perPlatform'] = {
    pinterest: { attempted: 0, posted: 0, failed: 0, skipped: 0 },
    instagram: { attempted: 0, posted: 0, failed: 0, skipped: 0 },
    tiktok: { attempted: 0, posted: 0, failed: 0, skipped: 0 },
  };

  // Per-platform fan-out runs in parallel, slots-within-a-platform
  // sequential. Sequential within a platform is intentional — the
  // platform APIs (when wired live) almost universally rate-limit
  // by per-account QPS, and a small natural delay between posts
  // looks more human anyway.
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

        // Rewrite the CTA to embed the branded stayviaowner.com URL +
        // platform-specific UTM. Every outgoing post points back to
        // the destination's /destinations/[slug] page so the
        // analytics dashboard can attribute traffic per platform per
        // city.
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

function shouldRun(
  cfg: MarketingPlatformConfig,
  forceRun: boolean,
): boolean {
  if (cfg.dailyCount <= 0) return false;
  if (forceRun) return true;
  return cfg.enabled;
}

/**
 * Pick the payload for a given (city, platform, slot-index).
 *
 * Three-tier preference for variety across days:
 *
 *   1. Prefer pack items NOT in the platform-wide history for this
 *      city. So a city coming back around after a cooldown picks a
 *      fresh angle the next time.
 *   2. If every pack item has been used for this city, pick the one
 *      used the longest ago — i.e. the LEAST recently posted angle.
 *   3. If even that's ambiguous (e.g. brand-new platform with no
 *      history), fall back to `slotIndex % pack.length` so the daily
 *      batch still has angle variety across cities.
 *
 * The result: same city, same platform → different headline every
 * time it cycles back. Same city across DIFFERENT platforms can
 * still share a pack item; that's fine because the audiences are
 * different.
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

  // Build a map of payload-key → most-recent-use timestamp (ISO).
  // The payload key is the content's identity — pin title or video
  // hook. Same key on two different days = same post.
  const lastUsedAt = new Map<string, string>();
  for (const post of args.history) {
    if (post.citySlug !== args.citySlug) continue;
    const key = payloadKey(post.payload);
    const prev = lastUsedAt.get(key);
    if (!prev || prev < post.createdAt) {
      lastUsedAt.set(key, post.createdAt);
    }
  }

  // Tier 1: unused pack items, ordered by their natural index so
  // the daily batch keeps angle variety across cities. Pick the one
  // that aligns with the slotIndex via modulo for slight rotation.
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

  // Tier 2: all pack items have been used for this city. Pick the
  // one used the longest ago so the city's feed feels fresh across
  // a long horizon.
  if (used.length > 0) {
    used.sort((a, b) => a.lastUsedAt.localeCompare(b.lastUsedAt));
    return used[0]!.item;
  }

  // Tier 3: belt-and-braces fallback (shouldn't reach here when
  // items.length > 0).
  return items[args.slotIndex % items.length] ?? null;
}

/**
 * Compact identity for a payload. Pin title / video hook are
 * unique enough within a single CitySocialPack — we don't need a
 * full hash, the substring is already discriminating.
 */
function payloadKey(payload: MarketingPostPayload): string {
  const p = payload as { title?: string; hook?: string };
  return (p.title ?? p.hook ?? '').slice(0, 200);
}

/**
 * Rewrite the CTA on a payload to point at stayviaowner.com with a
 * UTM-tagged link. The pack generator's templates and the LLM both
 * include stayviaowner.com mentions in the CTA text, but we
 * unconditionally normalize them here so:
 *   - the CTA URL is always present + always tagged with the
 *     correct utm_source for this platform
 *   - the city-specific utm_campaign lets the analytics dashboard
 *     group inbound traffic by (platform, city)
 *
 * Pin payloads carry `cta` as a plain string — we append the URL
 * if it isn't already there. Video scripts also carry `cta`; same
 * treatment.
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
  const brandedUrl = brandedGotriptUrl(args);
  const original = (payload as { cta?: string }).cta ?? '';
  // Drop any previously-attached URL on the CTA — the templates
  // sometimes embed stayviaowner.com without UTM. Re-attach the
  // tagged URL fresh.
  const stripped = original.replace(/\s*(https?:\/\/)?(www\.)?stayviaowner\.com[^\s]*$/i, '').trim();
  const surface = stripped.length > 0 ? `${stripped} · ${brandedUrl}` : `Plan it on ${brandedUrl}`;
  return { ...(payload as object), cta: surface } as MarketingPostPayload;
}

/**
 * Return the set of citySlugs posted to this platform in the last
 * `cooldownDays` days, relative to dayKey. Used to keep the rotation
 * from repeating the same city on consecutive days on the same
 * platform.
 */
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

/**
 * Read-only helper for the admin UI — returns recent posts grouped
 * by platform.
 */
export async function getRecentPosts(limit = 60): Promise<MarketingPost[]> {
  return getMarketingStore().listPosts({ limit });
}
