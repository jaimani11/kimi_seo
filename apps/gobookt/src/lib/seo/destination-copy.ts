/**
 * Shim — the per-brand destination COPY engine lives in @adored/brand-experience
 * (extracted so all brands share one set of voice pools). This is gobookt's
 * brand-bound wrapper; call sites import `gobooktDestinationCopy` unchanged.
 */
import { destinationCopy, type DestinationCopy } from '@adored/brand-config';

export type { DestinationCopy };

export function gobooktDestinationCopy(name: string, slug: string): DestinationCopy {
  return destinationCopy('gobookt', name, slug);
}
