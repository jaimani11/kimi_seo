import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';

/**
 * buildGotriptDestinationExperience — GoTript's "brand experience" interpreter
 * for a destination.
 *
 * GoTript is the TRIP-PLANNING flagship. Given the shared facts it composes a
 * PLANNING journey — when to go, how many days, an itinerary to follow, where
 * to base yourself, how to get around, and finally a hotel-or-whole-home
 * booking decision — distinct from GoBookt's accommodation-decision page that
 * consumes the same data.
 *
 * Guardrails baked in here (not left to the page):
 *   - Planning-first order: best-time → trip-length → itinerary → base area →
 *     getting-around → trip-style → practical → where-to-stay (hotel-vs-home).
 *   - GoTript is NOT a tours marketplace (no GetYourGuide/Viator activity
 *     widgets — that is Numiworks' job) and NOT a hotel-comparison site (that
 *     is GoBookt's). It PLANS, then hands off.
 *   - Deterministic provider selection at the booking step: hotels / city
 *     stays → Expedia (Partnerize-tracked); whole homes (villas / cabins /
 *     apartments) → Vrbo. No dynamic optimization yet.
 *   - Evidence-safe: offers itinerary lengths + planning structure; no
 *     fabricated per-day plans, prices, or "cheapest" claims.
 */

export interface ItineraryOption {
  days: number;
  label: string;
  href: string;
}

export interface GotriptDestinationExperience {
  hero: { heading: string; subhead: string };
  /** Section — best time to visit (planning framing). */
  bestTime: string;
  /** Section — how many days / itinerary lengths to choose from. */
  tripLength: {
    intro: string;
    options: ItineraryOption[];
  };
  /** Section — suggested itinerary structure (links to the full itineraries). */
  itineraryIntro: string;
  /** Section — where to base yourself (neighborhoods as trip bases). */
  baseAreas: { name: string; blurb: string }[];
  /** Section — getting around (transport for the trip). */
  gettingAround: string;
  /** Section — plan by trip style (family / couples / solo). */
  tripStyles: { label: 'Family trips' | 'Couples' | 'Solo travel'; text: string }[];
  /** Section — practical planning considerations. */
  practical: string;
  /** Section — hotel-vs-whole-home booking decision. */
  whereToStay: {
    /** Expedia hotels handoff (Partnerize-tracked). */
    hotelHref: string;
    /** Whether to surface the Vrbo whole-home callout for group/space trips. */
    showVrbo: boolean;
  };
  /** Related planning pages. */
  related: { label: string; href: string }[];
}

export function buildGotriptDestinationExperience({
  city,
  guide,
}: {
  city: SeoCity;
  guide: DestinationGuide;
}): GotriptDestinationExperience {
  const options: ItineraryOption[] = [3, 5, 7].map((d) => ({
    days: d,
    label: `${d}-day ${city.name} itinerary`,
    href: `/${city.slug}-${d}-day-itinerary`,
  }));

  const bestTime =
    `${guide.bestTimeToVisit.months} are popular times to visit ${city.name}. ` +
    `${guide.bestTimeToVisit.blurb} Deciding your dates first shapes the rest of the plan — ` +
    `how many days to spend and which area to base yourself in.`;

  const tripStyles: GotriptDestinationExperience['tripStyles'] = [
    { label: 'Family trips', text: guide.travelStyles.family },
    { label: 'Couples', text: guide.travelStyles.couples },
    { label: 'Solo travel', text: guide.travelStyles.solo },
  ];

  const practical =
    `${guide.safety} ${guide.transportation.tips} ` +
    `Work these into the plan early — they affect which neighborhood to base ` +
    `yourself in and how much to fit into each day.`;

  return {
    hero: {
      heading: `The ${city.name} Travel Guide`,
      subhead:
        `Your ${city.name} trip, planned — when to go, how many days you need, and ` +
        `where to base yourself, mapped out before you book.`,
    },
    bestTime,
    tripLength: {
      intro:
        `Pick a length and follow a ready-made ${city.name} itinerary — each one ` +
        `sequences the sights so your days flow without backtracking.`,
      options,
    },
    itineraryIntro:
      `A good ${city.name} plan bases you in one central area, groups nearby sights ` +
      `into each day, and leaves room to slow down. Start from a day-by-day itinerary ` +
      `above, then adjust the order to your dates and pace.`,
    baseAreas: guide.neighborhoods.map((n) => ({ name: n.name, blurb: n.blurb })),
    gettingAround: `${guide.transportation.primary} ${guide.transportation.tips}`,
    tripStyles,
    practical,
    whereToStay: {
      hotelHref: buildExpediaCategoryUrl('hotels', { destination: city.name }),
      showVrbo: true,
    },
    related: [
      { label: `${city.name} itineraries`, href: `/${city.slug}-5-day-itinerary` },
      { label: `Where to stay in ${city.name}`, href: `/where-to-stay-in-${city.slug}` },
      { label: 'All destinations', href: '/destinations' },
    ],
  };
}

/**
 * Planning-framed JSON-LD for GoTript — TouristDestination + an FAQPage whose
 * questions are about PLANNING (when / how many days / itinerary / where to
 * base), distinct from GoBookt's accommodation FAQs and the old generic set.
 */
export function buildGotriptDestinationJsonLd({
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
  const destination = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: `${city.name}, ${city.countryName}`,
    description: `Plan a trip to ${city.name}: when to go, how many days you need, a suggested itinerary, and where to base yourself.`,
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
    touristType: ['Family', 'Couples', 'Solo'],
  };

  const firstArea = guide.neighborhoods[0]?.name;
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `When is the best time to visit ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${guide.bestTimeToVisit.months}. ${guide.bestTimeToVisit.blurb}`,
        },
      },
      {
        '@type': 'Question',
        name: `How many days do you need in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Popular ${city.name} itinerary lengths are 3, 5 and 7 days — choose based on how much you want to fit in and whether you'll take day trips. Follow a ready-made day-by-day itinerary and adjust to your pace.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which area should I base myself in when visiting ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: firstArea
            ? `Central areas such as ${guide.neighborhoods.map((n) => n.name).join(', ')} keep you close to the sights. ${guide.neighborhoods[0]?.blurb ?? ''}`
            : `Base yourself in a central area to minimize travel time between sights.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I get around ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${guide.transportation.primary} ${guide.transportation.tips}`,
        },
      },
    ],
  };

  return JSON.stringify([destination, faq]).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
