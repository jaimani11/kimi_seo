import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import { bookingHotelsSearchHref } from '@lib/affiliate/booking-com-multicategory';

/**
 * buildGobooktDestinationExperience — the GoBookt "brand experience"
 * interpreter for a destination.
 *
 * This is the composition brain, not a string map: given the SHARED factual
 * data (SeoCity + DestinationGuide + climate), it decides which sections
 * render, in what order, with what headings, which CTAs, which accommodation
 * types, and the accommodation-framed structured data — so GoBookt reads as an
 * ACCOMMODATION-DECISION product, distinct from GoTript's trip-planning guide
 * that consumes the same facts.
 *
 * Guardrails baked in here (not left to the page):
 *   - Accommodation-first order: areas → neighborhood compare → stay types →
 *     who-each-area-suits → seasonality-for-booking → practical → handoff.
 *   - Hotel-class positioning only (hotels / boutique / aparthotels /
 *     apartments / B&Bs / hostels / resorts). No cabins / villas / farmhouses /
 *     cottages / whole-home — that is StayViaOwner's territory.
 *   - Evidence-safe copy: compare AREAS and TYPES, then continue to Booking.com
 *     for live availability. No prices, rates, "cheaper months", availability,
 *     booking-lead-times, safety rankings, or "best value" claims.
 *   - Every search CTA routes through the money-path-safe resolver
 *     (bookingHotelsSearchHref → null when unavailable, so the UI shows a
 *     controlled retry state rather than a homepage link).
 */

export interface StayAreaCard {
  /** Neighborhood/area name. */
  name: string;
  /** Authored one-line character description (factual, from guide data). */
  blurb: string;
  /** Tracked Booking.com hotels-search deep-link for this area, or null
   *  (fail-closed) so the card renders non-bookable. */
  href: string | null;
  ctaLabel: string;
}

export interface AccommodationType {
  label: string;
  /** Neutral, evidence-safe note about the type (no counts/prices). */
  note: string;
}

export interface TravelerAreaFit {
  profile: 'Families' | 'Couples' | 'Solo travelers';
  text: string;
}

export interface GobooktDestinationExperience {
  hero: {
    /** Accommodation-first H1. */
    heading: string;
    /** Evidence-safe subhead — compare areas/types, then Booking.com for live
     *  availability. */
    subhead: string;
  };
  /** Section 3 — best areas to stay (led; each a tracked search CTA). */
  bestAreas: StayAreaCard[];
  /** Section 5 — hotel-class accommodation types, destination-aware. */
  accommodationTypes: AccommodationType[];
  /** Section 6 — who each area suits (traveler profile → area fit). */
  travelerFit: TravelerAreaFit[];
  /** Section 7 — seasonality interpreted for stay planning (evidence-safe). */
  seasonality: string;
  /** Section 8 — practical accommodation considerations (factual). */
  practical: string;
  /** Section 9 — the city-level Booking.com handoff CTA (tracked, or null). */
  handoffHref: string | null;
  /** Section 10 — related accommodation pages (internal links). */
  related: { label: string; href: string }[];
}

/** Leisure/resort-leaning destinations where "Resorts" is a genuine
 *  Booking.com stay type worth surfacing. Curated (evidence-safe), not
 *  inferred from arbitrary signals. */
const RESORT_DESTINATIONS = new Set<string>([
  'bali',
  'cancun',
  'santorini',
  'phuket',
  'maldives',
  'punta-cana',
  'tulum',
  'nusa-dua',
  'phu-quoc',
  'mauritius',
  'maui',
  'bora-bora',
  'krabi',
  'zanzibar',
]);

/** Metro/city-break destinations where hostels + aparthotels are especially
 *  relevant. Everything gets the hotel-class base set below regardless. */
function accommodationTypesFor(city: SeoCity): AccommodationType[] {
  const base: AccommodationType[] = [
    { label: 'Hotels', note: 'The broadest choice — city-center to budget chains, bookable on Booking.com.' },
    { label: 'Boutique hotels', note: 'Smaller, design-led stays with a local feel.' },
    { label: 'Aparthotels', note: 'Hotel service with a kitchenette — handy for longer stays.' },
    { label: 'Apartments', note: 'Self-catering city apartments for more space than a room.' },
    { label: 'B&Bs & guesthouses', note: 'Smaller, host-run stays, often in residential areas.' },
    { label: 'Hostels', note: 'Private and shared rooms for budget-minded and solo trips.' },
  ];
  if (RESORT_DESTINATIONS.has(city.slug)) {
    base.splice(1, 0, {
      label: 'Resorts',
      note: 'Full-service leisure resorts, common in and around this destination.',
    });
  }
  return base;
}

