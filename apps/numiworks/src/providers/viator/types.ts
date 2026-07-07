import { z } from 'zod';

/**
 * Codified subsets of the Viator Partner API v2.0 shapes we actually
 * read. Full spec is at https://docs.viator.com/partner-api/technical/.
 *
 * We don't replicate the entire schema - Viator returns dozens of
 * fields per product and we only need ~10. Zod `.passthrough()` keeps
 * unknown fields visible during debugging while not failing parsing
 * when Viator adds new optional fields.
 *
 * If a field below is OPTIONAL in the spec, it's optional + nullable
 * here. The mapper handles missing data; the schema only fails if a
 * REQUIRED field is missing or wrong type, which would indicate a
 * breaking API change worth knowing about loudly.
 */

// ============== Request shapes ==============

/**
 * POST /search/freetext body. searchTypes is constrained to PRODUCTS
 * for the experience rails (we don't currently surface destinations
 * or attractions from this endpoint).
 */
export interface ViatorFreetextSearchRequest {
  searchTerm: string;
  currency: string;
  searchTypes: ReadonlyArray<{
    searchType: 'PRODUCTS' | 'DESTINATIONS' | 'ATTRACTIONS';
    pagination?: { start: number; count: number };
  }>;
  productFiltering?: {
    flags?: ReadonlyArray<
      | 'NEW_ON_VIATOR'
      | 'FREE_CANCELLATION'
      | 'SKIP_THE_LINE'
      | 'PRIVATE_TOUR'
      | 'SPECIAL_OFFER'
      | 'LIKELY_TO_SELL_OUT'
    >;
    rating?: { from?: number; to?: number };
    durationInMinutes?: { from?: number; to?: number };
    price?: { from?: number; to?: number };
  };
  productSorting?: {
    sort?: 'DEFAULT' | 'PRICE_LOW_TO_HIGH' | 'PRICE_HIGH_TO_LOW' | 'RATING' | 'REVIEW_AVG_RATING_REVERSED';
  };
}

// ============== Response shapes ==============

const ViatorImageVariantSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  url: z.string(),
});

const ViatorImageSchema = z
  .object({
    isCover: z.boolean(),
    caption: z.string().nullish(),
    variants: z.array(ViatorImageVariantSchema),
  })
  .passthrough();

