import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { parseSeoSlug, enumerateAllSeoSlugs } from '@lib/seo/route-parser';
import { retirementFor, heldPageTitle } from '@lib/seo/gobookt-retirement';
import { canonicalUrl } from '@lib/site/origin';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { HeldEditorialBridge } from '@/features/seo/held-editorial-bridge';
import {
  VerticalLandingPage,
  buildVerticalLandingJsonLd,
  type VerticalKind,
} from '@/features/seo/vertical-landing-page';
import {
  BestTimeSeoPage,
  buildBestTimeJsonLd,
  WeatherMonthSeoPage,
  buildWeatherMonthJsonLd,
  WhereToStaySeoPage,
  buildWhereToStayJsonLd,
  WhereToGoMonthSeoPage,
  buildWhereToGoMonthJsonLd,
} from '@/features/seo/climate-seo-pages';
import { findClimate, findDestinationGuide, monthName } from '@adored/seo-data';

/**
 * Top-level catch-all that powers every programmatic SEO surface:
 *
 *   /{city-slug}-{n}-day-itinerary  →  Itinerary page (n days, live picks)
 *   /things-to-do-in-{city-slug}    →  Activity discovery page
 *
 * Slugs that don't match a recognized pattern or aren't in the
 * `SEO_CITIES` allowlist 404 — preventing thin-content spam pages
 * Google would otherwise penalize.
 *
 * All allowed slugs are statically generated at build time via
 * `generateStaticParams` for fast first paint and clean indexability.
 *
 * Coexists with all the existing top-level routes (`/search`,
 * `/destinations`, `/plan`, etc.) — Next.js prefers static segments
 * over dynamic, so this catch-all only fires for un-matched paths.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // 1h — refresh inventory but stay cache-friendly.

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return enumerateAllSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSeoSlug(slug);
  if (!parsed) {
    return { robots: { index: false, follow: false } };
  }

  const canonical = canonicalUrl(`/${slug}`);

  // Viator retirement: redirected families never render their own metadata
  // (they 308 at request time and are dropped from generateStaticParams). Held
  // pure-experience pages get a clean, Viator-free title and are noindexed while
  // they await the GSC/backlink traffic review.
  const retire = retirementFor(parsed);
  if (retire?.kind === 'redirect') return { alternates: { canonical } };
  if (retire?.kind === 'held') {
    return {
      title: `${heldPageTitle(parsed)} · gobookt`,
      description:
        'Find where to stay on gobookt — Booking.com availability and prices for your dates.',
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }

  // Resolve a destination photo for the Open Graph card. Pinterest,
  // Facebook, X and Slack all read this — without it, rich pins fall
  // back to the pin's own image (no page-context photo). cruise-region
  // (retired → redirects) + where-to-go-month don't map to a single city,
  // so they skip the OG image.
  const ogCity =
    parsed.kind === 'comparison'
      ? parsed.comparison.a
      : parsed.kind === 'cruise-region' || parsed.kind === 'where-to-go-month'
        ? null
        : parsed.city;
  const ogImages = ogCity
    ? [
        {
          url: resolveDestinationPhoto({
            name: ogCity.name,
            country: ogCity.countryCode,
            ...(ogCity.region ? { region: ogCity.region } : {}),
          }).url,
          width: 1200,
          height: 630,
          alt: ogCity.name,
        },
      ]
    : undefined;

  if (parsed.kind === 'best-time') {
    const title = `Best Time to Visit ${parsed.city.name}: Month by Month · gobookt`;
    const description = `When to visit ${parsed.city.name}, ${parsed.city.countryName} — monthly highs and lows, rain days, and an honest verdict for all 12 months, from 5-year climate normals.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'weather-month') {
    const m = findClimate(parsed.city.slug)?.months[parsed.monthIndex];
    const title = `${parsed.city.name} Weather in ${monthName(parsed.monthIndex)} · gobookt`;
    const description = m
      ? `${parsed.city.name} in ${monthName(parsed.monthIndex)}: average highs of ${m[0]}°C, lows of ${m[1]}°C, and ~${m[2]} rain days — plus what to pack and whether it's a good month to go.`
      : `${parsed.city.name} weather in ${monthName(parsed.monthIndex)} — temperatures, rain, and what to pack.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'where-to-stay') {
    const title = `Where to Stay in ${parsed.city.name}: Best Areas & Neighborhoods · gobookt`;
    const description = `The best neighborhoods to base yourself in ${parsed.city.name}, ${parsed.city.countryName} — ranked, mapped, with walking distances from the center.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'where-to-go-month') {
    const title = `Where to Go in ${monthName(parsed.monthIndex)}: Destinations Ranked by Weather · gobookt`;
    const description = `Every destination we cover, ranked for ${monthName(parsed.monthIndex)} by daytime comfort and rain days — computed from 5-year climate normals.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website' },
      twitter: { card: 'summary', title, description },
    };
  }

  if (parsed.kind === 'hotels-in') {
    const title = `Hotels in ${parsed.city.name}, ${parsed.city.countryName} · gobookt`;
    const description = `Find hotels, apartments and vacation rentals in ${parsed.city.name}, ${parsed.city.countryName}. Powered by Booking.com.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'flights-to') {
    const title = `Cheap flights to ${parsed.city.name}, ${parsed.city.countryName} · gobookt`;
    const description = `Compare flights to ${parsed.city.name} across every major airline. One-way, round-trip · Powered by Booking.com Flights.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'cars-in') {
    const title = `Car rentals in ${parsed.city.name}, ${parsed.city.countryName} · gobookt`;
    const description = `Rent a car at ${parsed.city.name}'s airports and city pick-up points. Every major rental company · Powered by Booking.com.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'hotels-themed') {
    const { city, theme } = parsed;
    const heading = HOTEL_THEME_HEADING[theme];
    const title = `${heading} in ${city.name}, ${city.countryName} · gobookt`;
    const description = `${heading} in ${city.name}, ${city.countryName} — real Booking.com guest reviews. ${HOTEL_THEME_TAGLINE[theme]}`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'flights-themed') {
    const { city } = parsed;
    const title = `Cheap flights to ${city.name}, ${city.countryName} · gobookt`;
    const description = `The lowest available fares to ${city.name} on Booking.com Flights. Compare every major carrier, see the cheapest weekday.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'cars-themed') {
    const { city, theme } = parsed;
    const label = theme === 'cheap' ? 'Cheap car rental' : 'Airport car rental';
    const title = `${label} in ${city.name}, ${city.countryName} · gobookt`;
    const description = theme === 'cheap'
      ? `Lowest daily rates on rental cars in ${city.name}. Every major brand on Booking.com Cars.`
      : `Pick up a rental car at ${city.name}'s airport terminals. Every major counter on arrivals via Booking.com Cars.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'things-themed') {
    const { city, variant } = parsed;
    const label = THINGS_VARIANT_HEADING[variant];
    const title = `${label} in ${city.name}, ${city.countryName} · gobookt`;
    const description = `${label} in ${city.name}, ${city.countryName} — bookable through Booking.com Attractions. Skip-the-line, verified guides.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  // Any remaining kind is a retired Viator family already handled by the gate
  // above; fall through defensively to noindex.
  return { alternates: { canonical }, robots: { index: false, follow: false } };
}

const HOTEL_THEME_HEADING: Record<string, string> = {
  best: 'Best hotels',
  cheap: 'Cheap hotels',
  luxury: 'Luxury hotels',
  family: 'Family-friendly hotels',
  boutique: 'Boutique hotels',
  'pet-friendly': 'Pet-friendly hotels',
  beach: 'Beach hotels',
  apartments: 'Apartments',
};

const HOTEL_THEME_TAGLINE: Record<string, string> = {
  best: 'Curated for the highest-rated stays.',
  cheap: 'Curated for great prices.',
  luxury: 'Curated for 5-star service.',
  family: 'Curated for family-room amenities.',
  boutique: 'Curated for design and character.',
  'pet-friendly': 'Curated for properties that welcome pets.',
  beach: 'Curated for beachfront and sea-view stays.',
  apartments: 'Curated for self-catered apartments and aparthotels.',
};

const THINGS_VARIANT_HEADING: Record<string, string> = {
  'top-attractions': 'Top attractions',
  free: 'Free things to do',
  museums: 'Museums',
  tours: 'Tours',
};

export default async function ProgrammaticSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSeoSlug(slug);
  if (!parsed) notFound();

  const canonical = canonicalUrl(`/${slug}`);

  // Viator retirement gate. Redirected families 308 to their closest live
  // Booking.com/stays equivalent (one hop). Held pure-experience pages render an
  // honest, Viator-free bridge (noindex) until the traffic review.
  const retire = retirementFor(parsed);
  if (retire?.kind === 'redirect') permanentRedirect(retire.to);
  if (retire?.kind === 'held') {
    if (parsed.kind === 'comparison') {
      return (
        <HeldEditorialBridge
          title={heldPageTitle(parsed)}
          city={parsed.comparison.a}
          secondaryCity={parsed.comparison.b}
        />
      );
    }
    if (parsed.kind === 'themed-list') {
      return <HeldEditorialBridge title={heldPageTitle(parsed)} city={parsed.city} />;
    }
  }

  if (parsed.kind === 'where-to-go-month') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildWhereToGoMonthJsonLd({
              monthIndex: parsed.monthIndex,
              canonical,
              siteUrl: canonicalUrl('/').replace(/\/$/, ''),
            }),
          }}
        />
        <WhereToGoMonthSeoPage monthIndex={parsed.monthIndex} />
      </>
    );
  }

  if (parsed.kind === 'best-time') {
    const climate = findClimate(parsed.city.slug);
    if (!climate) notFound();
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildBestTimeJsonLd({ city: parsed.city, climate, canonical }),
          }}
        />
        <BestTimeSeoPage
          city={parsed.city}
          climate={climate}
          guide={findDestinationGuide(parsed.city.slug)}
          bookCta={{
            label: `Compare hotels in ${parsed.city.name}`,
            href: `/hotels-in-${parsed.city.slug}`,
            blurb: `Find and compare the best-value ${parsed.city.name} hotels on Booking.com.`,
          }}
        />
      </>
    );
  }

  if (parsed.kind === 'weather-month') {
    const climate = findClimate(parsed.city.slug);
    if (!climate) notFound();
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildWeatherMonthJsonLd({
              city: parsed.city,
              monthIndex: parsed.monthIndex,
              climate,
              canonical,
            }),
          }}
        />
        <WeatherMonthSeoPage
          city={parsed.city}
          monthIndex={parsed.monthIndex}
          climate={climate}
          bookCta={{
            label: `Compare hotels in ${parsed.city.name}`,
            href: `/hotels-in-${parsed.city.slug}`,
            blurb: `Find and compare the best-value ${parsed.city.name} hotels on Booking.com.`,
          }}
        />
      </>
    );
  }

  if (parsed.kind === 'where-to-stay') {
    const guide = findDestinationGuide(parsed.city.slug);
    if (!guide) notFound();
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildWhereToStayJsonLd({ city: parsed.city, guide, canonical }),
          }}
        />
        <WhereToStaySeoPage
          city={parsed.city}
          guide={guide}
          stayCta={{
            label: `Compare ${parsed.city.name} hotels`,
            href: `/hotels-in-${parsed.city.slug}`,
          }}
        />
      </>
    );
  }

  if (
    parsed.kind === 'hotels-in' ||
    parsed.kind === 'flights-to' ||
    parsed.kind === 'cars-in'
  ) {
    const { city } = parsed;
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildVerticalLandingJsonLd({
              kind: parsed.kind,
              city,
              canonical,
            }),
          }}
        />
        <VerticalLandingPage kind={parsed.kind} city={city} />
      </>
    );
  }

  if (
    parsed.kind === 'hotels-themed' ||
    parsed.kind === 'flights-themed' ||
    parsed.kind === 'cars-themed' ||
    parsed.kind === 'things-themed'
  ) {
    const { city } = parsed;
    const verticalKind = verticalKindFor(parsed);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildVerticalLandingJsonLd({
              kind: verticalKind,
              city,
              canonical,
            }),
          }}
        />
        <VerticalLandingPage kind={verticalKind} city={city} />
      </>
    );
  }

  // Every non-retired kind returned above; retired kinds (itinerary, weekend,
  // things-to-do, themed-list, comparison) are handled by the gate at the top.
  // Anything else is defensively a 404.
  notFound();
}

type ThemedRouteMatch =
  | { kind: 'hotels-themed'; theme: string }
  | { kind: 'flights-themed'; theme: string }
  | { kind: 'cars-themed'; theme: string }
  | { kind: 'things-themed'; variant: string };

function verticalKindFor(parsed: ThemedRouteMatch): VerticalKind {
  if (parsed.kind === 'hotels-themed') {
    switch (parsed.theme) {
      case 'best':
        return 'best-hotels';
      case 'cheap':
        return 'cheap-hotels';
      case 'luxury':
        return 'luxury-hotels';
      case 'family':
        return 'family-hotels';
      case 'boutique':
        return 'boutique-hotels';
      case 'pet-friendly':
        return 'pet-friendly-hotels';
      case 'beach':
        return 'beach-hotels';
      case 'apartments':
        return 'apartments';
      default:
        return 'hotels-in';
    }
  }
  if (parsed.kind === 'flights-themed') {
    return 'cheap-flights';
  }
  if (parsed.kind === 'cars-themed') {
    return parsed.theme === 'cheap' ? 'cheap-cars' : 'airport-cars';
  }
  // things-themed
  switch (parsed.variant) {
    case 'top-attractions':
      return 'top-attractions';
    case 'free':
      return 'free-things';
    case 'museums':
      return 'museums';
    case 'tours':
      return 'tours';
    default:
      return 'top-attractions';
  }
}

