import { z } from 'zod';

/**
 * Booking.com Demand API response shape (subset). Modeled after the
 * public docs; we only validate fields we actually map. Extra fields
 * pass through Zod's default behavior (stripped on parse).
 *
 * Real-world responses are more verbose; this is what we need to build
 * a Stay from. New fields (cancellation policy, etc.) added as needed.
 */
export const BookingComHotelSchema = z.object({
  hotel_id: z.union([z.number(), z.string()]),
  hotel_name: z.string(),
  city: z.string().optional(),
  district: z.string().optional(),
  country_code: z.string().length(2),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hotel_class: z.number().optional(), // 0..5
  review_score: z.number().optional(), // 0..10 in their scale
  review_nr: z.number().int().optional(),
  description: z.string().optional(),
  // Photos - primary image url + an optional gallery.
  main_photo_url: z.string().url().optional(),
  photos: z
    .array(
      z.object({
        url_max300: z.string().url().optional(),
        url_original: z.string().url().optional(),
      }),
    )
    .optional(),
  // Pricing - per-night (if dates supplied) or "from" rate.
  min_total_price: z.number().optional(),
  price_breakdown: z
    .object({
      gross_amount: z.number().optional(),
      currency: z.string().length(3).optional(),
    })
    .optional(),
  currency_code: z.string().length(3).optional(),
  // Capacity hints - Booking.com surfaces these on the room object,
  // but the search-level summary often includes "max_persons" too.
  max_persons: z.number().int().optional(),
  // Property type ("Hotel", "Villa", ...). We map to our enum.
  accommodation_type_name: z.string().optional(),
});
export type BookingComHotel = z.infer<typeof BookingComHotelSchema>;

export const BookingComSearchResponseSchema = z.object({
  result: z.array(BookingComHotelSchema),
});
export type BookingComSearchResponse = z.infer<typeof BookingComSearchResponseSchema>;
