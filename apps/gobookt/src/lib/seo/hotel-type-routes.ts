/**
 * gobookt-LOCAL hotel-facet route matrix — per-city × hotel-type pages
 * with a Booking.com angle.
 *
 * This is deliberately NOT part of the shared @adored/seo-routing
 * enumerator, and it deliberately targets ONLY the hotel facets the
 * shared `hotels-themed` matrix (boutique / luxury / family / beach /
 * best / cheap / pet-friendly / apartments, mounted on the root
 * `/[slug]` route) does NOT already publish. That keeps gobookt from
 * duplicating its own pages, and gives it a hotel long-tail that
 * gotript (the Expedia itineraries brand) structurally never emits.
 *
 * URL scheme (mounted at /hotels/[slug]):
 *   /hotels/{type}-in-{city}   → "{Type} in {City}"   (facet page)
 *
 * e.g. /hotels/spa-hotels-in-budapest, /hotels/adults-only-hotels-in-ibiza
 *
 * There is no city hub here on purpose — the shared `/hotels-in-{city}`
 * page already owns that keyword, so these facet pages link UP to it as
 * their parent rather than competing with it.
 *
 * Eligibility: most types render for every city; a couple of
 * climate-bound types (all-inclusive resorts, ski hotels) are gated to
 * curated city sets so we never publish "ski hotels in Santorini".
 */

import { SEO_CITIES, findCityBySlug, type SeoCity } from '@lib/seo/cities';
import { findAccommodationCategory } from '@lib/seo/accommodation-categories';

// ── taxonomy ─────────────────────────────────────────────────────────

export interface HotelType {
  /** URL slug fragment, e.g. "spa-hotels". */
  slug: string;
  /** Display name, e.g. "Spa Hotels". */
  name: string;
  /** Singular noun for prose, e.g. "spa hotel". */
  singular: string;
  emoji: string;
  /** One-line pitch for tiles + sibling links. */
  tagline: string;
  /** The one-sentence thesis for this facet, woven into body copy. */
  angle: string;
  /** Short "what to look for" chips, specific to this facet. */
  lookFor: readonly string[];
  /** Facet-specific FAQs (city FAQ is generated on top of these). */
  faqs: ReadonlyArray<{ q: string; a: string }>;
  /** Editorial best-fit cities — prewarm subset + same-type city links. */
  topCitySlugs: readonly string[];
}

