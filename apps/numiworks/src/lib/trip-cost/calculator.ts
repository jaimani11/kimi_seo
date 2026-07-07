import { findDestinationGuide, type DestinationGuide } from '@lib/seo/destination-content';
import { findCityBySlug, type SeoCity } from '@lib/seo/cities';

/**
 * Trip cost estimator + budget optimizer.
 *
 * Deterministic dollar estimates for a trip given destination,
 * duration, travelers, and travel style. Draws on
 * DestinationGuide.budget for on-the-ground spend (hotels + food +
 * activities + transit) and adds region-based flight averages.
 *
 * The estimates are conservative approximations — not price feeds.
 * The intent is decision support ("can I afford Rome for 8 days
 * with 4 people on $6,000?"), not booking-precision quotes.
 */

export type TripStyle = 'backpack' | 'comfortable' | 'elevated' | 'luxury';

export interface TripCostInput {
  citySlug: string;
  nights: number;
  adults: number;
  kids: number;
  style: TripStyle;
  /** Optional maximum budget in USD. When set, the estimator returns
   *  suggestions to bring the trip inside the cap. */
  maxBudgetUSD?: number;
}

export interface TripCostBreakdown {
  flights: number;
  hotels: number;
  food: number;
  activities: number;
  localTransit: number;
}

export interface TripCostEstimate {
  city: SeoCity;
  guide: DestinationGuide;
  input: TripCostInput;
  breakdown: TripCostBreakdown;
  totalUSD: number;
  perPersonUSD: number;
  suggestions: readonly string[];
}

/**
 * Region-to-average-roundtrip-flight-from-US mapping (USD, economy).
 * Kids under 12 pay ~85% of adult fare on most airlines.
 */
const FLIGHT_ESTIMATES: Record<SeoCity['region'], number> = {
  asia: 1200,
  europe: 900,
  americas: 500,
  mena: 1100,
  oceania: 1600,
  africa: 1400,
};

/** Style multiplier applied to the guide's daily hotel + food number. */
const STYLE_MULTIPLIER: Record<TripStyle, number> = {
  backpack: 0.7,
  comfortable: 1.0,
  elevated: 1.6,
  luxury: 2.8,
};

/**
 * Which of the guide's three price tiers to lean on for the base
 * daily rate before applying the style multiplier.
 */
function baseDaily(guide: DestinationGuide, style: TripStyle): number {
  switch (style) {
    case 'backpack':
      return guide.budget.budgetDailyUSD;
    case 'comfortable':
      return guide.budget.midDailyUSD;
    case 'elevated':
    case 'luxury':
      return guide.budget.luxuryDailyUSD;
  }
}

export function estimateTripCost(input: TripCostInput): TripCostEstimate | null {
  const city = findCityBySlug(input.citySlug);
  const guide = findDestinationGuide(input.citySlug);
  if (!city || !guide) return null;

  const nights = Math.max(1, Math.floor(input.nights));
  const adults = Math.max(1, Math.floor(input.adults));
  const kids = Math.max(0, Math.floor(input.kids));
  const travelers = adults + kids;

  const daily = baseDaily(guide, input.style) * STYLE_MULTIPLIER[input.style];

  // Hotel is ~40% of daily spend (mid-range assumption), food ~30%,
  // activities ~20%, local transit ~10%. Split proportionally so
  // multi-traveler math stays honest.
  const perPersonPerNightHotel = daily * 0.40;
  const perPersonPerNightFood = daily * 0.30;
  const perPersonPerNightActivities = daily * 0.20;
  const perPersonPerNightTransit = daily * 0.10;

  // Hotel usually shared — double occupancy assumed. Kids often
  // share the parents' room, so hotel cost per room is halved for
  // adult pairs and only marginally increased for kids under 12.
  const rooms = Math.ceil(adults / 2);
  const hotels = perPersonPerNightHotel * 2 * rooms * nights;
  const food = perPersonPerNightFood * travelers * nights;
  const activities = perPersonPerNightActivities * travelers * nights;
  const localTransit = perPersonPerNightTransit * travelers * nights;

  // Flights: adults full price, kids under 12 at 85%. Rough.
  const regionFlight = FLIGHT_ESTIMATES[city.region];
  const flights = regionFlight * (adults + kids * 0.85);

  const breakdown: TripCostBreakdown = {
    flights: round50(flights),
    hotels: round50(hotels),
    food: round50(food),
    activities: round50(activities),
    localTransit: round50(localTransit),
  };
  const totalUSD =
    breakdown.flights +
    breakdown.hotels +
    breakdown.food +
    breakdown.activities +
    breakdown.localTransit;
  const perPersonUSD = Math.round(totalUSD / travelers);

  const suggestions = buildSuggestions(input, breakdown, totalUSD);

  return {
    city,
    guide,
    input: { ...input, nights, adults, kids },
    breakdown,
    totalUSD,
    perPersonUSD,
    suggestions,
  };
}

function round50(n: number): number {
  return Math.round(n / 50) * 50;
}

/**
 * Build 2-4 actionable suggestions. When no max budget is set, we
 * still surface high-impact levers ("cutting a night saves ~$X").
 * When max budget is set and total > max, prioritize suggestions
 * that close the gap.
 */
function buildSuggestions(
  input: TripCostInput,
  breakdown: TripCostBreakdown,
  totalUSD: number,
): string[] {
  const out: string[] = [];
  const max = input.maxBudgetUSD;
  const overBy = max && totalUSD > max ? totalUSD - max : 0;

  // Style downgrade
  if (input.style === 'luxury') {
    const savings = Math.round(totalUSD * 0.42);
    out.push(`Switch from luxury to elevated — saves about $${savings.toLocaleString()}.`);
  } else if (input.style === 'elevated') {
    const savings = Math.round(totalUSD * 0.35);
    out.push(`Drop from elevated to comfortable — saves about $${savings.toLocaleString()}.`);
  } else if (input.style === 'comfortable' && overBy > 0) {
    const savings = Math.round(totalUSD * 0.28);
    out.push(`Backpacker style saves about $${savings.toLocaleString()} across the trip.`);
  }

  // Nights
  const perNightAll =
    breakdown.hotels / input.nights +
    breakdown.food / input.nights +
    breakdown.activities / input.nights +
    breakdown.localTransit / input.nights;
  const oneNightSavings = round50(perNightAll);
  if (oneNightSavings > 50) {
    out.push(
      `Cut one night — saves about $${oneNightSavings.toLocaleString()}. Two nights saves twice.`,
    );
  }

  // Flight timing
  if (breakdown.flights > 800 * (input.adults + input.kids)) {
    out.push(
      `Flight is the biggest line — flexible dates or a shoulder-season week (Sep–Nov or Feb–Mar) can shave 15–30%.`,
    );
  }

  if (overBy > 0 && out.length < 2) {
    out.push(
      `You're $${overBy.toLocaleString()} over the cap — combining a style downgrade with one fewer night usually closes it.`,
    );
  }

  return out.slice(0, 4);
}
