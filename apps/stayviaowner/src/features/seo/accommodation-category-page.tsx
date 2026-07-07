import Link from 'next/link';
import type { AccommodationCategory } from '@lib/seo/accommodation-categories';
import { allAccommodationCategories } from '@lib/seo/accommodation-categories';
import { findCityBySlug, type SeoCity } from '@lib/seo/cities';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';

/**
 * Category-level accommodation landing page for stayviaowner sub-brands
 * — /villas, /cabins, /cottages, /beach-houses, /ski-lodges,
 * /lake-houses. Shared component; each route file just passes the
 * category slug in.
 */
export function AccommodationCategoryPage({
  category,
}: {
  category: AccommodationCategory;
}) {
  const cities = category.topCitySlugs
    .map((slug) => findCityBySlug(slug))
    .filter((c): c is SeoCity => c !== null);
  const otherCategories = allAccommodationCategories().filter(
    (c) => c.slug !== category.slug,
  );

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        className="relative w-full"
        style={{
          background: 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)',
          color: '#fff',
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 pb-14 text-center md:pt-20 md:pb-16">
          <div
            aria-hidden
            style={{
              fontSize: '3.5rem',
              lineHeight: 1,
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))',
            }}
          >
            {category.emoji}
          </div>
          <p
            className="mt-5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
            }}
          >
            stayviaowner · sub-brand
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            {category.name}
          </h1>
          <p
            className="mt-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontSize: '1.15rem',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.92)',
              margin: '0.75rem 0 0',
            }}
          >
            {category.tagline}
          </p>
          <p
            className="mx-auto mt-6 max-w-3xl"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.9)',
              margin: '1.5rem auto 0',
            }}
          >
            {category.intro}
          </p>
        </div>
      </section>

      {/* ── Featured destinations ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-10">
        <SectionHeading
          eyebrow="Where these shine"
          heading={`Top destinations for ${category.name.toLowerCase()}`}
        />
        <div
          className="mt-8 grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
        >
          {cities.map((city) => (
            <CityCard key={city.slug} city={city} category={category} />
          ))}
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-4xl px-6 py-10"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <SectionHeading eyebrow="Frequently asked" heading="Common questions" />
        <div className="mt-8 space-y-4">
          {category.faqs.map((faq) => (
            <details
              key={faq.q}
              style={{
                borderRadius: '0.6rem',
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

      {/* ── Other categories ────────────────────────────────────── */}
      <section
        className="mx-auto max-w-6xl px-6 py-10"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <SectionHeading
          eyebrow="Explore more"
          heading="Every accommodation type on stayviaowner"
        />
        <div
          className="mt-6 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          {otherCategories.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.9rem 1.15rem',
                borderRadius: '0.65rem',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-overlay)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <span aria-hidden style={{ fontSize: '1.35rem' }}>
                {c.emoji}
              </span>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--ink-primary)',
                    margin: 0,
                  }}
                >
                  {c.name}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.72rem',
                    color: 'var(--ink-tertiary)',
                    margin: '0.15rem 0 0',
                  }}
                >
                  {c.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function CityCard({
  city,
  category,
}: {
  city: SeoCity;
  category: AccommodationCategory;
}) {
  const photo = resolveDestinationPhoto({
    name: city.name,
    country: city.countryCode,
    ...(city.region ? { region: city.region } : {}),
  });
  const label = `${category.name.replace(/s$/, '')} rentals in ${city.name}`;
  const href = `/vacation-rentals?ss=${encodeURIComponent(city.name)}&utm_source=stayviaowner&utm_medium=category&utm_campaign=${category.slug}-${city.slug}`;
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0.85rem',
        overflow: 'hidden',
        background: 'var(--surface-overlay)',
        border: '1px solid var(--border-subtle)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '160px',
          backgroundImage: `url(${photo.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div style={{ padding: '1rem 1.15rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 700,
            margin: 0,
          }}
        >
          {city.countryName}
        </p>
        <h3
          className="mt-1"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            margin: '0.15rem 0 0',
          }}
        >
          {label}
        </h3>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontSize: '0.85rem',
            lineHeight: 1.45,
            color: 'var(--ink-tertiary)',
            margin: '0.5rem 0 0',
          }}
        >
          {city.oneLiner}
        </p>
      </div>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  heading,
}: {
  eyebrow: string;
  heading: string;
}) {
  return (
    <div className="text-center">
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          fontWeight: 700,
          margin: 0,
        }}
      >
        {eyebrow}
      </p>
      <h2
        className="mt-3"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        {heading}
      </h2>
    </div>
  );
}

export function buildAccommodationCategoryJsonLd({
  category,
  canonical,
}: {
  category: AccommodationCategory;
  canonical: string;
}): string {
  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} · stayviaowner`,
    description: category.intro,
    url: canonical,
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: category.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return JSON.stringify([collectionPage, faqPage]);
}
