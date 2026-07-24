/**
 * Shim — destination photo resolver lives in @adored/imagery, wrapped here with
 * stayviaowner's per-brand photo VARIANT (3). Every call site in this app
 * inherits it, so stayviaowner's hero images differ from the sibling brands for
 * the same city (anti-duplicate). gotript = variant 0 (unchanged); gobookt = 1;
 * numiworks = 2.
 */
import {
  resolveDestinationPhoto as resolveBase,
  type DestinationPhotoQuery,
  type ResolvedDestinationPhoto,
} from '@adored/imagery';

export type { DestinationPhotoQuery, ResolvedDestinationPhoto };

export function resolveDestinationPhoto(query: DestinationPhotoQuery): ResolvedDestinationPhoto {
  return resolveBase(query, 3);
}
