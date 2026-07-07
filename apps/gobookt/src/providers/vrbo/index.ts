import type { ProviderBadge, ProviderContext, ProviderSearchQuery } from '@core/provider';
import { providerId } from '@core/ids';
import type { Stay } from '@core/stay';
import type { RapidCredentials } from '../_shared/rapid-signature';
import { BaseAffiliateProvider } from '../_shared/affiliate-provider';
import { searchVrbo } from './client';
import { mapVrboProperty } from './mapper';

const PROVIDER_ID = providerId('vrbo');

/**
 * Vrbo provider - Expedia Group's vacation-rental brand, served via
 * the same EPS Rapid surface as Expedia. The differences from
 * `ExpediaProvider`:
 *
 *   - Search filters by Rapid category ids that correspond to
 *     vacation-rental inventory (cottage, vacation rental, private
 *     vacation home, cabin, guest house, villa).
 *   - Mapper namespaces ids as `vrbo:<property_id>`, sets
 *     `providerId='vrbo'`, defaults `Stay.type` to `'villa'` when the
 *     Rapid category isn't more specific.
 *   - Affiliate redirect URL goes to `vrbo.com/<id>` with the partner's
 *     `affiliateId` query param.
 *
 * Two environment patterns:
 *
 *   1. Vrbo-only contract: set `VRBO_API_KEY` + `VRBO_SHARED_SECRET`
 *      (separate from `EXPEDIA_*`). Common for partners who only
 *      sell vacation rentals.
 *
 *   2. Combined Expedia Group contract: same Rapid creds for both
 *      products. Set `VRBO_API_KEY` = `EXPEDIA_API_KEY` (or just set
 *      both with the same value).
 *
 * `VRBO_AFFILIATE_ID` is optional - falls back to the api key when
 * unset (matches the Expedia pattern).
 */
export class VrboProvider extends BaseAffiliateProvider {
  private readonly creds: RapidCredentials;
  private readonly affiliateId: string;

  constructor(creds: RapidCredentials, affiliateId?: string) {
    super({
      id: PROVIDER_ID,
      displayName: 'Vrbo',
      capabilities: {
        realtime: true,
        affiliateAttribution: true,
        supportsAvailability: true,
        supportsBooking: false, // redirect flow
      },
      cacheTtlMs: 30 * 60 * 1000,
      dataMaxAgeMs: 30 * 60 * 1000,
    });
    this.creds = creds;
    this.affiliateId = affiliateId ?? creds.apiKey;
  }

  static fromEnv(): VrboProvider | null {
    const apiKey = process.env.VRBO_API_KEY;
    const sharedSecret = process.env.VRBO_SHARED_SECRET;
    if (!apiKey || !sharedSecret) return null;
    const affiliateId = process.env.VRBO_AFFILIATE_ID || apiKey;
    return new VrboProvider({ apiKey, sharedSecret }, affiliateId);
  }

  protected async fetchStays(q: ProviderSearchQuery, ctx: ProviderContext): Promise<Stay[]> {
    const res = await searchVrbo(q, this.creds, ctx.signal);
    if (!res) return [];
    return res.properties.map((p) => mapVrboProperty(p, this.affiliateId));
  }

  protected buildBadges(_q: ProviderSearchQuery, stays: Stay[]): ProviderBadge[] {
    if (stays.length === 0) return [];
    return [{ kind: 'live', label: 'Vrbo · Live availability' }];
  }
}
