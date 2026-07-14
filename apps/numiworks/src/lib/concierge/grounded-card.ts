import type { Experience } from '@core/experience';
import type { TripIntent } from '@core/trip-intent';

/**
 * Grounded, bookable recommendation card contract.
 *
 * The concierge must never INVENT a property/activity, price, availability,
 * rating, review count, urgency, or discount. Every field on a product card is
 * either copied verbatim from a real provider payload or omitted — optional
 * fields are present ONLY when the provider actually supplied a real value
 * (a missing price is absent, never rendered as "$0"; missing reviews are
 * absent, never "0 stars").
 *
 * Provider-returned text (title/summary) is UNTRUSTED DISPLAY DATA. It is
 * rendered as text (React escapes it) and must never be concatenated into an
 * LLM prompt as instructions — the only model call in the concierge path is the
 * upstream intent extractor, which never sees provider content.
 */

export const CARD_DISCLOSURE =
  'Affiliate link · we may earn a commission · the price you pay is the same.';

export interface GroundedProductCard {
  kind: 'product';
  /** Provider display name, e.g. "Viator". */
  provider: string;
  /** Provider product id/code — attribution + dedupe. */
  productId: string;
  /** Real product title (untrusted display text). */
  title: string;
  /** Destination label — from the validated intent when the provider omits a readable name. */
  destination: string;
  /** Cover image — present ONLY when provider-supplied. */
  imageUrl?: string;
  imageAlt?: string;
  /** Price — present ONLY when the provider gave a positive amount. */
  price?: { amount: number; currency: string };
  /** Rating — present ONLY when the provider has real reviews. */
  rating?: { average: number; count: number };
  /** Short, intent-grounded reason this fits (templated from real signals). */
  whyItFits: string;
  /** Tracked outbound URL — passed through unmodified. */
  url: string;
  disclosure: string;
  /** When the inventory was fetched (freshness). ISO 8601. */
  retrievedAt: string;
}

/** Honest, non-product fallback — a clearly-labelled search CTA. */
export interface GroundedSearchCard {
  kind: 'search';
  provider: string;
  /** Explicitly a search, e.g. "Search cooking classes in Rome on Viator". */
  title: string;
  destination: string;
  url: string;
  disclosure: string;
  retrievedAt: string;
  /** Why there's no specific product (honest). */
  note: string;
}

export type GroundedCard = GroundedProductCard | GroundedSearchCard;

export interface GroundedCardContext {
  /** Destination label from validated intent (used when the provider omits a name). */
  destinationLabel: string;
  /** Short intent-grounded reason this fits. */
  whyItFits: string;
  /** ISO timestamp when inventory was fetched. */
  retrievedAt: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  viator: 'Viator',
  getyourguide: 'GetYourGuide',
};

function providerLabel(providerId: string): string {
  return PROVIDER_LABELS[providerId] ?? providerId;
}

/**
 * Build a grounded product card from a real provider Experience. Returns null
 * when the experience has no tracked URL (not bookable → don't surface a dead
 * card). NEVER invents optional fields.
 */
export function toGroundedCard(exp: Experience, ctx: GroundedCardContext): GroundedProductCard | null {
  const url = exp.affiliate?.url?.trim();
  if (!url) return null;

  const card: GroundedProductCard = {
    kind: 'product',
    provider: providerLabel(exp.affiliate.providerId),
    productId: exp.productCode,
    title: exp.title,
    destination: (exp.location.destination || ctx.destinationLabel).trim(),
    whyItFits: ctx.whyItFits,
    url,
    disclosure: CARD_DISCLOSURE,
    retrievedAt: ctx.retrievedAt,
  };

  // Image — only when supplied.
  const photo = exp.photos[0];
  if (photo?.url) {
    card.imageUrl = photo.url;
    if (photo.alt) card.imageAlt = photo.alt;
  }
  // Price — only when the provider gave a positive amount + a currency.
  if (exp.pricing.fromPerPerson > 0 && exp.pricing.currency.length === 3) {
    card.price = { amount: exp.pricing.fromPerPerson, currency: exp.pricing.currency };
  }
  // Rating — only when there are real reviews.
  if (exp.reviews.averageRating != null && exp.reviews.averageRating > 0 && exp.reviews.total > 0) {
    card.rating = { average: exp.reviews.averageRating, count: exp.reviews.total };
  }

  return card;
}

/**
 * A short "why this fits" line grounded in REAL signals only — provider trust
 * flags + the traveler's own intent vibe. Never asserts anything about the
 * product that the provider didn't supply.
 */
export function whyItFitsFor(intent: TripIntent, exp: Experience): string {
  const bits: string[] = [];
  if (exp.flags.includes('free-cancellation')) bits.push('free cancellation');
  else if (exp.flags.includes('skip-the-line')) bits.push('skip-the-line');
  else if (exp.flags.includes('private-tour')) bits.push('private option');

  const tag = intent.vibe.tags[0];
  if (tag) bits.push(`matches your ${tag.replace(/-/g, ' ')} vibe`);

  if (bits.length === 0) return 'Bookable now, with real traveler reviews.';
  const s = bits.join(' · ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Honest empty/timeout fallback — a clearly-labelled destination/category
 * SEARCH card (never a fake product). Preserves the destination + a tracked
 * search URL (attribution retained by the URL builder).
 */
export function groundedSearchFallback(args: {
  destinationLabel: string;
  categoryLabel?: string;
  searchUrl: string;
  retrievedAt: string;
  reason?: 'no-inventory' | 'provider-unavailable';
}): GroundedSearchCard {
  const what = args.categoryLabel
    ? `${args.categoryLabel} in ${args.destinationLabel}`
    : `experiences in ${args.destinationLabel}`;
  const note =
    args.reason === 'provider-unavailable'
      ? "We couldn't reach live availability just now — search current options directly."
      : 'No specific matching experiences to show right now — search current options directly.';
  return {
    kind: 'search',
    provider: 'Viator',
    title: `Search ${what} on Viator`,
    destination: args.destinationLabel,
    url: args.searchUrl,
    disclosure: CARD_DISCLOSURE,
    retrievedAt: args.retrievedAt,
    note,
  };
}

/**
 * Retry `fn` at most `retries` times (default 1) on a TRANSIENT failure. Never
 * retries terminal outcomes — validation errors, empty results (which aren't
 * errors), or user/navigation aborts.
 */
export async function withBoundedRetry<T>(
  fn: () => Promise<T>,
  opts: { isTransient: (err: unknown) => boolean; retries?: number },
): Promise<T> {
  const retries = opts.retries ?? 1;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= retries || !opts.isTransient(err)) throw err;
    }
  }
  throw lastErr;
}

/** Heuristic: is a provider error transient (worth exactly one retry)? */
export function isTransientProviderError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  // A user/navigation abort or a slot-budget timeout must NOT be retried — that
  // would blow the latency budget the caller set.
  if (msg.includes('abort')) return false;
  return (
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('network') ||
    msg.includes('fetch failed') ||
    msg.includes('socket hang up') ||
    /\b5\d\d\b/.test(msg) // upstream 5xx
  );
}
