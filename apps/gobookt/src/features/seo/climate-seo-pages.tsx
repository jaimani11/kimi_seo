import Link from 'next/link';
import { SeoPageShell } from './seo-page-shell';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import {
  type CityClimate,
  MONTH_NAMES,
  monthSlug,
  monthName,
  cToF,
  rateMonths,
  bestMonthIndices,
  packingList,
  monthBlurb,
  rankCitiesForMonth,
  monthVerdict,
  monthComfortScore,
  hasDestinationGuide,
  findNeighborhoodPois,
  type MonthVerdict,
} from '@adored/seo-data';
import { haversineKm, distanceLabel } from '@adored/travel-tools';
import { ClimatePanel, DestinationMap, WalkDistances, type MapPin } from '@adored/ui';

/**
 * Climate-powered SEO surfaces — all four render exclusively from the
 * baked ERA5 normals + guide data (no runtime fetches), so they build
 * fast, never break, and read identically on every request:
 *
 *   /best-time-to-visit-{city}     seasonal verdict + month grid
 *   /{city}-weather-in-{month}     one month, fully unpacked
 *   /where-to-stay-in-{city}       ranked neighborhoods + map
 *   /where-to-go-in-{month}        cities ranked by month comfort
 */

const VERDICT_COLORS: Record<MonthVerdict, string> = {
  excellent: '#16a34a',
  good: '#65a30d',
  fair: '#d97706',
  challenging: '#dc2626',
};

const VERDICT_LABELS: Record<MonthVerdict, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  challenging: 'Tough',
};

// ── Best time to visit ────────────────────────────────────────────

export function BestTimeSeoPage({
  city,
  climate,
  guide,
  bookCta,
}: {
  city: SeoCity;
  climate: CityClimate;
  guide: DestinationGuide | null;
  /** Brand-specific booking CTA — VRBO/hotels/experiences per brand. */
  bookCta?: BookingCtaSpec | null;
}) {
  const rated = rateMonths(climate);
  const best = bestMonthIndices(climate).slice(0, 3);
  const worst = bestMonthIndices(climate).at(-1) ?? 0;

  return (
    <SeoPageShell
      city={city}
      currentSlug={`best-time-to-visit-${city.slug}`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name, href: `/destinations/${city.slug}` },
        { label: 'Best time to visit' },
      ]}
    >
      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <PageHeading
          eyebrow="When to go"
          title={`The Best Time to Visit ${city.name}`}
          lede={`Month-by-month climate data for ${city.name}, ${city.countryName} — daily highs and lows, rain days, and an honest verdict for every month of the year.`}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            margin: '1.4rem 0 0',
            alignItems: 'center',
          }}
        >
          <span style={chipLabelStyle}>Best months</span>
          {best.map((i) => (
            <Link key={i} href={`/${city.slug}-weather-in-${monthSlug(i)}`} style={monthChipStyle('#16a34a')}>
              {monthName(i)}
            </Link>
          ))}
          <span style={{ ...chipLabelStyle, marginLeft: '0.6rem' }}>Toughest</span>
          <Link href={`/${city.slug}-weather-in-${monthSlug(worst)}`} style={monthChipStyle('#dc2626')}>
            {monthName(worst)}
          </Link>
        </div>

        <BookingCta cta={bookCta} />

        {guide ? (
          <p style={{ ...paragraphStyle, marginTop: '1.4rem' }}>
            <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>
              {guide.bestTimeToVisit.months}.
            </strong>{' '}
            {guide.bestTimeToVisit.blurb}
          </p>
        ) : null}

        <div style={{ margin: '1.6rem 0 2.4rem' }}>
          <ClimatePanel cityName={city.name} months={climate.months} />
        </div>

        <h2 style={h2Style}>{city.name} climate, month by month</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.7rem',
            margin: '1.2rem 0 0',
          }}
        >
          {rated.map((r) => (
            <Link
              key={r.index}
              href={`/${city.slug}-weather-in-${monthSlug(r.index)}`}
              style={{
                display: 'block',
                padding: '0.85rem 1rem',
                borderRadius: '0.7rem',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-elevated)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <p style={{ ...smallHeadingStyle, margin: 0 }}>{monthName(r.index)}</p>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  margin: '0.3rem 0 0',
                }}
              >
                {r.month[0]}° / {r.month[1]}°C
              </p>
              <p style={{ ...tinyStyle, margin: '0.2rem 0 0' }}>~{r.month[2]} rain days</p>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: VERDICT_COLORS[r.verdict],
                  margin: '0.45rem 0 0',
                }}
              >
                {VERDICT_LABELS[r.verdict]}
              </p>
            </Link>
          ))}
        </div>

        <h2 style={{ ...h2Style, marginTop: '2.6rem' }}>Plan around it</h2>
        <p style={paragraphStyle}>
          Dates locked in? Start from the{' '}
          <Link href={`/destinations/${city.slug}`} style={inlineLinkStyle}>
            {city.name} travel guide
          </Link>{' '}
          or jump straight to a{' '}
          <Link href={`/${city.slug}-3-day-itinerary`} style={inlineLinkStyle}>
            3-day
          </Link>
          {', '}
          <Link href={`/${city.slug}-5-day-itinerary`} style={inlineLinkStyle}>
            5-day
          </Link>
          {' or '}
          <Link href={`/${city.slug}-7-day-itinerary`} style={inlineLinkStyle}>
            7-day itinerary
          </Link>
          .
        </p>
      </article>
    </SeoPageShell>
  );
}