const ViatorPricingSchema = z
  .object({
    currency: z.string().min(3).max(3),
    summary: z
      .object({
        fromPrice: z.number().nonnegative().nullish(),
        fromPriceBeforeDiscount: z.number().nonnegative().nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const ViatorReviewsSchema = z
  .object({
    totalReviews: z.number().int().nonnegative().nullish(),
    combinedAverageRating: z.number().nullish(),
  })
  .passthrough();

const ViatorDurationSchema = z
  .object({
    fixedDurationInMinutes: z.number().int().positive().nullish(),
    variableDurationFromMinutes: z.number().int().positive().nullish(),
    variableDurationToMinutes: z.number().int().positive().nullish(),
    unstructuredDuration: z.string().nullish(),
  })
  .passthrough();

const ViatorDestinationSchema = z
  .object({
    // OpenAPI spec types this as `integer` but the live API returns
    // it as a numeric string (e.g. `"23271"`). Accept either so a
    // future spec correction doesn't break us either way.
    ref: z.union([z.number().int(), z.string()]).nullish(),
    primary: z.boolean().nullish(),
  })
  .passthrough();

export const ViatorProductSummarySchema = z
  .object({
    productCode: z.string(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    productUrl: z.string().nullish(),
    images: z.array(ViatorImageSchema).nullish(),
    pricing: ViatorPricingSchema.nullish(),
    reviews: ViatorReviewsSchema.nullish(),
    duration: ViatorDurationSchema.nullish(),
    destinations: z.array(ViatorDestinationSchema).nullish(),
    tags: z.array(z.number().int()).nullish(),
    flags: z.array(z.string()).nullish(),
    confirmationType: z.string().nullish(),
    itineraryType: z.string().nullish(),
  })
  .passthrough();
export type ViatorProductSummary = z.infer<typeof ViatorProductSummarySchema>;

// ============== Product detail (GET /products/{product-code}) ==============

const ViatorInclusionExclusionSchema = z
  .object({
    category: z.string().nullish(),
    description: z.string().nullish(),
    type: z.string().nullish(),
    typeDescription: z.string().nullish(),
    otherDescription: z.string().nullish(),
  })
  .passthrough();

const ViatorAdditionalInfoSchema = z
  .object({
    type: z.string().nullish(),
    description: z.string().nullish(),
  })
  .passthrough();

const ViatorCancellationPolicySchema = z
  .object({
    type: z.string().nullish(),
    description: z.string().nullish(),
    cancelIfBadWeather: z.boolean().nullish(),
    cancelIfInsufficientTravelers: z.boolean().nullish(),
    refundEligibility: z
      .array(
        z
          .object({
            dayRangeMin: z.number().int().nullish(),
            dayRangeMax: z.number().int().nullish(),
            percentageRefundable: z.number().nullish(),
          })
          .passthrough(),
      )
      .nullish(),
  })
  .passthrough();

const ViatorPricingInfoSchema = z
  .object({
    type: z.string().nullish(),
    ageBands: z
      .array(
        z
          .object({
            ageBand: z.string().nullish(),
            startAge: z.number().int().nullish(),
            endAge: z.number().int().nullish(),
            minTravelersPerBooking: z.number().int().nullish(),
            maxTravelersPerBooking: z.number().int().nullish(),
          })
          .passthrough(),
      )
      .nullish(),
  })
  .passthrough();

/**
 * Subset of Viator's `ActiveProduct` schema that we actually consume on
 * the experience detail page. Passthrough so unknown fields don't fail
 * parsing; nullish on every leaf so a sparse response still maps cleanly.
 */
export const ViatorProductDetailSchema = z
  .object({
    productCode: z.string(),
    status: z.string().nullish(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    productUrl: z.string().nullish(),
    images: z.array(ViatorImageSchema).nullish(),
    reviews: ViatorReviewsSchema.nullish(),
    duration: ViatorDurationSchema.nullish(),
    destinations: z.array(ViatorDestinationSchema).nullish(),
    tags: z.array(z.number().int()).nullish(),
    flags: z.array(z.string()).nullish(),
    confirmationType: z.string().nullish(),
    itineraryType: z.string().nullish(),
    inclusions: z.array(ViatorInclusionExclusionSchema).nullish(),
    exclusions: z.array(ViatorInclusionExclusionSchema).nullish(),
    additionalInfo: z.array(ViatorAdditionalInfoSchema).nullish(),
    cancellationPolicy: ViatorCancellationPolicySchema.nullish(),
    pricingInfo: ViatorPricingInfoSchema.nullish(),
    supplier: z
      .object({
        name: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    timeZone: z.string().nullish(),
  })
  .passthrough();
export type ViatorProductDetail = z.infer<typeof ViatorProductDetailSchema>;

export const ViatorFreetextSearchResponseSchema = z
  .object({
    products: z
      .object({
        totalCount: z.number().int().nonnegative().nullish(),
        results: z.array(ViatorProductSummarySchema).nullish(),
      })
      .nullish(),
    destinations: z
      .object({
        totalCount: z.number().int().nonnegative().nullish(),
        results: z.array(z.unknown()).nullish(),
      })
      .nullish(),
    attractions: z
      .object({
        totalCount: z.number().int().nonnegative().nullish(),
        results: z.array(z.unknown()).nullish(),
      })
      .nullish(),
  })
  .passthrough();
export type ViatorFreetextSearchResponse = z.infer<typeof ViatorFreetextSearchResponseSchema>;
