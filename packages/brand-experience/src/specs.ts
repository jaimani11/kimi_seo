import type { BrandId, BrandSpec, CityFacts, Chip } from './contracts';

/**
 * BRAND_SPECS — the declarative identity of each brand. Only the two shipped
 * brands (gobookt, gotript) are specced here; numiworks + stayviaowner are
 * added when their pages are refactored onto the engine (their entries are
 * absent until then, and the planner/validator guard against that).
 */

// ── gobookt: accommodation-decision ─────────────────────────────────────────

const RESORT_DESTINATIONS = new Set<string>([
  'bali', 'cancun', 'santorini', 'phuket', 'maldives', 'punta-cana', 'tulum',
  'nusa-dua', 'phu-quoc', 'mauritius', 'maui', 'bora-bora', 'krabi', 'zanzibar',
]);

function accommodationTypes(facts: CityFacts): Chip[] {
  const base: Chip[] = [
    { label: 'Hotels', note: 'The broadest choice — city-center to budget chains, bookable on Booking.com.' },
    { label: 'Boutique hotels', note: 'Smaller, design-led stays with a local feel.' },
    { label: 'Aparthotels', note: 'Hotel service with a kitchenette — handy for longer stays.' },
    { label: 'Apartments', note: 'Self-catering city apartments for more space than a room.' },
    { label: 'B&Bs & guesthouses', note: 'Smaller, host-run stays, often in residential areas.' },
    { label: 'Hostels', note: 'Private and shared rooms for budget-minded and solo trips.' },
  ];
  if (RESORT_DESTINATIONS.has(facts.slug)) {
    base.splice(1, 0, { label: 'Resorts', note: 'Full-service leisure resorts, common in and around this destination.' });
  }
  return base;
}

const GOBOOKT: BrandSpec = {
  brand: 'gobookt',
  purpose: 'Help someone choose accommodation.',
  audience: 'Travelers deciding where and what type of stay to book.',
  primaryQuestion: 'Where should I stay?',
  narrative: 'Compare areas and stay types, then continue to Booking.com for live availability.',
  providers: { primary: 'booking' },
  hero: (f) => ({
    eyebrow: `${f.countryName} · ${f.region.toUpperCase()}`,
    heading: `Where to stay in ${f.name}`,
    subhead: `Compare the best areas and stay types in ${f.name}, then continue to Booking.com for live availability and prices.`,
  }),
  sections: [
    {
      id: 'best-areas',
      kind: 'area-cards',
      eyebrow: 'Where to base yourself',
      heading: () => 'Best areas to stay',
      build: (f, a) => ({
        kind: 'area-cards',
        intro: 'Pick the area that puts you closest to what you came for, then search live stays there.',
        areas: f.neighborhoods.map((n) => ({
          name: n.name,
          blurb: n.blurb,
          href: a.primarySearchHref(`${n.name}, ${f.name}`),
          ctaLabel: `Search ${n.name} stays`,
        })),
      }),
    },
    {
      id: 'compare',
      kind: 'compare-map',
      eyebrow: 'On the map',
      heading: (f) => `Compare ${f.name} neighborhoods`,
      build: (f, a) => ({
        kind: 'compare-map',
        intro: "Areas compared by distance from the centre and their general character — not by price or availability, which you'll see live on Booking.com.",
        pins: f.neighborhoodPois.map((n) => ({
          name: n.name,
          lat: n.lat,
          lng: n.lng,
          kind: 'neighborhood' as const,
          href: a.primarySearchHref(`${n.name}, ${f.name}`) ?? undefined,
          ctaLabel: `Search ${n.name} stays →`,
        })),
      }),
    },
    {
      id: 'types',
      kind: 'chip-grid',
      eyebrow: 'What to book',
      heading: (f) => `Types of stay in ${f.name}`,
      build: (f) => ({ kind: 'chip-grid', intro: '', chips: accommodationTypes(f) }),
    },
    {
      id: 'who-suits',
      kind: 'profile-list',
      eyebrow: 'Match your trip',
      heading: () => 'Who each area suits',
      build: (f) => ({
        kind: 'profile-list',
        items: [
          { label: 'Families', text: f.travelStyles.family },
          { label: 'Couples', text: f.travelStyles.couples },
          { label: 'Solo travelers', text: f.travelStyles.solo },
        ],
      }),
    },
    {
      id: 'seasonality',
      kind: 'climate',
      eyebrow: 'Seasonality',
      heading: () => 'When to plan your stay',
      build: (f) =>
        f.climate
          ? {
              kind: 'climate',
              intro: `${f.bestTime.months} are popular times to visit ${f.name}. Choosing your dates earlier gives you more time to compare areas and stay types before you continue to Booking.com for live availability.`,
            }
          : null,
    },
    {
      id: 'practical',
      kind: 'prose',
      eyebrow: 'Before you book',
      heading: () => 'Practical things to weigh',
      build: (f) => ({
        kind: 'prose',
        paragraphs: [
          `${f.transportation.primary} ${f.transportation.tips} When picking an area, weigh how easily you can reach it from the airport and move between the places you plan to visit. ${f.safety}`,
        ],
      }),
    },
  ],
  faqPolicy: (f) => [
    {
      question: `Which area should I stay in when visiting ${f.name}?`,
      answer: f.neighborhoods.length
        ? `Popular areas to stay in ${f.name} include ${f.neighborhoods.map((n) => n.name).join(', ')}. ${f.neighborhoods[0]?.blurb ?? ''} Compare areas by how close they are to what you came for, then check live availability on Booking.com.`
        : `Compare central and quieter areas of ${f.name} by proximity and transit access, then check live availability on Booking.com.`,
    },
    {
      question: `What types of accommodation can I book in ${f.name}?`,
      answer: `${f.name} has a range of hotel-style stays on Booking.com — hotels, boutique hotels, aparthotels, apartments, B&Bs and hostels${RESORT_DESTINATIONS.has(f.slug) ? ', plus resorts' : ''}. Choose the type that fits your trip and continue to Booking.com for live options.`,
    },
    { question: `Is ${f.name} a good base for families?`, answer: f.travelStyles.family },
    { question: `When are popular times to visit ${f.name}?`, answer: `${f.bestTime.months} are popular times to visit ${f.name}. ${f.bestTime.blurb}` },
  ],
  schemaDescription: (f) => `Where to stay in ${f.name}: compare the best areas and accommodation types, then book on Booking.com.`,
  linkPolicy: (f) => [
    { label: `Hotels in ${f.name}`, href: `/hotels-in-${f.slug}` },
    { label: 'All destinations', href: '/destinations' },
  ],
  forbiddenSections: ['ai-prompt', 'itinerary-links', 'decision-card'],
  requiredSections: ['area-cards', 'chip-grid'],
};

