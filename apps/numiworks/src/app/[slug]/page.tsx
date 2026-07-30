import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseSeoSlug, enumerateAllSeoSlugs } from '@lib/seo/route-parser';
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
import {
  ComparisonSeoPage,
  buildComparisonJsonLd,
} from '@/features/seo/comparison-seo-page';
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

  // Climate + accommodation families are identical shared facts owned by gotript
  // (climate) / gobookt (where-to-stay). numiworks (experiences) is not their
  // owner, so it noindexes them — ONE indexed owner per family across 4 sites.
  const CLIMATE_NOINDEX: ReadonlySet<string> = new Set([
    'best-time',
    'weather-month',
    'where-to-go-month',
    'where-to-stay',
  ]);
  if (CLIMATE_NOINDEX.has(parsed.kind)) {
    const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { title: `${label} · numiworks`, alternates: { canonical }, robots: { index: false, follow: true } };
  }

  // Resolve a destination photo for the Open Graph card. Pinterest,
  // Facebook, X and Slack all read this — without it, rich pins fall
  // back to the pin's own image (no page-context photo).
  const ogCity =
    parsed.kind === 'comparison'
      ? parsed.comparison.a
      : parsed.kind === 'where-to-go-month'
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
    const title = `Best Time to Visit ${parsed.city.name}: Month by Month · numiworks`;
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
    const title = `${parsed.city.name} Weather in ${monthName(parsed.monthIndex)} · numiworks`;
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
    const title = `Where to Stay in ${parsed.city.name}: Best Areas & Neighborhoods · numiworks`;
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
    const title = `Where to Go in ${monthName(parsed.monthIndex)}: Destinations Ranked by Weather · numiworks`;
    const description = `Every destination we cover, ranked for ${monthName(parsed.monthIndex)} by daytime comfort and rain days — computed from 5-year climate normals.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website' },
      twitter: { card: 'summary', title, description },
    };
  }

  if (parsed.kind === 'itinerary') {
    // Single-owner cleanup (seo-recovery-phase-1): general itineraries belong to
    // gotript, not the experiences-focused numiworks. This family drew 2 impressions /
    // 0 clicks across 1,125 URLs. noindex + follow (kept crawlable so Google observes
    // the directive; NOT blocked in robots.txt); also dropped from the sitemap.
    const title = `${parsed.days}-Day ${parsed.city.name} Itinerary · numiworks`;
    const description = `Day-by-day ${parsed.days}-day ${parsed.city.name}, ${parsed.city.countryName} itinerary with bookable Viator experiences in every slot. ${parsed.city.oneLiner}`;
    return {
      title,
      description,
      alternates: { canonical },
      robots: { index: false, follow: true },
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'weekend') {
    const title = `A Weekend in ${parsed.city.name} · 2-Day Plan · numiworks`;
    const description = `A focused 2-day plan for ${parsed.city.name}, ${parsed.city.countryName} — bookable Viator experiences for every slot. ${parsed.city.oneLiner}`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'themed-list') {
    const meta = THEME_META[parsed.theme];
    const title = `${meta.heading(parsed.city)} · numiworks`;
    const description = meta.intro(parsed.city);
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'website', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  if (parsed.kind === 'comparison') {
    const { a, b } = parsed.comparison;
    const title = `${a.name} vs ${b.name}: which to pick · numiworks`;
    const description = `${a.name}, ${a.countryName} or ${b.name}, ${b.countryName}? A side-by-side travel guide with bookable Viator experiences in each.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: 'article', images: ogImages },
      twitter: { card: 'summary_large_image', title, description, images: ogImages },
    };
  }

  // things-to-do
  const title = `Things to do in ${parsed.city.name}, ${parsed.city.countryName} · numiworks`;
  const description = `${parsed.city.oneLiner} Live, bookable Viator tours, day trips, food experiences and skip-the-line tickets in ${parsed.city.name}.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

export default async function ProgrammaticSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSeoSlug(slug);
  if (!parsed) notFound();

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
            label: `Book experiences in ${parsed.city.name}`,
            href: `/things-to-do-in-${parsed.city.slug}`,
            blurb: `Top-rated tours, skip-the-line tickets and day trips in ${parsed.city.name}, bookable through Viator.`,
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
            label: `Book experiences in ${parsed.city.name}`,
            href: `/things-to-do-in-${parsed.city.slug}`,
            blurb: `Top-rated tours, skip-the-line tickets and day trips in ${parsed.city.name}, bookable through Viator.`,
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
            label: `See stays & experiences in ${parsed.city.name}`,
            href: `/things-to-do-in-${parsed.city.slug}`,
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
