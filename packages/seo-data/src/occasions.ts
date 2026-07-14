/**
 * Occasion / celebration travel intents — "{occasion} in {city}" landing pages
 * (bachelorette party, family reunion, honeymoon, …). High-intent, high-value
 * (group + celebration travel books whole homes and room blocks).
 *
 * These pages are DISCOVERY-only: they belong in the sitemap (indexable) but are
 * deliberately NOT linked from any nav or homepage — the celebration/party angle
 * shouldn't sit on the family-facing brand surface. Same content is served to
 * users and crawlers (no cloaking); they're simply orphaned-by-design and found
 * via search, exactly like the query data shows ("bachelorette bucharest").
 *
 * This is a shared DATA catalog. Each brand renders its own differentiated
 * template over it (stayviaowner = whole homes, gobookt = hotels, …), so the
 * four don't produce duplicate pages.
 */

import { SEO_CITIES, findCityBySlug, type SeoCity } from './cities';

export type OccasionVibe = 'party' | 'romantic' | 'family' | 'milestone';

export interface Occasion {
  /** URL slug, e.g. 'bachelorette-party'. */
  slug: string;
  /** Display name, e.g. 'Bachelorette Party'. */
  name: string;
  vibe: OccasionVibe;
  emoji: string;
  /** Tasteful, city-agnostic one-liner. */
  tagline: string;
  /** Default group size for the outbound search. */
  groupSize: number;
  /** City-agnostic FAQs (People-Also-Ask shaped). */
  faqs: ReadonlyArray<{ q: string; a: string }>;
  /** Editorially strong cities for this occasion (prewarm + "popular"). */
  topCitySlugs: readonly string[];
}

const PARTY_CITIES = ['las-vegas', 'nashville', 'miami', 'new-orleans', 'austin', 'cancun', 'tulum', 'ibiza', 'barcelona', 'mykonos'];
const ROMANTIC_CITIES = ['santorini', 'bali', 'paris', 'venice', 'amalfi-coast', 'kyoto', 'marrakech', 'tulum', 'maldives', 'positano'];
const FAMILY_CITIES = ['orlando', 'miami', 'san-diego', 'barcelona', 'lisbon', 'rome', 'london', 'tokyo', 'cancun', 'lake-como'];

