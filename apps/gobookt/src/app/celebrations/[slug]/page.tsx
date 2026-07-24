import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseOccasionSlug, staticOccasionSlugs, type OccasionRoute } from '@adored/seo-data';
import { canonicalUrl } from '@lib/site/origin';
import { OccasionPage, buildOccasionJsonLd, occasionHeading } from '@/features/seo/occasion-page';

/**
 * gobookt celebration/occasion route — /celebrations/{occasion}-in-{city}
 * (Booking.com hotels angle). Indexable + in the sitemap, not linked from
 * nav/homepage.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams(): { slug: string }[] {
  return staticOccasionSlugs().map((slug) => ({ slug }));
}

function metaDescription(route: OccasionRoute): string {
  const { occasion, city } = route;
  return `${occasion.name} in ${city.name}? Compare hotels on Booking.com for the group — real guest reviews. Where to stay, what to look for and when to book.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = parseOccasionSlug(slug);
  if (!route) return { robots: { index: false, follow: false } };

  const canonical = canonicalUrl(`/celebrations/${slug}`);
  const title = `${occasionHeading(route)} · gobookt`;
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
  const route = parseOccasionSlug(slug);
  if (!route) notFound();

  const canonical = canonicalUrl(`/celebrations/${slug}`);
  const jsonLd = buildOccasionJsonLd({ route, canonical });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <OccasionPage route={route} />
    </>
  );
}
