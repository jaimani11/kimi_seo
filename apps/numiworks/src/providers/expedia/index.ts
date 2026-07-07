import type { ProviderBadge, ProviderContext, ProviderSearchQuery } from '@core/provider';
import { providerId } from '@core/ids';
import type { Stay } from '@core/stay';
import { BaseAffiliateProvider } from '../_shared/affiliate-provider';
import { searchExpedia, type ExpediaCredentials } from './client';
import { mapExpediaProperty } from './mapper';

const PROVIDER_ID = providerId('expedia');

/**
 * Expedia provider. Self-registers via `ExpediaProvider.fromEnv()` -
 * returns null when both required env vars are missing, so the
 * registry never sees a half-configured provider.
 *
 * Mirrors BookingComProvider file-for-file by design - proves the B5
 * pattern reuses cleanly. Adding Vrbo / Hotelbeds is the same shape.
 */
export class ExpediaProvider extends BaseAffiliateProvider {
  private readonly creds: ExpediaCredentials;

  constructor(creds: ExpediaCredentials) {
    super({
      id: PROVIDER_ID,
      displayName: 'Expedia',
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
  }

  static fromEnv(): ExpediaProvider | null {
    const apiKey = process.env.EXPEDIA_API_KEY;
    const sharedSecret = process.env.EXPEDIA_SHARED_SECRET;
    if (!apiKey || !sharedSecret) return null;
    return new ExpediaProvider({ apiKey, sharedSecret });
  }

  protected async fetchStays(q: ProviderSearchQuery, ctx: ProviderContext): Promise<Stay[]> {
    const res = await searchExpedia(q, this.creds, ctx.signal);
    if (!res) return [];
    return res.properties.map((p) => mapExpediaProperty(p, this.creds.apiKey));
  }

  protected buildBadges(_q: ProviderSearchQuery, stays: Stay[]): ProviderBadge[] {
    if (stays.length === 0) return [];
    // 'live' kind so the ProvenanceBadge UI picks the live-tone styling.
    return [{ kind: 'live', label: 'Expedia · Live availability' }];
  }
}
