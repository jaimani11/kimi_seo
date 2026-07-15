/**
 * Shim — the multi-category (Booking-family) programmatic SEO route parser
 * lives in @adored/seo-routing. Add URL patterns THERE.
 *
 * gobookt-local layer: the Viator-retirement policy (see ./gobookt-retirement).
 *
 *  - `enumerateAllSeoSlugs` drops the REDIRECTED Viator families (itinerary,
 *    weekend, things-to-do, and the accommodation-mapped themed-list themes) so
 *    they neither statically generate nor appear in the sitemap — `[slug]`
 *    issues a one-hop 308 for them instead. HELD pure-experience themes +
 *    comparisons stay enumerated (they render an honest noindex bridge and
 *    remain in the sitemap until the traffic review decides their final action).
 *
 *  - `parseSeoSlug` is NOT filtered — every Viator slug still parses so `[slug]`
 *    can recognise it and 308/bridge it.
 *
 *  - `buildCitySeoLinks` (the "More for {city}" rail) drops links to any retired
 *    Viator family so no page renders a dead/redirected internal link.
 */
import {
  enumerateAllSeoSlugs as enumerateAllSeoSlugsBase,
  parseSeoSlug as parseSeoSlugBase,
  buildCitySeoLinks as buildCitySeoLinksBase,
} from '@adored/seo-routing/multicategory';
import { retirementFor } from './gobookt-retirement';

export * from '@adored/seo-routing/multicategory';

/** Sitemap + static-params set: drop only the REDIRECTED families. */
export function enumerateAllSeoSlugs(): string[] {
  return enumerateAllSeoSlugsBase().filter((slug) => {
    const parsed = parseSeoSlugBase(slug);
    if (!parsed) return true;
    return retirementFor(parsed)?.kind !== 'redirect';
  });
}

/** Internal "More for {city}" rail: drop links to ANY retired Viator family. */
export function buildCitySeoLinks(
  city: Parameters<typeof buildCitySeoLinksBase>[0],
): ReturnType<typeof buildCitySeoLinksBase> {
  return buildCitySeoLinksBase(city).filter((link) => {
    const parsed = parseSeoSlugBase(link.href.replace(/^\//, ''));
    return !parsed || retirementFor(parsed) === null;
  });
}
