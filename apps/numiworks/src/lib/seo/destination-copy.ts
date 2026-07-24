/**
 * Per-brand destination COPY algorithm (numiworks = experiences, via Viator).
 *
 * Keeps the shared FACTS from @adored/seo-data but generates the WORDS per
 * brand, so /destinations/{city} doesn't render the identical hero copy the
 * sibling brands do (the duplicate Google was clustering). numiworks's voice is
 * "things to do" — tours, tastings, classes, day trips — plus AI planning, NOT
 * trip-planning-first (gotript), hotels (gobookt) or whole-home rentals
 * (stayviaowner). Deterministic per slug: stable across builds (safe for static
 * generation), varied per city, distinct from the shared seo-data copy.
 *
 * No fabricated prices / ratings / counts / availability — evidence-safe.
 */

/** FNV-1a 32-bit — deterministic; same slug → same copy. */
function seedOf(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/** Sign-safe index (the bit-shifted seeds can be negative). */
function pick<T>(pool: readonly T[], seed: number): T {
  const i = ((seed % pool.length) + pool.length) % pool.length;
  return pool[i] as T;
}

const HEADLINES: readonly string[] = [
  'Find the experiences worth the trip.',
  'Tours, tastings and day trips.',
  'The best things to do, bookable now.',
  'Book what to do, in seconds.',
  'Skip the line. See the good stuff.',
  'Plan the days, then book them.',
];

const BODIES: readonly ((n: string) => string)[] = [
  (n) => `Tours, food tastings, cooking classes and day trips in ${n} — bookable on Viator, with AI to plan the rest of the trip.`,
  (n) => `The best things to do in ${n}: guided walks, skip-the-line tickets and small-group experiences you can book in seconds.`,
  (n) => `Describe your trip and let AI shape the days in ${n}, then book real experiences on Viator.`,
  (n) => `From market tours to sunset sails, ${n} experiences worth building a trip around — bookable on Viator.`,
  (n) => `What to do in ${n}, day by day — tours, classes and day trips, plus a whole-home place to stay when you want one.`,
];

const EYEBROWS: readonly string[] = ['Things to do', 'Tours & experiences', 'Experiences first'];

export interface DestinationCopy {
  eyebrow: string;
  headline: string;
  body: string;
}

export function numiworksDestinationCopy(name: string, slug: string): DestinationCopy {
  const s = seedOf(slug);
  return {
    eyebrow: pick(EYEBROWS, s),
    headline: pick(HEADLINES, s >> 5),
    body: pick(BODIES, s >> 11)(name),
  };
}
