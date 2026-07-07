import { z } from 'zod';

// ============== VibeTag - closed taxonomy ==============
// A closed string union so the Intent Agent can't drift into freeform tag
// soup. Spec §3.1; future enrichment (pace, luxury tolerance, etc.) lands
// as additional optional fields on TripIntent, not by widening this union.
export const VibeTagSchema = z.enum([
  'luxury',
  'budget',
  'mid-range',
  'walkable',
  'remote',
  'urban',
  'romantic',
  'family-friendly',
  'group',
  'foodie',
  'cultural',
  'nature',
  'adventure',
  'slow',
  'fast-paced',
  'avoid-tourist-traps',
  'iconic-landmarks',
  'wellness',
  'beach',
  'mountains',
]);
export type VibeTag = z.infer<typeof VibeTagSchema>;

// ============== Destinations ==============
export const GeoCoordsSchema = z.object({ lat: z.number(), lng: z.number() });
export type GeoCoords = z.infer<typeof GeoCoordsSchema>;

export const DestinationSchema = z.object({
  kind: z.enum(['curated', 'synthesized']),
  name: z.string(),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  region: z.string().optional(),
  coordinates: GeoCoordsSchema.optional(),
});
export type Destination = z.infer<typeof DestinationSchema>;

// ============== TripDates (discriminated) ==============
export const TripDatesSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('specific'), start: z.string(), end: z.string() }),
  z.object({
    kind: z.literal('flexible-month'),
    month: z.string(),
    year: z.number().int(),
  }),
  z.object({
    kind: z.literal('flexible-season'),
    season: z.enum(['spring', 'summer', 'fall', 'winter']),
    year: z.number().int(),
  }),
  z.object({ kind: z.literal('unspecified') }),
]);
export type TripDates = z.infer<typeof TripDatesSchema>;

// ============== Travelers ==============
export const TravelerCompositionSchema = z.object({
  adults: z.number().int().min(0),
  children: z.object({
    count: z.number().int().min(0),
    ages: z.array(z.number().int().min(0)).optional(),
  }),
  infants: z.number().int().min(0),
  groupKind: z.enum(['family', 'couple', 'friends', 'solo', 'business']).optional(),
});
export type TravelerComposition = z.infer<typeof TravelerCompositionSchema>;

// ============== Budget ==============
export const BudgetFlexibilitySchema = z.enum(['firm', 'flexible', 'open']);
export type BudgetFlexibility = z.infer<typeof BudgetFlexibilitySchema>;

export const BudgetIntentSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('total'),
    amount: z.number(),
    currency: z.string().length(3),
    flexibility: BudgetFlexibilitySchema,
  }),
  z.object({
    kind: z.literal('per-night'),
    amount: z.number(),
    currency: z.string().length(3),
    flexibility: BudgetFlexibilitySchema,
  }),
  z.object({ kind: z.literal('unspecified') }),
]);
export type BudgetIntent = z.infer<typeof BudgetIntentSchema>;

// ============== Preferences ==============
export const TripPreferencesSchema = z.object({
  amenities: z.array(z.string()),
  avoid: z.array(z.string()),
  transportation: z
    .enum(['walking-priority', 'rental-car', 'public-transit', 'no-preference'])
    .optional(),
  accessibility: z.array(z.string()).optional(),
});
export type TripPreferences = z.infer<typeof TripPreferencesSchema>;

// ============== TripIntent (the umbrella) ==============
export const TripIntentSchema = z.object({
  destinations: z.array(DestinationSchema),
  dates: TripDatesSchema,
  duration: z.object({ nights: z.number().int().min(0), flexible: z.boolean() }),
  travelers: TravelerCompositionSchema,
  budget: BudgetIntentSchema,
  vibe: z.object({ tags: z.array(VibeTagSchema) }),
  preferences: TripPreferencesSchema,
  caveats: z.array(z.string()),
  rawInput: z.string(),
  confidence: z.record(z.string(), z.number().min(0).max(1)).optional(),
});
export type TripIntent = z.infer<typeof TripIntentSchema>;