// ── gotript: trip-planning ──────────────────────────────────────────────────

const GOTRIPT: BrandSpec = {
  brand: 'gotript',
  purpose: 'Help someone plan the trip.',
  audience: 'Travelers organizing when to go, how long, and what to do.',
  primaryQuestion: 'How should I organize my visit?',
  narrative: 'Plan the trip end to end, then hand off to Expedia (hotels) or Vrbo (whole homes).',
  providers: { primary: 'expedia', secondary: 'vrbo' },
  hero: (f) => ({
    eyebrow: `${f.countryName} · ${f.region.toUpperCase()}`,
    heading: `The ${f.name} Travel Guide`,
    subhead: `Your ${f.name} trip, planned — when to go, how many days you need, and where to base yourself, mapped out before you book.`,
  }),
  sections: [
    {
      id: 'timing',
      kind: 'climate',
      eyebrow: 'Step 1 · Timing',
      heading: (f) => `When to visit ${f.name}`,
      build: (f) => ({
        kind: 'climate',
        intro: `${f.bestTime.months} are popular times to visit ${f.name}. ${f.bestTime.blurb} Deciding your dates first shapes the rest of the plan — how many days to spend and which area to base yourself in.`,
      }),
    },
    {
      id: 'trip-length',
      kind: 'itinerary-links',
      eyebrow: 'Step 2 · Trip length',
      heading: (f) => `How many days in ${f.name}?`,
      build: (f) => ({
        kind: 'itinerary-links',
        intro: `Pick a length and follow a ready-made ${f.name} itinerary — each one sequences the sights so your days flow without backtracking.`,
        options: [3, 5, 7].map((d) => ({ days: d, label: `${d}-day ${f.name} itinerary`, href: `/${f.slug}-${d}-day-itinerary` })),
      }),
    },
    {
      id: 'itinerary',
      kind: 'prose',
      eyebrow: 'Step 3 · Itinerary',
      heading: (f) => `Build your ${f.name} itinerary`,
      build: (f) => ({
        kind: 'prose',
        paragraphs: [
          `A good ${f.name} plan bases you in one central area, groups nearby sights into each day, and leaves room to slow down. Start from a day-by-day itinerary above, then adjust the order to your dates and pace.`,
        ],
      }),
    },
    {
      id: 'base',
      kind: 'area-cards',
      eyebrow: 'Step 4 · Your base',
      heading: () => 'Where to base yourself',
      build: (f, a) => ({
        kind: 'area-cards',
        intro: 'A central base cuts travel time between sights. Compare areas, then check stays.',
        areas: f.neighborhoods.map((n) => ({
          name: n.name,
          blurb: n.blurb,
          href: a.primarySearchHref(`${n.name}, ${f.name}`),
          ctaLabel: `Stays in ${n.name}`,
        })),
      }),
    },
    {
      id: 'map',
      kind: 'compare-map',
      eyebrow: 'On the map',
      heading: (f) => `${f.name} at a glance`,
      build: (f, a) => ({
        kind: 'compare-map',
        intro: 'Neighborhoods and landmarks with walking distances from the centre.',
        pins: f.neighborhoodPois.map((n) => ({
          name: n.name,
          lat: n.lat,
          lng: n.lng,
          kind: 'neighborhood' as const,
          href: a.primarySearchHref(`${n.name}, ${f.name}`) ?? undefined,
          ctaLabel: `Stays in ${n.name} →`,
        })),
      }),
    },
    {
      id: 'transport',
      kind: 'prose',
      eyebrow: 'Step 5 · Transport',
      heading: (f) => `Getting around ${f.name}`,
      build: (f) => ({ kind: 'prose', paragraphs: [`${f.transportation.primary} ${f.transportation.tips}`] }),
    },
    {
      id: 'trip-style',
      kind: 'profile-list',
      eyebrow: 'Step 6 · Your trip',
      heading: () => 'Plan by trip style',
      build: (f) => ({
        kind: 'profile-list',
        items: [
          { label: 'Family trips', text: f.travelStyles.family },
          { label: 'Couples', text: f.travelStyles.couples },
          { label: 'Solo travel', text: f.travelStyles.solo },
        ],
      }),
    },
    {
      id: 'practical',
      kind: 'prose',
      eyebrow: 'Step 7 · Before you go',
      heading: () => 'Practical planning',
      build: (f) => ({
        kind: 'prose',
        paragraphs: [
          `${f.safety} ${f.transportation.tips} Work these into the plan early — they affect which neighborhood to base yourself in and how much to fit into each day.`,
        ],
      }),
    },
    {
      id: 'where-to-stay',
      kind: 'decision-card',
      eyebrow: 'Step 8 · Where to stay',
      heading: () => 'Hotel or whole home?',
      build: (f, a) => ({
        kind: 'decision-card',
        intro: `Two ways to book your ${f.name} stay — pick by trip type.`,
        options: [
          {
            title: 'Hotels & city stays',
            note: `Best for short city breaks and central locations — compare ${f.name} hotels on Expedia.`,
            href: a.primarySearchHref(f.name),
            ctaLabel: 'Compare hotels',
          },
          {
            title: 'Whole homes',
            note: 'Best for groups, families and longer stays that want space and a kitchen — browse whole homes on Vrbo.',
            href: a.wholeHomeHref ? a.wholeHomeHref(f.name) : null,
            ctaLabel: 'Browse rentals',
          },
        ],
      }),
    },
  ],
  faqPolicy: (f) => [
    { question: `When is the best time to visit ${f.name}?`, answer: `${f.bestTime.months}. ${f.bestTime.blurb}` },
    {
      question: `How many days do you need in ${f.name}?`,
      answer: `Popular ${f.name} itinerary lengths are 3, 5 and 7 days — choose based on how much you want to fit in and whether you'll take day trips. Follow a ready-made day-by-day itinerary and adjust to your pace.`,
    },
    {
      question: `Which area should I base myself in when visiting ${f.name}?`,
      answer: f.neighborhoods.length
        ? `Central areas such as ${f.neighborhoods.map((n) => n.name).join(', ')} keep you close to the sights. ${f.neighborhoods[0]?.blurb ?? ''}`
        : `Base yourself in a central area to minimize travel time between sights.`,
    },
    { question: `How do I get around ${f.name}?`, answer: `${f.transportation.primary} ${f.transportation.tips}` },
  ],
  schemaDescription: (f) => `Plan a trip to ${f.name}: when to go, how many days you need, a suggested itinerary, and where to base yourself.`,
  linkPolicy: (f) => [
    { label: `${f.name} itineraries`, href: `/${f.slug}-5-day-itinerary` },
    { label: `Where to stay in ${f.name}`, href: `/where-to-stay-in-${f.slug}` },
    { label: 'All destinations', href: '/destinations' },
  ],
  forbiddenSections: ['ai-prompt', 'chip-grid'],
  requiredSections: ['itinerary-links', 'decision-card'],
};

export const BRAND_SPECS: Partial<Record<BrandId, BrandSpec>> = {
  gobookt: GOBOOKT,
  gotript: GOTRIPT,
};
