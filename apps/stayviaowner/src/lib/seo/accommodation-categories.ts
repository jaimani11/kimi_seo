/**
 * Gotript accommodation sub-brand category pages.
 *
 * Six top-level routes (/villas, /cabins, /cottages, /beach-houses,
 * /ski-lodges, /lake-houses) act as sub-brand landing pages inside
 * stayviaowner. Each ranks for its category-level search intent
 * ("luxury villas Italy", "log cabin rentals Colorado") and funnels
 * clicks to Expedia + VRBO inventory.
 *
 * If any single category proves to have breakout traffic, it can
 * later be spun into its own dedicated domain (villasgo.com, etc.).
 * Until then, they live inside stayviaowner so we don't spread SEO
 * authority across cold domains.
 */

export interface AccommodationCategory {
  /** URL slug — this is also the route path (/{slug}). */
  slug: string;
  /** Display name. */
  name: string;
  /** Sub-brand tagline shown as eyebrow copy. */
  tagline: string;
  /** 3-4 sentence hero description that ranks for the category. */
  intro: string;
  /** Search anchor to use on Expedia/VRBO deep links. */
  searchAnchor: string;
  /** Emoji used as the hero graphic. */
  emoji: string;
  /** Slugs of cities where this accommodation type shines. Ordered
   *  by editorial preference — the top 3 get feature-card treatment. */
  topCitySlugs: readonly string[];
  /** 4-6 FAQs — matches People Also Ask. */
  faqs: ReadonlyArray<{ q: string; a: string }>;
  /** What VRBO/Expedia category filter maps to this landing. */
  expediaSubcategory: 'vacation-rentals' | 'hotels';
}

