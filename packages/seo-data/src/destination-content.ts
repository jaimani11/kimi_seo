/**
 * Rich destination guide content for the SEO_CITIES allowlist.
 *
 * Each guide has 8 structured sections that compose a substantive
 * `/destinations/{slug}` page — far richer than the minimal
 * oneLiner + Viator rail fallback. The sections double as SEO
 * surface area: each one ranks for its own long-tail intent
 * ("best time to visit Tokyo", "Tokyo budget per day", etc.).
 *
 * Content is hand-authored, concise (1–2 sentences per slot), and
 * factual — these pages get indexed and reviewed; hallucinated
 * filler would earn a manual quality penalty from Google.
 *
 * To add a new city: append a city to SEO_CITIES then add its
 * guide to DESTINATION_GUIDES below.
 */

export interface DestinationGuide {
  /** When to go + a one-line reason. */
  bestTimeToVisit: {
    months: string;
    blurb: string;
  };
  /** Three-tier daily spend in USD + one-line context. */
  budget: {
    budgetDailyUSD: number;
    midDailyUSD: number;
    luxuryDailyUSD: number;
    blurb: string;
  };
  /** Tailored advice for the three biggest travel modes. */
  travelStyles: {
    family: string;
    couples: string;
    solo: string;
  };
  /** 3–5 must-eat dishes with a one-line note each. */
  food: ReadonlyArray<{
    dish: string;
    note: string;
  }>;
  /** Primary mode + tips. */
  transportation: {
    primary: string;
    tips: string;
  };
  /** 3–4 neighborhoods with one-line descriptions. */
  neighborhoods: ReadonlyArray<{
    name: string;
    blurb: string;
  }>;
  /** Honest 1–2 sentence safety assessment. */
  safety: string;
}

