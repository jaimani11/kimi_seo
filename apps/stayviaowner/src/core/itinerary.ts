import { z } from 'zod';

/**
 * Itinerary types - Slice C3. The day-by-day plan for a saved trip.
 *
 * Editorial, not transactional: slots are descriptive ("a slow walk
 * from the Boboli Garden") rather than rigid bookings. C3.x layers
 * Viator activity search to add bookable items to specific slots; the
 * editorial frame stays.
 *
 * Owner attribution flows through `tripId` → the underlying SavedTrip
 * (B1). The page route (`/trips/[tripId]/itinerary`) confirms
 * ownership before rendering.
 */

export const ItinerarySlotKindSchema = z.enum(['activity', 'meal', 'transit', 'rest']);
export type ItinerarySlotKind = z.infer<typeof ItinerarySlotKindSchema>;

export const ItineraryStartHintSchema = z.enum([
  'morning',
  'midday',
  'afternoon',
  'evening',
  'late',
]);
export type ItineraryStartHint = z.infer<typeof ItineraryStartHintSchema>;

export const CostTierSchema = z.enum(['free', 'low', 'mid', 'high']);
export type CostTier = z.infer<typeof CostTierSchema>;

export const ItinerarySlotLocationSchema = z.object({
  name: z.string().min(1).max(120),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
});
export type ItinerarySlotLocation = z.infer<typeof ItinerarySlotLocationSchema>;

export const ItinerarySlotSchema = z.object({
  id: z.string().min(1),
  kind: ItinerarySlotKindSchema,
  startHint: ItineraryStartHintSchema,
  title: z.string().min(2).max(80),
  /** Italic-Fraunces description; voice rule (no banned words) is
   *  enforced by the curation lint test. ≤ 220 chars. */
  detail: z.string().min(8).max(220),
  durationMinutes: z.number().int().min(15).max(720).optional(),
  location: ItinerarySlotLocationSchema.optional(),
  costTier: CostTierSchema.optional(),
  tags: z.array(z.string().min(2).max(30)).max(5).optional(),
});
export type ItinerarySlot = z.infer<typeof ItinerarySlotSchema>;

export const ItineraryDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(14),
  /** Short Fraunces-italic theme. */
  theme: z.string().min(2).max(60),
  slots: z.array(ItinerarySlotSchema).min(3).max(8),
});
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;

export const ItinerarySchema = z.object({
  tripId: z.string().min(1),
  generatedAt: z.string(),
  /** Where the itinerary came from. C3 ships only `curated` +
   *  `synthesized`; C3.x adds `model` when ItineraryAgent runs live. */
  source: z.enum(['curated', 'synthesized', 'model']),
  /** Italic-Fraunces summary for the page header. ≤ 220 chars. */
  summary: z.string().min(8).max(220),
  days: z.array(ItineraryDaySchema).min(1).max(14),
});
export type Itinerary = z.infer<typeof ItinerarySchema>;
