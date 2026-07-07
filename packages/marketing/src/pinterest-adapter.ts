import type {
  MarketingAdapter,
  MarketingAdapterPostInput,
  MarketingAdapterPostResult,
} from './adapter-types';
import type { PinterestPin } from './social-types';
import { findCityBySlug } from '@adored/seo-data';
import { pinterestClientFromEnv } from './pinterest-client';

/**
 * Pinterest adapter — brand-injected base class.
 *
 * Live posting uses Pinterest's v5 REST API. Image source is the
 * destination photo the brand already resolves for OG cards. The pin
 * lands on the configured PINTEREST_BOARD_ID with the pin's title,
 * description, alt text, and a brand-domain link tagged with the
 * platform's UTM.
 *
 * Brand-specific parts arrive via constructor deps:
 *   buildLink    — branded URL builder (handles pathSlug overrides +
 *                  any VRBO rotation the brand runs)
 *   resolvePhoto — durable destination photo resolver
 *
 * Credentials checked: PINTEREST_ACCESS_TOKEN, PINTEREST_BOARD_ID.
 * Without both, the adapter runs in stub mode (logs + synthetic URL)
 * so the daily pipeline still exercises the rest of the scheduler.
 */

const REQUIRED = ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID'] as const;

export interface PinterestAdapterDeps {
  buildLink: (args: {
    citySlug: string;
    cityName?: string;
    platform: 'pinterest';
    pathSlug?: string;
  }) => string;
  resolvePhoto: (query: {
    name: string;
    country: string;
    region?: string;
  }) => { url: string };
}

export class BasePinterestAdapter implements MarketingAdapter {
  readonly platform = 'pinterest' as const;
  readonly requiredCredentials = REQUIRED;
  readonly isLive: boolean;
  readonly #deps: PinterestAdapterDeps;

  constructor(deps: PinterestAdapterDeps) {
    this.#deps = deps;
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
      throw new Error(
        'PinterestAdapter: client construction returned null despite isLive',
      );
    }

    const boardId = (process.env.PINTEREST_BOARD_ID ?? '').trim();
    const city = findCityBySlug(input.citySlug);
    if (!city) {
      throw new Error(`PinterestAdapter: unknown city slug ${input.citySlug}`);
    }
    const photo = this.#deps.resolvePhoto({
      name: city.name,
      country: city.countryCode,
      ...(city.region ? { region: city.region } : {}),
    });

    const link = this.#deps.buildLink({
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
