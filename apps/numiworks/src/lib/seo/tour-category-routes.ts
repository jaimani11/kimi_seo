/**
 * numiworks-LOCAL tour-category route matrix — per-city × experience-type
 * pages with a Viator angle (cooking classes, food-free bookable tours,
 * boat tours, ski lessons…), plus a VRBO "where to stay" secondary.
 *
 * This is deliberately NOT part of the shared @adored/seo-routing
 * enumerator, and it deliberately targets ONLY the Viator categories the
 * shared themed matrix (food / day-trips / private-tours / walking-tours,
 * mounted on the root `/[slug]` route) does NOT already publish. That
 * keeps numiworks from duplicating its own pages, and gives it a bookable-
 * experience long-tail that gotript (Expedia things-to-do) and
 * stayviaowner (VRBO rentals) structurally never emit.
 *
 * URL scheme (mounted at /tours/[slug]):
 *   /tours/{category}-in-{city}   → "{Category} in {City}"   (facet page)
 *
 * e.g. /tours/cooking-classes-in-rome, /tours/snorkeling-and-diving-in-maui
 *
 * These link UP to the shared `/things-to-do-in-{city}` guide as their
 * parent rather than competing with it. A couple of climate-bound types
 * (snorkeling, ski lessons) are gated to curated city sets so we never
 * publish "ski lessons in Bali".
 */

import { SEO_CITIES, findCityBySlug, type SeoCity } from '@lib/seo/cities';

// ── taxonomy ─────────────────────────────────────────────────────────

export interface TourCategory {
  /** URL slug fragment, e.g. "cooking-classes". */
  slug: string;
  /** Display name, e.g. "Cooking Classes". */
  name: string;
  /** Singular noun for prose, e.g. "cooking class". */
  singular: string;
  emoji: string;
  /** The Viator search seed; combined with the city → "cooking class Rome". */
  searchTerm: string;
  /** One-line pitch for tiles + sibling links. */
  tagline: string;
  /** The one-sentence thesis for this category, woven into body copy. */
  angle: string;
  /** Short "what to know" chips, specific to this category. */
  lookFor: readonly string[];
  /** Category-specific FAQs (a city FAQ is generated on top of these). */
  faqs: ReadonlyArray<{ q: string; a: string }>;
  /** Editorial best-fit cities — prewarm subset + same-category city links. */
  topCitySlugs: readonly string[];
}

