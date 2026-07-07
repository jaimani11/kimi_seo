/**
 * Viator destination-search URL builder for the "where to stay / what
 * to do here" CTA. Routes any stay-CTA click on the site through the
 * Viator affiliate network rather than a hotel-only competitor — every
 * outbound link on numiworks belongs in the Viator ecosystem.
 *
 * Viator doesn't sell hotels, so the destination CTA lands on the
 * Viator destination experience search instead of a hotel listing.
 * The user sees bookable Viator inventory for the destination, which
 * is what numiworks is actually monetizing.
 *
 * Affiliate model:
 *
 *   - `pid=<VIATOR_PARTNER_ID>` carries the partnership for commission
 *     tracking. Without it the URL still resolves to a valid Viator
 *     search; commission just doesn't attribute.
 *   - `mcid` is the marketing-channel id Viator uses to bucket clicks
 *     by surface (we use a fixed `numiworks-stay` so stay-CTA clicks
 *     don't get confused with experience-card clicks).
 *   - `medium=link` is Viator's standard click-source value for
 *     direct-link affiliates.
 */

export interface ViatorStayLinkConfig {
  /** Viator partner id (their "pid" param). Required for commission to
   *  track; unset still produces a valid URL without the param. */
  partnerId: string | null;
  /** Marketing channel id appended as `mcid`. */
  mcid: string;
  /** Hostname. Default `www.viator.com`. */
  baseUrl: string;
}

const DEFAULT_BASE_URL = 'https://www.viator.com';
/**
 * Default mcid. Surfaces the click as coming from a numiworks "stay"
 * surface so admin attribution can differentiate it from experience-
 * card clicks (which carry their own productUrl-embedded mcid).
 */
const DEFAULT_MCID = 'numiworks-stay';

export function getViatorStayLinkConfig(): ViatorStayLinkConfig {
  const pidRaw = (
    process.env.NEXT_PUBLIC_VIATOR_PARTNER_ID ||
    process.env.VIATOR_PARTNER_ID ||
    ''
  ).trim();
  const mcidRaw = (
    process.env.NEXT_PUBLIC_VIATOR_STAY_MCID ||
    process.env.VIATOR_STAY_MCID ||
    DEFAULT_MCID
  ).trim();
  const baseRaw = (
    process.env.NEXT_PUBLIC_VIATOR_BASE_URL ||
    process.env.VIATOR_BASE_URL ||
    ''
  ).trim();
  return {
    partnerId: pidRaw.length > 0 ? pidRaw : null,
    mcid: mcidRaw.length > 0 ? mcidRaw : DEFAULT_MCID,
    baseUrl: baseRaw.length > 0 ? stripTrailingSlash(baseRaw) : DEFAULT_BASE_URL,
  };
}

export interface ViatorStaySearchInput {
  /** Free-text destination ("Tuscany", "Tokyo", "Lisbon"). Viator's
   *  search resolver handles fuzzy strings. */
  destination: string;
}

/**
 * Build a destination-level Viator search URL.
 *
 *   https://www.viator.com/searchResults/all?
 *     text=Agra&pid=PARTNER&mcid=numiworks-stay&medium=link
 *
 * The `checkIn`/`checkOut`/`adults` fields from the shared
 * ActiveStaySearchInput are intentionally NOT appended — Viator's
 * destination-search URL doesn't take them, and adding garbage params
 * to a partner URL is the textbook way to get an affiliate tag
 * stripped at the network layer. Date and traveler context lives in
 * the planner UI; the click here is a destination handoff.
 */
export function buildViatorStaySearchUrl(
  input: ViatorStaySearchInput,
  config: ViatorStayLinkConfig,
): string {
  const params = new URLSearchParams();
  params.set('text', input.destination);
  if (config.partnerId) params.set('pid', config.partnerId);
  params.set('mcid', config.mcid);
  params.set('medium', 'link');
  return `${config.baseUrl}/searchResults/all?${params.toString()}`;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}
