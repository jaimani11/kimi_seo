/**
 * Branded numiworks.com URLs for social-content CTAs.
 *
 * Every post that goes out on Pinterest, Instagram, or TikTok must
 * route back to numiworks.com — both for brand presence and for
 * measurable attribution. Each URL carries:
 *
 *   utm_source   = the platform (pinterest / instagram / tiktok)
 *   utm_medium   = always 'organic' (no paid spend on social)
 *   utm_campaign = 'daily-{citySlug}' so the analytics dashboard
 *                  can tell apart cohorts (e.g. which cities pull
 *                  the most traffic from which platform)
 *
 * The destination path is the city's `/destinations/[slug]` guide
 * — that's the page numiworks owns, monetizes (via the Viator
 * affiliate links on the page), and can iterate on.
 */

const ORIGIN = 'https://www.numiworks.com';

export interface BrandedUrlInput {
  citySlug: string;
  platform: 'pinterest' | 'instagram' | 'tiktok';
  /** Optional path slug (e.g. `paris-with-kids`). When set, the URL
   *  points at `/{pathSlug}` instead of the default `/destinations/{citySlug}`.
   *  Used to route themed pins (with-kids, airport-guide, etc.) to
   *  their themed landing pages rather than the generic guide. */
  pathSlug?: string;
}

export function brandedNumiworksUrl(input: BrandedUrlInput): string {
  const path = input.pathSlug
    ? `${ORIGIN}/${input.pathSlug}`
    : `${ORIGIN}/destinations/${input.citySlug}`;
  const url = new URL(path);
  url.searchParams.set('utm_source', input.platform);
  url.searchParams.set('utm_medium', 'organic');
  url.searchParams.set('utm_campaign', `daily-${input.citySlug}`);
  return url.toString();
}

/**
 * Compact label used inside CTA copy ("Plan it on numiworks.com").
 * Doesn't carry UTM (it's surface text, not a link), so the same
 * label can appear in pin descriptions where the platform won't
 * make the URL clickable anyway.
 */
export const NUMIWORKS_DOMAIN_LABEL = 'numiworks.com';