export const TOUR_CATEGORIES: readonly TourCategory[] = [
  {
    slug: 'cooking-classes',
    name: 'Cooking Classes',
    singular: 'cooking class',
    emoji: '🍳',
    searchTerm: 'cooking class',
    tagline: 'Learn the local dishes from a local cook',
    angle:
      'A cooking class is the tastiest souvenir — you come home able to make the thing you fell for, and you spend the afternoon with someone who actually lives there.',
    lookFor: ['Market visit included', 'Small group sizes', 'Hands-on, not demo-only', 'Eat what you cook'],
    faqs: [
      {
        q: 'Do cooking classes include a market tour?',
        a: 'Many of the best ones start at a local market to pick ingredients, then cook. It’s usually noted in the Viator listing — filter for it if that’s the experience you want, and check the duration so you know whether lunch or dinner is included.',
      },
      {
        q: 'Are cooking classes good for dietary restrictions?',
        a: 'Most hosts can adapt for vegetarian, vegan or allergy needs if you tell them ahead. Message the operator through Viator after booking to confirm before you turn up.',
      },
    ],
    topCitySlugs: ['rome', 'florence', 'bangkok', 'oaxaca', 'marrakech', 'hoi-an', 'bologna', 'lima'],
  },
  {
    slug: 'wine-tasting',
    name: 'Wine Tasting',
    singular: 'wine tasting',
    emoji: '🍷',
    searchTerm: 'wine tasting',
    tagline: 'Cellar visits and vineyard afternoons',
    angle:
      'A wine tasting is the easy way into a region’s food and land in one glass — a cellar visit, a few pours with someone who knows them, and often a vineyard view to go with it.',
    lookFor: ['Cellar or vineyard visit', 'Guided by a sommelier', 'Transport / round-trip included', 'Food pairing'],
    faqs: [
      {
        q: 'Should I book a wine tour with transport?',
        a: 'If you’re tasting more than one or two wines, yes — a tour with round-trip transport means no one has to drive. Viator listings say whether hotel pickup is included; it’s worth it for vineyard trips outside the city.',
      },
      {
        q: 'How long does a wine tasting take?',
        a: 'In-city cellar tastings run 1–2 hours; full vineyard day trips run 6–8. Pick by how much of the day you want to give it — both are on Viator with the duration listed up front.',
      },
    ],
    topCitySlugs: ['florence', 'porto', 'cape-town', 'mendoza', 'santiago', 'barcelona', 'lisbon', 'bordeaux'],
  },
  {
    slug: 'bike-tours',
    name: 'Bike Tours',
    singular: 'bike tour',
    emoji: '🚴',
    searchTerm: 'bike tour',
    tagline: 'See more of the city on two wheels',
    angle:
      'A bike tour covers three times the ground of a walking tour and still stops for the good bits — the fastest way to get the shape of a new city on day one.',
    lookFor: ['Bike & helmet provided', 'E-bike option for hills', 'Small group & easy pace', 'Quiet routes, not traffic'],
    faqs: [
      {
        q: 'Do I need to be fit for a bike tour?',
        a: 'Most city bike tours are easy-paced on flat routes with plenty of stops. If a city is hilly, look for the e-bike option on Viator — it flattens the climbs so anyone can keep up.',
      },
      {
        q: 'Are bikes and helmets included?',
        a: 'Almost always — the bike, helmet and often a basket or phone mount come with the tour. The listing on Viator spells out what’s provided and the minimum age.',
      },
    ],
    topCitySlugs: ['amsterdam', 'copenhagen', 'berlin', 'kyoto', 'paris', 'barcelona', 'vienna', 'ho-chi-minh-city'],
  },
  {
    slug: 'hop-on-hop-off-tours',
    name: 'Hop-On Hop-Off Tours',
    singular: 'hop-on hop-off tour',
    emoji: '🚌',
    searchTerm: 'hop on hop off',
    tagline: 'One ticket, every major sight',
    angle:
      'A hop-on hop-off bus is the low-effort way to knit a big city’s sights together — ride the loop to get your bearings, then jump off wherever you want to stay a while.',
    lookFor: ['Multi-day ticket options', 'Open-top for the views', 'Audio guide onboard', 'Stops at the main sights'],
    faqs: [
      {
        q: 'Is a hop-on hop-off ticket worth it?',
        a: 'For a first visit to a spread-out city, yes — it doubles as transport between the big sights and an orientation tour. Compare the 24- vs 48-hour ticket on Viator; the longer one often costs only a little more per day.',
      },
      {
        q: 'How often do the buses run?',
        a: 'Typically every 15–30 minutes on the main loop, less often on secondary routes. The frequency and the route map are on the Viator listing so you can plan around it.',
      },
    ],
    topCitySlugs: ['london', 'new-york', 'paris', 'rome', 'barcelona', 'dubai', 'singapore', 'sydney'],
  },
  {
    slug: 'skip-the-line-tickets',
    name: 'Skip-the-Line Tickets',
    singular: 'skip-the-line ticket',
    emoji: '🎫',
    searchTerm: 'skip the line',
    tagline: 'Walk past the queue at the big sights',
    angle:
      'For the famous sights, the queue is the trip’s biggest time-sink — a skip-the-line ticket buys back the hour you’d spend standing in it, often for only a few dollars more.',
    lookFor: ['Timed entry slot', 'Mobile ticket', 'Guided or self-guided', 'Includes the main highlights'],
    faqs: [
      {
        q: 'Do skip-the-line tickets really skip the whole queue?',
        a: 'They skip the ticket-buying line, which is the long one, via a timed-entry slot; a short security line may remain. For the busiest sights it still saves the most time of anything you can book — reserve the earliest slot for the smallest crowds.',
      },
      {
        q: 'How far ahead should I book?',
        a: 'For headline sights in peak season, days to weeks ahead — popular time slots sell out. Viator shows live availability, and mobile tickets mean nothing to print.',
      },
    ],
    topCitySlugs: ['rome', 'paris', 'barcelona', 'florence', 'vatican-city', 'london', 'amsterdam', 'athens'],
  },
  {
    slug: 'photography-tours',
    name: 'Photography Tours',
    singular: 'photography tour',
    emoji: '📸',
    searchTerm: 'photography tour',
    tagline: 'A local shows you the best light and angles',
    angle:
      'A photography tour is part guided walk, part masterclass — a local takes you to the shots you’d never find and the light that makes them, whether you shoot on a phone or a full rig.',
    lookFor: ['Sunrise / golden-hour timing', 'Hidden viewpoints', 'Phone or DSLR welcome', 'Small group or private'],
    faqs: [
      {
        q: 'Do I need a professional camera?',
        a: 'No — most photography tours welcome phone shooters and will help you get more out of whatever you carry. If you want technical coaching, pick a listing that mentions camera settings and book it private.',
      },
      {
        q: 'When’s the best time for a photo tour?',
        a: 'Golden hour — just after sunrise or before sunset — gives the best light and the thinnest crowds. Many Viator photo tours are timed for exactly that; check the start time before you book.',
      },
    ],
    topCitySlugs: ['santorini', 'kyoto', 'venice', 'paris', 'prague', 'cappadocia', 'marrakech', 'reykjavik'],
  },
  {
    slug: 'boat-tours',
    name: 'Boat Tours',
    singular: 'boat tour',
    emoji: '⛵',
    searchTerm: 'boat tour',
    tagline: 'See the city or coast from the water',
    angle:
      'A boat tour gives you the view the city was built for — a river cruise past the landmarks, a canal loop, or a coastal sail to a swim stop, all from the best seat in the house.',
    lookFor: ['River, canal or sea route', 'Sunset departures', 'Small boat or big cruiser', 'Drinks / swim stops'],
    faqs: [
      {
        q: 'What’s the best time for a boat tour?',
        a: 'Sunset trips are the most popular for the light and the cooler air, so book those ahead. Daytime departures are quieter and better for sightseeing photos — both are on Viator with the route and duration listed.',
      },
      {
        q: 'Are boat tours suitable for kids?',
        a: 'Most river and canal cruises are family-friendly and calm; open-water sailing trips can be choppier. The listing notes the minimum age and whether life jackets are provided.',
      },
    ],
    topCitySlugs: ['amsterdam', 'venice', 'paris', 'budapest', 'dubrovnik', 'halong-bay', 'prague', 'stockholm'],
  },
  {
    slug: 'hiking-tours',
    name: 'Hiking Tours',
    singular: 'hiking tour',
    emoji: '🥾',
    searchTerm: 'hiking tour',
    tagline: 'Guided day hikes and nature trails',
    angle:
      'A guided hike gets you to the trailhead, the viewpoint and the local knowledge without the logistics — the walk everyone means to do, sorted in one booking.',
    lookFor: ['Guide & transport included', 'Graded by difficulty', 'Small group', 'Gear / poles provided'],
    faqs: [
      {
        q: 'How do I pick a hike at the right difficulty?',
        a: 'Viator grades hikes easy / moderate / challenging and lists distance and elevation gain. Match it honestly to your group — a guided moderate hike is far more enjoyable than an over-ambitious one, and the guide handles the route-finding either way.',
      },
      {
        q: 'What should I bring on a hiking tour?',
        a: 'Broken-in shoes, water, sun protection and layers; many tours provide poles and a pack. The listing tells you what’s included and what to carry, and whether hotel pickup is part of it.',
      },
    ],
    topCitySlugs: ['queenstown', 'interlaken', 'reykjavik', 'cape-town', 'banff', 'cinque-terre', 'madeira', 'chamonix'],
  },
  {
    slug: 'snorkeling-and-diving',
    name: 'Snorkeling & Diving',
    singular: 'snorkeling trip',
    emoji: '🤿',
    searchTerm: 'snorkeling',
    tagline: 'Reefs, wrecks and clear-water swims',
    angle:
      'Snorkeling and diving turn a beach day into the main event — a boat out to the reef, gear that fits, and a guide who knows where the turtles are.',
    lookFor: ['Gear & guide included', 'Reef or wreck sites', 'Beginner or certified', 'Boat trip to the best spots'],
    faqs: [
      {
        q: 'Do I need to be able to dive to join?',
        a: 'For snorkeling, no — if you can swim, you can join, and many trips welcome first-timers. For scuba, look for a “discover diving” or PADI intro listing on Viator if you’re not certified; certified divers can filter for guided fun dives.',
      },
      {
        q: 'Is equipment provided?',
        a: 'Almost always — mask, fins and snorkel (and full scuba kit on dive trips) come with the tour, along with a guide and usually the boat. The listing spells out what’s included and the minimum age.',
      },
    ],
    topCitySlugs: ['maldives', 'phuket', 'cairns', 'okinawa', 'sharm-el-sheikh', 'el-nido', 'maui', 'cancun'],
  },
  {
    slug: 'ski-and-snowboard-lessons',
    name: 'Ski & Snowboard Lessons',
    singular: 'ski lesson',
    emoji: '⛷️',
    searchTerm: 'ski lesson',
    tagline: 'Instructors, lift passes and gear sorted',
    angle:
      'A booked ski or snowboard lesson is the fast track to actually enjoying the mountain — an instructor for your level, and often the lift pass and gear rental bundled in.',
    lookFor: ['Beginner to advanced', 'Group or private instructor', 'Gear rental option', 'Lift-pass bundles'],
    faqs: [
      {
        q: 'Are lessons only for beginners?',
        a: 'No — instructors take everyone from first-timers to advanced skiers looking to refine technique or tackle off-piste. Pick your level on the Viator listing so the group matches your ability.',
      },
      {
        q: 'Is gear included with a ski lesson?',
        a: 'Sometimes — some listings bundle skis, boots and a lift pass; others are instruction-only. Check the inclusions before booking, and reserve early in peak season when instructors get booked out.',
      },
    ],
    topCitySlugs: ['zermatt', 'st-moritz', 'whistler', 'banff', 'queenstown', 'sapporo', 'innsbruck', 'grindelwald'],
  },
];

