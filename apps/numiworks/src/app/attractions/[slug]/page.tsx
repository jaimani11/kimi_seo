import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canonicalUrl } from '@lib/site/origin';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import {
  allAttractions,
  cityFor,
  findAttractionBySlug,
} from '@lib/seo/attractions';
import { viatorProviderFromEnv } from '@/providers/viator';
import {
  AttractionSeoPage,
  buildAttractionJsonLd,
} from '@/features/seo/attraction-seo-page';
import type { Experience } from '@core/experience';

/**
 * /attractions/[slug] — single-attraction SEO page.
 *
 * Statically generated at build time from the ATTRACTIONS allowlist.
 * Slugs outside the allowlist 404. Live Viator inventory pulled at
 * request time (with a 1h revalidate cache) so tour availability is
 * always current.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return allAttractions().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const attraction = findAttractionBySlug(slug);
  if (!attraction) {
    return { robots: { index: false, follow: false } };
  }

  const canonical = canonicalUrl(`/attractions/${slug}`);
  const city = cityFor(attraction);

  const title = city
    ? `${attraction.name} tickets & tours · ${city.name} · numiworks`
    : `${attraction.name} tickets & tours · numiworks`;
  const description = attraction.fullDescription.length > 155
    ? `${attraction.fullDescription.slice(0, 152)}…`
    : attraction.fullDescription;

  const photoInput = city
    ? {
        name: city.name,
        country: city.countryCode,
        ...(city.region ? { region: city.region } : {}),
      }
    : { name: attraction.name, country: 'US' };
  const photo = resolveDestinationPhoto(photoInput);
  const ogImages = [
    { url: photo.url, width: 1200, height: 630, alt: attraction.name },
  ];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages,
    },
  };
}

export default async function AttractionPage({ params }: PageProps) {
  const { slug } = await params;
  const attraction = findAttractionBySlug(slug);
  if (!attraction) notFound();

  const canonical = canonicalUrl(`/attractions/${slug}`);
  const city = cityFor(attraction);
  // Every ATTRACTIONS entry links to a real SEO_CITIES entry. If the
  // city isn't found, that's a data-integrity bug — 404 rather than
  // render a broken page.
  if (!city) notFound();
  const result = await fetchExperiences(attraction.viatorQuery);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: buildAttractionJsonLd({ attraction, city, canonical }),
        }}
      />
      <AttractionSeoPage
        attraction={attraction}
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
