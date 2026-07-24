import Link from 'next/link';
import Image from 'next/image';
import { SeoPageShell } from './seo-page-shell';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import { findClimate, findNeighborhoodPois, attractionsByCity } from '@adored/seo-data';
import { getUsdRates, haversineKm, distanceLabel } from '@adored/travel-tools';
import {
  ClimatePanel,
  LocalTimeStrip,
  CurrencyStrip,
  DestinationMap,
  WalkDistances,
  CrossBrandBooking,
  SmartStayOffer,
  type MapPin,
} from '@adored/ui';
import { cityBookingLinks } from '@adored/brand-config';
import { buildVrboSearchUrl } from '@lib/affiliate/vrbo-link';
import { VrboCityCallout } from '@/features/destinations/vrbo-city-callout';
import { BrowseByType } from '@/features/site/browse-by-type';

/**
 * Rich destination guide page rendered at `/destinations/{slug}` for
 * SEO_CITIES that have authored content in DESTINATION_GUIDES.
 *
 * Eight indexable content sections:
 *   1. Hero (photo + name + oneLiner + breadcrumbs via SeoPageShell)
 *   2. Best time to visit
 *   3. Budget
 *   4. Family / couples / solo travel
 *   5. Food
 *   6. Transportation
 *   7. Neighborhoods
 *   8. Safety
 *
 * Each section is its own crawlable H2/H3 — ranks for its own
 * long-tail intent ("best time to visit Tokyo", "Tokyo budget per
 * day", etc.).
 */
import { DestinationScorecard } from './destination-scorecard';
import type { DestinationScores } from '@lib/seo/destination-scores';