export const HOTEL_TYPES: readonly HotelType[] = [
  {
    slug: 'spa-hotels',
    name: 'Spa Hotels',
    singular: 'spa hotel',
    emoji: '💆',
    tagline: 'Thermal baths, saunas and treatments on site',
    angle:
      'A spa hotel turns the stay itself into the trip — thermal pools, a sauna circuit, and a massage you can walk to in a robe.',
    lookFor: ['On-site spa & sauna', 'Indoor / thermal pool', 'Massage & treatments', 'Adult quiet hours'],
    faqs: [
      {
        q: 'Are the spa facilities free for hotel guests?',
        a: 'At most spa hotels, the pool, sauna and steam room are included for guests; individual treatments (massages, facials) are booked and paid separately. On Booking.com, check the property’s facilities list and guest photos before you book, and reserve popular treatments ahead.',
      },
      {
        q: 'How do I find a hotel with a real spa, not just a "wellness corner"?',
        a: 'Filter for a spa on Booking.com, then read recent guest reviews for words like sauna, thermal, hammam or treatment menu — verified reviews are the fastest way to tell a full spa from a token gym-and-hot-tub.',
      },
    ],
    topCitySlugs: ['budapest', 'reykjavik', 'bath', 'tokyo', 'bangkok', 'marrakech', 'istanbul', 'bali'],
  },
  {
    slug: 'business-hotels',
    name: 'Business Hotels',
    singular: 'business hotel',
    emoji: '💼',
    tagline: 'Fast Wi-Fi, work desks and easy transit',
    angle:
      'A good business hotel disappears into the background of a work trip — reliable Wi-Fi, a proper desk, a fast route to the office or airport, and a breakfast you can grab early.',
    lookFor: ['Fast, reliable Wi-Fi', 'In-room work desk', 'Near transit & airport', 'Early breakfast / express checkout'],
    faqs: [
      {
        q: 'Which area is best to stay for a business trip?',
        a: 'Pick the district closest to your meetings, then check the transit links from there. Central, well-connected neighbourhoods cost a little more but save time and taxi fares — Booking.com’s map view lets you see exactly how far each hotel is from where you need to be.',
      },
      {
        q: 'Do business hotels offer late checkout?',
        a: 'Many do, especially for members of the hotel’s loyalty programme or Booking.com Genius travellers. It’s rarely guaranteed — message the property after booking to request it, and confirm again at check-in.',
      },
    ],
    topCitySlugs: ['singapore', 'hong-kong', 'tokyo', 'london', 'new-york', 'dubai', 'shanghai', 'seoul'],
  },
  {
    slug: 'romantic-hotels',
    name: 'Romantic Hotels',
    singular: 'romantic hotel',
    emoji: '💕',
    tagline: 'Views, suites and privacy for two',
    angle:
      'A romantic hotel is really about the small things — a view worth waking up to, a quiet terrace, dinner you don’t have to leave for, and a room that feels like a treat.',
    lookFor: ['Rooms with a view', 'Couples’ suites', 'On-site fine dining', 'Calm, adult-friendly setting'],
    faqs: [
      {
        q: 'How do I book a room with the best view?',
        a: 'View rooms are usually a named room type on Booking.com (“sea view”, “city view”) rather than a request — book that exact room type to guarantee it, and add a note for a high floor. Guest photos are the honest check on how good the view really is.',
      },
      {
        q: 'Is it worth paying more for a romantic hotel?',
        a: 'For an anniversary, honeymoon or special weekend, the setting is a big part of the memory, so a step up in room or location often earns its keep. Book a free-cancellation rate early to lock the best room, then keep watching for a better deal.',
      },
    ],
    topCitySlugs: ['paris', 'venice', 'santorini', 'kyoto', 'prague', 'florence'],
  },
  {
    slug: 'adults-only-hotels',
    name: 'Adults-Only Hotels',
    singular: 'adults-only hotel',
    emoji: '🍸',
    tagline: 'Grown-up calm — quiet pools, late bars, no kids',
    angle:
      'Adults-only hotels trade the kids’ club for calm — quiet pools, a proper cocktail bar, and the kind of unhurried evening a couples’ or friends’ trip is booked for.',
    lookFor: ['18+ guests only', 'Quiet adult pools', 'Late-night bar', 'Couples & friends'],
    faqs: [
      {
        q: 'What age counts as "adults-only"?',
        a: 'Most adults-only hotels set the minimum at 16 or 18 — the exact age is on the property’s policy on Booking.com, so check it before booking if it matters for your group.',
      },
      {
        q: 'Are adults-only hotels just for couples?',
        a: 'Not at all — they’re popular with friends’ trips, solo travellers and anyone who wants a calmer, quieter stay. The common thread is atmosphere, not who you travel with.',
      },
    ],
    topCitySlugs: ['ibiza', 'cancun', 'tulum', 'mykonos', 'phuket', 'bali'],
  },
  {
    slug: 'hotels-with-a-pool',
    name: 'Hotels with a Pool',
    singular: 'hotel with a pool',
    emoji: '🏊',
    tagline: 'Rooftop, indoor and resort pools to cool off',
    angle:
      'Sometimes the pool is the plan — a rooftop dip at sunset, a resort pool for the kids, or a heated indoor lane when the weather turns.',
    lookFor: ['Rooftop or resort pool', 'Heated / indoor option', 'Sun loungers & poolside bar', 'Kids’ & adult pools'],
    faqs: [
      {
        q: 'How can I tell if the pool is heated or open year-round?',
        a: 'Booking.com lists pool details under facilities (outdoor, indoor, heated, seasonal). Seasonal outdoor pools often close in winter, so if the pool is the point, filter for an indoor or heated one and confirm the dates in recent reviews.',
      },
      {
        q: 'Is a rooftop pool worth it?',
        a: 'For the view and the sunset, yes — but rooftop pools are often small and busy at peak hours. Check guest photos for the real size, and go early or late for space.',
      },
    ],
    topCitySlugs: ['dubai', 'bangkok', 'singapore', 'bali', 'miami', 'marrakech'],
  },
  {
    slug: 'hostels',
    name: 'Hostels',
    singular: 'hostel',
    emoji: '🎒',
    tagline: 'Social, low-cost beds — dorms and private rooms',
    angle:
      'A good hostel is the cheapest way to stay central and the fastest way to meet people — and most now offer private rooms too, so you can have the social common room without the bunk.',
    lookFor: ['Dorm beds & private rooms', 'Social common areas', 'Self-catering kitchen', 'Central locations'],
    faqs: [
      {
        q: 'Do hostels have private rooms, or only dorms?',
        a: 'Most modern hostels offer both — mixed and female dorms plus private singles, doubles and family rooms with the same social vibe and kitchen. Filter Booking.com for “private room” if you want your own space at hostel prices.',
      },
      {
        q: 'Are hostels only for young backpackers?',
        a: 'Not any more — flashpackers, solo travellers, couples and even families use hostels for the price, the location and the social side. Read recent reviews to gauge whether a given hostel skews party or quiet.',
      },
    ],
    topCitySlugs: ['bangkok', 'lisbon', 'prague', 'budapest', 'berlin', 'amsterdam'],
  },
  {
    slug: 'eco-friendly-hotels',
    name: 'Eco-Friendly Hotels',
    singular: 'eco-friendly hotel',
    emoji: '🌿',
    tagline: 'Lower-impact stays with real green credentials',
    angle:
      'An eco-friendly hotel is one where the sustainability is built in, not bolted on — renewable energy, less waste, local sourcing, and a light footprint you can actually verify.',
    lookFor: ['Recognised eco certification', 'Renewable energy / low waste', 'Locally sourced dining', 'Refill & no-single-use'],
    faqs: [
      {
        q: 'How do I know a hotel is genuinely eco-friendly and not greenwashing?',
        a: 'Look for a recognised third-party certification (Green Key, EarthCheck, LEED) on the property page, and read reviews for specifics — solar, water refill stations, no single-use plastics. Booking.com also flags verified sustainability practices on many listings.',
      },
      {
        q: 'Do eco hotels cost more?',
        a: 'Not necessarily — many are priced like their conventional neighbours, and some save you money with refill stations and local dining. The premium, where it exists, tends to be at design-led eco-lodges rather than city hotels.',
      },
    ],
    topCitySlugs: ['reykjavik', 'queenstown', 'bali', 'ljubljana', 'oslo', 'vancouver'],
  },
  {
    slug: 'rooftop-bar-hotels',
    name: 'Hotels with a Rooftop Bar',
    singular: 'hotel with a rooftop bar',
    emoji: '🍹',
    tagline: 'Sunset drinks and skyline views upstairs',
    angle:
      'A rooftop bar turns the hotel into a destination of its own — a sundowner over the skyline without leaving the building, and often a pool deck to go with it.',
    lookFor: ['Rooftop bar & terrace', 'Skyline / sunset views', 'Pool deck option', 'Central location'],
    faqs: [
      {
        q: 'Is the rooftop bar open to hotel guests only?',
        a: 'It varies — some are guests-only, many are open to the public (great buzz, but busier at sunset). If a quiet drink matters, check reviews for how crowded the rooftop gets and whether guests get priority.',
      },
      {
        q: 'Which floor gives the best view?',
        a: 'The rooftop itself is usually the draw, but a high-floor room on the same side can give you the same skyline privately. Book a named “high floor” or “view” room type on Booking.com rather than leaving it to chance.',
      },
    ],
    topCitySlugs: ['bangkok', 'new-york', 'dubai', 'singapore', 'barcelona', 'hong-kong'],
  },
  {
    slug: 'all-inclusive-resorts',
    name: 'All-Inclusive Resorts',
    singular: 'all-inclusive resort',
    emoji: '🌴',
    tagline: 'Meals, drinks and activities in one price',
    angle:
      'All-inclusive is about not thinking about the bill — meals, drinks and most activities folded into one upfront price, usually a step from the beach.',
    lookFor: ['Meals & drinks included', 'Beachfront setting', 'Pools & activities', 'Family or adults-only'],
    faqs: [
      {
        q: 'What does "all-inclusive" actually cover?',
        a: 'Typically all meals, standard drinks and most on-site activities; premium spirits, spa treatments and off-site trips usually cost extra. The exact inclusions are listed on each resort’s Booking.com page — read them, because they vary a lot between properties.',
      },
      {
        q: 'Are all-inclusive resorts good value?',
        a: 'For families and anyone who’ll use the restaurants and bars, yes — the maths works when you’d otherwise eat out three times a day. If you plan to explore and eat locally, a room-only or B&B rate can be better value.',
      },
    ],
    topCitySlugs: ['cancun', 'tulum', 'phuket', 'mallorca', 'boracay', 'zanzibar'],
  },
  {
    slug: 'ski-hotels',
    name: 'Ski Hotels',
    singular: 'ski hotel',
    emoji: '🎿',
    tagline: 'Slope-side stays with boot rooms and après-ski',
    angle:
      'A ski hotel is measured in minutes to the lift — ski-in ski-out if you can, a warm boot room, and an après-ski bar to end the day at.',
    lookFor: ['Near the lifts / ski-in ski-out', 'Ski & boot storage', 'Après-ski bar', 'Spa after the slopes'],
    faqs: [
      {
        q: 'What does "ski-in ski-out" really mean?',
        a: 'That you can ski directly to and from the hotel door without a shuttle or walk. It commands a premium; if it’s outside budget, look for hotels within a short walk of a lift or on the free ski-bus route — the map view on Booking.com makes the distance clear.',
      },
      {
        q: 'When should I book a ski hotel?',
        a: 'Early — slope-side rooms in peak weeks (Christmas, February half-term) sell out months ahead. Book a free-cancellation rate as soon as your dates are set, then watch for better deals closer to the season.',
      },
    ],
    topCitySlugs: ['zermatt', 'st-moritz', 'grindelwald', 'whistler', 'banff', 'queenstown'],
  },
];

