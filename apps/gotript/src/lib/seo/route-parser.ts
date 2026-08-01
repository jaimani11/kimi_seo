/**
 * Shim — the multi-category (Expedia/Booking-family) programmatic SEO route parser
 * lives in @adored/seo-routing. Add URL patterns THERE.
 *
 * Phase 2C (internal-link restructuring): gotript's "More for {city}" rail
 * (`buildCitySeoLinks`) previously linked to EVERY SEO surface for the city — a flat
 * ~40-link graph with no topical hierarchy. gotript-local override below drops links to
 * families that are now NOINDEXED or retired, so the rail becomes a role-based cluster
 * pointing only at gotript's own surfaces (planning / persona / editorial / destinations /
 * best-time / celebrations):
 *   - Phase 2A off-role: hotels/apartments/stays-near/tours/cars/flights (owner brands)
 *   - Phase 2B climate-compressed: monthly-weather / seasonal / where-to-go-in-{month}
 *   - already retired/redirected: itinerary / weekend / things-to-do / where-to-stay
 * `parseSeoSlug`/`enumerateAllSeoSlugs` are NOT changed — only the internal link rail.
 */
import { buildCitySeoLinks as buildCitySeoLinksBase } from '@adored/seo-routing/multicategory';

export * from '@adored/seo-routing/multicategory';

/** Link hrefs the gotript rail should NOT surface (noindexed / retired families). */
const DROP_LINK =
  /^\/(hotels-in-|best-hotels-in-|cheap-hotels-in-|luxury-hotels-in-|boutique-hotels-in-|family-hotels-in-|pet-friendly-hotels-in-|beach-hotels-in-|hostels-in-|apartments-in-|tours-in-|private-tours-in-|walking-tours-in-|cars-in-|car-rentals-in-|cheap-car-rental-in-|airport-car-rental-in-|flights-to-|cheap-flights-to-|stays-near\/|things-to-do-in-|where-to-stay-in-|weekend-in-|spring-in-|summer-in-|fall-in-|winter-in-|where-to-go-in-)/;
const DROP_WEATHER = /-weather-in-[a-z]+$/;
const DROP_ITINERARY = /-\d+-day-itinerary$/;

/**
 * Internal "More for {city}" rail: role-based cluster for gotript — drops links to
 * off-role, climate-compressed, and retired families (kept in sync with the Phase 2A/2B
 * guards in app/[slug]/page.tsx and lib/site/sitemap-entries.ts).
 */
export function buildCitySeoLinks(
  city: Parameters<typeof buildCitySeoLinksBase>[0],
): ReturnType<typeof buildCitySeoLinksBase> {
  return buildCitySeoLinksBase(city).filter(
    (link) =>
      !DROP_LINK.test(link.href) &&
      !DROP_WEATHER.test(link.href) &&
      !DROP_ITINERARY.test(link.href),
  );
}
