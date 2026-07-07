import { providerId, stayId } from '@core/ids';
import type { Stay, StayPhoto } from '@core/stay';
import type { VrboProperty } from './types';

const PROVIDER_ID = providerId('vrbo');

/**
 * Vrbo affiliate redirect base. The Vrbo deeplink format accepts:
 *   https://www.vrbo.com/<property_id>?affiliateId=<aid>&utm_source=<aid>
 *
 * Affiliate-id formats vary by partner program; we propagate `aid`
 * from the Rapid api key by default. Operators with a separate Vrbo
 * Affiliate Program id can override via `VRBO_AFFILIATE_ID` env (read
 * by `VrboProvider.fromEnv()`).
 */
const REDIRECT_BASE = 'https://www.vrbo.com';

/**
 * Convert a Vrbo (Rapid) property record into our Stay shape.
 *
 * Differs from the Expedia mapper in two ways:
 *   1. `providerId` is `vrbo` (drives the provenance chip + analytics).
 *   2. The default `Stay.type` falls back to `'villa'` rather than
 *      `'hotel'` because Vrbo's catalog is vacation rentals; if the
 *      Rapid category id maps to a more specific shape we honor it.
 */
export function mapVrboProperty(raw: VrboProperty, affiliateId: string): Stay {
  return {
    id: stayId(`vrbo:${raw.property_id}`),
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
    description: raw.description?.trim() || `${raw.name} on Vrbo.`,
    photos: mapPhotos(raw),
    pricing: mapPricing(raw),
    amenities: [],
    capacity: { sleeps: raw.max_occupancy ?? 4 },
    ...(typeof raw.guest_rating?.overall === 'number'
      ? {
          rating: {
            score: raw.guest_rating.overall,
            reviewCount: raw.guest_rating.total_reviews ?? 0,
            source: 'vrbo',
          },
        }
      : {}),
    signals: { tags: [] },
    bookingLink: {
      url: buildAffiliateUrl(raw.property_id, affiliateId),
      type: 'redirect',
      attribution: {
        network: 'vrbo',
        deepLinkParams: { affiliateId, property_id: raw.property_id },
      },
    },
    fetchedAt: new Date().toISOString(),
  };
}

function mapCategoryToType(label: string | undefined): Stay['type'] {
  if (!label) return 'villa'; // vacation-rental default
  const k = String(label).toLowerCase();
  // Rapid sometimes returns the numeric id ("16") and sometimes the
  // human-readable name ("Vacation rental"). Handle both.
  if (k === '37' || k.includes('villa')) return 'villa';
  if (k === '8' || k.includes('cottage')) return 'farmhouse'; // closest in our enum
  if (k === '22' || k.includes('cabin')) return 'farmhouse';
  if (k === '35' || k.includes('guest house') || k.includes('guesthouse')) return 'guesthouse';
  if (k === '19' || k.includes('private vacation home')) return 'villa';
  if (k.includes('apartment') || k.includes('apart')) return 'apartment';
  return 'villa';
}

function mapPhotos(raw: VrboProperty): StayPhoto[] {
  if (!raw.images) return [];
  const photos: StayPhoto[] = [];
  for (const img of raw.images) {
    if (!img.url) continue;
    photos.push({
      url: img.url,
      source: 'vrbo',
      alt: img.caption ?? raw.name,
      credit: 'Vrbo',
    });
  }
  return photos;
}

function mapPricing(raw: VrboProperty): Stay['pricing'] {
  const billable = raw.rates?.[0]?.totals?.inclusive?.billable_currency;
  const amount = billable ? Number.parseFloat(billable.value) : 0;
  const currency = billable?.currency ?? 'USD';
  return {
    pricePerNight: { amount: Number.isFinite(amount) ? amount : 0, currency },
  };
}

function buildAffiliateUrl(propertyId: string, affiliateId: string): string {
  const params = new URLSearchParams({
    affiliateId,
    utm_source: affiliateId,
    label: 'stayviaowner',
  });
  return `${REDIRECT_BASE}/${encodeURIComponent(propertyId)}?${params.toString()}`;
}