const HOTEL_TYPE_BY_SLUG: ReadonlyMap<string, HotelType> = new Map(
  HOTEL_TYPES.map((t) => [t.slug, t]),
);

export function findHotelType(slug: string): HotelType | null {
  return HOTEL_TYPE_BY_SLUG.get(slug) ?? null;
}

// ── terrain gating ───────────────────────────────────────────────────

/**
 * A couple of facets only make sense in a specific geography. We seed
 * the eligible-city sets from the existing accommodation categories'
 * editorial `topCitySlugs` (which already encode where beach/ski stays
 * belong), so the gate stays in sync with the rest of the app instead
 * of hardcoding a second list.
 */
function seedCitySet(categorySlugs: readonly string[]): ReadonlySet<string> {
  const set = new Set<string>();
  for (const slug of categorySlugs) {
    const category = findAccommodationCategory(slug);
    if (category) for (const citySlug of category.topCitySlugs) set.add(citySlug);
  }
  return set;
}

const COASTAL_CITIES = seedCitySet([
  'beach-houses',
  'beach-villas',
  'villas',
  'luxury-villas',
  'private-pool-villas',
]);
const MOUNTAIN_CITIES = seedCitySet(['ski-lodges', 'chalets', 'cabins', 'lake-houses']);

const TERRAIN_GATE: Record<string, ReadonlySet<string>> = {
  'all-inclusive-resorts': COASTAL_CITIES,
  'ski-hotels': MOUNTAIN_CITIES,
};

