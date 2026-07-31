import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { parseSeoSlug, enumerateAllSeoSlugs, isNoindexSeoKind } from '@lib/seo/route-parser';
import { canonicalUrl } from '@lib/site/origin';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { buildPlan } from '@/app/plan/build-plan';
import { viatorProviderFromEnv } from '@/providers/viator';
import {
  ItinerarySeoPage,
  buildItineraryJsonLd,
} from '@/features/seo/itinerary-seo-page';
import {
  ThingsToDoSeoPage,
  buildThingsToDoJsonLd,
} from '@/features/seo/things-to-do-seo-page';
import {
  ThemedListSeoPage,
  buildThemedListJsonLd,
  THEME_META,
} from '@/features/seo/themed-list-seo-page';
import { applyEditorialVoice } from '@adored/brand-config';
import {
  ComparisonSeoPage,
  buildComparisonJsonLd,
} from '@/features/seo/comparison-seo-page';
import {
  VerticalLandingPage,
  buildVerticalLandingJsonLd,
  type VerticalKind,
} from '@/features/seo/vertical-landing-page';
import {
  CruiseRegionPage,
  buildCruiseRegionJsonLd,
} from '@/features/seo/cruise-region-page';
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
import {
  buildThingsToDoFaq,
  findClimate,
  findDestinationGuide,
  monthName,
} from '@adored/seo-data';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import type { Plan } from '@lib/plan/types';
import type { Experience } from '@core/experience';

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

  // Shared cross-brand editorial (guides / activities / climate / comparisons)
  // carries `noindex, follow`: it stays crawlable for users + internal links but
  // drops out of Google's index, concentrating stayviaowner's tight new-domain
  // crawl budget on its unique Vrbo inventory. Differentiated kinds
  // (hotels-themed = whole-home rentals) spread nothing here → stay indexed.
  const robotsMeta = isNoindexSeoKind(parsed.kind)
    ? { robots: { index: false, follow: true } as const }
    : {};

  // Resolve a destination photo for the Open Graph card. Pinterest,
  // Facebook, X and Slack all read this — without it, rich pins fall
  // back to the pin's own image (no page-context photo). Cruise-region
  // pages don't map to a single city so they skip the OG image.
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
    const title = `Best Time to Visit ${parsed.city.name}: Month by Month · stayviaowner`;
    const description = `When to visit ${parsed.city.name}, ${parsed.city.countryName} — monthly highs and lows, rain days, and an honest verdict for all 12 months, from 5-year climate normals.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'weather-month') {
    const m = findClimate(parsed.city.slug)?.months[parsed.monthIndex];
    const title = `${parsed.city.name} Weather in ${monthName(parsed.monthIndex)} · stayviaowner`;
    const description = m
      ? `${parsed.city.name} in ${monthName(parsed.monthIndex)}: average highs of ${m[0]}°C, lows of ${m[1]}°C, and ~${m[2]} rain days — plus what to pack and whether it's a good month to go.`
      : `${parsed.city.name} weather in ${monthName(parsed.monthIndex)} — temperatures, rain, and what to pack.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'where-to-stay') {
    const title = `Where to Stay in ${parsed.city.name}: Best Areas & Neighborhoods · stayviaowner`;
    const description = `The best neighborhoods to base yourself in ${parsed.city.name}, ${parsed.city.countryName} — ranked, mapped, with walking distances from the center.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'where-to-go-month') {
    const title = `Where to Go in ${monthName(parsed.monthIndex)}: Destinations Ranked by Weather · stayviaowner`;
    const description = `Every destination we cover, ranked for ${monthName(parsed.monthIndex)} by daytime comfort and rain days — computed from 5-year climate normals.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website' },
      twitter: { card: 'summary', title, description },
    };
  }

  if (parsed.kind === 'itinerary') {
    const title = `${parsed.days}-Day ${parsed.city.name} Itinerary · stayviaowner`;
    const description = `Day-by-day ${parsed.days}-day ${parsed.city.name}, ${parsed.city.countryName} itinerary with bookable Viator experiences in every slot. ${parsed.city.oneLiner}`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'weekend') {
    const title = `A Weekend in ${parsed.city.name} · 2-Day Plan · stayviaowner`;
    const description = `A focused 2-day plan for ${parsed.city.name}, ${parsed.city.countryName} — bookable Viator experiences for every slot. ${parsed.city.oneLiner}`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'themed-list') {
    const meta = THEME_META[parsed.theme];
    const framed = applyEditorialVoice('stayviaowner', parsed.city.slug, parsed.city.name, parsed.theme, {
      heading: meta.heading(parsed.city),
      intro: meta.intro(parsed.city),
      oneLiner: parsed.city.oneLiner,
    });
    const title = `${framed.title} · stayviaowner`;
    const description = framed.description;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'comparison') {
    const { a, b } = parsed.comparison;
    const title = `${a.name} vs ${b.name}: which to pick · stayviaowner`;
    const description = `${a.name}, ${a.countryName} or ${b.name}, ${b.countryName}? A side-by-side travel guide with bookable Viator experiences in each.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'hotels-in') {
    const title = `Vacation rentals in ${parsed.city.name}, ${parsed.city.countryName} · stayviaowner`;
    const description = `Whole homes, villas and apartments in ${parsed.city.name}, ${parsed.city.countryName} on Vrbo — more space, a kitchen and privacy for the whole group.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'flights-to') {
    const title = `Cheap flights to ${parsed.city.name}, ${parsed.city.countryName} · stayviaowner`;
    const description = `Compare flights to ${parsed.city.name} across every major airline. One-way, round-trip · Powered by Expedia Flights.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'cars-in') {
    const title = `Car rentals in ${parsed.city.name}, ${parsed.city.countryName} · stayviaowner`;
    const description = `Rent a car at ${parsed.city.name}'s airports and city pick-up points. Every major rental company · Powered by Expedia.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'hotels-themed') {
    const { city, theme } = parsed;
    const heading = HOTEL_THEME_HEADING[theme];
    const title = `${heading} in ${city.name}, ${city.countryName} · stayviaowner`;
    const description = `${heading} in ${city.name}, ${city.countryName} — whole-home vacation rentals with real guest reviews on Vrbo. ${HOTEL_THEME_TAGLINE[theme]}`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'flights-themed') {
    const { city } = parsed;
    const title = `Cheap flights to ${city.name}, ${city.countryName} · stayviaowner`;
    const description = `The lowest available fares to ${city.name} on Expedia Flights. Compare every major carrier, see the cheapest weekday, no add-on fees.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'cars-themed') {
    const { city, theme } = parsed;
    const label = theme === 'cheap' ? 'Cheap car rental' : 'Airport car rental';
    const title = `${label} in ${city.name}, ${city.countryName} · stayviaowner`;
    const description = theme === 'cheap'
      ? `Lowest daily rates on rental cars in ${city.name}. Every major brand on Expedia Cars.`
      : `Pick up a rental car at ${city.name}'s airport terminals. Every major counter on arrivals via Expedia Cars.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'things-themed') {
    const { city, variant } = parsed;
    const label = THINGS_VARIANT_HEADING[variant];
    const title = `${label} in ${city.name}, ${city.countryName} · stayviaowner`;
    const description = `${label} in ${city.name}, ${city.countryName} — bookable on Viator. Skip-the-line, verified guides.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'cruise-region') {
    const label = CRUISE_REGION_HEADING[parsed.region];
    const title = `${label} · stayviaowner`;
    const description = `${label} on Expedia Cruises — every major cruise line, route, and embarkation port.`;
    return {
      title,
      description,
      alternates: { canonical },
      ...robotsMeta,
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  // things-to-do
  const title = `Things to do in ${parsed.city.name}, ${parsed.city.countryName} · stayviaowner`;
  const description = `${parsed.city.oneLiner} Bookable tours, day trips, and tickets in ${parsed.city.name} on Viator.`;
  return {
    title,
    description,
    alternates: { canonical },
    ...robotsMeta,
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

const HOTEL_THEME_HEADING: Record<string, string> = {
  best: 'Top-rated vacation rentals',
  cheap: 'Affordable vacation rentals',
  luxury: 'Luxury villas & vacation rentals',
  family: 'Family vacation rentals',
  boutique: 'Unique & boutique vacation rentals',
  'pet-friendly': 'Pet-friendly vacation rentals',
  beach: 'Beachfront rentals & beach houses',
  apartments: 'Apartment rentals',
};

const HOTEL_THEME_TAGLINE: Record<string, string> = {
  best: 'The highest-rated whole-home rentals.',
  cheap: 'Budget-friendly homes and apartments.',
  luxury: 'Private-pool villas and premium homes.',
  family: 'Multi-bedroom homes with room for everyone.',
  boutique: 'Design-led, one-of-a-kind homes.',
  'pet-friendly': 'Whole homes that welcome your pets.',
  beach: 'Beach houses steps from the sand.',
  apartments: 'Self-catered apartments with full kitchens.',
};

const THINGS_VARIANT_HEADING: Record<string, string> = {
  'top-attractions': 'Top attractions',
  free: 'Free things to do',
  museums: 'Museums',
  tours: 'Tours',
};

const CRUISE_REGION_HEADING: Record<string, string> = {
  mediterranean: 'Mediterranean cruises',
  caribbean: 'Caribbean cruises',
  alaska: 'Alaska cruises',
  'northern-europe': 'Northern Europe cruises',
  asia: 'Asia cruises',
};

export default async function ProgrammaticSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSeoSlug(slug);
  if (!parsed) notFound();

  // stayviaowner (Vrbo whole-home brand): the generic `/hotels-in-{city}`
  // page reworded is an exact dup of the `/rentals/{city}` hub, so 308 →
  // the hub to consolidate equity rather than run two near-identical pages.
  if (parsed.kind === 'hotels-in') {
    permanentRedirect(`/rentals/${parsed.city.slug}`);
  }

  const canonical = canonicalUrl(`/${slug}`);

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
            label: `Search vacation rentals in ${parsed.city.name}`,
            href: buildExpediaCategoryUrl('vacation-rentals', {
              destination: `${parsed.city.name}, ${parsed.city.countryName}`,
            }),
            external: true,
            blurb: `Whole homes, villas and cabins in ${parsed.city.name} on VRBO — more space, kitchens and privacy than a hotel.`,
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
            label: `Search vacation rentals in ${parsed.city.name}`,
            href: buildExpediaCategoryUrl('vacation-rentals', {
              destination: `${parsed.city.name}, ${parsed.city.countryName}`,
            }),
            external: true,
            blurb: `Whole homes, villas and cabins in ${parsed.city.name} on VRBO — more space, kitchens and privacy than a hotel.`,
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
            label: `Search vacation rentals in ${parsed.city.name}`,
            href: `/vacation-rentals?ss=${encodeURIComponent(parsed.city.name)}`,
          }}
        />
      </>
    );
  }

  if (parsed.kind === 'itinerary' || parsed.kind === 'weekend') {
    const city = parsed.city;
    const days = parsed.kind === 'weekend' ? 2 : parsed.days;
    let plan: Plan | null = null;
    let loadError: string | null = null;
    try {
      plan = await buildPlan({
        destination: `${city.name}, ${city.countryName}`,
        nights: days,
        vibeTags: [],
      });
    } catch (e) {
      loadError = (e as Error).message;
    }
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildItineraryJsonLd({ city, days, plan, canonical }),
          }}
        />
        <ItinerarySeoPage
          city={city}
          days={days}
          plan={plan}
          loadError={loadError}
        />
      </>
    );
  }

  if (parsed.kind === 'themed-list') {
    const { city, theme } = parsed;
    const meta = THEME_META[theme];
    const experiences = await fetchExperiences(meta.viatorQuery(city));
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildThemedListJsonLd({
              city,
              theme,
              experiences: experiences.experiences,
              canonical,
            }),
          }}
        />
        <ThemedListSeoPage
          city={city}
          theme={theme}
          experiences={experiences.experiences}
          loadError={experiences.loadError}
        />
      </>
    );
  }

  // The generic-vertical branch (hotels-in / flights-to / cars-in) is
  // unreachable here: hotels-in is 308-redirected to /rentals/{city} above, and
  // flights-to / cars-in are retired (parseSeoSlug → null → notFound). The
  // themed branch below renders the reworked, Vrbo-led hotel-themed pages.
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

  if (parsed.kind === 'cruise-region') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildCruiseRegionJsonLd({
              region: parsed.region,
              canonical,
            }),
          }}
        />
        <CruiseRegionPage region={parsed.region} />
      </>
    );
  }

  if (parsed.kind === 'comparison') {
    const { a, b } = parsed.comparison;
    // Two parallel Viator fetches — keeps the page render fast since
    // both inventories load in parallel rather than sequentially.
    const [resA, resB] = await Promise.all([
      fetchExperiences(`${a.viatorQuery} tours`),
      fetchExperiences(`${b.viatorQuery} tours`),
    ]);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: buildComparisonJsonLd({
              comparison: parsed.comparison,
              canonical,
            }),
          }}
        />
        <ComparisonSeoPage
          comparison={parsed.comparison}
          experiencesA={resA.experiences}
          experiencesB={resB.experiences}
          loadErrorA={resA.loadError}
          loadErrorB={resB.loadError}
        />
      </>
    );
  }

  // things-to-do
  const { city } = parsed;
  const result = await fetchExperiences(`${city.viatorQuery} tours`);
  const faq = buildThingsToDoFaq({
    cityName: city.name,
    oneLiner: city.oneLiner,
    guide: findDestinationGuide(city.slug),
    topExperienceTitles: result.experiences.slice(0, 3).map((e) => e.title),
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: buildThingsToDoJsonLd({
            city,
            experiences: result.experiences,
            canonical,
            faq,
          }),
        }}
      />
      <ThingsToDoSeoPage
        city={city}
        experiences={result.experiences}
        loadError={result.loadError}
        faq={faq}
      />
    </>
  );
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

async function fetchExperiences(
  query: string,
): Promise<{ experiences: Experience[]; loadError: string | null }> {
  const provider = viatorProviderFromEnv();
  if (!provider) return { experiences: [], loadError: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), 12_000);
  try {
    const result = await provider.search(
      { searchTerm: query, limit: 24 },
      { signal: controller.signal, secrets: {} },
    );
    return { experiences: [...result.experiences], loadError: null };
  } catch (e) {
    return { experiences: [], loadError: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
