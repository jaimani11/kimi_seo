/**
 * Shim — the per-brand destination COPY engine lives in @adored/brand-experience
 * (extracted so all brands share one set of voice pools). This is numiworks's
 * brand-bound wrapper; call sites import `numiworksDestinationCopy` unchanged.
 */
import { destinationCopy, type DestinationCopy } from '@adored/brand-config';

export type { DestinationCopy };

export function numiworksDestinationCopy(name: string, slug: string): DestinationCopy {
  return destinationCopy('numiworks', name, slug);
}
