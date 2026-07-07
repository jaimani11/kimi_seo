import { z } from 'zod';

/**
 * Expedia EPS Rapid response shape (subset). Modeled after the public
 * docs (Property Search v3). We only validate fields we actually map;
 * extras pass through Zod's default behavior (stripped on parse).
 */

export const ExpediaPropertySchema = z.object({
  property_id: z.string(),
  name: z.string(),
  address: z
    .object({
      country_code: z.string().length(2),
      city: z.string().optional(),
      state_province_name: z.string().optional(),
      neighborhood_name: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      coordinates: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
    })
    .optional(),
  category: z
    .object({
      id: z.string().optional(), // "1" hotel, "16" villa, etc.
      name: z.string().optional(),
    })
    .optional(),
  rank: z.number().optional(),
  star_rating: z.string().optional(), // "4.0"
  guest_rating: z
    .object({
      overall: z.number().optional(), // 0..10 in their scale
      total_reviews: z.number().int().optional(),
    })
    .optional(),
  description: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url().optional(),
        caption: z.string().optional(),
      }),
    )
    .optional(),
  rates: z
    .array(
      z.object({
        totals: z
          .object({
            inclusive: z
              .object({
                billable_currency: z
                  .object({
                    value: z.string(), // numeric string
                    currency: z.string().length(3),
                  })
                  .optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
  max_occupancy: z.number().int().optional(),
});
export type ExpediaProperty = z.infer<typeof ExpediaPropertySchema>;

export const ExpediaSearchResponseSchema = z.object({
  properties: z.array(ExpediaPropertySchema),
});
export type ExpediaSearchResponse = z.infer<typeof ExpediaSearchResponseSchema>;
