/**
 * Per-brand destination COPY algorithm (stayviaowner = whole-home rentals).
 *
 * The problem this solves: every brand's /destinations/{city} page rendered
 * the SAME shared facts from @adored/seo-data — the same hero photo, the same
 * `headline` ("Cypress lanes and slower mornings") and the same `oneLiner`
 * ("Stone farmhouses, vineyard dinners…") — so Google saw four near-identical
 * pages per city across the portfolio and collapsed them into one cluster.
 *
 * The fix is to keep the FACTS shared but generate the WORDS per brand. This
 * module is stayviaowner's voice: whole-home vacation rentals (villas, cabins,
 * cottages, beach houses), NOT trip-planning (gotript) or hotels (gobookt) or
 * experiences (numiworks). Given a city, it deterministically picks one
 * eyebrow / headline / body from whole-home-voice pools, seeded by the city
 * slug — so the same city is STABLE across builds (safe for static generation),
 * different cities vary, and none of it matches the shared seo-data copy the
 * other brands render.
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

function pick<T>(pool: readonly T[], seed: number): T {
  return pool[seed % pool.length] as T;
}

// The italic hero sub-headline — the whole-home promise, city-agnostic so it
// reads as a brand line, not a fact. Deliberately unlike gotript's editorial
// `headline` facts.
const HEADLINES: readonly string[] = [
  'Rent the whole place — not a room.',
  'A home to yourselves.',
  'Space for the whole group.',
  'Your own villa, cabin or cottage.',
  'Book the entire home.',
  'More room. Your own kitchen. No front desk.',
  'The whole house, by owner.',
];

// The hero body line — whole-home angle, keyed to the city name.
const BODIES: readonly ((n: string) => string)[] = [
  (n) => `Villas, cabins, cottages and beach houses across ${n} — private space, full kitchens and room for everyone, booked through Vrbo.`,
  (n) => `Skip the hotel in ${n}: rent an entire home with a kitchen, living room and beds for the whole group.`,
  (n) => `Whole-home rentals in ${n} — hand-pickable by type, area and how many you're travelling with.`,
  (n) => `Stay in a place of your own in ${n}: farmhouses, lake houses and villas with the space a hotel room can't give you.`,
  (n) => `Entire homes in ${n} on Vrbo — kitchens, living rooms and yards, so the group stays together under one roof.`,
  (n) => `From cabins to design-led villas, ${n} whole-home rentals give you room to spread out and cook in.`,
];

// The uppercase eyebrow — brand category, not a location tag (gotript uses
// "{region} · {country}"; stayviaowner leads with the rental angle).
const EYEBROWS: readonly string[] = [
  'Whole-home rentals',
  'Vacation homes by owner',
  'Villas · cabins · cottages',
];

export interface DestinationCopy {
  eyebrow: string;
  headline: string;
  body: string;
}

/**
 * Deterministic whole-home copy for a destination hero. Stable per slug.
 * The three fields use offset seeds so they vary independently.
 */
export function stayviaownerDestinationCopy(name: string, slug: string): DestinationCopy {
  const s = seedOf(slug);
  return {
    eyebrow: pick(EYEBROWS, s),
    headline: pick(HEADLINES, s >> 5),
    body: pick(BODIES, s >> 11)(name),
  };
}

/**
 * Per-brand hero-photo variant. The shared resolver returns the SAME image per
 * city for every brand; stayviaowner requests a distinct crop + palette so its
 * hero doesn't render pixel-identically to the siblings. Deterministic (no
 * per-request variance, safe for static generation).
 *
 * NOTE: this is the cheap systematic differentiator. A full per-brand photo
 * library — four genuinely distinct images per city, one per brand — is the
 * next imagery increment; until then this at least breaks the pixel-identity.
 */
export function stayviaownerHeroPhoto(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  // entropy crop → different focal region than the default center crop;
  // a slight desaturation nudges toward stayviaowner's calmer whole-home tone.
  return `${url}${sep}crop=entropy&sat=-12`;
}
