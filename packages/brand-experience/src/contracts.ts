/**
 * @adored/brand-experience — contracts.
 *
 * The three-layer architecture for destination (and, later, any) pages:
 *
 *   CityFacts            pure facts about a place (no brand opinion)
 *      ↓  buildBrandPlan(brand, facts, adapters)   ← pure business logic
 *   DestinationExperience  the brand's INTERPRETATION (sections/faq/schema/…)
 *      ↓  <DestinationExperienceRenderer>          ← brand-agnostic React
 *   HTML
 *
 * Two hard rules encoded by the type split below:
 *   1. `CityFacts` and the brand `DestinationExperience` are SEPARATE types so
 *      a renderer can never accidentally mix raw facts with interpretation.
 *   2. A `BrandSpec` describes a brand's IDENTITY (purpose / audience /
 *      question / policies), not a hand-listed section order. The planner
 *      composes the page from the policies. New page types ask "what does the
 *      BrandSpec say?" rather than "how does brand X render this?".
 */

export type BrandId = 'gobookt' | 'gotript' | 'numiworks' | 'stayviaowner';
export type ProviderId = 'booking' | 'expedia' | 'vrbo' | 'viator';

// ── Layer 1: pure facts ─────────────────────────────────────────────────────

export interface CityFacts {
  slug: string;
  name: string;
  countryName: string;
  countryCode: string;
  region: string;
  coordinates: { lat: number; lng: number };
  bestTime: { months: string; blurb: string };
  budget: { budgetDailyUSD: number; midDailyUSD: number; luxuryDailyUSD: number; blurb: string };
  travelStyles: { family: string; couples: string; solo: string };
  foods: ReadonlyArray<{ dish: string; note: string }>;
  transportation: { primary: string; tips: string };
  neighborhoods: ReadonlyArray<{ name: string; blurb: string }>;
  neighborhoodPois: ReadonlyArray<{ name: string; lat: number; lng: number }>;
  safety: string;
  /** Present when the city has climate data. The panel's month data is a
   *  renderer concern loaded separately; the planner only needs existence. */
  climate?: { tz: string };
}

/**
 * Affiliate href builders the app injects at plan time. The engine stays pure
 * (no app-specific affiliate imports); the app supplies the money-path-safe
 * builders (e.g. gobookt's `bookingHotelsSearchHref`, gotript's
 * `buildExpediaCategoryUrl`). A builder returns `null` when the hand-off is
 * unavailable (fail-closed) so the section renders a controlled state.
 */
export interface ProviderAdapters {
  /** Primary stay/experience search for a destination or sub-area. */
  primarySearchHref: (query: string) => string | null;
  /** Optional whole-home (Vrbo) href for group/space intent. */
  wholeHomeHref?: (city: string) => string | null;
}

// ── Layer 2: the experience model (brand interpretation) ────────────────────

export type SectionKind =
  | 'climate' // seasonality + climate panel
  | 'area-cards' // best areas / rental areas, each an optional tracked search CTA
  | 'compare-map' // neighborhood map + walking distances (neutral dims)
  | 'chip-grid' // labelled cards: hotel types / experience categories / property types
  | 'profile-list' // traveler profile → text (family / couples / solo / group)
  | 'itinerary-links' // trip-length itinerary options
  | 'decision-card' // provider decision (hotel-vs-whole-home)
  | 'prose' // heading + paragraph(s)
  | 'cta-list' // related internal links
  | 'ai-prompt'; // (numiworks) AI concierge entry

export interface AreaCard {
  name: string;
  blurb: string;
  href: string | null;
  ctaLabel: string;
}
export interface Chip {
  label: string;
  note: string;
}
export interface ItineraryOption {
  days: number;
  label: string;
  href: string;
}
export interface DecisionOption {
  title: string;
  note: string;
  href: string | null;
  ctaLabel: string;
}
export interface MapPinModel {
  name: string;
  lat: number;
  lng: number;
  kind: 'neighborhood' | 'attraction';
  detail?: string;
  href?: string;
  ctaLabel?: string;
}

/** Discriminated union: each section carries exactly the data its kind needs. */
export type SectionData =
  | { kind: 'climate'; intro: string }
  | { kind: 'area-cards'; intro: string; areas: AreaCard[] }
  | { kind: 'compare-map'; intro: string; areas?: Array<{ name: string; blurb: string }>; pins: MapPinModel[] }
  | { kind: 'chip-grid'; intro: string; chips: Chip[] }
  | { kind: 'profile-list'; items: Array<{ label: string; text: string }> }
  | { kind: 'itinerary-links'; intro: string; options: ItineraryOption[] }
  | { kind: 'decision-card'; intro: string; options: DecisionOption[] }
  | { kind: 'prose'; paragraphs: string[] }
  | { kind: 'cta-list'; links: Array<{ label: string; href: string }> }
  | { kind: 'ai-prompt'; placeholder: string; ctaLabel: string };

export interface ExperienceSection {
  id: string;
  eyebrow: string;
  heading: string;
  data: SectionData;
}

export interface DestinationExperience {
  brand: BrandId;
  hero: { eyebrow: string; heading: string; subhead: string };
  sections: ExperienceSection[];
  faq: Array<{ question: string; answer: string }>;
  /** JSON-LD string (TouristDestination + FAQPage), brand-framed. */
  jsonLd: string;
  crossLinksHeading: string;
  crossLinks: Array<{ label: string; href: string }>;
}

// ── The declarative BrandSpec (identity + policies) ─────────────────────────

/** One composable section the planner may include, with a brand-owned data
 *  builder. `build` returns `null` to omit the section for this city. */
export interface SectionSpec {
  id: string;
  kind: SectionKind;
  eyebrow: string;
  heading: (facts: CityFacts) => string;
  build: (facts: CityFacts, adapters: ProviderAdapters) => SectionData | null;
}

export interface BrandSpec {
  brand: BrandId;
  /** What job this brand performs. */
  purpose: string;
  /** Who it is for. */
  audience: string;
  /** The one question the page answers. */
  primaryQuestion: string;
  /** Voice/framing note used for copy. */
  narrative: string;
  providers: { primary: ProviderId; secondary?: ProviderId };
  hero: (facts: CityFacts) => { eyebrow: string; heading: string; subhead: string };
  /** Ordered composable sections (sectionPolicy). */
  sections: SectionSpec[];
  faqPolicy: (facts: CityFacts) => Array<{ question: string; answer: string }>;
  /** Crawler-facing TouristDestination description (brand-framed). */
  schemaDescription: (facts: CityFacts) => string;
  /** Heading for the related-links block (e.g. "Keep exploring stays"). */
  crossLinksHeading: string;
  linkPolicy: (facts: CityFacts) => Array<{ label: string; href: string }>;
  /** Section kinds this brand must NEVER emit (enforced by the validator). */
  forbiddenSections: SectionKind[];
  /** Section kinds that MUST be present for a valid page of this brand. */
  requiredSections: SectionKind[];
}