export function buildBestTimeJsonLd({
  city,
  climate,
  canonical,
}: {
  city: SeoCity;
  climate: CityClimate;
  canonical: string;
}): string {
  const best = bestMonthIndices(climate).slice(0, 3).map((i) => monthName(i));
  const rated = rateMonths(climate);
  const warmest = rated.reduce((a, b) => (b.month[0] > a.month[0] ? b : a));
  const wettest = rated.reduce((a, b) => (b.month[2] > a.month[2] ? b : a));
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `When is the best time to visit ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Based on 5-year climate normals, the most comfortable months in ${city.name} are ${best.join(', ')} — balancing daytime temperatures against rain days.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the hottest month in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${monthName(warmest.index)} is the warmest month in ${city.name}, with average daily highs around ${warmest.month[0]}°C (${cToF(warmest.month[0])}°F).`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the rainiest month in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${monthName(wettest.index)} sees the most rain in ${city.name} — roughly ${wettest.month[2]} rain days in a typical year.`,
        },
      },
    ],
    url: canonical,
  };
  return JSON.stringify(faq).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// ── {City} weather in {month} ─────────────────────────────────────

export function WeatherMonthSeoPage({
  city,
  monthIndex,
  climate,
  bookCta,
}: {
  city: SeoCity;
  monthIndex: number;
  climate: CityClimate;
  /** Brand-specific booking CTA — VRBO/hotels/experiences per brand. */
  bookCta?: BookingCtaSpec | null;
}) {
  const m = climate.months[monthIndex] ?? climate.months[0];
  if (!m) return null;
  const score = monthComfortScore(m);
  const verdict = monthVerdict(score);
  const packing = packingList(m);
  const prev = (monthIndex + 11) % 12;
  const next = (monthIndex + 1) % 12;

  return (
    <SeoPageShell
      city={city}
      currentSlug={`${city.slug}-weather-in-${monthSlug(monthIndex)}`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name, href: `/destinations/${city.slug}` },
        { label: `Weather in ${monthName(monthIndex)}` },
      ]}
    >
      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <PageHeading
          eyebrow={`Verdict: ${VERDICT_LABELS[verdict]} month`}
          title={`${city.name} Weather in ${monthName(monthIndex)}`}
          lede={monthBlurb(city.name, monthIndex, m)}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.7rem',
            margin: '1.6rem 0 0',
          }}
        >
          <StatTile label="Average high" value={`${m[0]}°C / ${cToF(m[0])}°F`} />
          <StatTile label="Average low" value={`${m[1]}°C / ${cToF(m[1])}°F`} />
          <StatTile label="Rain days" value={`~${m[2]}`} />
          <StatTile label="Precipitation" value={`${m[3]} mm`} />
        </div>

        <BookingCta cta={bookCta} />

        <h2 style={{ ...h2Style, marginTop: '2.4rem' }}>
          What to pack for {city.name} in {monthName(monthIndex)}
        </h2>
        <ul style={listStyle}>
          {packing.map((p) => (
            <li key={p} style={listItemStyle}>
              {p}
            </li>
          ))}
        </ul>

        <h2 style={{ ...h2Style, marginTop: '2.4rem' }}>
          {monthName(monthIndex)} against the rest of the year
        </h2>
        <div style={{ margin: '1rem 0 0' }}>
          <ClimatePanel cityName={city.name} months={climate.months} />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            margin: '2.2rem 0 0',
          }}
        >
          <Link href={`/${city.slug}-weather-in-${monthSlug(prev)}`} style={pillLinkStyle}>
            ← {monthName(prev)}
          </Link>
          <Link href={`/best-time-to-visit-${city.slug}`} style={pillLinkStyle}>
            Best time to visit {city.name}
          </Link>
          <Link href={`/${city.slug}-weather-in-${monthSlug(next)}`} style={pillLinkStyle}>
            {monthName(next)} →
          </Link>
        </div>
      </article>
    </SeoPageShell>
  );
}

export function buildWeatherMonthJsonLd({
  city,
  monthIndex,
  climate,
  canonical,
}: {
  city: SeoCity;
  monthIndex: number;
  climate: CityClimate;
  canonical: string;
}): string {
  const m = climate.months[monthIndex] ?? [0, 0, 0, 0];
  const verdict = monthVerdict(monthComfortScore(m));
  const good = verdict === 'excellent' || verdict === 'good';
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${monthName(monthIndex)} a good time to visit ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: good
            ? `Yes — ${monthName(monthIndex)} is a ${verdict} month in ${city.name}, with daily highs around ${m[0]}°C (${cToF(m[0])}°F) and roughly ${m[2]} rain days.`
            : `${monthName(monthIndex)} is a ${verdict} month in ${city.name} — expect highs around ${m[0]}°C (${cToF(m[0])}°F) and about ${m[2]} rain days. If your dates are flexible, other months are more comfortable.`,
        },
      },
      {
        '@type': 'Question',
        name: `How hot is ${city.name} in ${monthName(monthIndex)}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Average daily highs reach ${m[0]}°C (${cToF(m[0])}°F) and nights drop to about ${m[1]}°C (${cToF(m[1])}°F).`,
        },
      },
      {
        '@type': 'Question',
        name: `Does it rain in ${city.name} in ${monthName(monthIndex)}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${city.name} averages ${m[2]} rain days and ${m[3]}mm of precipitation in ${monthName(monthIndex)}.`,
        },
      },
    ],
    url: canonical,
  };
  return JSON.stringify(faq).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// ── Where to stay ─────────────────────────────────────────────────

export function WhereToStaySeoPage({
  city,
  guide,
  stayCta,
}: {
  city: SeoCity;
  guide: DestinationGuide;
  /** Brand-specific accommodation CTA — internal route per app. */
  stayCta?: { label: string; href: string };
}) {
  const pois = findNeighborhoodPois(city.slug);
  const poiByName = new Map(pois.map((p) => [p.name, p]));
  const pins: MapPin[] = pois.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    label: p.name,
    kind: 'neighborhood' as const,
    detail: distanceLabel(haversineKm(city.coordinates, p)),
  }));
  const top = guide.neighborhoods[0];

  return (
    <SeoPageShell
      city={city}
      currentSlug={`where-to-stay-in-${city.slug}`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name, href: `/destinations/${city.slug}` },
        { label: 'Where to stay' },
      ]}
    >
      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <PageHeading
          eyebrow="Neighborhood guide"
          title={`Where to Stay in ${city.name}`}
          lede={`The ${guide.neighborhoods.length} areas worth basing yourself in ${city.name}, ${city.countryName} — ranked by our editors, with walking distances from the center. ${top ? `First-timers: start with ${top.name}.` : ''}`}
        />

        {pins.length > 0 ? (
          <div style={{ margin: '1.8rem 0 0' }}>
            <DestinationMap cityName={city.name} center={city.coordinates} pins={pins} />
          </div>
        ) : null}

        <div style={{ margin: '2rem 0 0', display: 'grid', gap: '1rem' }}>
          {guide.neighborhoods.map((n, i) => {
            const poi = poiByName.get(n.name);
            return (
              <div
                key={n.name}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '0.85rem',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-elevated)',
                }}
              >
                <p style={{ ...smallHeadingStyle, margin: 0 }}>
                  {i === 0 ? 'Top pick' : `#${i + 1}`}
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--ink-primary)',
                    margin: '0.25rem 0 0.4rem',
                  }}
                >
                  {n.name}
                </h2>
                <p style={{ ...paragraphStyle, margin: 0 }}>{n.blurb}</p>
                {poi ? (
                  <p style={{ ...tinyStyle, margin: '0.55rem 0 0' }}>
                    {distanceLabel(haversineKm(city.coordinates, poi))}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {stayCta ? (
          <div style={{ margin: '2rem 0 0', textAlign: 'center' }}>
            <Link
              href={stayCta.href}
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '0.8rem 1.6rem',
                borderRadius: '999px',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              {stayCta.label}
            </Link>
          </div>
        ) : null}

        <h2 style={{ ...h2Style, marginTop: '2.6rem' }}>Getting around</h2>
        <p style={paragraphStyle}>{guide.transportation.primary}</p>
        <p style={paragraphStyle}>{guide.transportation.tips}</p>
      </article>
    </SeoPageShell>
  );
}

