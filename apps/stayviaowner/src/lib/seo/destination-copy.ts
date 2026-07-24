/**
 * Shim — the per-brand destination COPY engine lives in @adored/brand-experience
 * (extracted so all brands share one set of voice pools). This is
 * stayviaowner's brand-bound wrapper; call sites import
 * `stayviaownerDestinationCopy` unchanged. The hero-photo variant helper is
 * stayviaowner-specific and stays local.
 */
import { destinationCopy, type DestinationCopy } from '@adored/brand-config';

export type { DestinationCopy };

export function stayviaownerDestinationCopy(name: string, slug: string): DestinationCopy {
  return destinationCopy('stayviaowner', name, slug);
}

/**
 * Per-brand hero-photo variant. The shared resolver already returns a per-brand
 * image (via the imagery shim's variant); this adds a distinct crop + palette on
 * top so stayviaowner's Path A hero doesn't render pixel-identically. Kept local
 * to this app. Deterministic (no per-request variance, safe for static gen).
 */
export function stayviaownerHeroPhoto(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}crop=entropy&sat=-12`;
}
