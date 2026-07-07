import type {
  Experience,
  ExperienceDuration,
  ExperienceFlag,
  ExperiencePhoto,
} from '@core/experience';
import type { ViatorProductSummary } from './types';

/**
 * Map Viator's `ProductSummary` payload into our normalized
 * `Experience` shape. This is the only file that knows about both
 * sides; everything downstream sees `Experience`.
 *
 * Defensive defaults rather than throws: a product missing pricing or
 * a cover photo is degraded (price hidden, gradient fallback) instead
 * of dropped. Viator occasionally returns partial summaries (cached
 * vs. fresh data path) and we'd rather render a card than blank space.
 *
 * The mapper is pure - no I/O, no side effects. That makes it trivial
 * to test against recorded fixtures (see tests/viator-mapper.test.ts).
 */

export interface MapViatorProductOptions {
  /** Currency the request was made in. Falls back to USD when the
   *  response omits it, which Viator sometimes does for products
   *  without active pricing in the requested currency. */
  currency: string;
}

export function mapViatorProductToExperience(
  product: ViatorProductSummary,
  opts: MapViatorProductOptions,
): Experience {
  const productCode = product.productCode;
  const title = product.title?.trim() ?? '(untitled experience)';
  const summary = truncateOneSentence(product.description?.trim() ?? '');

  const photos = mapPhotos(product.images);
  const duration = mapDuration(product);
  const pricing = mapPricing(product, opts.currency);
  const reviews = mapReviews(product);
  const flags = mapFlags(product.flags);

  const primaryDestination = product.destinations?.find((d) => d.primary !== false) ?? null;

  return {
    id: `viator:${productCode}`,
    productCode,
    title,
    summary,
    location: {
      destination: '',
      destinationRef: primaryDestination?.ref != null ? String(primaryDestination.ref) : null,
      country: null,
    },
    photos,
    duration,
    pricing,
    reviews,
    flags,
    confirmation: product.confirmationType === 'INSTANT' ? 'instant' : null,
    tags: [],
    affiliate: {
      providerId: 'viator',
      url: product.productUrl ?? '',
      stayId: `viator-${productCode}`,
    },
  };
}

// ============== Sub-mappers ==============

function mapPhotos(images: ViatorProductSummary['images']): ExperiencePhoto[] {
  if (!images || images.length === 0) return [];
  const cover = images.find((img) => img.isCover) ?? images[0]!;
  // Take cover + up to 4 supporting photos for galleries later. The
  // hero card only uses [0]; carousel cards only use [0]. Extra
  // photos are kept in the data so destination pages can grow into
  // a lightbox/gallery without re-fetching.
  const ordered = cover
    ? [cover, ...images.filter((img) => img !== cover)]
    : [...images];
  return ordered.slice(0, 5).flatMap((img) => {
    const caption = img.caption?.trim() ?? null;
    return img.variants
      .filter((v) => v.url.length > 0 && v.width > 0 && v.height > 0)
      .map(
        (v): ExperiencePhoto => ({
          url: v.url,
          width: v.width,
          height: v.height,
          alt: caption,
        }),
      );
  });
}

function mapDuration(product: ViatorProductSummary): ExperienceDuration {
  const d = product.duration;
  if (!d) return { kind: 'unstructured', minutes: null, fromMinutes: null, toMinutes: null, label: null };

  if (typeof d.fixedDurationInMinutes === 'number') {
    return {
      kind: 'fixed',
      minutes: d.fixedDurationInMinutes,
      fromMinutes: null,
      toMinutes: null,
      label: null,
    };
  }
  if (
    typeof d.variableDurationFromMinutes === 'number' &&
    typeof d.variableDurationToMinutes === 'number'
  ) {
    return {
      kind: 'range',
      minutes: null,
      fromMinutes: d.variableDurationFromMinutes,
      toMinutes: d.variableDurationToMinutes,
      label: null,
    };
  }
  if (typeof d.unstructuredDuration === 'string' && d.unstructuredDuration.length > 0) {
    return {
      kind: 'unstructured',
      minutes: null,
      fromMinutes: null,
      toMinutes: null,
      label: d.unstructuredDuration,
    };
  }
  return { kind: 'unstructured', minutes: null, fromMinutes: null, toMinutes: null, label: null };
}

function mapPricing(product: ViatorProductSummary, fallbackCurrency: string): Experience['pricing'] {
  const p = product.pricing;
  const currency = p?.currency ?? fallbackCurrency;
  const fromPrice = p?.summary?.fromPrice;
  const fromPriceBeforeDiscount = p?.summary?.fromPriceBeforeDiscount;
  return {
    fromPerPerson: typeof fromPrice === 'number' && fromPrice > 0 ? fromPrice : 0,
    fromPerPersonBeforeDiscount:
      typeof fromPriceBeforeDiscount === 'number' && fromPriceBeforeDiscount > 0
        ? fromPriceBeforeDiscount
        : null,
    currency,
  };
}

function mapReviews(product: ViatorProductSummary): Experience['reviews'] {
  const r = product.reviews;
  const total = typeof r?.totalReviews === 'number' ? r.totalReviews : 0;
  const avg =
    typeof r?.combinedAverageRating === 'number' && Number.isFinite(r.combinedAverageRating)
      ? clampRating(r.combinedAverageRating)
      : null;
  return { averageRating: avg, total };
}

function clampRating(n: number): number {
  if (n <= 0) return 0;
  if (n >= 5) return 5;
  return Number(n.toFixed(2));
}

const FLAG_TO_ENUM: Readonly<Record<string, ExperienceFlag>> = {
  NEW_ON_VIATOR: 'new-on-platform',
  FREE_CANCELLATION: 'free-cancellation',
  SKIP_THE_LINE: 'skip-the-line',
  PRIVATE_TOUR: 'private-tour',
  SPECIAL_OFFER: 'special-offer',
  LIKELY_TO_SELL_OUT: 'likely-to-sell-out',
};

function mapFlags(raw: ViatorProductSummary['flags']): ExperienceFlag[] {
  if (!raw || raw.length === 0) return [];
  const out = new Set<ExperienceFlag>();
  for (const r of raw) {
    const mapped = FLAG_TO_ENUM[r];
    if (mapped) out.add(mapped);
  }
  return [...out];
}

/**
 * One-sentence truncation for card pitch slots. Falls back to a
 * character cap when the description is one giant blob without
 * sentence punctuation - in that case we trim at a word boundary.
 */
function truncateOneSentence(s: string): string {
  if (s.length === 0) return '';
  // Look for the first sentence-ending punctuation followed by space
  // or end-of-string. Catches ".", "!", "?", and the "." after "Inc."
  // is OK since the next character is space + capitalized.
  const sentenceMatch = s.match(/^.{20,180}?[.!?](\s|$)/);
  if (sentenceMatch) return sentenceMatch[0].trim();
  if (s.length <= 180) return s;
  // No sentence boundary in the first 180 chars - trim at last word
  // boundary before 180 and append an ellipsis.
  const slice = s.slice(0, 180);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > 100 ? slice.slice(0, lastSpace) : slice).trim()}...`;
}
