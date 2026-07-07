import { z } from 'zod';

/**
 * Normalized experience type used by every "Things to do" surface
 * across StayScout.
 *
 * This is the seam between live-inventory providers (Viator first,
 * GetYourGuide / Klook / Tiqets next) and our experience cards.
 * Whatever the source, the cards only ever see this shape:
 *
 *   Viator ProductSummary ──┐
 *                            ├── Experience ── card components
 *   GetYourGuide product ───┘
 *
 * Keep this PRESENTATIONAL: no provider-internal fields, no live
 * date/time slots (those live in Availability, fetched on demand
 * when the user picks a stay). The mapper is responsible for
 * extracting the shape below from the provider's native payload.
 *
 * NOT a widening of `Stay`. Stays and experiences have different
 * structural needs - experiences carry duration, group sizes,
 * confirmation timing, language, departure points; stays carry
 * room count, bathrooms, kitchens. Treating them as one type
 * would make every card branch on `kind`, which the UI design
 * doesn't want. Sibling types with sibling provider interfaces.
 */

// ============== Sub-types ==============

export const ExperiencePhotoSchema = z.object({
  /** Full URL to the image (provider-hosted CDN). */
  url: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Caption / alt text from the provider, if any. */
  alt: z.string().nullable(),
});
export type ExperiencePhoto = z.infer<typeof ExperiencePhotoSchema>;

export const ExperienceDurationSchema = z.object({
  /** Whether the duration is fixed, ranged, or unstructured. */
  kind: z.enum(['fixed', 'range', 'unstructured']),
  /** Minutes when kind = 'fixed'. */
  minutes: z.number().int().positive().nullable(),
  /** Lower bound minutes when kind = 'range'. */
  fromMinutes: z.number().int().positive().nullable(),
  /** Upper bound minutes when kind = 'range'. */
  toMinutes: z.number().int().positive().nullable(),
  /** Human label - "Multi-day", "3-5 days", etc. - when kind = 'unstructured'. */
  label: z.string().nullable(),
});
export type ExperienceDuration = z.infer<typeof ExperienceDurationSchema>;

export const ExperiencePricingSchema = z.object({
  /** Lowest price per person in `currency`. */
  fromPerPerson: z.number().nonnegative(),
  /** Price before any discount, when the provider exposes one. */
  fromPerPersonBeforeDiscount: z.number().nonnegative().nullable(),
  /** ISO 4217 currency code ("USD", "EUR", "GBP"). */
  currency: z.string().length(3),
});
export type ExperiencePricing = z.infer<typeof ExperiencePricingSchema>;

export const ExperienceReviewsSchema = z.object({
  /** Combined average rating, typically 0-5. */
  averageRating: z.number().min(0).max(5).nullable(),
  /** Total review count across all sources. */
  total: z.number().int().nonnegative(),
});
export type ExperienceReviews = z.infer<typeof ExperienceReviewsSchema>;

export const ExperienceLocationSchema = z.object({
  /** Free-text destination name ("Tokyo", "Cinque Terre"). */
  destination: z.string(),
  /** Provider-native destination id when available. */
  destinationRef: z.string().nullable(),
  /** ISO-3166-1 alpha-2 country code when the mapper can determine it. */
  country: z.string().length(2).nullable(),
});
export type ExperienceLocation = z.infer<typeof ExperienceLocationSchema>;

/**
 * Provider-attached affiliate link. Already includes the campaign
 * tracking parameter; the redirect handler must hand this URL out
 * unmodified or the partner won't be paid.
 */
export const ExperienceAffiliateSchema = z.object({
  providerId: z.string(),
  /** The exact URL the partner returned. Pass through unchanged. */
  url: z.string(),
  /** Stable id for click attribution in the StayScout side. */
  stayId: z.string(),
});
export type ExperienceAffiliate = z.infer<typeof ExperienceAffiliateSchema>;

/**
 * Trust flags lifted from the provider response. Used to badge cards
 * and to filter rails (e.g. "Free cancellation only").
 */
export const ExperienceFlagSchema = z.enum([
  'new-on-platform',
  'free-cancellation',
  'skip-the-line',
  'private-tour',
  'special-offer',
  'likely-to-sell-out',
]);
export type ExperienceFlag = z.infer<typeof ExperienceFlagSchema>;

// ============== Experience ==============

export const ExperienceSchema = z.object({
  /** Stable id - typically `${providerId}:${productCode}`. */
  id: z.string(),
  /** The product code as returned by the provider (also used for
   *  detail/availability lookups). */
  productCode: z.string(),
  /** Display title. */
  title: z.string(),
  /** Short marketing description trimmed to one or two sentences
   *  for use in card pitch slots. The mapper is responsible for
   *  truncation so cards never have to know about it. */
  summary: z.string(),
  /** Where the experience runs. */
  location: ExperienceLocationSchema,
  /** Cover photo + a small set of secondary photos. */
  photos: z.array(ExperiencePhotoSchema),
  duration: ExperienceDurationSchema,
  pricing: ExperiencePricingSchema,
  reviews: ExperienceReviewsSchema,
  /** Trust badges. Unordered, deduped. */
  flags: z.array(ExperienceFlagSchema),
  /** Confirmation type: 'instant' or 'on-request'. */
  confirmation: z.enum(['instant', 'on-request']).nullable(),
  /** Free-text taxonomy from the provider, e.g. ["Tours", "Day
   *  trips", "Outdoor"]. Used for editorial themed rails. */
  tags: z.array(z.string()),
  affiliate: ExperienceAffiliateSchema,
});
export type Experience = z.infer<typeof ExperienceSchema>;

// ============== Helpers ==============

/** Pick a photo at-or-near the requested width from an experience's
 *  variants. Returns the highest-resolution photo when none meet the
 *  target, and null when there are no photos at all. */
export function pickExperiencePhoto(
  photos: readonly ExperiencePhoto[],
  desiredWidth: number,
): ExperiencePhoto | null {
  if (photos.length === 0) return null;
  // Prefer the smallest photo wider than `desiredWidth` (sharpest
  // delivery without over-fetching); fall back to the widest we have.
  const sorted = [...photos].sort((a, b) => a.width - b.width);
  for (const p of sorted) {
    if (p.width >= desiredWidth) return p;
  }
  return sorted.at(-1) ?? null;
}

/** Friendly duration label for cards. */
export function formatExperienceDuration(d: ExperienceDuration): string {
  if (d.kind === 'unstructured') return d.label ?? '';
  if (d.kind === 'fixed' && d.minutes !== null) return formatMinutes(d.minutes);
  if (d.kind === 'range' && d.fromMinutes !== null && d.toMinutes !== null) {
    const a = formatMinutes(d.fromMinutes);
    const b = formatMinutes(d.toMinutes);
    return a === b ? a : `${a} to ${b}`;
  }
  return '';
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
