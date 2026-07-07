/**
 * Provider-branding presentation layer.
 *
 * This is a *presentation-only* abstraction. The underlying provider
 * architecture, affiliate links, deeplink generation, and routing all
 * remain branded internally (the URL still goes to expedia.com /
 * viator.com / vrbo.com; the affiliate id still tracks; the provider
 * registry still routes by id). Only what the *user reads* changes
 * with the mode.
 *
 * Three modes:
 *
 *   - `hidden`  - No partner naming at all. CTAs read "Find dates →".
 *                 Provenance reads "Live availability". Aria labels
 *                 read "Open booking page for {name}". The visitor
 *                 sees no brand surface; they get a clean partner
 *                 hand-off via the /r/[id] redirect.
 *
 *   - `neutral` (default) - Generic partner naming. Same CTA + ARIA
 *                 surface as hidden, but provenance can mention
 *                 "our partner" if a phrase needs a noun. The current
 *                 production mode while Expedia partnership
 *                 review is in progress.
 *
 *   - `explicit` - Brand names visible. "Find dates on Expedia →",
 *                 "Live availability through Viator", "Search on
 *                 Hotels.com". The mode we'll flip back to once the
 *                 review completes.
 *
 * To flip modes globally, set `NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE`
 * in `.env.local` (or the deploy env) to `hidden` / `neutral` /
 * `explicit`. Default is `explicit` since the Viator-affiliate
 * positioning makes "Reserve on Viator" the right surface for every
 * CTA. The `NEXT_PUBLIC_` prefix is required because client
 * components read this value at render time.
 *
 * Per-call override: every helper takes an optional `mode` arg so an
 * admin/operator surface can request a specific mode regardless of
 * the global setting (operator dashboards stay branded for ops
 * clarity).
 */

export type BrandingMode = 'hidden' | 'neutral' | 'explicit';

const DEFAULT_MODE: BrandingMode = 'explicit';

/**
 * Read the active mode from env. Reads at call time rather than at
 * module load so a config flip + page reload picks up immediately.
 */
export function getBrandingMode(): BrandingMode {
  const raw = (process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE ?? '').trim().toLowerCase();
  if (raw === 'hidden' || raw === 'neutral' || raw === 'explicit') return raw;
  return DEFAULT_MODE;
}

/**
 * Brand name for a provider id when in `explicit` mode. Centralized
 * so the mapping has one source of truth - data shapes (Property,
 * Experience, SearchOpportunity) carry the provider id, not the
 * brand name.
 */
const EXPLICIT_NAMES: Readonly<Record<string, string>> = {
  expedia: 'Expedia',
  vrbo: 'Vrbo',
  'hotels-com': 'Hotels.com',
  viator: 'Viator',
  getyourguide: 'GetYourGuide',
  airbnb: 'Airbnb',
  hotelbeds: 'Hotelbeds',
};

/**
 * Friendly noun used in `neutral` mode when copy needs to refer to
 * the partner as something. Always lowercase so it composes inside
 * sentences ("hand off to our partner", "live through our partner").
 */
const NEUTRAL_NOUN = 'our partner';

/**
 * Display name for a partner.
 *
 *   - explicit: brand ("Expedia", "Viator")
 *   - neutral:  "our partner"
 *   - hidden:   "" (empty - callers that need a noun should use the
 *               kind-specific helpers below instead)
 */
export function partnerDisplayName(providerId: string, modeOverride?: BrandingMode): string {
  const mode = modeOverride ?? getBrandingMode();
  if (mode === 'explicit') return EXPLICIT_NAMES[providerId] ?? providerId;
  if (mode === 'neutral') return NEUTRAL_NOUN;
  return '';
}

// ============== CTA labels ==============

/**
 * The verb/intent of an outbound CTA. Drives copy across the
 * marketplace surfaces consistently.
 */
export type PartnerCtaKind =
  | 'find-dates' // stay search ("Find dates on Expedia")
  | 'reserve' // experience booking ("Reserve on Viator")
  | 'view-stay' // property deeplink ("View this stay")
  | 'check-availability' // generic
  | 'book-stay'; // generic

interface PartnerCtaOptions {
  /** Append a directional arrow ("→"). Default true. */
  arrow?: boolean;
  /** Mode override. */
  mode?: BrandingMode;
}

