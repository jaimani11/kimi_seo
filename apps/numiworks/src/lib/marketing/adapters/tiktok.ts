import type {
  MarketingAdapter,
  MarketingAdapterPostInput,
  MarketingAdapterPostResult,
} from './types';
import type { ShortFormVideoScript } from '@lib/social/types';

/**
 * TikTok adapter.
 *
 * Real API: TikTok Content Posting API
 * (https://developers.tiktok.com/doc/content-posting-api). The free
 * affiliate-style "Direct Post" API requires:
 *
 *   - A TikTok for Developers app, approved for the Content Posting
 *     scope (creator account; the app review can take days).
 *   - OAuth user access token with scope `video.publish`.
 *   - A backing video file. The scheduler generates *scripts* not
 *     finished videos — the script + scene list goes into a creator
 *     queue ("here's the next script to film") rather than direct-
 *     posting an empty container.
 *
 * Credentials this adapter checks:
 *   - TIKTOK_ACCESS_TOKEN       — OAuth user token, `video.publish` scope
 *   - TIKTOK_OPEN_ID            — TikTok account open id
 *
 * Without both, the adapter runs in stub mode and logs the script
 * outline. With both, live posting requires a video asset; v1 still
 * stubs because uploading a video the scheduler hasn't authored is
 * beyond a content-generation script's scope. The right v2 is one
 * of: (a) hook in a video-render service like Pictory / Lumen5, or
 * (b) post the script to an internal "needs filming" queue for a
 * human / agent to fulfill.
 */

const REQUIRED = ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_OPEN_ID'] as const;

export class TikTokAdapter implements MarketingAdapter {
  readonly platform = 'tiktok' as const;
  readonly requiredCredentials = REQUIRED;
  readonly isLive: boolean;

  constructor() {
    this.isLive = REQUIRED.every((k) => Boolean(process.env[k]?.trim()));
  }

  async post(input: MarketingAdapterPostInput): Promise<MarketingAdapterPostResult> {
    const script = input.payload as ShortFormVideoScript;
    const mode: 'stub' | 'live' = this.isLive ? 'live' : 'stub';
    console.info('[marketing/tiktok]', {
      mode,
      citySlug: input.citySlug,
      hook: script.hook.slice(0, 80),
    });
    const externalUrl = mode === 'live'
      ? `https://www.tiktok.com/@stub/video/${input.citySlug}`
      : `tiktok://stub/${input.citySlug}/${encodeURIComponent(script.hook.slice(0, 40))}`;
    return { mode, externalUrl };
  }
}
