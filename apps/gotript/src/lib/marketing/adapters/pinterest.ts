import type {
  MarketingAdapter,
  MarketingAdapterPostInput,
  MarketingAdapterPostResult,
} from './types';
import type { PinterestPin } from '@lib/social/types';
import { findCityBySlug } from '@lib/seo/cities';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { brandedGotriptUrl } from '../branded-url';
import { pinterestClientFromEnv } from './pinterest-client';

/**
 * Pinterest adapter.
 *
 * Live posting uses Pinterest's v5 REST API
 * (https://api.pinterest.com/v5/pins). Image source is the
 * destination photo we already resolve for OG cards (durable Unsplash
 * CDN ids). Pin lands on the configured PINTEREST_BOARD_ID with the
 * pin's title, description, alt text, and a gotript.com link tagged
 * with the platform's UTM.
 *
 * Credentials this adapter checks:
 *   PINTEREST_ACCESS_TOKEN   — required, OAuth user token
 *   PINTEREST_BOARD_ID       — required, the board to pin to
 *
 * Without both, the adapter runs in stub mode (logs + returns a
 * synthetic URL) so the daily pipeline still exercises the rest of
 * the scheduler.
 *
 * Failure modes the adapter gracefully degrades through:
 *   - 401 invalid_token  → marks the post as failed with a clear
 *                          message; the admin /admin/marketing
 *                          surface highlights the broken status.
 *   - 401 insufficient_scope → marks failed; this is the typical
 *                          "trial token, no pins:write yet" state.
 *   - 5xx / network      → marks failed; the daily cron's next run
 *                          will try again on a different rotation.
 */

const REQUIRED = ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID'] as const;

export class PinterestAdapter implements MarketingAdapter {
  readonly platform = 'pinterest' as const;
  readonly requiredCredentials = REQUIRED;
  readonly isLive: boolean;

  constructor() {
    this.isLive = REQUIRED.every((k) => Boolean(process.env[k]?.trim()));
  }

  async post(input: MarketingAdapterPostInput): Promise<MarketingAdapterPostResult> {
    const pin = input.payload as PinterestPin;

    if (!this.isLive) {
      console.info('[marketing/pinterest]', {
        mode: 'stub',
        citySlug: input.citySlug,
        title: pin.title.slice(0, 80),
      });
      return {
        mode: 'stub',
        externalUrl: `pinterest://stub/${input.citySlug}/${encodeURIComponent(pin.title.slice(0, 40))}`,
      };
    }

    const client = pinterestClientFromEnv();
    if (!client) {
      // Should be impossible — isLive guards on the same env. Defensive.
      throw new Error('PinterestAdapter: client construction returned null despite isLive');
    }

    const boardId = (process.env.PINTEREST_BOARD_ID ?? '').trim();
    const city = findCityBySlug(input.citySlug);
    if (!city) {
      throw new Error(`PinterestAdapter: unknown city slug ${input.citySlug}`);
    }
    const photo = resolveDestinationPhoto({
      name: city.name,
      country: city.countryCode,
      ...(city.region ? { region: city.region } : {}),
    });

    const link = brandedGotriptUrl({
      citySlug: input.citySlug,
      cityName: city.name,
      platform: 'pinterest',
      ...(pin.pathSlug ? { pathSlug: pin.pathSlug } : {}),
    });

    const created = await client.createPin({
      boardId,
      title: pin.title,
      description: pin.description,
      altText: pin.visualConcept,
      link,
      imageUrl: photo.url,
    });

    console.info('[marketing/pinterest]', {
      mode: 'live',
      citySlug: input.citySlug,
      pinId: created.pinId,
    });

    return {
      mode: 'live',
      externalUrl: created.url,
    };
  }
}
