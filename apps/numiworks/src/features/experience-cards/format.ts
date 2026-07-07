import type { ExperienceFlag } from '@core/experience';

/** Compact per-person price display: "$48". Currencies other than
 *  USD render with the ISO-3 code in parentheses to avoid silently
 *  showing the wrong glyph (€ vs $) when the locale doesn't match. */
export function formatPerPerson(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  });
  try {
    return formatter.format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency || ''}`.trim();
  }
}

/** Review count, short form. 1284 → "1.3k". */
export function formatReviewCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${Math.round(n / 1000)}k`;
}

/** Average rating display ("4.7" out of 5). Returns null when no
 *  rating is available so cards can hide the chip entirely. */
export function formatAverageRating(score: number | null): string | null {
  if (score === null) return null;
  return score.toFixed(1);
}

/** Compact human label for an experience flag. Used by trust chips. */
export function experienceFlagLabel(flag: ExperienceFlag): string {
  switch (flag) {
    case 'new-on-platform':
      return 'New';
    case 'free-cancellation':
      return 'Free cancellation';
    case 'skip-the-line':
      return 'Skip the line';
    case 'private-tour':
      return 'Private';
    case 'special-offer':
      return 'Special offer';
    case 'likely-to-sell-out':
      return 'Selling fast';
  }
}
