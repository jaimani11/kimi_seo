import {
  assertValidSection,
  type DiscoverySection,
  type Property,
} from './property';

/**
 * Hand-curated discovery dataset for the homepage browse experience.
 *
 * Four sections, four distinct layouts, ~20 stays total. The data is
 * deliberately editorial: pitch copy is written, amenities are
 * curated for personality, and luxury tags are chosen to differentiate
 * sections without overlap. When Expedia Rapid inventory comes online
 * later, the cards stay identical; the loader just resolves a
 * Property from a Rapid response instead of from this file.
 *
 * Photo IDs were picked from `destination-photo-data.ts` because those
 * IDs have been verified to load reliably on Unsplash. New properties
 * should reuse known-working IDs whenever possible to avoid rot.
 */

// ============== Curated properties ==============
//
// Note on naming: the property `name` is a stay name (real or
// plausible-sounding boutique hotel/villa branding), NOT a destination.
// "Aman Tokyo" not "Tokyo". The destination + neighborhood land below.
// Once Rapid inventory lands these become Rapid property names; the
// shape doesn't change.

const TRENDING_NOW_STAYS: readonly Property[] = [
  {
    id: 'aman-tokyo',
    name: 'Aman Tokyo',
    destination: 'Tokyo',
    country: 'JP',
    neighborhood: 'Otemachi',
    photo: {
      id: '1538970272646-f61fabb3a8a2',
      alt: 'Tokyo Shibuya at night',
      fallbackGradient: ['#0f1c3a', '#5b2466'],
    },
    pricing: { fromUsd: 1480, band: 'aspirational', unit: 'night' },
    rating: { score: 9.7, reviews: 1284 },
    amenities: ['Sky-floor spa', '33rd-floor pool', 'Black-onyx bath'],
    pitch: 'A six-floor lantern above the Imperial Palace gardens, hushed in the way only Aman knows how to do.',
    tags: {
      bestFor: ['couples', 'solo-luxury'],
      vibes: ['city', 'design-led', 'tranquil'],
      luxury: ['michelin-on-site', 'private-onsen', 'butler'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Tokyo, Japan',
      stayId: 'trending-aman-tokyo',
      defaultAdults: 2,
    },
  },
  {
    id: 'le-bristol-paris',
    name: 'Le Bristol Paris',
    destination: 'Paris',
    country: 'FR',
    neighborhood: 'Faubourg Saint-Honoré',
    photo: {
      id: '1502602898657-3e91760cbb34',
      alt: 'Paris rooftops at dusk',
      fallbackGradient: ['#2a2a4a', '#7a5a3a'],
    },
    pricing: { fromUsd: 1620, band: 'aspirational', unit: 'night' },
    rating: { score: 9.6, reviews: 2103 },
    amenities: ['Rooftop pool', 'Resident hôtelier', 'Hermes-stocked bath'],
    pitch: 'The grande dame of the eighth, with a garden you can hear birdsong in three blocks from the Élysée.',
    tags: {
      bestFor: ['couples', 'anniversary'],
      vibes: ['city', 'classic-luxury'],
      luxury: ['michelin-three-star', 'private-garden', 'butler'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Paris, France',
      stayId: 'trending-le-bristol',
      defaultAdults: 2,
    },
  },
  {
    id: 'the-newt-somerset',
    name: 'The Newt in Somerset',
    destination: 'Somerset',
    country: 'GB',
    neighborhood: 'Bruton',
    photo: {
      id: '1486299267070-83823f5448dd',
      alt: 'English countryside estate',
      fallbackGradient: ['#1f2e1a', '#4a6b3a'],
    },
    pricing: { fromUsd: 720, band: 'premium', unit: 'night' },
    rating: { score: 9.4, reviews: 894 },
    amenities: ['Cyder cellar', 'Farm-to-table dining', 'Walled garden'],
    pitch: 'A Georgian estate reimagined as a working farm-stay, where breakfast is whatever the gardener picked at dawn.',
    tags: {
      bestFor: ['couples', 'weekenders'],
      vibes: ['countryside', 'design-led', 'culinary'],
      luxury: ['working-farm', 'estate-stays', 'private-trails'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Somerset, United Kingdom',
      stayId: 'trending-the-newt',
      defaultAdults: 2,
    },
  },
  {
    id: 'shinta-mani-wild',
    name: 'Shinta Mani Wild',
    destination: 'South Cardamom',
    country: 'KH',
    neighborhood: 'Cardamom Rainforest',
    photo: {
      id: '1518095043920-bccaa6f6c95b',
      alt: 'Jungle waterfall and rainforest canopy',
      fallbackGradient: ['#0f2a1a', '#3a6b2a'],
    },
    pricing: { fromUsd: 2400, band: 'aspirational', unit: 'night' },
    rating: { score: 9.8, reviews: 412 },
    amenities: ['Zipline arrival', 'River tents', 'Private naturalist'],
    pitch: 'Arrive by zipline. Sleep in a tent over a waterfall. Walk a wildlife corridor that was nearly logged.',
    tags: {
      bestFor: ['adventure', 'conservation-minded'],
      vibes: ['rainforest', 'wild', 'design-led'],
      luxury: ['butler', 'private-naturalist', 'all-inclusive'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Koh Kong, Cambodia',
      stayId: 'trending-shinta-mani-wild',
      defaultAdults: 2,
    },
  },
  {
    id: 'four-seasons-istanbul',
    name: 'Four Seasons at Sultanahmet',
    destination: 'Istanbul',
    country: 'TR',
    neighborhood: 'Sultanahmet',
    photo: {
      id: '1541432901042-2d8bd64b4a9b',
      alt: 'Istanbul Bosphorus with Hagia Sophia',
      fallbackGradient: ['#2a1a3a', '#7a3a5a'],
    },
    pricing: { fromUsd: 980, band: 'premium', unit: 'night' },
    rating: { score: 9.5, reviews: 1812 },
    amenities: ['Ottoman courtyard', 'Hamam', 'Hagia Sophia views'],
    pitch: 'A converted neoclassical prison, three blocks from the Blue Mosque, with a hamam that smells of bay leaf.',
    tags: {
      bestFor: ['couples', 'culture'],
      vibes: ['city', 'historic', 'culinary'],
      luxury: ['private-hamam', 'historic-building', 'butler'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Sultanahmet, Istanbul, Turkey',
      stayId: 'trending-four-seasons-sultanahmet',
      defaultAdults: 2,
    },
  },
  {
    id: 'soneva-jani',
    name: 'Soneva Jani',
    destination: 'Maldives',
    country: 'MV',
    neighborhood: 'Noonu Atoll',
    photo: {
      id: '1499678329028-101435549a4e',
      alt: 'Maldives overwater bungalows at sunset',
      fallbackGradient: ['#0a4f7a', '#3aafbf'],
    },
    pricing: { fromUsd: 3600, band: 'aspirational', unit: 'night' },
    rating: { score: 9.9, reviews: 642 },
    amenities: ['Retractable roof villa', 'Overwater slide', 'Private chef'],
    pitch: 'A villa whose roof retracts so you can fall asleep counting actual constellations.',
    tags: {
      bestFor: ['honeymoon', 'couples'],
      vibes: ['beach', 'overwater', 'remote-luxury'],
      luxury: ['private-pool', 'butler', 'all-inclusive', 'astronomer-on-site'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Maldives',
      stayId: 'trending-soneva-jani',
      defaultAdults: 2,
    },
  },
];

const ROMANTIC_ESCAPE_STAYS: readonly Property[] = [
  {
    id: 'villa-deste-lake-como',
    name: "Villa d'Este",
    destination: 'Lake Como',
    country: 'IT',
    neighborhood: 'Cernobbio',
    photo: {
      id: '1546412414-e1885259563a',
      alt: 'Lake Como villa with cypress trees at golden hour',
      fallbackGradient: ['#1a3a4a', '#5a8a9a'],
    },
    pricing: { fromUsd: 2100, band: 'aspirational', unit: 'night' },
    rating: { score: 9.7, reviews: 988 },
    amenities: ['Floating pool', 'Renaissance gardens', 'Vintage runabout'],
    pitch: "Five hundred years of someone else's love story, with a floating pool that ought to be illegal it's so pretty.",
    tags: {
      bestFor: ['honeymoon', 'anniversary', 'couples'],
      vibes: ['lake', 'historic', 'classic-luxury'],
      luxury: ['private-boat', 'michelin-on-site', 'butler'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Lake Como, Italy',
      stayId: 'romantic-villa-deste',
      defaultAdults: 2,
    },
  },
  {
    id: 'tawaraya-kyoto',
    name: 'Tawaraya Ryokan',
    destination: 'Kyoto',
    country: 'JP',
    neighborhood: 'Nakagyo',
    photo: {
      id: '1493976040374-85c8e12f0c0e',
      alt: 'Kyoto Fushimi Inari torii at dusk',
      fallbackGradient: ['#3a1a1a', '#8b2c2c'],
    },
    pricing: { fromUsd: 1280, band: 'aspirational', unit: 'night' },
    rating: { score: 9.8, reviews: 312 },
    amenities: ['11-room ryokan', 'Private cedar bath', 'Kaiseki dinners'],
    pitch: 'Three centuries of the same family welcoming you home with a hot bath and a single perfect persimmon.',
    tags: {
      bestFor: ['honeymoon', 'couples'],
      vibes: ['ryokan', 'historic', 'culinary'],
      luxury: ['private-onsen', 'kaiseki', 'family-run'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Kyoto, Japan',
      stayId: 'romantic-tawaraya',
      defaultAdults: 2,
    },
  },
  {
    id: 'la-reserve-paris',
    name: 'La Réserve Paris',
    destination: 'Paris',
    country: 'FR',
    neighborhood: 'Champs-Élysées',
    photo: {
      id: '1502602898657-3e91760cbb34',
      alt: 'Paris rooftops at dusk',
      fallbackGradient: ['#3a2a4a', '#8a5a7a'],
    },
    pricing: { fromUsd: 1820, band: 'aspirational', unit: 'night' },
    rating: { score: 9.6, reviews: 521 },
    amenities: ['Townhouse layout', 'Personal butler', 'Eiffel-view suites'],
    pitch: 'A townhouse that feels borrowed from a friend with absurdly good taste and a view of the Eiffel from bed.',
    tags: {
      bestFor: ['honeymoon', 'anniversary'],
      vibes: ['city', 'classic-luxury', 'intimate'],
      luxury: ['private-butler', 'townhouse', 'eiffel-view'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Paris, France',
      stayId: 'romantic-la-reserve',
      defaultAdults: 2,
    },
  },
  {
    id: 'castello-banfi-tuscany',
    name: 'Castello Banfi Il Borgo',
    destination: 'Tuscany',
    country: 'IT',
    neighborhood: 'Montalcino',
    photo: {
      id: '1500382017468-9049fed747ef',
      alt: 'Rolling hills of the Tuscan-Umbrian border',
      fallbackGradient: ['#3a2a1a', '#aa7a4a'],
    },
    pricing: { fromUsd: 940, band: 'premium', unit: 'night' },
    rating: { score: 9.5, reviews: 478 },
    amenities: ['Brunello cellar', 'Hilltop pool', 'Cooking school'],
    pitch: 'A 13th-century borgo wrapped in vineyards, with a cellar of Brunello you can wander on a rainy afternoon.',
    tags: {
      bestFor: ['couples', 'anniversary'],
      vibes: ['countryside', 'wine', 'historic'],
      luxury: ['private-cellar', 'cooking-school', 'estate-stays'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Montalcino, Tuscany, Italy',
      stayId: 'romantic-castello-banfi',
      defaultAdults: 2,
    },
  },
  {
    id: 'canaves-oia-santorini',
    name: 'Canaves Oia Suites',
    destination: 'Santorini',
    country: 'GR',
    neighborhood: 'Oia',
    photo: {
      id: '1583422409516-2895a77efded',
      alt: 'Mediterranean clifftop village at sunset',
      fallbackGradient: ['#1a3a5a', '#5a8aba'],
    },
    pricing: { fromUsd: 1140, band: 'premium', unit: 'night' },
    rating: { score: 9.4, reviews: 1421 },
    amenities: ['Caldera plunge pool', 'Sunset cellar', 'Cliffside dining'],
    pitch: 'A cave-house cut into the cliff with a plunge pool aimed at the volcano, because of course.',
    tags: {
      bestFor: ['honeymoon', 'couples'],
      vibes: ['mediterranean', 'clifftop', 'romantic'],
      luxury: ['private-plunge', 'caldera-view', 'cave-house'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Oia, Santorini, Greece',
      stayId: 'romantic-canaves-oia',
      defaultAdults: 2,
    },
  },
];

const LUXURY_BEACH_STAYS: readonly Property[] = [
  {
    id: 'cheval-blanc-randheli',
    name: 'Cheval Blanc Randheli',
    destination: 'Maldives',
    country: 'MV',
    neighborhood: 'Noonu Atoll',
    photo: {
      id: '1499678329028-101435549a4e',
      alt: 'Maldives overwater bungalows at sunset',
      fallbackGradient: ['#0a4f7a', '#3aafbf'],
    },
    pricing: { fromUsd: 4200, band: 'aspirational', unit: 'night' },
    rating: { score: 9.9, reviews: 384 },
    amenities: ['Private island villa', 'Guerlain spa', 'LVMH-curated wine cellar'],
    pitch: 'LVMH does Maldivian. Forty-five villas, one Guerlain spa, one cellar that took twelve months to provision.',
    tags: {
      bestFor: ['honeymoon', 'aspirational-couples'],
      vibes: ['beach', 'overwater', 'remote-luxury'],
      luxury: ['private-island', 'butler', 'guerlain-spa', 'all-inclusive'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Maldives',
      stayId: 'luxbeach-cheval-blanc-randheli',
      defaultAdults: 2,
    },
  },
  {
    id: 'borgo-egnazia-puglia',
    name: 'Borgo Egnazia',
    destination: 'Puglia',
    country: 'IT',
    neighborhood: 'Savelletri',
    photo: {
      id: '1523906834658-6e24ef2386f9',
      alt: 'Puglia whitewashed trulli rooftops with sea beyond',
      fallbackGradient: ['#e8d4a8', '#5a8aba'],
    },
    pricing: { fromUsd: 1480, band: 'aspirational', unit: 'night' },
    rating: { score: 9.6, reviews: 1129 },
    amenities: ['Adriatic private beach', 'Vair spa', 'Olive-grove villas'],
    pitch: 'A pretend-old village built on a real Puglian olive grove, with a private Adriatic beach that nobody talks about.',
    tags: {
      bestFor: ['couples', 'families'],
      vibes: ['beach', 'mediterranean', 'design-led'],
      luxury: ['private-beach', 'spa', 'olive-grove'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Savelletri, Puglia, Italy',
      stayId: 'luxbeach-borgo-egnazia',
      defaultAdults: 2,
    },
  },
];

const HIDDEN_GEM_STAYS: readonly Property[] = [
  {
    id: 'hotel-castello-di-reschio',
    name: 'Reschio Estate',
    destination: 'Umbria',
    country: 'IT',
    neighborhood: 'Lisciano Niccone',
    photo: {
      id: '1500382017468-9049fed747ef',
      alt: 'Umbrian hills with farmhouse',
      fallbackGradient: ['#3a2a1a', '#aa7a4a'],
    },
    pricing: { fromUsd: 1320, band: 'aspirational', unit: 'night' },
    rating: { score: 9.7, reviews: 287 },
    amenities: ['Horse stable', 'Truffle hunting', 'Pizza barn'],
    pitch: "A 1,500-acre estate wrapped around a tenth-century castle, with 50 horses and a pizza barn nobody mentions until you arrive.",
    tags: {
      bestFor: ['couples', 'horse-people'],
      vibes: ['countryside', 'historic', 'design-led'],
      luxury: ['private-estate', 'equestrian', 'truffle-season'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Umbria, Italy',
      stayId: 'hidden-reschio',
      defaultAdults: 2,
    },
  },
  {
    id: 'fogo-island-inn',
    name: 'Fogo Island Inn',
    destination: 'Fogo Island',
    country: 'CA',
    neighborhood: 'Joe Batt’s Arm',
    photo: {
      id: '1486870591958-9b9d0d1dda99',
      alt: 'Rugged North Atlantic coast under low sky',
      fallbackGradient: ['#1a2a3a', '#5a7a9a'],
    },
    pricing: { fromUsd: 1820, band: 'aspirational', unit: 'stay' },
    rating: { score: 9.6, reviews: 412 },
    amenities: ['Iceberg-watch deck', 'Rooftop sauna', 'Community-owned'],
    pitch: 'A 29-room inn perched on the edge of the North Atlantic. Profits flow back to the island. The icebergs arrive in June.',
    tags: {
      bestFor: ['solo', 'design-pilgrims'],
      vibes: ['coastal', 'design-led', 'remote'],
      luxury: ['rooftop-sauna', 'community-owned', 'iceberg-season'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Fogo Island, Newfoundland, Canada',
      stayId: 'hidden-fogo-island',
      defaultAdults: 2,
    },
  },
  {
    id: 'kasbah-bab-ourika',
    name: 'Kasbah Bab Ourika',
    destination: 'Atlas Mountains',
    country: 'MA',
    neighborhood: 'Ourika Valley',
    photo: {
      id: '1539020140153-e8c81bb6b8a4',
      alt: 'Atlas mountain valley with mud-walled kasbah',
      fallbackGradient: ['#8b4a2a', '#d4a574'],
    },
    pricing: { fromUsd: 480, band: 'premium', unit: 'night' },
    rating: { score: 9.5, reviews: 318 },
    amenities: ['Mountaintop hammam', 'Atlas-view pool', 'Berber breakfast'],
    pitch: 'A mud-walled kasbah on a hilltop 45 minutes from Marrakech, where dawn smells of bread baked in clay.',
    tags: {
      bestFor: ['couples', 'culture'],
      vibes: ['mountain', 'desert', 'cultural'],
      luxury: ['mountaintop-pool', 'private-hammam', 'berber-cuisine'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Ourika Valley, Morocco',
      stayId: 'hidden-kasbah-bab-ourika',
      defaultAdults: 2,
    },
  },
  {
    id: 'estancia-vik-jose-ignacio',
    name: 'Estancia Vik',
    destination: 'José Ignacio',
    country: 'UY',
    neighborhood: 'Maldonado',
    photo: {
      id: '1486870591958-9b9d0d1dda99',
      alt: 'Open grasslands with low estancia at golden hour',
      fallbackGradient: ['#2a3a1a', '#aaaa6a'],
    },
    pricing: { fromUsd: 920, band: 'premium', unit: 'night' },
    rating: { score: 9.5, reviews: 196 },
    amenities: ['Polo field', 'Open-fire asado', 'Surfable beach'],
    pitch: 'A working estancia 20 minutes from a beach surfers fly in for. Polo on Tuesdays. Asado every night.',
    tags: {
      bestFor: ['couples', 'horse-people'],
      vibes: ['countryside', 'beach', 'art'],
      luxury: ['polo-field', 'private-asado', 'artist-curated'],
    },
    cancellation: 'free-flexible',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Jose Ignacio, Uruguay',
      stayId: 'hidden-estancia-vik',
      defaultAdults: 2,
    },
  },
  {
    id: 'azulik-tulum',
    name: 'Azulik',
    destination: 'Tulum',
    country: 'MX',
    neighborhood: 'Tulum Beach',
    photo: {
      id: '1505228395891-9a51e7e86bf6',
      alt: 'Treehouse villa above turquoise water and jungle',
      fallbackGradient: ['#1a4a3a', '#5aaa8a'],
    },
    pricing: { fromUsd: 780, band: 'premium', unit: 'night' },
    rating: { score: 9.3, reviews: 1124 },
    amenities: ['Treehouse villas', 'Cenote spa', 'No-electricity nights'],
    pitch: 'Treehouses with no wifi, no electricity after sundown, and a chef who serves dinner by candlelight on a jungle floor.',
    tags: {
      bestFor: ['couples', 'disconnect'],
      vibes: ['jungle', 'beach', 'design-led'],
      luxury: ['private-treehouse', 'cenote-spa', 'off-grid'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'Tulum, Mexico',
      stayId: 'hidden-azulik',
      defaultAdults: 2,
    },
  },
  {
    id: 'wolwedans-namibrand',
    name: 'Wolwedans Dunes Lodge',
    destination: 'NamibRand',
    country: 'NA',
    neighborhood: 'Namib Desert',
    photo: {
      id: '1531168556467-80aace0d0144',
      alt: 'Red dunes of the Namib desert at sunrise',
      fallbackGradient: ['#aa4a2a', '#5a2a1a'],
    },
    pricing: { fromUsd: 1140, band: 'premium', unit: 'night' },
    rating: { score: 9.6, reviews: 184 },
    amenities: ['Dune-edge tents', 'Sundown gin point', 'Stargazing deck'],
    pitch: 'Tented suites on the lip of a red dune that goes on for forty thousand acres of nothing else.',
    tags: {
      bestFor: ['couples', 'adventure'],
      vibes: ['desert', 'remote', 'stargazing'],
      luxury: ['private-tent', 'stargazer-on-site', 'conservation'],
    },
    cancellation: 'free-limited',
    affiliate: {
      providerId: 'expedia',
      searchDestination: 'NamibRand Nature Reserve, Namibia',
      stayId: 'hidden-wolwedans',
      defaultAdults: 2,
    },
  },
];

// ============== Sections ==============

export const DISCOVERY_SECTIONS: readonly DiscoverySection[] = [
  {
    slug: 'trending-now',
    eyebrow: 'Trending now',
    title: 'Where StayScout travelers are landing this month.',
    subtitle: 'Six stays our concierge is asked about most often right now. Tap any card to search the partner with your dates already filled in.',
    layout: { variant: 'carousel' },
    properties: TRENDING_NOW_STAYS,
  },
  {
    slug: 'romantic-escapes',
    eyebrow: 'Romantic escapes',
    title: 'For the trip that needs to be a little quieter.',
    subtitle: 'Honeymoons, anniversaries, the deliberate kind of weekend. Stays that lean into ritual, slowness, and a single excellent dinner.',
    layout: { variant: 'hero-rail' },
    properties: ROMANTIC_ESCAPE_STAYS,
  },
  {
    slug: 'luxury-beach-stays',
    eyebrow: 'Luxury beach',
    title: 'Two ways to wake up next to the water.',
    subtitle: 'A long-haul private island and a Mediterranean grove with a hidden Adriatic beach. Both ridiculous in the best way.',
    layout: {
      variant: 'editorial-slab',
      copy: {
        headline: 'When you want the photograph to be true.',
        body: 'These two stays are unusual even by aspirational standards. The first is one of LVMHs private islands. The second is the kind of place Italian families guard the address of. Pick the climate; the rest tracks.',
      },
    },
    properties: LUXURY_BEACH_STAYS,
  },
  {
    slug: 'hidden-gems',
    eyebrow: 'Hidden gems',
    title: 'Places StayScout would send a friend to.',
    subtitle: 'Less Instagrammed, more loved. The stays our concierge mentions when somebody says, surprise me.',
    layout: { variant: 'grid' },
    properties: HIDDEN_GEM_STAYS,
  },
];

// Build-time sanity: every section must satisfy its layout invariants.
// Running at module-load means a misconfigured section fails the
// homepage on first render, not silently in production.
for (const section of DISCOVERY_SECTIONS) {
  assertValidSection(section);
}
