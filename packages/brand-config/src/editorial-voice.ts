/**
 * Brand-role framing for EDITORIAL programmatic pages (kind === 'themed-list':
 * seasonal, occasion, persona, day-trips, etc.).
 *
 * WHY: the shared `themed-list` registry composes every brand's title/description
 * from the same `city.oneLiner` opener + the same family tail, so the rendered
 * <title> and <meta description> are byte-identical across brands (verified 2026-07-30,
 * ~1.0 similarity across 10 cities). That's a cross-domain duplicate-metadata defect.
 *
 * WHAT this does: reframes the TITLE tag (a brand-role qualifier) and the META
 * DESCRIPTION (a brand-role opener that replaces the shared oneLiner) so each brand
 * speaks from its job. It does NOT touch routes, sitemaps, noindex, canonicals, URL
 * generation, internal links, body-section structure, or affiliate/provider logic.
 * Shared city FACTS remain in the data layer — only the framing/composition differs.
 *
 * Deterministic (FNV-1a seed on brand|city|theme) so output is stable per URL.
 */
export type EditorialBrand = 'gotript' | 'gobookt' | 'numiworks' | 'stayviaowner';

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length] as T;
}

/** Brand-role tag appended to the <title> (before the ` · brand` suffix). */
const TITLE_TAG: Record<EditorialBrand, string> = {
  gotript: 'Trip Planner',
  numiworks: 'Tours & Experiences',
  stayviaowner: 'Whole-Home Stays',
  gobookt: 'Where to Stay',
};

/** theme → human topic used inside the brand opener. */
const TOPIC: Record<string, string> = {
  honeymoon: 'a honeymoon', 'girls-trip': 'a girls’ trip',
  'bachelor-party': 'a bachelor party', 'bachelorette-party': 'a bachelorette party',
  spring: 'a spring trip', summer: 'a summer trip', fall: 'a fall trip', winter: 'a winter trip',
  'with-kids': 'a family trip', 'with-teens': 'a trip with teens', family: 'a family trip',
  'solo-travel': 'solo travel', 'day-trips': 'day trips', food: 'a food-focused trip',
  'rainy-day': 'a rainy day', night: 'a night out', 'first-time': 'a first visit',
  'hidden-gems': 'this trip', 'luxury-travel': 'a luxury trip',
  'most-instagrammable-places': 'a photo trip', 'how-many-days': 'this trip',
  'private-tours': 'private touring', 'walking-tours': 'walking tours',
};
function topicFor(theme: string): string {
  return TOPIC[theme] ?? 'this trip';
}

/** Per-brand role openers. {city}/{topic} are filled in. Multiple variants for variety. */
const BRAND_OPENERS: Record<EditorialBrand, readonly string[]> = {
  gotript: [
    'Planning {topic} in {city}? Here’s how to decide what’s worth your time.',
    'Your {city} plan for {topic} — when to go, how long you need, and what to prioritise.',
  ],
  numiworks: [
    'The {city} experiences worth booking for {topic} — live availability, skip-the-line where it counts.',
    'Hand-picked, bookable {city} activities for {topic}.',
  ],
  stayviaowner: [
    'Planning {topic} in {city}? Where to base the group — whole-home rentals with room for everyone.',
    'Whole-home stays in {city} for {topic} — space, kitchens and privacy for the group.',
  ],
  gobookt: [
    'Where to stay in {city} for {topic} — the areas and hotels that fit.',
  ],
};

export interface EditorialMeta {
  /** <title> tag — brand-role qualified. */
  title: string;
  /** <meta description> — brand-role opener + shared family facts. */
  description: string;
  /** On-page <h1> — brand-role qualified. */
  h1: string;
  /** On-page intro paragraph — same brand-role framing as the description. */
  intro: string;
}

/**
 * Reframe an editorial page's title + meta description for `brand`.
 * @param base.heading  the shared themed-list heading (e.g. "Spring in Paris: Best Things to Do")
 * @param base.intro    the shared themed-list intro (begins with city.oneLiner)
 * @param base.oneLiner the city's shared oneLiner, stripped from the description opener
 */
export function applyEditorialVoice(
  brand: EditorialBrand,
  citySlug: string,
  cityName: string,
  theme: string,
  base: { heading: string; intro: string; oneLiner: string },
): EditorialMeta {
  const seed = fnv1a(`${brand}|${citySlug}|${theme}`);
  const opener = pick(BRAND_OPENERS[brand], seed)
    .replace('{city}', cityName)
    .replace('{topic}', topicFor(theme));
  // Keep the family facts/tail; drop the shared oneLiner opener so brands don't all
  // start with the same sentence.
  const tail = base.intro.startsWith(base.oneLiner)
    ? base.intro.slice(base.oneLiner.length).trim()
    : base.intro;
  const framedIntro = `${opener} ${tail}`.trim();
  const framedHeading = `${base.heading} — ${TITLE_TAG[brand]}`;
  return {
    title: framedHeading,
    description: framedIntro,
    h1: framedHeading,
    intro: framedIntro,
  };
}