/**
 * Compose a partner CTA label. In `explicit` mode the brand name is
 * woven in ("Find dates on Expedia →"). In `hidden` / `neutral` mode
 * the brand is removed entirely ("Find dates →").
 *
 * Returns the rendered string (no JSX), so callers can use it for
 * button text + accessible labels alike.
 */
export function partnerCtaLabel(
  providerId: string,
  kind: PartnerCtaKind,
  opts: PartnerCtaOptions = {},
): string {
  const mode = opts.mode ?? getBrandingMode();
  const arrow = opts.arrow !== false ? ' →' : '';
  const verb = ctaVerb(kind);

  if (mode === 'explicit') {
    const name = EXPLICIT_NAMES[providerId];
    if (name) return `${verb} on ${name}${arrow}`;
  }
  return `${verb}${arrow}`;
}

function ctaVerb(kind: PartnerCtaKind): string {
  switch (kind) {
    case 'find-dates':
      return 'Find dates';
    case 'reserve':
      return 'Reserve';
    case 'view-stay':
      return 'View stay';
    case 'check-availability':
      return 'Check availability';
    case 'book-stay':
      return 'Book stay';
  }
}

// ============== Provenance ==============

/**
 * Sentence used at the bottom of live rails and in admin / operator
 * surfaces to disclose where inventory comes from.
 *
 *   - explicit: "Live availability through Viator. Refreshed continuously."
 *   - neutral:  "Live availability through our partner. Refreshed continuously."
 *   - hidden:   "Live availability. Refreshed continuously."
 */
export function partnerProvenanceLine(providerId: string, modeOverride?: BrandingMode): string {
  const mode = modeOverride ?? getBrandingMode();
  if (mode === 'explicit') {
    const name = EXPLICIT_NAMES[providerId];
    if (name) return `Live availability through ${name}. Refreshed continuously.`;
  }
  if (mode === 'neutral') {
    return 'Live availability through our partner. Refreshed continuously.';
  }
  return 'Live availability. Refreshed continuously.';
}

/**
 * Short provenance phrase for use inside a longer sentence
 * ("send you to our partner for live availability"). No leading
 * "Live availability" wrapper; just the noun phrase.
 */
export function partnerProvenancePhrase(
  providerId: string,
  modeOverride?: BrandingMode,
): string {
  const mode = modeOverride ?? getBrandingMode();
  if (mode === 'explicit') {
    return EXPLICIT_NAMES[providerId] ?? 'our partner';
  }
  if (mode === 'neutral') return 'our partner';
  return 'our booking partner';
}

/**
 * "Powered by X" disclosure used by the inline ExpediaCta + similar
 * brand-attribution lines.
 *
 *   - explicit: "Powered by Expedia"
 *   - neutral:  "Powered by our partner"
 *   - hidden:   "Powered by our booking partner"
 */
export function partnerPoweredBy(providerId: string, modeOverride?: BrandingMode): string {
  const mode = modeOverride ?? getBrandingMode();
  if (mode === 'explicit') {
    const name = EXPLICIT_NAMES[providerId];
    if (name) return `Powered by ${name}`;
  }
  if (mode === 'neutral') return 'Powered by our partner';
  return 'Powered by our booking partner';
}

// ============== Accessibility ==============

/**
 * Accessible label for a card or CTA that hands off to a partner.
 * Screen readers should not blast the brand name in non-explicit
 * mode - the visitor's experience of the page should be consistent
 * across modalities.
 *
 * Examples (explicit / neutral / hidden):
 *   - "Open booking details for Aman Tokyo (affiliate link)" (neutral)
 *   - "Open Expedia booking page for Aman Tokyo (affiliate link)" (explicit)
 */
export function partnerAriaLabel(
  providerId: string,
  itemName: string,
  modeOverride?: BrandingMode,
): string {
  const mode = modeOverride ?? getBrandingMode();
  if (mode === 'explicit') {
    const name = EXPLICIT_NAMES[providerId];
    if (name) return `Open ${name} booking page for ${itemName} (affiliate link)`;
  }
  return `Open booking details for ${itemName} (affiliate link)`;
}

// ============== Disclosure copy ==============

/**
 * Footer disclosure line used by the drawer chrome and other
 * partner-hand-off surfaces. Honest in every mode ("affiliate link,
 * prices via partner, same price to you").
 *
 *   - explicit can name the partner ("via Expedia")
 *   - neutral + hidden use generic language ("via our partner")
 */