export function buildGobooktDestinationExperience({
  city,
  guide,
}: {
  city: SeoCity;
  guide: DestinationGuide;
}): GobooktDestinationExperience {
  const bestAreas: StayAreaCard[] = guide.neighborhoods.map((n) => ({
    name: n.name,
    blurb: n.blurb,
    href: bookingHotelsSearchHref({ destination: `${n.name}, ${city.name}` }),
    ctaLabel: `Search ${n.name} stays`,
  }));

  const travelerFit: TravelerAreaFit[] = [
    { profile: 'Families', text: guide.travelStyles.family },
    { profile: 'Couples', text: guide.travelStyles.couples },
    { profile: 'Solo travelers', text: guide.travelStyles.solo },
  ];

  // Seasonality reframed for BOOKING decisions — evidence-safe. We describe the
  // popular period (authored fact) and the practical planning implication
  // (compare earlier), without asserting prices, "cheaper", or lead times.
  const seasonality =
    `${guide.bestTimeToVisit.months} are popular times to visit ${city.name}. ` +
    `Choosing your dates earlier gives you more time to compare areas and stay ` +
    `types before you continue to Booking.com for live availability.`;

  // Practical considerations for choosing WHERE to stay — factual transport +
  // the authored safety note, framed around getting to/from your stay. No
  // safety rankings between neighborhoods.
  const practical =
    `${guide.transportation.primary} ${guide.transportation.tips} ` +
    `When picking an area, weigh how easily you can reach it from the airport ` +
    `and move between the places you plan to visit. ${guide.safety}`;

  const related: { label: string; href: string }[] = [
    { label: `Hotels in ${city.name}`, href: `/hotels-in-${city.slug}` },
    { label: 'All destinations', href: '/destinations' },
  ];

  return {
    hero: {
      heading: `Where to stay in ${city.name}`,
      subhead:
        `Compare the best areas and stay types in ${city.name}, then continue to ` +
        `Booking.com for live availability and prices.`,
    },
    bestAreas,
    accommodationTypes: accommodationTypesFor(city),
    travelerFit,
    seasonality,
    practical,
    handoffHref: bookingHotelsSearchHref({ destination: city.name }),
    related,
  };
}

/**
 * Accommodation-framed JSON-LD for GoBookt — a TouristDestination plus an
 * FAQPage whose questions are about CHOOSING ACCOMMODATION (distinct from the
 * generic when-to-go/budget/food FAQs the shared guide emits), so the four
 * brands no longer ship the same rich-result for the same city.
 */
export function buildGobooktDestinationJsonLd({
  city,
  guide,
  canonical,
  imageUrl,
}: {
  city: SeoCity;
  guide: DestinationGuide;
  canonical: string;
  imageUrl: string;
}): string {
  const areas = guide.neighborhoods.map((n) => n.name);
  const destination = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: `${city.name}, ${city.countryName}`,
    description: `Where to stay in ${city.name}: compare the best areas and accommodation types, then book on Booking.com.`,
    url: canonical,
    image: imageUrl,
    address: {
      '@type': 'PostalAddress',
      addressCountry: city.countryCode,
      addressLocality: city.name,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
    },
    containedInPlace: { '@type': 'Country', name: city.countryName },
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Which area should I stay in when visiting ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: areas.length
            ? `Popular areas to stay in ${city.name} include ${areas.join(', ')}. ${guide.neighborhoods[0]?.blurb ?? ''} Compare areas by how close they are to what you came for, then check live availability on Booking.com.`
            : `Compare central and quieter areas of ${city.name} by proximity and transit access, then check live availability on Booking.com.`,
        },
      },
      {
        '@type': 'Question',
        name: `What types of accommodation can I book in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${city.name} has a range of hotel-style stays on Booking.com — hotels, boutique hotels, aparthotels, apartments, B&Bs and hostels${RESORT_DESTINATIONS.has(city.slug) ? ', plus resorts' : ''}. Choose the type that fits your trip and continue to Booking.com for live options.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is ${city.name} a good base for families?`,
        acceptedAnswer: { '@type': 'Answer', text: guide.travelStyles.family },
      },
      {
        '@type': 'Question',
        name: `When are popular times to visit ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${guide.bestTimeToVisit.months} are popular times to visit ${city.name}. ${guide.bestTimeToVisit.blurb}`,
        },
      },
    ],
  };

  return JSON.stringify([destination, faq]).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
