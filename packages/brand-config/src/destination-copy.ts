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