export const OCCASIONS: readonly Occasion[] = [
  {
    slug: 'bachelorette-party',
    name: 'Bachelorette Party',
    vibe: 'party',
    emoji: '👰',
    tagline: 'Get the crew under one roof and make it a weekend to remember.',
    groupSize: 8,
    topCitySlugs: PARTY_CITIES,
    faqs: [
      { q: 'How many bedrooms do we need for a bachelorette?', a: 'Plan on two guests per bedroom as a comfortable default — a group of 8 is happiest in a 4-bedroom home with a couple of shared baths. Whole-home rentals list the exact sleeping setup, so filter by bedrooms and bathrooms before you book.' },
      { q: 'Is a whole home better than hotel rooms for a bachelorette?', a: 'Usually yes: one house keeps everyone together, gives you a kitchen and living room for getting ready and pre-gaming, and often costs less per person than a block of hotel rooms. Hotels win only if you want daily housekeeping and zero cleanup.' },
      { q: 'When should we book?', a: 'For peak weekends (spring–early fall, plus any big event weekend), book 3–5 months out — the best-located, highest-rated homes go first. Mid-week and shoulder-season dates open up more choice and lower rates.' },
      { q: 'What should we look for in the listing?', a: 'A central, walkable location, enough bathrooms, clear house rules on parties/noise, and a strong review score. Always read the cancellation policy and confirm the max guest count matches your group.' },
    ],
  },
  {
    slug: 'bachelor-party',
    name: 'Bachelor Party',
    vibe: 'party',
    emoji: '🤵',
    tagline: 'One base, the whole crew, zero logistics headaches.',
    groupSize: 8,
    topCitySlugs: PARTY_CITIES,
    faqs: [
      { q: 'Whole home or hotel for a bachelor party?', a: 'A whole home keeps the group together with a kitchen, living space and often a pool or games room — and it usually beats a block of hotel rooms on price per person. Hotels are simpler for one or two nights with no cleanup.' },
      { q: 'How big a place do we need?', a: 'Budget two guests per bedroom; a group of 8 fits a 4-bedroom home comfortably. Check the exact bed configuration and bathroom count in the listing before booking.' },
      { q: 'How far ahead should we book?', a: 'For popular weekends, 3–5 months out — the best-located homes with pools and space book first. Weeknights and shoulder season are easier and cheaper.' },
      { q: 'What matters most in the listing?', a: 'Location near the action, enough bathrooms, an explicit party/noise policy, and a high review score. Read the cancellation terms and confirm the guest cap fits your group.' },
    ],
  },
  {
    slug: 'birthday-getaway',
    name: 'Birthday Getaway',
    vibe: 'milestone',
    emoji: '🎂',
    tagline: 'Mark the milestone somewhere worth traveling for.',
    groupSize: 6,
    topCitySlugs: PARTY_CITIES,
    faqs: [
      { q: "What's the best kind of stay for a milestone birthday?", a: 'For a group, a whole-home rental gives you space to gather, a kitchen for a celebratory brunch, and a living room to hang out — more memorable than separate hotel rooms. For a couple, a boutique hotel or a special suite keeps it easy.' },
      { q: 'How do I plan a surprise birthday trip?', a: 'Pick a destination with an easy transfer and a home central to the things you want to do. Book a place with a strong review score and flexible cancellation in case plans shift, and confirm the guest count fits everyone.' },
      { q: 'When should we book?', a: 'Two to four months out for weekends and holidays; the best-located homes go first. Mid-week dates give you more choice and lower prices.' },
    ],
  },
  {
    slug: 'family-reunion',
    name: 'Family Reunion',
    vibe: 'family',
    emoji: '👨‍👩‍👧‍👦',
    tagline: 'Bring everyone together — three generations, one big house.',
    groupSize: 10,
    topCitySlugs: FAMILY_CITIES,
    faqs: [
      { q: "What's the best rental for a family reunion?", a: 'A large whole-home rental — 5+ bedrooms with multiple bathrooms, a full kitchen, and shared living space — keeps everyone under one roof. Look for ground-floor bedrooms for grandparents and a yard or pool for kids.' },
      { q: 'How many bedrooms for a big family?', a: 'Plan roughly two people per bedroom, plus a sofa bed or two for kids. A group of 10–12 is comfortable in a 5–6 bedroom home with 3+ bathrooms.' },
      { q: 'How far ahead should we book a reunion?', a: 'Big homes for peak dates (summer, holidays) book 6+ months out. Lock in early and use free-cancellation listings so you can adjust the headcount as RSVPs firm up.' },
      { q: 'What amenities matter most?', a: 'A big dining table, a full kitchen, plenty of bathrooms, parking for several cars, and outdoor space. Accessibility (step-free access, a ground-floor bedroom) matters if elders are joining.' },
    ],
  },
  {
    slug: 'anniversary',
    name: 'Anniversary Getaway',
    vibe: 'romantic',
    emoji: '💞',
    tagline: 'Celebrate the years with a trip that feels like a gift.',
    groupSize: 2,
    topCitySlugs: ROMANTIC_CITIES,
    faqs: [
      { q: "What's the best stay for an anniversary?", a: 'For two, a romantic boutique hotel or a private whole-home rental with a view, a hot tub, or a great terrace makes the trip. Choose somewhere central so you can walk to dinner without a car.' },
      { q: 'How do we make it special?', a: 'Book a place with a standout feature — a plunge pool, a sea or skyline view, a fireplace — and pick a walkable neighbourhood near the restaurants and sights you want. Mention the occasion; many hosts and hotels add a small touch.' },
      { q: 'When should we book?', a: 'Two to three months ahead for weekends; sooner for peak season or a specific view. Free-cancellation listings let you hold the date and adjust if plans change.' },
    ],
  },
  {
    slug: 'honeymoon',
    name: 'Honeymoon',
    vibe: 'romantic',
    emoji: '🌺',
    tagline: 'The one trip you plan for two — make it unforgettable.',
    groupSize: 2,
    topCitySlugs: ROMANTIC_CITIES,
    faqs: [
      { q: "What's the best honeymoon stay?", a: 'Somewhere private and special: an adults-friendly boutique hotel or a whole-home villa with a pool, a view, and a walkable setting. Prioritise the location and the one feature that makes it feel like a honeymoon.' },
      { q: 'How long should a honeymoon be?', a: 'Most couples do 7–10 nights, often split between two contrasting bases (a city + a beach, say). Book the highlight nights first — the best villas and suites sell out for peak dates.' },
      { q: 'When should we book?', a: 'Three to six months out for peak-season honeymoons; the standout properties go early. Use free cancellation to hold dates while flights firm up.' },
    ],
  },
  {
    slug: 'babymoon',
    name: 'Babymoon',
    vibe: 'romantic',
    emoji: '🤰',
    tagline: 'One last calm getaway, just the two of you, before the baby.',
    groupSize: 2,
    topCitySlugs: ROMANTIC_CITIES,
    faqs: [
      { q: "What makes a good babymoon destination?", a: 'Somewhere relaxing with a short, easy transfer, good healthcare nearby, and a comfortable, well-reviewed place to stay. A whole-home rental or a calm boutique hotel with a kitchen and space to rest works well.' },
      { q: 'When in the pregnancy is best to travel?', a: 'The second trimester (roughly weeks 14–27) is usually the most comfortable window. Always follow your doctor’s advice, and pick flexible, free-cancellation bookings in case plans change.' },
      { q: 'What should we look for in the stay?', a: 'Comfort and calm over nightlife: a great bed, a kitchen for easy meals, air conditioning, and a location where you can walk to a few restaurants without a long trek.' },
    ],
  },
  {
    slug: 'girls-trip',
    name: "Girls' Trip",
    vibe: 'party',
    emoji: '💃',
    tagline: 'Round up the group and go — one house, all the memories.',
    groupSize: 6,
    topCitySlugs: PARTY_CITIES,
    faqs: [
      { q: "What's the best stay for a girls' trip?", a: 'A whole-home rental keeps the group together with a kitchen, living room and often a pool — better for hanging out than separate hotel rooms, and usually cheaper per person. Pick a central, walkable spot near the restaurants and nightlife.' },
      { q: 'How big a place do we need?', a: 'About two guests per bedroom, plus enough bathrooms so no one’s waiting. A group of 6 fits a 3-bedroom home nicely.' },
      { q: 'When should we book?', a: 'Two to four months ahead for weekends; the best-located homes book first. Mid-week and shoulder-season dates are easier and cheaper.' },
    ],
  },
  {
    slug: 'guys-trip',
    name: "Guys' Trip",
    vibe: 'party',
    emoji: '🏌️',
    tagline: 'Golf, game day, or just the crew — one base, no hassle.',
    groupSize: 6,
    topCitySlugs: PARTY_CITIES,
    faqs: [
      { q: "What's the best stay for a guys' trip?", a: 'A whole-home rental with space to spread out — a games room, a pool, a big TV — keeps the group together and beats a row of hotel rooms on price per person. Choose a central location near the courses, stadium or bars you’re there for.' },
      { q: 'How much space do we need?', a: 'Budget two guests per bedroom plus enough bathrooms; a group of 6 fits a 3-bedroom home. Check the listing’s guest cap and bed setup.' },
      { q: 'How far ahead should we book?', a: 'Three months for big event or peak weekends — homes near stadiums and golf book early. Weeknights are easier and cheaper.' },
    ],
  },
];

