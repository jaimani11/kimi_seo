/**
 * Branded landing URLs for social-content CTAs — unified factory.
 *
 * Every post that goes out on Pinterest, Instagram, or TikTok must
 * route back to the brand's own domain — both for brand presence and
 * for measurable attribution. Each URL carries:
 *
 *   utm_source   = the platform (pinterest / instagram / tiktok)
 *   utm_medium   = always 'organic' (no paid spend on social)
 *   utm_campaign = 'daily-{citySlug}' (or 'vrbo-{citySlug}' for the
 *                  VRBO-direct rotation variant)
 *
 * Covers all brand shapes in one implementation:
 *   - simple guide links (numiworks, gobookt)
 *   - themed pathSlug overrides (/{city}-with-kids etc — all brands)
 *   - deterministic VRBO-direct rotation (gotript, stayviaowner):
 *     ~N% of daily posts land on /vacation-rentals?ss={city} instead
 *     of the guide, keyed on (citySlug, platform, dayKey) so the same
 *     city on the same day always produces the same CTA.
 */

export type BrandedUrlVariant = 'destination-guide' | 'vrbo-direct';

export interface BrandedUrlInput {
  citySlug: string;
  cityName?: string;
  platform: 'pinterest' | 'instagram' | 'tiktok';
  /** Override the automatic rotation. Used by admins to force one
   *  variant during manual runs. */
  variant?: BrandedUrlVariant;
  /** Day bucket (ISO date) for the deterministic rotation. Defaults
   *  to today. */
  dayKey?: string;
  /** Optional themed path slug (e.g. `paris-with-kids`). When set,
   *  wins over the variant rotation — the themed page ranks for its
   *  own long-tail search. */
  pathSlug?: string;
}

export interface BrandedUrlOptions {
  /** Canonical production origin, no trailing slash
   *  (e.g. https://www.gotript.com). */
  siteUrl: string;
  /** Enable the VRBO-direct rotation. Omit for brands that always
   *  land on the destination guide. */
  vrboRotation?: {
    /** Landing path for the direct variant (e.g. '/vacation-rentals'). */
    path: string;
    /** Percentage of posts (0-100) that take the direct variant. */
    sharePct: number;
  };
}

export type BrandedUrlBuilder = (input: BrandedUrlInput) => string;

export function createBrandedUrlBuilder(opts: BrandedUrlOptions): BrandedUrlBuilder {
  const origin = opts.siteUrl.endsWith('/')
    ? opts.siteUrl.slice(0, -1)
    : opts.siteUrl;

  return function brandedUrl(input: BrandedUrlInput): string {
    // Themed pins with a pathSlug win over everything — the themed
    // landing page ranks for its own long-tail search.
    if (input.pathSlug) {
      const url = new URL(`${origin}/${input.pathSlug}`);
      url.searchParams.set('utm_source', input.platform);
      url.searchParams.set('utm_medium', 'organic');
      url.searchParams.set('utm_campaign', `daily-${input.citySlug}`);
      return url.toString();
    }

    const rotation = opts.vrboRotation;
    const variant: BrandedUrlVariant = rotation
      ? input.variant ?? pickVariant(input, rotation.sharePct)
      : 'destination-guide';

    if (rotation && variant === 'vrbo-direct') {
      const url = new URL(`${origin}${rotation.path}`);
      url.searchParams.set('ss', input.cityName ?? input.citySlug);
      url.searchParams.set('utm_source', input.platform);
      url.searchParams.set('utm_medium', 'organic');
      url.searchParams.set('utm_campaign', `vrbo-${input.citySlug}`);
      return url.toString();
    }

    const url = new URL(`${origin}/destinations/${input.citySlug}`);
    url.searchParams.set('utm_source', input.platform);
    url.searchParams.set('utm_medium', 'organic');
    url.searchParams.set('utm_campaign', `daily-${input.citySlug}`);
    return url.toString();
  };
}

/**
 * Deterministic hash → sharePct% direct, rest guide. Sum-of-char-codes
 * over (citySlug, platform, dayKey) so the same input always produces
 * the same variant, stable across serverless cold-starts.
 */
function pickVariant(
  input: BrandedUrlInput,
  sharePct: number,
): BrandedUrlVariant {
  const dayKey = input.dayKey ?? isoDay();
  const seed = `${input.citySlug}|${input.platform}|${dayKey}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 100 < sharePct ? 'vrbo-direct' : 'destination-guide';
}

function isoDay(): string {
  return new Date().toISOString().slice(0, 10);
}