/** Whether a hotel-type × city pair is worth publishing (terrain sanity). */
export function isHotelPairEligible(type: HotelType, city: SeoCity): boolean {
  const gate = TERRAIN_GATE[type.slug];
  return gate ? gate.has(city.slug) : true;
}

// ── routing ──────────────────────────────────────────────────────────

export interface HotelTypeRoute {
  type: HotelType;
  city: SeoCity;
}

const IN = '-in-';

/**
 * Parse a /hotels/[slug] slug into a route, or null (→ 404). The
 * type prefix is matched explicitly (not by splitting on "-in-") so
 * slugs whose type or city contains hyphens stay unambiguous.
 */
export function parseHotelTypeSlug(slug: string): HotelTypeRoute | null {
  for (const type of HOTEL_TYPES) {
    const marker = `${type.slug}${IN}`;
    if (slug.startsWith(marker)) {
      const citySlug = slug.slice(marker.length);
      const city = findCityBySlug(citySlug);
      if (city && isHotelPairEligible(type, city)) return { type, city };
      return null; // known type prefix but bad/ineligible city → 404
    }
  }
  return null;
}

/** The slug (no /hotels/ prefix) for a route. */
export function hotelTypeSlug(type: HotelType, city: SeoCity): string {
  return `${type.slug}${IN}${city.slug}`;
}

