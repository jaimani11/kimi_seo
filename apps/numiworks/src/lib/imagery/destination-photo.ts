/**
 * Shim — destination photo resolver lives in @adored/imagery, wrapped here with
 * numiworks's per-brand photo VARIANT (2). Every call site in this app inherits
 * it, so numiworks's hero images differ from the sibling brands for the same
 * city (anti-duplicate). gotript = variant 0 (unchanged); gobookt = 1; svo = 3.
 */
import {
  resolveDestinationPhoto as resolveBase,
  type DestinationPhotoQuery,
  type ResolvedDestinationPhoto,
} from '@adored/imagery';

export type { DestinationPhotoQuery, ResolvedDestinationPhoto };

export function resolveDestinationPhoto(query: DestinationPhotoQuery): ResolvedDestinationPhoto {
  return resolveBase(query, 2);
}