export async function DestinationGuidePage({
  city,
  guide,
  scores,
}: {
  city: SeoCity;
  guide: DestinationGuide;
  /** Optional 8-dimension Destination Intelligence scorecard. Renders
   *  as a full-width section right after the article body when
   *  present; hides silently otherwise. */
  scores?: DestinationScores | null;
}) {
  const photo = resolveDestinationPhoto({
    name: city.name,
    country: city.countryCode,
  });
  const climate = findClimate(city.slug);
  const rates = await getUsdRates();
  const mapPins: MapPin[] = [
    ...attractionsByCity(city.slug).map((a) => ({
      lat: a.coordinates.lat,
      lng: a.coordinates.lng,
      label: a.name,
      kind: 'attraction' as const,
      detail: distanceLabel(haversineKm(city.coordinates, a.coordinates)),
    })),
    ...findNeighborhoodPois(city.slug).map((n) => ({
      lat: n.lat,
      lng: n.lng,
      label: n.name,
      kind: 'neighborhood' as const,
      detail: distanceLabel(haversineKm(city.coordinates, n)),
      // Stay22-MAP style: each area pin is a tracked VRBO deep-link.
      href: buildVrboSearchUrl(`${n.name}, ${city.name}`) ?? undefined,
      ctaLabel: `Homes in ${n.name} →`,
    })),
  ];

  // Intent-timed booking nudge (SmartStayOffer) — VRBO stay search for this city.
  const smartStayHref = buildVrboSearchUrl(city.name);

  return (
    <SeoPageShell
      city={city}
      currentSlug={`destinations/${city.slug}`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name },
      ]}
    >
      {/* Hero */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '52vh' }}>
        <div className="absolute inset-0">
          <Image
            src={photo.url}
            alt={photo.alt}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,10,14,0.32) 0%, rgba(8,10,14,0.55) 60%, rgba(8,10,14,0.85) 100%)',
            }}
          />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pt-24 pb-20 text-center md:pt-32 md:pb-28">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.82)',
              fontWeight: 700,
              margin: 0,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            {city.countryName} · {city.region.toUpperCase()}
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(2.4rem, 5.4vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              margin: 0,
              textShadow: '0 2px 14px rgba(0,0,0,0.55)',
            }}
          >
            The best of {city.name}
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(1rem, 1.6vw, 1.2rem)',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.95)',
              margin: '1.25rem auto 0',
              textShadow: '0 1px 6px rgba(0,0,0,0.55)',
            }}
          >
            {`The best of ${city.name} — the experiences, tours and day trips worth planning a whole trip around.`}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Link
              href={`/things-to-do-in-${city.slug}`}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '0.6rem 1.15rem',
                borderRadius: '999px',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              Things to do →
            </Link>
            {[3, 5, 7].map((n) => (
              <Link
                key={n}
                href={`/${city.slug}-${n}-day-itinerary`}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '0.55rem 1rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.32)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {n}-day plan
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VRBO cross-brand callout — the Expedia Group affiliate
        * account commissions VRBO clicks even from numiworks (Viator
        * brand), so surfacing whole-home rental as a secondary CTA
        * captures traffic that hotels alone wouldn't monetize. */}
      <VrboCityCallout city={city} />

      {/* Best things to do — Viator experience categories keyed to this city.
        * numiworks' experiences money-path is Viator (BrandSpec-enforced in
        * @adored/brand-experience); the old GetYourGuide carousels were retired
        * here. Each card deep-links to a Viator search for "{category} in
        * {city}" with the affiliate pid + sponsored rel. */}
      <BrowseByType destination={city.name} />

      {/* Sections */}
      <article className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <Section title="Best Time to Visit" eyebrow="When to Go">
          {climate ? (
            <LocalTimeStrip
              cityName={city.name}
              tz={climate.tz}
              lat={city.coordinates.lat}
              lng={city.coordinates.lng}
            />
          ) : null}
          <p style={paragraphStyle}>
            <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>
              {guide.bestTimeToVisit.months}.
            </strong>{' '}
            {guide.bestTimeToVisit.blurb}
          </p>
          {climate ? <ClimatePanel cityName={city.name} months={climate.months} /> : null}
        </Section>

        <Section title="Budget" eyebrow="Daily Spend in USD">
          <ul style={budgetGrid}>
            <BudgetTier label="Budget" value={`$${guide.budget.budgetDailyUSD}`} />
            <BudgetTier label="Mid-range" value={`$${guide.budget.midDailyUSD}`} />
            <BudgetTier label="Luxury" value={`$${guide.budget.luxuryDailyUSD}`} />
          </ul>
          <CurrencyStrip
            rates={rates}
            tiers={[
              { label: 'Budget', usd: guide.budget.budgetDailyUSD },
              { label: 'Mid-range', usd: guide.budget.midDailyUSD },
              { label: 'Luxury', usd: guide.budget.luxuryDailyUSD },
            ]}
          />
          <p style={paragraphStyle}>{guide.budget.blurb}</p>
        </Section>

        <Section title="Family Travel" eyebrow="With Kids">
          <p style={paragraphStyle}>{guide.travelStyles.family}</p>
        </Section>

        <Section title="Couples Travel" eyebrow="Together">
          <p style={paragraphStyle}>{guide.travelStyles.couples}</p>
        </Section>

        <Section title="Solo Travel" eyebrow="On Your Own">
          <p style={paragraphStyle}>{guide.travelStyles.solo}</p>
        </Section>

        <Section title="What to Eat" eyebrow="Food">
          <ul style={listStyle}>
            {guide.food.map((f) => (
              <li key={f.dish} style={listItemStyle}>
                <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>{f.dish}.</strong>{' '}
                {f.note}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Getting Around" eyebrow="Transportation">
          <p style={paragraphStyle}>{guide.transportation.primary}</p>
          <p style={paragraphStyle}>{guide.transportation.tips}</p>
        </Section>

        <Section title="Neighborhoods" eyebrow="Where to Base Yourself">
          <ul style={listStyle}>
            {guide.neighborhoods.map((n) => (
              <li key={n.name} style={listItemStyle}>
                <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>{n.name}.</strong>{' '}
                {n.blurb}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={`${city.name} Map & Walking Distances`} eyebrow="Get Your Bearings">
          <DestinationMap cityName={city.name} center={city.coordinates} pins={mapPins} />
          <WalkDistances
            items={mapPins
              .filter((p) => p.detail)
              .map((p) => ({ name: p.label, kind: p.kind, label: p.detail ?? '' }))}
          />
        </Section>

        <Section title="Safety" eyebrow="What to Know">
          <p style={paragraphStyle}>{guide.safety}</p>
        </Section>
      </article>

      {scores ? <DestinationScorecard cityName={city.name} scores={scores} /> : null}

      <CrossBrandBooking
        cityName={city.name}
        links={cityBookingLinks(city.slug, { exclude: 'numiworks' })}
      />

      {smartStayHref ? (
        <SmartStayOffer
          href={smartStayHref}
          headline={`Set on ${city.name}? Lock in where you'll stay.`}
          subline="Whole homes on VRBO — kitchens, space, and the same price as booking direct."
          ctaLabel={`See ${city.name} homes →`}
          storageKey={`sso-${city.slug}`}
        />
      ) : null}
    </SeoPageShell>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ margin: '0 0 3rem' }}>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          fontWeight: 700,
          margin: 0,
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--ink-primary)',
          margin: '0.4rem 0 1rem',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function BudgetTier({ label, value }: { label: string; value: string }) {
  return (
    <li
      style={{
        listStyle: 'none',
        padding: '1rem 1.25rem',
        borderRadius: '0.85rem',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          fontWeight: 700,
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '1.7rem',
          fontWeight: 800,
          color: 'var(--accent-primary)',
          margin: '0.35rem 0 0',
        }}
      >
        {value}
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--ink-secondary)',
            marginLeft: '0.3rem',
          }}
        >
          /day
        </span>
      </p>
    </li>
  );
}

const paragraphStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1.02rem',
  lineHeight: 1.65,
  color: 'var(--ink-secondary)',
  margin: '0 0 0.8rem',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
};

const listItemStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1.02rem',
  lineHeight: 1.6,
  color: 'var(--ink-secondary)',
};

const budgetGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '0.85rem',
  padding: 0,
  margin: '0.5rem 0 1.25rem',
};

