/**
 * Branded gotript.com URLs for social-content CTAs.
 *
 * Every post that goes out on Pinterest, Instagram, or TikTok must
 * route back to gotript.com — both for brand presence and for
 * measurable attribution. Each URL carries:
 *
 *   utm_source   = the platform (pinterest / instagram / tiktok)
 *   utm_medium   = always 'organic' (no paid spend on social)
 *   utm_campaign = 'daily-{citySlug}' so the analytics dashboard
 *                  can tell apart cohorts.
 *
 * ## VRBO rotation (v2)
 *
 * VRBO is the highest-commission product in the Expedia Group family
 * (8-10% vs 3-4% Expedia hotels). To surface it to social visitors
 * without abandoning the editorial destination guides, we split the
 * rotation:
 *
 *   ~30% of daily posts → `/vacation-rentals?ss={city}` (VRBO direct)
 *   ~70% of daily posts → `/destinations/{citySlug}` (guide + VRBO
 *                          callout at the top of the page)
 *
 * The variant is deterministic per (citySlug, platform, day) so the
 * same city on the same day always produces the same CTA — makes the
 * marketing store's dedupe logic simpler and lets A/B analysis roll
 * up cleanly per platform.
 */

const ORIGIN = 'https://www.gotript.com';

export type BrandedUrlVariant = 'destination-guide' | 'vrbo-direct';

export interface BrandedUrlInput {
  citySlug: string;
  cityName?: string;
  platform: 'pinterest' | 'instagram' | 'tiktok';
  /** Override the automatic rotation. Used by admins to force one
   *  variant during manual runs. */
  variant?: BrandedUrlVariant;
  /** Day bucket (ISO date). Used with the citySlug + platform to
   *  produce the deterministic rotation. Defaults to today. */
  dayKey?: string;
  /** Optional themed path slug (e.g. `paris-with-kids`). When set,
   *  bypasses the VRBO/guide variant rotation and lands directly on
   *  `/{pathSlug}` — used for themed pins that have their own landing
   *  page. */
  pathSlug?: string;
}

export function brandedGotriptUrl(input: BrandedUrlInput): string {
  // Themed pins with a pathSlug win over the VRBO/guide rotation —
  // /paris-with-kids ranks for its own long-tail search.
  if (input.pathSlug) {
    const url = new URL(`${ORIGIN}/${input.pathSlug}`);
    url.searchParams.set('utm_source', input.platform);
    url.searchParams.set('utm_medium', 'organic');
    url.searchParams.set('utm_campaign', `daily-${input.citySlug}`);
    return url.toString();
  }

  const variant = input.variant ?? pickVariant(input);
  const url =
    variant === 'vrbo-direct'
      ? new URL(`${ORIGIN}/vacation-rentals`)
      : new URL(`${ORIGIN}/destinations/${input.citySlug}`);

  if (variant === 'vrbo-direct') {
    url.searchParams.set('ss', input.cityName ?? input.citySlug);
  }

  url.searchParams.set('utm_source', input.platform);
  url.searchParams.set('utm_medium', 'organic');
  url.searchParams.set(
    'utm_campaign',
    variant === 'vrbo-direct' ? `vrbo-${input.citySlug}` : `daily-${input.citySlug}`,
  );
  return url.toString();
}

/**
 * Deterministic hash → 30% vrbo-direct, 70% destination-guide.
 * Uses a simple sum-of-char-codes hash across (citySlug, platform,
 * dayKey) so the same input always produces the same variant, and the
 * rotation is stable across serverless cold-starts.
 */
function pickVariant(input: BrandedUrlInput): BrandedUrlVariant {
  const dayKey = input.dayKey ?? isoDay();
  const seed = `${input.citySlug}|${input.platform}|${dayKey}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 100 < 30 ? 'vrbo-direct' : 'destination-guide';
}

function isoDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Compact label used inside CTA copy ("Plan it on gotript.com").
 * Doesn't carry UTM (it's surface text, not a link), so the same
 * label can appear in pin descriptions where the platform won't
 * make the URL clickable anyway.
 */
export const GOTRIPT_DOMAIN_LABEL = 'gotript.com';