const TOUR_CATEGORY_BY_SLUG: ReadonlyMap<string, TourCategory> = new Map(
  TOUR_CATEGORIES.map((c) => [c.slug, c]),
);

export function findTourCategory(slug: string): TourCategory | null {
  return TOUR_CATEGORY_BY_SLUG.get(slug) ?? null;
}

// ── terrain gating ───────────────────────────────────────────────────

/**
 * numiworks has no accommodation-categories to seed from (gobookt/
 * stayviaowner do), so these two sets are curated here from the real
 * SEO_CITIES catalog. Only cities with genuine sea access get snorkeling;
 * only cities with genuine ski terrain get ski lessons. Any slug not in
 * SEO_CITIES is simply never matched (harmless), and a coastal/alpine
 * city missing from a set just doesn't publish that one category.
 */
const COASTAL_CITY_SLUGS: ReadonlySet<string> = new Set([
  'hoi-an', 'phuket', 'da-nang', 'penang', 'boracay', 'maldives', 'pattaya', 'goa', 'busan',
  'barcelona', 'nice', 'dubrovnik', 'split', 'valencia', 'cinque-terre', 'mykonos', 'ibiza',
  'mallorca', 'crete', 'rhodes', 'corfu', 'positano', 'malaga', 'san-sebastian',
  'los-angeles', 'san-diego', 'cancun', 'tulum', 'playa-del-carmen', 'puerto-vallarta',
  'rio-de-janeiro', 'cartagena', 'honolulu', 'maui', 'tel-aviv', 'muscat', 'zanzibar',
  'mauritius', 'sydney', 'gold-coast', 'brisbane', 'perth', 'cairns', 'el-nido', 'bora-bora',
  'sharm-el-sheikh', 'okinawa', 'jeju', 'koh-samui', 'langkawi', 'cebu',
]);

