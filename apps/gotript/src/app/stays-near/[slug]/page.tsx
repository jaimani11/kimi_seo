import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseStaysNearSlug, staticStaysNearSlugs, type StaysNearPoi } from '@adored/seo-data';
import { canonicalUrl } from '@lib/site/origin';
import { StaysNearPage, buildStaysNearJsonLd, poiHeading } from '@/features/seo/stays-near-page';

/**
 * gotript "Stays near {POI}" route (Expedia angle). Shared POI list, local
 * template, so the four brands' stays-near pages stay differentiated.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams(): { slug: string }[] {
  return staticStaysNearSlugs().map((slug) => ({ slug }));
}

function metaDescription(poi: StaysNearPoi): string {
  const where =
    poi.kind === 'airport'
      ? `near ${poi.city.name} Airport`
      : poi.kind === 'city-centre'
        ? `in central ${poi.city.name}`
        : `near ${poi.poiName} in ${poi.city.name}`;
  return `Compare hotels and vacation rentals ${where}, ${poi.city.countryName} on Expedia — live prices, real reviews and free cancellation on most stays. Find where to stay ${where}.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const poi = parseStaysNearSlug(slug);
  if (!poi) return { robots: { index: false, follow: false } };

  const canonical = canonicalUrl(`/stays-near/${slug}`);
  const title = `${poiHeading(poi)} · gotript`;
  const description = metaDescription(poi);
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
  const poi = parseStaysNearSlug(slug);
  if (!poi) notFound();

  const canonical = canonicalUrl(`/stays-near/${slug}`);
  const jsonLd = buildStaysNearJsonLd({ poi, canonical });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <StaysNearPage poi={poi} />
    </>
  );
}