export function buildWhereToStayJsonLd({
  city,
  guide,
  canonical,
}: {
  city: SeoCity;
  guide: DestinationGuide;
  canonical: string;
}): string {
  const top = guide.neighborhoods[0];
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the best area to stay in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: top
            ? `${top.name} is our top pick for most travelers. ${top.blurb}`
            : `See the ranked neighborhood list for ${city.name}.`,
        },
      },
      {
        '@type': 'Question',
        name: `How many neighborhoods should I consider in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `We recommend ${guide.neighborhoods.length} areas in ${city.name}: ${guide.neighborhoods.map((n) => n.name).join(', ')}.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I get around ${city.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: guide.transportation.primary },
      },
    ],
    url: canonical,
  };
  return JSON.stringify(faq).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// ── Where to go in {month} ────────────────────────────────────────

export function WhereToGoMonthSeoPage({ monthIndex }: { monthIndex: number }) {
  const ranked = rankCitiesForMonth(monthIndex);
  const top = ranked.slice(0, 21);
  const avoid = ranked.slice(-6).reverse();
  const excellentCount = ranked.filter((r) => r.verdict === 'excellent').length;
  const prev = (monthIndex + 11) % 12;
  const next = (monthIndex + 1) % 12;

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        <article className="mx-auto max-w-4xl px-6 py-12 md:py-16">
          <PageHeading
            eyebrow="Ranked by real climate data"
            title={`Where to Go in ${monthName(monthIndex)}`}
            lede={`All ${ranked.length} destinations we cover, ranked for ${monthName(monthIndex)} by daytime comfort and rain — computed from 5-year ERA5 climate normals, not vibes. ${excellentCount} destinations rate "excellent" this month.`}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '0.8rem',
              margin: '2rem 0 0',
            }}
          >
            {top.map((r, i) => (
              <Link
                key={r.city.slug}
                href={`/${r.city.slug}-weather-in-${monthSlug(monthIndex)}`}
                style={{
                  display: 'block',
                  padding: '0.95rem 1.1rem',
                  borderRadius: '0.8rem',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-elevated)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <p style={{ ...smallHeadingStyle, margin: 0 }}>
                  #{i + 1} · {r.city.countryName}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--ink-primary)',
                    margin: '0.2rem 0 0.3rem',
                  }}
                >
                  {r.city.name}
                </p>
                <p style={{ ...tinyStyle, margin: 0 }}>
                  {r.month[0]}°C / {cToF(r.month[0])}°F days · ~{r.month[2]} rain days
                </p>
              </Link>
            ))}
          </div>

          <h2 style={{ ...h2Style, marginTop: '2.8rem' }}>
            Think twice in {monthName(monthIndex)}
          </h2>
          <p style={paragraphStyle}>
            Great places, wrong month — extreme heat, cold, or peak rains make these the
            toughest picks right now:
          </p>
          <ul style={listStyle}>
            {avoid.map((r) => (
              <li key={r.city.slug} style={listItemStyle}>
                <Link href={`/${r.city.slug}-weather-in-${monthSlug(monthIndex)}`} style={inlineLinkStyle}>
                  <strong>{r.city.name}</strong>
                </Link>{' '}
                — {r.month[0]}°C ({cToF(r.month[0])}°F) days, ~{r.month[2]} rain days.
              </li>
            ))}
          </ul>

          <h2 style={{ ...h2Style, marginTop: '2.8rem' }}>Browse another month</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0 0' }}>
            {MONTH_NAMES.map((name, i) =>
              i === monthIndex ? null : (
                <Link key={name} href={`/where-to-go-in-${monthSlug(i)}`} style={pillLinkStyle}>
                  {name}
                </Link>
              ),
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', margin: '2rem 0 0' }}>
            <Link href={`/where-to-go-in-${monthSlug(prev)}`} style={pillLinkStyle}>
              ← {monthName(prev)}
            </Link>
            <Link href={`/where-to-go-in-${monthSlug(next)}`} style={pillLinkStyle}>
              {monthName(next)} →
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function buildWhereToGoMonthJsonLd({
  monthIndex,
  canonical,
  siteUrl,
}: {
  monthIndex: number;
  canonical: string;
  siteUrl: string;
}): string {
  const top = rankCitiesForMonth(monthIndex).slice(0, 21);
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Where to go in ${monthName(monthIndex)} — destinations ranked by climate`,
    url: canonical,
    numberOfItems: top.length,
    itemListElement: top.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${r.city.name}, ${r.city.countryName}`,
      url: hasDestinationGuide(r.city.slug)
        ? `${siteUrl}/destinations/${r.city.slug}`
        : `${siteUrl}/${r.city.slug}-weather-in-${monthSlug(monthIndex)}`,
    })),
  };
  return JSON.stringify(list).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// ── Shared building blocks ────────────────────────────────────────

