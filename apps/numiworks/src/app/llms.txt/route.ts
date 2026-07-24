import { SEO_CITIES } from '@lib/seo/cities';
import { getSiteOrigin } from '@lib/site/origin';

export const dynamic = 'force-static';

/**
 * /llms.txt — a curated, LLM-facing index of the site (the emerging GEO
 * convention; see llmstxt.org). Points AI answer engines (ChatGPT, Claude,
 * Perplexity, Gemini) at the highest-value content: the tools, the
 * destination guides, and the question-page URL patterns — so they can
 * discover, understand, and cite us in generated answers.
 *
 * Static: regenerated at build only, so it costs nothing per request.
 */
export function GET(): Response {
  const origin = getSiteOrigin();
  const guides = SEO_CITIES.slice(0, 40)
    .map((c) => `- [${c.name}, ${c.countryName}](${origin}/destinations/${c.slug})`)
    .join('\n');

  const body = `# numiworks

> AI travel planner and in-depth destination guides. Describe a trip in one
> sentence and get a day-by-day itinerary; or browse research-backed guides for
> cities worldwide covering the best time to visit, daily budgets, neighborhoods,
> food, transport, weather, and safety. Experiences booked via Viator;
> whole-home stays via VRBO. Operated by Adored Moments LLC.

## Tools
- [AI Trip Planner](${origin}/plan): describe your trip in a sentence, get a day-by-day itinerary with bookable experiences.
- [Trip Cost Estimator](${origin}/trip-cost-estimator): estimate and optimize a trip budget by destination and travel style.
- [Where should I go? quiz](${origin}/quiz): AI destination match from your preferences.
- [Search experiences](${origin}/search): tours, day trips, and activities worldwide.

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
- ${origin}/{city}-budget-per-day — daily costs
- ${origin}/{city}-with-kids — family travel
- ${origin}/{city}-{n}-day-itinerary — ready-made itineraries (1–7 days)
- ${origin}/things-to-do-in-{city} — top activities
- ${origin}/hidden-gems-in-{city} — beyond the tourist trail

## About
- [About](${origin}/about) · [Contact](${origin}/contact) · [Privacy](${origin}/privacy) · [Terms](${origin}/terms)
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