export const ACCOMMODATION_CATEGORIES: readonly AccommodationCategory[] = [
  {
    slug: 'villas',
    name: 'Villas',
    tagline: 'Private pool. Full staff optional. Just you.',
    emoji: '🏛️',
    intro:
      'Private villa rentals — from a 2-bedroom Tuscan farmhouse to a 12-bedroom estate in Mykonos with a full staff on call. Every villa on stayviaowner is bookable through Expedia + VRBO, with real photos, verified guest reviews, and free cancellation on most stays. Best-fit destinations: Italy (Tuscany, Puglia, Amalfi), Greek islands, Bali, Provence, and the Caribbean.',
    searchAnchor: 'villa',
    topCitySlugs: [
      'santorini',
      'mykonos',
      'bali',
      'cinque-terre',
      'mallorca',
      'ibiza',
      'sorrento',
      'dubrovnik',
      'nice',
      'marrakech',
      'crete',
      'tulum',
    ],
    faqs: [
      {
        q: 'What\'s the difference between a villa and a vacation rental?',
        a: 'A "villa" typically means a standalone luxury home with private pool, garden, and multiple bedrooms — often with concierge or staff options. A "vacation rental" is broader (apartments, cabins, condos). All villas are vacation rentals, but not every rental is a villa.',
      },
      {
        q: 'Are villa rentals cheaper than luxury hotels?',
        a: 'Per person, yes — a 6-bedroom villa split among 4 couples usually beats 4 luxury hotel rooms and gives you private kitchen, pool, and living space. For 2 people, hotels are often cheaper unless you\'re looking at premium destinations like Amalfi or Bali.',
      },
      {
        q: 'Do villa rentals include cleaning + a concierge?',
        a: 'Most VRBO villas include end-of-stay cleaning in the rate. Concierge, chef, and daily housekeeping are usually add-ons — clearly listed on the property page. Larger villas (8+ bedrooms) often bundle a full staff.',
      },
      {
        q: 'Is a security deposit required?',
        a: 'Yes for most villas — usually held on your card 7 days before arrival and released after inspection. The amount is on the property page.',
      },
      {
        q: 'When should I book a villa for peak summer?',
        a: 'For Italy, Greece, and the Caribbean in July–August, book 4–6 months ahead. Top villas in Amalfi + Mykonos start filling in January for the following summer.',
      },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'cabins',
    name: 'Cabins',
    tagline: 'Wood-stove nights, star-filled skies, no signal.',
    emoji: '🪵',
    intro:
      'Log cabin rentals across the mountains, national forests, and remote lakes of North America and beyond. Wood-burning stoves, hot tubs on the deck, cell-signal optional. Bookable through VRBO + Expedia with real guest reviews. Best-fit destinations: Great Smokies, Colorado Rockies, Adirondacks, Blue Ridge, Canadian mountain towns, and Alpine chalets in Europe.',
    searchAnchor: 'cabin',
    topCitySlugs: [
      'banff',
      'whistler',
      'zermatt',
      'interlaken',
      'lauterbrunnen',
      'hallstatt',
      'grindelwald',
      'lake-como',
      'lake-bled',
      'queenstown',
      'reykjavik',
      'denver',
    ],
    faqs: [
      {
        q: 'What\'s the difference between a cabin and a chalet?',
        a: 'In North America, "cabin" usually means a rustic wooden home in the mountains or woods. In the Alps, the same shape is called a "chalet" — often larger, with ski-in/ski-out access. Both are on VRBO + Expedia; they overlap heavily.',
      },
      {
        q: 'Do cabins have wifi?',
        a: 'Most modern cabins do — but rural cabins in national forests or deep in the Rockies may not. Check the property amenities list; the top-rated cabins on VRBO clearly disclose wifi speed.',
      },
      {
        q: 'What\'s the best time to book a mountain cabin?',
        a: 'For winter ski season (December–February), book 3–4 months ahead. For fall foliage (October in the US East), book 4–6 months ahead. Summer weekends fill up 6–8 weeks out.',
      },
      {
        q: 'Are pets allowed in cabin rentals?',
        a: 'Roughly 40–60% of cabins on VRBO are pet-friendly — filter for "Pets allowed" in your search. Cleaning fees are usually $50–100 higher for pet stays.',
      },
      {
        q: 'What amenities matter most in a mountain cabin?',
        a: 'Reliable heat (heat pump or wood stove), a hot tub on the deck, a fireplace, and a well-equipped kitchen. Guest reviews mentioning "hot tub was ready when we arrived" and "cabin was warm" are the top signals.',
      },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'cottages',
    name: 'Cottages',
    tagline: 'Small, cozy, thatched-roof or lake-facing.',
    emoji: '🏡',
    intro:
      'Cottage rentals for a weekend getaway or a summer of slow living. Everything from a thatched-roof Cotswold cottage to a lakeside dock cottage in Ontario. Smaller and often cozier than a full villa or house — typically 1–3 bedrooms. Bookable through VRBO + Expedia. Best-fit destinations: England (Cotswolds, Lake District), Ireland, coastal New England, Ontario lake country, Nova Scotia.',
    searchAnchor: 'cottage',
    topCitySlugs: [
      'edinburgh',
      'dublin',
      'bergen',
      'reykjavik',
      'bruges',
      'bordeaux',
      'lucerne',
      'bern',
      'wengen',
      'murren',
      'lake-como',
      'sintra',
    ],
    faqs: [
      {
        q: 'How big is a typical cottage rental?',
        a: 'Most cottages are 1–3 bedrooms — designed for a couple, a small family, or a quiet solo trip. Anything larger is usually classed as a "house" or "villa" on VRBO.',
      },
      {
        q: 'Are cottages more affordable than hotels?',
        a: 'Per night, yes — especially outside peak season. A £120/night Cotswold cottage sleeps 4 and includes a full kitchen; two hotel rooms would run £240 with no kitchen.',
      },
      {
        q: 'What\'s the best time to visit a lakeside cottage?',
        a: 'Late June–early September for swimming; late September–October for fall foliage without the summer crowds. Peak-week rates can be 3× shoulder season.',
      },
      {
        q: 'Do cottages come with a kitchen?',
        a: 'Almost always. Small cottages have a kitchenette (fridge, hob, microwave); larger cottages have a full kitchen with oven and dishwasher. Listing photos will tell you.',
      },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'beach-houses',
    name: 'Beach houses',
    tagline: 'Sand outside the door. Sunset from the deck.',
    emoji: '🏖️',
    intro:
      'Beach house rentals steps from the ocean — Outer Banks porches, Malibu decks, Amalfi terraces, or a cabana in Tulum. Every house on stayviaowner is bookable through VRBO + Expedia with verified guest reviews and free cancellation on most stays. Best-fit destinations: Outer Banks, 30A, Cape Cod, Malibu, Costa Rica, Tulum, Amalfi, Positano.',
    searchAnchor: 'beach house',
    topCitySlugs: [
      'tulum',
      'cancun',
      'maui',
      'honolulu',
      'boracay',
      'phuket',
      'el-nido',
      'goa',
      'ibiza',
      'mallorca',
      'sorrento',
      'zanzibar',
    ],
    faqs: [
      {
        q: 'What defines a "beachfront" rental vs. "walking distance to the beach"?',
        a: 'Beachfront means direct access from the property — sand or shore is at your door. Walking-distance means 5–15 minutes on foot. Read the listing carefully; VRBO photos taken at low tide can mislead.',
      },
      {
        q: 'Are beach houses safe during hurricane season?',
        a: 'Coastal US, Caribbean, and Mexico hurricane season runs June 1–November 30. Peak risk is late August–October. VRBO / Expedia refunds for hurricane-related cancellations are property-specific — read the cancellation policy before booking.',
      },
      {
        q: 'Do beach houses provide beach gear?',
        a: 'Many do — beach chairs, umbrellas, coolers, boogie boards. The top-rated houses on VRBO list beach gear in the amenities section. Otherwise, budget $30–50/day for rentals.',
      },
      {
        q: 'When should I book a beach house for summer?',
        a: 'For US East Coast + California peak weeks (July 4th to Labor Day), book 4–6 months ahead. Off-season shoulder weeks (June, September) have much better rates and 1–2 month lead times.',
      },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'ski-lodges',
    name: 'Ski lodges',
    tagline: 'Ski-in, ski-out, fireplace roaring.',
    emoji: '⛷️',
    intro:
      'Ski-in / ski-out lodges and chalets in the world\'s top mountain resorts. Wood-clad interiors, hot tub after the slopes, ski room for boots + poles. Bookable through Expedia + VRBO for peak season and shoulder weeks. Best-fit destinations: Whistler, Banff, Jackson Hole, Aspen, Zermatt, St. Moritz, Chamonix, Val d\'Isère, Niseko, Hakuba.',
    searchAnchor: 'ski lodge',
    topCitySlugs: [
      'zermatt',
      'st-moritz',
      'grindelwald',
      'wengen',
      'murren',
      'interlaken',
      'lauterbrunnen',
      'whistler',
      'banff',
      'queenstown',
      'sapporo',
      'salzburg',
    ],
    faqs: [
      {
        q: 'What does ski-in/ski-out mean exactly?',
        a: 'Ski-in/ski-out means you can put on your skis at the lodge door and reach a lift or slope without needing to drive or shuttle. Definitions vary — "ski-in/ski-out" in Whistler may mean a 3-minute walk in ski boots; in Zermatt it may mean literal door-to-lift.',
      },
      {
        q: 'How early should I book for peak ski season?',
        a: 'December 20 – January 3 is the tightest window — book by late September or you\'ll be paying premium rates for whatever\'s left. Presidents\' Week + late-February also fill fast. Early-January + early-April have the best deals.',
      },
      {
        q: 'Are ski-lodge rentals cheaper than resort hotels?',
        a: 'Per person, yes — a 4-bedroom chalet split among 8 friends usually beats 4 hotel rooms. A private kitchen also saves $200+/night on food at resort-town prices.',
      },
      {
        q: 'Do ski lodges include equipment storage?',
        a: 'Almost all do — most have a heated ski room by the door where you leave boots to dry overnight. This is a hard requirement; check listing photos.',
      },
      {
        q: 'What\'s the best European ski destination for beginners?',
        a: 'Wengen and Grindelwald in the Swiss Jungfrau region — long, gentle blue runs, ski school in English, and picture-postcard villages that don\'t require driving.',
      },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'lake-houses',
    name: 'Lake houses',
    tagline: 'Dock outside. Pontoon included. Sunset on the water.',
    emoji: '🛶',
    intro:
      'Lake house rentals on private docks and mountain lakes across North America, Alpine Europe, and beyond. Kayaks, pontoons, fire-pit evenings, and slow mornings on the water. Bookable through VRBO + Expedia. Best-fit destinations: Lake Tahoe, Lake George, Lake of the Ozarks, Ontario lake country, Lake Como, Lake Bled, Lake Geneva, Lake Lucerne.',
    searchAnchor: 'lake house',
    topCitySlugs: [
      'lake-como',
      'lake-bled',
      'lucerne',
      'interlaken',
      'montreux',
      'zurich',
      'lugano',
      'geneva',
      'banff',
      'whistler',
      'queenstown',
      'auckland',
    ],
    faqs: [
      {
        q: 'What\'s included with a lake house rental?',
        a: 'Most VRBO lake houses include a private dock, kayaks or paddleboards, life jackets for adults + kids, a fire pit, and a fully equipped kitchen. Higher-end rentals bundle a pontoon boat with the stay.',
      },
      {
        q: 'When is the best time to book a lake house?',
        a: 'For US summer peak (July + August), book 4–6 months ahead. September has swimmable water in most northern US lakes with 30–40% lower rates. May–June is the quietest window.',
      },
      {
        q: 'Are lake houses good for families with young kids?',
        a: 'Excellent for that demographic — no traffic to worry about, shallow swim zones near the dock, and a captive scenic playground. Look for houses with fenced yards or clearly-marked shallow water.',
      },
      {
        q: 'Do lake houses come with boats?',
        a: 'Kayaks + paddleboards, almost always. Motorboats + pontoons, sometimes — usually a separate line item at $200–400/day. Filter for "Boat included" in your VRBO search.',
      },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
];

const BY_SLUG = new Map<string, AccommodationCategory>(
  ACCOMMODATION_CATEGORIES.map((c) => [c.slug, c]),
);

export function findAccommodationCategory(slug: string): AccommodationCategory | null {
  return BY_SLUG.get(slug) ?? null;
}

export function allAccommodationCategories(): readonly AccommodationCategory[] {
  return ACCOMMODATION_CATEGORIES;
}
