import Link from 'next/link';
import Image from 'next/image';
import { SeoPageShell } from './seo-page-shell';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import { findClimate, findNeighborhoodPois, attractionsByCity } from '@adored/seo-data';
import { haversineKm, distanceLabel } from '@adored/travel-tools';
import {
  ClimatePanel,
  LocalTimeStrip,
  DestinationMap,
  WalkDistances,
  SmartStayOffer,
  type MapPin,
} from '@adored/ui';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { VrboCityCallout } from '@/features/destinations/vrbo-city-callout';
import {
  buildGotriptDestinationExperience,
  buildGotriptDestinationJsonLd,
} from './gotript-destination-experience';

/**
 * GoTript destination page rendered at `/destinations/{slug}`.
 *
 * GoTript's TRIP-PLANNING experience — not an accommodation catalogue and not
 * a tours marketplace. It plans the trip (when → how many days → itinerary →
 * base area → getting around → trip style → practical) and ends on a
 * hotel-or-whole-home booking decision. Composition/headings/CTAs/JSON-LD are
 * decided by `buildGotriptDestinationExperience`, so GoTript reads distinctly
 * from GoBookt on the same city.
 *
 * Money-path: hotels → Expedia (Partnerize-tracked `buildExpediaCategoryUrl`);
 * whole homes → Vrbo (`VrboCityCallout`). No Booking.com / Viator / CJ.
 */
export async function DestinationGuidePage({
  city,
  guide,
}: {
  city: SeoCity;
  guide: DestinationGuide;
}) {
  const photo = resolveDestinationPhoto({ name: city.name, country: city.countryCode });
  const climate = findClimate(city.slug);
  const exp = buildGotriptDestinationExperience({ city, guide });

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
      href: buildExpediaCategoryUrl('hotels', { destination: `${n.name}, ${city.name}` }),
      ctaLabel: `Stays in ${n.name} →`,
    })),
  ];

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
      {/* Hero — trip-planning */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '52vh' }}>
        <div className="absolute inset-0">
          <Image src={photo.url} alt={photo.alt} fill priority sizes="100vw" style={{ objectFit: 'cover' }} />
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
            {exp.hero.heading}
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
            {exp.hero.subhead}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {exp.tripLength.options.map((o) => (
              <Link
                key={o.days}
                href={o.href}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.55rem 1.05rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.32)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {o.days}-day plan
              </Link>
            ))}
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        {/* Best time to visit */}
        <Section title={`When to visit ${city.name}`} eyebrow="Step 1 · Timing">
          {climate ? (
            <LocalTimeStrip
              cityName={city.name}
              tz={climate.tz}
              lat={city.coordinates.lat}
              lng={city.coordinates.lng}
            />
          ) : null}
          <p style={paragraphStyle}>{exp.bestTime}</p>
          {climate ? <ClimatePanel cityName={city.name} months={climate.months} /> : null}
        </Section>

        {/* How many days */}
        <Section title={`How many days in ${city.name}?`} eyebrow="Step 2 · Trip length">
          <p style={paragraphStyle}>{exp.tripLength.intro}</p>
          <ul style={itineraryRow}>
            {exp.tripLength.options.map((o) => (
              <li key={o.days}>
                <Link href={o.href} style={itineraryChip}>
                  {o.label} →
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* Suggested itinerary structure */}
        <Section title={`Build your ${city.name} itinerary`} eyebrow="Step 3 · Itinerary">
          <p style={paragraphStyle}>{exp.itineraryIntro}</p>
        </Section>

        {/* Where to base yourself */}
        <Section title="Where to base yourself" eyebrow="Step 4 · Your base">
          <ul style={listStyle}>
            {exp.baseAreas.map((n) => (
              <li key={n.name} style={listItemStyle}>
                <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>{n.name}.</strong>{' '}
                {n.blurb}
              </li>
            ))}
          </ul>
          <DestinationMap cityName={city.name} center={city.coordinates} pins={mapPins} />
          <WalkDistances
            items={mapPins
              .filter((p) => p.detail)
              .map((p) => ({ name: p.label, kind: p.kind, label: p.detail ?? '' }))}
          />
        </Section>

        {/* Getting around */}
        <Section title={`Getting around ${city.name}`} eyebrow="Step 5 · Transport">
          <p style={paragraphStyle}>{exp.gettingAround}</p>
        </Section>

        {/* Plan by trip style */}
        <Section title="Plan by trip style" eyebrow="Step 6 · Your trip">
          <ul style={listStyle}>
            {exp.tripStyles.map((t) => (
              <li key={t.label} style={listItemStyle}>
                <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>{t.label}.</strong>{' '}
                {t.text}
              </li>
            ))}
          </ul>
        </Section>

        {/* Practical planning */}
        <Section title="Practical planning" eyebrow="Step 7 · Before you go">
          <p style={paragraphStyle}>{exp.practical}</p>
        </Section>

        {/* Where to stay — hotel or whole home */}
        <Section title="Hotel or whole home?" eyebrow="Step 8 · Where to stay">
          <p style={paragraphStyle}>
            Two ways to book your {city.name} stay — pick by trip type.
          </p>
          <div style={decisionCard}>
            <div>
              <p style={decisionTitle}>Hotels & city stays</p>
              <p style={decisionNote}>
                Best for short city breaks and central locations — compare {city.name} hotels on
                Expedia.
              </p>
            </div>
            <a href={exp.whereToStay.hotelHref} rel="sponsored nofollow noopener noreferrer" style={decisionCta}>
              Compare hotels →
            </a>
          </div>
        </Section>

        {/* Related planning pages */}
        <Section title="Keep planning" eyebrow="Related">
          <ul style={{ ...listStyle, gap: '0.5rem' }}>
            {exp.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} style={relatedLinkStyle}>
                  {r.label} →
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </article>

      {/* Whole-home option — Vrbo (best for groups, space, kitchens) */}
      {exp.whereToStay.showVrbo ? <VrboCityCallout city={city} /> : null}

      <SmartStayOffer
        href={exp.whereToStay.hotelHref}
        headline={`Ready to plan ${city.name}? Lock in where you'll stay.`}
        subline="Hotels and homes on Expedia — the price you pay is the same as booking direct."
        ctaLabel={`See ${city.name} stays →`}
        storageKey={`sso-${city.slug}`}
      />
    </SeoPageShell>
  );
}

// Route keeps a single structured-data import surface for this page.
export { buildGotriptDestinationJsonLd as buildDestinationGuideJsonLd };

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

const itineraryRow: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '0.5rem 0 0',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.6rem',
};

const itineraryChip: React.CSSProperties = {
  display: 'inline-flex',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.85rem',
  fontWeight: 700,
  padding: '0.55rem 1rem',
  borderRadius: '999px',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--accent-primary)',
  textDecoration: 'none',
};

const decisionCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '1rem 1.15rem',
  borderRadius: '0.85rem',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-subtle)',
  marginTop: '0.5rem',
};

const decisionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1rem',
  fontWeight: 800,
  color: 'var(--ink-primary)',
  margin: 0,
};

const decisionNote: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: 'var(--ink-secondary)',
  margin: '0.2rem 0 0',
};

const decisionCta: React.CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  padding: '0.5rem 0.9rem',
  borderRadius: '999px',
  background: 'var(--accent-primary)',
  color: '#ffffff',
  textDecoration: 'none',
};

const relatedLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--accent-primary)',
  textDecoration: 'none',
};
