import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canonicalUrl } from '@lib/site/origin';
import {
  parseHotelTypeSlug,
  staticHotelTypeSlugs,
  type HotelTypeRoute,
} from '@lib/seo/hotel-type-routes';
import { HotelTypePage, buildHotelTypeJsonLd, hotelTypeHeading } from '@/features/seo/hotel-type-page';

/**
 * gobookt hotel-facet route — /hotels/{type}-in-{city} (spa hotels,
 * adults-only, ski hotels…). Local to this app so the other forks never
 * inherit it. A curated subset is prerendered at build; the long tail
 * renders on-demand (ISR) and caches.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400; // 1 day — content is stable, inventory lives on Booking.com.
export const dynamicParams = true; // long tail renders on first request, then caches.

export function generateStaticParams(): { slug: string }[] {
  return staticHotelTypeSlugs().map((slug) => ({ slug }));
}

function metaDescription(route: HotelTypeRoute): string {
  const { type, city } = route;
  return `Looking for ${type.name.toLowerCase()} in ${city.name}, ${city.countryName}? Compare them on Booking.com — real guest scores and where to stay. ${type.tagline}.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = parseHotelTypeSlug(slug);
  if (!route) return { robots: { index: false, follow: false } };

  const canonical = canonicalUrl(`/hotels/${slug}`);
  const title = `${hotelTypeHeading(route)} — Compare on Booking.com · gobookt`;
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
  const route = parseHotelTypeSlug(slug);
  if (!route) notFound();

  const canonical = canonicalUrl(`/hotels/${slug}`);
  const jsonLd = buildHotelTypeJsonLd({ route, canonical });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <HotelTypePage route={route} />
    </>
  );
}
