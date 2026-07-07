import type { CancellationPolicy, PriceBand } from '@lib/discovery/property';

/** Compact price display: "$1,480" not "$1480". */
export function formatPrice(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd);
}

/** Review count short form: 1284 → "1.3k", 312 → "312". */
export function formatReviewCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${Math.round(n / 1000)}k`;
}

/** Human label for a price band, used as the tiny eyebrow on cards. */
export function priceBandLabel(band: PriceBand): string {
  switch (band) {
    case 'aspirational':
      return 'Aspirational';
    case 'premium':
      return 'Premium';
    case 'comfort':
      return 'Comfort';
    case 'value':
      return 'Value';
  }
}

/** Cancellation policy → trust label. */
export function cancellationLabel(policy: CancellationPolicy): string {
  switch (policy) {
    case 'free-flexible':
      return 'Free cancellation';
    case 'free-limited':
      return 'Free up to a week out';
    case 'non-refundable':
      return 'Non-refundable rate';
  }
}

/** Country code → flag emoji for accent. ISO-3166-1 alpha-2.
 *  No mapping table needed: each letter maps to a regional-indicator
 *  symbol at code point 0x1F1E6 + (letter - 'A'). Works for any pair
 *  of ASCII A-Z; returns "" for malformed codes. */
export function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/i.test(code)) return '';
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    0x1f1e6 + upper.charCodeAt(0) - 65,
    0x1f1e6 + upper.charCodeAt(1) - 65,
  );
}

/** Star rating → bolded display ("9.7"). */
export function formatRating(score: number): string {
  return score.toFixed(1);
}
