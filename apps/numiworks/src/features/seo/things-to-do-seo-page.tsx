import Link from 'next/link';
import { ExperienceCardStandard } from '@/features/experience-cards';
import { SeoPageShell } from './seo-page-shell';
import { CrossBrandBooking } from '@adored/ui';
import { cityBookingLinks } from '@adored/brand-config';
import type { SeoCity } from '@lib/seo/cities';
import type { Experience } from '@core/experience';
import type { ThingsToDoFaq } from '@adored/seo-data';
import { GygActivitiesWidget } from '@/features/experiences/getyourguide-widget';

/**
 * SEO-shaped activity discovery page rendered at
 * `/things-to-do-in-{city-slug}`. Wraps Viator's freetext search in
 * an editorial frame.
 *
 * Renders even when Viator inventory is missing — copy + cross-links
 * stay; the experience grid degrades to a soft empty state.
 */
export function ThingsToDoSeoPage({
  city,
  experiences,
  loadError,
  faq,
}: {
  city: SeoCity;
  experiences: Experience[];
  loadError: string | null;
  faq: ThingsToDoFaq[];
}) {
  const slug = `things-to-do-in-${city.slug}`;
  return (
    <SeoPageShell
      city={city}
      currentSlug={slug}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: `${city.name}, ${city.countryName}` },
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
            {city.countryName} · things to do
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
            Things to do in {city.name}
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
            {city.oneLiner} A live, curated grid from Viator — tours, day trips, food
            experiences, skip-the-line tickets — every card bookable, every price real-time.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[2, 3, 5, 7].map((n) => (
              <Link
                key={n}
                href={`/${city.slug}-${n}-day-itinerary`}
                className="rounded-full border px-3.5 py-1.5 transition-colors hover:border-[color:var(--accent-primary)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--ink-secondary)',
                  borderColor: 'var(--border-subtle)',
                  textDecoration: 'none',
                }}
              >
                {n}-day plan →
              </Link>
            ))}
          </div>
        </header>
      </section>

      {/* GetYourGuide widgets — complement the Viator grid below with
        * an alternate provider so per-partner CTR can be compared. */}
      <GygActivitiesWidget
        destination={city.name}
        heading={`Best things to do in ${city.name}`}
        blurb={`Skip-the-line tickets and guided tours in ${city.name}, bookable on GetYourGuide.`}
        campaignSlug={`ttd-${city.slug}-best`}
        numberOfItems={6}
      />
      <GygActivitiesWidget
        destination={`day trips from ${city.name}`}
        heading={`Day trips from ${city.name}`}
        blurb={`Half-day and full-day excursions to nearby attractions.`}
        campaignSlug={`ttd-${city.slug}-day-trips`}
        numberOfItems={6}
      />

      <section className="mx-auto max-w-6xl px-6 pt-4 pb-16">
        {experiences.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((e) => (
              <ExperienceCardStandard key={e.id} experience={e} dense />
            ))}
          </div>
        ) : (
          <p
            className="mx-auto mt-8 max-w-2xl rounded-xl border px-5 py-4 text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: 'var(--ink-secondary)',
              borderColor: 'var(--border-subtle)',
              background: 'var(--surface-elevated)',
            }}
          >
            {loadError
              ? `Live Viator inventory is temporarily unavailable. Try again in a moment.`
              : `Live Viator inventory hasn’t been configured for this environment yet. Cards will populate once VIATOR_API_KEY is set.`}
          </p>
        )}
      </section>

      {faq.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-14">
          <h2
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--ink-primary)',
              margin: '0 0 1.25rem',
            }}
          >
            Things to do in {city.name} — FAQ
          </h2>
          <div className="flex flex-col gap-3">
            {faq.map((f) => (
              <details
                key={f.question}
                className="rounded-xl border px-5 py-4"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-elevated)' }}
              >
                <summary
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {f.question}
                </summary>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    color: 'var(--ink-secondary)',
                    margin: '0.75rem 0 0',
                  }}
                >
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <CrossBrandBooking
        cityName={city.name}
        links={cityBookingLinks(city.slug, { exclude: 'numiworks' })}
      />
    </SeoPageShell>
  );
}

/**
 * schema.org `ItemList` of `TouristAttraction`s + a `Place` for the
 * city. Google reads this and gets a structured map of what's on the
 * page; pairs well with the standard BreadcrumbList already emitted
 * by the SeoPageShell's Breadcrumbs.
 */
export function buildThingsToDoJsonLd({
  city,
  experiences,
  canonical,
  faq,
}: {
  city: SeoCity;
  experiences: Experience[];
  canonical: string;
  faq: ThingsToDoFaq[];
}): string {
  const items = experiences.slice(0, 20).map((e, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'TouristAttraction',
      name: e.title,
      description: e.summary,
      url: canonical,
      ...(e.photos[0]?.url ? { image: e.photos[0].url } : {}),
      ...(e.reviews.averageRating !== null && e.reviews.total > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: e.reviews.averageRating.toFixed(2),
              reviewCount: e.reviews.total,
              bestRating: '5',
              worstRating: '1',
            },
          }
        : {}),
    },
  }));

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Things to do in ${city.name}, ${city.countryName}`,
    description: city.oneLiner,
    url: canonical,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: items.length,
    itemListElement: items,
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  // ItemList only when there's live inventory to list; FAQPage always.
  const payloads = items.length > 0 ? [itemList, faqPage] : [faqPage];
  return JSON.stringify(payloads).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
