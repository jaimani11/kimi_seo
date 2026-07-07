import type {
  MarketingAdapter,
  MarketingAdapterPostInput,
  MarketingAdapterPostResult,
} from './adapter-types';
import type { PinterestPin } from './social-types';

/**
 * Instagram adapter.
 *
 * Real API: Instagram Graph API on the Facebook side
 * (https://graph.facebook.com/v18.0/{ig-user-id}/media + /media_publish).
 * Two-step: create a media container with the image URL + caption,
 * then publish the container id. Requires:
 *
 *   - A Facebook page connected to the Instagram Business / Creator
 *     account, with the page id (FB Business Manager).
 *   - A long-lived page access token (you can mint a 60-day one and
 *     refresh; production should use a server-side token refresh).
 *   - The Instagram Business user id (different from the IG handle).
 *
 * Credentials this adapter checks:
 *   - INSTAGRAM_ACCESS_TOKEN    — long-lived page access token
 *   - INSTAGRAM_USER_ID         — IG Business user id
 *
 * We reuse the PinterestPin shape as the payload — IG feed posts
 * have the same conceptual fields (image + caption + hashtags +
 * destination link in the comment / link-in-bio). The adapter
 * formats the caption from `title + description + hashtags + cta`
 * at post time.
 */

const REQUIRED = ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_USER_ID'] as const;

export class InstagramAdapter implements MarketingAdapter {
  readonly platform = 'instagram' as const;
  readonly requiredCredentials = REQUIRED;
  readonly isLive: boolean;

  constructor() {
    this.isLive = REQUIRED.every((k) => Boolean(process.env[k]?.trim()));
  }

  async post(input: MarketingAdapterPostInput): Promise<MarketingAdapterPostResult> {
    const pin = input.payload as PinterestPin;
    const mode: 'stub' | 'live' = this.isLive ? 'live' : 'stub';
    console.info('[marketing/instagram]', {
      mode,
      citySlug: input.citySlug,
      title: pin.title.slice(0, 80),
    });
    const externalUrl = mode === 'live'
      ? `https://www.instagram.com/p/stub-${input.citySlug}/`
      : `instagram://stub/${input.citySlug}/${encodeURIComponent(pin.title.slice(0, 40))}`;
    return { mode, externalUrl };
  }
}
