import { z } from 'zod';
import type { Stay } from '@core/stay';
import { providerId, stayId } from '@core/ids';
import { VibeTagSchema } from '@core/trip-intent';
import { unsplashPhoto } from '../_shared/photo';
import { resolvePhotoId } from './photo-resolver';

// The slim shape we ask Claude to emit.
export const PhotoCategorySchema = z.enum([
  'cityscape',
  'beach',
  'mountains',
  'countryside',
  'forest',
  'lakeside',
  'island',
  'historic-architecture',
  'desert',
]);
export type PhotoCategory = z.infer<typeof PhotoCategorySchema>;

export const LLMStaySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
  type: z.enum([
    'hotel',
    'villa',
    'apartment',
    'farmhouse',
    'agriturismo',
    'palazzo',
    'guesthouse',
  ]),
  location: z.object({
    country: z.string().length(2),
    region: z.string().optional(),
    locality: z.string().optional(),
    neighborhood: z.string().optional(),
  }),
  description: z.string().min(40).max(280),
  // Raised from 3000 to 25000 to accommodate luxury markets (Tokyo,
  // Singapore, NYC, London, Paris). At 3000 the model's perfectly
  // reasonable Tokyo luxury stays (Aman, Mandarin, Park Hyatt) were
  // all rejected and the user saw "Couldn't find anything that fits"
  // for prompts like "Tokyo for a long weekend." 25000 is generous
  // enough for any real-world stay while still rejecting hallucinated
  // outliers ($999,999/night). The coercer additionally clamps so
  // an over-cap value doesn't drop the entire stay.
  pricePerNight: z.number().int().min(40).max(25000),
  currency: z.string().length(3),
  amenities: z.array(z.string().min(2)).min(1).max(8),
  capacity: z.object({
    sleeps: z.number().int().min(1).max(16),
    bedrooms: z.number().int().min(1).max(8).optional(),
    bathrooms: z.number().int().min(1).max(8).optional(),
  }),
  vibe: z.array(VibeTagSchema).min(1).max(6),
  walkability: z.number().int().min(0).max(100).optional(),
  familyFit: z.number().int().min(0).max(100).optional(),
  remoteness: z.number().int().min(0).max(100).optional(),
  noise: z.number().int().min(0).max(100).optional(),
  photoCategory: PhotoCategorySchema,
});
export type LLMStay = z.infer<typeof LLMStaySchema>;

export const LLMStayBatchSchema = z.object({
  stays: z.array(LLMStaySchema).min(2).max(6),
});

const VALID_VIBE_TAGS = new Set(VibeTagSchema.options);

// Schema bounds for pricePerNight, mirrored here so the coercer can
// clamp before strict parse. Update both together if either changes.
const PRICE_PER_NIGHT_MIN = 40;
const PRICE_PER_NIGHT_MAX = 25000;

/**
 * Coerce model output before strict Zod parse.
 *
 * Three observed deviations from our schema we tolerate by coercing
 * rather than dropping the whole batch:
 *
 *   1. Vibe tags outside our closed taxonomy ("countryside",
 *      "lakeside") - filter them out per-stay; preserve at least one
 *      tag so the `min(1)` constraint still holds.
 *
 *   2. Prices below the floor - clamp up to the floor rather than
 *      drop. Edge cases like ultra-budget hostels still surface as
 *      something the user can see; a $20 number that's just a model
 *      slip becomes a $40 floor.
 *
 *   3. Prices above the ceiling - clamp down to the ceiling rather
 *      than drop. Hallucinated $999,999 values become a sane $25K
 *      luxury cap. Real luxury markets (Tokyo, Singapore, NYC) can
 *      legitimately produce $5K–$15K stays which are now allowed.
 *
 * Without (3), a "Tokyo for a long weekend" prompt would get the
 * model returning four perfectly reasonable luxury hotels at
 * $4–8K/night, all rejected by the old `.max(3000)`, the entire
 * batch fails parse, and the user sees "Couldn't find anything that
 * fits" for a prompt that should have worked.
 */
export function coerceLlmStayBatch(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  const stays = obj.stays;
  if (!Array.isArray(stays)) return raw;
  const fixedStays = stays.map((s) => {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return s;
    const stay = { ...(s as Record<string, unknown>) };
    // (1) Vibe taxonomy
    if (Array.isArray(stay.vibe)) {
      const filtered = (stay.vibe as unknown[]).filter(
        (tag): tag is string => typeof tag === 'string' && VALID_VIBE_TAGS.has(tag as never),
      );
      stay.vibe = filtered.length > 0 ? filtered : ['cultural'];
    }
    // (2) + (3) Price clamping
    if (typeof stay.pricePerNight === 'number' && Number.isFinite(stay.pricePerNight)) {
      const clamped = Math.round(
        Math.min(PRICE_PER_NIGHT_MAX, Math.max(PRICE_PER_NIGHT_MIN, stay.pricePerNight)),
      );
      stay.pricePerNight = clamped;
    }
    return stay;
  });
  return { ...obj, stays: fixedStays };
}

/**
 * Map a slim LLMStay to a fully canonical Stay. We mint the namespaced id,
 * attach a category-matched Unsplash photo, set a placeholder booking
 * redirect, and timestamp the record.
 */
export function mapLLMStayToStay(llm: LLMStay): Stay {
  const ns = `llm-synthesized:${llm.slug}`;
  // Slug-driven photo selection so a four-up batch of cityscape stays
  // doesn't render the same Unsplash url four times.
  const photoId = resolvePhotoId(llm.photoCategory, llm.slug);
  return {
    id: stayId(ns),
    providerId: providerId('llm-synthesized'),
    name: llm.name,
    type: llm.type,
    location: llm.location,
    description: llm.description,
    photos: [
      unsplashPhoto({
        id: photoId,
        alt: `${llm.name} - ${llm.photoCategory}`,
        credit: 'Unsplash',
      }),
    ],
    pricing: {
      pricePerNight: { amount: llm.pricePerNight, currency: llm.currency },
      cancellation: 'free',
    },
    amenities: llm.amenities.map((label, i) => ({
      id: `${llm.slug}-amenity-${i}`,
      label,
    })),
    capacity: {
      sleeps: llm.capacity.sleeps,
      ...(llm.capacity.bedrooms !== undefined ? { bedrooms: llm.capacity.bedrooms } : {}),
      ...(llm.capacity.bathrooms !== undefined ? { bathrooms: llm.capacity.bathrooms } : {}),
    },
    signals: {
      ...(llm.walkability !== undefined ? { walkability: llm.walkability } : {}),
      ...(llm.familyFit !== undefined ? { familyFit: llm.familyFit } : {}),
      ...(llm.remoteness !== undefined ? { remoteness: llm.remoteness } : {}),
      ...(llm.noise !== undefined ? { noise: llm.noise } : {}),
      tags: llm.vibe,
    },
    bookingLink: {
      url: `https://example.com/redirect?provider=llm-synthesized&id=${llm.slug}`,
      type: 'redirect',
    },
    fetchedAt: new Date().toISOString(),
  };
}
