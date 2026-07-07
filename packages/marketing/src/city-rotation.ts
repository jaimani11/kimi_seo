import { SEO_CITIES, findCityBySlug } from '@adored/seo-data';
import { buildWeightedCityPool, weightOf } from './popularity';

/**
 * Pick N distinct cities for a given day + platform.
 *
 * The selection is deterministic AND popularity-weighted:
 *
 *   - Same (day, platform) always returns the same set.
 *   - Different (day, platform) tuples shuffle independently.
 *   - Tier-1 popular cities (Tokyo / Paris / Rome / NYC / ...) get
 *     4× the weight of long-tail cities, so the social calendar
 *     leans on what actually pulls high-intent travel traffic.
 *   - Crashes / retries inside the same day produce the same plan
 *     (idempotent within a day).
 *
 * Optionally takes a `recentlyUsed` set of slugs to exclude — used
 * by the scheduler's "no same city two days in a row on the same
 * platform" cooldown. Excluded slugs get filtered post-shuffle so
 * the determinism is preserved but the result respects the cooldown.
 */

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

function fnv1a(input: string): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * FNV_PRIME) >>> 0;
  }
  return h;
}

/**
 * Tiny seedable PRNG. Mulberry32 — fast, decent uniformity for our
 * Fisher-Yates shuffle, no Math.random dependency.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/**
 * Day key is a calendar-day-bucketed identifier. Production passes
 * the YYYY-MM-DD form of `new Date()`; tests pass any literal.
 */
export function pickRotatedCities(args: {
  dayKey: string;
  platform: string;
  count: number;
  /** Slugs to exclude — typically slugs posted yesterday on this
   *  same platform, so we don't post the same city two days in a
   *  row. Optional; empty default. */
  excludeSlugs?: ReadonlySet<string>;
}): string[] {
  const limit = Math.max(0, Math.min(args.count, SEO_CITIES.length));
  if (limit === 0) return [];

  const seed = fnv1a(`${args.dayKey}|${args.platform}`);
  const rng = mulberry32(seed);

  // Shuffle the weighted pool (popular cities appear multiple times),
  // then dedup as we walk so the final set has unique slugs.
  const pool = buildWeightedCityPool();
  const shuffled = shuffle(pool, rng);
  const exclude = args.excludeSlugs ?? new Set<string>();

  const picked: string[] = [];
  const seen = new Set<string>();
  for (const city of shuffled) {
    if (seen.has(city.slug)) continue;
    if (exclude.has(city.slug)) continue;
    seen.add(city.slug);
    picked.push(city.slug);
    if (picked.length >= limit) break;
  }

  // Edge case: cooldown excluded so many cities that we couldn't fill
  // the daily count from the weighted pool. Fall back to the
  // un-excluded weighted shuffle (popular cities preferred over long
  // tail) without the exclusion — better to repeat a popular city
  // than to under-deliver the daily quota.
  if (picked.length < limit) {
    for (const city of shuffled) {
      if (seen.has(city.slug)) continue;
      seen.add(city.slug);
      picked.push(city.slug);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

/**
 * Convenience: ISO-day-bucketed key for "today" in UTC. Production
 * cron passes this to pickRotatedCities so the rotation advances at
 * 00:00 UTC every day.
 */
export function todayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Sanity helper for tests + admin debug — returns the popularity
 * weight for a slug. Re-exported so callers don't have to import from
 * the popularity module directly.
 */
export function popularityWeightOf(citySlug: string): number {
  return findCityBySlug(citySlug) ? weightOf(citySlug) : 0;
}
