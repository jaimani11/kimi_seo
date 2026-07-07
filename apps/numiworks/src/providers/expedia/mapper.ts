import { providerId, stayId } from '@core/ids';
import type { Stay, StayPhoto } from '@core/stay';
import type { ExpediaProperty } from './types';

const PROVIDER_ID = providerId('expedia');
const REDIRECT_BASE = 'https://www.expedia.com/affiliate/redirect';

/**
 * Convert an Expedia property record to our Stay shape. Mirrors
 * Booking.com's mapper file-for-file by design - the value of B5's
 * abstraction is proven by reuse.
 */
export function mapExpediaProperty(raw: ExpediaProperty, apiKey: string): Stay {
  return {
    id: stayId(`expedia:${raw.property_id}`),
    providerId: PROVIDER_ID,
    name: raw.name,
    type: mapCategoryToType(raw.category?.name ?? raw.category?.id),
    location: {
      country: (raw.address?.country_code ?? 'US').toUpperCase(),
      ...(raw.address?.city ? { locality: raw.address.city } : {}),
      ...(raw.address?.state_province_name ? { region: raw.address.state_province_name } : {}),
      ...(raw.address?.neighborhood_name ? { neighborhood: raw.address.neighborhood_name } : {}),
      ...(raw.location?.coordinates
        ? {
            coordinates: {
              lat: raw.location.coordinates.latitude,
              lng: raw.location.coordinates.longitude,
            },
          }
        : {}),
    },
    description: raw.description?.trim() || `${raw.name} on Expedia.`,
    photos: mapPhotos(raw),
    pricing: mapPricing(raw),
    amenities: [],
    capacity: { sleeps: raw.max_occupancy ?? 2 },
    ...(typeof raw.guest_rating?.overall === 'number'
      ? {
          rating: {
            score: raw.guest_rating.overall, // 0..10 scale
            reviewCount: raw.guest_rating.total_reviews ?? 0,
            source: 'expedia',
          },
        }
      : {}),
    signals: { tags: [] },
    bookingLink: {
      url: buildAffiliateUrl(raw.property_id, apiKey),
      type: 'redirect',
      attribution: {
        network: 'expedia',
        deepLinkParams: { aid: apiKey, property_id: raw.property_id },
      },
    },
    fetchedAt: new Date().toISOString(),
  };
}

function mapCategoryToType(label: string | undefined): Stay['type'] {
  if (!label) return 'hotel';
  const k = label.toLowerCase();
  if (k.includes('villa')) return 'villa';
  if (k.includes('apartment') || k.includes('apart')) return 'apartment';
  if (k.includes('farmhouse') || k.includes('farm stay')) return 'farmhouse';
  if (k.includes('agriturismo')) return 'agriturismo';
  if (k.includes('palazzo')) return 'palazzo';
  if (
    k.includes('guesthouse') ||
    k.includes('guest house') ||
    k.includes('b&b') ||
    k.includes('bed & breakfast') ||
    k.includes('bed and breakfast')
  ) {
    return 'guesthouse';
  }
  return 'hotel';
}

function mapPhotos(raw: ExpediaProperty): StayPhoto[] {
  if (!raw.images) return [];
  const photos: StayPhoto[] = [];
  for (const img of raw.images) {
    if (!img.url) continue;
    photos.push({
      url: img.url,
      source: 'expedia',
      alt: img.caption ?? raw.name,
      credit: 'Expedia',
    });
  }
  return photos;
}

function mapPricing(raw: ExpediaProperty): Stay['pricing'] {
  const billable = raw.rates?.[0]?.totals?.inclusive?.billable_currency;
  const amount = billable ? Number.parseFloat(billable.value) : 0;
  const currency = billable?.currency ?? 'USD';
  return {
    pricePerNight: { amount: Number.isFinite(amount) ? amount : 0, currency },
  };
}

function buildAffiliateUrl(propertyId: string, apiKey: string): string {
  const params = new URLSearchParams({
    aid: apiKey,
    property_id: propertyId,
    label: 'numiworks',
  });
  return `${REDIRECT_BASE}?${params.toString()}`;
}
