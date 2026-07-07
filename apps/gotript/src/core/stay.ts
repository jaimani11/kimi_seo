import { z } from 'zod';
import { VibeTagSchema } from './trip-intent';
import type { ProviderId, StayId } from './ids';

// ============== Stay sub-types ==============
export const StayLocationSchema = z.object({
  country: z.string().length(2),
  region: z.string().optional(),
  locality: z.string().optional(),
  neighborhood: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
});
export type StayLocation = z.infer<typeof StayLocationSchema>;

export const StayPhotoSchema = z.object({
  url: z.string().url(),
  source: z.enum(['unsplash', 'curated', 'expedia', 'vrbo', 'booking', 'other']),
  credit: z.string().optional(),
  license: z.string().optional(),
  alt: z.string(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});
export type StayPhoto = z.infer<typeof StayPhotoSchema>;

export const StayPricingSchema = z.object({
  pricePerNight: z.object({ amount: z.number(), currency: z.string().length(3) }),
  totalForStay: z
    .object({
      amount: z.number(),
      currency: z.string().length(3),
      nights: z.number().int(),
    })
    .optional(),
  fees: z
    .object({
      cleaning: z.number().optional(),
      service: z.number().optional(),
    })
    .optional(),
  cancellation: z.enum(['free', 'partial', 'non-refundable']).optional(),
});
export type StayPricing = z.infer<typeof StayPricingSchema>;

export const AmenitySchema = z.object({
  id: z.string(),
  label: z.string(),
});
export type Amenity = z.infer<typeof AmenitySchema>;

export const StaySignalsSchema = z.object({
  walkability: z.number().min(0).max(100).optional(),
  familyFit: z.number().min(0).max(100).optional(),
  remoteness: z.number().min(0).max(100).optional(),
  noise: z.number().min(0).max(100).optional(),
  tags: z.array(VibeTagSchema),
});
export type StaySignals = z.infer<typeof StaySignalsSchema>;

export const AffiliateAttributionSchema = z.object({
  network: z.string(),
  campaignId: z.string().optional(),
  deepLinkParams: z.record(z.string(), z.string()).optional(),
});
export type AffiliateAttribution = z.infer<typeof AffiliateAttributionSchema>;

export const BookingLinkSchema = z.object({
  url: z.string().url(),
  type: z.enum(['redirect', 'autonomous']),
  attribution: AffiliateAttributionSchema.optional(),
});
export type BookingLink = z.infer<typeof BookingLinkSchema>;

// ============== Stay (the umbrella) ==============
// id is namespaced as `${providerId}:${nativeId}` (validated softly via regex)
export const StaySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+:[A-Za-z0-9-_.]+$/),
  providerId: z.string(),
  name: z.string(),
  type: z.enum([
    'hotel',
    'villa',
    'apartment',
    'farmhouse',
    'agriturismo',
    'palazzo',
    'guesthouse',
  ]),
  location: StayLocationSchema,
  description: z.string(),
  photos: z.array(StayPhotoSchema),
  pricing: StayPricingSchema,
  amenities: z.array(AmenitySchema),
  capacity: z.object({
    sleeps: z.number().int().min(1),
    bedrooms: z.number().int().optional(),
    bathrooms: z.number().int().optional(),
  }),
  rating: z
    .object({
      score: z.number(),
      reviewCount: z.number().int(),
      source: z.string().optional(),
    })
    .optional(),
  signals: StaySignalsSchema,
  bookingLink: BookingLinkSchema,
  fetchedAt: z.string(),
});
// Branded TS type for Stay.id (the schema returns plain string; callers
// cast via `stayId()` / `providerId()` helpers from ids.ts when constructing).
export type Stay = Omit<z.infer<typeof StaySchema>, 'id' | 'providerId'> & {
  id: StayId;
  providerId: ProviderId;
};
