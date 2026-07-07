import type { ProviderSearchQuery } from '@core/provider';
import { httpJson } from '../_shared/http';
import { BookingComSearchResponseSchema, type BookingComSearchResponse } from './types';

/**
 * Booking.com Demand API search client. Endpoint shape modeled after
 * the public Affiliate Partner Network. Real customers configure their
 * affiliate id at the API key level; we pass it on every request as a
 * query param + Bearer header for redundancy.
 *
 * Returns null when no results (404 from the API → null per httpJson's
 * convention) - caller treats that as "empty search," not "error."
 */

const ENDPOINT = 'https://distribution-xml.booking.com/3.1/json/getHotels';

export interface BookingComCredentials {
  affiliateId: string;
  apiKey: string;
}

export async function searchBookingCom(
  query: ProviderSearchQuery,
  creds: BookingComCredentials,
  signal: AbortSignal,
): Promise<BookingComSearchResponse | null> {
  const params = new URLSearchParams();
  // Geo: country code drives the search; specific city/region is
  // narrowed via additional params on real calls (`city_ids`, etc.) -
  // we'll add them in B5.x as we get real-API access for tuning.
  const dest = query.destinations[0];
  if (dest?.country) params.set('country', dest.country.toUpperCase());
  if (dest?.name) params.set('text', dest.name);

  // Date range - Booking.com expects YYYY-MM-DD.
  if (query.dates.kind === 'specific') {
    params.set('checkin', query.dates.start);
    params.set('checkout', query.dates.end);
  }

  // Travelers.
  params.set('adults', String(query.travelers.adults));
  if (query.travelers.children.count > 0) {
    params.set('children', String(query.travelers.children.count));
  }

  params.set('aid', creds.affiliateId);
  params.set('extras', 'addresses,description,room_types');
  params.set('rows', String(query.limit ?? 25));

  const url = `${ENDPOINT}?${params.toString()}`;
  const raw = await httpJson<unknown>(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${creds.apiKey}`,
      // Booking.com docs accept the affiliate id in either header or query.
      'x-affiliate-id': creds.affiliateId,
    },
    signal,
    providerId: 'booking-com',
  });

  if (raw === null) return null;
  const parsed = BookingComSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    // Soft-fail: we'd rather return empty + log than throw - the
    // orchestrator's degradation policy treats provider failures as
    // recoverable, but the user still sees no results from this
    // provider. Other providers in the fanout cover the gap.
    console.warn('[booking-com] response failed Zod validation:', parsed.error.issues.slice(0, 3));
    return { result: [] };
  }
  return parsed.data;
}