const MOUNTAIN_CITY_SLUGS: ReadonlySet<string> = new Set([
  'sapporo', 'munich', 'zurich', 'krakow', 'salzburg', 'lucerne', 'lauterbrunnen',
  'grindelwald', 'zermatt', 'st-moritz', 'wengen', 'hallstatt', 'innsbruck', 'interlaken',
  'vancouver', 'montreal', 'seattle', 'banff', 'denver', 'whistler', 'queenstown',
  'santiago', 'ushuaia', 'chamonix',
]);

const TERRAIN_GATE: Record<string, ReadonlySet<string>> = {
  'snorkeling-and-diving': COASTAL_CITY_SLUGS,
  'ski-and-snowboard-lessons': MOUNTAIN_CITY_SLUGS,
};

/** Whether a category × city pair is worth publishing (terrain sanity). */
export function isTourPairEligible(category: TourCategory, city: SeoCity): boolean {
  const gate = TERRAIN_GATE[category.slug];
  return gate ? gate.has(city.slug) : true;
}

// ── routing ──────────────────────────────────────────────────────────

export interface TourCategoryRoute {
  category: TourCategory;
  city: SeoCity;
}

const IN = '-in-';

/**
 * Parse a /tours/[slug] slug into a route, or null (→ 404). The category
 * prefix is matched explicitly (not by splitting on "-in-") so slugs whose
 * category or city contains hyphens stay unambiguous.
 */