export function affiliateDisclosure(providerId: string, modeOverride?: BrandingMode): string {
  const mode = modeOverride ?? getBrandingMode();
  if (mode === 'explicit') {
    const name = EXPLICIT_NAMES[providerId];
    if (name)
      return `Affiliate link. Prices and availability come from ${name}. The price you pay is the same.`;
  }
  return 'Affiliate link. Prices and availability come from our partner. The price you pay is the same.';
}

// ============== Provider-card naming (opportunity board) ==============

/**
 * Display label for one of the three partner cards on the
 * SearchOpportunityBoard. Active emit is three Viator-category slots;
 * legacy hotel-flavor ids stay handled for historical persisted
 * payloads. In `explicit` mode the brand name ("Viator") gets folded
 * into the category label, since the brand here is the value prop.
 */
export function partnerCardLabel(providerId: string, modeOverride?: BrandingMode): string {
  const mode = modeOverride ?? getBrandingMode();
  // Viator-categorical slot ids — the visible label is the category,
  // not the brand, in every mode. (Branding is Viator-only here;
  // differentiating between cards is what the label needs to do.)
  switch (providerId) {
    case 'viator-top':
      return 'Top experiences';
    case 'viator-day-trips':
      return 'Day trips';
    case 'viator-food':
      return 'Food & cooking';
  }
  if (mode === 'explicit') return EXPLICIT_NAMES[providerId] ?? providerId;
  // Legacy hotel-flavor slots — name the inventory SHAPE, not the
  // brand. Kept for backward compatibility with persisted historical
  // opportunity payloads.
  switch (providerId) {
    case 'expedia':
      return 'Hotels & apart-hotels';
    case 'vrbo':
      return 'Vacation rentals';
    case 'hotels-com':
      return 'Hotels · loyalty rewards';
    case 'expedia':
      return 'Hotels & rentals';
    default:
      return 'Partner stays';
  }
}

/**
 * Short tagline beneath the partner card label. Pre-existing copy
 * already worked in neutral mode (it described the shape, not the
 * brand); this helper just normalizes the explicit case if/when we
 * flip back.
 */
export function partnerCardHint(providerId: string, fallback: string, modeOverride?: BrandingMode): string {
  const mode = modeOverride ?? getBrandingMode();
  if (mode === 'explicit') return fallback;
  // Strip brand references that may be embedded in pre-existing
  // hints (e.g. "Hotels.com - Expedia Group sibling; loyalty
  // rewards." → "Loyalty rewards.")
  return neutralizeHint(providerId, fallback);
}

/** Defensive regex: strips known competitor brand names from any
 *  string. Used as a fallback when a provider isn't in the
 *  hand-mapped table - we never want a brand name to leak through
 *  in neutral/hidden mode just because we forgot to map a new
 *  provider's hint copy. */
const COMPETITOR_BRAND_REGEX =
  /\s*[-(·,]?\s*\b(?:Expedia\s+Group(?:\s+sibling)?|Expedia|Vrbo|Hotels\.com|Viator|Airbnb|Booking\.com|Hotelbeds|GetYourGuide)\b\s*[-(·,)]?\s*/gi;

function stripCompetitorBrands(s: string): string {
  return s.replace(COMPETITOR_BRAND_REGEX, ' ').replace(/\s{2,}/g, ' ').trim();
}

function neutralizeHint(providerId: string, fallback: string): string {
  // Hand-mapped neutral phrasing for the providers we know about.
  switch (providerId) {
    case 'viator-top':
      return 'Bookable tours, tickets, and experiences.';
    case 'viator-day-trips':
      return 'Bookable day-trip options.';
    case 'viator-food':
      return 'Food tours, tastings, cooking classes, market visits.';
    case 'expedia':
      return 'Hotels, apart-hotels, broadest inventory.';
    case 'vrbo':
      return 'Cottages, villas, cabins, private homes.';
    case 'hotels-com':
      return 'Hotels with loyalty rewards.';
    case 'expedia':
      return 'Hotels, apartments, vacation rentals.';
    default:
      // Unknown provider - aggressively strip competitor brand names
      // from whatever fallback hint was passed in. The result may
      // read awkwardly; that's still better than leaking a brand.
      return stripCompetitorBrands(fallback) || 'Partner stays.';
  }
}
