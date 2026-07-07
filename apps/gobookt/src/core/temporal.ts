import { z } from 'zod';
import { TripDatesSchema } from './trip-intent';

// Populated in Slice B by WeatherAgent + EventEnrichmentAgent and passed
// into ProviderSearchQuery. Slice A providers ignore these fields.

export const WeatherSummarySchema = z.object({
  summary: z.string(), // "Mild, mid-70s, brief afternoon rain"
  avgTempC: z.number(),
  rainChance: z.number().min(0).max(1).optional(),
  season: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
});
export type WeatherSummary = z.infer<typeof WeatherSummarySchema>;

export const LocalEventSchema = z.object({
  name: z.string(),
  kind: z.enum(['festival', 'concert', 'sport', 'cultural', 'holiday', 'closure']),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  location: z.string().optional(),
  impact: z.enum(['positive', 'neutral', 'negative']).optional(),
});
export type LocalEvent = z.infer<typeof LocalEventSchema>;

export const TemporalContextSchema = z.object({
  dates: TripDatesSchema,
  seasonality: z
    .object({
      month: z.number().int().min(1).max(12),
      season: z.enum(['spring', 'summer', 'fall', 'winter']),
    })
    .optional(),
  localEvents: z.array(LocalEventSchema).optional(),
  weatherForecast: WeatherSummarySchema.optional(),
});
export type TemporalContext = z.infer<typeof TemporalContextSchema>;