/**
 * JSON-LD: TouristDestination + FAQPage payload — drives Google's
 * rich-result eligibility for the page. Pair with the visible
 * content above so what the user reads = what Google reads.
 */
export function buildDestinationGuideJsonLd({
  city,
  guide,
  canonical,
  imageUrl,
}: {
  city: SeoCity;
  guide: DestinationGuide;
  canonical: string;
  imageUrl: string;
}): string {
  const destination = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: `${city.name}, ${city.countryName}`,
    description: city.oneLiner,
    url: canonical,
    image: imageUrl,
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
    containedInPlace: {
      '@type': 'Country',
      name: city.countryName,
    },
    touristType: ['Family', 'Couples', 'Solo'],
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `When is the best time to visit ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${guide.bestTimeToVisit.months}. ${guide.bestTimeToVisit.blurb}`,
        },
      },
      {
        '@type': 'Question',
        name: `How much does a trip to ${city.name} cost per day?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Budget travelers can manage on about $${guide.budget.budgetDailyUSD}/day. Mid-range is about $${guide.budget.midDailyUSD}/day, luxury starts around $${guide.budget.luxuryDailyUSD}/day. ${guide.budget.blurb}`,
        },
      },
      {
        '@type': 'Question',
        name: `Is ${city.name} good for family travel?`,
        acceptedAnswer: { '@type': 'Answer', text: guide.travelStyles.family },
      },
      {
        '@type': 'Question',
        name: `Is ${city.name} safe for travelers?`,
        acceptedAnswer: { '@type': 'Answer', text: guide.safety },
      },
      {
        '@type': 'Question',
        name: `What should I eat in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: guide.food.map((f) => `${f.dish}: ${f.note}`).join(' '),
        },
      },
      {
        '@type': 'Question',
        name: `How do I get around ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${guide.transportation.primary} ${guide.transportation.tips}`,
        },
      },
    ],
  };

  // Two separate payloads in one string — most JSON-LD parsers
  // tolerate this in a single <script> tag but Google's preference
  // is one payload per <script>. The caller renders two tags.
  return JSON.stringify([destination, faq])
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}
