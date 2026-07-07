/**
 * Expedia affiliate URL builder.
 *
 * Affiliate links are URL-pattern generators - no API call is made.
 * They work for any destination Expedia indexes and they're
 * independent of Rapid API inventory access (which is a separate
 * partner approval). Anyone with an Expedia Creator Platform
 * `affcid` can wire this up and start earning commission.
 *
 * Two link shapes:
 *
 *   1. Destination-level search - used when we don't have a direct
 *      Expedia property id. Lands the user on Expedia's hotel-search
 *      results for the right destination + dates + occupancy. Works
 *      for curated listings (mock-italy), AI-synthesized listings
 *      (LLM-synthesized), and anything else.
 *
 *   2. Property-level deeplink - used when we know the Expedia
 *      property id (Rapid response, or a hand-mapped table). Skips
 *      the search results and lands on the property page directly.
 *
 * Both attach the affiliate `affcid`, optional sub-`label` for
 * channel attribution, and `siteid` for locale.
 *
 * Mock-safe: when `EXPEDIA_AFFILIATE_CID` is unset, the URL still
 * resolves to a usable Expedia.com search; tracking just doesn't
 * attribute to anyone. The CTA continues to work - honest behavior,
 * no broken state.
 *
 * Disclosure: every UI surface that emits a built URL must also
 * render the "Affiliate link · Prices may change" copy. That's the
 * `<ExpediaCta>` component's job.
 */

export interface ExpediaAffiliateConfig {
  /** Expedia Affiliate Campaign ID. Required for commission to track;
   *  unset still produces a valid URL without the param. */
  cid: string | null;
  /** Optional sub-channel label so different surfaces (web, email,
   *  social) can be distinguished within one campaign. */
  label: string | null;
  /** Locale-specific Expedia hostname. Default www.expedia.com (US).
   *  Examples: www.expedia.co.uk, www.expedia.de, www.expedia.fr. */
  baseUrl: string;
  /** Expedia siteid (1 = US, 3 = UK, 23 = AU, etc.). Default 1. */
  siteId: number;
}

const DEFAULT_BASE_URL = 'https://www.expedia.com';
const DEFAULT_SITE_ID = 1;

/**
 * Read the affiliate config from env. Reads `NEXT_PUBLIC_*` vars so
 * client and server resolve the same URL - the affcid + label + base
 * URL aren't secret (they ship in every outbound link), and Next.js
 * only bundles `NEXT_PUBLIC_*` to the client. The non-prefixed names
 * are accepted server-side too as a fallback for ops setups that
 * already use the shorter form.
 *
 * Called per-render rather than cached so a config flip picks up
 * immediately. The cost is negligible - four env reads.
 */
export function getExpediaAffiliateConfig(): ExpediaAffiliateConfig {
  const cidRaw = (
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID ||
    process.env.EXPEDIA_AFFILIATE_CID ||
    ''
  ).trim();
  const labelRaw = (
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL ||
    process.env.EXPEDIA_AFFILIATE_LABEL ||
    ''
  ).trim();
  const base = (
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_BASE_URL ||
    process.env.EXPEDIA_AFFILIATE_BASE_URL ||
    ''
  ).trim();
  const siteIdRaw = (
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_SITE_ID ||
    process.env.EXPEDIA_AFFILIATE_SITE_ID ||
    ''
  ).trim();

  return {
    cid: cidRaw.length > 0 ? cidRaw : null,
    label: labelRaw.length > 0 ? labelRaw : null,
    baseUrl: base.length > 0 ? stripTrailingSlash(base) : DEFAULT_BASE_URL,
    siteId: /^\d+$/.test(siteIdRaw) ? Number.parseInt(siteIdRaw, 10) : DEFAULT_SITE_ID,
  };
}