export function allOccasions(): readonly Occasion[] {
  return OCCASIONS;
}

export function findOccasion(slug: string): Occasion | null {
  return OCCASIONS.find((o) => o.slug === slug) ?? null;
}

const IN = '-in-';

/** A resolved occasion route. */
export interface OccasionRoute {
  occasion: Occasion;
  city: SeoCity;
}

/**
 * Parse an occasion slug `{occasion}-in-{city}` (e.g. `bachelorette-party-in-las-vegas`).
 * Occasion prefixes are matched explicitly so hyphenated occasion/city names
 * stay unambiguous. Returns null → 404.
 */
export function parseOccasionSlug(slug: string): OccasionRoute | null {
  for (const occasion of OCCASIONS) {
    const marker = `${occasion.slug}${IN}`;
    if (slug.startsWith(marker)) {
      const city = findCityBySlug(slug.slice(marker.length));
      if (city) return { occasion, city };
      return null;
    }
  }
  return null;
}

export function occasionSlug(occasion: Occasion, city: SeoCity): string {
  return `${occasion.slug}${IN}${city.slug}`;
}

/** Every occasion × city slug — for the sitemap + validation (~9 × 216). */
export function enumerateOccasionSlugs(): string[] {
  const slugs: string[] = [];
  for (const occasion of OCCASIONS) {
    for (const city of SEO_CITIES) slugs.push(`${occasion.slug}${IN}${city.slug}`);
  }
  return slugs;
}

/** Prewarm subset: each occasion's top cities. */
export function staticOccasionSlugs(): string[] {
  const slugs = new Set<string>();
  for (const occasion of OCCASIONS) {
    for (const citySlug of occasion.topCitySlugs) {
      if (findCityBySlug(citySlug)) slugs.add(`${occasion.slug}${IN}${citySlug}`);
    }
  }
  return [...slugs];
}

/** Other occasions for the same city (sibling links). */
export function siblingOccasions(route: OccasionRoute, limit = 6): OccasionRoute[] {
  return OCCASIONS.filter((o) => o.slug !== route.occasion.slug)
    .slice(0, limit)
    .map((o) => ({ occasion: o, city: route.city }));
}