export const DESTINATION_GUIDES: Readonly<Record<string, DestinationGuide>> = {
  tokyo: {
    bestTimeToVisit: {
      months: 'March–May, October–November',
      blurb: 'Cherry blossoms in spring, maple foliage and clear blue skies in autumn.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 120,
      luxuryDailyUSD: 350,
      blurb: 'Mid-range stretches comfortably; convenience stores and standing-bar dinners keep budget days well-fed.',
    },
    travelStyles: {
      family: 'Pokémon Cafe, Edo-Tokyo Museum, and Disneyland Tokyo or DisneySea for a full day out. Kids ride the subway free up to age 5.',
      couples: 'Sunset cocktails at Park Hyatt’s New York Bar, izakaya crawls in Shimokitazawa, omakase in Ginza.',
      solo: 'Tokyo is unmatched for solo travelers — every counter has a seat for one. Stay in Shibuya for energy, Asakusa for tradition.',
    },
    food: [
      { dish: 'Ramen', note: 'Tonkotsu in Shinjuku, tsukemen near Tokyo Station, late-night ramen alleys.' },
      { dish: 'Sushi', note: 'Conveyor belt for fun, omakase counters for the real thing — Tsukiji Outer Market for breakfast.' },
      { dish: 'Yakitori', note: 'Smoke-filled alleys in Memory Lane (Omoide Yokocho) by Shinjuku station.' },
      { dish: 'Tempura', note: 'Light, hot, eaten standing — try a counter spot in Asakusa.' },
      { dish: 'Wagashi', note: 'Seasonal Japanese sweets that pair with matcha at a tea house.' },
    ],
    transportation: {
      primary: 'Tokyo Metro + JR Yamanote Line reach everywhere. Buy an IC card (Suica or Pasmo) at any station.',
      tips: 'Taxis are accurate but expensive. Avoid the morning Yamanote rush hour (7:30–9:00 am) unless you’re experienced.',
    },
    neighborhoods: [
      { name: 'Shibuya', blurb: 'The scramble crossing, izakaya streets, late-night ramen.' },
      { name: 'Asakusa', blurb: 'Senso-ji temple, traditional shops, low-rise old Tokyo.' },
      { name: 'Shinjuku', blurb: 'Skyline observation decks, Golden Gai bars, Robot Restaurant.' },
      { name: 'Shimokitazawa', blurb: 'Indie cafés, vintage shops, the city’s most walkable district.' },
    ],
    safety: 'Among the safest large cities on Earth. Lost items often turn up at the koban (police box). Common sense applies anywhere.',
  },

  kyoto: {
    bestTimeToVisit: {
      months: 'Late March–early April, October–November',
      blurb: 'Cherry blossoms (peak first week of April) and maple foliage are the iconic windows; September is hot but quiet.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 110,
      luxuryDailyUSD: 300,
      blurb: 'Ryokan stays push the luxury tier higher; a guesthouse + temple breakfast is the rewarding budget play.',
    },
    travelStyles: {
      family: 'Arashiyama bamboo forest, Monkey Park, Kyoto International Manga Museum. Buses with kids can be tight in spring; plan around 10am–2pm crowds.',
      couples: 'A ryokan with a private onsen, a kaiseki dinner, an early-morning Fushimi Inari walk.',
      solo: 'Kyoto rewards slow solo travel — temples at dawn, tea houses in the rain, riverside walks at dusk.',
    },
    food: [
      { dish: 'Kaiseki', note: 'Multi-course seasonal banquet — splurge once at a traditional ryotei.' },
      { dish: 'Yudofu', note: 'Simmered tofu cuisine, especially around Nanzen-ji temple.' },
      { dish: 'Matcha sweets', note: 'Uji matcha parfaits in Gion; warabi-mochi anywhere.' },
      { dish: 'Nishiki Market bites', note: 'Pickles, tamagoyaki, takoyaki — graze through "Kyoto’s kitchen".' },
    ],
    transportation: {
      primary: 'City buses and a walkable old city; bicycle in spring/autumn.',
      tips: 'Buy the 1-day bus pass for ¥700. The subway is small but handy for north-south.',
    },
    neighborhoods: [
      { name: 'Gion', blurb: 'Geisha district, wooden tea houses, evening lantern light.' },
      { name: 'Higashiyama', blurb: 'Kiyomizu-dera, narrow stone lanes, the most-photographed strip.' },
      { name: 'Arashiyama', blurb: 'Bamboo forest, monkey park, riverboat afternoons.' },
      { name: 'Pontocho', blurb: 'Riverside dining alley — atmospheric for dinner.' },
    ],
    safety: 'Very safe. Respect quiet hours near temples and never block residential lanes for photos in Gion.',
  },

  osaka: {
    bestTimeToVisit: {
      months: 'March–May, October–November',
      blurb: 'Same spring/autumn windows as Kyoto/Tokyo. Summer humid; winter chilly but dry.',
    },
    budget: {
      budgetDailyUSD: 45,
      midDailyUSD: 100,
      luxuryDailyUSD: 250,
      blurb: 'Cheapest of Japan’s three big cities and the best street-food value.',
    },
    travelStyles: {
      family: 'Universal Studios Japan (Super Nintendo World is the headliner), Osaka Aquarium Kaiyukan, Pokémon Café.',
      couples: 'Dotonbori’s neon at night, sushi counters in Namba, a soft Sunday walk through Osaka Castle Park.',
      solo: 'Osaka is the friendliest food city in Japan — every counter has stories. Stay in Namba or Umeda.',
    },
    food: [
      { dish: 'Takoyaki', note: 'Octopus balls — Dotonbori is the spiritual home.' },
      { dish: 'Okonomiyaki', note: 'Savory pancake cooked at your table.' },
      { dish: 'Kushikatsu', note: 'Skewered fried bites — one dip per skewer, never double-dip.' },
      { dish: 'Tonkatsu', note: 'Crispy pork cutlet served with shredded cabbage.' },
    ],
    transportation: {
      primary: 'Subway + JR Loop Line; the city is denser than it looks.',
      tips: 'A 1-day subway pass is ¥820. JR Pass holders ride the JR Loop free.',
    },
    neighborhoods: [
      { name: 'Dotonbori', blurb: 'The food strip — Glico runner sign, river canals, late-night energy.' },
      { name: 'Namba', blurb: 'Shopping arcades, theaters, the gateway to old Osaka.' },
      { name: 'Umeda', blurb: 'Skyscrapers, the Sky Building, big-city Osaka.' },
      { name: 'Tennoji', blurb: 'Park, temple, zoo — quieter local pace.' },
    ],
    safety: 'Very safe. Watch your wallet on busy Dotonbori weekends.',
  },

  seoul: {
    bestTimeToVisit: {
      months: 'April–June, September–November',
      blurb: 'Spring cherry blossoms, autumn ginkgo leaves. Winter is cold but dry with clear skies; summer humid.',
    },
    budget: {
      budgetDailyUSD: 40,
      midDailyUSD: 100,
      luxuryDailyUSD: 280,
      blurb: 'Street food and convenience-store meals make budget days easy; mid-range gets you into design hotels.',
    },
    travelStyles: {
      family: 'Lotte World indoor park, Children’s Grand Park, Hangang River bike rentals. Kid-friendly cafés are everywhere.',
      couples: 'Han River cruise at night, palace ceremonies at sundown, late-night pojangmacha tents.',
      solo: 'Easy and welcoming — Korean café culture supports long solo afternoons; nightlife in Itaewon and Hongdae.',
    },
    food: [
      { dish: 'Bibimbap', note: 'Mixed rice bowl, often served in a sizzling stone bowl (dolsot).' },
      { dish: 'Korean BBQ', note: 'Galbi (short rib) and samgyeopsal (pork belly) grilled at your table.' },
      { dish: 'Kimchi jjigae', note: 'Spicy fermented-kimchi stew — comfort food in a bowl.' },
      { dish: 'Korean fried chicken', note: 'Soy-garlic or yangnyeom — pair with cold beer (chimaek).' },
      { dish: 'Tteokbokki', note: 'Spicy rice cakes from street stalls; Sindang-dong is the holy land.' },
    ],
    transportation: {
      primary: 'Seoul Metro is among the world’s best — fast, signposted in English, clean.',
      tips: 'Buy a T-Money card on arrival. Buses are also excellent. Use Kakao T or Uber for taxis.',
    },
    neighborhoods: [
      { name: 'Hongdae', blurb: 'Youth culture, clubs, indie cafés, university energy.' },
      { name: 'Itaewon', blurb: 'International food, vintage shops, evening rooftops.' },
      { name: 'Gangnam', blurb: 'Luxury, modern restaurants, K-pop label headquarters.' },
      { name: 'Bukchon Hanok Village', blurb: 'Traditional wooden houses, old-Seoul photo strip.' },
    ],
    safety: 'Very safe. Bars stay open late; subway operates until ~midnight.',
  },

  bangkok: {
    bestTimeToVisit: {
      months: 'November–February',
      blurb: 'Cool dry season — comfortable days, cooler nights, less rain. March–May is brutally hot.',
    },
    budget: {
      budgetDailyUSD: 25,
      midDailyUSD: 70,
      luxuryDailyUSD: 200,
      blurb: 'One of the world’s best value cities — street food is genuinely $1–3, luxury hotels are world class for $150–300.',
    },
    travelStyles: {
      family: 'Lumpini Park (giant monitor lizards), Children’s Discovery Museum, ethical elephant sanctuaries via day trip — never elephant rides.',
      couples: 'Rooftop bars (Sky Bar at Lebua, Vertigo), river dinner cruise, Thai cooking class.',
      solo: 'Easy, welcoming, lots to do. Hostels and co-working communities are excellent. Sukhumvit is solo-friendly.',
    },
    food: [
      { dish: 'Pad Thai', note: 'Best from street carts — Thip Samai is the classic.' },
      { dish: 'Tom Yum Goong', note: 'Spicy-sour shrimp soup — order it medium-spicy at first.' },
      { dish: 'Mango Sticky Rice', note: 'Seasonal April–June; year-round at touristy spots.' },
      { dish: 'Som Tam', note: 'Green papaya salad — pungent, spicy, addictive.' },
      { dish: 'Boat Noodles', note: 'Tiny rich bowls; pile up the bowls at a noodle boat.' },
    ],
    transportation: {
      primary: 'BTS Skytrain + MRT subway reach the modern center; tuk-tuks for short hops; Grab for cars.',
      tips: 'Avoid taxis that refuse the meter. Bangkok traffic is brutal 4–7 pm — plan accordingly.',
    },
    neighborhoods: [
      { name: 'Sukhumvit', blurb: 'Modern restaurants, hotels, malls — the safest first-time area.' },
      { name: 'Old Town (Rattanakosin)', blurb: 'Grand Palace, Wat Pho, the historic core.' },
      { name: 'Chinatown (Yaowarat)', blurb: 'Best street food, late-night energy, golden temples.' },
      { name: 'Thonglor / Ekkamai', blurb: 'Hip cafés, craft cocktails, expat-friendly.' },
    ],
    safety: 'Mostly safe; watch traffic, tourist scams ("the temple is closed today"), and overpriced tuk-tuks.',
  },

  singapore: {
    bestTimeToVisit: {
      months: 'February–April',
      blurb: 'Less rain than other months but Singapore is equatorial — expect a thunderstorm every afternoon year-round.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 140,
      luxuryDailyUSD: 380,
      blurb: 'Hawker centres save you. Hotels are pricey for the region; food is among the cheapest top-tier cuisine in the world.',
    },
    travelStyles: {
      family: 'Universal Studios Sentosa, Gardens by the Bay (Cloud Forest is magical for kids), Singapore Zoo (best in Asia).',
      couples: 'Marina Bay Sands infinity pool, rooftop dinners, Sentosa cable car at night.',
      solo: 'Extremely solo-friendly — super safe, English everywhere, easy transit.',
    },
    food: [
      { dish: 'Chili Crab', note: 'The national dish — messy, communal, worth it. East Coast Lagoon is iconic.' },
      { dish: 'Hainanese Chicken Rice', note: 'Tian Tian at Maxwell Hawker is the textbook spot.' },
      { dish: 'Laksa', note: 'Coconut-curry noodle soup. Katong Laksa style is sweet, 328 is the classic.' },
      { dish: 'Kaya Toast', note: 'Coconut jam on charcoal-grilled toast, with soft-boiled eggs — breakfast.' },
      { dish: 'Char Kway Teow', note: 'Wok-charred flat noodles. Hill Street version is a benchmark.' },
    ],
    transportation: {
      primary: 'MRT is fast, clean, cheap; buses cover the rest.',
      tips: 'Buy an EZ-Link card. Grab is widely used. Taxis from the airport are honest meter.',
    },
    neighborhoods: [
      { name: 'Marina Bay', blurb: 'Skyline icons — Marina Bay Sands, Gardens by the Bay, Esplanade.' },
      { name: 'Little India', blurb: 'Colorful streets, banana-leaf meals, Mustafa Centre 24/7.' },
      { name: 'Chinatown', blurb: 'Temples, food courts, classic kopitiams.' },
      { name: 'Tiong Bahru', blurb: 'Art Deco apartments, indie cafés, the bookshop neighborhood.' },
    ],
    safety: 'Among the world’s safest cities. Strict laws (drugs, littering, jaywalking) — respect them.',
  },

  bali: {
    bestTimeToVisit: {
      months: 'April–October',
      blurb: 'Dry season — sunny, lower humidity. November–March is wet but green and cheaper.',
    },
    budget: {
      budgetDailyUSD: 20,
      midDailyUSD: 60,
      luxuryDailyUSD: 200,
      blurb: 'Bali stretches every budget further than you expect — $40/night villas with private pools exist.',
    },
    travelStyles: {
      family: 'Waterbom Park, Bali Safari, kid-friendly beach clubs in Sanur. Most villas welcome kids.',
      couples: 'Private-pool villas in Ubud, Uluwatu cliff sunsets, beachfront dinners in Jimbaran.',
      solo: 'Huge digital-nomad and yoga community in Canggu and Ubud. Easy and welcoming.',
    },
    food: [
      { dish: 'Nasi Goreng', note: 'Fried rice with egg — every warung does it, every one differently.' },
      { dish: 'Satay', note: 'Skewered grilled meats with peanut sauce — Babi (pork) is the local specialty.' },
      { dish: 'Babi Guling', note: 'Whole roasted suckling pig — Ibu Oka in Ubud is the institution.' },
      { dish: 'Gado-Gado', note: 'Mixed vegetables with peanut sauce, a healthy lunch standard.' },
    ],
    transportation: {
      primary: 'Scooter for short distances, private driver ($30–40/day) for full days, Gojek/Grab in main areas.',
      tips: 'International driver license required for legal scooter; helmets non-negotiable. Roads are unpredictable.',
    },
    neighborhoods: [
      { name: 'Seminyak', blurb: 'Beach clubs, boutiques, dining strip — touristy but polished.' },
      { name: 'Ubud', blurb: 'Jungle, rice terraces, yoga retreats, spiritual heart of the island.' },
      { name: 'Canggu', blurb: 'Surf breaks, café culture, the digital-nomad capital.' },
      { name: 'Uluwatu', blurb: 'Cliffside temples, sunset bars, world-class surf.' },
    ],
    safety: 'Generally safe. Traffic is the biggest real risk; pickpockets occasional on beach roads. Skip elephant rides and dolphin attractions.',
  },

  'hong-kong': {
    bestTimeToVisit: {
      months: 'October–December',
      blurb: 'Sunny, dry, cool. Spring is humid; summer hot and typhoon-prone.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 350,
      blurb: 'Hotels are pricey for the space you get; food and transit are remarkable value.',
    },
    travelStyles: {
      family: 'Hong Kong Disneyland, Ocean Park, Peak Tram up Victoria Peak. Easy English signage.',
      couples: 'Star Ferry at dusk, Symphony of Lights over the harbour, dim sum brunches.',
      solo: 'Very walkable, English-friendly, dense culture — easy solo trip.',
    },
    food: [
      { dish: 'Dim Sum', note: 'Tim Ho Wan’s Michelin-starred chain is the cheapest starred meal in the world.' },
      { dish: 'Roast Goose', note: 'Yat Lok and Kam’s are the classic spots.' },
      { dish: 'Milk Tea', note: 'Hong Kong–style with evaporated milk — a tradition at any cha chaan teng.' },
      { dish: 'Egg Tarts', note: 'Tai Cheong (shortcrust) vs. Honolulu (puff pastry) — try both.' },
    ],
    transportation: {
      primary: 'MTR (subway), Star Ferry (essential), trams on Hong Kong Island.',
      tips: 'Get an Octopus card. The Mid-Levels escalator (longest in the world) is also an actual transport mode.',
    },
    neighborhoods: [
      { name: 'Central', blurb: 'Skyscrapers, luxury, the business heart of the city.' },
      { name: 'Tsim Sha Tsui', blurb: 'Harbour-side promenade, museums, skyline views.' },
      { name: 'Mong Kok', blurb: 'Markets, neon, dense old Kowloon.' },
      { name: 'Sheung Wan', blurb: 'Antiques, dried seafood streets, artsy cafés.' },
    ],
    safety: 'Very safe. Crowded MTR can be intense at rush; otherwise common sense.',
  },

  paris: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Mild weather and longer days without the August tourist crush (many Parisians leave the city in August).',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 160,
      luxuryDailyUSD: 450,
      blurb: 'Boulangeries make breakfast and lunch shockingly cheap; sit-down dinners run higher than London.',
    },
    travelStyles: {
      family: 'Disneyland Paris (a day trip), Jardin du Luxembourg playgrounds, Cité des Sciences. Free museums for under-18s.',
      couples: 'Seine sunset cruise, Le Marais walks, picnic on Pont des Arts, intimate bistros in the 11th.',
      solo: 'Built for solo wandering — cafés welcome a book and an espresso for an hour. Stay in the Marais or Saint-Germain.',
    },
    food: [
      { dish: 'Croissant', note: 'Du Pain et des Idées, Stohrer, or any neighborhood boulangerie — buttery, flaky, daily.' },
      { dish: 'Steak Frites', note: 'Bistro classic — Le Relais de l’Entrecôte is the only-one-dish institution.' },
      { dish: 'Escargots', note: 'Garlic, butter, parsley — try them once at a brasserie.' },
      { dish: 'Crème Brûlée', note: 'The dessert worth ordering twice. La Cuisine de Philippe is reliable.' },
      { dish: 'Falafel', note: 'L’As du Fallafel in the Marais — the queue is worth it.' },
    ],
    transportation: {
      primary: 'Métro is dense and reaches everywhere; walk between landmarks.',
      tips: 'Buy a Navigo Easy card. Vélib bikes are good for the river path. Watch for ticket-validation scams at machines.',
    },
    neighborhoods: [
      { name: 'Le Marais', blurb: 'Boutique shops, falafel, cafés, queer-friendly.' },
      { name: 'Saint-Germain-des-Prés', blurb: 'Literary cafés, antiquaires, the publishing-world quarter.' },
      { name: 'Montmartre', blurb: 'Sacré-Cœur, narrow stairs, the artsy hill.' },
      { name: 'Belleville', blurb: 'Multicultural, street art, panoramic views.' },
    ],
    safety: 'Mostly safe. Watch for pickpockets on Line 1, around the Eiffel Tower, and at the Louvre exit.',
  },

  rome: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Warm but not yet brutal. July and August are hot, crowded, and many locals leave for the coast.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 380,
      blurb: 'Pizza al taglio and supplì keep budget meals genuinely good; trattorias are reasonable.',
    },
    travelStyles: {
      family: 'Gladiator School for Kids, Colosseum + Forum tour with a kid-friendly guide, gelato museum.',
      couples: 'Trastevere dinner walk, Spanish Steps at dusk, day trip to Tivoli or Frascati.',
      solo: 'Walkable, friendly, and one of the most photogenic cities for solo strolling.',
    },
    food: [
      { dish: 'Carbonara', note: 'Egg, guanciale, pecorino, black pepper — no cream. Roscioli is a benchmark.' },
      { dish: 'Cacio e Pepe', note: 'Pasta + pecorino romano + black pepper. Felice a Testaccio is famous.' },
      { dish: 'Supplì', note: 'Fried rice balls with mozzarella — Roman street food.' },
      { dish: 'Maritozzi', note: 'Whipped-cream filled brioche — eat for breakfast at Regoli.' },
      { dish: 'Gelato', note: 'Skip the bright-blue mounds. Real gelaterias use natural pastels.' },
    ],
    transportation: {
      primary: 'Walk most of the historic center; Metro Line A and B for distance; buses extend the network.',
      tips: 'Roma Pass includes transit + two attractions. Pickpockets on bus 64 (Termini to Vatican).',
    },
    neighborhoods: [
      { name: 'Centro Storico', blurb: 'Pantheon, Trevi, Spanish Steps — the postcard core.' },
      { name: 'Trastevere', blurb: 'Cobbled lanes, trattorias, evening lively but charming.' },
      { name: 'Monti', blurb: 'Boutique shops, wine bars, the cool kids’ neighborhood.' },
      { name: 'Testaccio', blurb: 'Authentic food district, market, classic Roman cooking.' },
    ],
    safety: 'Generally safe. Pickpockets at Vatican entrance, Termini, and crowded Metro Line A. Otherwise low risk.',
  },

  london: {
    bestTimeToVisit: {
      months: 'May–September',
      blurb: 'Longer days (sunset 9pm in June), parks in bloom, more outdoor possibility. Winters are dark by 4pm.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 180,
      luxuryDailyUSD: 500,
      blurb: 'London is expensive. Major museums are free, which materially helps; pubs and Tesco lunches stretch budget days.',
    },
    travelStyles: {
      family: 'Natural History Museum (free), Science Museum (free), London Eye, Harry Potter Studios (a day out).',
      couples: 'Sky Garden cocktails (free entry, book ahead), Borough Market on Saturday, theater nights in the West End.',
      solo: 'English everywhere, pub culture welcomes solo seats at the bar, museums for entire afternoons.',
    },
    food: [
      { dish: 'Sunday Roast', note: 'Pub tradition — Hawksmoor or The Camberwell Arms.' },
      { dish: 'Curry', note: 'Brick Lane for traditional, Dishoom for Bombay-style.' },
      { dish: 'Full English Breakfast', note: 'Eggs, sausage, baked beans, toast — a hangover cure.' },
      { dish: 'Fish and Chips', note: 'Poppies in Spitalfields or Borough Market — vinegar, mushy peas, lemon.' },
      { dish: 'Afternoon Tea', note: 'The Wolseley or Claridge’s for the classic; Sketch for the most photographed.' },
    ],
    transportation: {
      primary: 'Tube and bus — get an Oyster card or use a contactless credit card directly.',
      tips: 'Walking between Soho/Covent Garden is faster than the Tube. Mind the gap is genuinely instruction.',
    },
    neighborhoods: [
      { name: 'South Bank', blurb: 'Riverside walk, Tate Modern, the National Theatre, Borough Market.' },
      { name: 'Shoreditch', blurb: 'Street art, indie coffee, late-night bars.' },
      { name: 'Notting Hill', blurb: 'Pastel houses, Portobello Market on Saturdays.' },
      { name: 'Camden', blurb: 'Market, music venues, the alt-culture heart.' },
    ],
    safety: 'Generally safe. Be aware on the night Tube. Phone-snatch from passing scooters is the most common urban risk.',
  },

  barcelona: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Warm without being scorching, fewer cruise tourists than peak summer. November–March is mild but rainier.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 120,
      luxuryDailyUSD: 320,
      blurb: 'Tapas culture means budget dinners are excellent. Beach hotels stretch the luxury tier higher.',
    },
    travelStyles: {
      family: 'Aquarium, beach mornings, Park Güell, Tibidabo amusement park. Kids welcome at most dinner spots.',
      couples: 'Tapas crawl in El Born, Sagrada Família at dusk, day trip to Sitges or Girona.',
      solo: 'Easy and lively — late dinners (10pm) and walking culture suit solo travelers.',
    },
    food: [
      { dish: 'Tapas', note: 'Quimet i Quimet for standing-room tapas; Cal Pep for fresh seafood.' },
      { dish: 'Paella', note: 'A lunch dish, not dinner — Can Solé or 7 Portes.' },
      { dish: 'Pa amb tomàquet', note: 'Bread rubbed with tomato + olive oil — Catalan basic.' },
      { dish: 'Churros con chocolate', note: 'Granja M. Viader is the institution.' },
      { dish: 'Vermouth', note: 'Sunday afternoon ritual — a glass on the move.' },
    ],
    transportation: {
      primary: 'Metro and walking handle most days; buses to the upper city.',
      tips: 'T-Casual card for 10 metro rides. Bikes are good for the seafront. Pickpockets active on the Metro.',
    },
    neighborhoods: [
      { name: 'Gothic Quarter', blurb: 'Medieval streets, hidden squares, the historic core.' },
      { name: 'El Born', blurb: 'Tapas bars, boutique shops, Picasso Museum.' },
      { name: 'Gràcia', blurb: 'Local feel, plazas, bohemian.' },
      { name: 'Barceloneta', blurb: 'Beach, seafood, the old fishermen’s quarter.' },
    ],
    safety: 'Watch pickpockets on La Rambla, Metro, and at the beach. Otherwise safe.',
  },

  lisbon: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Warm, sunny, manageable crowds. Summer is hot but locals leave for the coast. Winters are mild.',
    },
    budget: {
      budgetDailyUSD: 40,
      midDailyUSD: 100,
      luxuryDailyUSD: 280,
      blurb: 'One of the most affordable Western European capitals — wine, pastries, and tram rides are all genuinely cheap.',
    },
    travelStyles: {
      family: 'Oceanário (one of Europe’s best aquariums), Tram 28 ride, Sintra day trip with the colorful palaces.',
      couples: 'Alfama at sunset, fado dinner, Belém pastry stop with espresso.',
      solo: 'Digital-nomad capital — huge English-speaking community, easy solo dining, friendly people.',
    },
    food: [
      { dish: 'Pastel de Nata', note: 'Pastéis de Belém is the original; Manteigaria the modern benchmark.' },
      { dish: 'Bacalhau', note: 'Salt cod in 1,000 forms — try à brás (with eggs and potato sticks).' },
      { dish: 'Ginja', note: 'Sour cherry liqueur, served in chocolate cups at A Ginjinha.' },
      { dish: 'Sardines', note: 'Grilled, in season May–October. Try at a tasca during Santo António in June.' },
    ],
    transportation: {
      primary: 'Walk (Lisbon is hilly — be ready), Tram 28 is iconic, Metro for longer hops.',
      tips: 'Buy a Viva Viagem card. Take Tram 28 in the morning (less crowded). Funiculars save your legs.',
    },
    neighborhoods: [
      { name: 'Alfama', blurb: 'Old town, fado tradition, miradouro viewpoints.' },
      { name: 'Bairro Alto', blurb: 'Nightlife — quiet by day, crowded after 10pm.' },
      { name: 'Belém', blurb: 'Monuments, museums, the pastry of pastries.' },
      { name: 'Príncipe Real', blurb: 'Boutiques, design shops, dining.' },
    ],
    safety: 'Very safe. Pickpockets on Tram 28 and around tourist viewpoints.',
  },

  amsterdam: {
    bestTimeToVisit: {
      months: 'April–June, September',
      blurb: 'Tulip season peaks mid-April. September has fewer crowds and decent weather.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 140,
      luxuryDailyUSD: 380,
      blurb: 'Hotels are tight and pricey — book early. Eating well is doable; rijsttafel dinners are an excellent value splurge.',
    },
    travelStyles: {
      family: 'Vondelpark, NEMO Science Museum, canal boats, ARTIS Royal Zoo.',
      couples: 'Canal cruise at dusk, candlelit dinners in Jordaan, day trip to Zaanse Schans windmills.',
      solo: 'Bike-friendly, English everywhere, plenty of co-working — built for solo travel.',
    },
    food: [
      { dish: 'Stroopwafel', note: 'Warm caramel syrup waffles — eat one fresh at the Albert Cuyp Market.' },
      { dish: 'Bitterballen', note: 'Deep-fried meat balls — pub snack with beer.' },
      { dish: 'Herring', note: 'Raw, with onions — a stand by the canals, swallow whole.' },
      { dish: 'Dutch Cheese', note: 'Gouda and Edam — sample at Reypenaer Tasting Room.' },
      { dish: 'Indonesian rijsttafel', note: 'A Dutch-colonial holdover — 15+ tiny dishes; Sampurna is reliable.' },
    ],
    transportation: {
      primary: 'Bike (rent one for the day), then tram, then walking.',
      tips: 'Watch the bike lanes — they’re for bikes only and cyclists are fast. The OV-chipkaart works on tram + metro.',
    },
    neighborhoods: [
      { name: 'Jordaan', blurb: 'Picturesque canals, indie shops, art galleries.' },
      { name: 'De Pijp', blurb: 'Albert Cuyp market, cocktail bars, brunch culture.' },
      { name: 'Oud-Zuid', blurb: 'Van Gogh, Rijksmuseum, Vondelpark — the museum quarter.' },
      { name: 'Centrum', blurb: 'Canals, Anne Frank House, the Red Light District.' },
    ],
    safety: 'Very safe. Bike traffic is the real risk for pedestrians; coffee shop laws have specific rules.',
  },

  reykjavik: {
    bestTimeToVisit: {
      months: 'June–August (Midnight Sun), September–March (Northern Lights)',
      blurb: 'Two distinct trips. Summer gives endless daylight, accessible roads, puffins. Winter gives Lights but short days and storm-prone roads.',
    },
    budget: {
      budgetDailyUSD: 100,
      midDailyUSD: 200,
      luxuryDailyUSD: 500,
      blurb: 'Iceland is expensive. Grocery stores (Bónus, Krónan) and gas-station hot dogs save budget days.',
    },
    travelStyles: {
      family: 'Whales of Iceland exhibition, Blue Lagoon, easy hikes near town. Hot springs are kid-friendly.',
      couples: 'Northern Lights hunt in winter, glacier hike, soaking in a remote hot pot at midnight.',
      solo: 'The safest country on Earth + an English-speaking population + group tours for solo travelers.',
    },
    food: [
      { dish: 'Lamb Stew', note: 'Kjötsúpa — comfort in a bowl. Café Loki does a classic version.' },
      { dish: 'Skyr', note: 'Icelandic yogurt; thick, tart, high-protein. Breakfast staple.' },
      { dish: 'Plokkfiskur', note: 'Mashed fish-and-potato — sounds plain, tastes like home.' },
      { dish: 'Hot dogs', note: 'Bæjarins Beztu by the harbor — yes, hot dogs are a national thing.' },
    ],
    transportation: {
      primary: 'Walk Reykjavík; rent a car for the Ring Road or the south coast.',
      tips: 'Winter roads can close in hours — check road.is daily. Self-drive only if comfortable with snow.',
    },
    neighborhoods: [
      { name: '101 Reykjavík', blurb: 'Downtown — bars, cafés, the Hallgrímskirkja church.' },
      { name: 'Old Harbour', blurb: 'Whale watching, the Maritime Museum, fish restaurants.' },
    ],
    safety: 'Safest country on Earth. The real risks are weather, road ice, and crossing unmarked terrain.',
  },

  santorini: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Warm enough for swimming, fewer cruise ships than July–August. Avoid the peak July week if you can.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 170,
      luxuryDailyUSD: 500,
      blurb: 'Santorini is Greece’s priciest island. Oia caldera-view rooms in peak season are $500+; Akrotiri side is more reasonable.',
    },
    travelStyles: {
      family: 'Catamaran cruise with stops at hot springs, Akrotiri ruins, Red Beach. Donkey rides exist but are an animal-welfare issue.',
      couples: 'Oia sunset (find a spot by 6pm in summer), infinity pool villa, evening wine tasting at Santo Wines.',
      solo: 'Easy and beautiful — though the island is built for couples; solo can feel isolating in peak season.',
    },
    food: [
      { dish: 'Souvlaki', note: 'Grilled meat in pita — Pitogyros in Oia is the classic.' },
      { dish: 'Fava', note: 'Yellow split-pea purée with olive oil — local specialty.' },
      { dish: 'Tomatokeftedes', note: 'Tomato fritters — Santorini’s cherry tomatoes are uniquely sweet.' },
      { dish: 'White Aubergine', note: 'A Santorini-only ingredient — try at Selene Restaurant.' },
    ],
    transportation: {
      primary: 'Bus or ATV rental between towns; walk within Oia and Fira.',
      tips: 'Buses are cheap and reliable. ATV rental — wear closed shoes; injuries common from sandals.',
    },
    neighborhoods: [
      { name: 'Oia', blurb: 'Sunset spot, blue-domed churches, luxury hotels.' },
      { name: 'Fira', blurb: 'Capital, nightlife, the cable car to the port.' },
      { name: 'Imerovigli', blurb: 'Quieter caldera-view base, fewer crowds than Oia.' },
      { name: 'Akrotiri', blurb: 'Lighthouse, prehistoric ruins, the more affordable south.' },
    ],
    safety: 'Very safe. Skip the donkey rides; rent an ATV only if you’re comfortable on one.',
  },

  florence: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Warm without the August furnace; the Uffizi quieter outside peak. November–March is wet but uncrowded.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 380,
      blurb: 'Florence is walkable so you save on transit; trattorias are reasonable; truffle splurges run high.',
    },
    travelStyles: {
      family: 'Boboli Gardens, gelato class, Galileo Museum, climbing the Duomo dome (older kids).',
      couples: 'Sunset at Piazzale Michelangelo, Chianti day trip, romantic dinner in Oltrarno.',
      solo: 'Compact and walkable; book Uffizi + Accademia ahead to avoid solo queue boredom.',
    },
    food: [
      { dish: 'Bistecca alla Fiorentina', note: 'T-bone steak, rare, by weight. Trattoria Sostanza is iconic.' },
      { dish: 'Ribollita', note: 'Thick Tuscan bread-and-vegetable soup — winter comfort.' },
      { dish: 'Lampredotto', note: 'Slow-cooked tripe sandwich from a street cart — gateway offal.' },
      { dish: 'Schiacciata', note: 'Flatbread with prosciutto and stracciatella — All’Antico Vinaio.' },
    ],
    transportation: {
      primary: 'Walk almost everywhere; bus for distance; train for day trips.',
      tips: 'Don’t drive into the ZTL zone — fines are steep. Book attractions in advance.',
    },
    neighborhoods: [
      { name: 'Centro Storico', blurb: 'Duomo, Piazza Signoria, the Renaissance core.' },
      { name: 'Oltrarno', blurb: 'Artisan workshops, Pitti Palace, less touristy.' },
      { name: 'San Lorenzo', blurb: 'Central Market, leather goods, breakfast cafés.' },
      { name: 'Santa Croce', blurb: 'Leather school, Santa Croce church, evening aperitivo.' },
    ],
    safety: 'Very safe. Pickpockets near Ponte Vecchio and Duomo.',
  },

  venice: {
    bestTimeToVisit: {
      months: 'April–June, September–November',
      blurb: 'November–March can flood (acqua alta). July–August is hot and packed. April or October is the sweet spot.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 450,
      blurb: 'Venice is expensive — hotels are tight, gondolas are €80–100/30 min. Cicchetti and standing wine bars stretch budget.',
    },
    travelStyles: {
      family: 'Gondola ride (split costs), Murano glass-blowing demo, Lido beach in summer.',
      couples: 'Sunset gondola, Burano day trip for the painted houses, hidden cicchetti bars.',
      solo: 'Magical early mornings; quietly crowded by 10am. Stay 2+ nights to experience after-day-trippers leave.',
    },
    food: [
      { dish: 'Cicchetti', note: 'Venetian tapas — All’Arco and Cantine del Vino già Schiavi are classics.' },
      { dish: 'Sarde in Saor', note: 'Sweet-and-sour marinated sardines — uniquely Venetian.' },
      { dish: 'Risotto al Nero di Seppia', note: 'Black squid-ink risotto.' },
      { dish: 'Spritz', note: 'Aperol + prosecco + soda. Invented here in the 19th century.' },
    ],
    transportation: {
      primary: 'Walking + vaporetto (waterbus).',
      tips: 'Get a multi-day vaporetto pass. Avoid Grand Canal at noon — go early or after sunset.',
    },
    neighborhoods: [
      { name: 'San Marco', blurb: 'Doge’s Palace, the iconic square, postcard Venice.' },
      { name: 'Cannaregio', blurb: 'Local feel, Jewish Ghetto, cicchetti bars.' },
      { name: 'Dorsoduro', blurb: 'Peggy Guggenheim, art galleries, quieter at night.' },
      { name: 'Castello', blurb: 'Residential, Arsenale, garden-park during Biennale.' },
    ],
    safety: 'Very safe. The real risk is getting lost — embrace it; Venice is small enough to find your way.',
  },

  cappadocia: {
    bestTimeToVisit: {
      months: 'April–June, September–November',
      blurb: 'Mild temps and clear skies for balloon flights. July–August hot, winter beautiful with snow + balloons.',
    },
    budget: {
      budgetDailyUSD: 40,
      midDailyUSD: 110,
      luxuryDailyUSD: 300,
      blurb: 'Cave hotels are reasonable for the experience; balloon flights are the main splurge ($150–250 pp).',
    },
    travelStyles: {
      family: 'Cave hotels (kids love them), pottery class in Avanos, gentle horse rides.',
      couples: 'Sunrise balloon flight, sunset at Red Valley, candlelit cave dinner.',
      solo: 'Easy and welcoming; group tours common; lots of social hostels.',
    },
    food: [
      { dish: 'Testi Kebab', note: 'Meat slow-cooked in a clay pot, broken open at the table.' },
      { dish: 'Gözleme', note: 'Stuffed flatbread cooked on a saç — try a roadside stop.' },
      { dish: 'Manti', note: 'Tiny meat dumplings with yogurt and chili butter.' },
      { dish: 'Turkish breakfast', note: 'Spread of cheeses, olives, eggs, jams, simit — a 2-hour event.' },
    ],
    transportation: {
      primary: 'Rental car or organized tours between sites; walking within towns.',
      tips: 'Balloon flights book up — reserve before arrival. Cancellations happen for wind; build a buffer day.',
    },
    neighborhoods: [
      { name: 'Göreme', blurb: 'Tourist hub, balloon liftoff, most cave hotels.' },
      { name: 'Ürgüp', blurb: 'Boutique cave hotels, wine cellars, less touristy.' },
      { name: 'Uçhisar', blurb: 'Tallest castle rock, luxury cave hotels.' },
      { name: 'Avanos', blurb: 'Pottery town along the Red River.' },
    ],
    safety: 'Very safe. Balloons are weather-dependent — don’t pressure a pilot to fly in marginal conditions.',
  },

  istanbul: {
    bestTimeToVisit: {
      months: 'April–May, September–November',
      blurb: 'Mild and dry. Summer is hot but evenings are lovely. Winters are wet, occasionally snowy.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 100,
      luxuryDailyUSD: 300,
      blurb: 'Excellent value city — street food is genuinely cheap, hotels stretch further than Western Europe.',
    },
    travelStyles: {
      family: 'Topkapi Palace, Princes’ Islands day trip (no cars, horse carriages), Miniaturk theme park.',
      couples: 'Bosphorus dinner cruise, Turkish hamam, sunset rooftop at Mikla.',
      solo: 'Easy and welcoming; massive city to lose yourself in. Stay in Beyoğlu or Sultanahmet.',
    },
    food: [
      { dish: 'Turkish Breakfast', note: 'A spread — Van Kahvalti Evi or Privato Cafe.' },
      { dish: 'Kebabs', note: 'Adana, Iskender, Doner — each city has a style; try multiple.' },
      { dish: 'Simit', note: 'Sesame-crusted bread ring, sold on every corner.' },
      { dish: 'Baklava', note: 'Karaköy Güllüoğlu is the most famous — perfect glaze.' },
      { dish: 'Pide', note: 'Turkish flatbread pizza, often boat-shaped.' },
    ],
    transportation: {
      primary: 'Tram + ferry + walking; Metro for distance.',
      tips: 'Buy an Istanbulkart. The ferry between Eminönü and Üsküdar is a $0.50 mini cruise. Avoid driving.',
    },
    neighborhoods: [
      { name: 'Sultanahmet', blurb: 'Hagia Sophia, Blue Mosque, Topkapi — the historic core.' },
      { name: 'Beyoğlu', blurb: 'Istiklal Avenue, Galata Tower, modern nightlife.' },
      { name: 'Karaköy', blurb: 'Galleries, third-wave coffee, hip galleries.' },
      { name: 'Kadıköy', blurb: 'Asian side, food markets, Moda promenade.' },
    ],
    safety: 'Generally safe. Pickpockets in Sultanahmet; avoid Istiklal protests; respect mosque dress codes.',
  },

  'new-york': {
    bestTimeToVisit: {
      months: 'April–June, September–November',
      blurb: 'Mild temps, lower humidity than July–August, Central Park at its best. December has holiday magic but cold.',
    },
    budget: {
      budgetDailyUSD: 100,
      midDailyUSD: 250,
      luxuryDailyUSD: 700,
      blurb: 'New York is expensive. Free museums (the Met by donation, MoMA on Fridays) and slice pizzas keep budget days possible.',
    },
    travelStyles: {
      family: 'Central Park, American Museum of Natural History, Broadway shows (Aladdin, Lion King). Coney Island for older kids.',
      couples: 'Rooftop bars, brownstone walks in Brooklyn Heights, jazz at the Village Vanguard.',
      solo: 'Built for solo — anonymity is a feature. Stay in West Village or Williamsburg.',
    },
    food: [
      { dish: 'Pizza', note: 'Joe’s on Carmine for slices, Lucali (Brooklyn) for whole pies.' },
      { dish: 'Bagels', note: 'Russ & Daughters or Ess-a-Bagel — toasted is sacrilege.' },
      { dish: 'Deli Sandwich', note: 'Katz’s pastrami — get it on rye with mustard.' },
      { dish: 'Brunch', note: 'A Sunday institution. Jack’s Wife Freda or Sadelle’s.' },
      { dish: 'Halal Cart', note: 'The Halal Guys on 53rd & 6th — chicken over rice, white sauce, red sauce.' },
    ],
    transportation: {
      primary: 'Subway 24/7. Walk for short hops. Yellow taxis or Uber for late nights.',
      tips: 'Get an OMNY contactless card (or use your phone). Avoid the Subway 7 line during a Mets game.',
    },
    neighborhoods: [
      { name: 'Manhattan', blurb: 'Central Park, the icons, the tourists.' },
      { name: 'Brooklyn', blurb: 'Williamsburg for food, DUMBO for the Manhattan skyline shot.' },
      { name: 'West Village', blurb: 'Brownstones, narrow streets, Sex and the City filming locations.' },
      { name: 'Queens', blurb: 'Most diverse food in the country — Flushing for Chinese, Astoria for Greek.' },
    ],
    safety: 'Generally safe; awareness on late-night Subway. Manhattan is genuinely the safest part.',
  },

  'los-angeles': {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild dry days. Summer is hot inland but breezy at the beach. December–February is the rainy season.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 200,
      luxuryDailyUSD: 600,
      blurb: 'Car rental adds cost; food trucks and beach picnics save days. Hotels jump high in Santa Monica.',
    },
    travelStyles: {
      family: 'Disneyland, Universal Studios, La Brea Tar Pits, Santa Monica Pier. Plan around traffic.',
      couples: 'Malibu sunset drive on PCH, Griffith Observatory at dusk, rooftop dinners downtown.',
      solo: 'Possible but car-dependent. Stay in Santa Monica or West Hollywood for walkable nights.',
    },
    food: [
      { dish: 'Tacos', note: 'Guisados (Echo Park), Sonoratown (downtown), Leo’s Birria truck.' },
      { dish: 'In-N-Out', note: 'Double-Double Animal Style — a rite of passage.' },
      { dish: 'Sushi', note: 'Sushi Gen for old-school, Sugarfish for accessible omakase.' },
      { dish: 'Korean BBQ', note: 'Park’s BBQ in Koreatown — best in America outside Seoul.' },
      { dish: 'Coffee culture', note: 'Blue Bottle, Verve, G&B — third-wave is the standard.' },
    ],
    transportation: {
      primary: 'Car is essential. Metro covers a fraction. Uber works for short hops.',
      tips: 'Plan around traffic (avoid 7–10am and 4–7pm). Skip the 405 unless you must.',
    },
    neighborhoods: [
      { name: 'Santa Monica', blurb: 'Beach, walkable, the pier.' },
      { name: 'Hollywood', blurb: 'Walk of Fame, Griffith Park, the tourist core.' },
      { name: 'West Hollywood', blurb: 'Food scene, nightlife, design district.' },
      { name: 'Echo Park', blurb: 'Hip, hilly, indie food and music.' },
    ],
    safety: 'Mostly safe in tourist areas. Avoid Skid Row (downtown); be aware of car break-ins everywhere.',
  },

  miami: {
    bestTimeToVisit: {
      months: 'November–April',
      blurb: 'Dry season — warm but not humid. June–October is hurricane season; rooms are cheaper.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 200,
      luxuryDailyUSD: 600,
      blurb: 'South Beach hotels are pricey; staying in Brickell or Wynwood saves money. Food trucks are great value.',
    },
    travelStyles: {
      family: 'Zoo Miami, Bayside Marketplace boat tour, beach days, Wynwood Walls for older kids.',
      couples: 'South Beach hotels, Wynwood mural walks, dinner at Versace Mansion.',
      solo: 'Doable; the club scene is couples-heavy. Stay in Brickell for solo-friendly energy.',
    },
    food: [
      { dish: 'Cubano sandwich', note: 'Versailles Restaurant in Little Havana — the classic.' },
      { dish: 'Ceviche', note: 'CVI.CHE 105 (downtown) for Peruvian-style.' },
      { dish: 'Stone Crab', note: 'Joe’s Stone Crab — in season October–May only.' },
      { dish: 'Cafecito', note: 'Tiny Cuban espresso with sugar — the city’s 3pm ritual.' },
    ],
    transportation: {
      primary: 'Car or Uber; the Metromover is free downtown but limited.',
      tips: 'Avoid driving on Ocean Drive during peak weekends. Parking is expensive everywhere.',
    },
    neighborhoods: [
      { name: 'South Beach', blurb: 'Beach, nightlife, art deco hotels.' },
      { name: 'Wynwood', blurb: 'Murals, breweries, indie galleries.' },
      { name: 'Brickell', blurb: 'Modern, walkable, business district.' },
      { name: 'Little Havana', blurb: 'Cuban food, cigar rollers, domino park.' },
    ],
    safety: 'Mostly safe; common-sense at night in Overtown. Watch for car break-ins on the beach.',
  },

  cancun: {
    bestTimeToVisit: {
      months: 'December–April',
      blurb: 'Dry season — warm, lower humidity, ideal beach weather. Summer hot and rainy; September peak hurricane risk.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 140,
      luxuryDailyUSD: 400,
      blurb: 'All-inclusive resorts dominate; staying downtown ("Centro") saves substantially with great local food.',
    },
    travelStyles: {
      family: 'Cenote tours, Xcaret eco-park (a full day), beach days, Mayan ruins at Tulum or Chichén Itzá.',
      couples: 'All-inclusive resort honeymoon, Cozumel snorkel day, Cobá ruins, beachfront candlelit dinner.',
      solo: 'Safer in the Hotel Zone than downtown; group tours common; the destination skews couples/family.',
    },
    food: [
      { dish: 'Ceviche', note: 'Caribbean style with fresh local fish — La Habichuela.' },
      { dish: 'Tacos al Pastor', note: 'Pork from a vertical spit, with pineapple. Best from downtown stands.' },
      { dish: 'Mezcal', note: 'Smoky cousin to tequila; sip slowly — La Destilería in Mérida is the spot.' },
      { dish: 'Marquesitas', note: 'Yucatán dessert crêpe with Edam cheese (yes really) and Nutella.' },
    ],
    transportation: {
      primary: 'Buses (ADO) for distance; taxis or rental for the ruins.',
      tips: 'Use only authorized taxis. Drive carefully outside cities at night.',
    },
    neighborhoods: [
      { name: 'Hotel Zone (Zona Hotelera)', blurb: 'Beachfront resorts, malls, the touristy core.' },
      { name: 'Downtown (El Centro)', blurb: 'Local Cancún, authentic food, half the price.' },
      { name: 'Isla Mujeres', blurb: 'Day-trip island — golf-cart pace, snorkeling, El Garrafón park.' },
    ],
    safety: 'Hotel Zone is safe; cartel violence has touched some other regions of Mexico but Cancún tourist zones are well-policed.',
  },

  tulum: {
    bestTimeToVisit: {
      months: 'November–April',
      blurb: 'Dry season — warm and clear. Sargassum seaweed is a year-round issue but worst May–August.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 160,
      luxuryDailyUSD: 450,
      blurb: 'Tulum prices have risen sharply — beach-zone restaurants are NYC-priced; town side is half the cost.',
    },
    travelStyles: {
      family: 'Cenotes (Gran Cenote, Dos Ojos), Mayan ruins at Tulum + Cobá, jungle eco-parks.',
      couples: 'Jungle hotels, candlelit beach club dinners, sunrise yoga.',
      solo: 'Doable, increasingly popular with digital nomads; community events at hostels.',
    },
    food: [
      { dish: 'Cochinita Pibil', note: 'Yucatán slow-roasted pork — Hartwood (book ahead) is the famous spot.' },
      { dish: 'Fresh Fish Tacos', note: 'Taqueria Honorio for breakfast tacos that locals queue for.' },
      { dish: 'Agua Fresca', note: 'Fresh fruit waters — try jamaica (hibiscus) or tamarindo.' },
      { dish: 'Aguachile', note: 'Spicy ceviche with cucumber and chili — a coastal cousin to traditional ceviche.' },
    ],
    transportation: {
      primary: 'Bike, scooter, or ATV for the beach road; taxis for distance.',
      tips: 'Beach road is long — biking gets old in the heat. Use Uber or local taxis at fair rates.',
    },
    neighborhoods: [
      { name: 'Beach Zone (Zona Hotelera)', blurb: 'Cliffside hotels, beach clubs, the Instagram strip.' },
      { name: 'Tulum Pueblo (Town)', blurb: 'Authentic restaurants, half the price, the locals’ side.' },
      { name: 'Aldea Zama', blurb: 'Newer development with apartments — nomad-friendly base.' },
    ],
    safety: 'Generally safe; recent uptick in incidents. Avoid the beach road alone late at night; don’t flash valuables.',
  },

  dubai: {
    bestTimeToVisit: {
      months: 'November–March',
      blurb: 'Cooler temperatures (20–28°C). Summer (June–August) is 40°C+ — survivable only with malls and AC.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 180,
      luxuryDailyUSD: 600,
      blurb: 'Hotels are pricey at the top; shawarma joints and food courts are excellent value.',
    },
    travelStyles: {
      family: 'Dubai Mall + Aquarium, Aquaventure waterpark at Atlantis, desert safari, Global Village.',
      couples: 'Burj Khalifa at sunset, dune dinner with belly dancing, fine dining at Pierchic.',
      solo: 'Very safe; modern; lots of solo travelers in transit. Stay in Marina for walkability.',
    },
    food: [
      { dish: 'Shawarma', note: 'Operation Falafel, Al Mallah — under $5 and reliably good.' },
      { dish: 'Manakeesh', note: 'Lebanese flatbread breakfast with za’atar.' },
      { dish: 'Fine Dining', note: 'Zuma, Nobu, Pierchic — Dubai’s strength is global luxury cuisine.' },
      { dish: 'Camel Burger', note: 'Local Emirati novelty — Local House Restaurant in Bastakiya.' },
    ],
    transportation: {
      primary: 'Metro is fast and cheap; taxis are honest and metered.',
      tips: 'Buy a Nol card. Friday is the weekend day in UAE; many things open later or close.',
    },
    neighborhoods: [
      { name: 'Downtown Dubai', blurb: 'Burj Khalifa, Dubai Mall, fountain show.' },
      { name: 'Marina', blurb: 'Waterfront, walkable, beach-adjacent.' },
      { name: 'Jumeirah', blurb: 'Beach, Burj Al Arab, residential luxury.' },
      { name: 'Old Dubai (Deira/Bur Dubai)', blurb: 'Gold + spice souks, dhow river crossings, traditional side.' },
    ],
    safety: 'Extremely safe. Respect dress codes (cover shoulders + knees in public). Alcohol only at licensed venues. Ramadan customs.',
  },

  marrakech: {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild and dry. Summer is brutally hot (40°C). Winter is cool and pleasant.',
    },
    budget: {
      budgetDailyUSD: 30,
      midDailyUSD: 90,
      luxuryDailyUSD: 300,
      blurb: 'Riads are excellent value; food is genuinely cheap. Hammams and Atlas day trips are the main splurges.',
    },
    travelStyles: {
      family: 'Riads with pools, Atlas Mountains day trip, Yves Saint Laurent garden, camel ride.',
      couples: 'Hammam spa together, riad rooftop dinner, Sahara overnight excursion.',
      solo: 'Easy for men; women travelers report hassle in souks. Group tours common.',
    },
    food: [
      { dish: 'Tagine', note: 'Slow-cooked stew in a clay pot — chicken-and-preserved-lemon is the classic.' },
      { dish: 'Couscous', note: 'Traditionally served on Fridays — try at a riad.' },
      { dish: 'Mint Tea', note: 'Endless small cups, the national hospitality ritual.' },
      { dish: 'Pastilla', note: 'Layered phyllo with pigeon or chicken + almonds + sugar — sweet-savory.' },
    ],
    transportation: {
      primary: 'Walking in the medina; taxis (negotiate fare in advance) for distance.',
      tips: 'Petit taxis (small beige cabs) by meter. Pedestrians have no right of way — be alert.',
    },
    neighborhoods: [
      { name: 'Medina', blurb: 'Walled old town, souks, the riads.' },
      { name: 'Gueliz', blurb: 'Modern French quarter, cafés, shopping.' },
      { name: 'Hivernage', blurb: 'Luxury hotels, residential, calm.' },
      { name: 'Palmeraie', blurb: 'Oasis on the outskirts, luxury resorts, camel rides.' },
    ],
    safety: 'Generally safe; vendors persistent in souks; pickpockets in Jemaa el-Fnaa square; respect modest dress.',
  },

  'cape-town': {
    bestTimeToVisit: {
      months: 'November–February',
      blurb: 'Their summer — warm and dry. April–September is winter (their term) — cool, wet, but whales arrive June–November.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 400,
      blurb: 'Exceptional value for the quality — luxury wine farms cost a fraction of European equivalents.',
    },
    travelStyles: {
      family: 'Two Oceans Aquarium, Boulders Beach penguins, Table Mountain cable car, Kirstenbosch Gardens.',
      couples: 'Wine farm afternoons in Stellenbosch, Camps Bay sunset dinner, Cape Point road trip.',
      solo: 'Doable but book day tours; avoid walking alone after dark; rent a car for flexibility.',
    },
    food: [
      { dish: 'Braai', note: 'South African BBQ — try at a wine farm restaurant.' },
      { dish: 'Biltong', note: 'Spiced dried meat — Karoo Cattle & Land does great cuts.' },
      { dish: 'Bobotie', note: 'Spiced minced-meat casserole — the Cape Malay national dish.' },
      { dish: 'Cape Wines', note: 'Pinotage and Chenin Blanc — Stellenbosch and Franschhoek wine valleys.' },
      { dish: 'Malva Pudding', note: 'Warm spongy dessert with apricot caramel.' },
    ],
    transportation: {
      primary: 'Rent a car or use Uber; Cape Town’s public transit isn’t tourist-friendly.',
      tips: 'Self-drive is doable for confident drivers (left-hand-drive country). Don’t walk between Camps Bay and town at night.',
    },
    neighborhoods: [
      { name: 'City Bowl', blurb: 'Central, bowls between Table Mountain and the harbour.' },
      { name: 'V&A Waterfront', blurb: 'Tourist-friendly, restaurants, the Two Oceans Aquarium.' },
      { name: 'Camps Bay', blurb: 'Beach + Twelve Apostles backdrop — postcard Cape Town.' },
      { name: 'Bo-Kaap', blurb: 'Colorful houses, Cape Malay culture, the most photographed street.' },
    ],
    safety: 'Mostly safe in tourist areas. Don’t walk alone after dark; petty theft and car break-ins common; townships should only be visited with a guide.',
  },

  sydney: {
    bestTimeToVisit: {
      months: 'October–April',
      blurb: 'Their summer — beaches and outdoor everything. January can hit 35°C+. June–August is their winter (mild, 15°C).',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 170,
      luxuryDailyUSD: 500,
      blurb: 'Sydney is expensive. Beach picnics and bakeries help; flat whites and brunch are cheaper than NYC equivalents.',
    },
    travelStyles: {
      family: 'Taronga Zoo (the harbour view alone is worth it), Sea Life Sydney Aquarium, Manly ferry, Luna Park.',
      couples: 'Bondi-to-Coogee coastal walk, harbour cruise at sunset, Watson’s Bay seafood lunch.',
      solo: 'Easy and friendly. English-speaking, lots of co-working, great brunch culture for solo dining.',
    },
    food: [
      { dish: 'Meat Pies', note: 'Harry’s Cafe de Wheels at Woolloomooloo — a Sydney institution since 1938.' },
      { dish: 'Flat White', note: 'Australia invented it. Single Origin, Toby’s Estate, Reuben Hills.' },
      { dish: 'Fish & Chips', note: 'At Watson’s Bay or Manly with harbour views.' },
      { dish: 'Brunch', note: 'Bills (ricotta pancakes), Bourke Street Bakery, Three Blue Ducks.' },
    ],
    transportation: {
      primary: 'Train, ferry (essential), bus, walking. The ferry between Circular Quay and Manly is a $6 must-do.',
      tips: 'Get an Opal card. Sundays cap fares at $8.40 — explore the suburbs cheaply.',
    },
    neighborhoods: [
      { name: 'Bondi', blurb: 'Iconic beach, surf culture, the coastal walk.' },
      { name: 'Surry Hills', blurb: 'Food scene, indie shops, walkable.' },
      { name: 'Newtown', blurb: 'Boho, vintage shops, gritty-cool.' },
      { name: 'Manly', blurb: 'Beach village across the harbour — ferry there for a half-day.' },
    ],
    safety: 'Very safe. The biggest real risks are sunburn, surf rips, and walking past Kings Cross late on a Saturday.',
  },

  'da-nang': {
    bestTimeToVisit: {
      months: 'February–May',
      blurb: 'Dry season with warm water and clear skies; July–August is hottest, September–November sees occasional storms.',
    },
    budget: {
      budgetDailyUSD: 30,
      midDailyUSD: 70,
      luxuryDailyUSD: 220,
      blurb: 'Beachfront resorts are excellent value; Hoi An day-trips add a few dollars by Grab.',
    },
    travelStyles: {
      family: 'Long flat beaches and the kid-friendly Sun World park on Ba Na Hills; cooking classes welcome families.',
      couples: 'Sunset balconies over My Khe beach, marble mountain hikes, an evening trip to lantern-lit Hoi An.',
      solo: 'Quiet, cheap, and easy — beachfront hostels, surf schools, and an expat café scene to plug into.',
    },
    food: [
      { dish: 'Mì Quảng', note: 'Turmeric noodles with shrimp, peanuts, and rice cracker — central Vietnam classic.' },
      { dish: 'Bánh xèo', note: 'Crispy savory pancakes wrapped with greens at street-side grills.' },
      { dish: 'Bún chả cá', note: 'Fish-cake noodle soup, the local breakfast — find it before 10am.' },
      { dish: 'Fresh seafood', note: 'Grilled prawns and clams on the beach strip after sunset.' },
    ],
    transportation: {
      primary: 'Grab cars and motorbike taxis are cheap; the city is flat and easy to scooter.',
      tips: 'Negotiate motorbike rental from a hotel rather than the airport for honest prices.',
    },
    neighborhoods: [
      { name: 'My Khe Beach', blurb: 'Long beach strip with resorts, cafés, and surf schools.' },
      { name: 'Han River', blurb: 'City-centre promenades, the Dragon Bridge fire show on weekends.' },
      { name: 'Son Tra Peninsula', blurb: 'Forested headland, pagoda viewpoints, monkey-watch turnouts.' },
    ],
    safety: 'Very safe by day and night. Watch traffic crossing roads; petty theft is rare but bag-snatching from scooters happens occasionally.',
  },

  sapporo: {
    bestTimeToVisit: {
      months: 'January–February, June–August',
      blurb: 'Snow Festival peaks in early February; summers are mild and lavender-bright across Hokkaido.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 130,
      luxuryDailyUSD: 320,
      blurb: 'Ramen and izakaya dinners stretch a budget far; ski packages and onsen ryokan push the top tier.',
    },
    travelStyles: {
      family: 'Sapporo Beer Park gardens, Moerenuma art park, and the Otaru aquarium are kid-tested winners.',
      couples: 'Snow Festival nights at Odori Park, hot springs at Jozankei, sushi counters at Nijo Market.',
      solo: 'Easy solo eating — every ramen counter has a single seat, and the subway is gentle for newcomers.',
    },
    food: [
      { dish: 'Miso ramen', note: 'Sapporo invented the miso style — heavier broth than Tokyo or Hakata.' },
      { dish: 'Genghis Khan (jingisukan)', note: 'Grilled mutton on a domed pan — local Hokkaido specialty.' },
      { dish: 'Soup curry', note: 'Sapporo signature — Japanese curry as a vegetable-packed soup.' },
      { dish: 'Hokkaido seafood', note: 'Crab, salmon, sea urchin — Nijo Market for fresh, Susukino for the bars.' },
    ],
    transportation: {
      primary: 'Subway covers downtown; JR trains reach Otaru, Niseko, and the airport.',
      tips: 'Buy the Sapporo Welcome Card if you’re here 2+ days for discounted attractions and transit.',
    },
    neighborhoods: [
      { name: 'Susukino', blurb: 'Nightlife district — ramen alleys, izakaya, neon-lit blocks.' },
      { name: 'Odori', blurb: 'Long central park, Snow Festival main site, TV Tower views.' },
      { name: 'Maruyama', blurb: 'Quieter side with the shrine, the zoo, and walkable neighborhoods.' },
    ],
    safety: 'Extremely safe. Real risks are winter ice on sidewalks and bear warnings on rural hikes — stay on trails.',
  },

  penang: {
    bestTimeToVisit: {
      months: 'December–February',
      blurb: 'Coolest dry months with the lowest humidity; April–October is hotter with afternoon storms.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 85,
      luxuryDailyUSD: 250,
      blurb: 'Hawker meals run a few dollars; the heritage-hotel restorations in Georgetown push the luxury tier.',
    },
    travelStyles: {
      family: 'Entopia butterfly farm, Penang Hill funicular, beach mornings at Batu Ferringhi — easy for kids.',
      couples: 'Heritage hotel courtyards, street-art lanes at golden hour, a Penang Hill sunset for a long dinner after.',
      solo: 'Friendly and cheap — hawker centres make solo eating effortless, and the heritage walking tours give structure.',
    },
    food: [
      { dish: 'Char kway teow', note: 'Wok-fried flat noodles with prawns and chinese sausage — Penang’s signature dish.' },
      { dish: 'Assam laksa', note: 'Tamarind-sour fish noodle soup — try the Air Itam market stall.' },
      { dish: 'Cendol', note: 'Iced dessert with palm sugar, coconut milk, and green pandan jelly.' },
      { dish: 'Nasi kandar', note: 'Mixed-curry rice plates — a Penang Muslim specialty open 24 hours.' },
    ],
    transportation: {
      primary: 'Grab is cheap and covers the island; Rapid Penang buses link Georgetown to the beaches.',
      tips: 'Walk Georgetown’s heritage core — it’s flat and the lanes are too narrow for car tours to do them justice.',
    },
    neighborhoods: [
      { name: 'Georgetown', blurb: 'UNESCO-listed heritage city — clan houses, mural lanes, hawker centres.' },
      { name: 'Batu Ferringhi', blurb: 'Beach strip with resort hotels and the weekend night market.' },
      { name: 'Air Itam', blurb: 'Hill-foot suburb with the Kek Lok Si temple complex and the laksa origin stall.' },
    ],
    safety: 'Very safe for travelers. Watch valuables in market crowds and use Grab over solo walks late at night in unfamiliar areas.',
  },

  granada: {
    bestTimeToVisit: {
      months: 'April–May, September–October',
      blurb: 'Mild temperatures and lower crowds at the Alhambra; book tickets two months ahead in shoulder season.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 120,
      luxuryDailyUSD: 280,
      blurb: 'Free tapas with every drink stretches the budget tier; parador stays push the luxury tier.',
    },
    travelStyles: {
      family: 'Alhambra in the morning before the heat, science park afternoons, evening strolls through the Albayzín.',
      couples: 'Flamenco caves in Sacromonte, a sunset view of the Alhambra from the Mirador San Nicolás.',
      solo: 'Tapas crawls make solo dining easy — order a drink and the snack is on the house in this city.',
    },
    food: [
      { dish: 'Free tapas', note: 'Granada serves a free tapa with every drink — bar-hop through the historic centre.' },
      { dish: 'Pionono', note: 'Tiny rolled custard cake from nearby Santa Fe, in every bakery.' },
      { dish: 'Plato alpujarreño', note: 'Sierra Nevada mountain plate — sausage, blood pudding, eggs, potatoes.' },
      { dish: 'Berenjenas con miel', note: 'Fried aubergine with cane honey — the iconic Granada starter.' },
    ],
    transportation: {
      primary: 'The historic centre is walkable; minibuses (C1/C2) climb the hills.',
      tips: 'Book Alhambra tickets weeks ahead; the Nasrid Palaces sell out months in advance in summer.',
    },
    neighborhoods: [
      { name: 'Albayzín', blurb: 'Moorish hilltop quarter — narrow lanes, viewpoints, traditional carmen houses.' },
      { name: 'Sacromonte', blurb: 'Cave-house district with flamenco shows and Roma history.' },
      { name: 'Realejo', blurb: 'Old Jewish quarter — street art, tapas bars, walking distance from the Alhambra.' },
    ],
    safety: 'Very safe day and night. Pickpockets work the busiest tourist streets near the Alhambra — keep bags in front.',
  },

  porto: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Long sunny days without August heat; harvest season in the Douro valley peaks in September.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 130,
      luxuryDailyUSD: 320,
      blurb: 'Tile-fronted guesthouses keep the budget tier cheap; Douro-valley boutique stays push the top.',
    },
    travelStyles: {
      family: 'Tram rides along the river, beach trams to Foz do Douro, the Lello bookstore, cellar tours with kid-tasting alternatives.',
      couples: 'Port-tasting flights in Vila Nova de Gaia, a sunset cruise under the bridges, a Douro Valley day trip.',
      solo: 'Compact, walkable, and full of café terraces — easy solo travel with a strong English-speaking hospitality scene.',
    },
    food: [
      { dish: 'Francesinha', note: 'Layered meat sandwich smothered in beer-tomato sauce — Porto invented it.' },
      { dish: 'Bacalhau à Brás', note: 'Salt cod with onions, fried potato matchsticks, eggs — the Lisbon-Porto classic.' },
      { dish: 'Tripas à moda do Porto', note: 'Tripe stew with white beans — Porto’s identity dish, served in old taverns.' },
      { dish: 'Pastel de nata', note: 'Custard tarts — every bakery has them hot from the oven by 9 am.' },
    ],
    transportation: {
      primary: 'Metro lines reach the airport, beaches, and Vila Nova de Gaia; the historic centre is steeply walkable.',
      tips: 'Buy an Andante card for metro/bus/tram; the funicular saves the steep climb up from the river.',
    },
    neighborhoods: [
      { name: 'Ribeira', blurb: 'UNESCO riverside — colorful houses, restaurants, the Dom Luís I bridge.' },
      { name: 'Vila Nova de Gaia', blurb: 'Port wine cellars across the river — tasting flights, sunset terraces.' },
      { name: 'Foz do Douro', blurb: 'Where river meets sea — beach cafés, seafood, the lighthouse promenade.' },
    ],
    safety: 'Very safe. The biggest risks are slippery cobbles on rainy days and pickpockets on Metro line D to the airport.',
  },

  bruges: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Shoulder months balance long days with smaller day-tripper waves; December has Christmas-market evenings.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 150,
      luxuryDailyUSD: 360,
      blurb: 'Mussels and frites keep the budget tier honest; canal-facing rooms push the luxury tier hard.',
    },
    travelStyles: {
      family: 'Horse-drawn carriage tours, chocolate-making workshops, a kid-friendly canal boat in the afternoon.',
      couples: 'Quiet candlelit dinners on the canals after the day-trippers leave; sunset from the Belfry.',
      solo: 'Walkable, well-lit, and easy to navigate — a perfect 24-hour solo break with no transit friction.',
    },
    food: [
      { dish: 'Moules-frites', note: 'Mussels with frites — order them in white wine sauce on a canal terrace.' },
      { dish: 'Belgian frites', note: 'Twice-fried perfection from a frietkot — try them with andalouse sauce.' },
      { dish: 'Stoofvlees', note: 'Beef and beer stew, slow-cooked, served with frites — the Belgian comfort dish.' },
      { dish: 'Belgian chocolate', note: 'Every other shop is a chocolatier — the best are on Mariastraat.' },
    ],
    transportation: {
      primary: 'The historic core is fully walkable; trains link to Brussels (1 hour) and Ghent (25 min).',
      tips: 'Rent a bike — Bruges is flat and a bicycle gets you to the windmills and quiet quarters fast.',
    },
    neighborhoods: [
      { name: 'Markt', blurb: 'Central market square — Belfry tower, restaurants, the city heart.' },
      { name: 'Beguinage', blurb: 'White-walled, swan-filled, quiet — the most photographed quarter.' },
      { name: 'Sint-Anna', blurb: 'Quieter residential side — windmills, the lace centre, fewer tourists.' },
    ],
    safety: 'Extremely safe. The biggest hazard is bike traffic — look both ways before crossing cycle lanes.',
  },

  salzburg: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Festival season summer with long evenings; December brings traditional Christmas markets.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 380,
      blurb: 'Hostels and pensions keep budget travel affordable; festival-season hotels triple in price.',
    },
    travelStyles: {
      family: 'Hellbrunn trick fountains, the Mozart birthplace, a Sound of Music bike tour through the meadows.',
      couples: 'Hohensalzburg fortress at golden hour, a classical concert in the Mirabell Palace, alpine lake day trips.',
      solo: 'Compact, safe, English-friendly — and the festival season fills cafés with international travelers.',
    },
    food: [
      { dish: 'Salzburger Nockerl', note: 'Soufflé-style dessert representing the three city hills — order to share.' },
      { dish: 'Wiener Schnitzel', note: 'Pounded veal, breaded and pan-fried, served with potato salad.' },
      { dish: 'Käsespätzle', note: 'Egg noodles baked with mountain cheese and fried onions — alpine comfort food.' },
      { dish: 'Tafelspitz', note: 'Boiled beef in broth with horseradish — the imperial Austrian classic.' },
    ],
    transportation: {
      primary: 'The old town is fully walkable; buses cover the suburbs and the Untersberg cable car.',
      tips: 'The Salzburg Card includes transit and most attractions — break-even after two museum visits.',
    },
    neighborhoods: [
      { name: 'Altstadt', blurb: 'Baroque old town on the river’s left bank — Mozart’s birthplace, Getreidegasse shops.' },
      { name: 'Mirabell', blurb: 'Across the river — Mirabell Palace gardens and the Sound of Music opening shots.' },
      { name: 'Mönchsberg', blurb: 'The cliff-top behind old town — fortress views, Museum der Moderne.' },
    ],
    safety: 'Extremely safe. Pickpockets work busy festival crowds — keep tickets and cards in a front pocket.',
  },

  split: {
    bestTimeToVisit: {
      months: 'May–June, September',
      blurb: 'Warm sea, fewer crowds, and ferries to the islands run full schedules; July–August is peak heat.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 130,
      luxuryDailyUSD: 320,
      blurb: 'Konobas (family taverns) keep dinner cheap; harbour-view rooms triple in peak season.',
    },
    travelStyles: {
      family: 'Beach mornings at Bačvice, Diocletian’s Palace as a kid-friendly Roman maze, ferries to Brač for swimming.',
      couples: 'Island hopping to Hvar at sunset, harbour-view dinners, a Krka waterfalls day trip.',
      solo: 'Hostel-friendly party hub with ferry-day options to escape — easy social scene for solo backpackers.',
    },
    food: [
      { dish: 'Pašticada', note: 'Slow-braised beef in red wine and prunes — the Dalmatian Sunday lunch.' },
      { dish: 'Crni rižot', note: 'Black cuttlefish risotto, deeply briny and dark — a coastal classic.' },
      { dish: 'Peka', note: 'Meat and vegetables baked under a bell-shaped lid — order ahead, eat slowly.' },
      { dish: 'Fresh sea urchin', note: 'Cracked open at harbour stalls in spring — eat with a spoon and lemon.' },
    ],
    transportation: {
      primary: 'Walk the old town; Jadrolinija ferries reach Hvar, Brač, Vis from the harbour.',
      tips: 'Book ferries in advance in July–August; a daytime catamaran is faster than the overnight car ferry.',
    },
    neighborhoods: [
      { name: 'Diocletian’s Palace', blurb: 'Living Roman palace — restaurants, bars, apartments inside ancient walls.' },
      { name: 'Bačvice', blurb: 'Sandy beach district — the picigin sport is invented and played here.' },
      { name: 'Marjan', blurb: 'Forested peninsula above town — viewpoints, jogging paths, quieter beach coves.' },
    ],
    safety: 'Very safe day and night. The biggest risks are scooter traffic on the Riva and overpriced taxis from the ferry port.',
  },

  helsinki: {
    bestTimeToVisit: {
      months: 'June–August, December',
      blurb: 'Endless summer evenings or proper snow-globe winters with Christmas markets — skip the brown shoulder seasons.',
    },
    budget: {
      budgetDailyUSD: 75,
      midDailyUSD: 170,
      luxuryDailyUSD: 420,
      blurb: 'Lunch buffets and student-area cafés stretch the budget; design-hotel rooms push the top.',
    },
    travelStyles: {
      family: 'Linnanmäki amusement park, the Suomenlinna island ferry, the Helsinki Zoo on Korkeasaari.',
      couples: 'Private sauna evenings, sunset ferry to Suomenlinna, design-district shopping in Punavuori.',
      solo: 'Safe, English-fluent, and walkable — easy to plug into the public sauna and café scene.',
    },
    food: [
      { dish: 'Karjalanpiirakka', note: 'Rye-crust rice pastries with butter and egg — Finnish breakfast staple.' },
      { dish: 'Lohikeitto', note: 'Creamy salmon soup with dill and potato — every café in winter.' },
      { dish: 'Cinnamon buns (korvapuusti)', note: 'Cardamom-laced buns at any bakery — pair with coffee at fika.' },
      { dish: 'Reindeer', note: 'Sautéed reindeer with mashed potato and lingonberry — Finnish comfort dish.' },
    ],
    transportation: {
      primary: 'Tram, metro, and ferry network covers the city; HSL day tickets are great value.',
      tips: 'Walk the design district — it’s flat, dense, and the public transit doesn’t shortcut it well.',
    },
    neighborhoods: [
      { name: 'Punavuori', blurb: 'Design district — concept shops, indie cafés, the Ateneum museum nearby.' },
      { name: 'Kallio', blurb: 'Bohemian neighborhood — cheap eats, hipster bars, neighborhood saunas.' },
      { name: 'Suomenlinna', blurb: 'UNESCO sea fortress island — ferry over, picnic, walk the ramparts.' },
    ],
    safety: 'Among the safest cities in the world. Watch for icy sidewalks in winter and bike lanes year-round.',
  },

  sorrento: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Warm but not crushing heat; July–August has best swimming but Amalfi traffic is brutal.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 180,
      luxuryDailyUSD: 500,
      blurb: 'B&Bs in the hills are affordable; cliffside rooms with caldera views push the luxury tier.',
    },
    travelStyles: {
      family: 'Day-boat trips to Capri, pizza-making classes, easy ferry to Naples for a museum day.',
      couples: 'Sunset Aperol on a cliffside terrace, a private boat day along the Amalfi coast, a long limoncello tasting.',
      solo: 'Hostels are good and the ferry network makes day-trips easy; English is widely spoken in restaurants.',
    },
    food: [
      { dish: 'Gnocchi alla sorrentina', note: 'Baked potato gnocchi with mozzarella and tomato — the local pasta.' },
      { dish: 'Pizza margherita', note: 'Naples is 45 min away — make the trip for the original.' },
      { dish: 'Delizia al limone', note: 'Lemon cream-filled dome cake — Sorrento dessert specialty.' },
      { dish: 'Limoncello', note: 'Made from the IGP-protected Sorrento lemons; tour a small producer for a tasting.' },
    ],
    transportation: {
      primary: 'Circumvesuviana train to Naples, ferries to Capri/Positano/Amalfi from the marina.',
      tips: 'Buy ferry tickets at the marina early in summer; the Amalfi bus is scenic but excruciatingly slow.',
    },
    neighborhoods: [
      { name: 'Piazza Tasso', blurb: 'Central square — restaurants, the town heart, evening passeggiata.' },
      { name: 'Marina Grande', blurb: 'Fishing harbour — old-school seafood restaurants, a small beach.' },
      { name: 'Sant’Agnello', blurb: 'Quieter neighborhood next door — same train, calmer evenings.' },
    ],
    safety: 'Very safe. Watch traffic on the narrow cliffside roads — Italian drivers are confident and the lanes are tight.',
  },

  bologna: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Comfortable temperatures, fewer crowds than Tuscany — the porticoes shelter you year-round.',
    },
    budget: {
      budgetDailyUSD: 65,
      midDailyUSD: 140,
      luxuryDailyUSD: 320,
      blurb: 'Tortellini at a neighborhood trattoria is cheap; central palazzo stays push the luxury tier.',
    },
    travelStyles: {
      family: 'FICO Eataly food park, gelato-making classes, a half-day Ferrari museum trip in Maranello.',
      couples: 'Old osterie behind the Quadrilatero food market, a Lambrusco evening at a cantina, day trips to Modena.',
      solo: 'University-town energy keeps things social, food markets make eating alone easy, and trains link the whole region.',
    },
    food: [
      { dish: 'Tagliatelle al ragù', note: 'The Bolognese — flat egg pasta with slow-cooked meat ragù, never spaghetti.' },
      { dish: 'Tortellini in brodo', note: 'Tiny meat-filled tortellini in clear broth — winter Sunday dish.' },
      { dish: 'Mortadella', note: 'The original Bologna — buy by the slice from the Quadrilatero shops.' },
      { dish: 'Tigelle', note: 'Small Emilian flatbreads filled with lard, prosciutto, or cheese.' },
    ],
    transportation: {
      primary: 'Walk the porticoed centre; high-speed trains reach Florence (35 min), Milan (1h).',
      tips: 'Take a 30-min train to Modena for balsamic vinegar tasting — it’s a small-museum afternoon.',
    },
    neighborhoods: [
      { name: 'Quadrilatero', blurb: 'Medieval market grid — food stalls, osterie, ham shops in tile-walled lanes.' },
      { name: 'University Quarter', blurb: 'Student bars, lively evenings, the world’s oldest university.' },
      { name: 'Santo Stefano', blurb: 'Seven churches around one square — quieter side for slow morning walks.' },
    ],
    safety: 'Very safe. Pickpockets work the train station and Piazza Maggiore in summer — keep bags in front.',
  },

  bordeaux: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Mild before the August heat or just after harvest season — the vines turn gold in October.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 170,
      luxuryDailyUSD: 420,
      blurb: 'Bistros and local cafés are affordable; château stays and Michelin tasting menus push the top.',
    },
    travelStyles: {
      family: 'La Cité du Vin (interactive even for kids), tram rides, day trips to Saint-Émilion vineyards.',
      couples: 'A private château tasting tour, sunset on Place de la Bourse mirror pool, an oyster lunch on Cap Ferret.',
      solo: 'Walkable centre, English-speaking hospitality at La Cité du Vin, easy day-trip group tours from the visitor centre.',
    },
    food: [
      { dish: 'Canelé', note: 'Caramelized fluted pastry, vanilla and rum — the Bordeaux signature, eaten with coffee.' },
      { dish: 'Entrecôte à la bordelaise', note: 'Steak with shallot-red-wine sauce — the local way.' },
      { dish: 'Oysters from Cap Ferret', note: 'Briny, mineral, eaten raw with a squeeze of lemon and a Sauvignon Blanc.' },
      { dish: 'Lamprey à la bordelaise', note: 'Lamprey eel braised in red wine — old-world local specialty.' },
    ],
    transportation: {
      primary: 'Tram network covers the city; rental cars or guided tours reach Saint-Émilion and Médoc.',
      tips: 'Buy a tram day pass and use the bicycle-share for the riverbank — bordeaux is exceptionally flat.',
    },
    neighborhoods: [
      { name: 'Saint-Pierre', blurb: 'Historic centre — Place de la Bourse, restaurants, evening lamp-light.' },
      { name: 'Chartrons', blurb: 'Wine-merchant quarter — antiques, cafés, Sunday market on the quais.' },
      { name: 'Saint-Michel', blurb: 'Trendy multicultural side — kebabs, indie bistros, weekly flea market.' },
    ],
    safety: 'Very safe by daylight; the area around Saint-Michel basilica is rougher late at night — use a taxi after midnight.',
  },

  valencia: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Warm beach weather without August humidity; Las Fallas festival in March is a unique chaotic peak.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 120,
      luxuryDailyUSD: 300,
      blurb: 'Hostels in El Carmen are excellent value; beach-strip apartments stay reasonable except in Fallas week.',
    },
    travelStyles: {
      family: 'Oceanogràfic aquarium, Hemisfèric IMAX, beach days at Malvarrosa, paella cooking classes.',
      couples: 'Riverbed bike rides, beach paella lunches, an evening flamenco show in El Carmen.',
      solo: 'Cheap, sunny, walkable, beach-equipped — Valencia is the friendliest of the big Spanish cities for solo arrivals.',
    },
    food: [
      { dish: 'Paella valenciana', note: 'The original — rabbit, chicken, snails, broad beans; no seafood in the traditional version.' },
      { dish: 'Horchata + fartons', note: 'Chufa-nut milk served ice-cold with a sweet finger pastry — Valencia’s afternoon ritual.' },
      { dish: 'Esgarraet', note: 'Roasted red pepper, salt cod, olives — typical tapa from a mercat stall.' },
      { dish: 'Agua de Valencia', note: 'Sparkling-orange-juice cocktail — the city signature drink.' },
    ],
    transportation: {
      primary: 'Metro reaches the beach and the airport; bicycle network on the dried riverbed is excellent.',
      tips: 'Rent a bike — the Turia riverbed park runs 9 km across the city as an uninterrupted bike lane.',
    },
    neighborhoods: [
      { name: 'El Carmen', blurb: 'Old quarter — narrow lanes, street art, the cathedral, the food market.' },
      { name: 'Ruzafa', blurb: 'Hipster bar district — natural wine spots, brunch, the city’s most stylish nights.' },
      { name: 'Malvarrosa', blurb: 'Beach district — paella-strip restaurants, hostels, the boardwalk runs along the sand.' },
    ],
    safety: 'Very safe overall. Pickpockets work the Estació del Nord and the cathedral square — keep phones in front pockets.',
  },

  boston: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Crisp temperatures, fewer crowds, fall foliage in late October on the Common and along the Charles.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 200,
      luxuryDailyUSD: 500,
      blurb: 'Hotels are expensive year-round; Airbnbs in Cambridge save real money over Back Bay.',
    },
    travelStyles: {
      family: 'Boston Children’s Museum, Duck Boat tours, swan boats in the Public Garden, Fenway tour.',
      couples: 'A walk along the Esplanade, an Italian dinner in the North End, a Charles River sunset.',
      solo: 'Walkable, English-easy, college-town energy that makes solo café days easy.',
    },
    food: [
      { dish: 'Clam chowder', note: 'New England chowder — cream-based, with potatoes and quahog clams.' },
      { dish: 'Lobster roll', note: 'Hot butter (Connecticut style) or cold mayo (Maine style) — Boston serves both.' },
      { dish: 'Boston cream pie', note: 'Cream-filled sponge with chocolate glaze — order it at Parker House where it was invented.' },
      { dish: 'Italian sub in the North End', note: 'Salumeria-cut cold cuts on a fresh roll — Mike’s Pastry for cannoli after.' },
    ],
    transportation: {
      primary: 'The T (subway) covers most of the city; Charlie Cards from any station.',
      tips: 'Walk the Freedom Trail — it’s a real walking route, not a bus tour, and the brick line guides you.',
    },
    neighborhoods: [
      { name: 'Back Bay', blurb: 'Tree-lined brownstones, Newbury Street shopping, the Esplanade riverfront.' },
      { name: 'North End', blurb: 'Italian quarter — bakeries, restaurants, Paul Revere’s house and the Old North Church.' },
      { name: 'Cambridge', blurb: 'Harvard Square across the river — bookstores, coffee shops, the Charles riverbank.' },
    ],
    safety: 'Very safe in tourist neighborhoods. Watch valuables on the T at rush hour; some outer neighborhoods feel rough at night.',
  },

  seattle: {
    bestTimeToVisit: {
      months: 'June–September',
      blurb: 'Long dry summer days when the mountains come out from behind the clouds.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 200,
      luxuryDailyUSD: 500,
      blurb: 'Coffee is cheap and excellent everywhere; downtown hotels stay expensive even off-season.',
    },
    travelStyles: {
      family: 'Pike Place fish-tossing, the Space Needle, the Museum of Pop Culture, ferry rides to Bainbridge.',
      couples: 'A floatplane tour of the islands, sunset at Kerry Park, a Capitol Hill cocktail crawl.',
      solo: 'Coffee-shop friendly, walkable downtown, ferry escapes when you want air — and a strong indie music scene.',
    },
    food: [
      { dish: 'Salmon', note: 'Wild Alaskan king salmon at the market or in a restaurant — peak in June–August.' },
      { dish: 'Dungeness crab', note: 'Sweet Pacific crab — order it cracked at a Pike Place counter.' },
      { dish: 'Teriyaki', note: 'Seattle-style teriyaki — local-grilled chicken with sweet glaze and white rice.' },
      { dish: 'Coffee', note: 'Espresso reverence — try Slate, Elm, Victrola before the Starbucks Reserve.' },
    ],
    transportation: {
      primary: 'Light rail connects the airport to downtown; ferries reach Bainbridge, Bremerton, the San Juans.',
      tips: 'Get an ORCA card for transit; the streetcar is fun but skip in favor of light rail for distance.',
    },
    neighborhoods: [
      { name: 'Capitol Hill', blurb: 'Bar district — coffee shops, music venues, brunch lines on weekends.' },
      { name: 'Ballard', blurb: 'Old fishing town turned cool — locks, breweries, Sunday farmers market.' },
      { name: 'Fremont', blurb: 'Quirky neighborhood — the troll, public art, weekend flea market.' },
    ],
    safety: 'Tourist zones are safe by day; some downtown streets feel uncomfortable after dark — stay on Pike Place / waterfront.',
  },

  'washington-dc': {
    bestTimeToVisit: {
      months: 'March–May, September–October',
      blurb: 'Cherry blossoms in late March/early April; September brings cool sunny days without summer humidity.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 200,
      luxuryDailyUSD: 480,
      blurb: 'Free Smithsonian museums save hundreds; hotel rates spike around inaugurations and cherry blossoms.',
    },
    travelStyles: {
      family: 'Free Smithsonian museums, the National Zoo, a paddle-boat at the Tidal Basin, the Capitol tour.',
      couples: 'A dinner at a 14th Street wine bar, monuments lit at night, a brunch in Georgetown.',
      solo: 'Endless free museums make solo days productive; cafés and rowhouse neighborhoods make evenings easy.',
    },
    food: [
      { dish: 'Half-smoke', note: 'Half-pork, half-beef smoked sausage with chili — the D.C. signature, born at Ben’s Chili Bowl.' },
      { dish: 'Mumbo sauce', note: 'Sweet-tangy red sauce on wings and rice — a Chinese-takeout D.C. standard.' },
      { dish: 'Ethiopian injera', note: 'D.C. has the largest Ethiopian community in the US — try injera at a U Street spot.' },
      { dish: 'Maryland crab cake', note: 'Lump-crab with little filler — the regional dish on every restaurant menu.' },
    ],
    transportation: {
      primary: 'Metro is clean, fast, easy; buy a SmarTrip card from a kiosk.',
      tips: 'Walking the Mall sounds short on the map; it’s 2 miles end-to-end — pace yourself or rent a bike.',
    },
    neighborhoods: [
      { name: 'Georgetown', blurb: 'Historic cobbled streets, M Street shopping, canal walks, Sunday brunch.' },
      { name: 'Dupont Circle', blurb: 'Bookshops, embassy row, indie cafés, walkable to museums and bars.' },
      { name: 'U Street / 14th Street', blurb: 'Live music history, top restaurants, the busy nightlife corridor.' },
    ],
    safety: 'Tourist areas are very safe; some neighborhoods east of the Capitol feel sketchy after dark — use Metro or rideshare.',
  },

  'quebec-city': {
    bestTimeToVisit: {
      months: 'June–September, February',
      blurb: 'Long warm summer evenings on the ramparts, or the chaotic-fun Winter Carnival in February.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 400,
      blurb: 'Bistros and lodging are reasonable outside Carnival week; the Château Frontenac pushes the luxury tier.',
    },
    travelStyles: {
      family: 'Funicular rides, the citadel changing of the guard, Toboggan slide on Dufferin Terrace in winter.',
      couples: 'A walk through Vieux-Québec at sunset, a French dinner on Rue Saint-Jean, hot chocolate in winter.',
      solo: 'French-speaking but English-friendly; safe for evening walks; bistros are welcoming to solo diners.',
    },
    food: [
      { dish: 'Poutine', note: 'Fries, cheese curds, and brown gravy — Quebec invented it; locals know the best spots.' },
      { dish: 'Tourtière', note: 'Quebec meat pie with pork and spices — winter holiday classic, year-round comfort food.' },
      { dish: 'Maple anything', note: 'Maple sugar pie, maple syrup on snow, maple-cured bacon — Quebec is maple country.' },
      { dish: 'Cretons', note: 'Spiced pork spread served on toast — a Quebec breakfast staple.' },
    ],
    transportation: {
      primary: 'Vieux-Québec is fully walkable; buses cover the rest of the city.',
      tips: 'Take the ferry across to Lévis for a free Château Frontenac view — round trip is under $10.',
    },
    neighborhoods: [
      { name: 'Vieux-Québec', blurb: 'Walled old town — the only fortified city in North America north of Mexico.' },
      { name: 'Petit-Champlain', blurb: 'Lower town with the prettiest streets, restaurants, and the Funicular link.' },
      { name: 'Saint-Roch', blurb: 'Hip downtown side — indie bars, third-wave coffee, an arts scene.' },
    ],
    safety: 'Extremely safe day and night. The biggest hazards are icy sidewalks in winter and cobblestone twists.',
  },

  oaxaca: {
    bestTimeToVisit: {
      months: 'October–April',
      blurb: 'Dry season with warm days and cool evenings; Day of the Dead (Oct 31–Nov 2) is the city’s peak experience.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 90,
      luxuryDailyUSD: 280,
      blurb: 'Markets and street food keep budgets low; boutique-hotel rates jump in November.',
    },
    travelStyles: {
      family: 'A weaver workshop in Teotitlán, the Mitla ruins, a half-day at Hierve el Agua’s petrified waterfalls.',
      couples: 'A mezcal palenque tour, a rooftop dinner with a Templo de Santo Domingo view, a long market lunch.',
      solo: 'Hostels are good; markets are easy to eat at; weekly social events in the centro.',
    },
    food: [
      { dish: 'Mole', note: 'Oaxaca’s seven mole sauces — black mole over chicken is the signature dish to start.' },
      { dish: 'Tlayudas', note: 'Crisp giant tortilla with beans, cheese, and toppings — the local pizza, sold at street grills.' },
      { dish: 'Chapulines', note: 'Toasted grasshoppers with chili-lime salt — eat them by the handful, snack-style.' },
      { dish: 'Mezcal', note: 'Smoky agave spirit — sip it neat, never shoot it; visit a palenque outside town.' },
    ],
    transportation: {
      primary: 'The historic center is walkable; collective vans (colectivos) reach Mitla and Hierve el Agua.',
      tips: 'Hire a driver for valley day trips — covers Tule, Teotitlán, Mitla, Hierve el Agua in a single comfortable day.',
    },
    neighborhoods: [
      { name: 'Centro Histórico', blurb: 'Walled colonial centre — Santo Domingo, the zócalo, mole restaurants.' },
      { name: 'Jalatlaco', blurb: 'Quieter cobble-stone neighborhood — boutique hotels, murals, fewer tour buses.' },
      { name: 'Xochimilco', blurb: 'Hillside artisan quarter — weavers, ceramic studios, mezcalerias.' },
    ],
    safety: 'Generally safe in tourist neighborhoods. Use Uber/taxis at night and stay away from political demonstrations.',
  },

  medellin: {
    bestTimeToVisit: {
      months: 'December–March, July–August',
      blurb: 'Drier months in the city of eternal spring; April–May and October bring heavier afternoon rains.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 90,
      luxuryDailyUSD: 250,
      blurb: 'Excellent value across all tiers — even the boutique hotels in El Poblado are affordable by US standards.',
    },
    travelStyles: {
      family: 'Metrocable rides up the hillsides, Parque Explora science museum, day trips to Guatapé.',
      couples: 'A flower-farm day trip, salsa lessons in El Poblado, a candlelit dinner in Provenza.',
      solo: 'Hostels in El Poblado are excellent; co-working spots welcome digital nomads; the metro is safe by day.',
    },
    food: [
      { dish: 'Bandeja paisa', note: 'Mountain plate — beans, rice, plantain, chicharrón, egg, sausage, arepa, avocado.' },
      { dish: 'Arepa de chócolo', note: 'Sweet corn cake with cheese — Antioquia’s morning comfort food.' },
      { dish: 'Sancocho', note: 'Hearty meat-and-tuber stew — every region has a version, Antioquia’s uses gallina (hen).' },
      { dish: 'Lulo juice (lulada)', note: 'Tart Andean fruit juice with crushed ice — order it at any restaurant.' },
    ],
    transportation: {
      primary: 'Metro plus Metrocable gondolas — the only city in the world that uses cable cars for daily commute.',
      tips: 'Buy a Cívica card for the metro; Uber is widely used and cheap for night transit.',
    },
    neighborhoods: [
      { name: 'El Poblado', blurb: 'Restaurant district — boutique hotels, cafés, Provenza nightlife.' },
      { name: 'Laureles', blurb: 'Quieter, more local — great for digital nomads and longer stays.' },
      { name: 'Comuna 13', blurb: 'Famous reborn neighborhood — outdoor escalators, hip-hop tours, hillside street art.' },
    ],
    safety: 'Tourist areas are safe; don’t flash phones in public, don’t take unscheduled taxis off the street, and avoid the comunas at night without a guide.',
  },

  agra: {
    bestTimeToVisit: {
      months: 'October–March',
      blurb: 'Cool dry months with clear Taj Mahal sunrises; April–June is brutally hot, July–September monsoon.',
    },
    budget: {
      budgetDailyUSD: 25,
      midDailyUSD: 75,
      luxuryDailyUSD: 350,
      blurb: 'Backpacker guesthouses keep budgets honest; the Oberoi Amarvilas with its Taj view pushes the top tier.',
    },
    travelStyles: {
      family: 'Taj Mahal at sunrise (cooler, kid-tolerable), Agra Fort, a marble-inlay craft demo — manageable for all ages.',
      couples: 'A sunrise Taj visit, a private sunset view from Mehtab Bagh, a dinner with the Taj lit up across the river.',
      solo: 'Guided day-trips from Delhi are common; book a driver with a guide for the safest, fastest day.',
    },
    food: [
      { dish: 'Mughlai biryani', note: 'Slow-cooked rice with mutton, saffron, and aromatic spices — a Mughal-court legacy.' },
      { dish: 'Petha', note: 'Translucent ash-gourd candy — Agra’s sweet specialty, sold by every bakery.' },
      { dish: 'Bedai with aloo sabzi', note: 'Fried lentil bread with spicy potato curry — the local breakfast.' },
      { dish: 'Kebab', note: 'Mughlai-style soft mutton kebabs grilled over coals — try at a Sadar Bazaar stall.' },
    ],
    transportation: {
      primary: 'Auto-rickshaws and Ola/Uber for in-city; the Gatimaan Express train from Delhi takes 100 minutes.',
      tips: 'Buy Taj entry tickets online — saves the queue, and your guide can route you through the faster gate.',
    },
    neighborhoods: [
      { name: 'Taj Ganj', blurb: 'Closest neighborhood to the Taj — guesthouses, rooftop cafés with monument views.' },
      { name: 'Sadar Bazaar', blurb: 'Main market — shopping, restaurants, the British colonial cantonment area.' },
      { name: 'Fatehabad Road', blurb: 'Luxury-hotel strip — Oberoi, ITC Mughal, easy taxi access to the Taj.' },
    ],
    safety: 'Safe with normal precautions. The biggest hassles are aggressive touts at the Taj — ignore unsolicited "official guides".',
  },

  goa: {
    bestTimeToVisit: {
      months: 'November–February',
      blurb: 'Dry season with clear skies and beach-club season; June–September is monsoon and shacks close.',
    },
    budget: {
      budgetDailyUSD: 30,
      midDailyUSD: 90,
      luxuryDailyUSD: 350,
      blurb: 'Beach huts and shacks are dirt-cheap; boutique villas in South Goa push the luxury tier.',
    },
    travelStyles: {
      family: 'Calm-water beaches in South Goa (Palolem, Patnem), spice plantation tours, dolphin boat trips.',
      couples: 'A North Goa sunset shack dinner, a Saturday Anjuna flea market, a scooter day to Old Goa churches.',
      solo: 'Hostels in Vagator and Arambol are sociable; scooter rental gives freedom; English is widely spoken.',
    },
    food: [
      { dish: 'Fish curry rice', note: 'Coconut-spiced fish curry with rice — every Goan home cooks it daily.' },
      { dish: 'Pork vindaloo', note: 'Wine-vinegar marinated pork curry — Portuguese-Goan fusion, hot but balanced.' },
      { dish: 'Bebinca', note: 'Layered coconut-egg cake — sliced thin, served at the end of long Goan meals.' },
      { dish: 'Feni', note: 'Local cashew (or coconut) spirit — strong, distilled in village wadas, drunk with lime soda.' },
    ],
    transportation: {
      primary: 'Rent a scooter (most common) or hire a driver; Goa Miles is the Uber alternative.',
      tips: 'Wear a helmet on scooters; police enforce strictly on the main coastal road.',
    },
    neighborhoods: [
      { name: 'North Goa (Anjuna/Vagator)', blurb: 'Backpacker and party belt — clubs, flea markets, beach shacks.' },
      { name: 'South Goa (Palolem/Patnem)', blurb: 'Quieter, family-friendly beaches — calmer water, boutique villas.' },
      { name: 'Old Goa', blurb: 'Portuguese colonial churches inland — UNESCO World Heritage cathedrals.' },
    ],
    safety: 'Generally safe; don’t leave valuables unattended on the beach; some North Goa party scenes have drug-enforcement risks.',
  },

  hue: {
    bestTimeToVisit: {
      months: 'February–April',
      blurb: 'Dry and pleasant; May–August is hot, September–January brings heavy seasonal rains.',
    },
    budget: {
      budgetDailyUSD: 25,
      midDailyUSD: 70,
      luxuryDailyUSD: 220,
      blurb: 'Guesthouses near the citadel are cheap; restored colonial hotels push the luxury tier.',
    },
    travelStyles: {
      family: 'Imperial citadel exploration, dragon-boat rides on the Perfume River, royal tomb visits.',
      couples: 'A river-cruise sunset to Thien Mu Pagoda, an imperial-cuisine dinner, a tomb-circuit bicycle day.',
      solo: 'Backpacker district near the train station; scooter rental opens up the royal tombs; English in tourist spots.',
    },
    food: [
      { dish: 'Bún bò Huế', note: 'Spicy lemongrass beef noodle soup — Hue’s most famous dish, breakfast or anytime.' },
      { dish: 'Bánh khoái', note: 'Crispy turmeric-and-egg pancake with shrimp and pork — Hue-specific street food.' },
      { dish: 'Cơm hến', note: 'Baby-clam rice with herbs and crispy pork rind — a working-class Hue classic.' },
      { dish: 'Royal cuisine tasting', note: 'Multi-course imperial-style meal served in lotus-leaf wrappings.' },
    ],
    transportation: {
      primary: 'Scooter or cyclo within the city; private cars for the royal tomb circuit.',
      tips: 'Buy the combined royal-tomb ticket — saves money over individual entries.',
    },
    neighborhoods: [
      { name: 'Imperial Citadel', blurb: 'Walled royal city — the Forbidden Purple City, Nine Holy Cannons, the throne hall.' },
      { name: 'Phu Hoi (south of river)', blurb: 'Backpacker district — guesthouses, cafés, the night market.' },
      { name: 'Vy Da', blurb: 'Quieter southern suburb — riverside hotels, traditional houses, longer-stay rentals.' },
    ],
    safety: 'Very safe day and night. Watch traffic when crossing main roads — Vietnamese style is to walk steadily, drivers swerve around.',
  },

  busan: {
    bestTimeToVisit: {
      months: 'April–June, September–November',
      blurb: 'Mild beach weather without summer crowds and typhoon risk; cherry blossoms peak in early April.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 380,
      blurb: 'Hostels and Korean BBQ stretch a budget; Haeundae beachfront hotels push the luxury tier.',
    },
    travelStyles: {
      family: 'Calm Haeundae beach mornings, Gamcheon Culture Village photos, fresh sashimi at Jagalchi market.',
      couples: 'A Songdo skywalk sunset, a Hwangnidan-gil café crawl, a hillside seafood dinner above the bay.',
      solo: 'Hostels in Seomyeon and Haeundae are sociable; English is more limited than Seoul but translation apps work.',
    },
    food: [
      { dish: 'Hoe (sashimi)', note: 'Korean-style sliced raw fish — eat at Jagalchi Market right off the boat.' },
      { dish: 'Milmyeon', note: 'Cold buckwheat noodles in icy broth — a Busan summer specialty.' },
      { dish: 'Dwaeji gukbap', note: 'Pork-bone soup with rice — a Busan working-class classic, eaten with kimchi.' },
      { dish: 'Ssiat hotteok', note: 'Sweet seed-filled pancakes from Nampodong street stalls — Busan’s winter snack.' },
    ],
    transportation: {
      primary: 'Subway network covers the city; KTX bullet train from Seoul takes 2.5 hours.',
      tips: 'Get a T-Money card — works on subway, bus, and taxis with one balance.',
    },
    neighborhoods: [
      { name: 'Haeundae', blurb: 'Beach district — long sandy beach, luxury hotels, cafés, summer crowds.' },
      { name: 'Gamcheon Culture Village', blurb: 'Painted hillside neighborhood — alleys, murals, photo spots.' },
      { name: 'Seomyeon', blurb: 'Downtown shopping and nightlife — restaurants, hostels, the subway hub.' },
    ],
    safety: 'Extremely safe day and night. Main risks are typhoon-season waves on coastal walks and slippery hill stairs.',
  },

  hiroshima: {
    bestTimeToVisit: {
      months: 'March–May, October–November',
      blurb: 'Cherry blossoms in spring, maple foliage in autumn; summers are humid, winters mild and dry.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 130,
      luxuryDailyUSD: 350,
      blurb: 'Okonomiyaki dinners run a few dollars; Miyajima ryokan stays push the luxury tier.',
    },
    travelStyles: {
      family: 'Peace Memorial Museum (heavy but important), Miyajima deer-feeding, an okonomiyaki-making class.',
      couples: 'A Miyajima overnight ryokan, a Peace Park sunset moment, a Saijo sake-brewery district day trip.',
      solo: 'Hostels near the station are good; English support in Peace Park; easy day trips by JR Pass.',
    },
    food: [
      { dish: 'Hiroshima-style okonomiyaki', note: 'Layered (not mixed) — pancake, noodles, cabbage, pork, egg on a hot iron plate.' },
      { dish: 'Oysters', note: 'Local Hiroshima oysters — grilled, fried, or in hotpot, especially in winter.' },
      { dish: 'Anago meshi', note: 'Saltwater eel over rice — a Miyajima ferry-port specialty.' },
      { dish: 'Momiji manju', note: 'Maple-leaf shaped sweet bean cakes — Miyajima souvenir, sold in every shop.' },
    ],
    transportation: {
      primary: 'Trams and JR trains cover the city; the JR ferry reaches Miyajima in 10 minutes.',
      tips: 'The JR Pass covers the ferry to Miyajima — use it the same day as Peace Park to save.',
    },
    neighborhoods: [
      { name: 'Peace Park', blurb: 'Central memorial district — the A-Bomb Dome, the Peace Memorial Museum.' },
      { name: 'Hatchobori', blurb: 'Shopping centre — okonomiyaki streets, department stores, the tram hub.' },
      { name: 'Miyajima', blurb: 'Sacred shrine island a ferry away — the famous floating torii gate.' },
    ],
    safety: 'Extremely safe. Real hazards are summer heat in the Peace Park and high-tide bullishness of Miyajima deer.',
  },

  hamburg: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Long summer evenings on the Alster lake; December brings Christmas-market warmth.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 380,
      blurb: 'Fish-roll lunches stay cheap; HafenCity boutique hotels push the top tier.',
    },
    travelStyles: {
      family: 'Miniatur Wunderland (world’s largest model railway), a harbour boat tour, the Treetop Walk in Stade.',
      couples: 'An Elbphilharmonie evening concert, a sunset at Landungsbrücken, a Speicherstadt warehouse dinner.',
      solo: 'St Pauli hostels are friendly; English fluent; great riverside bike paths for solo cycling days.',
    },
    food: [
      { dish: 'Fischbrötchen', note: 'Pickled or grilled fish in a soft bun — the Hamburg harbour-stand classic.' },
      { dish: 'Labskaus', note: 'Sailor’s hash with corned beef, beets, potato, herring, fried egg, and pickle.' },
      { dish: 'Franzbrötchen', note: 'Hamburg’s cinnamon pastry — sticky, eaten warm with coffee.' },
      { dish: 'Aalsuppe', note: 'Sweet-sour eel soup with prunes and vegetables — the Hanseatic specialty.' },
    ],
    transportation: {
      primary: 'U-Bahn, S-Bahn, and harbour ferries — the HVV card covers it all.',
      tips: 'Take a public-transit harbour ferry (line 62 or 73) instead of a tour boat — same views, fraction of the price.',
    },
    neighborhoods: [
      { name: 'HafenCity', blurb: 'Newest neighborhood — Elbphilharmonie, modern architecture, harbor edge.' },
      { name: 'St Pauli', blurb: 'Nightlife district — Reeperbahn, indie bars, late-night fish market on Sunday.' },
      { name: 'Sternschanze', blurb: 'Hip alternative quarter — cafés, vintage shops, weekend brunches.' },
    ],
    safety: 'Generally safe; Reeperbahn at night is loud but not dangerous — use common sense and watch pockets in nightclub crowds.',
  },

  cologne: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Long summer days on the Rhine; December brings the famous Christmas markets in the cathedral shadow.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 150,
      luxuryDailyUSD: 350,
      blurb: 'Kölsch beer halls keep dinners cheap; Carnival week and the Christmas markets push hotel rates up.',
    },
    travelStyles: {
      family: 'Cologne Cathedral climb, the Chocolate Museum, a Rhine river cruise, Phantasialand a half-hour out.',
      couples: 'A Cathedral evening service, a Kölsch tasting in a brauhaus, a Rhine bridge sunset.',
      solo: 'Hostels in Altstadt are sociable; English widely spoken; Carnival in February is the most welcoming festival.',
    },
    food: [
      { dish: 'Kölsch beer', note: 'Local pale ale served in tall 200ml glasses — they keep coming until you cover the glass.' },
      { dish: 'Halve Hahn', note: 'Rye roll with Gouda cheese, mustard, and pickled onion — order in a brauhaus.' },
      { dish: 'Reibekuchen', note: 'Potato pancakes with apple sauce — a Cologne Christmas-market favorite.' },
      { dish: 'Himmel un Ääd', note: 'Mashed potato with apple, blood sausage — Heaven-and-Earth, the Cologne classic.' },
    ],
    transportation: {
      primary: 'KVB Stadtbahn and buses cover the city; central walkable historic core.',
      tips: 'Buy a KölnCard for transit + museum discounts; the cathedral itself is free to enter.',
    },
    neighborhoods: [
      { name: 'Altstadt', blurb: 'Old town between cathedral and Rhine — brauhauses, restaurants, the city heart.' },
      { name: 'Ehrenfeld', blurb: 'Hip residential side — vintage shops, indie venues, the most creative restaurants.' },
      { name: 'Rheinauhafen', blurb: 'Modern harbour district — the Chocolate Museum, the famous crane-shaped buildings.' },
    ],
    safety: 'Very safe overall. Pickpockets work the cathedral square — keep wallets in front pockets at busy moments.',
  },

  tallinn: {
    bestTimeToVisit: {
      months: 'June–August, December',
      blurb: 'Long summer twilight or snow-globe Christmas-market winters — the brown shoulder months feel quiet.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 120,
      luxuryDailyUSD: 320,
      blurb: 'Hostels in the old town are cheap; Telliskivi boutique stays push the top tier.',
    },
    travelStyles: {
      family: 'Kadriorg park, the medieval old town walls, the Estonian Open Air Museum — gentle on kids.',
      couples: 'A medieval-cellar dinner, a Telliskivi creative-city evening, a Helsinki ferry day trip.',
      solo: 'Hostels and co-working spots welcome digital nomads — Estonia’s e-Residency draws an international scene.',
    },
    food: [
      { dish: 'Mulgipuder', note: 'Mashed potato and barley with bacon — the simple Estonian comfort dish.' },
      { dish: 'Kama', note: 'Roasted grain-and-pea flour mixed with kefir — Estonia’s traditional energy meal.' },
      { dish: 'Black bread', note: 'Dense rye bread eaten with butter and herring — the daily Estonian staple.' },
      { dish: 'Vana Tallinn', note: 'Sweet rum-based liqueur — order it neat after dinner or in a coffee.' },
    ],
    transportation: {
      primary: 'Old town is fully walkable; trams and buses cover the rest; free public transit for residents.',
      tips: 'Buy the Tallinn Card — covers transit and most museums; a 24-hour version pays for itself with 2 museums.',
    },
    neighborhoods: [
      { name: 'Old Town', blurb: 'UNESCO medieval centre — cobblestone lanes, restored merchant houses, walking walls.' },
      { name: 'Telliskivi Creative City', blurb: 'Converted factory district — design shops, restaurants, weekend flea market.' },
      { name: 'Kalamaja', blurb: 'Quiet wooden-house neighborhood — Lennusadam seaplane museum, beach access.' },
    ],
    safety: 'Extremely safe day and night. The biggest risks are slippery cobbles in winter and overpaying for a stag-party scam.',
  },

  madeira: {
    bestTimeToVisit: {
      months: 'April–October',
      blurb: 'Warm but never hot — Madeira’s subtropical climate is mild year-round.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 130,
      luxuryDailyUSD: 350,
      blurb: 'Reid’s Palace and Belmond properties push the top; bed-and-breakfasts in Funchal are affordable.',
    },
    travelStyles: {
      family: 'Toboggan ride from Monte, the dolphin-watching boat tour, the cable car to Monte gardens.',
      couples: 'A levada hike in laurel forest, a sunset cliff dinner at Faja dos Padres, a Madeira wine tasting.',
      solo: 'Day-tour group bookings and English-speaking hosts make solo hiking trips easy; bus network is decent.',
    },
    food: [
      { dish: 'Espetada', note: 'Beef skewers on bay leaf branches, grilled over wood — eaten with milho frito.' },
      { dish: 'Bolo do caco', note: 'Round bread with garlic butter — served as appetizer at every restaurant.' },
      { dish: 'Black scabbard fish', note: 'Deep-sea fish — fried with banana, served at every Funchal restaurant.' },
      { dish: 'Poncha', note: 'Local cocktail of cane spirit, honey, and citrus — order traditional or de pescador (fishermen).' },
    ],
    transportation: {
      primary: 'SAM buses link Funchal to the rest of the island; rental car gives flexibility for inland routes.',
      tips: 'Drive carefully — Madeira’s roads have steep grades and tight switchbacks, especially on the north coast.',
    },
    neighborhoods: [
      { name: 'Funchal', blurb: 'Capital and main city — old town restaurants, the cathedral, the Mercado dos Lavradores.' },
      { name: 'Monte', blurb: 'Hilltop village above Funchal — gardens, the famous toboggan ride down.' },
      { name: 'Câmara de Lobos', blurb: 'Picturesque fishing village — colorful boats, the cliff lookout at Cabo Girão.' },
    ],
    safety: 'Extremely safe. The main hazards are levada-trail edges (some have unfenced drops) and ocean current at unfamiliar coves.',
  },

  sintra: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Mild without August day-tripper crowds; mornings are foggy and atmospheric year-round.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 400,
      blurb: 'A day trip from Lisbon keeps costs low; tile-fronted boutique hotels push the luxury tier.',
    },
    travelStyles: {
      family: 'Pena Palace fairy-tale colors, Quinta da Regaleira’s spiral well, a beach afternoon at Praia das Maçãs.',
      couples: 'An early-morning Pena Palace visit, a private wine tasting in Colares, a sunset at Cabo da Roca.',
      solo: 'Easy day-trip from Lisbon — train + tourist bus 434 reaches every major palace.',
    },
    food: [
      { dish: 'Travesseiros de Sintra', note: 'Almond-and-egg pillow pastries — Sintra’s most famous sweet, from Piriquita bakery.' },
      { dish: 'Queijadas de Sintra', note: 'Small cheese-cinnamon pastries — predate the travesseiros by centuries.' },
      { dish: 'Bacalhau à Brás', note: 'Salt cod with onions and potato matchsticks — the Portuguese classic, in every restaurant.' },
      { dish: 'Vinho de Colares', note: 'Local sand-grown wines from vineyards by the Atlantic — taste in nearby Colares.' },
    ],
    transportation: {
      primary: 'Train from Lisbon Rossio reaches Sintra in 40 minutes; bus 434 and 435 link the palaces.',
      tips: 'Buy palace tickets online ahead of time — Pena and Regaleira sell out in summer afternoons.',
    },
    neighborhoods: [
      { name: 'Sintra Vila', blurb: 'Historic centre — the National Palace, restaurants, the train station.' },
      { name: 'Pena Park', blurb: 'Forested hillside — Pena Palace, the Moorish Castle, the Convent of the Capuchos.' },
      { name: 'Colares', blurb: 'Coastal village — sand-grown vineyards, Atlantic beaches, fewer tourists.' },
    ],
    safety: 'Extremely safe. The main hazards are slippery palace-floor cobbles and underestimating the foggy chill.',
  },

  mallorca: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Warm sea without August crowds; the Tramuntana mountains are clear and trails fully open.',
    },
    budget: {
      budgetDailyUSD: 65,
      midDailyUSD: 150,
      luxuryDailyUSD: 450,
      blurb: 'Inland village stays are cheap; luxury cliff-side hotels in Deià push the top tier hard.',
    },
    travelStyles: {
      family: 'Calm-water beaches at Cala Mondragó, the Coves del Drach caves, the Palma aquarium.',
      couples: 'A vintage train ride to Sóller, a hidden cove day at Cala Tuent, dinner at a finca outside the city.',
      solo: 'Hostels in Palma are good; rental car opens the island; English widely spoken in tourist areas.',
    },
    food: [
      { dish: 'Sobrasada', note: 'Soft cured paprika-spiced sausage spread on bread — Mallorca’s signature charcuterie.' },
      { dish: 'Tumbet', note: 'Layered roasted vegetables — potato, aubergine, pepper with tomato sauce.' },
      { dish: 'Ensaïmada', note: 'Spiral lard-pastry sprinkled with powdered sugar — the Mallorcan breakfast.' },
      { dish: 'Pa amb oli', note: 'Bread rubbed with tomato and olive oil — the simplest Mallorcan tapa.' },
    ],
    transportation: {
      primary: 'Rental car is the easiest way to explore the coves; the antique Sóller train runs from Palma.',
      tips: 'Park outside cove beaches and walk in — coastal roads have very limited parking in summer.',
    },
    neighborhoods: [
      { name: 'Palma', blurb: 'Capital — cathedral, old town tapas bars, weekend nightlife.' },
      { name: 'Deià', blurb: 'Cliffside village in the Tramuntana — artist colony, boutique hotels, the cala below.' },
      { name: 'Sóller', blurb: 'Mountain valley town — Modernist square, vintage train from Palma, orange groves.' },
    ],
    safety: 'Very safe. Risks are sunburn, mountain-road accidents, and pickpockets in Palma cathedral district.',
  },

  ibiza: {
    bestTimeToVisit: {
      months: 'May–October',
      blurb: 'Beach-club season runs roughly Memorial Day to early October; June and September balance weather and crowds.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 220,
      luxuryDailyUSD: 700,
      blurb: 'Hostels in Sant Antoni are cheap; Ushuaïa and other beach-club hotels run thousands in peak August.',
    },
    travelStyles: {
      family: 'Calm-water family beaches on the east coast, the Dalt Vila old fortress, the Las Dalias hippie market.',
      couples: 'A sunset at Café del Mar, a private boat day to Formentera, a Pacha or Hï club night.',
      solo: 'Sant Antoni and Playa d’en Bossa hostels are sociable; the club scene welcomes solo travelers.',
    },
    food: [
      { dish: 'Bullit de peix', note: 'Slow-cooked fish stew with potato and saffron — Ibiza’s signature dish.' },
      { dish: 'Sofrit pagès', note: 'Mixed roasted meats with potato and spices — peasant-origin Ibizan classic.' },
      { dish: 'Flaó', note: 'Mint-and-cheese tart from goat cheese — a Pitiusan dessert specialty.' },
      { dish: 'Hierbas Ibicencas', note: 'Herbal liqueur — sip neat after dinner.' },
    ],
    transportation: {
      primary: 'Buses cover the main towns; rent a scooter or car for cove beaches.',
      tips: 'Book club tickets and dinner reservations weeks ahead in July–August; same-day walk-ins are rare.',
    },
    neighborhoods: [
      { name: 'Dalt Vila', blurb: 'UNESCO-listed old fortified town — walls, cobble lanes, sunset terraces.' },
      { name: 'Sant Antoni', blurb: 'West-coast party town — sunset strip cafés, bars, hostels.' },
      { name: 'Santa Eulària', blurb: 'Quieter family beach town — east-coast resorts, restaurants, calmer evenings.' },
    ],
    safety: 'Generally safe but watch for inflated taxi fares from clubs and drink-spiking risks — never leave drinks unattended.',
  },

  marseille: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Mild Mediterranean weather without summer crowds; the mistral wind can blow strong in winter.',
    },
    budget: {
      budgetDailyUSD: 65,
      midDailyUSD: 140,
      luxuryDailyUSD: 380,
      blurb: 'Hostels in the Panier are budget-friendly; Vieux Port view hotels push the top tier.',
    },
    travelStyles: {
      family: 'Calanques boat trips, the Mucem museum, beach mornings at Prado, the Panier district’s street art.',
      couples: 'A calanque kayak day, a Vieux Port seafood dinner, a Notre-Dame de la Garde sunset.',
      solo: 'Multicultural and easy; hostels in the Panier and Cours Julien quarters are sociable.',
    },
    food: [
      { dish: 'Bouillabaisse', note: 'Provençal fish stew with rouille and croutons — Marseille’s defining dish, eaten slowly.' },
      { dish: 'Pieds-paquets', note: 'Tripe stuffed with herbs, slow-cooked with sheep’s feet — a Marseillais comfort dish.' },
      { dish: 'Panisse', note: 'Chickpea-flour fritters — Marseille street-food classic, eaten with aioli.' },
      { dish: 'Pastis', note: 'Anise-flavored aperitif — served over ice with water at every café.' },
    ],
    transportation: {
      primary: 'Metro and tram cover central Marseille; bus to the Calanques and city ferries to the Frioul islands.',
      tips: 'Buy a CityPass — covers museums, public transit, and a calanque cruise; pays back over 24 hours.',
    },
    neighborhoods: [
      { name: 'Vieux Port', blurb: 'Old port — fish market, restaurants, the harbour at sunset.' },
      { name: 'Le Panier', blurb: 'Oldest quarter — street art, indie cafés, the Mucem and Cathédrale de la Major.' },
      { name: 'Cours Julien', blurb: 'Bohemian district — street art, indie bars, weekend market.' },
    ],
    safety: 'Use normal big-city caution; some northern districts have higher crime, but tourist quarters are safe day and night.',
  },

  lyon: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Mild river-city weather; December’s Fête des Lumières fills the streets with light installations.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 400,
      blurb: 'Bouchon lunches are affordable; Michelin tasting menus in Paul Bocuse’s shadow push the top tier.',
    },
    travelStyles: {
      family: 'The Confluence aquarium, the Parc de la Tête d’Or zoo, the funicular up to Fourvière.',
      couples: 'A bouchon dinner in Vieux Lyon, a Fourvière sunset over the rivers, a Beaujolais wine tasting.',
      solo: 'Walkable centre, excellent solo-friendly bouchons, English in tourist areas; a 2-hour train from Paris.',
    },
    food: [
      { dish: 'Quenelle de brochet', note: 'Pike fish quenelles in a lobster sauce — a Lyon signature, only served in bouchons.' },
      { dish: 'Salade lyonnaise', note: 'Frisée greens with poached egg, lardons, and croutons — the classic starter.' },
      { dish: 'Tarte aux pralines', note: 'Pink praline tart — Lyon’s iconic dessert, sold at every bakery.' },
      { dish: 'Andouillette', note: 'Coarse tripe sausage — divisive flavor, the local rite-of-passage.' },
    ],
    transportation: {
      primary: 'Metro, tram, and funicular cover the city; the Confluence and Vieux Lyon are short rides apart.',
      tips: 'Buy a TCL day ticket; book bouchon reservations a day ahead — they’re small and popular.',
    },
    neighborhoods: [
      { name: 'Vieux Lyon', blurb: 'Renaissance old town on the right bank — cobbled streets, traboules passageways.' },
      { name: 'Presqu’île', blurb: 'Central peninsula between two rivers — restaurants, shopping, the Bellecour square.' },
      { name: 'Confluence', blurb: 'Modern district at the river junction — contemporary architecture, the aquarium.' },
    ],
    safety: 'Extremely safe day and night. Watch for pickpockets in Place Bellecour and on the metro at rush hour.',
  },

  palermo: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Warm Mediterranean light without summer heat; July–August can be uncomfortably hot.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 120,
      luxuryDailyUSD: 320,
      blurb: 'Street food and family-run trattorie are excellent value; restored palazzo stays push the top.',
    },
    travelStyles: {
      family: 'Massimo Theatre tours, a street-food market crawl at Vucciria, a half-day in Cefalù.',
      couples: 'A Mondello beach afternoon, an old-town evening drink, a Norman-Arab cathedral tour at Monreale.',
      solo: 'Hostels in Vucciria and Kalsa are sociable; street markets make solo eating effortless.',
    },
    food: [
      { dish: 'Arancini', note: 'Fried saffron-rice balls stuffed with ragù or cheese — pyramidal in Palermo.' },
      { dish: 'Pasta alla Norma', note: 'Pasta with aubergine, tomato, ricotta salata — a Sicilian classic.' },
      { dish: 'Pani ca meusa', note: 'Spleen sandwich — only-in-Palermo street-food specialty, eaten with lemon.' },
      { dish: 'Cannoli', note: 'Crisp shells filled to order with sweetened ricotta — eat fresh, never sitting.' },
    ],
    transportation: {
      primary: 'Walk the centro storico; buses cover the rest; trains link to Cefalù and other coast towns.',
      tips: 'Use AMAT day passes for buses; avoid driving in the old town — narrow lanes, no parking.',
    },
    neighborhoods: [
      { name: 'Centro Storico', blurb: 'Old town — Quattro Canti, Massimo Theatre, the Cathedral.' },
      { name: 'Vucciria', blurb: 'Old market quarter — street food, nightlife, the most-painted Palermo postcard.' },
      { name: 'Mondello', blurb: 'Beach district 30 minutes away — sandy beach, beach clubs, fresh-fish lunches.' },
    ],
    safety: 'Use normal big-city caution; pickpockets work the markets; certain north neighborhoods feel rough at night.',
  },

  verona: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Mild and dry, with the opera festival in July–August; winter has the wine fairs and quieter sights.',
    },
    budget: {
      budgetDailyUSD: 65,
      midDailyUSD: 150,
      luxuryDailyUSD: 380,
      blurb: 'Old town pensions are affordable; lake-Garda luxury hotels nearby push the top tier.',
    },
    travelStyles: {
      family: 'The Roman arena tour, Castelvecchio, a half-day at Sirmione on Lake Garda, gelato in Piazza Bra.',
      couples: 'An opera at the Arena, a Valpolicella wine afternoon, a Juliet’s House evening photo.',
      solo: 'Compact and walkable; English in restaurants; train to Venice (1h) or Milan (1h) for day-trips.',
    },
    food: [
      { dish: 'Risotto all’Amarone', note: 'Risotto cooked with Amarone wine — the regional Veronese signature.' },
      { dish: 'Pastissada de caval', note: 'Slow-cooked horse-meat stew with wine and spices — old-Verona tradition.' },
      { dish: 'Pandoro', note: 'Verona’s sweet star-shaped Christmas bread — softer than panettone.' },
      { dish: 'Polenta e bisato', note: 'Polenta with eel from the nearby lakes — earthy regional dish.' },
    ],
    transportation: {
      primary: 'Old town is fully walkable; buses to lakeside towns; trains link to Venice and Milan.',
      tips: 'Buy Verona Card — covers arena, churches, museums, and bus transit; a 24-hour version pays back over 3 sights.',
    },
    neighborhoods: [
      { name: 'Centro Storico', blurb: 'Old town in the river bend — arena, piazzas, restaurants, Juliet’s balcony.' },
      { name: 'Borgo Trento', blurb: 'Elegant residential side over the river — Castel San Pietro views.' },
      { name: 'Veronetta', blurb: 'University quarter east of the river — cheaper restaurants, livelier nights.' },
    ],
    safety: 'Very safe. Pickpockets work the arena queues and Piazza delle Erbe — keep wallets in front pockets.',
  },

  nashville: {
    bestTimeToVisit: {
      months: 'April–May, September–October',
      blurb: 'Mild without summer humidity; cherry blossoms in April, college football in September.',
    },
    budget: {
      budgetDailyUSD: 85,
      midDailyUSD: 200,
      luxuryDailyUSD: 500,
      blurb: 'Honky-tonk cover charges are free; downtown hotels run high on weekends with bachelorette parties.',
    },
    travelStyles: {
      family: 'The Country Music Hall of Fame, the Adventure Science Center, a kid-friendly Grand Ole Opry afternoon.',
      couples: 'A Bluebird Café songwriters round, a Whisky Row crawl, a Belle Meade plantation tour.',
      solo: 'Honky-tonks are friendly to solo travelers; hostels in East Nashville are sociable; Lyft covers the city well.',
    },
    food: [
      { dish: 'Hot chicken', note: 'Crispy chicken with cayenne paste — Nashville invented it, eaten on white bread with pickles.' },
      { dish: 'Meat and three', note: 'Plate of one meat with three sides — the classic Southern lunch.' },
      { dish: 'Goo Goo Cluster', note: 'Marshmallow-caramel-peanut chocolate bar — invented in Nashville in 1912.' },
      { dish: 'Biscuits and gravy', note: 'Flaky biscuits with peppered sausage gravy — the Southern breakfast staple.' },
    ],
    transportation: {
      primary: 'WeGo buses cover downtown; Lyft and Uber are universal; pedicabs run Broadway.',
      tips: 'Skip Broadway pedicabs after midnight — bachelorette-party prices triple; just walk or Lyft.',
    },
    neighborhoods: [
      { name: 'Downtown / Broadway', blurb: 'Honky-tonks, live country music, the country hall of fame, bachelorette parties.' },
      { name: 'East Nashville', blurb: 'Hip residential side — vintage shops, breakfast spots, indie music venues.' },
      { name: 'The Gulch', blurb: 'Modern condo district — rooftop bars, new restaurants, the famous wings mural.' },
    ],
    safety: 'Tourist areas safe by day; some downtown blocks late at night feel rough — stay near venues and use Lyft.',
  },

  austin: {
    bestTimeToVisit: {
      months: 'March–April, October–November',
      blurb: 'Mild before the Texas summer heat or after it breaks; SXSW in March and ACL in October bring festivals.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 190,
      luxuryDailyUSD: 480,
      blurb: 'BBQ joints and food trucks stay affordable; downtown hotels run high during SXSW and ACL.',
    },
    travelStyles: {
      family: 'Barton Springs lake swimming, the bat-watching at Congress Avenue Bridge, a Zilker Park afternoon.',
      couples: 'A South Congress dive-bar evening, a barbecue road trip to Lockhart, a Lake Austin sunset boat day.',
      solo: 'Hostels in East Austin are great; live music venues welcome solo arrivals; coffee shops are working hubs.',
    },
    food: [
      { dish: 'Brisket', note: 'Smoked beef brisket — Franklin Barbecue is the famous one, lines start at 9am.' },
      { dish: 'Breakfast tacos', note: 'Eggs, bacon, potato, salsa in flour tortillas — the Austin morning standard.' },
      { dish: 'Queso', note: 'Melted cheese dip with chips — the Texas snack-bar opening order.' },
      { dish: 'Texas margarita', note: 'On the rocks, salt rim, fresh lime — order one at Güero’s on South Congress.' },
    ],
    transportation: {
      primary: 'Cap Metro buses and the MetroRail cover downtown and the suburbs; rideshare is universal.',
      tips: 'Hit Franklin BBQ early — line opens at 11am but starts forming at 9am; closes when the meat runs out.',
    },
    neighborhoods: [
      { name: 'South Congress', blurb: 'Trendy strip — boutique shops, brunch spots, the photogenic Hi How Are You mural.' },
      { name: 'East Austin', blurb: 'Hip arts district — breweries, food trucks, indie music venues.' },
      { name: 'Rainey Street', blurb: 'Old-bungalow bar district — porch drinks, food trailers, walkable to downtown.' },
    ],
    safety: 'Very safe in tourist neighborhoods. Watch heat exhaustion in summer and be cautious around 6th Street after midnight.',
  },

  banff: {
    bestTimeToVisit: {
      months: 'June–September, January–March',
      blurb: 'Summer for hiking and lake colors; winter for skiing and Northern Lights from quieter trails.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 200,
      luxuryDailyUSD: 500,
      blurb: 'Hostels are limited and pricey; the Fairmont Banff Springs hotel pushes the luxury tier hard.',
    },
    travelStyles: {
      family: 'Banff gondola, the Banff Springs hot pool, kid-friendly walks at Johnston Canyon, easy lake-side picnics.',
      couples: 'A Lake Moraine sunrise (book a shuttle), a Lake Louise canoe paddle, a Fairmont afternoon tea.',
      solo: 'Backpacker-friendly hostels in town; bus tours reach the most scenic spots without a rental car.',
    },
    food: [
      { dish: 'Bannock', note: 'Indigenous flatbread served with butter and jam or stews — try at Three Ravens.' },
      { dish: 'Bison or elk', note: 'Game meats on Banff menus — burgers, jerky, or charcuterie boards.' },
      { dish: 'Maple poutine', note: 'Fries with cheese curds, gravy, and a maple-syrup twist — Canadian alpine comfort food.' },
      { dish: 'BeaverTails', note: 'Flat fried dough with cinnamon-sugar or chocolate — the iconic Canadian after-ski snack.' },
    ],
    transportation: {
      primary: 'Roam bus covers Banff townsite and Lake Louise; rental car gives icefields parkway access.',
      tips: 'Book Lake Moraine shuttles ahead — the road has been closed to private cars in summer since 2023.',
    },
    neighborhoods: [
      { name: 'Banff Avenue', blurb: 'Main shopping and dining strip — restaurants, gear shops, the Fairmont gateway.' },
      { name: 'Tunnel Mountain', blurb: 'Quieter residential side — hotels with mountain views, hiking-trail access.' },
      { name: 'Lake Louise', blurb: 'Village 45 km west — the iconic turquoise lake, ski resort, and Fairmont château hotel.' },
    ],
    safety: 'Very safe overall. Real risks are bear encounters on remote trails (carry bear spray) and altitude on glacier hikes.',
  },

  cairns: {
    bestTimeToVisit: {
      months: 'May–October',
      blurb: 'Dry season with clear reef visibility; November–April brings the wet season and box-jellyfish risk.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 450,
      blurb: 'Hostels and esplanade hotels are affordable; reef-resort day-cruises push the luxury tier.',
    },
    travelStyles: {
      family: 'The Esplanade lagoon swimming, the Skyrail rainforest gondola, a kid-friendly reef day-trip.',
      couples: 'A liveaboard reef trip, a Daintree rainforest day, a Kuranda steam-train scenic ride.',
      solo: 'Backpacker hostels are dense and sociable; reef day-trips often run as group bookings.',
    },
    food: [
      { dish: 'Coral trout', note: 'Local Queensland white-fleshed reef fish — grilled or pan-fried at every esplanade restaurant.' },
      { dish: 'Mango anything', note: 'Bowen mangoes peak November–March — eaten on the rocks or in cheesecake.' },
      { dish: 'Damper', note: 'Traditional Australian bushman’s bread — try at a campsite or at a Kuranda food market.' },
      { dish: 'Pavlova', note: 'Meringue with cream and tropical fruit — Christmas pudding alternative in northern Australia.' },
    ],
    transportation: {
      primary: 'Sun Bus covers the city; rental car for the Atherton Tableland and Cape Tribulation.',
      tips: 'You can’t swim in the ocean here (crocs, jellyfish) — swim in the Esplanade lagoon or pool instead.',
    },
    neighborhoods: [
      { name: 'Esplanade', blurb: 'Main waterfront — the lagoon swimming pool, restaurants, the Pier shopping centre.' },
      { name: 'Trinity Beach', blurb: 'Quieter northern beach suburb — beachfront cafés, family-friendly, fewer hostels.' },
      { name: 'Palm Cove', blurb: 'Resort village 25 km north — luxury hotels, beachfront restaurants, the spa town.' },
    ],
    safety: 'Very safe overall. The biggest risks are crocodile habitats (don’t swim outside the lagoon) and box jellyfish in wet season.',
  },

  yogyakarta: {
    bestTimeToVisit: {
      months: 'May–September',
      blurb: 'Dry season with clear Borobudur sunrises; October–April brings tropical afternoon downpours.',
    },
    budget: {
      budgetDailyUSD: 25,
      midDailyUSD: 70,
      luxuryDailyUSD: 220,
      blurb: 'Excellent value across all tiers — heritage hotels in the kraton area push the top.',
    },
    travelStyles: {
      family: 'Borobudur and Prambanan in the morning, batik workshops, a Ramayana ballet evening — kid-friendly pacing.',
      couples: 'A sunrise at Borobudur, a sunset at Prambanan, a slow batik class together in between.',
      solo: 'Hostel-friendly Yogya is the cheapest gateway to Java — Malioboro street has cafés, vendors, easy social spots.',
    },
    food: [
      { dish: 'Gudeg', note: 'Young jackfruit stewed in coconut and palm sugar — Yogya’s signature, served with rice.' },
      { dish: 'Sate klathak', note: 'Goat skewers grilled over charcoal with iron skewers, served with rice and broth.' },
      { dish: 'Bakpia', note: 'Mung-bean-paste pastries — buy a box from Bakpia Pathok before you leave.' },
      { dish: 'Wedang ronde', note: 'Warm ginger-glutinous-rice ball drink — a Yogya street stall classic.' },
    ],
    transportation: {
      primary: 'Becak (cycle rickshaws) and Grab/Gojek motorbikes cover the city; rent a scooter to reach Prambanan independently.',
      tips: 'Buy a Borobudur sunrise package the night before — it includes the temple entry and transport from your hotel.',
    },
    neighborhoods: [
      { name: 'Malioboro', blurb: 'Main shopping street — batik vendors, street food, becaks, hostels.' },
      { name: 'Kraton', blurb: 'Royal palace district — slower pace, traditional houses, museums.' },
      { name: 'Prawirotaman', blurb: 'Bohemian backpacker area — cafés, yoga studios, longer-stay guesthouses.' },
    ],
    safety: 'Generally safe day and night. Watch traffic on Malioboro and around the kraton; petty theft on busy market streets is the main risk.',
  },

  boracay: {
    bestTimeToVisit: {
      months: 'November–April',
      blurb: 'Dry season with calm seas and reliable sunshine; July–September is the typhoon season to skip.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 120,
      luxuryDailyUSD: 350,
      blurb: 'Backpacker hostels are cheap; beachfront resorts on White Beach push the top tier.',
    },
    travelStyles: {
      family: 'Calm-water snorkeling at Puka Beach, sandcastle shoreline, paraw sail rides at sunset — easy for all ages.',
      couples: 'A White Beach sunset paraw cruise, candlelit dinner on the sand, an island-hopping day to private coves.',
      solo: 'White Beach Station 2 has hostels and an easy social scene; nightlife along the path makes solo evenings effortless.',
    },
    food: [
      { dish: 'Calamansi shake', note: 'Tart-sweet citrus shake from any beachside stall — the perfect beach drink.' },
      { dish: 'Chori-burger', note: 'Sweet pork sausage in a soft bun, sold from beach carts — a Boracay invention.' },
      { dish: 'Lechon kawali', note: 'Crispy-skinned fried pork belly — order it on any rice plate.' },
      { dish: 'Halo-halo', note: 'Shaved-ice dessert with sweet beans, jellies, leche flan, ube — the Filipino summer classic.' },
    ],
    transportation: {
      primary: 'The island is small — walk White Beach, tricycle (e-trike) to other parts.',
      tips: 'Negotiate tricycle fares before boarding; rates run higher for tourists at peak season.',
    },
    neighborhoods: [
      { name: 'White Beach', blurb: 'Main four-kilometre strip — Stations 1 (luxe), 2 (lively), 3 (budget).' },
      { name: 'Puka Beach', blurb: 'Quieter north-end beach — coarser sand, fewer crowds, snorkeling.' },
      { name: 'Bulabog Beach', blurb: 'Windsurfing and kiteboarding side — opposite shore from White Beach.' },
    ],
    safety: 'Very safe day and night. The biggest risks are sunburn and undertow swimming — observe the lifeguard flags.',
  },

  beijing: {
    bestTimeToVisit: {
      months: 'April–May, September–October',
      blurb: 'Mild temperatures, blue skies, less smog; summers are humid and winters bitterly cold.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 350,
      blurb: 'Street food and hutong dumplings keep budget days affordable; courtyard hotels push the luxury tier.',
    },
    travelStyles: {
      family: 'Great Wall day trips, the Beijing Zoo pandas, kite-flying in Tiananmen Square mornings.',
      couples: 'A Mutianyu Wall sunset, a hutong courtyard dinner, a Peking duck banquet under red lanterns.',
      solo: 'English is limited but translation apps work fine; hostels in the hutongs make solo evenings easy.',
    },
    food: [
      { dish: 'Peking duck', note: 'Crisp lacquered duck wrapped in thin pancakes with scallion and hoisin.' },
      { dish: 'Jiaozi (dumplings)', note: 'Northern-Chinese pork-and-chive dumplings — a winter staple.' },
      { dish: 'Zhajiangmian', note: 'Hand-pulled noodles with fermented soybean sauce — the Beijing comfort dish.' },
      { dish: 'Jian bing', note: 'Crepe-style street breakfast with egg, scallions, cilantro, crispy cracker.' },
    ],
    transportation: {
      primary: 'Subway is extensive and cheap; use Didi (China’s Uber) for evenings or remote sights.',
      tips: 'Get a VPN sorted before arriving so Google Maps and Gmail work; download offline maps as backup.',
    },
    neighborhoods: [
      { name: 'Hutongs (Dongcheng)', blurb: 'Old grey-brick lanes — courtyards, dumpling shops, the Drum Tower.' },
      { name: 'Sanlitun', blurb: 'Nightlife and shopping district — bars, restaurants, designer boutiques.' },
      { name: 'Wangfujing', blurb: 'Pedestrian shopping street — souvenir stalls, big-brand stores, snack streets.' },
    ],
    safety: 'Extremely safe by Western standards. Watch for taxi scams at the airport and pickpockets in dense tourist crowds.',
  },

  shanghai: {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild and dry shoulder seasons; summers are humid and tropical-storm prone.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 150,
      luxuryDailyUSD: 420,
      blurb: 'Cheap dumpling lunches keep budgets honest; riverfront hotels with skyline views push the top.',
    },
    travelStyles: {
      family: 'Shanghai Disney, the Science and Technology Museum, a Bund stroll with skyline photos.',
      couples: 'A Huangpu River cruise, rooftop drinks above the Bund, French Concession café afternoons.',
      solo: 'English-friendly on the Bund and in tourist districts; hostels in the French Concession make solo nights easy.',
    },
    food: [
      { dish: 'Xiaolongbao', note: 'Soup-filled pork dumplings — Din Tai Fung is global, the local lane shops are better.' },
      { dish: 'Shengjianbao', note: 'Pan-fried pork buns with crispy bottoms — the Shanghai breakfast.' },
      { dish: 'Red-braised pork', note: 'Slow-cooked pork belly in soy and sugar — the Mao Zedong signature dish.' },
      { dish: 'Hairy crab', note: 'Steamed crab with vinegar dip — peak season is October–November.' },
    ],
    transportation: {
      primary: 'Metro is fast, cheap, and English-signed; the Maglev links Pudong airport in 8 minutes.',
      tips: 'Download Didi to call cars; the Bund and Yu Garden are walkable from each other on a good day.',
    },
    neighborhoods: [
      { name: 'The Bund', blurb: 'Riverfront promenade — colonial architecture facing the Pudong skyline.' },
      { name: 'French Concession', blurb: 'Tree-lined streets with cafés, boutiques, the city’s most stylish blocks.' },
      { name: 'Pudong', blurb: 'New financial district — the futuristic skyline, observation decks, big malls.' },
    ],
    safety: 'Very safe overall. Watch the airport taxi scams and pickpockets in the Bund crowds; otherwise low risk.',
  },

  krabi: {
    bestTimeToVisit: {
      months: 'November–April',
      blurb: 'Dry season with calm Andaman waters; May–October brings monsoon storms and rough seas.',
    },
    budget: {
      budgetDailyUSD: 40,
      midDailyUSD: 100,
      luxuryDailyUSD: 350,
      blurb: 'Ao Nang hostels are cheap; secluded Railay and Phi Phi resorts push the top tier.',
    },
    travelStyles: {
      family: 'Calm-water swimming at Railay Beach, longtail-boat day trips, kid-friendly cooking classes.',
      couples: 'A four-island sunset tour, beachfront candlelit dinners on Railay, a hot-spring waterfall day trip.',
      solo: 'Ao Nang is hostel-dense and easy for solo arrivals; longtail boats run constantly to Railay and Phi Phi.',
    },
    food: [
      { dish: 'Tom yum goong', note: 'Spicy-sour shrimp soup with lemongrass — a Krabi night-market staple.' },
      { dish: 'Pad see ew', note: 'Wide rice noodles stir-fried with soy and Chinese broccoli — the comforting beach lunch.' },
      { dish: 'Massaman curry', note: 'Mild peanut-coconut curry with beef and potato — Southern Thai specialty.' },
      { dish: 'Mango sticky rice', note: 'Sticky rice with sweet coconut milk and ripe mango — every dessert cart has it.' },
    ],
    transportation: {
      primary: 'Longtail boats reach Railay and the islands; songthaews (pickup taxis) cover Ao Nang and Krabi Town.',
      tips: 'Buy four-island tours from your hotel — they include hotel pickup and lunch, saves the hassle of the pier.',
    },
    neighborhoods: [
      { name: 'Ao Nang', blurb: 'Main tourist beach town — hotels, restaurants, the longtail-boat pier.' },
      { name: 'Railay', blurb: 'Peninsula reachable only by boat — climbing cliffs, secluded beaches, no roads.' },
      { name: 'Krabi Town', blurb: 'Local market town — riverside seafood, weekend night market, cheaper accommodation.' },
    ],
    safety: 'Very safe. Risks are longtail-boat motion sickness, sunburn, and jellyfish stings on the windward beaches.',
  },

  maldives: {
    bestTimeToVisit: {
      months: 'November–April',
      blurb: 'Dry season with calm seas and clear underwater visibility; May–October is the monsoon season.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 350,
      luxuryDailyUSD: 1500,
      blurb: 'Guesthouse stays on local islands are affordable; overwater-villa resorts run thousands per night.',
    },
    travelStyles: {
      family: 'House-reef snorkeling from a beach villa, kid clubs at resort properties, calm-water swimming.',
      couples: 'Overwater villa stays, private dolphin cruises at sunset, a manta-ray night snorkel.',
      solo: 'Local-island guesthouses are budget-friendly for solo travelers — Maafushi has hostels and dive operators.',
    },
    food: [
      { dish: 'Mas huni', note: 'Tuna, coconut, onion, chili — the Maldivian breakfast, eaten with roshi flatbread.' },
      { dish: 'Garudhiya', note: 'Clear tuna broth with rice, lime, and chili — Maldivian comfort food.' },
      { dish: 'Fihunu mas', note: 'Grilled fish marinated in chili and lime — the freshly-caught beach BBQ.' },
      { dish: 'Bis keemiya', note: 'Samosa-like pastry with tuna, egg, cabbage — sold as an afternoon snack.' },
    ],
    transportation: {
      primary: 'Seaplane or speedboat from Malé to your resort; local ferries between inhabited islands.',
      tips: 'Pack reef-safe sunscreen; reef damage from regular sunscreen is taken seriously by resorts.',
    },
    neighborhoods: [
      { name: 'Malé', blurb: 'Capital island — quick stopover, the fish market, the Hukuru Miskiy mosque.' },
      { name: 'Maafushi', blurb: 'Local island accessible to budget travelers — guesthouses, dive shops, public beach.' },
      { name: 'Resort atolls', blurb: 'Private-island resorts on Baa, North Male, South Ari — each is its own world.' },
    ],
    safety: 'Extremely safe. The main risks are sun exposure, reef cuts on shallow swims, and overspending on resort drinks.',
  },

  colombo: {
    bestTimeToVisit: {
      months: 'December–March',
      blurb: 'Dry season on the west coast; April brings hot pre-monsoon weeks and May the rains.',
    },
    budget: {
      budgetDailyUSD: 30,
      midDailyUSD: 75,
      luxuryDailyUSD: 250,
      blurb: 'Excellent value — hopper-and-curry meals run a few dollars; colonial-era hotels stay reasonable.',
    },
    travelStyles: {
      family: 'Galle Face Green at sunset for kite flying, the Dutch Hospital food courtyard, the Independence Memorial.',
      couples: 'Cinnamon Gardens evening walks, a rooftop bar over the city, a tea-tasting at the Dilmah store.',
      solo: 'Tuktuks are cheap and metered (use PickMe app); hostels in Mount Lavinia and Galle Face are sociable.',
    },
    food: [
      { dish: 'Hoppers', note: 'Bowl-shaped rice flour pancakes — order plain for breakfast or with egg in the middle.' },
      { dish: 'Kottu roti', note: 'Chopped flatbread stir-fried with vegetables and curry — the iconic night-market dish.' },
      { dish: 'Fish curry', note: 'Coconut-coriander fish curry — every roadside stall has its own version.' },
      { dish: 'Watalappan', note: 'Cardamom-jaggery custard — the Sri Lankan Muslim community dessert.' },
    ],
    transportation: {
      primary: 'Tuktuks via PickMe app are cheap and metered; trains down the coast are scenic and easy.',
      tips: 'Take the southern train to Galle for the Indian Ocean coastline — a half-day in a window seat.',
    },
    neighborhoods: [
      { name: 'Fort', blurb: 'Old colonial centre — the Dutch Hospital food court, the lighthouse clock.' },
      { name: 'Galle Face Green', blurb: 'Seafront promenade — kite flying, street food, sunset crowds.' },
      { name: 'Cinnamon Gardens', blurb: 'Leafy embassy neighborhood — restaurants, boutique hotels, the museum.' },
    ],
    safety: 'Generally safe day and night. Be cautious of tuktuk overcharging from the airport — use PickMe to call one in advance.',
  },

  kathmandu: {
    bestTimeToVisit: {
      months: 'October–November, March–May',
      blurb: 'Clear Himalayan views in autumn; spring is warmer with rhododendron blooms; June–September is monsoon.',
    },
    budget: {
      budgetDailyUSD: 25,
      midDailyUSD: 70,
      luxuryDailyUSD: 200,
      blurb: 'Thamel guesthouses are cheap; boutique heritage hotels in Patan push the luxury tier.',
    },
    travelStyles: {
      family: 'Day-trip to Bhaktapur, the Boudhanath stupa, the monkey temple at Swayambhu — kid-engaging.',
      couples: 'Sunset at Boudhanath, dinner in Thamel, a half-day cooking class learning momo dumplings.',
      solo: 'Thamel is hostel-dense and trekker-friendly; easy to join group treks to Annapurna or Everest base camp.',
    },
    food: [
      { dish: 'Momo', note: 'Tibetan-Nepali dumplings — steamed or fried, with spicy tomato dipping sauce.' },
      { dish: 'Dal bhat', note: 'Lentil soup, rice, vegetable curry — the daily staple, refills usually free.' },
      { dish: 'Chow mein', note: 'Stir-fried noodles with vegetables and egg — a Newar street-food classic.' },
      { dish: 'Sel roti', note: 'Sweet ring-shaped fried rice bread — a festival and breakfast specialty.' },
    ],
    transportation: {
      primary: 'Walk Thamel; tuktuks and motorbike taxis (use Pathao app) for longer distances.',
      tips: 'Negotiate taxi fares before boarding; check trek permits at the Tourist Information Centre.',
    },
    neighborhoods: [
      { name: 'Thamel', blurb: 'Backpacker and trekker hub — gear shops, restaurants, hostels, evening bars.' },
      { name: 'Patan', blurb: 'UNESCO-listed Durbar Square south of the river — quieter, craft shops, heritage hotels.' },
      { name: 'Bhaktapur', blurb: 'Medieval pottery city 13 km east — day-trip-perfect for temple courtyards.' },
    ],
    safety: 'Safe for tourists; main risks are altitude on treks (acclimatize properly) and pickpockets in Thamel crowds.',
  },

  brussels: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Mild weather and longer days without the summer day-tripper crowds.',
    },
    budget: {
      budgetDailyUSD: 75,
      midDailyUSD: 160,
      luxuryDailyUSD: 380,
      blurb: 'Frites and Belgian beer stay cheap; central business hotels run high midweek.',
    },
    travelStyles: {
      family: 'The Comics Art Museum, the Atomium, an afternoon chocolate-making class — easy for all ages.',
      couples: 'A Grand-Place evening, a Trappist beer tasting, a Saint-Catherine seafood dinner.',
      solo: 'English- and French-friendly; hostels near Grand-Place and Saint-Géry are sociable; Bruges day trips easy.',
    },
    food: [
      { dish: 'Moules-frites', note: 'Mussels in white wine or beer with frites — the national dish.' },
      { dish: 'Waterzooi', note: 'Cream-and-vegetable stew with chicken or fish — Flemish comfort food.' },
      { dish: 'Belgian waffle', note: 'Liège-style (caramelized, dense) or Brussels-style (light, fluffy) — try both.' },
      { dish: 'Belgian beer', note: 'Trappist, lambic, gueuze — order a tasting flight at Délirium or a corner café.' },
    ],
    transportation: {
      primary: 'Metro, tram, and bus network is efficient; the historic centre is walkable end to end.',
      tips: 'Buy the STIB day pass; Eurostar and Thalys put London/Paris/Amsterdam within easy day-trip distance.',
    },
    neighborhoods: [
      { name: 'Grand-Place', blurb: 'Gothic centre — the medieval square, chocolate shops, the city heart.' },
      { name: 'Saint-Géry', blurb: 'Hip nightlife district — bars, late-night cafés, the most-Insta-ed strip.' },
      { name: 'European Quarter', blurb: 'EU institutions side — calmer, museum-heavy, weekend-quiet.' },
    ],
    safety: 'Generally safe by day; the Brussels-Midi station and Anderlecht have higher petty-crime rates after dark.',
  },

  'cinque-terre': {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Warm without August crowds; coastal trails and ferries run reliably outside winter.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 180,
      luxuryDailyUSD: 480,
      blurb: 'Village guesthouses and pensions are reasonable; sea-view rooms in Vernazza and Manarola triple in price.',
    },
    travelStyles: {
      family: 'Easy train hopping between villages, gentle hikes, swimming at Monterosso — a low-friction Italy week.',
      couples: 'Sunset apéritif terraces in Manarola, hike-and-swim days, fresh seafood in Riomaggiore.',
      solo: 'Hostels in Riomaggiore and Vernazza; trails connect every village; English widely spoken in tourist offices.',
    },
    food: [
      { dish: 'Pesto alla genovese', note: 'Liguria invented pesto — order it with trofie pasta from a village trattoria.' },
      { dish: 'Focaccia', note: 'Salt-and-olive-oil focaccia — eaten warm from a forno as a midday snack.' },
      { dish: 'Acciughe (anchovies)', note: 'Fresh-caught Monterosso anchovies — fried, marinated, or stuffed.' },
      { dish: 'Sciacchetrà', note: 'Sweet dessert wine from the village vineyards — order with biscotti after dinner.' },
    ],
    transportation: {
      primary: 'Trenitalia regional trains connect the five villages — buy a Cinque Terre Card for unlimited rides.',
      tips: 'Check the trail status before hiking; the path to Vernazza often closes after rain.',
    },
    neighborhoods: [
      { name: 'Monterosso', blurb: 'Largest village — the only real sandy beach, beach umbrellas, hotels.' },
      { name: 'Vernazza', blurb: 'Picture-perfect harbour — the most photographed and visited village.' },
      { name: 'Manarola', blurb: 'Cliffside village — the iconic sunset spot, swimming off the rocks.' },
    ],
    safety: 'Very safe day and night. Risks are cliff trail slips after rain and pickpockets on the regional trains.',
  },

  'lake-como': {
    bestTimeToVisit: {
      months: 'May–June, September',
      blurb: 'Warm enough for boat days without August crowds; September has the year’s clearest mountain light.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 200,
      luxuryDailyUSD: 600,
      blurb: 'B&Bs in smaller villages are reasonable; villa-hotels on the shore push the luxury tier hard.',
    },
    travelStyles: {
      family: 'Easy ferry hopping between villages, the Villa Carlotta gardens, swimming at the public lidos.',
      couples: 'A private boat sunset, a dinner at a villa hotel, a sunrise terrace at Varenna.',
      solo: 'Bellagio and Varenna are walkable solo bases; ferries make every village a half-day option.',
    },
    food: [
      { dish: 'Pizzoccheri', note: 'Buckwheat pasta with cabbage, potatoes, and mountain cheese — Lombard comfort food.' },
      { dish: 'Lavarello', note: 'Lake-caught white fish, grilled simply with lemon and olive oil.' },
      { dish: 'Risotto alla milanese', note: 'Saffron-yellow risotto with bone marrow — a Lombard classic.' },
      { dish: 'Missoltini', note: 'Sun-dried lake fish served with polenta — a local Lake Como specialty.' },
    ],
    transportation: {
      primary: 'NLC ferries cross the lake every 30 minutes; trains from Milan reach Como in 30 minutes.',
      tips: 'Buy a one-day ferry pass — much cheaper than three single tickets between villages.',
    },
    neighborhoods: [
      { name: 'Bellagio', blurb: 'The most famous village — boutiques, restaurants, the steamer ferry hub.' },
      { name: 'Varenna', blurb: 'Quieter east-shore village — gardens, harbour terraces, less crowded.' },
      { name: 'Como', blurb: 'Largest town at the lake’s southern tip — train station, silk museum, weekend market.' },
    ],
    safety: 'Extremely safe. The main risks are boat-deck slips and overpaying for restaurants in tourist hubs.',
  },

  mykonos: {
    bestTimeToVisit: {
      months: 'May–June, September',
      blurb: 'Mild beach weather without July–August peak crowds and prices.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 220,
      luxuryDailyUSD: 700,
      blurb: 'Hostels exist but rare; mid-range guesthouses are good; beachfront luxury is famously expensive.',
    },
    travelStyles: {
      family: 'Calm-water family beaches at Ornos and Platis Gialos, a half-day to Delos archaeological island.',
      couples: 'Sunset cocktails in Little Venice, a private catamaran day, a beach-club dinner at Scorpios.',
      solo: 'Lively backpacker hostels in Mykonos Town; nightlife scene makes solo travel social — pricey but easy.',
    },
    food: [
      { dish: 'Kopanisti', note: 'Spicy aged cheese spread on bread — a Cycladic specialty.' },
      { dish: 'Louza', note: 'Cured pork loin marinated in wine and spices — Mykonos appetizer staple.' },
      { dish: 'Fresh seafood', note: 'Grilled octopus, sea bream, prawns — every harbourside taverna does them well.' },
      { dish: 'Loukoumades', note: 'Tiny honey doughnuts dusted with cinnamon — the after-dinner Greek classic.' },
    ],
    transportation: {
      primary: 'Local buses link the beaches; rent an ATV or scooter for full island access.',
      tips: 'Ferry to Delos for half-day archaeology; book hotel transfers from the port — taxis can run out fast.',
    },
    neighborhoods: [
      { name: 'Mykonos Town (Chora)', blurb: 'Whitewashed maze — Little Venice, the windmills, the busy lanes.' },
      { name: 'Ornos', blurb: 'Family-beach side — calm water, beachfront restaurants, easy bus link.' },
      { name: 'Platis Gialos', blurb: 'Beach club strip — Tropicana, water-taxi connections to Paradise and Super Paradise.' },
    ],
    safety: 'Very safe day and night. Watch for ATV accidents — wear a helmet and don’t drink before driving.',
  },

  crete: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Warm sea, less crushing heat than mainland summer, fewer crowds at Knossos.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 130,
      luxuryDailyUSD: 400,
      blurb: 'Family-run tavernas keep food affordable; coastal-resort hotels push the top tier.',
    },
    travelStyles: {
      family: 'Calm beaches at Elafonissi, the Knossos palace, gorge hikes for older kids, water park near Chania.',
      couples: 'A long Samaria gorge hike, a Chania-harbour sunset dinner, a wine route through Heraklion vineyards.',
      solo: 'Hostels in Chania and Heraklion are good; rent a car to explore the south coast and inland villages.',
    },
    food: [
      { dish: 'Dakos', note: 'Barley rusk topped with tomato, feta, olive oil, olives — the Cretan summer salad.' },
      { dish: 'Kalitsounia', note: 'Small Cretan cheese pies with mint and honey — a sweet-savory specialty.' },
      { dish: 'Goat or lamb stifado', note: 'Slow-braised meat stew with pearl onions and red wine.' },
      { dish: 'Raki', note: 'Cretan grape-distilled spirit — every meal ends with a complimentary glass.' },
    ],
    transportation: {
      primary: 'KTEL buses link the north-coast towns; rent a car for inland villages and beach coves.',
      tips: 'Drive the road to Elafonissi early — the parking fills by 10am in summer.',
    },
    neighborhoods: [
      { name: 'Chania', blurb: 'Venetian harbour town — lighthouse, restaurants, the old town lanes.' },
      { name: 'Heraklion', blurb: 'Largest city — museum, Knossos a short drive, ferry connections.' },
      { name: 'Rethymno', blurb: 'Middle-coast old town — Venetian fortress, sandy beaches, walkable centre.' },
    ],
    safety: 'Very safe. The main risks are summer heat and gorge-hike dehydration — carry more water than you think.',
  },

  lucerne: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Summer for hiking and lake swims; December for Christmas-market evenings and snow above town.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 220,
      luxuryDailyUSD: 550,
      blurb: 'Everything in Switzerland is expensive; supermarkets and student-area cafés save real money.',
    },
    travelStyles: {
      family: 'The Swiss Museum of Transport, a Mount Pilatus day trip with cog rail and cable car, lake swimming.',
      couples: 'A sunset boat cruise, a cogwheel up Rigi, a chocolate-and-fondue evening in the old town.',
      solo: 'Walkable centre, English fluency, English-language guided day-tours make solo Alps exploration easy.',
    },
    food: [
      { dish: 'Älplermagronen', note: 'Alpine mac-and-cheese with potato, cream, and crispy onions — comfort food.' },
      { dish: 'Cheese fondue', note: 'Gruyère and Vacherin melted with white wine — eat slowly with bread cubes.' },
      { dish: 'Rösti', note: 'Crispy grated-potato cake — the Swiss-German hash brown, served with bacon or fried egg.' },
      { dish: 'Luzerner Chügelipastete', note: 'Puff-pastry shell filled with creamy veal and mushrooms — a local specialty.' },
    ],
    transportation: {
      primary: 'Trains and buses connect everywhere; the Swiss Travel Pass covers public transit, boats, mountain rails.',
      tips: 'Buy the Swiss Travel Pass before you arrive; it’s cheaper online and covers the Pilatus golden round-trip.',
    },
    neighborhoods: [
      { name: 'Altstadt', blurb: 'Old town — Chapel Bridge, painted facades, restaurants, the city heart.' },
      { name: 'Bourbaki Panorama', blurb: 'Cultural quarter just east — museums, the panoramic painting, café-lined squares.' },
      { name: 'Tribschen', blurb: 'Quieter lakeshore neighborhood — Wagner museum, swimming spots, sunset walks.' },
    ],
    safety: 'Among the safest cities in the world. The only real risk is overestimating your hiking ability above the cloud line.',
  },

  bergen: {
    bestTimeToVisit: {
      months: 'May–September',
      blurb: 'Long bright Nordic days; bring a rain jacket year-round — Bergen is one of Europe’s wettest cities.',
    },
    budget: {
      budgetDailyUSD: 85,
      midDailyUSD: 200,
      luxuryDailyUSD: 500,
      blurb: 'Hostels and supermarket dinners save real money; fjord cruises are the line-item that adds up.',
    },
    travelStyles: {
      family: 'Bergenhus fortress, the fish market, a half-day cruise into Mostraumen, the funicular up Fløyen.',
      couples: 'A sunset hike on Fløyen, a sognefjord day cruise, a wooden-house dinner in Bryggen.',
      solo: 'Hostels near Bryggen are sociable; English fluent everywhere; day-tour bookings make fjord access easy.',
    },
    food: [
      { dish: 'Bergen fish soup', note: 'Cream-based fish soup with carrot and leek — order it at the fish market.' },
      { dish: 'Skillingsboller', note: 'Bergen’s cinnamon bun — coiled, sugar-glazed, bigger than your hand.' },
      { dish: 'Klippfisk', note: 'Salted dried cod — historic, served in a tomato-onion bacalao stew.' },
      { dish: 'Fårikål', note: 'Mutton-and-cabbage stew, peppercorn-spiked — Norway’s national dish, autumn-specific.' },
    ],
    transportation: {
      primary: 'Bybanen light rail covers the city; the Bergen-Oslo railway is one of Europe’s great scenic lines.',
      tips: 'Take the Norway in a Nutshell route to Flåm — train + fjord ferry + bus combo over two days.',
    },
    neighborhoods: [
      { name: 'Bryggen', blurb: 'UNESCO-listed Hanseatic wharf — colorful wooden houses, museums, the postcard view.' },
      { name: 'Nordnes', blurb: 'Headland west of centre — sea baths, quieter streets, the aquarium.' },
      { name: 'Sandviken', blurb: 'Quieter neighborhood north — old white houses, sea views, longer-stay rentals.' },
    ],
    safety: 'Extremely safe day and night. The main risks are slippery wet cobbles and underestimating the rain.',
  },

  'lake-bled': {
    bestTimeToVisit: {
      months: 'May–September',
      blurb: 'Warm enough for swimming and rowing; winter brings snow but lake activities pause.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 130,
      luxuryDailyUSD: 350,
      blurb: 'Pensions and hostels are cheap; lakeside hotels with castle views push the top tier.',
    },
    travelStyles: {
      family: 'Pletna boat to the island church, walking circuit around the lake, a Vintgar gorge boardwalk hike.',
      couples: 'A castle-terrace dinner with the lake below, a sunset row on the lake, a Triglav day hike.',
      solo: 'Small and quiet; hostels in Bled village; English widely spoken; easy bus to Ljubljana.',
    },
    food: [
      { dish: 'Kremšnita', note: 'Bled’s signature cream cake — vanilla cream between puff pastry.' },
      { dish: 'Štruklji', note: 'Rolled dough dumplings with cottage cheese, walnut, or tarragon filling.' },
      { dish: 'Carniolan sausage', note: 'Slovenian cured sausage with paprika — served with mustard and bread.' },
      { dish: 'Trout', note: 'Local lake or river trout — grilled simply with herbs and lemon.' },
    ],
    transportation: {
      primary: 'Walk the 6 km lake loop; buses link to Ljubljana (1h) and Bohinj (30 min).',
      tips: 'Hire a private boat early to skip the pletna queue; sunset row is the calmer time.',
    },
    neighborhoods: [
      { name: 'Bled village', blurb: 'Main town centre — restaurants, hotels, the bus station.' },
      { name: 'Mlino', blurb: 'Quieter west-shore neighborhood — guesthouses, pletna boat dock, classic kremšnita cafés.' },
      { name: 'Bled Castle hill', blurb: 'Cliffside above the lake — the castle, terrace dining, panoramic views.' },
    ],
    safety: 'Extremely safe day and night. Real risks are lake-rowing capsizes and Triglav hike altitude — go with a guide.',
  },

  honolulu: {
    bestTimeToVisit: {
      months: 'April–June, September–November',
      blurb: 'Mild temperatures, drier weather, smaller crowds before the winter surf and holiday season.',
    },
    budget: {
      budgetDailyUSD: 95,
      midDailyUSD: 220,
      luxuryDailyUSD: 550,
      blurb: 'Plate-lunch trucks and Costco runs save real money; Waikiki beachfront hotels push the luxury tier.',
    },
    travelStyles: {
      family: 'Hanauma Bay snorkeling, Diamond Head sunrise hike, the Polynesian Cultural Center, Waikiki sandcastles.',
      couples: 'A sunset catamaran, a Lanikai beach day, an Alan Wong tasting menu, a North Shore drive.',
      solo: 'Hostels in Waikiki are budget-friendly; the Bus reaches most of the island; English-fluent everywhere.',
    },
    food: [
      { dish: 'Poke', note: 'Cubed raw fish with shoyu, sesame, scallion — the Hawaiian local lunch staple.' },
      { dish: 'Plate lunch', note: 'Two-scoop rice, mac salad, kalua pork or katsu — order from a plate lunch truck.' },
      { dish: 'Loco moco', note: 'Rice, hamburger, fried egg, brown gravy — the Hawaiian comfort breakfast.' },
      { dish: 'Shave ice', note: 'Hawaiian shave ice (not slushie) with syrup over the top — a North Shore institution.' },
    ],
    transportation: {
      primary: 'TheBus covers most of Oahu; rent a car for the North Shore and the windward coast.',
      tips: 'Reservations required for Hanauma Bay, Diamond Head, and most other state parks — book online ahead.',
    },
    neighborhoods: [
      { name: 'Waikiki', blurb: 'Main tourist beach strip — hotels, restaurants, surf schools, shopping.' },
      { name: 'Kakaako', blurb: 'Hip downtown side — murals, breweries, the SALT food court, design shops.' },
      { name: 'North Shore', blurb: 'Surf town hour-drive away — Haleiwa, big-wave beaches in winter, shrimp trucks.' },
    ],
    safety: 'Very safe in tourist neighborhoods. Watch for sun, ocean currents at unfamiliar beaches, and car break-ins at trailheads.',
  },

  maui: {
    bestTimeToVisit: {
      months: 'April–May, September–October',
      blurb: 'Drier weeks, smaller crowds, fairer rental car rates than the winter peak.',
    },
    budget: {
      budgetDailyUSD: 100,
      midDailyUSD: 250,
      luxuryDailyUSD: 700,
      blurb: 'Vacation rentals beat hotels on value; rental car costs are the line item that surprises people.',
    },
    travelStyles: {
      family: 'Snorkeling at Molokini, the Maui Ocean Center, the Old Lahaina Luau, beach mornings at Kaanapali.',
      couples: 'A Haleakala summit sunrise, a Road to Hana day, a couples massage at a Wailea resort spa.',
      solo: 'Smaller island so rental car is essential; hostels are rare — book budget vacation rentals instead.',
    },
    food: [
      { dish: 'Mahi-mahi', note: 'Pacific dolphinfish (not the mammal) — grilled or blackened on every dinner menu.' },
      { dish: 'Spam musubi', note: 'Grilled spam over rice wrapped in nori — the Hawaiian gas-station snack staple.' },
      { dish: 'Kalua pork', note: 'Pulled-pork roasted in an underground imu — the centerpiece of a luau.' },
      { dish: 'Banana bread (Road to Hana)', note: 'Roadside stand banana bread baked that morning — every traveler stops.' },
    ],
    transportation: {
      primary: 'Rental car is essential — no real public transit covers the island.',
      tips: 'Drive the Road to Hana clockwise (counter-recommended) for fewer cars; gas up in Paia before starting.',
    },
    neighborhoods: [
      { name: 'Lahaina', blurb: 'West Maui historic harbour town — restaurants, snorkel tours, Front Street.' },
      { name: 'Wailea', blurb: 'South Maui resort strip — luxury hotels, beaches, the calmest sunsets.' },
      { name: 'Paia', blurb: 'North-shore surf town — windsurfers, organic cafés, the start of the Road to Hana.' },
    ],
    safety: 'Very safe overall. Watch for big-wave swells in winter, sunburn year-round, and car break-ins at empty trailheads.',
  },

  fes: {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild without midsummer heat; the medina is hottest in July–August.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 100,
      luxuryDailyUSD: 350,
      blurb: 'Riad guesthouses are excellent value; restored medina palaces push the luxury tier.',
    },
    travelStyles: {
      family: 'Tanneries observed from terraces above, pottery and zellij workshops, an evening hammam, day trip to Volubilis.',
      couples: 'Sunset on a riad rooftop, a candlelit medina dinner, a private medina walking tour with a local guide.',
      solo: 'Hire a guide for the medina on day one — the maze is genuinely confusing without one.',
    },
    food: [
      { dish: 'Pastilla', note: 'Sweet-and-savory pigeon (or chicken) pie with almonds and cinnamon — a Fes specialty.' },
      { dish: 'Tagine', note: 'Slow-cooked stews in conical pots — chicken with preserved lemon, lamb with prunes.' },
      { dish: 'Harira', note: 'Tomato-lentil soup with chickpeas and lamb — the traditional iftar starter during Ramadan.' },
      { dish: 'Mint tea', note: 'Sweet, hot, served theatrically poured from height — declined politely only once.' },
    ],
    transportation: {
      primary: 'The medina is walkable but disorienting — hire a guide; petits taxis (red) cover the modern city.',
      tips: 'Agree on a price before any taxi ride; the medina has no cars but porters with carts for luggage.',
    },
    neighborhoods: [
      { name: 'Fes el-Bali', blurb: 'Old medina — tanneries, Al-Quaraouiyine mosque, the labyrinth core.' },
      { name: 'Fes el-Jdid', blurb: 'New medina — the Mellah Jewish quarter, royal palace gates, market lanes.' },
      { name: 'Ville Nouvelle', blurb: 'French colonial new town — boulevards, cafés, the train station.' },
    ],
    safety: 'Safe with sensible caution. Pickpockets and aggressive medina “guides” are the main hassles — hire a licensed guide.',
  },

  brisbane: {
    bestTimeToVisit: {
      months: 'May–October',
      blurb: 'Mild dry winter and spring; summers are humid and storm-prone, with January cyclone risk further north.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 380,
      blurb: 'Brunch culture stretches a budget; river-view hotels and Gold Coast resorts push the luxury tier.',
    },
    travelStyles: {
      family: 'Streets Beach at South Bank, the Lone Pine Koala Sanctuary, ferry rides on the CityCat, weekend Gold Coast trips.',
      couples: 'A Story Bridge climb at sunset, a Stradbroke Island day trip, a long brunch in West End.',
      solo: 'Hostels in Fortitude Valley are good; the CityCat ferry is its own attraction; sub-tropical light makes solo days easy.',
    },
    food: [
      { dish: 'Brunch (Aussie all-day)', note: 'Smashed avo on toast, flat whites, baked eggs — Brisbane brunch is excellent.' },
      { dish: 'Moreton Bay bugs', note: 'Local slipper lobsters — grilled with garlic butter, in summer.' },
      { dish: 'Lamington', note: 'Sponge cake dipped in chocolate and coconut — quintessentially Australian.' },
      { dish: 'Pavlova', note: 'Meringue dessert with cream and tropical fruit — Christmas dinner standard.' },
    ],
    transportation: {
      primary: 'CityCat ferries on the river plus buses and the Citytrain network; Translink card for all of them.',
      tips: 'Take the CityCat at golden hour — Brisbane river bends are scenic, and the ferry is the cheapest sightseeing trip.',
    },
    neighborhoods: [
      { name: 'South Bank', blurb: 'Riverside cultural strip — the parklands, Streets Beach, the Cultural Centre.' },
      { name: 'Fortitude Valley', blurb: 'Nightlife and music district — late bars, live music, hostels.' },
      { name: 'West End', blurb: 'Bohemian neighborhood — cafés, vintage shops, multicultural restaurants.' },
    ],
    safety: 'Very safe day and night. Risks are sunburn, summer thunderstorms, and the rare aggressive magpie in spring.',
  },

  wellington: {
    bestTimeToVisit: {
      months: 'December–March',
      blurb: 'Long summer days with mild temperatures; the rest of the year is windy but mostly mild.',
    },
    budget: {
      budgetDailyUSD: 75,
      midDailyUSD: 170,
      luxuryDailyUSD: 380,
      blurb: 'Excellent café culture stretches a budget; harbour-view hotels push the top tier.',
    },
    travelStyles: {
      family: 'Te Papa museum is genuinely top-tier for all ages; cable car to the botanical gardens; Zealandia bird sanctuary.',
      couples: 'A Cuba Street café crawl, a Mount Victoria sunset, a Martinborough wine country day trip.',
      solo: 'Compact, English-fluent, café-dense — Wellington is the friendliest of the NZ cities for solo travelers.',
    },
    food: [
      { dish: 'Flat white', note: 'Wellington is one of the global flat-white capitals — try every café you pass.' },
      { dish: 'Lamb', note: 'New Zealand lamb at its best — order it at a steakhouse like Logan Brown.' },
      { dish: 'Pavlova', note: 'Meringue dessert with cream and kiwifruit — the iconic Kiwi sweet.' },
      { dish: 'Fish and chips', note: 'Battered hoki or terakihi at a harbourside takeaway, eaten on a bench.' },
    ],
    transportation: {
      primary: 'Buses cover the city; the cable car is an attraction more than a transit option.',
      tips: 'Walk Cuba and Courtenay — Wellington’s walkable centre is denser than it looks on Google Maps.',
    },
    neighborhoods: [
      { name: 'Cuba Quarter', blurb: 'Indie cafés, vintage shops, the loudest weekend nightlife.' },
      { name: 'Te Aro', blurb: 'Hip waterfront blocks — bars, restaurants, the most Instagrammed murals.' },
      { name: 'Mount Victoria', blurb: 'Residential hill suburb above town with the lookout walk and Lord of the Rings tour stops.' },
    ],
    safety: 'Extremely safe day and night. The biggest hazards are wind gusts on the waterfront and earthquakes — read building safety cards in your hotel.',
  },

  lauterbrunnen: {
    bestTimeToVisit: {
      months: 'June–September',
      blurb: 'Long alpine days with every cable car and trail open; winter is for skiers and the valley quietens.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 220,
      luxuryDailyUSD: 550,
      blurb: 'Camping and youth hostels save real money; cliff-village hotels in Mürren and Wengen push the top.',
    },
    travelStyles: {
      family: 'The Trümmelbach Falls inside the cliff, the gondola up to Grütschalp, gentle valley walks alongside the river.',
      couples: 'A sunset from Mürren with the Eiger trio glowing pink, a fondue in a stube, the Schilthorn revolving restaurant.',
      solo: 'Hostels in town and on the cliffs are sociable; trail networks are exceptionally well-marked for solo hikers.',
    },
    food: [
      { dish: 'Älplermagronen', note: 'Alpine mac-and-cheese with potato, cream, and crispy onions — the mountain-hut classic.' },
      { dish: 'Rösti', note: 'Crispy grated-potato cake — Swiss-German hash brown, served with bacon or eggs.' },
      { dish: 'Berner Platte', note: 'Bernese mountain platter of sausages, smoked pork, sauerkraut, beans.' },
      { dish: 'Meringue with cream', note: 'Local meringues from nearby Meiringen, served with thick double-cream from Gruyère.' },
    ],
    transportation: {
      primary: 'Trains and cable cars cover the entire valley; the Jungfrau Travel Pass is worth it for 3+ day stays.',
      tips: 'No car needed — the valley network is one of Europe’s best; buy a half-fare card or Jungfrau Pass instead of point-to-point tickets.',
    },
    neighborhoods: [
      { name: 'Lauterbrunnen village', blurb: 'Valley floor — train station, the Staubbach Falls, base hotels.' },
      { name: 'Wengen', blurb: 'Car-free cliffside village across the valley — sun-trap balconies, ski runs in winter.' },
      { name: 'Mürren', blurb: 'Higher cliff village — Schilthorn cable car, gentler crowds, the iconic Eiger view.' },
    ],
    safety: 'Extremely safe. Real risks are alpine — stick to marked trails, check the weather, and respect the cliff edges at viewpoints.',
  },

  interlaken: {
    bestTimeToVisit: {
      months: 'June–September, December–March',
      blurb: 'Summer for hiking and lake swims; winter for skiing on Jungfrau and Eiger.',
    },
    budget: {
      budgetDailyUSD: 85,
      midDailyUSD: 200,
      luxuryDailyUSD: 480,
      blurb: 'Backpacker hostels keep budgets honest; grand-dame hotels by the casino push the luxury tier.',
    },
    travelStyles: {
      family: 'The Harder Kulm funicular for skyline views, lake boat rides, the Trümmelbach Falls day trip.',
      couples: 'A sunrise paraglide off Harder Kulm, a Lake Brienz ferry to Iseltwald, a Niederhorn cable-car evening.',
      solo: 'Adventure-sports hub draws solo travelers globally; hostels are exceptionally social.',
    },
    food: [
      { dish: 'Cheese fondue', note: 'Bernese cheese fondue with kirsch — order it at a chalet restaurant outside town.' },
      { dish: 'Älplermagronen', note: 'Alpine mac with potato, cream, and crispy onions — the mountain comfort dish.' },
      { dish: 'Raclette', note: 'Half-wheel cheese melted to order, scraped over potatoes and pickles.' },
      { dish: 'Lake fish', note: 'Local lake whitefish (Felchen) — grilled with butter and almonds.' },
    ],
    transportation: {
      primary: 'Trains link to Lauterbrunnen, Grindelwald, and Wengen; lake ferries connect Thun and Brienz.',
      tips: 'Buy the Berner Oberland Pass — covers lakes + trains + most cable cars for 3-, 4-, 6-, 8-, or 10-day stays.',
    },
    neighborhoods: [
      { name: 'Interlaken Ost', blurb: 'Eastern station — gateway to Brienz, Grindelwald, and the Jungfrau trains.' },
      { name: 'Interlaken West', blurb: 'Western station + the casino, Höhematte Park, the main hotel strip.' },
      { name: 'Unterseen', blurb: 'Old-town side along the Aare — quieter, traditional houses, riverside walks.' },
    ],
    safety: 'Very safe day and night. Adventure-sports risks (paragliding, rafting, canyoning) are real — use licensed operators.',
  },

  grindelwald: {
    bestTimeToVisit: {
      months: 'June–September, December–March',
      blurb: 'Summer hiking and via-ferrata, winter skiing on the Männlichen / Kleine Scheidegg pistes.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 220,
      luxuryDailyUSD: 520,
      blurb: 'Chalet pensions are reasonable; resort hotels with Eiger-face balconies push the luxury tier hard.',
    },
    travelStyles: {
      family: 'The Eiger Glacier walk, the First gondola + Cliff Walk + Tissot mountain swing, easy meadow trails.',
      couples: 'A Jungfraujoch (Top of Europe) day, a sunrise at the First Cliff Walk, a fondue dinner with the Eiger lit up.',
      solo: 'Hostels and pensions are good; cable-car networks make solo hiking days easy with minimal map work.',
    },
    food: [
      { dish: 'Rösti', note: 'Crispy potato cake with bacon, cheese, or eggs — the universal mountain lunch.' },
      { dish: 'Bratwurst with rösti', note: 'Veal sausage grilled simply — order at a mountain hut.' },
      { dish: 'Fondue chinoise', note: 'Hot-broth fondue with thin-sliced meat — the Christmas / New Year classic.' },
      { dish: 'Apple strudel', note: 'Thin-crust apple strudel with cinnamon and vanilla cream — a mountain-restaurant staple.' },
    ],
    transportation: {
      primary: 'Trains link to Interlaken; cable cars climb to First, Männlichen, Eigergletscher, Jungfraujoch.',
      tips: 'The Eiger Express gondola from Grindelwald Terminal to Eigergletscher cut the Jungfraujoch trip to 47 min — book the morning slot.',
    },
    neighborhoods: [
      { name: 'Grindelwald village', blurb: 'Main resort centre — hotels, restaurants, the train station and Terminal gondola.' },
      { name: 'Grund', blurb: 'Lower village below the centre — the Eiger Express gondola base, quieter chalets.' },
      { name: 'First', blurb: 'Upper alpine area reached by gondola — viewpoints, paragliding launches, trail networks.' },
    ],
    safety: 'Very safe. Mountain risks (rockfall, fast weather changes, exposure on via-ferrata) are real — respect closures.',
  },

  zermatt: {
    bestTimeToVisit: {
      months: 'July–September, December–April',
      blurb: 'Summer for hiking and Matterhorn views; winter for skiing on the Klein Matterhorn glacier.',
    },
    budget: {
      budgetDailyUSD: 110,
      midDailyUSD: 280,
      luxuryDailyUSD: 700,
      blurb: 'Hostels exist (rare for Switzerland); chalet-hotels on the upper streets push the luxury tier hard.',
    },
    travelStyles: {
      family: 'The Gornergrat cog rail for the iconic Matterhorn view, glacier paradise at 3,883 m, easy valley walks.',
      couples: 'A sunrise at Riffelsee, a candlelit fondue with the Matterhorn lit by moon, a Glacier Express day.',
      solo: 'Walkable, English-friendly, hostels in the centre; trails are exceptionally well-marked even for solo hikers.',
    },
    food: [
      { dish: 'Cheese fondue', note: 'Valais Raclette du Valais AOP fondue — the local mountain ritual.' },
      { dish: 'Raclette', note: 'Half-wheel cheese melted by the fire, scraped over potatoes — invented in Valais.' },
      { dish: 'Älplermagronen', note: 'Alpine mac-and-cheese with potato, cream, onions — the hiker’s lunch.' },
      { dish: 'Dry-cured meats', note: 'Walliser Trockenfleisch — air-dried beef, sliced thin and eaten with rye bread and pickles.' },
    ],
    transportation: {
      primary: 'Car-free village — arrive by train from Visp (the Matterhorn Gotthard Bahn); electric carts and walking inside.',
      tips: 'Park your car at Täsch and take the 12-min shuttle train; no cars allowed in Zermatt itself.',
    },
    neighborhoods: [
      { name: 'Bahnhofstrasse', blurb: 'Main street from the train station — shops, restaurants, après-ski bars.' },
      { name: 'Hinterdorf', blurb: 'Old village — 16th-century wooden barns on stilts, the historic side.' },
      { name: 'Winkelmatten', blurb: 'Quieter upper neighborhood — chalets, the chapel viewpoint, calmer evenings.' },
    ],
    safety: 'Extremely safe in town; high-altitude hiking carries real risks (sudden weather, glacier crevasses) — respect closures and guides.',
  },

  bern: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Long warm days for Aare swims; December brings Christmas markets through the arcades.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 180,
      luxuryDailyUSD: 420,
      blurb: 'Lunch buffets and student cafés keep budgets honest; arcade-front hotels push the top tier.',
    },
    travelStyles: {
      family: 'The Bear Park, Aare swims in summer, the Zytglogge clock-tower mechanism tour, the Einstein House.',
      couples: 'A Rosengarten sunset over the old-town curve, a Münster-tower climb, a Gurten funicular evening.',
      solo: 'Walkable UNESCO old town, English-friendly, hostels by the river — easy 2-day solo break.',
    },
    food: [
      { dish: 'Berner Platte', note: 'Bernese platter: sausages, smoked pork, sauerkraut, beans, potatoes — the regional classic.' },
      { dish: 'Älplermagronen', note: 'Alpine mac with potato, cream, cheese, fried onions — the canton’s comfort dish.' },
      { dish: 'Rösti', note: 'Crispy potato cake — the Swiss-German hash brown, eaten any time of day.' },
      { dish: 'Meringue with cream', note: 'Meringue with thick Gruyère double-cream — order at a tearoom.' },
    ],
    transportation: {
      primary: 'Trams and buses cover the city; the old town is walkable end to end.',
      tips: 'Get a Bern Ticket (free transit) from your hotel; the city tram pass is included with any overnight stay.',
    },
    neighborhoods: [
      { name: 'Altstadt', blurb: 'UNESCO-listed old town — six kilometres of arcades, the Zytglogge clock, the Münster.' },
      { name: 'Mattequartier', blurb: 'Riverside quarter below the cliffs — quieter, traditional bars, the Aare access.' },
      { name: 'Kirchenfeld', blurb: 'Embassy and museum side over the river — Einstein Museum, the Historical Museum.' },
    ],
    safety: 'Extremely safe day and night. Aare-swim risks (current, cold) are real — start at Marzili and exit before the Lorraine bridge.',
  },

  geneva: {
    bestTimeToVisit: {
      months: 'May–September',
      blurb: 'Lakeside terrace season; September has the cleanest air and Mont Blanc views.',
    },
    budget: {
      budgetDailyUSD: 95,
      midDailyUSD: 220,
      luxuryDailyUSD: 520,
      blurb: 'Everything in Switzerland is expensive; lake-view hotels and Michelin tasting menus push the top hard.',
    },
    travelStyles: {
      family: 'A Jet d’Eau viewpoint photo, the Mouettes Genevoises lake taxis, the Bains des Pâquis lake baths.',
      couples: 'A sunset at the Bains des Pâquis, a fondue under the old-town arcades, a Mont Salève cable-car evening.',
      solo: 'English-friendly, walkable centre, easy day trips to Annecy / Lausanne / Chamonix by train or bus.',
    },
    food: [
      { dish: 'Fondue moitié-moitié', note: 'Half Gruyère, half Vacherin — the Swiss-Romand fondue ratio.' },
      { dish: 'Filets de perche', note: 'Fried lake-perch fillets with lemon and tartar — order at a lakefront restaurant.' },
      { dish: 'Longeole', note: 'Pork sausage spiced with fennel — a Geneva regional classic, served with lentils or potato.' },
      { dish: 'Chocolat', note: 'Geneva has more chocolatiers per square mile than anywhere — Auer, Du Rhône, Stettler.' },
    ],
    transportation: {
      primary: 'Trams, buses, Mouettes lake taxis cover the city; Geneva Airport has free transit cards.',
      tips: 'Your hotel gives you a free Geneva Transport Card — covers all transit including the Mouettes.',
    },
    neighborhoods: [
      { name: 'Vieille Ville', blurb: 'Old town on the hill — cathedral, arcaded squares, antique shops, historic restaurants.' },
      { name: 'Pâquis', blurb: 'Lakefront multicultural quarter — restaurants, late bars, the lake baths.' },
      { name: 'Carouge', blurb: 'Sardinian-built quarter across the river — boutiques, Saturday market, artists studios.' },
    ],
    safety: 'Very safe overall. Pickpockets work the train station; otherwise low risk day and night.',
  },

  basel: {
    bestTimeToVisit: {
      months: 'May–September',
      blurb: 'Long summer days for Rhine swims; June brings Art Basel + perfect weather.',
    },
    budget: {
      budgetDailyUSD: 90,
      midDailyUSD: 200,
      luxuryDailyUSD: 480,
      blurb: 'Art-fair week (June) triples hotel rates; otherwise reasonable for Switzerland.',
    },
    travelStyles: {
      family: 'The Basel Zoo (one of Europe’s oldest), the Cartoon Museum, Rhine ferries pulled by river current alone.',
      couples: 'A Münster terrace sunset, a Beyeler Foundation art day, a Rhine swim with a Wickelfisch float.',
      solo: 'Compact, walkable, English-friendly, an exceptional museum scene for solo days.',
    },
    food: [
      { dish: 'Basler Läckerli', note: 'Hard honey-spice cookies — Basel’s signature sweet, eaten with coffee.' },
      { dish: 'Mehlsuppe', note: 'Roasted-flour soup — Basel Fasnacht specialty, served at 4 a.m. during carnival.' },
      { dish: 'Cheese fondue', note: 'Swiss fondue everywhere, but Basel pairs it with regional Riesling-Silvaner.' },
      { dish: 'Käsewähe', note: 'Cheese-and-cream tart — a regional savory pie, eaten as a lunch slice.' },
    ],
    transportation: {
      primary: 'Trams cover everything; the Rhine ferries cross north-south for a small fare.',
      tips: 'Your hotel gives you a free BaselCard — covers transit, museum discounts, and a free WiFi.',
    },
    neighborhoods: [
      { name: 'Altstadt Grossbasel', blurb: 'Old town on the south bank — Münster, market square, the main shopping streets.' },
      { name: 'Kleinbasel', blurb: 'North bank — riverside bars, the Tinguely Museum, more relaxed evenings.' },
      { name: 'St Alban', blurb: 'Quieter historic quarter — the paper museum, medieval wooden bridge, the canal.' },
    ],
    safety: 'Very safe day and night. The Rhine current is strong — swim only with a Wickelfisch float for buoyancy and bag.',
  },

  'st-moritz': {
    bestTimeToVisit: {
      months: 'December–April, July–September',
      blurb: 'Winter for skiing and the iconic frozen lake; summer for high-alpine hiking and lake afternoons.',
    },
    budget: {
      budgetDailyUSD: 120,
      midDailyUSD: 320,
      luxuryDailyUSD: 850,
      blurb: 'Europe’s glitziest ski resort — hotels start expensive and climb sharply through Christmas–New Year.',
    },
    travelStyles: {
      family: 'The Glacier Express terminal experience, lake walks, the Diavolezza glacier cable car for high-altitude views.',
      couples: 'A Glacier Express day from Zermatt, a Badrutt’s Palace tea, a sunrise on the frozen lake in February.',
      solo: 'Less obvious for solo travelers; the ski / Glacier Express tour scene is family + couples heavy.',
    },
    food: [
      { dish: 'Bündner Nusstorte', note: 'Caramel-nut tart from the Engadine — order at a konditorei to take home.' },
      { dish: 'Capuns', note: 'Chard-wrapped meat-and-flour dumplings in cream sauce — the Graubünden mountain classic.' },
      { dish: 'Pizzoccheri', note: 'Buckwheat pasta with cabbage, potato, mountain cheese — Lombard / Engadine border dish.' },
      { dish: 'Maluns', note: 'Fried grated potatoes with applesauce and alpine cheese — Graubünden farmer breakfast.' },
    ],
    transportation: {
      primary: 'The Glacier Express + Bernina Express terminate here; buses and cable cars cover the resort.',
      tips: 'Take the Bernina Express south to Tirano for a UNESCO-listed scenic train day; year-round.',
    },
    neighborhoods: [
      { name: 'St. Moritz Dorf', blurb: 'Upper village — the iconic five-star hotels, boutiques, the main square.' },
      { name: 'St. Moritz Bad', blurb: 'Lower lakeside neighborhood — the thermal baths, lake walks, more affordable hotels.' },
      { name: 'Suvretta', blurb: 'Forested upper plateau — the Suvretta House hotel, ski-in/ski-out chalets.' },
    ],
    safety: 'Extremely safe. Alpine risks (avalanches off-piste in winter, altitude sickness above 3,000 m) are real — respect closures.',
  },

  lugano: {
    bestTimeToVisit: {
      months: 'April–October',
      blurb: 'Italian-Swiss climate stays mild from spring through autumn; July–August can be hot.',
    },
    budget: {
      budgetDailyUSD: 80,
      midDailyUSD: 180,
      luxuryDailyUSD: 420,
      blurb: 'B&Bs in the hills are reasonable; lake-view hotels in the centre push the top tier.',
    },
    travelStyles: {
      family: 'The Splash & Spa Tamaro water park, Swissminiatur (every Swiss landmark to scale), lake boat rides.',
      couples: 'A Monte Brè funicular at sunset, a private lake-boat day, a Bellinzona castles excursion.',
      solo: 'Walkable, English-friendly, easy train links to Como and Milan for solo day trips across the border.',
    },
    food: [
      { dish: 'Polenta', note: 'Soft polenta with brasato or wild mushrooms — Ticino mountain comfort dish.' },
      { dish: 'Risotto ai funghi', note: 'Wild-mushroom risotto — Ticino has Italian cooking with Swiss precision.' },
      { dish: 'Luganighe', note: 'Local pork sausage — grilled and served with polenta and saffron.' },
      { dish: 'Gelato', note: 'Italian-style gelato — Lugano has more gelateria per capita than anywhere in Switzerland.' },
    ],
    transportation: {
      primary: 'Walk the lakeside centre; funiculars to Monte Brè and San Salvatore; trains to Bellinzona and Milan.',
      tips: 'Your hotel gives you the Ticino Ticket — free transit including funiculars throughout Ticino.',
    },
    neighborhoods: [
      { name: 'Centro', blurb: 'Lakeside historic centre — Piazza della Riforma, arcaded shopping, restaurants.' },
      { name: 'Paradiso', blurb: 'Quieter lakefront south — the San Salvatore funicular base, family-friendly beaches.' },
      { name: 'Castagnola', blurb: 'Quiet residential east — the Heleneum villa museum, hillside chalets, slower pace.' },
    ],
    safety: 'Very safe day and night. Lake swim risks (cold layers below the surface) are real even in midsummer.',
  },

  montreux: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Lake-Geneva riviera in spring/summer; December brings Christmas markets and the Montreux Noël.',
    },
    budget: {
      budgetDailyUSD: 95,
      midDailyUSD: 220,
      luxuryDailyUSD: 520,
      blurb: 'July (Jazz Festival) doubles hotel rates; January-March is quiet and affordable.',
    },
    travelStyles: {
      family: 'The Chillon castle, the Rochers-de-Naye cog rail to the marmots, a CGN steamer to Lausanne.',
      couples: 'A Lavaux vineyard wine evening, a Chillon castle visit at dusk, the Queen statue + Freddie Mercury studio.',
      solo: 'Walkable promenade, English-friendly hotels, easy train to Lausanne for the museum scene.',
    },
    food: [
      { dish: 'Filets de perche', note: 'Fried lake-perch fillets with lemon — the Lake-Geneva classic.' },
      { dish: 'Fondue moitié-moitié', note: 'Half Gruyère, half Vacherin Fribourgeois — the Romand fondue ratio.' },
      { dish: 'Papet vaudois', note: 'Leeks and potatoes stewed with cream and white wine, served with sausage.' },
      { dish: 'Lavaux Chasselas', note: 'Light white wine from the UNESCO-listed terraced vineyards just east of town.' },
    ],
    transportation: {
      primary: 'The lakefront train hugs the shore east-west; CGN paddle steamers cross the lake to France.',
      tips: 'Your hotel gives you the Riviera Card — free transit on bus, train, and funiculars in the Riviera area.',
    },
    neighborhoods: [
      { name: 'Centre', blurb: 'Lakefront promenade — casino, market square, the main hotel strip.' },
      { name: 'Clarens', blurb: 'Quieter east side — the Chillon castle within walking distance, lakeside parks.' },
      { name: 'Glion / Caux', blurb: 'Hill suburbs above town — the cog rail to Rochers-de-Naye, mountain hotels.' },
    ],
    safety: 'Extremely safe day and night. Lake swims are calmer than Geneva’s but the water stays cold below 4 m year-round.',
  },

  pattaya: {
    bestTimeToVisit: {
      months: 'November–February',
      blurb: 'Cool dry months with calm Gulf of Siam waters; March–May is hot, monsoon hits June–October.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 90,
      luxuryDailyUSD: 280,
      blurb: 'Beach guesthouses are dirt cheap; resort hotels on the Jomtien side and Wong Amat push the top tier.',
    },
    travelStyles: {
      family: 'Koh Larn ferry to clear-water beaches, the Cartoon Network water park, the Nong Nooch tropical garden.',
      couples: 'A Jomtien beach sunset, an island-hopping speedboat day, the Sanctuary of Truth at dusk.',
      solo: 'English-friendly and easy; hostels in Pattaya and Jomtien are sociable, dive shops welcome new divers.',
    },
    food: [
      { dish: 'Tom yum goong', note: 'Spicy-sour shrimp soup with lemongrass — the Thai staple, everywhere.' },
      { dish: 'Pad thai', note: 'Stir-fried noodles with shrimp, peanut, lime — order at a beach-strip stall.' },
      { dish: 'Som tam', note: 'Spicy green-papaya salad pounded to order — the Isaan classic.' },
      { dish: 'Grilled seafood', note: 'Beachside BBQs grill the day’s catch — pick the fish, weigh it, eat with chili-lime sauce.' },
    ],
    transportation: {
      primary: 'Songthaews (pickup taxis) run fixed routes for ~10 baht; Grab is universal for longer rides.',
      tips: 'Negotiate longtail boat fares to Koh Larn ahead of time at the Bali Hai pier; round-trip is honest.',
    },
    neighborhoods: [
      { name: 'Pattaya Beach', blurb: 'Main strip — hotels, restaurants, the Walking Street nightlife district.' },
      { name: 'Jomtien', blurb: 'Quieter beach south of Pattaya — family hotels, calmer water, beach umbrellas.' },
      { name: 'Wong Amat', blurb: 'Upmarket beach north — resort hotels, more relaxed pace, fewer crowds.' },
    ],
    safety: 'Generally safe in tourist areas; watch for scam jet-ski rentals (forced damage claims) and stay out of bar disputes after midnight.',
  },

  'luang-prabang': {
    bestTimeToVisit: {
      months: 'November–February',
      blurb: 'Dry, cool, riverboat-friendly months; March–May is hazy from agricultural burning, June–October monsoon.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 95,
      luxuryDailyUSD: 300,
      blurb: 'Riverside guesthouses are cheap; restored colonial hotels in the old town push the top tier.',
    },
    travelStyles: {
      family: 'Kuang Si waterfall day, elephant sanctuary visit, the Royal Palace museum, evening market browsing.',
      couples: 'A sunrise alms-giving (respectful and quiet), a Mekong sunset cruise, a private cooking class.',
      solo: 'Hostels in the old town are sociable; bike rentals open up the temple circuit; English is widely spoken.',
    },
    food: [
      { dish: 'Laap (larb)', note: 'Minced meat salad with herbs, chili, toasted rice — the Laotian national dish.' },
      { dish: 'Khao soi (Laotian)', note: 'Noodle soup with pork, fermented soybean, herbs — distinct from the Thai version.' },
      { dish: 'Or lam', note: 'Slow-braised buffalo stew with eggplant and chili — Luang Prabang signature.' },
      { dish: 'Sticky rice', note: 'Eaten by hand from a bamboo basket — the universal accompaniment.' },
    ],
    transportation: {
      primary: 'Bicycles and tuk-tuks cover the small old town; longtail boats reach Pak Ou caves and Kuang Si.',
      tips: 'Buy slow-boat tickets to Pakbeng from a travel agent — saves time and saves the morning hassle at the pier.',
    },
    neighborhoods: [
      { name: 'Old Town peninsula', blurb: 'UNESCO core — temples, the Royal Palace, the night market, riverside cafés.' },
      { name: 'Phou Si Hill', blurb: 'Central hill with the sunset chedi — 355 steps to the top for golden-hour views.' },
      { name: 'Ban Phanom', blurb: 'Weaving village east of town — silk handicrafts, quieter accommodation.' },
    ],
    safety: 'Very safe day and night. The biggest risks are tuk-tuk overcharging and dehydration on long temple-circuit days.',
  },

  wengen: {
    bestTimeToVisit: {
      months: 'June–September, December–March',
      blurb: 'Summer hiking and meadow flowers; January Lauberhorn ski race + powder.',
    },
    budget: {
      budgetDailyUSD: 95,
      midDailyUSD: 230,
      luxuryDailyUSD: 550,
      blurb: 'Reachable only by train (car-free); luxury cliff-edge hotels with Jungfrau views push the top tier hard.',
    },
    travelStyles: {
      family: 'The Männlichen gondola from town, gentle meadow trails, the Männlichen panorama walk to Kleine Scheidegg.',
      couples: 'A sunset on the Männlichen ridge, a Jungfraujoch day, a fondue with the Eiger trio lit by moon.',
      solo: 'Quieter than Mürren; pensions are family-run and welcoming; the trail network rewards solo hikers.',
    },
    food: [
      { dish: 'Cheese fondue', note: 'Bernese moitié-moitié fondue — order at a chalet restaurant after a day on the trails.' },
      { dish: 'Älplermagronen', note: 'Alpine mac with potato, cream, fried onions — the mountain-hut lunch staple.' },
      { dish: 'Bratwurst with rösti', note: 'Veal sausage with crispy grated potato — grilled at a mountain hut.' },
      { dish: 'Meringue with cream', note: 'Crisp meringue with thick Gruyère double-cream — order at the tearoom.' },
    ],
    transportation: {
      primary: 'Train-only access from Lauterbrunnen; gondolas to Männlichen; trains continue to Kleine Scheidegg and Jungfraujoch.',
      tips: 'Park your car in Lauterbrunnen — the train up to Wengen takes 14 minutes and runs every 30.',
    },
    neighborhoods: [
      { name: 'Wengen village', blurb: 'Main pedestrian street — hotels, restaurants, the train station, the chapel.' },
      { name: 'Bühl', blurb: 'Lower-village area near the gondola base — quieter chalets, longer walks to the centre.' },
      { name: 'Allmend', blurb: 'Meadow plateau above town — alpine farms, mountain inns, the first stretch of the Männlichen trail.' },
    ],
    safety: 'Extremely safe. Alpine risks (sudden weather, exposure on the panorama trail) are real — check the weather and respect closures.',
  },

  murren: {
    bestTimeToVisit: {
      months: 'June–September, December–March',
      blurb: 'Summer high-trail season (no fog from below); winter for the Schilthorn glacier skiing and Bond-film vibes.',
    },
    budget: {
      budgetDailyUSD: 95,
      midDailyUSD: 230,
      luxuryDailyUSD: 580,
      blurb: 'Reachable only by cable car or train; hotel rates climb with the altitude.',
    },
    travelStyles: {
      family: 'The Schilthorn revolving restaurant (007 Walk of Fame), the Tschingelhütte hike, easy panorama walks.',
      couples: 'A Birg sky-walk with the Eiger trio in front of you, a fondue with the cloud line below your window.',
      solo: 'Quiet, walkable, and the Schilthorn trail network is so well-marked solo hikers don’t need a map past the first kilometre.',
    },
    food: [
      { dish: 'Käseschnitte', note: 'Hot cheese on toasted bread, sometimes with a fried egg — the lunch-hut warmup.' },
      { dish: 'Älplermagronen', note: 'Alpine mac with potato, cream, fried onions — the universal mountain dish.' },
      { dish: 'Berner Platte', note: 'Bernese meat platter with sausages, sauerkraut, beans — Sunday roast variant.' },
      { dish: 'Cheese fondue', note: 'Moitié-moitié fondue with kirsch — the after-hike ritual.' },
    ],
    transportation: {
      primary: 'Reach via Schilthornbahn (Stechelberg → Gimmelwald → Mürren) or train (Lauterbrunnen → Grütschalp → Mürren).',
      tips: 'The two routes meet in Mürren — buy a Jungfrau Pass for unlimited travel across the Bernese Oberland network.',
    },
    neighborhoods: [
      { name: 'Mürren village', blurb: 'Car-free main street — hotels, restaurants, the chapel, the Schilthorn cable-car base.' },
      { name: 'Allmendhubel', blurb: 'Upper plateau reached by a tiny funicular — the panorama trail starts here.' },
      { name: 'Gimmelwald', blurb: 'Smaller village below Mürren — farms, hostels, the “most authentic” Swiss Alps moment.' },
    ],
    safety: 'Extremely safe. Mountain risks (rockfall, sudden weather, exposure on the Schilthorn ridge) are real — respect closures.',
  },

  hallstatt: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Long alpine days for the lake; December brings small Christmas markets and snowy lake reflections.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 380,
      blurb: 'Lake-view hotels are limited and expensive; nearby Obertraun and Bad Goisern are cheaper bases.',
    },
    travelStyles: {
      family: 'The Salzwelten salt mine tour (the world’s oldest), the lake-walk to Obertraun, the Dachstein ice caves.',
      couples: 'A sunrise from the Marketplace dock, a Skywalk viewing platform photo, an evening boat ride on the lake.',
      solo: 'Pensions in Obertraun across the lake are budget-friendly; the lake-walk + train system makes solo days easy.',
    },
    food: [
      { dish: 'Wiener Schnitzel', note: 'Pounded veal breaded and fried — the universal Austrian lunch.' },
      { dish: 'Reinanke', note: 'Lake whitefish (alpine char) grilled simply — the Hallstatt classic.' },
      { dish: 'Kaiserschmarrn', note: 'Torn pancake with raisins and powdered sugar — Austrian dessert tradition.' },
      { dish: 'Apfelstrudel', note: 'Thin-pastry apple strudel — order with vanilla sauce at a lakeside konditorei.' },
    ],
    transportation: {
      primary: 'Train + ferry combo: trains stop on the east shore, ferry shuttles to the village dock.',
      tips: 'Day-tripper crowds peak 11am–3pm — stay overnight and you get the village to yourself before 9 and after 5.',
    },
    neighborhoods: [
      { name: 'Marketplace', blurb: 'Postcard village core — pastel houses, the Lutheran church, lake-edge cafés.' },
      { name: 'Hallstatt Lahn', blurb: 'South end — the cemetery, the bone-house chapel, quieter lake walks.' },
      { name: 'Salzberg', blurb: 'Mountain plateau above the village — funicular ride, salt mine, Skywalk viewpoint.' },
    ],
    safety: 'Extremely safe. Real hazards are slippery cobbles in rain, cold lake water year-round, and overcrowded day-tripper traffic on the single road.',
  },

  innsbruck: {
    bestTimeToVisit: {
      months: 'December–March, June–September',
      blurb: 'Winter for skiing direct from the city centre; summer for via-ferrata and alpine hiking.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 170,
      luxuryDailyUSD: 400,
      blurb: 'Family-run pensions stay reasonable; Olympic-era hotels with valley views push the top tier.',
    },
    travelStyles: {
      family: 'The Nordkette cable car from downtown, the Bergisel ski-jump tower, the Swarovski Crystal Worlds nearby.',
      couples: 'A sunrise gondola to Hafelekar, a baroque-quarter dinner, a Stubai Glacier day trip.',
      solo: 'Compact, walkable, hostels in the old town; the cable-car-from-downtown design makes solo mountain days seamless.',
    },
    food: [
      { dish: 'Tiroler Gröstl', note: 'Pan-fried potatoes with bacon, onion, and a fried egg — Tyrolean breakfast classic.' },
      { dish: 'Käsespätzle', note: 'Egg-noodle dumplings baked with cheese and crispy onions — alpine comfort food.' },
      { dish: 'Wiener Schnitzel', note: 'The Austrian classic — pounded veal, breaded, pan-fried with lemon.' },
      { dish: 'Kaiserschmarrn', note: 'Sweet torn pancake with raisins and plum compote — Habsburg-era dessert tradition.' },
    ],
    transportation: {
      primary: 'Trams cover the city; the Nordkettenbahnen cable car runs from Congress directly to the alpine ridge.',
      tips: 'Buy the Innsbruck Card from your hotel — includes the cable cars, museums, and a Bergisel visit for ~€48 (24h).',
    },
    neighborhoods: [
      { name: 'Altstadt', blurb: 'Medieval old town — Golden Roof, Maria-Theresien-Strasse, the Hofkirche.' },
      { name: 'Wilten', blurb: 'Quieter southern district — baroque basilica, residential cafés, less tourist traffic.' },
      { name: 'Hungerburg', blurb: 'Plateau reached by the Hungerburgbahn funicular — chalet hotels, alpine trail starts.' },
    ],
    safety: 'Very safe day and night. Real hazards are off-piste skiing risks and altitude on Nordkette walks.',
  },

  strasbourg: {
    bestTimeToVisit: {
      months: 'May–September, December',
      blurb: 'Long summer evenings on the canals; December brings the iconic Christkindelsmärik (Christmas markets).',
    },
    budget: {
      budgetDailyUSD: 75,
      midDailyUSD: 170,
      luxuryDailyUSD: 400,
      blurb: 'B&Bs and pensions in Petite France are reasonable; cathedral-view hotels push the top tier.',
    },
    travelStyles: {
      family: 'Boat ride through the canals, the Cathedral astronomical clock at noon, the Vaisseau science museum.',
      couples: 'A flammkuchen dinner in a winstub, a sunset from the Barrage Vauban, an Alsatian wine-route day trip.',
      solo: 'English-friendly thanks to the EU institutions; walkable centre, hostels by the train station; easy bike rentals.',
    },
    food: [
      { dish: 'Choucroute garnie', note: 'Sauerkraut with sausages, pork, and potatoes — the Alsace winter classic.' },
      { dish: 'Tarte flambée', note: 'Thin-crust pizza-like flatbread with crème fraîche, onions, bacon — eaten with hands.' },
      { dish: 'Baeckeoffe', note: 'Slow-baked casserole of three meats marinated in Riesling — Sunday lunch tradition.' },
      { dish: 'Kougelhopf', note: 'Spiral-mould Alsatian brioche with almonds and raisins — eaten at breakfast.' },
    ],
    transportation: {
      primary: 'Trams and buses cover the centre; TGV from Paris reaches Strasbourg in 1h 46.',
      tips: 'Rent a bicycle from Vélhop — Strasbourg is the most bike-friendly city in France, with 600 km of bike paths.',
    },
    neighborhoods: [
      { name: 'Petite France', blurb: 'Half-timbered canal district — the Insta-iconic Strasbourg you came for.' },
      { name: 'Cathedral Quarter', blurb: 'Centre around Notre-Dame — the astronomical clock, restaurants, shopping.' },
      { name: 'Krutenau', blurb: 'Hip student quarter — indie bars, restaurants, the European Parliament across the canal.' },
    ],
    safety: 'Very safe overall. Pickpockets work the Christmas-market crowds and the train station — keep cards in front pockets.',
  },

  antwerp: {
    bestTimeToVisit: {
      months: 'April–October',
      blurb: 'Mild and bright shoulder seasons; July–August fashion-tourism crowds but Belgian summers are quiet.',
    },
    budget: {
      budgetDailyUSD: 75,
      midDailyUSD: 170,
      luxuryDailyUSD: 400,
      blurb: 'Reasonable for Western Europe; designer-district boutique hotels push the top tier.',
    },
    travelStyles: {
      family: 'Antwerp Zoo (one of Europe’s oldest), the chocolate museum, a Schelde river ferry.',
      couples: 'A Rubens House visit, a fashion-district shopping afternoon, a beer tasting at De Koninck.',
      solo: 'Walkable centre, English-friendly thanks to the diamond trade; the cathedral district is hostel-friendly.',
    },
    food: [
      { dish: 'Moules-frites', note: 'Mussels in white wine or beer with frites — the Belgian classic.' },
      { dish: 'Stoofvlees', note: 'Beef and beer stew, slow-cooked, served with frites — Flemish comfort food.' },
      { dish: 'Frites', note: 'Twice-fried Belgian frites with andalouse or samurai sauce — the proper way.' },
      { dish: 'Bolleke (De Koninck beer)', note: 'Antwerp’s signature amber ale, served in a bell glass — order at a brown café.' },
    ],
    transportation: {
      primary: 'Trams + the De Lijn bus network; the historic centre is fully walkable.',
      tips: 'Antwerp-Central is one of the world’s most beautiful train stations — pass through it even if you’re not catching a train.',
    },
    neighborhoods: [
      { name: 'Old Town', blurb: 'Medieval centre — Grote Markt, the cathedral, the historic guildhouses.' },
      { name: 'Diamond District', blurb: 'Tight quarter behind the station — diamond shops, kosher restaurants, Orthodox community.' },
      { name: 'Het Zuid', blurb: 'Hip south side — fashion boutiques, restaurants, the contemporary-art museum.' },
    ],
    safety: 'Very safe day and night. Watch valuables near the Diamond District and Antwerp-Central station; otherwise low risk.',
  },

  charleston: {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild and humid-light shoulder months; June–August is hot and storm-prone.',
    },
    budget: {
      budgetDailyUSD: 95,
      midDailyUSD: 230,
      luxuryDailyUSD: 550,
      blurb: 'Historic inns are pricey year-round; ranking #1 US destination keeps demand high.',
    },
    travelStyles: {
      family: 'A horse-drawn carriage tour, the South Carolina Aquarium, beach days at Sullivan’s Island.',
      couples: 'A Battery Park stroll, a Husk dinner, a Magnolia Plantation morning, a Spoleto-season concert.',
      solo: 'Walkable historic centre, English-only, harbor walks; King Street brunches are solo-friendly.',
    },
    food: [
      { dish: 'Shrimp and grits', note: 'Stone-ground grits with shrimp, sausage, and pepper — the Low-Country classic.' },
      { dish: 'She-crab soup', note: 'Cream-based crab soup with sherry — Charleston signature.' },
      { dish: 'Boiled peanuts', note: 'Salt-brined raw peanuts boiled to softness — Carolina roadside staple.' },
      { dish: 'Hoppin’ John', note: 'Black-eyed peas with rice and bacon — Low-Country New Year’s good-luck dish.' },
    ],
    transportation: {
      primary: 'Walk the historic centre; CARTA buses and DASH shuttles cover King Street to the harbor.',
      tips: 'Most parking is metered downtown — use the Liberty Square garage for full-day visits.',
    },
    neighborhoods: [
      { name: 'South of Broad', blurb: 'Most historic streets — Rainbow Row, Battery Park, antebellum mansions.' },
      { name: 'King Street', blurb: 'Main shopping + restaurant strip — boutiques, cocktail bars, gallery openings.' },
      { name: 'Sullivan’s Island', blurb: '20-min drive across the harbor — beaches, fort, low-key seafood shacks.' },
    ],
    safety: 'Very safe in the historic district. Be aware of strong currents at Sullivan’s Island in spring tides.',
  },

  savannah: {
    bestTimeToVisit: {
      months: 'March–May, October–November',
      blurb: 'Comfortable shoulder months without summer humidity; April’s azaleas bloom in every square.',
    },
    budget: {
      budgetDailyUSD: 85,
      midDailyUSD: 200,
      luxuryDailyUSD: 480,
      blurb: 'Boutique inns in the historic district push the top tier; chain hotels stay reasonable.',
    },
    travelStyles: {
      family: 'Forsyth Park playground, the Pirate House restaurant, a riverboat sightseeing cruise.',
      couples: 'An evening square-walk in moonlight, a Mrs. Wilkes dining-room lunch, a Bonaventure Cemetery afternoon.',
      solo: 'Walkable historic centre, ghost-tour scene welcomes solo travelers, the SCAD art-school energy.',
    },
    food: [
      { dish: 'Shrimp and grits', note: 'Same Low-Country classic as Charleston — Mrs. Wilkes does the best version in town.' },
      { dish: 'Fried green tomatoes', note: 'Cornmeal-crusted tomato slices, fried — a Southern starter.' },
      { dish: 'Praline', note: 'Pecan-sugar candy — Leopold’s and River Street Sweets are the iconic stops.' },
      { dish: 'Sweet tea', note: 'Black tea brewed sweet — the universal Southern beverage, free refills.' },
    ],
    transportation: {
      primary: 'Walk the historic squares; free DOT shuttles and pedicabs cover longer trips.',
      tips: 'You can carry an open-container drink in the historic district — Savannah is one of the few US cities with this rule.',
    },
    neighborhoods: [
      { name: 'Historic District', blurb: 'Squares grid — Spanish moss, antebellum mansions, the Cathedral of St. John.' },
      { name: 'River Street', blurb: 'Cobblestone waterfront — restaurants, river-cruise dock, candy shops.' },
      { name: 'Starland', blurb: 'Hip south district — coffee shops, breweries, the SCAD art scene.' },
    ],
    safety: 'Very safe in the historic district by day; some east-side neighborhoods feel rough after dark — stay near the squares.',
  },

  denver: {
    bestTimeToVisit: {
      months: 'May–October, December–March',
      blurb: 'Spring + autumn for hiking; winter for ski-resort day-trips to Vail and Aspen.',
    },
    budget: {
      budgetDailyUSD: 85,
      midDailyUSD: 200,
      luxuryDailyUSD: 480,
      blurb: 'Reasonable mid-range hotels in LoDo; ski-week weekends push the top tier.',
    },
    travelStyles: {
      family: 'Denver Zoo, the Museum of Nature and Science, a Red Rocks evening concert under the stars.',
      couples: 'A Red Rocks sunrise hike, a Larimer Square dinner, a Rocky Mountain National Park day.',
      solo: 'Walkable LoDo, RTD light rail to airport, brewery-crawl culture welcomes solo travelers.',
    },
    food: [
      { dish: 'Green chile (Colorado-style)', note: 'Pork stewed with Pueblo green chilies — over burritos or as a soup.' },
      { dish: 'Bison burger', note: 'Lean ground bison from local ranches — Buckhorn Exchange does the historic version.' },
      { dish: 'Rocky Mountain oysters', note: 'Battered bull testicles — Western frontier specialty, divisive but iconic.' },
      { dish: 'Craft beer', note: 'Denver has more craft breweries per capita than any major US city — Great Divide for the IPAs.' },
    ],
    transportation: {
      primary: 'RTD light rail covers the city and reaches DIA airport; rideshare for the suburbs and mountain trailheads.',
      tips: 'Acclimatize a day at 5,280 ft before driving to Vail / Aspen — altitude sickness hits fast.',
    },
    neighborhoods: [
      { name: 'LoDo', blurb: 'Historic downtown — Union Station, Larimer Square, the central restaurant scene.' },
      { name: 'RiNo', blurb: 'River North arts district — murals, breweries, food halls, the hippest blocks.' },
      { name: 'Capitol Hill', blurb: 'Residential side east of downtown — coffee shops, dive bars, Cheesman Park.' },
    ],
    safety: 'Generally safe in tourist neighborhoods. Watch for altitude headaches; downtown homelessness has uptick near Civic Center after dark.',
  },

  'san-diego': {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild dry shoulder months; summer is famously foggy (June Gloom) along the coast.',
    },
    budget: {
      budgetDailyUSD: 95,
      midDailyUSD: 230,
      luxuryDailyUSD: 550,
      blurb: 'Beach motels stay reasonable; Coronado Hotel Del and La Jolla resorts push the top tier.',
    },
    travelStyles: {
      family: 'The San Diego Zoo, USS Midway carrier museum, LEGOLAND day trip, Coronado beach.',
      couples: 'A La Jolla cove kayak with sea lions, a Sunset Cliffs evening, a Coronado Hotel Del veranda dinner.',
      solo: 'Hostels in Pacific Beach are sociable; the beach-and-surf culture welcomes solo travelers naturally.',
    },
    food: [
      { dish: 'Fish tacos', note: 'Battered or grilled white fish in corn tortillas — Baja-California style, born in San Diego.' },
      { dish: 'California burrito', note: 'Carne asada burrito with French fries inside — San Diego invented it.' },
      { dish: 'Tijuana-style street tacos', note: 'Cross-border tradition — al pastor or carnitas in corn tortillas.' },
      { dish: 'Craft beer', note: 'San Diego is the West Coast IPA capital — Stone Brewing, Ballast Point, Modern Times.' },
    ],
    transportation: {
      primary: 'MTS trolley covers the city centre and Tijuana border; rideshare for the beaches and La Jolla.',
      tips: 'The trolley to Old Town transfers to Coaster trains for an easy beach-town day trip to Carlsbad.',
    },
    neighborhoods: [
      { name: 'Gaslamp Quarter', blurb: 'Downtown nightlife district — restaurants, bars, the Petco Park stadium.' },
      { name: 'La Jolla', blurb: 'Coastal neighborhood north — cove kayaking, sea lions, boutique shopping.' },
      { name: 'Coronado', blurb: 'Beach peninsula across the bay — Hotel Del, white sand, family-friendly calm.' },
    ],
    safety: 'Very safe in tourist neighborhoods. Watch for rip currents at the beaches and use rideshare from downtown bars after midnight.',
  },

  whistler: {
    bestTimeToVisit: {
      months: 'December–April, June–September',
      blurb: 'Winter is peak ski season; summer for hiking, mountain biking, the Peak-2-Peak gondola.',
    },
    budget: {
      budgetDailyUSD: 100,
      midDailyUSD: 260,
      luxuryDailyUSD: 650,
      blurb: 'Ski-in/ski-out hotels in Whistler Village peak at New Year and Chinese New Year.',
    },
    travelStyles: {
      family: 'The Peak-2-Peak gondola, the Whistler Sliding Centre tobogganing, summer trail walks at Lost Lake.',
      couples: 'A Bearfoot Bistro tasting menu, a Scandinave Spa thermal afternoon, a Garibaldi Lake hike.',
      solo: 'Backpacker hostels in the village are dense and sociable; ski-rental shops are open until 9pm.',
    },
    food: [
      { dish: 'Poutine', note: 'Fries, cheese curds, brown gravy — Canadian comfort food, every restaurant has a version.' },
      { dish: 'Pacific salmon', note: 'Wild BC salmon from the Fraser River — grilled, smoked, or in a chowder.' },
      { dish: 'Maple-glazed back bacon', note: 'Canadian breakfast staple — thick-cut peameal back bacon with maple syrup.' },
      { dish: 'BeaverTails', note: 'Flat fried dough with cinnamon-sugar or chocolate — the après-ski sweet.' },
    ],
    transportation: {
      primary: 'Free village transit + paid Whistler Transit System for outlying areas.',
      tips: 'The Sea-to-Sky Highway from Vancouver is famously scenic — drive yourself if you can rather than taking the bus.',
    },
    neighborhoods: [
      { name: 'Whistler Village', blurb: 'Main pedestrian village — hotels, lifts, the most restaurants, après-ski bars.' },
      { name: 'Upper Village', blurb: 'East side near Blackcomb base — Fairmont Chateau, quieter slope access.' },
      { name: 'Creekside', blurb: 'South-end village near the original 1965 lift — locals’ corner, cheaper food.' },
    ],
    safety: 'Very safe. Real risks are off-piste avalanches in winter, bear encounters on summer trails (carry bear spray), and altitude.',
  },

  santiago: {
    bestTimeToVisit: {
      months: 'October–April',
      blurb: 'Southern-hemisphere summer warmth, sunny dry days; winter (June–August) is rainy and grey.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 140,
      luxuryDailyUSD: 380,
      blurb: 'Excellent value across all tiers — even Vitacura boutique hotels run reasonable by global standards.',
    },
    travelStyles: {
      family: 'The Cerro San Cristóbal funicular, the Plaza de Armas, a vineyard day trip to Maipo Valley.',
      couples: 'A Concha y Toro sunset wine tour, a Mercado Central seafood lunch, a Valparaíso colorful-port day trip.',
      solo: 'Hostels in Bellavista and Lastarria are sociable; Spanish helpful but English in tourist areas; safe metro.',
    },
    food: [
      { dish: 'Empanada de pino', note: 'Beef-onion-raisin-olive-egg-filled baked pastry — Chilean staple, eaten at every fonda.' },
      { dish: 'Pastel de choclo', note: 'Layered ground beef, chicken, raisin, olive baked under sweet corn purée.' },
      { dish: 'Curanto', note: 'Seafood + meat + potato + dumpling stew from Chiloé — best at a Chilote restaurant.' },
      { dish: 'Pisco sour', note: 'Pisco, lime, sugar, egg white — the national cocktail (yes, Chile invented it).' },
    ],
    transportation: {
      primary: 'Metro is fast, clean, and cheap; Uber widely used; Bip! cards for transit.',
      tips: 'Avoid the metro at rush hour (7:30–9am, 6–8pm) — it gets shoulder-to-shoulder dense.',
    },
    neighborhoods: [
      { name: 'Bellavista', blurb: 'Bohemian quarter at the foot of San Cristóbal — bars, restaurants, La Chascona (Neruda’s house).' },
      { name: 'Lastarria', blurb: 'Hip cultural strip — restaurants, galleries, the Cerro Santa Lucía park.' },
      { name: 'Providencia', blurb: 'Upscale residential side — cafés, the Costanera Center skyscraper, Parque Bicentenario.' },
    ],
    safety: 'Generally safe in tourist neighborhoods; pickpockets work the metro and Plaza de Armas. Some downtown blocks rough after dark.',
  },

  quito: {
    bestTimeToVisit: {
      months: 'June–September',
      blurb: 'Dry season with clear Andes views; October–May is rainy season with afternoon downpours.',
    },
    budget: {
      budgetDailyUSD: 45,
      midDailyUSD: 110,
      luxuryDailyUSD: 320,
      blurb: 'Excellent value; restored old-town colonial hotels in San Marcos push the top tier.',
    },
    travelStyles: {
      family: 'The TelefériQo cable car to Pichincha, the equator monument (Mitad del Mundo), the basilica gargoyle towers.',
      couples: 'A San Francisco rooftop dinner, a Cotopaxi day trip, a Mariscal nightlife evening.',
      solo: 'Hostels in La Mariscal and the old town are sociable; Spanish required for the markets, English in tourist spots.',
    },
    food: [
      { dish: 'Llapingachos', note: 'Cheese-stuffed potato cakes with peanut sauce and a fried egg — the Quito breakfast.' },
      { dish: 'Encebollado', note: 'Tuna stew with cassava, pickled onions, lime — the universal hangover cure.' },
      { dish: 'Locro de papa', note: 'Creamy potato soup with avocado and queso fresco — Andean comfort food.' },
      { dish: 'Empanada de viento', note: 'Air-fried empanada with cheese inside, sugar dusted on top — a Quito sweet snack.' },
    ],
    transportation: {
      primary: 'Trolebús and Ecovía are the BRT lines; Uber and Cabify are cheap and the safer late-night option.',
      tips: 'Don’t hail street taxis at night — use Uber. Old town is best explored walking with a registered guide.',
    },
    neighborhoods: [
      { name: 'Centro Histórico', blurb: 'UNESCO old town — La Compañía gold church, the basilica, Plaza Grande.' },
      { name: 'La Mariscal', blurb: 'Backpacker zone — restaurants, hostels, the Plaza Foch nightlife.' },
      { name: 'La Floresta', blurb: 'Hip residential side — artisan coffee, indie restaurants, the Ocho y Medio cinema.' },
    ],
    safety: 'Use normal big-city caution; the old town is safe by day, avoid empty streets at night. Altitude (2,850 m) affects newcomers — pace day one.',
  },

  amman: {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Pleasant shoulder months; June–August is hot (35°C+), December–February surprisingly cold.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 320,
      blurb: 'Reasonable for the Middle East; boutique hotels in Jabal Amman push the top tier.',
    },
    travelStyles: {
      family: 'The Citadel + Roman theatre walk, the Children’s Museum, a Dead Sea float day trip.',
      couples: 'A Rainbow Street rooftop dinner, a Petra by night extension, a Wadi Rum overnight tour.',
      solo: 'Hostels in Jabal Amman welcome solo travelers; Jordan Pass covers Petra + Wadi Rum + 35 sites.',
    },
    food: [
      { dish: 'Mansaf', note: 'Lamb in fermented-yogurt sauce over rice and bread — Jordan’s national dish, eaten with right hand.' },
      { dish: 'Maqluba', note: 'Upside-down rice with chicken or lamb, eggplant, cauliflower — flipped at the table.' },
      { dish: 'Knafeh Nabulsiyya', note: 'Cheese-filled semolina pastry soaked in rosewater syrup — Jordan’s favorite dessert.' },
      { dish: 'Falafel + hummus', note: 'Levantine staples — Hashem in downtown Amman is the institution for both.' },
    ],
    transportation: {
      primary: 'Careem and Uber widely used; yellow taxis abundant (insist on the meter); buses for budget travelers.',
      tips: 'Buy a Jordan Pass online before you go — bundles the Petra ticket with visa-on-arrival and 35 sites for ~$100.',
    },
    neighborhoods: [
      { name: 'Downtown (Al-Balad)', blurb: 'Old market quarter — souks, juice bars, the Roman theatre, Hashem falafel.' },
      { name: 'Jabal Amman', blurb: 'Hilltop boutique quarter — Rainbow Street, cafés, the souk Jara on Fridays.' },
      { name: 'Abdoun', blurb: 'Upscale residential west — embassies, mall, expensive restaurants, quieter.' },
    ],
    safety: 'Very safe day and night. Stay away from political demonstrations; dress modestly outside the boutique quarters.',
  },

  casablanca: {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild Atlantic coast weather; July–August is hot and humid, December–February rainy.',
    },
    budget: {
      budgetDailyUSD: 50,
      midDailyUSD: 130,
      luxuryDailyUSD: 320,
      blurb: 'Reasonable hotels in Maarif and the Corniche; ocean-view luxury runs higher.',
    },
    travelStyles: {
      family: 'Hassan II Mosque (the only one in Morocco non-Muslims can enter), Morocco Mall, the Corniche promenade.',
      couples: 'A sunset at the Hassan II Mosque, a Rick’s Café dinner (inspired by Casablanca the film), a Habous quarter shopping evening.',
      solo: 'English limited outside hotels; Uber/Careem for safety; the city is more business hub than tourist magnet.',
    },
    food: [
      { dish: 'Tagine', note: 'Slow-cooked stew in a conical pot — chicken with preserved lemon or lamb with prunes.' },
      { dish: 'Pastilla', note: 'Sweet-savory pigeon or chicken pie with almonds, cinnamon, powdered sugar.' },
      { dish: 'Couscous', note: 'Friday lunch tradition — steamed semolina with seven vegetables, chicken or lamb.' },
      { dish: 'Fresh seafood', note: 'Atlantic catch at the central market — grilled sardines, sea bream, calamari.' },
    ],
    transportation: {
      primary: 'Tramway covers the centre; Careem and Uber are safer than petits taxis (red).',
      tips: 'The Hassan II Mosque accepts visits during specific tour hours — book online to skip the queue.',
    },
    neighborhoods: [
      { name: 'Downtown', blurb: 'Art-deco quarter — Place Mohammed V, the old medina, the central market.' },
      { name: 'Maarif', blurb: 'Modern shopping district — Morocco Mall nearby, cafés, restaurants.' },
      { name: 'Corniche', blurb: 'Atlantic seafront — Rick’s Café, restaurants, beach clubs.' },
    ],
    safety: 'Generally safe with normal big-city caution. Use registered taxis at night; the old medina has more aggressive touts than Marrakech.',
  },

  chefchaouen: {
    bestTimeToVisit: {
      months: 'March–May, September–November',
      blurb: 'Mild mountain weather; June–August is hot, December–February cold and rainy.',
    },
    budget: {
      budgetDailyUSD: 35,
      midDailyUSD: 90,
      luxuryDailyUSD: 240,
      blurb: 'Riad guesthouses are excellent value; restored medina riads push the top tier.',
    },
    travelStyles: {
      family: 'Easy medina wandering (all blue!), a Ras El Maa waterfall walk, an evening at the Plaza Outa el-Hammam.',
      couples: 'A sunset hike to the Spanish Mosque, a riad-rooftop dinner, a quiet medina photo morning.',
      solo: 'Quiet and walkable; Spanish + French more useful than English; riad guesthouses welcome solo travelers warmly.',
    },
    food: [
      { dish: 'Tagine', note: 'Mountain-style tagine with goat cheese or chicken with apricot — different from Marrakech versions.' },
      { dish: 'Bissara', note: 'Fava bean soup with cumin and olive oil — eaten for breakfast with bread.' },
      { dish: 'Goat cheese', note: 'Chefchaouen is famous for fresh goat cheese — sample at the Plaza Outa.' },
      { dish: 'Mint tea', note: 'Sweet, hot, served theatrically — the universal Moroccan welcome.' },
    ],
    transportation: {
      primary: 'No taxis in the medina — walk everywhere. Buses link to Tangier (2h) and Fes (4h).',
      tips: 'Grand-taxi from Tangier port is the easiest arrival; share a 6-passenger taxi for ~$10 per seat.',
    },
    neighborhoods: [
      { name: 'Medina', blurb: 'The blue old town — every wall painted, every alley photogenic, the riad cluster.' },
      { name: 'Plaza Outa el-Hammam', blurb: 'Central square — restaurants, the kasbah, evening tea-drinking culture.' },
      { name: 'Ras El Maa', blurb: 'River source at the medina’s edge — cafés on the rocks, women doing laundry.' },
    ],
    safety: 'Very safe day and night. Watch your footing on the steep cobbles in rain; petty hassles less common than in Marrakech.',
  },

  luxor: {
    bestTimeToVisit: {
      months: 'October–April',
      blurb: 'Cool dry season; May–September is brutally hot (45°C+) and Valley of the Kings becomes unbearable.',
    },
    budget: {
      budgetDailyUSD: 40,
      midDailyUSD: 110,
      luxuryDailyUSD: 320,
      blurb: 'Nile-cruise packages bundle accommodation and meals; standalone hotels are very affordable.',
    },
    travelStyles: {
      family: 'A balloon ride at sunrise (gentle, awe-inspiring), Karnak Temple, a felucca ride on the Nile.',
      couples: 'A Karnak sound-and-light show, a private felucca sunset, a Valley of the Kings dawn visit.',
      solo: 'Group tour booking through your hotel is the easiest entry; hostels limited but the West Bank has guesthouses.',
    },
    food: [
      { dish: 'Koshary', note: 'Lentils, rice, pasta, chickpeas, tomato sauce, fried onions — Egypt’s national street dish.' },
      { dish: 'Ful medames', note: 'Stewed fava beans with cumin, olive oil, lemon, tomato — the universal Egyptian breakfast.' },
      { dish: 'Molokhia', note: 'Slimy jute-leaf soup with rabbit or chicken, garlic, coriander — divisive but iconic.' },
      { dish: 'Hawawshi', note: 'Spiced minced beef baked inside flatbread — Egyptian comfort dinner.' },
    ],
    transportation: {
      primary: 'Caleche (horse carriage) and taxis for short trips; ferries cross the Nile to West Bank; tour bus for Valley of the Kings.',
      tips: 'Sleep on the West Bank for fewer touts and a closer start to Valley of the Kings; East Bank is the busy main town.',
    },
    neighborhoods: [
      { name: 'East Bank (Luxor town)', blurb: 'Main city — Luxor Temple, Karnak, hotels, the corniche promenade.' },
      { name: 'West Bank', blurb: 'Valley of the Kings, Hatshepsut’s Temple, Colossi of Memnon — quieter accommodation.' },
      { name: 'Karnak', blurb: 'Massive temple complex north of town — best at dawn or for the evening sound-and-light show.' },
    ],
    safety: 'Generally safe for tourists; persistent touts and overpriced caleche rides are the main annoyance. Carry small bills for everywhere.',
  },

  johannesburg: {
    bestTimeToVisit: {
      months: 'April–September',
      blurb: 'Cool dry winter; October–March brings rain and afternoon thunderstorms, December–February peak summer heat.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 140,
      luxuryDailyUSD: 400,
      blurb: 'Excellent value by global standards; boutique hotels in Sandton push the luxury tier.',
    },
    travelStyles: {
      family: 'Apartheid Museum (powerful for older kids), Lion + Safari Park, the Cradle of Humankind fossils.',
      couples: 'A Maboneng art district evening, a Soweto cycling tour, a Pilanesberg safari day trip.',
      solo: 'Stay in Sandton or Rosebank for safety; tours are the safest way to see Soweto and the city centre.',
    },
    food: [
      { dish: 'Bunny chow', note: 'Hollowed bread loaf filled with curry — Durban-born but ubiquitous in Joburg.' },
      { dish: 'Bobotie', note: 'Curried minced meat baked with an egg-and-milk topping — South Africa’s national casserole.' },
      { dish: 'Boerewors', note: 'Coiled farmer’s sausage spiced with coriander — grilled at any braai (BBQ).' },
      { dish: 'Biltong', note: 'Air-dried, spiced beef or game — South African jerky, infinitely better than American.' },
    ],
    transportation: {
      primary: 'Gautrain links Sandton to OR Tambo airport; Uber widely used; avoid public taxis for safety.',
      tips: 'Don’t walk between neighborhoods at night; Uber for any after-dark movement. Tours for downtown.',
    },
    neighborhoods: [
      { name: 'Sandton', blurb: 'Modern business + hotel district — Mandela Square, mall, the safest area for tourists.' },
      { name: 'Maboneng', blurb: 'Hip arts district downtown — restaurants, galleries, the Sunday Neighbourgoods Market.' },
      { name: 'Rosebank', blurb: 'Middle ground between Sandton and downtown — galleries, restaurants, Sunday market.' },
    ],
    safety: 'Use serious caution. Stay in Sandton/Rosebank, Uber everywhere after dark, never walk between neighborhoods. Guided tours for Soweto + downtown.',
  },

  // ────── Phase 8 expansion — 10 new cities ──────

  kanazawa: {
    bestTimeToVisit: {
      months: 'April, October–November',
      blurb: 'Cherry blossoms at Kenrokuen in April; koyo (autumn leaves) light up the same garden late October to mid-November.',
    },
    budget: {
      budgetDailyUSD: 55,
      midDailyUSD: 130,
      luxuryDailyUSD: 380,
      blurb: 'Cheaper than Tokyo or Kyoto — a mid-range budget covers a ryokan stay and multiple kaiseki meals.',
    },
    travelStyles: {
      family: 'Kids ride the loop-line tourist bus for a flat fee, love the Ninja-dera temple’s hidden passages, and can smash gold leaf onto lacquerware at DIY workshops.',
      couples: 'Stay in a ryokan in Higashi Chaya, book a kaiseki dinner, and take an early-morning stroll through Kenrokuen before the buses arrive.',
      solo: 'Kanazawa’s scale suits solo travelers — every ramen counter has one seat open, and museums stay quiet on weekdays.',
    },
    food: [
      { dish: 'Nodoguro', note: 'Blackthroat seaperch — Kanazawa’s signature fish; grilled at the fish market or served as sushi.' },
      { dish: 'Kaga cuisine', note: 'The Kaga clan’s formal multi-course tradition — try it at a converted teahouse in Higashi Chaya.' },
      { dish: 'Jibuni', note: 'Local duck stew thickened with wheat flour — winter comfort food.' },
      { dish: 'Kanazawa curry', note: 'Thick dark roux served with breaded pork cutlet on rice — chain restaurant Champion Curry is the local go-to.' },
    ],
    transportation: {
      primary: 'The Kanazawa Loop Bus (¥600 day pass) circles every major sight; the city itself is compact enough to walk.',
      tips: 'From Tokyo, the Hokuriku Shinkansen reaches Kanazawa in ~2.5h — cheaper and faster than flying. Rent a bike for outer neighborhoods.',
    },
    neighborhoods: [
      { name: 'Kenrokuen area', blurb: 'The garden, Kanazawa Castle, and 21st Century Museum — the walkable cultural core.' },
      { name: 'Higashi Chaya', blurb: 'Preserved geisha district — tea houses, gold-leaf shops, evening lanterns.' },
      { name: 'Nagamachi', blurb: 'Old samurai residences behind mud walls — well worth a slow morning walk.' },
      { name: 'Omicho Market', blurb: 'Local seafood market — sushi and rice bowls at counters open from 9am.' },
    ],
    safety: 'One of Japan’s safest cities. Late-night solo walks through the geisha districts are common; lost items usually find you.',
  },

  fukuoka: {
    bestTimeToVisit: {
      months: 'March–May, October–November',
      blurb: 'Cherry blossoms at Maizuru Park in spring; comfortable dry weather in autumn. Summer is muggy but the yatai food stalls come alive.',
    },
    budget: {
      budgetDailyUSD: 45,
      midDailyUSD: 110,
      luxuryDailyUSD: 300,
      blurb: 'One of Japan’s most affordable big cities. A tonkotsu ramen dinner costs under $10; a yatai crawl adds only $20 more.',
    },
    travelStyles: {
      family: 'Momochi Beach is central and clean, Marine World aquarium sits on the bay, and the ferry to Nokonoshima Island is a half-day family trip.',
      couples: 'Yatai food-stall dinners on the Nakasu island are compact and romantic; end the night at a hotel bar in Tenjin.',
      solo: 'Ramen counters, jazz clubs in Daimyo, and a thriving hostel scene make Fukuoka easy for solo travel — plus one of Japan’s friendliest local accents.',
    },
    food: [
      { dish: 'Tonkotsu ramen', note: 'The rich pork-bone broth was invented here — Ichiran and Ippudo are both Fukuoka natives.' },
      { dish: 'Mentaiko', note: 'Spicy salt-cured pollock roe — over rice, in pasta, or as a dip.' },
      { dish: 'Yatai food', note: 'Food-stall standards — yakitori, oden, gyoza — eaten shoulder-to-shoulder on Nakasu island after dark.' },
      { dish: 'Motsunabe', note: 'Beef offal hot pot with cabbage and garlic — winter house special.' },
      { dish: 'Mizutaki', note: 'Delicate chicken hot pot in cloudy broth — a Fukuoka refinement.' },
    ],
    transportation: {
      primary: 'Subway (3 lines) + JR Kyushu trains cover the city; airport is 5 minutes from downtown by subway — the shortest airport transfer in Japan.',
      tips: 'Buy a Nimoca IC card for buses/subway. Fukuoka is Japan’s most walkable million-plus city — Tenjin to Hakata is 20 minutes on foot.',
    },
    neighborhoods: [
      { name: 'Hakata', blurb: 'Station area — business hotels, department stores, quick access to bullet trains.' },
      { name: 'Tenjin', blurb: 'Fukuoka’s shopping and nightlife core — bars, jazz clubs, department stores.' },
      { name: 'Nakasu', blurb: 'A neon island between two rivers — the yatai (food-stall) scene concentrates here.' },
      { name: 'Daimyo', blurb: 'Small streets of independent boutiques, cafés, and cocktail bars behind Tenjin.' },
    ],
    safety: 'Among Japan’s safest big cities. Nakasu’s nightlife touts can be pushy but not dangerous — a polite “no” always works.',
  },

  'el-nido': {
    bestTimeToVisit: {
      months: 'November–May',
      blurb: 'Dry season with calm seas — essential for island-hopping. Peak is late December–February; avoid July–October (typhoons + heavy rain).',
    },
    budget: {
      budgetDailyUSD: 40,
      midDailyUSD: 110,
      luxuryDailyUSD: 400,
      blurb: 'Beach huts $15/night, mid-range hotels $80, private-island resorts $500+. Island tours run $25–35 for a full day.',
    },
    travelStyles: {
      family: 'Tour A (lagoons + Secret Beach) suits families — shallow water, short boat rides. Nacpan Beach for a shore day; Big Lagoon for the calmer kayak paddle.',
      couples: 'Book a private banca island tour, watch sunset from Corong Corong Beach with a San Miguel, and consider a splurge night on one of the resort islands.',
      solo: 'Backpacker hostels are cheap and social; group island tours are the standard way to meet people — you’ll know everyone by Day 3.',
    },
    food: [
      { dish: 'Kinilaw', note: 'Filipino ceviche — raw tuna cured in vinegar with ginger, chili, and coconut vinegar.' },
      { dish: 'Grilled tuna belly', note: 'Freshly caught, served with rice and calamansi — every beach shack does it well.' },
      { dish: 'Lechon kawali', note: 'Deep-fried pork belly with crispy skin — the Filipino weakness.' },
      { dish: 'Halo-halo', note: 'Shaved ice, sweet beans, jelly, ube ice cream — the essential Filipino dessert on a hot day.' },
    ],
    transportation: {
      primary: 'Van transfer from Puerto Princesa airport (5–6h). Or fly into Lio airport at El Nido directly (limited flights).',
      tips: 'Motorbike/tricycle around town; boat tours are the only way to reach the lagoons. Book Tour A/B/C/D through your hotel — same price everywhere.',
    },
    neighborhoods: [
      { name: 'El Nido town', blurb: 'The main strip — beach-front restaurants, dive shops, tour operators, and cheap rooms.' },
      { name: 'Corong Corong', blurb: 'A 10-minute tricycle south of town — quieter beach, sunset bars, mid-range resorts.' },
      { name: 'Nacpan Beach', blurb: '45 minutes north — a 4km stretch of white sand with only a handful of huts.' },
      { name: 'Lio Beach', blurb: 'Master-planned resort strip near the airport — pricier, more polished, private beach.' },
    ],
    safety: 'Overall safe — occasional petty theft on beaches. Bigger risks are sun, dehydration, and rough seas — check weather before booking a tour.',
  },

  jodhpur: {
    bestTimeToVisit: {
      months: 'October–March',
      blurb: 'Winter is dry and mild (20–28°C) — ideal for fort visits and desert day trips. Skip April–September; temperatures top 40°C.',
    },
    budget: {
      budgetDailyUSD: 20,
      midDailyUSD: 60,
      luxuryDailyUSD: 300,
      blurb: 'One of India’s cheapest tourist cities. Heritage haveli stays run $30; five-star palace hotels (Umaid Bhawan, RAAS) push past $500.',
    },
    travelStyles: {
      family: 'Kids love Mehrangarh’s audio tour (their voice-actor kids’ version is genuinely good); a camel ride at Osian is an easy half-day.',
      couples: 'Watch sunset from Mehrangarh’s ramparts, then dinner on a rooftop overlooking the blue city. Book one night at RAAS Jodhpur if the budget allows.',
      solo: 'Blue City lanes are safe to wander in daylight; join a Rajasthan food walk to meet other travelers.',
    },
    food: [
      { dish: 'Mirchi vada', note: 'Whole green chili stuffed with spiced potato, battered and fried — Jodhpur’s signature street snack.' },
      { dish: 'Mawa kachori', note: 'A sweet kachori filled with milk solids and nuts, soaked in rose syrup.' },
      { dish: 'Dal baati churma', note: 'Rajasthan’s desert dish — lentils, baked wheat dumplings, sweet crushed wheat with ghee.' },
      { dish: 'Laal maans', note: 'Fiery red mutton curry with local red chilis — a Marwari household classic.' },
    ],
    transportation: {
      primary: 'Autorickshaws for short trips (agree on fare); Uber/Ola work in the city; a hired car with driver is worth it for day trips to Osian or Bishnoi villages.',
      tips: 'Old town lanes are one-way and impossibly narrow — walk from your hotel to the fort, don’t drive.',
    },
    neighborhoods: [
      { name: 'Old Blue City', blurb: 'Below the fort — indigo-painted houses, tiny bakeries, textile shops, rooftop cafés.' },
      { name: 'Sardar Bazaar', blurb: 'The clock tower spice market — go early morning for the best photos.' },
      { name: 'Chittar Hill', blurb: 'Where Umaid Bhawan Palace sits — quiet, upscale, museum entry open to non-guests.' },
    ],
    safety: 'Safe by day for solo women in the old city. Watch for aggressive touts near the fort entrance and rickshaw drivers overcharging tourists — set a price first.',
  },

  udaipur: {
    bestTimeToVisit: {
      months: 'October–March',
      blurb: 'Cool, dry, and lake-full. December–January is peak; October and February offer the same weather with fewer crowds.',
    },
    budget: {
      budgetDailyUSD: 25,
      midDailyUSD: 80,
      luxuryDailyUSD: 500,
      blurb: 'Lake-view rooftop guesthouses start at $30; the Taj Lake Palace + Oberoi Udaivilas rank among the world’s priciest hotels.',
    },
    travelStyles: {
      family: 'A boat ride on Lake Pichola is the essential family activity; the vintage-car museum thrills car-loving kids; puppet shows at Bagore Ki Haveli are a nightly hit.',
      couples: 'Sunset from Ambrai Ghat, dinner on Sunset Terrace at the Fateh Prakash, and (budget-permitting) a night at the Taj Lake Palace — reached only by boat.',
      solo: 'Old City lanes fit a slow solo pace — art galleries, cooking classes, rooftop cafés. It’s one of India’s most solo-friendly cities.',
    },
    food: [
      { dish: 'Dal baati churma', note: 'The Rajasthani trio — lentils, roasted wheat dumplings, sweetened crushed wheat with ghee.' },
      { dish: 'Gatte ki sabzi', note: 'Chickpea-flour dumplings simmered in a yogurt-based curry.' },
      { dish: 'Laal maans', note: 'Fiery red mutton curry with dried red chilis — a Rajputana classic.' },
      { dish: 'Ker sangri', note: 'Desert beans and berries stir-fried with spices — vegetarian Rajasthan at its most authentic.' },
    ],
    transportation: {
      primary: 'Autorickshaws or Uber for short hops. Walk the old city — the lanes are too narrow for anything else.',
      tips: 'Old City hotels near Lake Pichola are the target — many have zero vehicle access. Ask for pickup at Chandpole for boats.',
    },
    neighborhoods: [
      { name: 'Old City (Lake Pichola)', blurb: 'City Palace side — rooftop restaurants, art galleries, boat launches.' },
      { name: 'Lal Ghat', blurb: 'Backpacker + budget hostel zone right on the ghats — sunset gathering spot.' },
      { name: 'Fateh Sagar Lake', blurb: 'Larger, calmer lake north of the city — nice for evening rickshaw rides.' },
    ],
    safety: 'Very safe by Indian city standards. Watch traffic in the old city — motorbikes navigate lanes barely wider than themselves.',
  },

  rhodes: {
    bestTimeToVisit: {
      months: 'May–June, September–October',
      blurb: 'Warm sea, comfortable heat, thinner crowds than July–August. Winter is mild but many beach-side businesses close.',
    },
    budget: {
      budgetDailyUSD: 70,
      midDailyUSD: 160,
      luxuryDailyUSD: 400,
      blurb: 'Shoulder season is a bargain; peak summer doubles hotel rates. Ferries + local buses keep transport cheap.',
    },
    travelStyles: {
      family: 'Rhodes Aquarium at the north tip, safe beaches at Faliraki, and a day at Lindos where kids can climb the Acropolis.',
      couples: 'Old Town Rhodes at dusk, dinner at a Lindos rooftop restaurant, and a private boat charter around Anthony Quinn Bay.',
      solo: 'Rhodes Town’s old walled city is compact and safe to walk after dark; buses reach every beach for €4–8 return.',
    },
    food: [
      { dish: 'Pitaroudia', note: 'Chickpea and mint fritters — a Rhodian meze staple.' },
      { dish: 'Moussaka', note: 'The Greek classic — layered aubergine, ground meat, béchamel — baked and served at every taverna.' },
      { dish: 'Melekouni', note: 'A traditional wedding treat — honey-sesame bars flavored with orange zest.' },
      { dish: 'Fresh grilled octopus', note: 'Sun-dried on the line all morning, grilled to order with olive oil and lemon.' },
    ],
    transportation: {
      primary: 'Local buses (KTEL) reach every beach + Lindos from Rhodes Town for €2–8. Renting a car opens the west coast + inland villages.',
      tips: 'Don’t drive in Rhodes Old Town — parking is impossible. Diagoras Airport (RHO) is 20 minutes from town; taxis €25.',
    },
    neighborhoods: [
      { name: 'Rhodes Old Town', blurb: 'A UNESCO medieval quarter inside the walls — cobblestones, gates, the Grand Master’s Palace.' },
      { name: 'Lindos', blurb: 'White-cube village under an acropolis 50km south — day-trippable, and prettier for an overnight.' },
      { name: 'Faliraki', blurb: 'Beach + resort strip north of the airport — family-friendly, water park, safe swim beach.' },
      { name: 'Prasonisi', blurb: 'Southern tip — windsurf mecca where two seas meet across a sand isthmus.' },
    ],
    safety: 'Very safe. Watch for pickpockets in the Old Town gate crowds and slippery cobblestones after a rain shower.',
  },

  corfu: {
    bestTimeToVisit: {
      months: 'May–June, September',
      blurb: 'Warm days, cooler nights, sea temperatures above 22°C. July–August is packed with cruise stops.',
    },
    budget: {
      budgetDailyUSD: 65,
      midDailyUSD: 150,
      luxuryDailyUSD: 380,
      blurb: 'Cheaper than the Cyclades. A shoulder-season villa with a pool costs less than a Mykonos budget room.',
    },
    travelStyles: {
      family: 'Kanoni’s Mouse Island boat rides, a day at Aqualand water park, and safe swim beaches at Glyfada.',
      couples: 'Old Town rooftop bars, a Vidos Island boat trip, and dinner at a taverna in Kassiopi harbor.',
      solo: 'Old Town is compact and walkable; hiking the Corfu Trail (220km, part or all) attracts a small international scene.',
    },
    food: [
      { dish: 'Pastitsada', note: 'Cinnamon-spiced beef stew over pasta — Corfu’s signature Venetian-influenced dish.' },
      { dish: 'Sofrito', note: 'Veal in white wine sauce with garlic and parsley — another Venetian holdover.' },
      { dish: 'Bourdeto', note: 'Fish stew in red pepper broth — traditionally scorpionfish, spicy and rustic.' },
      { dish: 'Kumquat liqueur', note: 'Corfu’s own citrus liqueur — try it after dinner or as a marmalade.' },
    ],
    transportation: {
      primary: 'Blue buses cover the town; green KTEL buses reach the villages and coast. Rent a car to explore the north and west.',
      tips: 'Corfu Old Town is pedestrianized — leave the car in an outer lot. Ferries to Paxos and Albania run daily in summer.',
    },
    neighborhoods: [
      { name: 'Corfu Old Town', blurb: 'UNESCO-listed Venetian-Ottoman-British layers — cobbled arcades, Spianada green, two forts.' },
      { name: 'Paleokastritsa', blurb: 'A dramatic west-coast cove with a monastery and boat tours to sea caves.' },
      { name: 'Kassiopi', blurb: 'Fishing-village harbor in the north — Venetian ruins, family tavernas, boat rentals.' },
      { name: 'Glyfada / Agios Gordios', blurb: 'The west-coast sunset beaches — sand, cliffs, and beach bars.' },
    ],
    safety: 'Very safe. The main hazards are steep coastal roads if you rent scooters and pickpockets in the Old Town summer crowds.',
  },

  bucharest: {
    bestTimeToVisit: {
      months: 'April–June, September–October',
      blurb: 'Mild temperatures, patio-cafe weather, thinner crowds than the summer festival season.',
    },
    budget: {
      budgetDailyUSD: 40,
      midDailyUSD: 90,
      luxuryDailyUSD: 220,
      blurb: 'One of the EU’s cheapest capitals — mid-range hotels near the Old Town run $70, restaurant dinners under $20.',
    },
    travelStyles: {
      family: 'The Village Museum (open-air, real relocated houses) is the standout family stop; Herăstrău Park has boat rentals and playgrounds.',
      couples: 'Old Town wine bars, dinner at Caru’ cu Bere (belle-époque interior), and a weekend detour to Peleș Castle in Sinaia.',
      solo: 'Great backpacker infrastructure — hostel walking tours (many free) are the standard on-arrival move. Excellent café-work scene.',
    },
    food: [
      { dish: 'Sarmale', note: 'Sour cabbage rolls stuffed with pork and rice — the Romanian holiday-table classic.' },
      { dish: 'Mici', note: 'Grilled meat rolls (no casing) — spiced beef/lamb/pork, eaten with mustard and beer.' },
      { dish: 'Ciorbă de burtă', note: 'Sour tripe soup — Bucharest breakfast classic, better than it sounds.' },
      { dish: 'Papanași', note: 'Cottage-cheese doughnuts topped with sour cream and jam — every restaurant’s dessert star.' },
    ],
    transportation: {
      primary: 'Metro (4 lines) is fast, cheap, and reaches airport (M6). Uber/Bolt everywhere; taxis cheap but insist on the meter.',
      tips: 'Skip the airport taxi mafia — Bolt/Uber for the 40-minute ride into town. Trains to Sinaia (Peleș Castle) run hourly.',
    },
    neighborhoods: [
      { name: 'Old Town (Lipscani)', blurb: 'Cobblestone bar district — restaurants, clubs, historic churches.' },
      { name: 'Cotroceni', blurb: 'Leafy residential streets near the Botanical Garden — belle-époque villas.' },
      { name: 'Piata Universitatii', blurb: 'The commercial center — bookshops, cafes, the intellectual heart of the city.' },
    ],
    safety: 'Safer than most Western capitals. Watch for aggressive stray dogs in outer districts and card-skimming ATMs — use bank machines only.',
  },

  'panama-city': {
    bestTimeToVisit: {
      months: 'December–April',
      blurb: 'Dry season with less humidity. May–November is the green season — cheaper but expect afternoon downpours.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 130,
      luxuryDailyUSD: 320,
      blurb: 'Costlier than most of Latin America because of USD parity, but hotels + food are cheaper than Miami.',
    },
    travelStyles: {
      family: 'The Miraflores Locks visitor center is a hit with all ages; BioMuseo (designed by Gehry) fits a rainy afternoon; day trips to Playa Blanca beach islands.',
      couples: 'Casco Viejo rooftop bars, a Panama Canal partial transit cruise, and a weekend in Bocas del Toro.',
      solo: 'Casco Viejo has a solid hostel + coworking scene; the Cinta Costera bay walk (5km) is the daily runners’ commute.',
    },
    food: [
      { dish: 'Sancocho', note: 'Panama’s hangover soup — chicken, yam, and cilantro — served everywhere from bars to fondas.' },
      { dish: 'Ceviche', note: 'Corvina (sea bass) in lime, red onion, and cilantro — buy it fresh at the Fish Market (Mercado de Mariscos).' },
      { dish: 'Ropa vieja', note: 'Shredded stewed beef with rice and beans — the Caribbean colonial classic done Panamanian.' },
      { dish: 'Patacones', note: 'Twice-fried green plantain smashed flat — Panama’s answer to French fries.' },
    ],
    transportation: {
      primary: 'Metro (2 lines) reaches most tourist zones; Uber is cheap and safe; taxis negotiate first — no meters.',
      tips: 'Tocumen Airport is 45 minutes from Casco Viejo — Uber $30–40. Panama City buses (Metrobus) require a RapiPass card.',
    },
    neighborhoods: [
      { name: 'Casco Viejo', blurb: 'The colonial old town — cobblestones, boutique hotels, rooftop bars, Sunday markets.' },
      { name: 'El Cangrejo', blurb: 'Restaurant-and-hotel zone — a walkable strip of international restaurants and mid-range hotels.' },
      { name: 'Punta Pacifica', blurb: 'Modern skyscraper district — luxury hotels, malls, safest area after dark.' },
      { name: 'Amador Causeway', blurb: 'A 3km causeway of islands connected to the city — bike, run, or watch canal ships.' },
    ],
    safety: 'Safe by Central American standards but pockets vary sharply — El Chorrillo and Curundú are best avoided. Casco Viejo and Punta Pacifica are safe day and night.',
  },

  havana: {
    bestTimeToVisit: {
      months: 'November–April',
      blurb: 'Dry season with sunny days and warm nights. Skip hurricane season (August–October) and the sweaty summer humidity.',
    },
    budget: {
      budgetDailyUSD: 60,
      midDailyUSD: 130,
      luxuryDailyUSD: 350,
      blurb: 'Casa particulares (family homestays) $30–60/night; upscale colonial hotels top $250. Bring USD or Euros — cards rarely work.',
    },
    travelStyles: {
      family: 'A classic-car tour of the Malecón, an aquarium in the eastern suburbs, and cannon-firing ceremony at El Morro fort at 9 p.m. nightly.',
      couples: 'Rooftop dinner in Old Havana, a Malecón sunset walk with a mojito in hand, live jazz at La Zorra y El Cuervo.',
      solo: 'Havana rewards solo travelers who wander — every doorway spills music. Language: Spanish is essential; English is scarce.',
    },
    food: [
      { dish: 'Ropa vieja', note: 'Cuba’s national dish — shredded beef stewed with peppers, tomatoes, and cumin.' },
      { dish: 'Moros y cristianos', note: 'Black beans cooked with rice — the ubiquitous side.' },
      { dish: 'Lechón asado', note: 'Whole-roasted marinated pork — celebration food, often at paladares (private restaurants).' },
      { dish: 'Tostones', note: 'Fried green plantain — the Cuban chip.' },
      { dish: 'Ropa vieja', note: 'The national dish — shredded beef in a rich tomato-pepper stew, served with rice and black beans.' },
    ],
    transportation: {
      primary: 'Coco taxis (yellow eggs) and classic-car taxis for tourists; local buses are packed and confusing; walk Old Havana.',
      tips: 'Bring cash — Cuban card networks rarely accept US or EU cards. ATMs work erratically. Booking taxis via your casa host is safest.',
    },
    neighborhoods: [
      { name: 'Habana Vieja (Old Havana)', blurb: 'The UNESCO-listed colonial core — plazas, colonnades, live salsa, restored casas.' },
      { name: 'Centro Habana', blurb: 'A crumbling, lived-in barrio between the Old Town and Vedado — real Havana at street level.' },
      { name: 'Vedado', blurb: 'Mid-century Havana — the Malecón waterfront, hotel Nacional, ice-cream at Coppelia.' },
      { name: 'Miramar', blurb: 'Leafy embassy district west of the harbor — quieter, upscale paladares, good sunset drives.' },
    ],
    safety: 'Very safe by Latin American standards — violent crime is rare. Petty scams (fake cigar sellers, taxi overcharges) are the main risk. Solo women reportedly safe day and night in tourist districts.',
  },

  // ────── Phase 9 expansion — 10 more cities ──────

  nara: {
    bestTimeToVisit: {
      months: 'March–May, October–November',
      blurb: 'Cherry blossoms in early April and blazing red maples in mid-November are Nara Park\'s signature moments — worth the crowd trade-off.',
    },
    budget: { budgetDailyUSD: 50, midDailyUSD: 110, luxuryDailyUSD: 280, blurb: 'Cheaper than Kyoto and lightly staffed — a good day trip base with mid-range ryokans right by the park.' },
    travelStyles: {
      family: 'Deer crackers (shika-senbei) sold on every corner — kids love the bowing bucks. Tōdai-ji\'s Great Buddha and the museum\'s digital tour keep older kids engaged.',
      couples: 'Sunrise in Nara Park before the buses arrive, then a slow ryokan lunch and Kasuga Taisha\'s hundred stone lanterns at dusk.',
      solo: 'Compact enough to see in a day, quiet enough to overnight if you want the park to yourself early morning.',
    },
    food: [
      { dish: 'Kakinoha-zushi', note: 'Salted mackerel sushi wrapped in persimmon leaves — Nara\'s signature travel food.' },
      { dish: 'Narazuke', note: 'Vegetables pickled in sake lees — pungent, salty, sold as omiyage at every station shop.' },
      { dish: 'Chagayu', note: 'Green-tea-rice porridge — a Todai-ji monastic tradition still served at old-town restaurants.' },
    ],
    transportation: { primary: 'Kintetsu Nara Line from Kyoto (35 min) or Osaka Namba (35 min). The park is a 5-minute walk from Kintetsu Nara station.', tips: 'The JR Nara station is farther from the park — go for the Kintetsu station if it\'s an option.' },
    neighborhoods: [
      { name: 'Nara Park', blurb: 'The deer, Tōdai-ji, Kasuga Taisha — the tourist core, walkable end to end.' },
      { name: 'Naramachi', blurb: 'Preserved Edo-era merchant houses south of the park — quiet lanes, tiny cafés, artisan shops.' },
    ],
    safety: 'Very safe. The only local hazard is the deer — they\'ll bump you for crackers and have been known to nip fingers holding food.',
  },

  hakone: {
    bestTimeToVisit: {
      months: 'April, October–November',
      blurb: 'Cherry blossoms in April; red maples in mid-November. Winter is beautiful for onsen (hot spring) stays but the ropeway can close on Fuji-view days.',
    },
    budget: { budgetDailyUSD: 100, midDailyUSD: 250, luxuryDailyUSD: 600, blurb: 'Onsen ryokan is the point — expect $250-500/night for a room with kaiseki dinner + private bath. Day-tripping from Tokyo is much cheaper.' },
    travelStyles: {
      family: 'Kids love the Hakone Ropeway (glass gondolas over sulfur vents) and the sightseeing pirate ship on Lake Ashi. Book a family ryokan with a private ofuro so children don\'t have to enter public baths.',
      couples: 'The classic honeymoon move — book a ryokan with a private outdoor bath (rotenburo) overlooking Mount Fuji. Splurge here; it\'s worth it.',
      solo: 'The Hakone Round Course (train + funicular + ropeway + boat + bus) works well for solo travelers; hostels near Hakone-Yumoto station are cheap and social.',
    },
    food: [
      { dish: 'Kaiseki dinner', note: 'The multi-course seasonal meal at your ryokan — up to 12 courses, always the highlight.' },
      { dish: 'Black eggs (kuro-tamago)', note: 'Eggs boiled in the sulfur springs at Owakudani — shells turn black; each is said to add 7 years to your life.' },
      { dish: 'Yosenabe', note: 'A hot-pot stew of chicken, fish, and vegetables — the classic warm-you-up-in-the-mountains meal.' },
    ],
    transportation: { primary: 'Odakyu Limited Express Romancecar from Shinjuku (~85 min) is the standard route. Buy a Hakone Free Pass to combine trains, buses, ropeway, and pirate ship in one 2-day ticket.', tips: 'The Hakone Round Course loop is designed for one direction — start with the mountain railway, end with the bus back to Hakone-Yumoto.' },
    neighborhoods: [
      { name: 'Hakone-Yumoto', blurb: 'The town at the mountain\'s base — the arrival hub, most budget ryokans, and shopping.' },
      { name: 'Gōra', blurb: 'Mid-mountain — high-end onsen ryokans, the Open-Air Museum, cable-car station.' },
      { name: 'Lake Ashi (Ashinoko)', blurb: 'Mount Fuji views on a clear day; sightseeing boat departures; the Torii of Peace floating in the lake.' },
    ],
    safety: 'Very safe. The area is volcanic — occasionally the Owakudani zone closes for gas activity. Follow signs; venting steam vents are real.',
  },

  kandy: {
    bestTimeToVisit: {
      months: 'January–April',
      blurb: 'Dry and warm. Skip October–December (monsoon rain); July can be very hot but the Esala Perahera festival makes it worth the sweat.',
    },
    budget: { budgetDailyUSD: 25, midDailyUSD: 70, luxuryDailyUSD: 250, blurb: 'One of Asia\'s best-value hill stations. Boutique tea-estate hotels around $150-250/night; classic guesthouses under $40.' },
    travelStyles: {
      family: 'The Temple of the Tooth ceremony (three times daily) is a genuine cultural moment kids remember. Peradeniya Botanical Gardens keep them running for hours.',
      couples: 'A tea-estate bungalow stay on the hills above the lake, sunset from the Bahirawakanda Vihara Buddha, and a private ayurveda spa night.',
      solo: 'Kandy is a Sri Lankan travel hub — meet other travelers at hostel meetups, join the scenic train to Ella (world-famous rail ride), and hire a driver for the Cultural Triangle.',
    },
    food: [
      { dish: 'Rice and curry', note: 'The everyday Sri Lankan meal — coconut sambol, dhal, and 3-5 vegetable curries around a mound of red rice.' },
      { dish: 'Kottu roti', note: 'Chopped roti stir-fried with vegetables + meat + egg — the sound of the metal choppers on hot iron is the Kandy soundtrack after dark.' },
      { dish: 'Hoppers', note: 'Bowl-shaped rice pancakes; egg hoppers for breakfast with lunu miris (chili paste).' },
      { dish: 'Ceylon tea', note: 'You\'re in the heart of the tea country — take a factory tour in Nuwara Eliya, then drink it fresh.' },
    ],
    transportation: { primary: 'Trains from Colombo Fort take 2.5-3h — book a 1st-class observation-car seat for the scenic curves. Tuk-tuks around Kandy town are cheap (agree on fare first).', tips: 'Kandy-to-Ella train (7 hours) is one of Asia\'s great rail journeys — book at least a week ahead for the reserved-seat carriages.' },
    neighborhoods: [
      { name: 'Kandy Lake', blurb: 'The Temple of the Tooth, Queen\'s Hotel, and the walking path around the water.' },
      { name: 'Peradeniya', blurb: 'Botanical gardens + university campus — 6km southwest, easy tuk-tuk.' },
      { name: 'Bahirawakanda', blurb: 'Hillside above the town — 26m concrete Buddha with panoramic lake views.' },
    ],
    safety: 'Very safe by South Asian standards. Watch for scam offers to "help" you find the Temple of the Tooth — you don\'t need help, it\'s well-signposted.',
  },

  'bora-bora': {
    bestTimeToVisit: {
      months: 'May–October',
      blurb: 'Dry season with clear water for snorkeling and less humidity. November–April is warmer, rainier, and cheaper — sunset views still spectacular.',
    },
    budget: { budgetDailyUSD: 300, midDailyUSD: 700, luxuryDailyUSD: 2500, blurb: 'Not a budget destination. Overwater bungalows start ~$800/night; luxury resorts (Four Seasons, St. Regis) top $3000. Pensions on the main island are $200-350/night.' },
    travelStyles: {
      family: 'Kid-friendly resorts (InterContinental Thalasso, Four Seasons) run kids clubs and free reef snorkeling. Rays and reef sharks at the lagoon sanctuary are a highlight — safe for children.',
      couples: 'The universal honeymoon. Book a bungalow with a glass floor + private plunge pool, and pre-order a floating breakfast at least one morning.',
      solo: 'Uncommon for solo travel — but pensions on the main island (rather than resort motus) give you access to hikes, a scooter, and a normal restaurant scene.',
    },
    food: [
      { dish: 'Poisson cru', note: 'Raw tuna cured in lime and coconut milk — French Polynesia\'s signature dish; every restaurant does it.' },
      { dish: 'Mahi-mahi (Coriphene)', note: 'Grilled or curried — pulled from the lagoon that morning.' },
      { dish: 'Chevrettes de rivière', note: 'Freshwater river prawns from Tahiti\'s valleys — grilled with garlic.' },
    ],
    transportation: { primary: 'Fly Air Tahiti from Papeete (Tahiti) — 50 minutes. From the Bora Bora airport (Motu Mute island), your resort will send a boat.', tips: 'Rent a bike or scooter on the main island — the 32km ring road is flat and scenic. Motu (island resort) guests need a boat to reach the main island.' },
    neighborhoods: [
      { name: 'Vaitape', blurb: 'Main-island town with the ferry pier, banks, markets, restaurants.' },
      { name: 'Matira Beach', blurb: 'The one public swimmable beach on the main island — white sand, calm shallow water.' },
      { name: 'Motu Toopua / Motu Piti Aau', blurb: 'The two islet chains ringing the lagoon — where the top resorts sit.' },
    ],
    safety: 'Extremely safe. Main risks are ocean-related — currents inside the lagoon are gentle, but leaving the reef line is dangerous.',
  },

  nadi: {
    bestTimeToVisit: {
      months: 'May–October',
      blurb: 'Dry season with 26-29°C temperatures and less humidity. November–April is the wet season with occasional cyclones — cheaper hotels, warmer sea.',
    },
    budget: { budgetDailyUSD: 60, midDailyUSD: 180, luxuryDailyUSD: 500, blurb: 'Backpacker-friendly to mid-range friendly. The main-island resort strip is affordable; outer-island private resorts (Yasawas, Mamanuca) push $500-1000/night.' },
    travelStyles: {
      family: 'Denarau Island resorts have kids\' clubs, calm swim beaches, and family-friendly restaurants. South Sea Cruises + Captain Cook Cruises run day boats to sand cays.',
      couples: 'Skip Nadi town — head straight to a Yasawa or Mamanuca island resort for the honeymoon shot. Overwater bures at Likuliku are Fiji\'s answer to Bora Bora at half the price.',
      solo: 'The Yasawa Flyer catamaran links backpacker resorts along the Yasawa chain — a well-worn solo route with a strong social scene.',
    },
    food: [
      { dish: 'Kokoda', note: 'Fiji\'s ceviche — raw white fish cured in lime, coconut cream, and chili.' },
      { dish: 'Lovo', note: 'A traditional underground earth oven feast — root vegetables, chicken, and fish wrapped in banana leaves.' },
      { dish: 'Fiji Bitter', note: 'Not food — but the local beer that pairs with every sunset. Try Vonu lager too.' },
    ],
    transportation: { primary: 'Nadi International Airport is Fiji\'s hub — flights connect to Sydney, LA, Auckland. Denarau Island (10 min taxi from the airport) is the main resort strip.', tips: 'Ferries from Port Denarau to the Yasawas and Mamanucas leave morning + midday; book at south-seacruises.com.fj at least a day ahead.' },
    neighborhoods: [
      { name: 'Nadi town', blurb: 'Local shops, the Sri Siva Subramaniya Temple, honest curries — not a beach base.' },
      { name: 'Denarau', blurb: 'The resort strip — Hilton, Sheraton, Sofitel — walkable Port Denarau for restaurants.' },
      { name: 'Mamanuca islands', blurb: 'Closer resort islands — 30-90 min ferry — mix of upscale + backpacker.' },
      { name: 'Yasawa islands', blurb: 'Farther-out chain — 2-4 hour ferry — the classic South Pacific island experience.' },
    ],
    safety: 'Very safe — Fijians are famously welcoming. The main hazards are sun, waves, and the occasional cyclone in December-April.',
  },

  'san-juan': {
    bestTimeToVisit: {
      months: 'December–April',
      blurb: 'Dry season with 26-30°C days and cool nights. Skip peak hurricane season (August-October); April-May and November are shoulder weeks with great rates.',
    },
    budget: { budgetDailyUSD: 90, midDailyUSD: 200, luxuryDailyUSD: 500, blurb: 'Not the cheapest Caribbean, but no passport needed for US travelers. Old San Juan boutique hotels $200-300; Isla Verde resort strip $250-500.' },
    travelStyles: {
      family: 'Castillo San Felipe del Morro fort has open ramparts kids can run on; Camuy Caves + El Yunque rainforest are excellent day trips; Isla Verde has calm beaches for young swimmers.',
      couples: 'Sunset on the Old San Juan city walls, salsa dancing at La Concha, and a mofongo dinner at Marmalade or Verde Mesa.',
      solo: 'One of the most solo-safe Caribbean cities. Old San Juan is walkable, bar-and-café dense, and Uber works well.',
    },
    food: [
      { dish: 'Mofongo', note: 'Mashed fried plantains stuffed with garlic + pork rinds (or shrimp, or chicken) — Puerto Rico\'s signature comfort dish.' },
      { dish: 'Lechón asado', note: 'Whole roasted pork — take a day trip to Guavate ("pork highway") on Sunday for the full experience.' },
      { dish: 'Alcapurrias', note: 'Deep-fried plantain-and-yautía fritters stuffed with beef — beachside snack food.' },
      { dish: 'Piña colada', note: 'Invented at the Caribe Hilton in 1954 — order it where it was born.' },
    ],
    transportation: { primary: 'Uber + taxis inside San Juan; rent a car for El Yunque, west coast, and beach day trips.', tips: 'Old San Juan is walkable but cobblestones + hills mean comfortable shoes. Free trolley buses circle the old city.' },
    neighborhoods: [
      { name: 'Old San Juan', blurb: 'Cobblestone colonial core — forts, boutique hotels, restaurants, bars.' },
      { name: 'Condado', blurb: 'Beach + hotel strip with a big-city feel — good for high-end shopping and beachfront resorts.' },
      { name: 'Isla Verde', blurb: 'Airport-adjacent beach strip — El San Juan Hotel and resort chains, calmer swim beaches.' },
      { name: 'Santurce', blurb: 'Puerto Rico\'s art + nightlife district — La Placita del Mercado at night is unmissable.' },
    ],
    safety: 'Safe in tourist areas. Watch for pickpockets in Old San Juan crowds. Avoid the outer barrios after dark unless you\'re with someone local.',
  },

  'playa-del-carmen': {
    bestTimeToVisit: {
      months: 'December–April',
      blurb: 'Dry, warm, low-humidity — the peak Caribbean months. Avoid August-October for hurricane risk; May-July has warmer sea and cheaper rooms but occasional afternoon rain.',
    },
    budget: { budgetDailyUSD: 60, midDailyUSD: 160, luxuryDailyUSD: 500, blurb: 'Cheaper than Cancun but pricier than the rest of Mexico. Boutique Quinta Avenida hotels $150-250; all-inclusive resorts north of town $300+.' },
    travelStyles: {
      family: 'Xcaret, Xel-Ha, and Xplor are the essential family day parks (buy combo tickets online). Cenote Azul + Cenote Cristalino are safe for kids.',
      couples: 'Sunrise at Tulum ruins, breakfast on the beach at Rosa Negra, then a cenote day trip. Book a boutique in the north end of Quinta Avenida for less noise.',
      solo: 'Very solo-friendly — mix of backpacker hostels, hostels-turned-boutique, and a strong walking scene along Quinta Avenida.',
    },
    food: [
      { dish: 'Cochinita pibil', note: 'Yucatán slow-roasted pork wrapped in banana leaves — the essential Riviera Maya lunch.' },
      { dish: 'Tikin Xic', note: 'Grilled Yucatecan fish marinated in achiote paste.' },
      { dish: 'Papadzules', note: 'Egg tacos in a green pumpkin-seed sauce — a Maya classic.' },
      { dish: 'Marquesitas', note: 'Crepe-like street snack filled with Nutella + queso de bola — Quinta Avenida\'s late-night sweet.' },
    ],
    transportation: { primary: 'ADO buses from Cancun airport ($20, 60 min) are the standard. Colectivo vans down Highway 307 are cheaper and reach Tulum + cenotes.', tips: 'Don\'t rent a scooter unless you\'re confident — Highway 307 is fast and dangerous. Uber isn\'t officially permitted; taxis charge tourist rates.' },
    neighborhoods: [
      { name: 'Quinta Avenida (5th Ave.)', blurb: 'Pedestrian shopping and restaurant strip — walk end-to-end for the full evening.' },
      { name: 'Playacar', blurb: 'Gated resort community south of downtown — most all-inclusive resorts are here.' },
      { name: 'Playa Norte', blurb: 'Beach + boutique zone north of Quinta Avenida — quieter, higher-end.' },
    ],
    safety: 'Safe by Mexican standards. Petty theft on beaches; don\'t leave valuables unattended. Late-night club areas can attract pickpockets. Cenotes are generally safe but wear a life jacket for the deeper ones.',
  },

  'cabo-san-lucas': {
    bestTimeToVisit: {
      months: 'October–May',
      blurb: 'Dry, sunny, and warm — perfect resort weather. Whale watching runs January-April. Avoid September\'s hurricane peak.',
    },
    budget: { budgetDailyUSD: 100, midDailyUSD: 260, luxuryDailyUSD: 700, blurb: 'US spring-break-priced. All-inclusive resorts $250-400/person/night; luxury properties (Solaz, One&Only) push $1500+. Airbnbs in Cabo San Lucas town are cheaper.' },
    travelStyles: {
      family: 'Family-friendly resorts (Grand Solmar, Hyatt Ziva) run kids clubs. Whale watching in season is a lifetime memory. Medano Beach is the calmest swim beach in Cabo San Lucas.',
      couples: 'The Cape by Thompson or One&Only Palmilla for the honeymoon splurge; a private sunset cruise around El Arco is the obligatory couples move.',
      solo: 'Less common than Cancun for solo — but Cabo San Lucas town has a strong bar + hostel scene, plus surf schools in San José del Cabo attract solo travelers.',
    },
    food: [
      { dish: 'Marlin tacos', note: 'Cabo\'s big-fish signature — smoked marlin on corn tortillas with salsa fresca.' },
      { dish: 'Aguachile', note: 'Fresh shrimp cured in lime and green chili — Baja\'s answer to ceviche.' },
      { dish: 'Pescadillas', note: 'Fried fish quesadillas — Baja beach food at its most honest.' },
      { dish: 'Chocolate clams', note: 'Cabo\'s local Bahía Almejas mollusk — grilled or in a broth.' },
    ],
    transportation: { primary: 'Los Cabos airport (SJD) is 45 minutes from Cabo San Lucas town. Pre-book a shared or private transfer; the airport taxi mafia charges 3-4× the going rate.', tips: 'The Corridor (highway between San José and Cabo San Lucas) is where most resorts sit. Rent a car for one day only if you want to explore Todos Santos or East Cape.' },
    neighborhoods: [
      { name: 'Cabo San Lucas Marina', blurb: 'The party center — clubs, sport fishing charters, restaurants, sunset booze cruises.' },
      { name: 'Medano Beach', blurb: 'The main swim beach — Nikki Beach, water sports, calm-water resorts.' },
      { name: 'The Corridor', blurb: 'The 30km strip between Cabo San Lucas and San José — resort row.' },
      { name: 'San José del Cabo', blurb: 'The quieter, artsy sister town — Thursday Art Walk, better local restaurants.' },
    ],
    safety: 'Resort areas are very safe. Cabo San Lucas nightlife (Squid Roe, Cabo Wabo) has occasional bar fights and card-skimming — pay cash. Don\'t venture into non-tourist areas at night.',
  },

  ushuaia: {
    bestTimeToVisit: {
      months: 'November–March',
      blurb: 'Southern hemisphere summer — daylight until 10pm, 5-15°C temperatures. December-February is the Antarctica-departure window. Winter (June-September) has skiing.',
    },
    budget: { budgetDailyUSD: 80, midDailyUSD: 200, luxuryDailyUSD: 500, blurb: 'Prices are inflated by the "end of the world" tag. Antarctica cruise passengers pay a premium; regular travelers can find $80-120 mid-range rooms.' },
    travelStyles: {
      family: 'The End of the World Train + Tierra del Fuego National Park loop is a classic family day. Beagle Channel wildlife cruises show sea lions + penguins.',
      couples: 'A romantic remote destination — pair Ushuaia with El Calafate for the Perito Moreno glacier. Cabin accommodations in Ushuaia\'s outskirts are the honeymoon move.',
      solo: 'Backpacker + adventurer crossroads — a strong hostel scene at the base of the mountains. Trekking groups form for Cerro Guanaco + Laguna Esmeralda hikes daily.',
    },
    food: [
      { dish: 'Centolla (king crab)', note: 'Ushuaia\'s signature — fresh from the Beagle Channel; every seafood restaurant does it.' },
      { dish: 'Cordero patagónico', note: 'Patagonian lamb — slow-roasted over an open fire, the classic asado meat.' },
      { dish: 'Merluza negra', note: 'Chilean sea bass — grilled with butter and lemon.' },
      { dish: 'Alfajor + submarino', note: 'The bookend — a chocolate-covered alfajor and a hot chocolate submarino warm you up after a cold hike.' },
    ],
    transportation: { primary: 'Fly LATAM from Buenos Aires (3.5 hours) — Ushuaia\'s airport is 4km from downtown. Local buses reach Tierra del Fuego National Park; taxis for hikes.', tips: 'Book Antarctica cruises 6-12 months ahead. Book Ushuaia hotels well before December-February; the town is small and fills.' },
    neighborhoods: [
      { name: 'Downtown Ushuaia', blurb: 'Main streets, Beagle Channel views, restaurants, hostels.' },
      { name: 'Bahía Golondrina', blurb: 'Peninsula west of downtown — quieter neighborhood, cabin rentals.' },
      { name: 'Cerro Castor', blurb: 'The ski resort 26km east of town — cabins + hotels for winter stays.' },
    ],
    safety: 'Very safe. The main hazards are weather-related — wind, cold, sudden storms in the mountains. Trekking without a guide requires proper gear.',
  },

  'sharm-el-sheikh': {
    bestTimeToVisit: {
      months: 'October–May',
      blurb: 'Warm dry days (22-30°C) with cool nights. Skip mid-July to mid-September; temperatures hit 40°C+. Water is warm year-round for diving.',
    },
    budget: { budgetDailyUSD: 50, midDailyUSD: 120, luxuryDailyUSD: 350, blurb: 'One of the world\'s best-value beach + dive destinations. All-inclusive resorts $80-180/person/night; luxury Red Sea properties (Four Seasons, Rixos) push $500+.' },
    travelStyles: {
      family: 'Family-friendly all-inclusives (Rixos, Baron, Coral Sea) run kids clubs. Ras Mohammed National Park boat trips include reef snorkeling — safe for all ages.',
      couples: 'A honeymoon-favored Red Sea destination — private dive boats to Tiran and Ras Mohammed, then dinner in Naama Bay.',
      solo: 'Popular with European solo divers (PADI dive courses cost 30-40% less than Australia or Thailand). Hostels are rare — most solos stay in mid-range resorts.',
    },
    food: [
      { dish: 'Fatta', note: 'Layered rice, bread, and beef in tomato sauce — the Egyptian holiday-table classic.' },
      { dish: 'Ta\'meya', note: 'Egyptian falafel — made with fava beans instead of chickpeas.' },
      { dish: 'Molokhia', note: 'Green soup made from jute leaves — an acquired texture, but deeply beloved.' },
      { dish: 'Baladi bread + dips', note: 'Fresh pita with hummus, baba ghanoush, tahini, and pickled turnip — the Egyptian breakfast in every hotel.' },
    ],
    transportation: { primary: 'Sharm el-Sheikh International Airport (SSH) receives European charters and direct flights from Cairo (~1 hour). Resort shuttles or private cars to Naama Bay + Sharks Bay.', tips: 'Book dive trips through your hotel or a PADI shop with 5-star reviews — Sinai Divers, Emperor Divers are reliable. Bring cash Euros or USD.' },
    neighborhoods: [
      { name: 'Naama Bay', blurb: 'Main tourist strip — restaurants, dive shops, souks, mid-range hotels.' },
      { name: 'Sharks Bay', blurb: 'Higher-end resorts on the reef edge — home reef diving straight from your hotel beach.' },
      { name: 'Nabq', blurb: 'Newer resort area 15 min north of the airport — quieter, larger all-inclusives.' },
      { name: 'Old Market (Sharm el-Maya)', blurb: 'Original town — cheaper local restaurants, souvenir stalls, more authentic.' },
    ],
    safety: 'Resort areas are heavily patrolled and very safe. Follow Foreign Office advice about Sinai interior — most travelers stay on the coast where restrictions don\'t apply. Watch for tourist-rate scams in Naama Bay taxis; agree on fares first.',
  },
};

/** Check whether we have a rich guide for a given city slug. */
export function hasDestinationGuide(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(DESTINATION_GUIDES, slug);
}

/** Get the guide, or null. */
export function findDestinationGuide(slug: string): DestinationGuide | null {
  return DESTINATION_GUIDES[slug] ?? null;
}
