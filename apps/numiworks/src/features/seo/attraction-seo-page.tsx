import Link from 'next/link';
import { ExperienceCardStandard } from '@/features/experience-cards';
import { SeoPageShell } from './seo-page-shell';
import type { Attraction } from '@lib/seo/attractions';
import type { SeoCity } from '@lib/seo/cities';
import type { Experience } from '@core/experience';

/**
 * SEO page for a single attraction — /attractions/{slug}.
 *
 * The layout is intentionally practical: intro → key facts → the
 * one thing everyone searches for (skip-the-line advice) → live
 * bookable inventory → getting there → nearby → FAQs. Each section
 * answers a real search query and provides a booking path.
 */
export function AttractionSeoPage({
  attraction,
  city,
  experiences,
  loadError,
}: {
  attraction: Attraction;
  city: SeoCity;
  experiences: Experience[];
  loadError: string | null;
}) {
  const cityHref = `/destinations/${city.slug}`;
  const thingsToDoHref = `/things-to-do-in-${city.slug}`;

  return (
    <SeoPageShell
      city={city}
      currentSlug={`attractions/${attraction.slug}`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name, href: cityHref },
        { label: attraction.name },
      ]}
    >
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pt-8 pb-8 md:pt-12">
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
          {city ? `${city.name}, ${city.countryName} · attraction` : 'Attraction'}
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
          {attraction.name}
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1.1rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            margin: '1rem 0 0',
          }}
        >
          {attraction.oneLiner}
        </p>
        <p
          className="mt-6"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            lineHeight: 1.65,
            color: 'var(--ink-secondary)',
            margin: '1.5rem 0 0',
          }}
        >
          {attraction.fullDescription}
        </p>
      </section>

      {/* ── Key facts grid ──────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <FactCard label="Opening hours" value={attraction.openingHours} />
          <FactCard
            label="Ticket price"
            value={`$${attraction.ticketPriceUSD.from}–$${attraction.ticketPriceUSD.to}`}
            note={attraction.ticketPriceUSD.note}
          />
          <FactCard
            label="Visit duration"
            value={`${attraction.durationHours.min}–${attraction.durationHours.max} hours`}
          />
          <FactCard label="Best time" value={attraction.bestTimeToVisit} />
        </div>
      </section>

      {/* ── Skip the line ────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-4xl px-6 py-8"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <SectionHeading>How to skip the line</SectionHeading>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            lineHeight: 1.65,
            color: 'var(--ink-secondary)',
            margin: '1rem 0 0',
          }}
        >
          {attraction.skipTheLineAdvice}
        </p>
      </section>

      {/* ── Live tours + tickets rail ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <SectionHeading>Tours &amp; tickets</SectionHeading>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: 'var(--ink-tertiary)',
            margin: '0.75rem 0 1.5rem',
          }}
        >
          Live inventory from Viator — every card bookable, prices refresh hourly.
        </p>
        {loadError ? (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: 'var(--ink-tertiary)',
            }}
          >
            Inventory is temporarily unavailable — try again in a moment.
          </p>
        ) : experiences.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: 'var(--ink-tertiary)',
            }}
          >
            No tours in the search index right now — check back soon.
          </p>
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
          >
            {experiences.slice(0, 12).map((exp) => (
              <ExperienceCardStandard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </section>

      {/* ── Getting there + nearby ──────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <SectionHeading>Getting there</SectionHeading>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: 'var(--ink-secondary)',
                margin: '1rem 0 0',
              }}
            >
              {attraction.gettingThere}
            </p>
          </div>
          <div>
            <SectionHeading>Nearby food &amp; coffee</SectionHeading>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: 'var(--ink-secondary)',
                margin: '1rem 0 0',
              }}
            >
              {attraction.nearby}
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-4xl px-6 py-10"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <SectionHeading>Frequently asked questions</SectionHeading>
        <div className="mt-6 space-y-4">
          {attraction.faqs.map((faq) => (
            <details
              key={faq.q}
              style={{
                borderRadius: '0.5rem',
                border: '1px solid var(--border-subtle)',
                padding: '1rem 1.25rem',
                background: 'var(--surface-overlay)',
              }}
            >
              <summary
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--ink-primary)',
                  cursor: 'pointer',
                }}
              >
                {faq.q}
              </summary>
              <p
                className="mt-3"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--ink-secondary)',
                  margin: '0.75rem 0 0',
                }}
              >
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Related links ───────────────────────────────────────── */}
      {city ? (
        <section
          className="mx-auto max-w-4xl px-6 py-8"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <SectionHeading>Plan the rest of your {city.name} trip</SectionHeading>
          <div className="mt-4 flex flex-wrap gap-2">
            <RelatedChip
              href={cityHref}
              label={`${city.name} travel guide`}
            />
            <RelatedChip
              href={thingsToDoHref}
              label={`Things to do in ${city.name}`}
            />
            <RelatedChip
              href={`/${city.slug}-3-day-itinerary`}
              label={`3-day ${city.name} itinerary`}
            />
            <RelatedChip
              href={`/${city.slug}-with-kids`}
              label={`${city.name} with kids`}
            />
            <RelatedChip
              href={`/day-trips-from-${city.slug}`}
              label={`Day trips from ${city.name}`}
            />
          </div>
        </section>
      ) : null}
    </SeoPageShell>
  );
}

// ── Presentational helpers ────────────────────────────────────────

function FactCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div
      style={{
        padding: '1.25rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-overlay)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          fontWeight: 700,
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.95rem',
          fontWeight: 600,
          lineHeight: 1.4,
          color: 'var(--ink-primary)',
          margin: '0.5rem 0 0',
        }}
      >
        {value}
      </p>
      {note ? (
        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            color: 'var(--ink-tertiary)',
            margin: '0.4rem 0 0',
          }}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '1.4rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: 'var(--ink-primary)',
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

function RelatedChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        borderRadius: '999px',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-overlay)',
        fontFamily: 'var(--font-inter)',
        fontSize: '0.85rem',
        fontWeight: 500,
        color: 'var(--ink-secondary)',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  );
}

/**
 * Build TouristAttraction + FAQPage + BreadcrumbList JSON-LD for the
 * attraction. Rendered as a <script type="application/ld+json"> by
 * the page route.
 */
export function buildAttractionJsonLd({
  attraction,
  city,
  canonical,
}: {
  attraction: Attraction;
  city: SeoCity;
  canonical: string;
}): string {
  const touristAttraction = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attraction.name,
    description: attraction.fullDescription,
    url: canonical,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: attraction.coordinates.lat,
      longitude: attraction.coordinates.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressCountry: city.countryCode,
    },
    openingHours: attraction.openingHours,
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: attraction.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Destinations',
        item: '/destinations',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: city.name,
        item: `/destinations/${city.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: attraction.name,
        item: canonical,
      },
    ],
  };

  return JSON.stringify([touristAttraction, faqPage, breadcrumbs]);
}
