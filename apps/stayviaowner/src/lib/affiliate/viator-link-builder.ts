import type { Experience } from '@core/experience';
import { isAllowedAffiliateHost } from './allowlist';
import { encodeAffiliateLink } from './link-encoder';

/**
 * Viator-specific affiliate redirect builder.
 *
 * Unlike Expedia, where we synthesize a search URL from scratch and
 * append the affcid, Viator gives us a fully-formed `productUrl`
 * back from the API that already includes the campaign tracking
 * (when we passed `campaign-value` on the request). Viator is very
 * explicit that this URL must be used unmodified - any change
 * breaks attribution and we don't get paid.
 *
 * So this builder is intentionally thin: it validates the URL against
 * our allowlist, encodes it into a /r/[id] payload for click logging,
 * and hands the encoded id back. No URL rewriting.
 */

export interface BuildViatorRedirectInput {
  /** Experience whose affiliate URL we want to track. */
  experience: Experience;
  /** Optional turn id to thread the click back to the proposing
   *  conversation turn for admin analytics. */
  turnId?: string;
  /** Optional conversation id for multi-turn attribution. */
  conversationId?: string;
}

export interface BuildViatorRedirectResult {
  /** Path-segment id to plug into /r/[id]. */
  id: string;
  /** The underlying Viator URL, kept around for logging + Cypress
   *  asserts. Never use this directly in href - go through /r/. */
  url: string;
}

/**
 * Build a /r/[id] redirect for a Viator-backed experience.
 *
 * Returns null when the experience lacks a usable productUrl or the
 * URL fails the allowlist (e.g. Viator returns a staging-only host
 * during sandbox testing). Callers should treat null as "don't
 * render a CTA"; the card body is still useful for discovery even
 * without an attribution-safe outbound link.
 */
export function buildViatorRedirect(
  input: BuildViatorRedirectInput,
): BuildViatorRedirectResult | null {
  const url = input.experience.affiliate.url;
  if (!url || url.length === 0) return null;
  if (!isAllowedAffiliateHost(url)) return null;

  const id = encodeAffiliateLink({
    url,
    providerId: 'viator',
    stayId: input.experience.affiliate.stayId,
    ...(input.turnId ? { turnId: input.turnId } : {}),
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
  });
  return { id, url };
}

/**
 * Sugar for the common case: just the experience. Returns the
 * `/r/[id]` path ready to drop into an `<a href>`, or null when the
 * URL is missing or rejected by the allowlist.
 */
export function viatorAffiliateHref(experience: Experience): string | null {
  const built = buildViatorRedirect({ experience });
  return built ? `/r/${built.id}` : null;
}
