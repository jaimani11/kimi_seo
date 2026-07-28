import { PlanDayCard } from '@/features/plan/plan-day-card';
import { ReserveAllButton } from '@/features/plan/reserve-all-button';
import { SeoPageShell } from './seo-page-shell';
import type { SeoCity } from '@lib/seo/cities';
import type { Plan } from '@lib/plan/types';
import { GygActivitiesWidget } from '@/features/experiences/getyourguide-widget';

/**
 * SEO-shaped itinerary page rendered at `/{city-slug}-{n}-day-itinerary`.
 *
 * Reuses the same day-by-day plan UI the dynamic `/plan` route uses,
 * but with:
 *
 *   - Crawlable, keyword-rich URL form
 *   - H1 + intro paragraph optimized for the canonical query
 *     ("3-Day Tokyo Itinerary")
 *   - Structured copy that explains the rhythm of the plan
 *   - Auto-cross-link rail (in SeoPageShell) to other lengths +
 *     things-to-do for the same city + sibling destinations
 *
 * When live Expedia inventory is unavailable, the days still render
 * with their theme headers + per-slot briefs — the rationale text
 * stays on-page, just without the bookable picks.
 */
export function ItinerarySeoPage({
  city,
  days,
  plan,
  loadError,
}: {
  city: SeoCity;
  days: number;
  plan: Plan | null;
  loadError: string | null;
}) {
  const slug = `${city.slug}-${days}-day-itinerary`;
  const totalPicks = plan?.days.flatMap((d) => d.slots.flatMap((s) => s.picks)).length ?? 0;

  return (
    <SeoPageShell
      city={city}
      currentSlug={slug}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Plan a trip', href: '/plan' },
        { label: city.name, href: `/things-to-do-in-${city.slug}` },
        { label: `${days}-day itinerary` },
      ]}
    >
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-6 md:pt-12">
        <header className="mx-auto max-w-3xl text-center">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {city.countryName} · {days}-day plan
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {days}-Day {city.name} Itinerary
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '1.05rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: '1rem auto 0',
            }}
          >
            {city.oneLiner} A {days}-day rhythm of bookable Viator experiences — each day
            themed, each slot stamped with reasoning and an affiliate-tracked reserve link.
          </p>
        </header>
      </section>

      <GygActivitiesWidget
        destination={city.name}
        heading={`Best ${city.name} experiences for a ${days}-day trip`}
        blurb={`Skip-the-line tickets and guided tours to pair with your ${days}-day plan.`}
        campaignSlug={`itin-${city.slug}-${days}day`}
        numberOfItems={6}
      />

      {plan ? (
        <section className="mx-auto max-w-6xl px-6 pt-4 pb-12 md:pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.72rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--ink-tertiary)',
                margin: 0,
              }}
            >
              {totalPicks} live Viator experiences · day-by-day
            </p>
            <ReserveAllButton totalPicks={totalPicks} />
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {plan.days.map((d) => (
              <PlanDayCard key={d.dayNumber} day={d} />
            ))}
          </div>

          <p
            className="mt-10 text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              color: 'var(--ink-tertiary)',
              margin: 0,
            }}
          >
            Affiliate links to Viator. We may earn a commission from completed bookings.
          </p>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <p
            className="mt-8 rounded-xl border px-5 py-4 text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: 'var(--ink-secondary)',
              borderColor: 'var(--border-subtle)',
              background: 'var(--surface-elevated)',
            }}
          >
            {loadError
              ? `Live experience inventory is temporarily unavailable. Try again in a moment.`
              : `Live experience inventory hasn’t been configured for this environment yet. The day-by-day frame is in place; bookable picks will populate once VIATOR_API_KEY is set.`}
          </p>
        </section>
      )}
    </SeoPageShell>
  );
}

/**
 * JSON-LD `TouristTrip` payload — Google's preferred shape for
 * itinerary content. Pair with the visible page in a single render.
 */
export function buildItineraryJsonLd({
  city,
  days,
  plan,
  canonical,
}: {
  city: SeoCity;
  days: number;
  plan: Plan | null;
  canonical: string;
}): string {
  const itinerary: Record<string, unknown>[] =
    plan?.days.map((d) => ({
      '@type': 'ItemList',
      itemListElement: d.slots.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.picks[0]?.experience.title ?? s.brief,
      })),
    })) ?? [];

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: `${days}-Day ${city.name} Itinerary`,
    description: `${city.oneLiner} A ${days}-day plan with bookable experiences, day-by-day, in ${city.name}, ${city.countryName}.`,
    touristType: 'Leisure',
    itinerary,
    url: canonical,
    image: 'https://stayviaowner.com/og-default.png',
    provider: {
      '@type': 'Organization',
      name: 'stayviaowner',
      url: 'https://stayviaowner.com',
    },
    location: {
      '@type': 'Place',
      name: `${city.name}, ${city.countryName}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: city.coordinates.lat,
        longitude: city.coordinates.lng,
      },
    },
  };
  return JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
