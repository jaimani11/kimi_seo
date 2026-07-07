/**
 * Append stayviaowner tracking params to an outbound affiliate URL so
 * each click is attributable in the partner's dashboard AND in our
 * own analytics by surface, campaign, and turn.
 *
 *   - utm_source=stayviaowner           (the property)
 *   - utm_medium=affiliate           (the channel class)
 *   - utm_campaign=<slot>            (which surface drove the click —
 *                                     "rail", "experience", "concierge",
 *                                     "destination", "search", "plan")
 *   - utm_content=<stayId?>          (optional, when the click is for
 *                                     a specific product)
 *   - dpl_turn=<turnId?>             (stayviaowner-private — round-trips
 *                                     the orchestrator turn id so we
 *                                     can join clicks → turns in
 *                                     /admin/clicks. Custom prefix so
 *                                     it doesn't clash with the
 *                                     partner's own params.)
 *
 * Existing query params on the partner URL are preserved, including the
 * partner's own affiliate id, which must NEVER be overwritten.
 *
 * Safe to call on any URL that has already gone through the affiliate
 * host allowlist — it neither validates nor mutates the host. If the
 * URL is unparseable, returns it unchanged so we never block a redirect
 * on a tracking decoration.
 */
export interface DecorateOutboundOptions {
  /** "rail" | "experience" | "concierge" | "destination" | "search" | "plan" | string */
  campaign: string;
  /** Optional content slot — typically the stayId. */
  content?: string;
  /** Optional orchestrator turn id, for joining clicks ↔ turns. */
  turnId?: string;
}

export function decorateOutboundUrl(url: string, opts: DecorateOutboundOptions): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  // Only add params that are not already set by the partner — partners
  // sometimes use utm_source for their own attribution and overwriting
  // would break their reporting. We append to the URL only when our
  // values would not collide.
  setIfAbsent(parsed.searchParams, 'utm_source', 'stayviaowner');
  setIfAbsent(parsed.searchParams, 'utm_medium', 'affiliate');
  setIfAbsent(parsed.searchParams, 'utm_campaign', opts.campaign);
  if (opts.content) setIfAbsent(parsed.searchParams, 'utm_content', opts.content);
  if (opts.turnId) parsed.searchParams.set('dpl_turn', opts.turnId);
  return parsed.toString();
}

function setIfAbsent(params: URLSearchParams, key: string, value: string): void {
  if (params.has(key)) return;
  params.set(key, value);
}