/** Every eligible slug — the full matrix, for the sitemap. */
export function enumerateHotelTypeSlugs(): string[] {
  const slugs: string[] = [];
  for (const city of SEO_CITIES) {
    for (const type of HOTEL_TYPES) {
      if (isHotelPairEligible(type, city)) slugs.push(hotelTypeSlug(type, city));
    }
  }
  return slugs;
}

/**
 * The subset to statically prerender at build time: each type's
 * editorially-chosen top cities. The long tail renders on-demand (ISR)
 * on first request and is cached thereafter.
 */
export function staticHotelTypeSlugs(): string[] {
  const slugs = new Set<string>();
  for (const type of HOTEL_TYPES) {
    for (const citySlug of type.topCitySlugs) {
      const city = findCityBySlug(citySlug);
      if (city && isHotelPairEligible(type, city)) slugs.add(hotelTypeSlug(type, city));
    }
  }
  return [...slugs];
}

// ── internal-linking helpers ─────────────────────────────────────────

/** Other hotel facets available in the same city (sibling links). */
export function siblingTypeLinks(
  city: SeoCity,
  currentSlug: string,
  limit = 7,
): { label: string; href: string; emoji: string; tagline: string }[] {
  return HOTEL_TYPES.filter((t) => t.slug !== currentSlug && isHotelPairEligible(t, city))
    .slice(0, limit)
    .map((t) => ({
      label: `${t.name} in ${city.name}`,
      href: `/hotels/${hotelTypeSlug(t, city)}`,
      emoji: t.emoji,
      tagline: t.tagline,
    }));
}

/** The same hotel facet in the type's other top cities. */
export function sameTypeCityLinks(
  type: HotelType,
  currentCitySlug: string,
  limit = 8,
): { label: string; href: string; oneLiner: string }[] {
  const out: { label: string; href: string; oneLiner: string }[] = [];
  for (const citySlug of type.topCitySlugs) {
    if (citySlug === currentCitySlug) continue;
    const city = findCityBySlug(citySlug);
    if (!city || !isHotelPairEligible(type, city)) continue;
    out.push({
      label: `${type.name} in ${city.name}`,
      href: `/hotels/${hotelTypeSlug(type, city)}`,
      oneLiner: city.oneLiner,
    });
    if (out.length >= limit) break;
  }
  return out;
}
