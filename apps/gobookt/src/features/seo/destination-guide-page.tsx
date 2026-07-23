import Link from 'next/link';
import Image from 'next/image';
import { SeoPageShell } from './seo-page-shell';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import { findClimate, findNeighborhoodPois } from '@adored/seo-data';
import { haversineKm, distanceLabel } from '@adored/travel-tools';
import {
  ClimatePanel,
  LocalTimeStrip,
  DestinationMap,
  WalkDistances,
  SmartStayOffer,
  type MapPin,
} from '@adored/ui';
import { BookingSearchWidget } from '../site/booking-widget';
import { bookingHotelsSearchHref } from '@lib/affiliate/booking-com-multicategory';
import {
  buildGobooktDestinationExperience,
  buildGobooktDestinationJsonLd,
} from './gobookt-destination-experience';

/**
 * GoBookt destination page rendered at `/destinations/{slug}`.
 *
 * This is GoBookt's ACCOMMODATION-DECISION experience — not a trip-planning
 * guide. Its job: help the visitor choose WHERE and WHAT TYPE of stay, then
 * hand off to Booking.com for live availability. Composition, headings, CTAs,
 * accommodation types and structured data are decided by
 * `buildGobooktDestinationExperience` (the brand interpreter over the shared
 * facts), so GoBookt reads distinctly from GoTript even on the same city.
 *
 * Search paths (both money-path safe):
 *   - Hero search = Booking.com SDK widget (native destination+date+guest).
 *   - Contextual area / stay CTAs = the hardened `resolveBookingSearchUrl`
 *     deep-links (null → controlled "temporarily unavailable" state, never a
 *     homepage link).
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
  const exp = buildGobooktDestinationExperience({ city, guide });

  // Neighborhood map pins double as tracked "Hotels in {area}" deep-links
  // (fail-closed → pin renders non-bookable). Distances are computed facts.
  const mapPins: MapPin[] = findNeighborhoodPois(city.slug).map((n) => ({
    lat: n.lat,
    lng: n.lng,
    label: n.name,
    kind: 'neighborhood' as const,
    detail: distanceLabel(haversineKm(city.coordinates, n)),
    href: bookingHotelsSearchHref({ destination: `${n.name}, ${city.name}` }) ?? undefined,
    ctaLabel: `Search ${n.name} stays →`,
  }));

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
      {/* Hero — accommodation-first, no planning/things-to-do CTAs */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '48vh' }}>
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
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pt-24 pb-20 text-center md:pt-28 md:pb-24">
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
        </div>
      </section>

      {/* Search — Booking.com SDK widget (native destination + dates + guests) */}
      <section className="mx-auto -mt-10 mb-4 w-full max-w-3xl px-6">
        <div
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '1rem',
            boxShadow: 'var(--elev-card)',
            padding: '1.1rem 1.1rem 1.25rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              margin: '0 0 0.6rem',
            }}
          >
            Search stays in {city.name} on Booking.com
          </p>
          <BookingSearchWidget />
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Best areas to stay — led */}
        <Section title="Best areas to stay" eyebrow="Where to base yourself">
          <p style={paragraphStyle}>
            Pick the area that puts you closest to what you came for, then search live stays there.
          </p>
          <ul style={{ ...listStyle, gap: '0.75rem' }}>
            {exp.bestAreas.map((a) => (
              <li key={a.name} style={areaCardStyle}>
                <div>
                  <p style={areaNameStyle}>{a.name}</p>
                  <p style={areaBlurbStyle}>{a.blurb}</p>
                </div>
                {a.href ? (
                  <a href={a.href} rel="sponsored nofollow noopener noreferrer" style={areaCtaStyle}>
                    {a.ctaLabel} →
                  </a>
                ) : (
                  <span style={areaUnavailStyle}>Search temporarily unavailable</span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {/* Neighborhood comparison — neutral dimensions (distance + character) */}
        <Section title={`Compare ${city.name} neighborhoods`} eyebrow="On the map">
          <p style={paragraphStyle}>
            Areas compared by distance from the centre and their general character — not by price
            or availability, which you&apos;ll see live on Booking.com.
          </p>
          <DestinationMap cityName={city.name} center={city.coordinates} pins={mapPins} />
          <WalkDistances
            items={mapPins
              .filter((p) => p.detail)
              .map((p) => ({ name: p.label, kind: p.kind, label: p.detail ?? '' }))}
          />
        </Section>

        {/* Accommodation types — hotel-class, destination-aware */}
        <Section title={`Types of stay in ${city.name}`} eyebrow="What to book">
          <ul style={typeGridStyle}>
            {exp.accommodationTypes.map((t) => (
              <li key={t.label} style={typeCardStyle}>
                <p style={typeLabelStyle}>{t.label}</p>
                <p style={typeNoteStyle}>{t.note}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Who each area suits — traveler profile → area fit */}
        <Section title="Who each area suits" eyebrow="Match your trip">
          <ul style={listStyle}>
            {exp.travelerFit.map((f) => (
              <li key={f.profile} style={listItemStyle}>
                <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>{f.profile}.</strong>{' '}
                {f.text}
              </li>
            ))}
          </ul>
        </Section>

        {/* Seasonality for stay planning — evidence-safe */}
        <Section title="When to plan your stay" eyebrow="Seasonality">
          {climate ? (
            <LocalTimeStrip
              cityName={city.name}
              tz={climate.tz}
              lat={city.coordinates.lat}
              lng={city.coordinates.lng}
            />
          ) : null}
          <p style={paragraphStyle}>{exp.seasonality}</p>
          {climate ? <ClimatePanel cityName={city.name} months={climate.months} /> : null}
        </Section>

        {/* Practical accommodation considerations — factual */}
        <Section title="Practical things to weigh" eyebrow="Before you book">
          <p style={paragraphStyle}>{exp.practical}</p>
        </Section>

        {/* Related accommodation pages */}
        <Section title="Keep exploring stays" eyebrow="Related">
          <ul style={{ ...listStyle, gap: '0.5rem' }}>
            {exp.related.map((r) => (
              <li key={`${r.label}-${r.href}`}>
                <Link href={r.href} style={relatedLinkStyle}>
                  {r.label} →
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </article>

      {/* Booking.com handoff — tracked, or a controlled unavailable state */}
      {exp.handoffHref ? (
        <SmartStayOffer
          href={exp.handoffHref}
          headline={`Set on ${city.name}? Compare stays on Booking.com.`}
          subline="Search live availability and prices — the price you pay is the same as booking direct."
          ctaLabel={`Search ${city.name} stays →`}
          storageKey={`sso-${city.slug}`}
        />
      ) : (
        <section className="mx-auto my-6 w-full max-w-3xl px-6">
          <div
            role="status"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.85rem',
              padding: '1rem 1.25rem',
              textAlign: 'center',
            }}
          >
            <p style={{ ...paragraphStyle, margin: 0 }}>
              Live Booking.com search for {city.name} is temporarily unavailable. Please try again
              shortly — the search box above will be back.
            </p>
          </div>
        </section>
      )}
    </SeoPageShell>
  );
}

// Re-export the accommodation-framed JSON-LD builder so the route keeps a
// single import surface for this page's structured data.
export { buildGobooktDestinationJsonLd as buildDestinationGuideJsonLd };

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

const areaCardStyle: React.CSSProperties = {
  listStyle: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '0.9rem 1.1rem',
  borderRadius: '0.85rem',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-subtle)',
};

const areaNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1rem',
  fontWeight: 800,
  color: 'var(--ink-primary)',
  margin: 0,
};

const areaBlurbStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: 'var(--ink-secondary)',
  margin: '0.2rem 0 0',
};

const areaCtaStyle: React.CSSProperties = {
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

const areaUnavailStyle: React.CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-inter)',
  fontSize: '0.76rem',
  color: 'var(--ink-tertiary)',
  fontStyle: 'italic',
};

const typeGridStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '0.75rem',
};

const typeCardStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  borderRadius: '0.75rem',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-subtle)',
};

const typeLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.92rem',
  fontWeight: 800,
  color: 'var(--ink-primary)',
  margin: 0,
};

const typeNoteStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.82rem',
  lineHeight: 1.45,
  color: 'var(--ink-secondary)',
  margin: '0.25rem 0 0',
};

const relatedLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--accent-primary)',
  textDecoration: 'none',
};
