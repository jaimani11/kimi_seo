/**
 * Vrbo properties come through Expedia Group's EPS Rapid surface
 * since the acquisition; the response shape is identical to Expedia's
 * /v3/properties/availability. We re-export the existing types so
 * mapper changes (e.g. extra fields per Vrbo's catalog) only have to
 * land in one place when they're needed.
 */
export type {
  ExpediaProperty as VrboProperty,
  ExpediaSearchResponse as VrboSearchResponse,
} from '../expedia/types';

export {
  ExpediaPropertySchema as VrboPropertySchema,
  ExpediaSearchResponseSchema as VrboSearchResponseSchema,
} from '../expedia/types';

/**
 * Rapid category ids that correspond to Vrbo's vacation-rental
 * inventory. Sourced from Expedia Group's Rapid Property Categories
 * reference (https://developers.expediagroup.com/docs/rapid/lodging/content/property-data-reference).
 *
 *   8  cottage
 *  16  vacation rental
 *  19  private vacation home
 *  22  cabin
 *  35  guest house
 *  37  villa
 *
 * Filter on these and the result set looks like Vrbo. Without this
 * filter the same Rapid call returns hotels, which would defeat the
 * Vrbo product.
 */
export const VRBO_RAPID_CATEGORY_IDS = ['8', '16', '19', '22', '35', '37'] as const;
