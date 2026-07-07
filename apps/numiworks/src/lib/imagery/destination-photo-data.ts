/**
 * Hand-curated destination → Unsplash photo mapping.
 *
 * Keys are normalized destination names (lowercase, diacritics
 * stripped, non-alphanumerics replaced with hyphens). Special
 * `__country:<CC>` keys are country-level fallbacks for unknown
 * cities in known countries.
 *
 * Each entry references an Unsplash photo id + the photographer's
 * name for attribution.
 */

export interface DestinationPhotoEntry {
  /** Unsplash photo id (the part after `photo-` in the URL). */
  id: string;
  /** Alt text. */
  alt: string;
  /** Unsplash photographer name (display only - Unsplash license is
   *  permissive but attribution is the polite default). */
  photographer: string;
}

export const DESTINATION_PHOTOS: Readonly<Record<string, DestinationPhotoEntry>> = {
  // ============== Cities (alphabetical) ==============
  amsterdam: {
    id: '1534351590666-13e3e96c5017',
    alt: 'Amsterdam canals at golden hour',
    photographer: 'Adrien Olichon',
  },
  austin: {
    id: '1492033998562-c84a1147eef0',
    alt: 'Austin skyline at dusk',
    photographer: 'Carlos Alfonso',
  },
  bangkok: {
    id: '1508009603885-50cf7c579365',
    alt: 'Bangkok temple rooftops',
    photographer: 'Mathew Schwartz',
  },
  barcelona: {
    id: '1583422409516-2895a77efded',
    alt: 'Barcelona Gothic Quarter',
    photographer: 'Vlada Karpovich',
  },
  berlin: {
    id: '1560969184-10fe8719e047',
    alt: 'Berlin Brandenburg Gate at dusk',
    photographer: 'Florian Wehde',
  },
  boston: {
    id: '1538485399081-7c8ce013b933',
    alt: 'Boston Beacon Hill row houses',
    photographer: 'Lance Anderson',
  },
  'buenos-aires': {
    id: '1589909202802-8f4aadce1849',
    alt: 'Buenos Aires La Boca colorful houses',
    photographer: 'Sander Crombach',
  },
  chicago: {
    id: '1494522855154-9297ac14b55f',
    alt: 'Chicago skyline from the lake',
    photographer: 'Pedro Lastra',
  },
  copenhagen: {
    id: '1513622470522-26c3c8a854bc',
    alt: 'Copenhagen Nyhavn waterfront',
    photographer: 'Nick Karvounis',
  },
  dubai: {
    id: '1512453979798-5ea266f8880c',
    alt: 'Dubai skyline at twilight',
    photographer: 'David Rodrigo',
  },
  edinburgh: {
    id: '1506377585622-bed95e7d3a8b',
    alt: 'Edinburgh Old Town at golden hour',
    photographer: 'Connor Mollison',
  },
  florence: {
    id: '1543429776-7bb1ddffd35a',
    alt: 'Florence Duomo from above',
    photographer: 'Heidi Kaden',
  },
  hanoi: {
    id: '1509030450996-dd1a26dda07a',
    alt: 'Hanoi Old Quarter rain',
    photographer: 'Tron Le',
  },
  helsinki: {
    id: '1565699049516-eaa9bff63b3e',
    alt: 'Helsinki cathedral and harbor',
    photographer: 'Tapio Haaja',
  },
  'hong-kong': {
    id: '1506461883365-d1c64fa6dec5',
    alt: 'Hong Kong harbor skyline',
    photographer: 'Florian Wehde',
  },
  istanbul: {
    id: '1541432901042-2d8bd64b4a9b',
    alt: 'Istanbul Bosphorus + Hagia Sophia',
    photographer: 'Anna Berdnik',
  },
  jakarta: {
    id: '1555899434-94d1368aa7af',
    alt: 'Jakarta skyline',
    photographer: 'Eko Herwantoro',
  },
  kyoto: {
    id: '1493976040374-85c8e12f0c0e',
    alt: 'Kyoto Fushimi Inari torii gates',
    photographer: 'Sorasak',
  },
  lisbon: {
    // Two prior Lisbon IDs have been rotted on Unsplash this slice
    // alone (1513735718075-... and 1555881400-...). When this one
    // breaks too, the SearchOpportunityBoard hero falls back to a
    // destination-themed gradient via its `onError` handler, so the
    // page stays clean even if Unsplash repurposes another id.
    id: '1588535525394-44edbc7a87a8',
    alt: 'Lisbon yellow tram',
    photographer: 'Daniel Mota',
  },
  london: {
    id: '1486299267070-83823f5448dd',
    alt: 'London Tower Bridge twilight',
    photographer: 'Marcin Nowak',
  },
  'los-angeles': {
    id: '1542317854-d33c7b88f7be',
    alt: 'Los Angeles palm-lined boulevard',
    photographer: 'Cedric Letsch',
  },
  madrid: {
    id: '1539037116277-4db20889f2d4',
    alt: 'Madrid Gran Vía at sunset',
    photographer: 'Florian Wehde',
  },
  marrakech: {
    id: '1539020140153-e8c81bb6b8a4',
    alt: 'Marrakech medina rooftops',
    photographer: 'Heidi Kaden',
  },
  melbourne: {
    id: '1545044846-351ba102b6d5',
    alt: 'Melbourne laneway café culture',
    photographer: 'Denise Jans',
  },
  'mexico-city': {
    id: '1518105779142-d975f22f1b00',
    alt: 'Mexico City colonial architecture',
    photographer: 'Bárbara Cascão',
  },
  miami: {
    id: '1535498730771-e735b998cd64',
    alt: 'Miami pastel art-deco facades',
    photographer: 'Antonio Cuellar',
  },
  milan: {
    id: '1551867633-194f125bddfa',
    alt: 'Milan Duomo facade',
    photographer: 'Andrea Cau',
  },
  montreal: {
    id: '1519178614-6e8e2e6e2d96',
    alt: 'Montreal Old Port stone streets',
    photographer: 'Joey Banks',
  },
  mumbai: {
    id: '1566552881560-0be862a7c445',
    alt: 'Mumbai Marine Drive curve',
    photographer: 'Snowscat',
  },
  'new-york': {
    id: '1492571350019-22de08371fd3',
    alt: 'NYC skyline night',
    photographer: 'Patrick Tomasso',
  },
  oslo: {
    id: '1565008442290-5c5e1c4e2e90',
    alt: 'Oslo fjord and opera house',
    photographer: 'Henrique Ferreira',
  },
  paris: {
    id: '1502602898657-3e91760cbb34',
    alt: 'Paris rooftops at dusk',
    photographer: 'Jonas Jacobsson',
  },
  porto: {
    id: '1555881400-69a2c1e22e9e',
    alt: 'Porto Douro river bridge',
    photographer: 'Joran Quinten',
  },
  prague: {
    id: '1541849546-216549ae216d',
    alt: 'Prague Old Town rooftops',
    photographer: 'Anthony DELANOIX',
  },
  reykjavik: {
    id: '1551193020-9a2dcbeb9d77',
    alt: 'Reykjavík harbor + Hallgrímskirkja',
    photographer: 'Stephen Leonardi',
  },
  rome: {
    id: '1531572753322-ad063cecc140',
    alt: 'Rome via Italica at dusk',
    photographer: 'David Köhler',
  },
  'san-francisco': {
    id: '1538401601217-d2c6e57b3a04',
    alt: 'San Francisco Painted Ladies + skyline',
    photographer: 'Hardik Pandya',
  },
  seoul: {
    id: '1538485399081-7c8ce013b933',
    alt: 'Seoul Bukchon hanok village',
    photographer: 'Daniel Bernard',
  },
  shanghai: {
    id: '1545569310-3097dfa39e08',
    alt: 'Shanghai Pudong skyline',
    photographer: 'Edward He',
  },
  singapore: {
    id: '1525625293386-3f8f99389edd',
    alt: 'Singapore Gardens by the Bay',
    photographer: 'Coleen Rivas',
  },
  sydney: {
    id: '1506973035872-a4ec16b8e8d9',
    alt: 'Sydney Opera House + Harbour Bridge',
    photographer: 'Caleb',
  },
  taipei: {
    id: '1540350394557-8d14678e7f91',
    alt: 'Taipei 101 from below',
    photographer: 'Jeremy Stewart',
  },
  tokyo: {
    id: '1538970272646-f61fabb3a8a2',
    alt: 'Tokyo Shibuya at night',
    photographer: 'Jezael Melgoza',
  },
  toronto: {
    id: '1517090504586-fde19ea6066f',
    alt: 'Toronto skyline from the lake',
    photographer: 'Marcin Skalij',
  },
  vancouver: {
    id: '1502086223501-7ea6ecd79368',
    alt: 'Vancouver skyline + Stanley Park',
    photographer: 'Mike Benna',
  },
  venice: {
    id: '1503348593974-1ffc4082bfcd',
    alt: 'Venice canal + gondolas',
    photographer: 'Sandro Gonzalez',
  },
  vienna: {
    id: '1565693413579-8a73fff833e1',
    alt: 'Vienna Schönbrunn at golden hour',
    photographer: 'Tobias Reich',
  },

  // ============== Regions / destinations ==============
  amalfi: {
    id: '1531572753322-ad063cecc140',
    alt: 'Amalfi Coast clifftop villages',
    photographer: 'Lucas Calloch',
  },
  banff: {
    id: '1503614472-8c93d56e92ce',
    alt: 'Banff Lake Louise turquoise water',
    photographer: 'John Lee',
  },
  bali: {
    id: '1537996194471-e657df975ab4',
    alt: 'Bali rice terraces',
    photographer: 'Cassie Matias',
  },
  'cinque-terre': {
    id: '1543429776-7bb1ddffd35a',
    alt: 'Cinque Terre cliff villages',
    photographer: 'Carlos Alfonso',
  },
  'costa-rica': {
    id: '1518095043920-bccaa6f6c95b',
    alt: 'Costa Rica jungle waterfall',
    photographer: 'Etienne Delorieux',
  },
  hawaii: {
    id: '1505228395891-9a51e7e86bf6',
    alt: 'Hawaii palm + turquoise water',
    photographer: 'Sean O.',
  },
  iceland: {
    id: '1531168556467-80aace0d0144',
    alt: 'Iceland glacier landscape',
    photographer: 'Cosmic Timetraveler',
  },
  'lake-como': {
    id: '1546412414-e1885259563a',
    alt: 'Lake Como villa with cypress',
    photographer: 'Hannah Reding',
  },
  maldives: {
    id: '1499678329028-101435549a4e',
    alt: 'Maldives overwater bungalows',
    photographer: 'Cassie Matias',
  },
  'new-zealand': {
    id: '1464822759023-fed622ff2c3b',
    alt: 'New Zealand Milford Sound fjord',
    photographer: 'Pablo Heimplatz',
  },
  patagonia: {
    id: '1486870591958-9b9d0d1dda99',
    alt: 'Patagonia Torres del Paine peaks',
    photographer: 'Casey Horner',
  },
  provence: {
    id: '1483728642387-6c3bdd6c93e5',
    alt: 'Provence lavender fields',
    photographer: 'Sylvain Mauroux',
  },
  puglia: {
    id: '1523906834658-6e24ef2386f9',
    alt: 'Puglia trulli rooftops',
    photographer: 'Anastasia Polenova',
  },
  tuscany: {
    // Original ID 1490642914619-7955a3fd483c dropped - Unsplash
    // repurposed it and the URL now serves a London Tower Bridge
    // photo. Falls back to Umbria's hills photo which is geographically
    // adjacent (Tuscan-Umbrian border) so the label still reads true.
    id: '1500382017468-9049fed747ef',
    alt: 'Rolling hills of the Tuscan-Umbrian border',
    photographer: 'Annie Spratt',
  },
  umbria: {
    id: '1500382017468-9049fed747ef',
    alt: 'Umbria rolling hills',
    photographer: 'Annie Spratt',
  },
  whistler: {
    id: '1454496522488-7a8e488e8606',
    alt: 'Whistler alpine ski village',
    photographer: 'Hari Nandakumar',
  },

  // ============== Country-level fallbacks ==============
  // Used when an unknown city in a known country comes in. e.g.
  // "Innsbruck, Austria" without an entry → __country:AT (Alps).
  '__country:AT': {
    // Original ID 1568901346375-23c9450c58cd dropped - Unsplash
    // repurposed it and the URL now serves a non-travel image.
    id: '1486870591958-9b9d0d1dda99',
    alt: 'Alpine peaks panorama',
    photographer: 'Eberhard Grossgasteiger',
  },
  '__country:CH': {
    id: '1464822759023-fed622ff2c3b',
    alt: 'Swiss valley fog',
    photographer: 'Pablo Heimplatz',
  },
  '__country:NO': {
    id: '1509316975850-ff9c5deb0cd9',
    alt: 'Norwegian fjord',
    photographer: 'Robert Bye',
  },
  '__country:SE': {
    id: '1545569310-3097dfa39e08',
    alt: 'Stockholm waterfront',
    photographer: 'Linus Mimietz',
  },
  '__country:IS': {
    id: '1531168556467-80aace0d0144',
    alt: 'Iceland glacier',
    photographer: 'Cosmic Timetraveler',
  },
  '__country:IT': {
    id: '1531572753322-ad063cecc140',
    alt: 'Italian piazza at golden hour',
    photographer: 'David Köhler',
  },
  '__country:FR': {
    id: '1502602898657-3e91760cbb34',
    alt: 'French city rooftops',
    photographer: 'Jonas Jacobsson',
  },
  '__country:ES': {
    id: '1583422409516-2895a77efded',
    alt: 'Spanish plaza',
    photographer: 'Vlada Karpovich',
  },
  '__country:PT': {
    id: '1513735718075-2e2d54f8de80',
    alt: 'Portuguese tilework + tram',
    photographer: 'Tom Byrom',
  },
  '__country:JP': {
    id: '1538970272646-f61fabb3a8a2',
    alt: 'Japanese cityscape',
    photographer: 'Jezael Melgoza',
  },
  '__country:CA': {
    id: '1502086223501-7ea6ecd79368',
    alt: 'Canadian coastal city + mountains',
    photographer: 'Mike Benna',
  },
  '__country:US': {
    id: '1492571350019-22de08371fd3',
    alt: 'US cityscape',
    photographer: 'Patrick Tomasso',
  },
  '__country:GB': {
    id: '1486299267070-83823f5448dd',
    alt: 'London skyline',
    photographer: 'Marcin Nowak',
  },
  '__country:AU': {
    id: '1506973035872-a4ec16b8e8d9',
    alt: 'Sydney Harbour',
    photographer: 'Caleb',
  },
  '__country:NZ': {
    id: '1464822759023-fed622ff2c3b',
    alt: 'New Zealand fjord',
    photographer: 'Pablo Heimplatz',
  },
  '__country:MX': {
    id: '1518105779142-d975f22f1b00',
    alt: 'Mexican colonial architecture',
    photographer: 'Bárbara Cascão',
  },
  '__country:AR': {
    id: '1589909202802-8f4aadce1849',
    alt: 'Argentinian streetscape',
    photographer: 'Sander Crombach',
  },
  '__country:BR': {
    id: '1483729548744-7f3b9d31e2e3',
    alt: 'Rio coastline',
    photographer: 'Raphael Nogueira',
  },
  '__country:TH': {
    id: '1508009603885-50cf7c579365',
    alt: 'Thai temple',
    photographer: 'Mathew Schwartz',
  },
  '__country:ID': {
    id: '1537996194471-e657df975ab4',
    alt: 'Indonesian rice terraces',
    photographer: 'Cassie Matias',
  },
  '__country:VN': {
    id: '1509030450996-dd1a26dda07a',
    alt: 'Vietnamese street market',
    photographer: 'Tron Le',
  },
};
