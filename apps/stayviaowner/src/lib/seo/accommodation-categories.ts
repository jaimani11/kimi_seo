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
      'Log cabin rentals across the mountains, national forests, and remote lakes of North America and beyond. Wood-burning stoves, hot tubs on the deck, cell-signal optional. Bookable through VRBO with real guest reviews. Best-fit destinations: Great Smokies, Colorado Rockies, Adirondacks, Blue Ridge, Canadian mountain towns, and Alpine chalets in Europe.',
    searchAnchor: 'cabin',
    topCitySlugs: [
      'gatlinburg',
      'blue-ridge',
      'broken-bow',
      'lake-tahoe',
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
        a: 'In North America, "cabin" usually means a rustic wooden home in the mountains or woods. In the Alps, the same shape is called a "chalet" — often larger, with ski-in/ski-out access. Both are on VRBO; they overlap heavily.',
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
      'Cottage rentals for a weekend getaway or a summer of slow living. Everything from a thatched-roof Cotswold cottage to a lakeside dock cottage in Ontario. Smaller and often cozier than a full villa or house — typically 1–3 bedrooms. Bookable through VRBO. Best-fit destinations: England (Cotswolds, Lake District), Ireland, coastal New England, Ontario lake country, Nova Scotia.',
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
      'Beach house rentals steps from the ocean — Outer Banks porches, Malibu decks, Amalfi terraces, or a cabana in Tulum. Every house on stayviaowner is bookable through VRBO with verified guest reviews and free cancellation on most stays. Best-fit destinations: Outer Banks, 30A, Cape Cod, Malibu, Costa Rica, Tulum, Amalfi, Positano.',
    searchAnchor: 'beach house',
    topCitySlugs: [
      'destin',
      'outer-banks',
      'myrtle-beach',
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
      'lake-tahoe',
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
      'Lake house rentals on private docks and mountain lakes across North America, Alpine Europe, and beyond. Kayaks, pontoons, fire-pit evenings, and slow mornings on the water. Bookable through VRBO. Best-fit destinations: Lake Tahoe, Lake George, Lake of the Ozarks, Ontario lake country, Lake Como, Lake Bled, Lake Geneva, Lake Lucerne.',
    searchAnchor: 'lake house',
    topCitySlugs: [
      'lake-tahoe',
      'broken-bow',
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
  {
    slug: 'beach-villas',
    name: 'Beach villas',
    tagline: 'Wake up to the water. Private sand optional.',
    emoji: '🌊',
    intro:
      'Beachfront and near-beach villa rentals with the space a hotel room can\'t touch — private pools, full kitchens, and the ocean a few steps away. Bookable through VRBO with real photos and verified reviews. Best-fit destinations: Bali, the Greek islands, Phuket, the Riviera Maya, Ibiza, and the Amalfi Coast.',
    searchAnchor: 'beach villa',
    topCitySlugs: ['bali', 'santorini', 'mykonos', 'phuket', 'tulum', 'cancun', 'maui', 'ibiza', 'mallorca', 'positano', 'nice', 'koh-samui', 'langkawi', 'sorrento', 'crete'],
    faqs: [
      { q: 'What\'s the difference between a beach villa and a beach house?', a: 'A "villa" usually means a standalone luxury home with a private pool and grounds; a "beach house" is broader and can be simpler. Both sit on or near the sand — read the listing to confirm true beachfront vs. a short walk.' },
      { q: 'Are beach villas good value for groups?', a: 'Very — a 4-bedroom beach villa split among four couples almost always beats four sea-view hotel rooms, and you get a private pool, kitchen and living space on top.' },
      { q: 'When should I book a beach villa for peak season?', a: 'For the Mediterranean and Southeast Asia dry seasons, book 4–6 months ahead. The best beachfront villas in Bali, Mykonos and Amalfi fill first.' },
      { q: 'Do beach villas have air conditioning?', a: 'Most modern beach villas do, but older or eco-style properties sometimes rely on sea breeze and fans. Check the amenities list if AC matters to you.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'luxury-villas',
    name: 'Luxury villas',
    tagline: 'Full staff, infinity pool, zero compromises.',
    emoji: '🥂',
    intro:
      'The top tier of villa rentals — private chefs, daily housekeeping, infinity pools and concierge teams. These are the homes people book for milestone trips and multi-family getaways. Every property is bookable through VRBO with verified reviews and free cancellation on most stays. Best-fit destinations: Santorini, Mykonos, Bali, the Côte d\'Azur, Lake Como, and Marrakech.',
    searchAnchor: 'luxury villa',
    topCitySlugs: ['santorini', 'mykonos', 'bali', 'dubai', 'nice', 'ibiza', 'st-moritz', 'mallorca', 'lake-como', 'marrakech', 'cape-town', 'positano'],
    faqs: [
      { q: 'What counts as a "luxury" villa?', a: 'Beyond size and design, it\'s the service: private chef and housekeeping options, concierge, a standout pool, and prime location. The top listings bundle a full staff for 8+ bedroom estates.' },
      { q: 'How far ahead should I book a luxury villa?', a: 'For peak summer in Greece, Italy and the Riviera, 6+ months. Marquee estates in Mykonos and Amalfi start filling in January for the following summer.' },
      { q: 'Is a security deposit required?', a: 'Almost always for luxury villas — typically held on your card a week before arrival and released after an inspection. The amount is on the property page.' },
      { q: 'Can I add a private chef or transfers?', a: 'Frequently, yes — concierge, chef, daily housekeeping and airport transfers are common add-ons listed on the property page or arranged before arrival.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'private-pool-villas',
    name: 'Private pool villas',
    tagline: 'Your own pool. No loungers to fight for.',
    emoji: '🏊',
    intro:
      'Villa rentals with a private pool you never have to share — the single most-requested amenity in vacation rentals. From plunge pools in Santorini caves to 20-metre lap pools in Bali, all bookable through VRBO. Best-fit destinations: Bali, Phuket, the Greek islands, Marrakech, and the Balearics.',
    searchAnchor: 'villa with private pool',
    topCitySlugs: ['bali', 'phuket', 'santorini', 'mykonos', 'marrakech', 'ibiza', 'mallorca', 'tulum', 'koh-samui', 'goa', 'langkawi', 'crete'],
    faqs: [
      { q: 'Is the pool heated?', a: 'Not always — heating is common in cooler-climate or shoulder-season villas but rare in tropical destinations where it isn\'t needed. Listings note "heated pool" when applicable.' },
      { q: 'Are private-pool villas safe for young kids?', a: 'Ask about fencing or a pool alarm before booking — many villas have unfenced pools. The best family listings mention child-safety features explicitly.' },
      { q: 'Do I pay extra for the pool?', a: 'No — a private pool is part of the villa. Pool heating, where offered, is sometimes a separate daily charge.' },
      { q: 'How private is "private"?', a: 'A private-pool villa means the pool is yours alone, not shared with other guests. Read the listing for whether it\'s overlooked by neighbours.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'mansions',
    name: 'Mansions',
    tagline: 'Room for the whole crew, and then some.',
    emoji: '🏰',
    intro:
      'Grand estate rentals for big groups, milestone celebrations and multi-generational trips — six to twenty bedrooms, sweeping grounds, and the kind of space that turns a trip into an event. Bookable through VRBO. Best-fit destinations: the Côte d\'Azur, Mallorca, Cape Town, Lake Como, and Marrakech.',
    searchAnchor: 'mansion',
    topCitySlugs: ['nice', 'mallorca', 'cape-town', 'dubai', 'mykonos', 'lake-como', 'marrakech', 'ibiza', 'santorini', 'bali'],
    faqs: [
      { q: 'How many people do mansion rentals sleep?', a: 'Typically 12–30+ across 6–20 bedrooms — ideal for family reunions, wedding parties and corporate retreats. Filter by bedroom count to match your group.' },
      { q: 'Are mansions worth it vs. multiple villas?', a: 'For a group that wants to stay together — one kitchen, one pool, one dinner table — yes. Split across couples, the per-person cost is often reasonable.' },
      { q: 'Do mansion rentals come staffed?', a: 'Many larger estates include or offer a housekeeping and chef team. It\'s listed on the property page; confirm before booking if service matters.' },
      { q: 'Can I host an event at a mansion rental?', a: 'Some allow weddings and events (sometimes with an added fee and guest cap); others are residential-only. Always confirm the event policy before booking.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'chalets',
    name: 'Chalets',
    tagline: 'Ski-in mornings, hot tub après, fire crackling.',
    emoji: '🎿',
    intro:
      'Alpine chalet rentals — wood-clad, cosy, and often ski-in/ski-out — with hot tubs, boot rooms and mountain views. The group ski trip done right. Bookable through VRBO for peak season and quieter shoulder weeks. Best-fit destinations: Zermatt, St. Moritz, the Swiss Jungfrau, Whistler, and Banff.',
    searchAnchor: 'chalet',
    topCitySlugs: ['zermatt', 'st-moritz', 'grindelwald', 'wengen', 'murren', 'interlaken', 'whistler', 'banff', 'queenstown', 'lauterbrunnen'],
    faqs: [
      { q: 'What\'s the difference between a chalet and a cabin?', a: 'Both are wooden mountain homes; "chalet" is the Alpine term and usually implies ski access and a more finished, sometimes larger property. They overlap heavily on VRBO.' },
      { q: 'Does "ski-in/ski-out" really mean at the door?', a: 'It varies — sometimes literal door-to-lift, sometimes a short walk in ski boots. Read the listing and guest reviews for the real distance.' },
      { q: 'When should I book a ski chalet?', a: 'For the Dec 20–Jan 3 window, book by late September. Presidents\' Week and late February also fill fast; early January and early April have the best deals.' },
      { q: 'Do chalets have a hot tub and boot room?', a: 'The best ones do — a heated boot/ski room by the door and an outdoor hot tub are the two most-loved features. Check listing photos to confirm.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'glamping',
    name: 'Glamping',
    tagline: 'Nature without the sleeping bag.',
    emoji: '⛺',
    intro:
      'Luxury-camping rentals — safari tents, geodesic domes, yurts and eco-cabins with real beds, proper bathrooms and often a hot tub under the stars. The outdoors without roughing it. Bookable through VRBO. Best-fit destinations: Cape Town\'s winelands, the Marrakech desert, Queenstown, Banff, and Bali\'s jungle.',
    searchAnchor: 'glamping',
    topCitySlugs: ['cape-town', 'marrakech', 'queenstown', 'banff', 'bali', 'tulum', 'santorini', 'crete'],
    faqs: [
      { q: 'Does glamping have a real bathroom?', a: 'The good listings do — en-suite or a private bathroom block with hot water. "Shared facilities" is noted when it applies, so read before booking.' },
      { q: 'Is glamping good in cold weather?', a: 'Many domes and tents are insulated and heated (wood stove or electric), making them cosy in shoulder season. Check for heating if you\'re travelling off-peak.' },
      { q: 'Is there electricity and wifi?', a: 'Usually electricity, sometimes solar; wifi varies and is often intentionally absent. Check the amenities if you need to stay connected.' },
      { q: 'Is glamping family-friendly?', a: 'Very — kids love the novelty, and many sites have fire pits, stargazing and space to roam. Confirm the minimum-age or safety notes for very young children.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'farmhouses',
    name: 'Farmhouses',
    tagline: 'Slow mornings, long tables, open country.',
    emoji: '🌾',
    intro:
      'Countryside farmhouse and finca rentals — stone walls, big kitchens, olive groves and vineyards out the window. Space to spread out and cook, at a pace the city can\'t offer. Bookable through VRBO. Best-fit destinations: the Riviera hinterland, Mallorca, the Cape winelands, Crete, and the Marrakech countryside.',
    searchAnchor: 'farmhouse',
    topCitySlugs: ['nice', 'mallorca', 'cape-town', 'marrakech', 'crete', 'lake-como', 'santorini', 'ibiza'],
    faqs: [
      { q: 'Are farmhouses remote?', a: 'Often a 10–30 minute drive from town — that\'s the appeal. A rental car is usually essential; the listing map shows the real distance to shops and sights.' },
      { q: 'Do farmhouse rentals have modern amenities?', a: 'The renovated ones pair old-stone character with modern kitchens, wifi and pools. Read the listing — "rustic" can mean charming or basic depending on the property.' },
      { q: 'Are farmhouses good for big families?', a: 'Excellent — they tend to have large kitchens, long dining tables, gardens and room for kids to roam, at better value than in-town villas.' },
      { q: 'Is a pool included?', a: 'Many countryside farmhouses have added a private pool; plenty haven\'t. Filter for "pool" if it\'s a must-have.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'penthouses',
    name: 'Penthouses',
    tagline: 'Top floor, skyline views, private terrace.',
    emoji: '🌆',
    intro:
      'Top-floor penthouse rentals with wraparound terraces, skyline or sea views, and space that puts a suite to shame. The city stay upgraded. Bookable through VRBO with verified reviews. Best-fit destinations: Dubai, Nice, Cape Town, Barcelona, Miami, and New York.',
    searchAnchor: 'penthouse',
    topCitySlugs: ['dubai', 'nice', 'cape-town', 'barcelona', 'miami', 'new-york', 'ibiza', 'mallorca', 'bali', 'los-angeles'],
    faqs: [
      { q: 'Are penthouse rentals better value than a luxury hotel suite?', a: 'For 2–3 nights and 4+ people, usually yes — you get more space, a full kitchen and a private terrace for the price of a small suite.' },
      { q: 'Do penthouses come with building amenities?', a: 'Often — pool, gym and concierge access come with many building penthouses. It\'s listed on the property page; confirm what\'s included.' },
      { q: 'Is parking included?', a: 'Downtown penthouses sometimes include a parking space, sometimes not. If you\'re driving, check before booking — city parking is otherwise pricey.' },
      { q: 'How high up are they really?', a: 'A true penthouse is the top floor or two; some listings use the term loosely. Check the floor number and view photos in the listing.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'pet-friendly-villas',
    name: 'Pet-friendly villas',
    tagline: 'Bring the dog. Everyone\'s invited.',
    emoji: '🐕',
    intro:
      'Villa rentals that genuinely welcome pets — fenced gardens, no size limits, and often a dog-friendly beach nearby. No more boarding the dog to take a trip. Bookable through VRBO; filter for "pets allowed" and check the fee. Best-fit destinations: the Riviera, Mallorca, Tuscany-style countryside, the Cape, and coastal Portugal.',
    searchAnchor: 'pet friendly villa',
    topCitySlugs: ['nice', 'mallorca', 'cape-town', 'lisbon', 'porto', 'crete', 'ibiza', 'lake-como', 'marrakech'],
    faqs: [
      { q: 'Is there a pet fee?', a: 'Usually — a cleaning surcharge of roughly $50–150 per stay is typical. It\'s shown at checkout; a few hosts waive it.' },
      { q: 'Are there size or breed limits?', a: 'It varies by host. Many villas welcome all sizes; some cap at one small-to-medium dog. The listing states the policy — message the host if unsure.' },
      { q: 'Do pet-friendly villas have fenced gardens?', a: 'The best ones do, and say so. If a secure garden matters, filter for it and confirm with the host before booking.' },
      { q: 'Can I leave my dog alone at the villa?', a: 'Policies differ — some hosts allow it if the dog is crated, others don\'t. Check the house rules to avoid a surprise.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'family-villas',
    name: 'Family villas',
    tagline: 'Fenced pool, bunk room, space for everyone.',
    emoji: '👨‍👩‍👧‍👦',
    intro:
      'Villa rentals built for families — fenced or shallow pools, bunk rooms, high chairs and cots, and gardens with room to run. A trip where the kids are happy and the adults actually relax. Bookable through VRBO. Best-fit destinations: the Balearics, the Algarve, Crete, Bali, and the Riviera.',
    searchAnchor: 'family villa',
    topCitySlugs: ['mallorca', 'crete', 'bali', 'nice', 'ibiza', 'phuket', 'cancun', 'tulum', 'koh-samui', 'santorini'],
    faqs: [
      { q: 'Which family villa features matter most?', a: 'Pool safety (fence or shallow end), a well-equipped kitchen, cots/high chairs, and enough bedrooms to spread out. Reviews mentioning "great with kids" are the best signal.' },
      { q: 'Are cribs and high chairs provided?', a: 'Many family-oriented villas provide them on request at no or low cost — ask the host before booking so they\'re ready on arrival.' },
      { q: 'Is a fenced pool available?', a: 'Some villas have fenced or gated pools; many don\'t. If you have toddlers, filter for it and confirm directly with the host.' },
      { q: 'How many bedrooms for two families?', a: 'Four bedrooms comfortably fits two families with kids; five gives everyone breathing room. Bunk rooms stretch capacity for the little ones.' },
    ],
    expediaSubcategory: 'vacation-rentals',
  },
  {
    slug: 'condos',
    name: 'Condos',
    tagline: 'Resort amenities, apartment prices, beach out front.',
    emoji: '🏖️',
    intro:
      'Condo and resort-apartment rentals — building pool, gym and often beach access, with a kitchen and separate bedrooms for less than a comparable hotel. The easy, well-located stay. Bookable through VRBO. Best-fit destinations: Cancún, Tulum, Maui, Honolulu, Phuket, and Dubai.',
    searchAnchor: 'condo',
    topCitySlugs: ['cancun', 'tulum', 'maui', 'honolulu', 'phuket', 'dubai', 'miami', 'bali', 'koh-samui', 'mallorca'],
    faqs: [
      { q: 'What\'s the difference between a condo and an apartment rental?', a: 'A "condo" usually sits in a resort or amenity building — shared pool, gym, sometimes beach access — while an "apartment" is a standalone city flat. Condos suit beach trips; apartments suit city stays.' },
      { q: 'Are building amenities included?', a: 'Generally yes — the pool and gym come with the condo. Some buildings charge a resort/amenity fee; it\'s shown on the listing or at checkout.' },
      { q: 'Are condos good value on the beach?', a: 'Very — a beachfront condo with a kitchen and building pool typically undercuts an equivalent resort room, especially for families and longer stays.' },
      { q: 'Is parking included with a condo rental?', a: 'Often one space is included in resort buildings; confirm on the listing if you\'re renting a car.' },
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
