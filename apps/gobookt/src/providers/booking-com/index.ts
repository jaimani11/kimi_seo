import type { ProviderBadge, ProviderContext, ProviderSearchQuery } from '@core/provider';
import { providerId } from '@core/ids';
import type { Stay } from '@core/stay';
import { BaseAffiliateProvider } from '../_shared/affiliate-provider';
import { searchBookingCom, type BookingComCredentials } from './client';
import { mapBookingHotel } from './mapper';

const PROVIDER_ID = providerId('booking-com');

/**
 * Booking.com provider. Self-registers via `BookingComProvider.fromEnv()`
 * - returns null when both required env vars are missing, so the
 * registry never sees a half-configured provider.
 *
 * Coverage: global. Booking.com lists hotels in ~220 countries; we
 * declare `regions: undefined` (omitted) which the registry treats as
 * "everywhere." Specific country gates can be added if rate-limit
 * pressure mounts.
 */
export class BookingComProvider extends BaseAffiliateProvider {
  private readonly creds: BookingComCredentials;

  constructor(creds: BookingComCredentials) {
    super({
      id: PROVIDER_ID,
      displayName: 'Booking.com',
      capabilities: {
        realtime: true,
        affiliateAttribution: true,
        supportsAvailability: true,
        supportsBooking: false, // redirect flow, not booking-on-platform
        // No regions field → registry interprets as global coverage.
      },
      cacheTtlMs: 30 * 60 * 1000,
      dataMaxAgeMs: 30 * 60 * 1000,
    });
    this.creds = creds;
  }

  /**
   * Construct from env. Returns null when keys are missing - the
   * registry treats null as "provider unavailable" and skips it.
   */
  static fromEnv(): BookingComProvider | null {
    const affiliateId = process.env.BOOKING_COM_AFFILIATE_ID;
    const apiKey = process.env.BOOKING_COM_API_KEY;
    if (!affiliateId || !apiKey) return null;
    return new BookingComProvider({ affiliateId, apiKey });
  }

  protected async fetchStays(q: ProviderSearchQuery, ctx: ProviderContext): Promise<Stay[]> {
    const res = await searchBookingCom(q, this.creds, ctx.signal);
    if (!res) return [];
    return res.result.map((r) => mapBookingHotel(r, this.creds.affiliateId));
  }

  protected buildBadges(_q: ProviderSearchQuery, _stays: Stay[]): ProviderBadge[] {
    return [{ kind: 'preview', label: 'Live availability' }];
  }
}
