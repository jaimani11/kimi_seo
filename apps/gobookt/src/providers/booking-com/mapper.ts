import { providerId, stayId } from '@core/ids';
import type { Stay, StayPhoto } from '@core/stay';
import type { BookingComHotel } from './types';

const PROVIDER_ID = providerId('booking-com');
const REDIRECT_BASE = 'https://www.booking.com/hotel/redirect.html';

/**
 * Convert a Booking.com hotel record to our Stay shape. Affiliate URL
 * is built here so the redirect handler in /api/go can hand off cleanly
 * - the URL bakes in the affiliate id required for commission tracking.
 */
export function mapBookingHotel(raw: BookingComHotel, affiliateId: string): Stay {
  const nativeId = String(raw.hotel_id);
  return {
    id: stayId(`booking-com:${nativeId}`),
    providerId: PROVIDER_ID,
    name: raw.hotel_name,
    type: mapAccommodationType(raw.accommodation_type_name),
    location: {
      country: raw.country_code.toUpperCase(),
      ...(raw.city ? { locality: raw.city } : {}),
      ...(raw.district ? { neighborhood: raw.district } : {}),
      ...(typeof raw.latitude === 'number' && typeof raw.longitude === 'number'
        ? { coordinates: { lat: raw.latitude, lng: raw.longitude } }
        : {}),
    },
    description: raw.description?.trim() || `${raw.hotel_name} on Booking.com.`,
    photos: mapPhotos(raw),
    pricing: mapPricing(raw),
    amenities: [],
    capacity: { sleeps: raw.max_persons ?? 2 },
    ...(typeof raw.review_score === 'number'
      ? {
          rating: {
            score: raw.review_score, // 0..10 - keep their scale; UI normalizes.
            reviewCount: raw.review_nr ?? 0,
            source: 'booking',
          },
        }
      : {}),
    signals: { tags: [] },
    bookingLink: {
      url: buildAffiliateUrl(nativeId, affiliateId),
      type: 'redirect',
      attribution: {
        network: 'booking-com',
        deepLinkParams: { aid: affiliateId, hotel_id: nativeId },
      },
    },
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Map Booking.com's free-form `accommodation_type_name` to our enum.
 * Anything we don't recognize falls back to "hotel" - the safe default.
 */
function mapAccommodationType(label: string | undefined): Stay['type'] {
  if (!label) return 'hotel';
  const k = label.toLowerCase();
  if (k.includes('villa')) return 'villa';
  if (k.includes('apartment') || k.includes('apart')) return 'apartment';
  if (k.includes('farmhouse') || k.includes('farm stay')) return 'farmhouse';
  if (k.includes('agriturismo')) return 'agriturismo';
  if (k.includes('palazzo')) return 'palazzo';
  if (k.includes('guesthouse') || k.includes('guest house') || k.includes('b&b'))
    return 'guesthouse';
  return 'hotel';
}

function mapPhotos(raw: BookingComHotel): StayPhoto[] {
  const photos: StayPhoto[] = [];
  if (raw.main_photo_url) {
    photos.push({
      url: raw.main_photo_url,
      source: 'booking',
      alt: raw.hotel_name,
      credit: 'Booking.com',
    });
  }
  if (raw.photos) {
    for (const p of raw.photos) {
      const url = p.url_original ?? p.url_max300;
      if (!url) continue;
      photos.push({ url, source: 'booking', alt: raw.hotel_name, credit: 'Booking.com' });
    }
  }
  return photos;
}

function mapPricing(raw: BookingComHotel): Stay['pricing'] {
  const currency = raw.currency_code ?? raw.price_breakdown?.currency ?? 'EUR';
  const total = raw.price_breakdown?.gross_amount ?? raw.min_total_price;
  // Without a date range we can't divide-into-nights reliably; surface
  // the per-stay total as per-night and let the proposal builder
  // recompute when nights are known.
  const amount = total ?? 0;
  return {
    pricePerNight: { amount, currency },
  };
}

function buildAffiliateUrl(hotelId: string, affiliateId: string): string {
  const params = new URLSearchParams({
    aid: affiliateId,
    hotel_id: hotelId,
    label: 'gobookt',
  });
  return `${REDIRECT_BASE}?${params.toString()}`;
}
