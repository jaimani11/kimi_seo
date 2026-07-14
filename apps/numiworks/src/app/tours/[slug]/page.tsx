import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canonicalUrl } from '@lib/site/origin';
import {
  parseTourCategorySlug,
  staticTourCategorySlugs,
  type TourCategoryRoute,
} from '@lib/seo/tour-category-routes';
import { TourCategoryPage, buildTourCategoryJsonLd, tourCategoryHeading } from '@/features/seo/tour-category-page';

/**
 * numiworks tour-category route — /tours/{category}-in-{city} (cooking
 * classes, boat tours, ski lessons…). Local to this app so the other
 * forks never inherit it. A curated subset is prerendered at build; the
 * long tail renders on-demand (ISR) and caches.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400; // 1 day — content is stable, inventory lives on Viator.
export const dynamicParams = true; // long tail renders on first request, then caches.

export function generateStaticParams(): { slug: string }[] {
  return staticTourCategorySlugs().map((slug) => ({ slug }));
}

function metaDescription(route: TourCategoryRoute): string {
  const { category, city } = route;
  return `Booking ${category.name.toLowerCase()} in ${city.name}, ${city.countryName}? Compare and book on Viator — free cancellation on most, real reviews — plus where to stay on VRBO. ${category.tagline}.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = parseTourCategorySlug(slug);
  if (!route) return { robots: { index: false, follow: false } };

  const canonical = canonicalUrl(`/tours/${slug}`);
  const title = `${tourCategoryHeading(route)} — Book on Viator · numiworks`;
  const description = metaDescription(route);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const route = parseTourCategorySlug(slug);
  if (!route) notFound();

  const canonical = canonicalUrl(`/tours/${slug}`);
  const jsonLd = buildTourCategoryJsonLd({ route, canonical });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <TourCategoryPage route={route} />
    </>
  );
}
