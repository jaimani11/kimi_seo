import type { DestinationGuide } from './destination-content';

export interface ThingsToDoFaq {
  question: string;
  answer: string;
}

export interface ThingsToDoFaqInput {
  cityName: string;
  oneLiner: string;
  /** Destination guide when the city has one — grounds the richer answers. */
  guide?: DestinationGuide | null;
  /** Titles of the top live experiences, if any were fetched. */
  topExperienceTitles?: readonly string[];
}

/**
 * City-level Q&A for the `/things-to-do-in-{city}` pages.
 *
 * Deliberately PROVIDER-AGNOSTIC — no "Viator" / "VRBO" / "Booking.com"
 * wording — so the same block is safe on every brand. Answers are grounded
 * in the destination guide + live experience titles where present, so the
 * block reads as genuine help rather than templated filler (which Google's
 * helpful-content system discounts).
 *
 * The one builder feeds BOTH the visible FAQ and the FAQPage JSON-LD, so
 * what the reader sees === what Google and AI answer engines parse.
 */
export function buildThingsToDoFaq(input: ThingsToDoFaqInput): ThingsToDoFaq[] {
  const { cityName, oneLiner, guide, topExperienceTitles } = input;
  const faq: ThingsToDoFaq[] = [];

  // 1. Top things to do — grounded in live experience titles when available.
  const titles = (topExperienceTitles ?? []).filter(Boolean).slice(0, 3);
  faq.push({
    question: `What are the top things to do in ${cityName}?`,
    answer: titles.length
      ? `Popular experiences include ${listJoin(titles)}. ${oneLiner}`
      : oneLiner,
  });

  // 2. Best time — from the destination guide when the city has one.
  if (guide?.bestTimeToVisit) {
    faq.push({
      question: `When is the best time to visit ${cityName} for tours and sightseeing?`,
      answer: `${guide.bestTimeToVisit.months}. ${guide.bestTimeToVisit.blurb}`,
    });
  }

  // 3. Trip length — evergreen, and links the itinerary pages (internal SEO).
  faq.push({
    question: `How many days do you need in ${cityName}?`,
    answer: `Most travelers spend 2 to 4 days in ${cityName}. See our 2, 3, 5, and 7-day ${cityName} itineraries for day-by-day plans.`,
  });

  // 4. Booking ahead — evergreen, provider-agnostic activity advice.
  faq.push({
    question: `Do you need to book tours and tickets in advance in ${cityName}?`,
    answer: `Popular tours, skip-the-line tickets, and small-group experiences in ${cityName} often sell out in peak season. Booking a few days ahead secures your spot and usually the best price; flexible same-week bookings are fine in the shoulder and off-season.`,
  });

  // 5. Cost — from the guide's budget bands when available.
  if (guide?.budget) {
    faq.push({
      question: `How much do things to do in ${cityName} cost?`,
      answer: `It varies by activity, but as a rough guide budget travelers manage on about $${guide.budget.budgetDailyUSD}/day including activities, mid-range around $${guide.budget.midDailyUSD}/day, and luxury from $${guide.budget.luxuryDailyUSD}/day. Many viewpoints, parks, and neighborhoods are free to explore.`,
    });
  }

  return faq;
}

/** Oxford-comma join: ["a"] → "a", ["a","b"] → "a and b", ["a","b","c"] → "a, b, and c". */
function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
