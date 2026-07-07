import { z } from 'zod';

// Future-additive trust seams (spec §7 + §8.13). Slice A leaves all
// these empty/optional; Slice B+ populates them from real provider data.

export const TrustAnnotationSchema = z.object({
  label: z.string(), // "Excellent for families"
  evidence: z.enum(['reviews', 'bookings', 'amenities', 'location', 'curated']),
  confidence: z.number().min(0).max(1),
  sourceCount: z.number().int().optional(),
});
export type TrustAnnotation = z.infer<typeof TrustAnnotationSchema>;

export const DataQualitySchema = z.object({
  completeness: z.number().min(0).max(1),
  reviewQuality: z.enum(['rich', 'sparse', 'unverified']),
  priceConsistency: z.enum(['fresh', 'recent', 'stale']),
  amenityVerification: z.enum(['verified', 'self-reported', 'unknown']),
});
export type DataQuality = z.infer<typeof DataQualitySchema>;

export const ProviderAdvantageSchema = z.object({
  kind: z.enum(['best-price', 'most-flexible-cancellation', 'best-availability', 'best-rating']),
  vsProviderId: z.string().optional(),
  delta: z.string().optional(), // "12% cheaper", "3 free-cancel days"
});
export type ProviderAdvantage = z.infer<typeof ProviderAdvantageSchema>;

export const FreshnessInfoSchema = z.object({
  fetchedAt: z.string(),
  dataMaxAgeMs: z.number().int(),
  priceMaxAgeMs: z.number().int().optional(),
  source: z.enum(['live', 'cached', 'synthesized']),
});
export type FreshnessInfo = z.infer<typeof FreshnessInfoSchema>;
