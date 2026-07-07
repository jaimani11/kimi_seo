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

  // Resolve a destination photo for the Open Graph card. Pinterest,
  // Facebook, X and Slack all read this — without it, rich pins fall
  // back to the pin's own image (no page-context photo).
  const ogCity = parsed.kind === 'comparison' ? parsed.comparison.a : parsed.city;
  const ogPhoto = resolveDestinationPhoto({
    name: ogCity.name,
    country: ogCity.countryCode,
    ...(ogCity.region ? { region: ogCity.region } : {}),
  });
  const ogImages = [
    { url: ogPhoto.url, width: 1200, height: 630, alt: ogCity.name },
  ];

  if (parsed.kind === 'itinerary') {
    const title = `${parsed.days}-Day ${parsed.city.name} Itinerary · numiworks`;
    const description = `Day-by-day ${parsed.days}-day ${parsed.city.name}, ${parsed.city.countryName} itinerary with bookable Viator experiences in every slot. ${parsed.city.oneLiner}`;
    return {
      title,
      description,
      alternates: { canonical },
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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: buildThingsToDoJsonLd({
            city,
            experiences: result.experiences,
            canonical,
          }),
        }}
      />
      <ThingsToDoSeoPage
        city={city}
        experiences={result.experiences}
        loadError={result.loadError}
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
