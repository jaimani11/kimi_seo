import { SEO_CITIES } from '@lib/seo/cities';
import { getSiteOrigin } from '@lib/site/origin';

export const dynamic = 'force-static';

/**
 * /llms.txt — curated, LLM-facing index (GEO convention; llmstxt.org).
 * Points AI answer engines at the tools, destination guides, and question-
 * page URL patterns so they can discover, understand, and cite us.
 * Static: regenerated at build only, zero per-request cost.
 */
export function GET(): Response {
  const origin = getSiteOrigin();
  const guides = SEO_CITIES.slice(0, 40)
    .map((c) => `- [${c.name}, ${c.countryName}](${origin}/destinations/${c.slug})`)
    .join('\n');

  const body = `# gotript

> Vacation rentals, hotels, flights, packages, cars, and things to do
> worldwide, plus research-backed destination guides (best time to visit,
> budgets, neighborhoods, weather, transport, safety). Whole-home rentals via
> VRBO; everything else via Expedia. Operated by Adored Moments LLC.

## Search
- [Stays & hotels](${origin}/stays): hotels and lodging worldwide.
- [Vacation rentals](${origin}/vacation-rentals): whole homes, villas, and cabins on VRBO.
- [Flights](${origin}/flights): compare fares across airlines.
- [Packages](${origin}/packages): hotel + flight bundles.
- [Things to do](${origin}/things-to-do): tours, tickets, and activities.
- [Car rentals](${origin}/cars): airport and city pickups.
- [Destinations](${origin}/destinations): browse all city guides.

## Destination guides
Each guide covers best time to visit, daily budget, neighborhoods, food, transport, safety, an interactive map, and FAQs:
${guides}

…and 200+ more cities indexed at ${origin}/destinations.

## Question pages (one page per city)
Direct, factual answers to common travel questions — substitute a city slug:
- ${origin}/best-time-to-visit-{city} — when to go
- ${origin}/how-many-days-in-{city} — ideal trip length
- ${origin}/is-{city}-worth-visiting — is it worth a trip
- ${origin}/{city}-weather-in-{month} — month-by-month weather
- ${origin}/{city}-with-kids — family travel
- ${origin}/things-to-do-in-{city} — top activities
- ${origin}/hidden-gems-in-{city} — beyond the tourist trail

## About
- [About](${origin}/about) · [Contact](${origin}/contact) · [Privacy](${origin}/privacy) · [Terms](${origin}/terms)
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