export interface DestinationSearchInput {
  /** Free-text destination - typically `intent.destinations[0].name`
   *  ("Tuscany", "Tokyo", "Lisbon"). Expedia's destination resolver
   *  handles fuzzy strings. */
  destination: string;
  /** ISO `YYYY-MM-DD`. Required for the search to feel useful. When
   *  the user's intent is unspecified, the caller should synthesize
   *  a sensible window (e.g. today + 30, +5 nights - same fallback
   *  the booking-agent uses). */
  checkIn: string;
  checkOut: string;
  adults: number;
  /** Children ages - Expedia wants ages, not just count. Default 8
   *  per child when ages aren't known (matches the booking-agent
   *  fallback so child counts don't accidentally affect occupancy). */
  childrenAges?: number[];
  /** Number of rooms. Default 1. */
  rooms?: number;
}

/**
 * Build a destination-level Expedia search URL.
 *
 * The URL format below matches Expedia's public hotel-search query
 * string (also used by their affiliate creator dashboard):
 *
 *   https://www.expedia.com/Hotel-Search?destination=Tuscany,%20Italy
 *   &startDate=2026-09-01&endDate=2026-09-05&rooms=1&adults=2&children=8
 *   &siteid=1&affcid=YOURCID&label=stayscout-web
 *
 * The `affcid` is what the creator platform tracks for commission.
 * We append a tiny `_src=stayscout` so we can disambiguate clicks in
 * post-click analytics if needed.
 */
export function buildExpediaSearchUrl(
  input: DestinationSearchInput,
  config: ExpediaAffiliateConfig = getExpediaAffiliateConfig(),
): string {
  const params = new URLSearchParams();
  params.set('destination', input.destination.trim());
  params.set('startDate', input.checkIn);
  params.set('endDate', input.checkOut);
  params.set('rooms', String(input.rooms ?? 1));
  params.set('adults', String(Math.max(1, input.adults)));
  const ages = input.childrenAges ?? [];
  if (ages.length > 0) {
    // Expedia accepts a comma-separated list of ages.
    params.set('children', ages.map((a) => String(Math.max(0, Math.min(17, a)))).join(','));
  }
  params.set('siteid', String(config.siteId));
  if (config.cid) params.set('affcid', config.cid);
  if (config.label) params.set('label', config.label);
  // Source-tag for disambiguation in post-click analytics. Doesn't
  // affect commission; useful when we expand into email/social later.
  params.set('_src', 'numiworks');

  return `${config.baseUrl}/Hotel-Search?${params.toString()}`;
}

export interface PropertyDeeplinkInput {
  /** Expedia property id (the "h<digits>" prefix is added here; pass
   *  the raw numeric id or the existing `<digits>` form). */
  propertyId: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  childrenAges?: number[];
  rooms?: number;
}

/**
 * Build a property-level Expedia deeplink. Used when we have a real
 * Expedia property id (Rapid response, or a curated mapping table).
 * Falls back to the search URL if no property id is supplied - the
 * caller can then surface a destination-level CTA without changing
 * shape.
 */
export function buildExpediaPropertyUrl(
  input: PropertyDeeplinkInput,
  config: ExpediaAffiliateConfig = getExpediaAffiliateConfig(),
): string {
  const cleanId = input.propertyId.replace(/^h/, '');
  const params = new URLSearchParams();
  if (input.checkIn) params.set('chkin', input.checkIn);
  if (input.checkOut) params.set('chkout', input.checkOut);
  if (typeof input.adults === 'number') params.set('rm1', `a${Math.max(1, input.adults)}`);
  const ages = input.childrenAges ?? [];
  if (ages.length > 0) {
    const aged = ages.map((a) => `:${Math.max(0, Math.min(17, a))}`).join('');
    const existingRoom = params.get('rm1') ?? `a${input.adults ?? 1}`;
    params.set('rm1', `${existingRoom}${aged}`);
  }
  params.set('siteid', String(config.siteId));
  if (config.cid) params.set('affcid', config.cid);
  if (config.label) params.set('label', config.label);
  params.set('_src', 'numiworks');

  const path = `/h${cleanId}.Hotel-Information`;
  const qs = params.toString();
  return `${config.baseUrl}${path}${qs.length > 0 ? `?${qs}` : ''}`;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}
