/**
 * Shim over the shared multi-category (Expedia/Booking-family) programmatic
 * SEO route parser (`@adored/seo-routing/multicategory`).
 *
 * stayviaowner is a Vrbo whole-home rental brand, but this shared parser is
 * the same one the multi-vertical brands (gotript, gobookt) use — so out of
 * the box it generates flights / cars / cruises pages that are off-brand here
 * and were the core of the "ghost duplicate of gotript" duplicate-content
 * problem. We RETIRE those slug kinds app-locally (without touching the shared
 * package the other brands still need): the wrapped `enumerateAllSeoSlugs`
 * drops them so they neither statically generate (→ 404 via
 * `generateStaticParams`) nor appear in the sitemap, and the wrapped
 * `parseSeoSlug` returns null for them so any typed URL 404s.
 *
 * Kept: hotels, itineraries, things-to-do, comparisons, climate/where-to-stay,
 * and the Vrbo rental matrix. Add URL patterns in @adored/seo-routing.
 */
import {
  enumerateAllSeoSlugs as enumerateAllSeoSlugsBase,
  parseSeoSlug as parseSeoSlugBase,
  buildCitySeoLinks as buildCitySeoLinksBase,
} from '@adored/seo-routing/multicategory';

export * from '@adored/seo-routing/multicategory';

/**
 * The retired/redirected URL families, as href patterns. The shared
 * `buildCitySeoLinks` (which powers the "More for {city}" rail on every
 * programmatic page) still emits flight/car/cruise deep-links + the generic
 * `hotels-in` link — all now 404 (retired) or 308 (hotels-in). Strip them so
 * the rail never renders a dead internal link.
 */
const RETIRED_LINK_RE =
  /^\/(flights?-to-|cheap-flights-to-|car-rentals?-in-|cars-in-|cheap-car-rental-in-|airport-car-rental-in-|cruise)/;
const REDIRECTED_LINK_RE = /^\/hotels-in-/;

export function buildCitySeoLinks(
  city: Parameters<typeof buildCitySeoLinksBase>[0],
): ReturnType<typeof buildCitySeoLinksBase> {
  return buildCitySeoLinksBase(city).filter(
    (l) => !RETIRED_LINK_RE.test(l.href) && !REDIRECTED_LINK_RE.test(l.href),
  );
}

/**
 * Slug kinds RETIRED on stayviaowner (Vrbo-first reposition): the Expedia-only
 * flights / cars / cruises verticals. `parseSeoSlug` returns null for these so
 * the route 404s and they never enter the sitemap.
 */
const RETIRED_KINDS: ReadonlySet<string> = new Set([
  'flights-to',
  'cars-in',
  'flights-themed',
  'cars-themed',
  'cruise-region',
]);

/**
 * Slug kinds REDIRECTED (not retired): the generic `/hotels-in-{city}` page,
 * reworded to vacation-rental intent, is an exact dup of the `/rentals/{city}`
 * hub — so `[slug]/page.tsx` 308s it to the hub. We keep it PARSEABLE (so that
 * redirect can fire) but exclude it from `enumerateAllSeoSlugs`, so it is
 * neither statically generated nor listed in the sitemap. (The 8 themed hotel
 * kinds — best/cheap/luxury/family/boutique/pet-friendly/beach/apartments — are
 * reworked in place and stay in the sitemap.)
 */
const REDIRECTED_KINDS: ReadonlySet<string> = new Set(['hotels-in']);

export function parseSeoSlug(slug: string): ReturnType<typeof parseSeoSlugBase> {
  const parsed = parseSeoSlugBase(slug);
  if (parsed && RETIRED_KINDS.has(parsed.kind)) return null;
  return parsed;
}

export function enumerateAllSeoSlugs(): string[] {
  return enumerateAllSeoSlugsBase().filter((slug) => {
    const parsed = parseSeoSlugBase(slug);
    if (!parsed) return true;
    return !RETIRED_KINDS.has(parsed.kind) && !REDIRECTED_KINDS.has(parsed.kind);
  });
}
