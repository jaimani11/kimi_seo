/**
 * Per-brand destination COPY algorithm (gobookt = Booking.com accommodations).
 *
 * Keeps the shared FACTS from @adored/seo-data but generates the WORDS per
 * brand, so /destinations/{city} doesn't render the identical hero copy the
 * sibling brands do (the duplicate Google was clustering). gobookt's voice is
 * "find a place to stay" — hotels, apartments, villas, unique stays — NOT
 * trip-planning (gotript), experiences (numiworks) or whole-home rentals
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
  'Find the right place to stay.',
  'Hotels, apartments and homes.',
  'Every kind of stay, one search.',
  'Compare, then book on Booking.com.',
  'Where to stay, sorted.',
  'The stay makes the trip.',
];

const BODIES: readonly ((n: string) => string)[] = [
  (n) => `Hotels, apartments, villas and unique stays in ${n} — compared by area, type and guest score, then booked on Booking.com.`,
  (n) => `Search every kind of place to stay in ${n}: hotels, aparthotels, B&Bs and apartments, in the areas that fit your trip.`,
  (n) => `From boutique hotels to whole apartments, ${n} stays laid out by neighbourhood so you book the right base.`,
  (n) => `Where to stay in ${n} — the best areas, the stay types that suit you, and a one-tap handoff to Booking.com.`,
  (n) => `Compare ${n} hotels and rentals by location and guest score, then continue to Booking.com to book.`,
];

const EYEBROWS: readonly string[] = ['Places to stay', 'Hotels & rentals', 'Where to stay'];

export interface DestinationCopy {
  eyebrow: string;
  headline: string;
  body: string;
}

export function gobooktDestinationCopy(name: string, slug: string): DestinationCopy {
  const s = seedOf(slug);
  return {
    eyebrow: pick(EYEBROWS, s),
    headline: pick(HEADLINES, s >> 5),
    body: pick(BODIES, s >> 11)(name),
  };
}