export function parseTourCategorySlug(slug: string): TourCategoryRoute | null {
  for (const category of TOUR_CATEGORIES) {
    const marker = `${category.slug}${IN}`;
    if (slug.startsWith(marker)) {
      const citySlug = slug.slice(marker.length);
      const city = findCityBySlug(citySlug);
      if (city && isTourPairEligible(category, city)) return { category, city };
      return null; // known category prefix but bad/ineligible city → 404
    }
  }
  return null;
}

/** The slug (no /tours/ prefix) for a route. */
export function tourCategorySlug(category: TourCategory, city: SeoCity): string {
  return `${category.slug}${IN}${city.slug}`;
}

/** Every eligible slug — the full matrix, for the sitemap. */
export function enumerateTourCategorySlugs(): string[] {
  const slugs: string[] = [];
  for (const city of SEO_CITIES) {
    for (const category of TOUR_CATEGORIES) {
      if (isTourPairEligible(category, city)) slugs.push(tourCategorySlug(category, city));
    }
  }
  return slugs;
}

/**
 * The subset to statically prerender at build time: each category's
 * editorially-chosen top cities. The long tail renders on-demand (ISR).
 */
export function staticTourCategorySlugs(): string[] {
  const slugs = new Set<string>();
  for (const category of TOUR_CATEGORIES) {
    for (const citySlug of category.topCitySlugs) {
      const city = findCityBySlug(citySlug);
      if (city && isTourPairEligible(category, city)) slugs.add(tourCategorySlug(category, city));
    }
  }
  return [...slugs];
}

// ── internal-linking helpers ─────────────────────────────────────────

/** Other experience categories available in the same city (sibling links). */
export function siblingCategoryLinks(
  city: SeoCity,
  currentSlug: string,
  limit = 7,
): { label: string; href: string; emoji: string; tagline: string }[] {
  return TOUR_CATEGORIES.filter((c) => c.slug !== currentSlug && isTourPairEligible(c, city))
    .slice(0, limit)
    .map((c) => ({
      label: `${c.name} in ${city.name}`,
      href: `/tours/${tourCategorySlug(c, city)}`,
      emoji: c.emoji,
      tagline: c.tagline,
    }));
}

/** The same category in its other top cities. */
export function sameCategoryCityLinks(
  category: TourCategory,
  currentCitySlug: string,
  limit = 8,
): { label: string; href: string; oneLiner: string }[] {
  const out: { label: string; href: string; oneLiner: string }[] = [];
  for (const citySlug of category.topCitySlugs) {
    if (citySlug === currentCitySlug) continue;
    const city = findCityBySlug(citySlug);
    if (!city || !isTourPairEligible(category, city)) continue;
    out.push({
      label: `${category.name} in ${city.name}`,
      href: `/tours/${tourCategorySlug(category, city)}`,
      oneLiner: city.oneLiner,
    });
    if (out.length >= limit) break;
  }
  return out;
}
