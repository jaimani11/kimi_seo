import Link from 'next/link';
import { ExperienceCardStandard } from '@/features/experience-cards';
import { SeoPageShell } from './seo-page-shell';
import type { SeoCity } from '@lib/seo/cities';
import type { SeoComparison } from '@lib/seo/comparisons';
import type { Experience } from '@core/experience';

/**
 * Phase 7 — `/{a}-vs-{b}` page.
 *
 * Side-by-side comparison of two cities on the SEO_CITIES allowlist.
 * Real intent: people about to pick a destination Google "X vs Y"
 * before they book. Our answer is editorial copy + bookable Viator
 * picks for both cities, not a hot take.
 *
 * Layout:
 *   - Eyebrow + H1 + intro paragraph
 *   - Two columns: city A snapshot / city B snapshot
 *   - Two columns: top Viator picks for each
 *   - "Pick A if … / Pick B if …" heuristic copy
 *   - Internal links to each city's own SEO surfaces
 *
 * The shell reuses SeoPageShell anchored to city A so the related
 * rail still gives Google good city-internal link density. City B's
 * surfaces are linked inline within the comparison.
 */
export function ComparisonSeoPage({
  comparison,
  experiencesA,
  experiencesB,
  loadErrorA,
  loadErrorB,
}: {
  comparison: SeoComparison;
  experiencesA: Experience[];
  experiencesB: Experience[];
  loadErrorA: string | null;
  loadErrorB: string | null;
}) {
  const { a, b } = comparison;
  const slug = `${a.slug}-vs-${b.slug}`;
  const headline = `${a.name} or ${b.name}?`;
  const sub = `A side-by-side travel guide.`;
  const intro = `${a.oneLiner} vs ${b.oneLiner.charAt(0).toLowerCase()}${b.oneLiner.slice(1)} A quick comparison of vibe, cost, and what to actually book in each.`;

  return (
    <SeoPageShell
      city={a}
      currentSlug={slug}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: `${a.name} vs ${b.name}` },
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
            {a.countryName} vs {b.countryName} · side-by-side
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
            {headline}{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              {sub}
            </em>
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
            {intro}
          </p>
        </header>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <CitySnapshot city={a} />
          <CitySnapshot city={b} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <header className="mb-5">
          <h2
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(1.5rem, 2.4vw, 1.8rem)',
              fontWeight: 400,
              letterSpacing: '-0.015em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            What to actually book in each
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <CityPicks city={a} experiences={experiencesA} loadError={loadErrorA} />
          <CityPicks city={b} experiences={experiencesB} loadError={loadErrorB} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div
          className="grid grid-cols-1 gap-5 rounded-2xl border p-6 md:grid-cols-2"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <RecommendationBlock label={`Pick ${a.name} if…`} city={a} />
          <RecommendationBlock label={`Pick ${b.name} if…`} city={b} />
        </div>
      </section>
    </SeoPageShell>
  );
}

function CitySnapshot({ city }: { city: SeoCity }) {
  return (
    <article
      className="rounded-2xl border p-5"
      style={{
        background: 'var(--surface-base)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          margin: 0,
        }}
      >
        {city.countryName}
      </p>
      <h2
        className="mt-1"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'clamp(1.5rem, 2.4vw, 1.9rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        {city.name}
      </h2>
      <p
        className="mt-3"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.95rem',
          lineHeight: 1.55,
          color: 'var(--ink-secondary)',
          margin: 0,
        }}
      >
        {city.oneLiner}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CityChip href={`/things-to-do-in-${city.slug}`} label="Things to do" />
        <CityChip href={`/${city.slug}-3-day-itinerary`} label="3-day plan" />
        <CityChip href={`/weekend-in-${city.slug}`} label="Weekend in" />
      </div>
    </article>
  );
}

function CityChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border px-3 py-1 transition-colors hover:border-[color:var(--accent-primary)]"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--ink-secondary)',
        borderColor: 'var(--border-subtle)',
        textDecoration: 'none',
      }}
    >
      {label} →
    </Link>
  );
}

function CityPicks({
  city,
  experiences,
  loadError,
}: {
  city: SeoCity;
  experiences: Experience[];
  loadError: string | null;
}) {
  const top = experiences.slice(0, 4);
  return (
    <div>
      <h3
        className="mb-3"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          margin: 0,
        }}
      >
        Top picks in {city.name}
      </h3>
      {top.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {top.map((e) => (
            <ExperienceCardStandard key={e.id} experience={e} dense />
          ))}
        </div>
      ) : (
        <p
          className="rounded-xl border px-4 py-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.88rem',
            color: 'var(--ink-secondary)',
            borderColor: 'var(--border-subtle)',
            background: 'var(--surface-elevated)',
            margin: 0,
          }}
        >
          {loadError
            ? `Live Expedia inventory is temporarily unavailable for ${city.name}.`
            : `Live Expedia inventory hasn’t been configured for this environment yet.`}
        </p>
      )}
    </div>
  );
}

function RecommendationBlock({ label, city }: { label: string; city: SeoCity }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.05rem',
          lineHeight: 1.55,
          color: 'var(--ink-secondary)',
          margin: 0,
        }}
      >
        {city.oneLiner}
      </p>
      <div className="mt-3">
        <Link
          href={`/destinations/${city.slug}`}
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          Full {city.name} travel guide →
        </Link>
      </div>
    </div>
  );
}

/**
 * Side-by-side JSON-LD. Represented as a `WebPage` whose `mainEntity`
 * is an `ItemList` of two `TouristDestination`s (the two cities).
 * Pragmatic shape — Google understands it without needing the
 * unofficial "Comparison" type.
 */
export function buildComparisonJsonLd({
  comparison,
  canonical,
}: {
  comparison: SeoComparison;
  canonical: string;
}): string {
  const { a, b } = comparison;
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${a.name} or ${b.name}? Side-by-side travel guide`,
    description: `${a.oneLiner} vs ${b.oneLiner}`,
    url: canonical,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: 2,
      itemListElement: [a, b].map((city, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'TouristDestination',
          name: city.name,
          description: city.oneLiner,
          address: {
            '@type': 'PostalAddress',
            addressCountry: city.countryCode,
            addressLocality: city.name,
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: city.coordinates.lat,
            longitude: city.coordinates.lng,
          },
        },
      })),
    },
  };
  return JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
