/**
 * Shim — the Viator-flavor programmatic SEO route parser lives in
 * @adored/seo-routing. Add URL patterns THERE.
 *
 * numiworks-local layer (seo-recovery-phase-1): the `{city}-{n}-day-itinerary`
 * family is single-owner = gotript (general itineraries), not the experiences-
 * focused numiworks. It drew 2 impressions / 0 clicks across 1,125 URLs, so it is
 * now noindex (see app/[slug]/page.tsx) and dropped from the sitemap (see
 * lib/site/sitemap-entries.ts). `buildCitySeoLinks` (the "More for {city}" rail)
 * therefore also drops itinerary links so no page renders an internal link into a
 * noindexed family. `parseSeoSlug` is NOT filtered — the routes still parse so
 * `[slug]` keeps serving them (crawlable, so Google observes the noindex).
 */
import {
  buildCitySeoLinks as buildCitySeoLinksBase,
  parseSeoSlug as parseSeoSlugBase,
} from '@adored/seo-routing/viator';

export * from '@adored/seo-routing/viator';

/** Internal "More for {city}" rail: drop links to the retired itinerary family. */
export function buildCitySeoLinks(
  city: Parameters<typeof buildCitySeoLinksBase>[0],
): ReturnType<typeof buildCitySeoLinksBase> {
  return buildCitySeoLinksBase(city).filter((link) => {
    const parsed = parseSeoSlugBase(link.href.replace(/^\//, ''));
    return !parsed || parsed.kind !== 'itinerary';
  });
}