export interface BookingCtaSpec {
  /** Button/headline text, e.g. "Search vacation rentals in Ibiza". */
  label: string;
  /** href — a direct affiliate deep link (VRBO/Booking) or a brand-
   *  relative route to an inventory page. */
  href: string;
  /** One-line value prop under the headline. */
  blurb?: string;
  /** True for a direct external affiliate link — opens a new tab and
   *  carries rel="sponsored" (correct for paid/affiliate outbound). */
  external?: boolean;
}

/**
 * The conversion surface. Climate pages pull high-intent trip-planning
 * traffic ("ibiza weather in june") — without this, that traffic reads
 * the forecast and leaves. This drives it straight to the brand's
 * bookable inventory for the city (VRBO, Booking.com, or experiences),
 * which is where the affiliate commission is earned.
 */
function BookingCta({ cta }: { cta?: BookingCtaSpec | null }) {
  if (!cta) return null;
  const externalAttrs = cta.external
    ? { target: '_blank', rel: 'noopener noreferrer sponsored' }
    : {};
  return (
    <a
      href={cta.href}
      {...externalAttrs}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        margin: '1.8rem 0 0.4rem',
        padding: '1.3rem 1.5rem',
        borderRadius: '1rem',
        background: 'var(--accent-primary)',
        color: '#ffffff',
        textDecoration: 'none',
        boxShadow: '0 12px 26px -12px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.64rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          Plan your stay
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: '1.18rem',
            fontWeight: 800,
            lineHeight: 1.2,
            marginTop: '0.2rem',
          }}
        >
          {cta.label}
        </span>
        {cta.blurb ? (
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              opacity: 0.92,
              marginTop: '0.3rem',
            }}
          >
            {cta.blurb}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.95rem',
          fontWeight: 800,
          padding: '0.6rem 1.15rem',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        Search →
      </span>
    </a>
  );
}

function PageHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <header>
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
      <h1
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'clamp(1.9rem, 4.2vw, 2.8rem)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          color: 'var(--ink-primary)',
          margin: '0.5rem 0 0',
        }}
      >
        {title}
      </h1>
      <p style={{ ...paragraphStyle, marginTop: '1rem' }}>{lede}</p>
    </header>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '0.9rem 1rem',
        borderRadius: '0.8rem',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-elevated)',
        textAlign: 'center',
      }}
    >
      <p style={{ ...smallHeadingStyle, margin: 0 }}>{label}</p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '1.15rem',
          fontWeight: 800,
          color: 'var(--accent-primary)',
          margin: '0.35rem 0 0',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </p>
    </div>
  );
}

const paragraphStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1.02rem',
  lineHeight: 1.65,
  color: 'var(--ink-secondary)',
  margin: '0 0 0.8rem',
};

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)',
  fontWeight: 800,
  lineHeight: 1.12,
  letterSpacing: '-0.02em',
  color: 'var(--ink-primary)',
  margin: '0 0 0.8rem',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '0.6rem 0 0',
  display: 'grid',
  gap: '0.6rem',
};

const listItemStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.98rem',
  lineHeight: 1.55,
  color: 'var(--ink-secondary)',
  paddingLeft: '1.1rem',
  position: 'relative',
};

const smallHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.62rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-tertiary)',
  fontWeight: 700,
};

const tinyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.78rem',
  color: 'var(--ink-tertiary)',
};

const chipLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.66rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-tertiary)',
  fontWeight: 700,
};

const inlineLinkStyle: React.CSSProperties = {
  color: 'var(--accent-primary)',
  textDecoration: 'none',
  fontWeight: 600,
};

const pillLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.82rem',
  fontWeight: 600,
  padding: '0.5rem 0.95rem',
  borderRadius: '999px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-elevated)',
  color: 'var(--ink-primary)',
  textDecoration: 'none',
};

function monthChipStyle(color: string): React.CSSProperties {
  return {
    fontFamily: 'var(--font-inter)',
    fontSize: '0.82rem',
    fontWeight: 700,
    padding: '0.45rem 0.9rem',
    borderRadius: '999px',
    background: color,
    color: '#ffffff',
    textDecoration: 'none',
  };
}
