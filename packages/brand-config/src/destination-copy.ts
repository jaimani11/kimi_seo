/**
 * Shared per-brand destination COPY engine.
 *
 * The four brands render the SAME shared facts from @adored/seo-data on
 * /destinations/{city} (same hero photo + headline + oneLiner), which Google
 * clustered as duplicates. The fix keeps the FACTS shared but generates the
 * WORDS per brand. This module holds the per-brand voice pools in ONE place
 * (extracted verbatim from three identical per-app copies); each app re-exports
 * a brand-bound wrapper from its own src/lib/seo/destination-copy.ts.
 *
 * gotript is intentionally absent — it's frozen (its destination pages don't
 * call this) and is the shared-facts baseline the others diverge from.
 *
 * Deterministic per (brand, slug): stable across builds (safe for static
 * generation), varied per city, distinct from the shared seo-data copy. No
 * fabricated prices / ratings / counts / availability — evidence-safe.
 */

export type DestinationCopyBrand = 'gobookt' | 'numiworks' | 'stayviaowner';

export interface DestinationCopy {
  eyebrow: string;
  headline: string;
  body: string;
}

/** FNV-1a 32-bit — deterministic; same slug → same copy. */
function seedOf(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/**
 * Sign-safe index. The bit-shifted seeds passed in can be negative (JS `>>` is a
 * SIGNED shift), and a negative index → undefined → crash when a `bodies` entry
 * (a function) is then called. Normalise to [0, len).
 */
function pick<T>(pool: readonly T[], seed: number): T {
  const i = ((seed % pool.length) + pool.length) % pool.length;
  return pool[i] as T;
}

interface Voice {
  eyebrows: readonly string[];
  headlines: readonly string[];
  bodies: readonly ((n: string) => string)[];
}

const VOICES: Record<DestinationCopyBrand, Voice> = {
  // gobookt = Booking.com accommodations — "find a place to stay".
  gobookt: {
    eyebrows: ['Places to stay', 'Hotels & rentals', 'Where to stay'],
    headlines: [
      'Find the right place to stay.',
      'Hotels, apartments and homes.',
      'Every kind of stay, one search.',
      'Compare, then book on Booking.com.',
      'Where to stay, sorted.',
      'The stay makes the trip.',
    ],
    bodies: [
      (n) => `Hotels, apartments, villas and unique stays in ${n} — compared by area, type and guest score, then booked on Booking.com.`,
      (n) => `Search every kind of place to stay in ${n}: hotels, aparthotels, B&Bs and apartments, in the areas that fit your trip.`,
      (n) => `From boutique hotels to whole apartments, ${n} stays laid out by neighbourhood so you book the right base.`,
      (n) => `Where to stay in ${n} — the best areas, the stay types that suit you, and a one-tap handoff to Booking.com.`,
      (n) => `Compare ${n} hotels and rentals by location and guest score, then continue to Booking.com to book.`,
    ],
  },
  // numiworks = experiences via Viator — "things to do" + AI planning.
  numiworks: {
    eyebrows: ['Things to do', 'Tours & experiences', 'Experiences first'],
    headlines: [
      'Find the experiences worth the trip.',
      'Tours, tastings and day trips.',
      'The best things to do, bookable now.',
      'Book what to do, in seconds.',
      'Skip the line. See the good stuff.',
      'Plan the days, then book them.',
    ],
    bodies: [
      (n) => `Tours, food tastings, cooking classes and day trips in ${n} — bookable on Viator, with AI to plan the rest of the trip.`,
      (n) => `The best things to do in ${n}: guided walks, skip-the-line tickets and small-group experiences you can book in seconds.`,
      (n) => `Describe your trip and let AI shape the days in ${n}, then book real experiences on Viator.`,
      (n) => `From market tours to sunset sails, ${n} experiences worth building a trip around — bookable on Viator.`,
      (n) => `What to do in ${n}, day by day — tours, classes and day trips, plus a whole-home place to stay when you want one.`,
    ],
  },
  // stayviaowner = whole-home rentals (villas, cabins, cottages) via Vrbo.
  stayviaowner: {
    eyebrows: ['Whole-home rentals', 'Vacation homes by owner', 'Villas · cabins · cottages'],
    headlines: [
      'Rent the whole place — not a room.',
      'A home to yourselves.',
      'Space for the whole group.',
      'Your own villa, cabin or cottage.',
      'Book the entire home.',
      'More room. Your own kitchen. No front desk.',
      'The whole house, by owner.',
    ],
    bodies: [
      (n) => `Villas, cabins, cottages and beach houses across ${n} — private space, full kitchens and room for everyone, booked through Vrbo.`,
      (n) => `Skip the hotel in ${n}: rent an entire home with a kitchen, living room and beds for the whole group.`,
      (n) => `Whole-home rentals in ${n} — hand-pickable by type, area and how many you're travelling with.`,
      (n) => `Stay in a place of your own in ${n}: farmhouses, lake houses and villas with the space a hotel room can't give you.`,
      (n) => `Entire homes in ${n} on Vrbo — kitchens, living rooms and yards, so the group stays together under one roof.`,
      (n) => `From cabins to design-led villas, ${n} whole-home rentals give you room to spread out and cook in.`,
    ],
  },
};

/**
 * Deterministic per-brand destination hero copy. The three fields use offset
 * seeds so they vary independently. Identical output to the former per-app
 * `{brand}DestinationCopy` functions (same pools, same seeds).
 */
export function destinationCopy(
  brand: DestinationCopyBrand,
  name: string,
  slug: string,
): DestinationCopy {
  const v = VOICES[brand];
  const s = seedOf(slug);
  return {
    eyebrow: pick(v.eyebrows, s),
    headline: pick(v.headlines, s >> 5),
    body: pick(v.bodies, s >> 11)(name),
  };
}

/* ───────────────────────────────────────────────────────────────────────────
 * SECTION VOICE — anti-duplicate body framing.
 *
 * The eight body sections of /destinations/{city} render shared @adored/seo-data
 * prose (bestTime / budget / travel-styles / transport / safety blurbs) BYTE-
 * IDENTICALLY across all four brands — the real duplicate-content surface (the
 * hero copy above was differentiated earlier; the body was not). This layer
 * prepends a short, deterministic, brand-true lead-in to each prose field so the
 * rendered body diverges per brand. FACTS are untouched: numbers, months, dish
 * names, neighborhood names, and climate data all pass through unchanged. No
 * fabricated prices / ratings / counts / availability — evidence-safe.
 *
 * gotript is included here (unlike the hero engine): its body is live and was
 * the identical baseline, so it needs its own voice too.
 * ─────────────────────────────────────────────────────────────────────────── */

export type SectionVoiceBrand = 'gotript' | 'gobookt' | 'numiworks' | 'stayviaowner';

type LeadPools = Record<
  | 'bestTime'
  | 'budget'
  | 'family'
  | 'couples'
  | 'solo'
  | 'transportation'
  | 'safety'
  | 'neighborhood'
  | 'food',
  readonly string[]
>;

const SECTION_VOICE: Record<SectionVoiceBrand, LeadPools> = {
  // gotript = broad trip planning / editorial.
  gotript: {
    bestTime: ['For planning the trip, timing matters:', 'When to go, in planning terms:'],
    budget: ['Budgeting the whole trip:', 'For the trip budget:'],
    family: ['Travelling as a family:', 'With kids in tow:'],
    couples: ['For couples:', 'Travelling as a pair:'],
    solo: ['Going solo:', 'On your own:'],
    transportation: ['Getting around while you explore:', 'Moving between sights:'],
    safety: ['Practical precautions for the trip:', 'Worth knowing before you go:'],
    neighborhood: ['Base yourself here:', 'An area to consider:', 'For your itinerary:'],
    food: ['Worth a meal:', 'One for the food trail:', 'Add it to the plan:'],
  },
  // gobookt = accommodation decision (Booking.com).
  gobookt: {
    bestTime: ['Season shapes room rates and availability:', 'For picking dates and a rate:'],
    budget: ['What a stay tends to cost:', 'Nightly spend, by comfort level:'],
    family: ['Booking for a family stay:', 'For a family-friendly base:'],
    couples: ['For a couples’ stay:', 'Choosing a base for two:'],
    solo: ['For a solo stay:', 'Basing yourself solo:'],
    transportation: ['Reaching your stay and getting about:', 'Transit links from most areas:'],
    safety: ['When choosing which area to stay in:', 'For picking a safe base:'],
    neighborhood: ['A handy base:', 'Good area to book a stay:', 'Stay around here:'],
    food: ['Dining near the stays:', 'A table close by:', 'Eat well nearby:'],
  },
  // numiworks = experiences / things to do (Viator).
  numiworks: {
    bestTime: ['For catching the best experiences:', 'When the good tours run:'],
    budget: ['Budgeting for tours and activities:', 'What experiences tend to cost:'],
    family: ['Experiences with kids:', 'For family-friendly activities:'],
    couples: ['Experiences for two:', 'For couples looking to book:'],
    solo: ['Solo-friendly experiences:', 'Booking activities on your own:'],
    transportation: ['Reaching tour meeting points:', 'Getting to and from activities:'],
    safety: ['While out exploring on tours:', 'On activity days:'],
    neighborhood: ['Experiences cluster here:', 'Wander this area:', 'Good base for activities:'],
    food: ['Taste it on a food tour:', 'A local bite worth seeking:', 'One for the tasting list:'],
  },
  // stayviaowner = whole-home rentals (Vrbo).
  stayviaowner: {
    bestTime: ['For a whole-home stay, timing to weigh:', 'When rental demand shifts:'],
    budget: ['What a whole-home rental runs:', 'Rental spend, by size and season:'],
    family: ['For a family renting a home:', 'A whole home for the family:'],
    couples: ['For couples wanting their own place:', 'A private home for two:'],
    solo: ['For a solo home rental:', 'Renting a place of your own:'],
    transportation: ['Reaching your rental and getting about:', 'Access from most rental areas:'],
    safety: ['For families and groups in a rental:', 'Choosing a rental neighborhood:'],
    neighborhood: ['Rentals cluster here:', 'A good rental area:', 'Home base for a whole-home stay:'],
    food: ['Cook in or dine nearby:', 'A neighborhood table near your rental:', 'Stock the kitchen or eat out:'],
  },
};

interface GuideVoiceShape {
  bestTimeToVisit: { blurb: string };
  budget: { blurb: string };
  travelStyles: { family: string; couples: string; solo: string };
  transportation: { tips: string };
  safety: string;
  neighborhoods: ReadonlyArray<{ blurb: string }>;
  food: ReadonlyArray<{ note: string }>;
}

/**
 * Return a copy of a destination guide with brand-voiced lead-ins prepended to
 * each prose section. Facts (numbers, months, dish/neighborhood names) untouched.
 * Deterministic per (brand, slug) so static generation stays stable.
 */
export function applyGuideVoice<G extends GuideVoiceShape>(
  guide: G,
  brand: SectionVoiceBrand,
  slug: string,
): G {
  const v = SECTION_VOICE[brand];
  const s = seedOf(slug);
  const lead = (pool: readonly string[], offset: number) => pick(pool, s >> offset);
  return {
    ...guide,
    bestTimeToVisit: {
      ...guide.bestTimeToVisit,
      blurb: `${lead(v.bestTime, 2)} ${guide.bestTimeToVisit.blurb}`,
    },
    budget: { ...guide.budget, blurb: `${lead(v.budget, 4)} ${guide.budget.blurb}` },
    travelStyles: {
      ...guide.travelStyles,
      family: `${lead(v.family, 6)} ${guide.travelStyles.family}`,
      couples: `${lead(v.couples, 8)} ${guide.travelStyles.couples}`,
      solo: `${lead(v.solo, 10)} ${guide.travelStyles.solo}`,
    },
    transportation: {
      ...guide.transportation,
      tips: `${lead(v.transportation, 12)} ${guide.transportation.tips}`,
    },
    safety: `${lead(v.safety, 14)} ${guide.safety}`,
    neighborhoods: guide.neighborhoods.map((nb, i) => ({
      ...nb,
      blurb: `${pick(v.neighborhood, (s >> 3) + i * 101)} ${nb.blurb}`,
    })),
    food: guide.food.map((f, i) => ({
      ...f,
      note: `${pick(v.food, (s >> 7) + i * 89)} ${f.note}`,
    })),
  } as G;
}
