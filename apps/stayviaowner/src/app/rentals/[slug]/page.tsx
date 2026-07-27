import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canonicalUrl } from '@lib/site/origin';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { parseRentalSlug, staticRentalSlugs, type RentalRoute } from '@lib/seo/rental-routes';
import { RentalPage, buildRentalJsonLd } from '@/features/seo/rental-page';
import {
  parseClusterSlug,
  enumerateClusterSlugs,
  type ClusterRoute,
} from '@lib/seo/rental-clusters';
import { RentalClusterPage, buildClusterJsonLd } from '@/features/seo/rental-cluster-page';

/**
 * stayviaowner rental matrix route — /rentals/{city} (city hub) and
 * /rentals/{category}-in-{city} (type page). Local to this app so gotript
 * never inherits it (avoids re-duplicating content). A curated subset is
 * prerendered at build; the long tail renders on-demand (ISR) and caches.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400; // 1 day — content is stable, inventory lives on VRBO.
export const dynamicParams = true; // long tail renders on first request, then caches.

export function generateStaticParams(): { slug: string }[] {
  return [...staticRentalSlugs(), ...enumerateClusterSlugs()].map((slug) => ({ slug }));
}

function metaTitle(route: RentalRoute): string {
  return route.kind === 'type'
    ? `${route.category.name} in ${route.city.name} — Whole-Home Rentals on VRBO · stayviaowner`
    : `Vacation Rentals in ${route.city.name} — Whole Homes on VRBO · stayviaowner`;
}

function metaDescription(route: RentalRoute): string {
  const { city } = route;
  return route.kind === 'type'
    ? `Browse ${route.category.name.toLowerCase()} in ${city.name}, ${city.countryName} — whole-home rentals on VRBO with full kitchens and space for groups. Or compare ${city.name} hotels.`
    : `Whole-home vacation rentals in ${city.name}, ${city.countryName} — villas, cabins, cottages, beach houses and more on VRBO. Or compare ${city.name} hotels.`;
}

function clusterMetadata(route: ClusterRoute, canonical: string): Metadata {
  const { cluster } = route;
  const title =
    route.kind === 'cluster-town'
      ? `${cluster.name} in ${route.town.town}, ${route.town.state} — Whole-Home Rentals on VRBO · stayviaowner`
      : `${cluster.hub.h1} · stayviaowner`;
  const description =
    route.kind === 'cluster-town' ? route.town.metaDescription : cluster.hub.metaDescription;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const clusterRoute = parseClusterSlug(slug);
  if (clusterRoute) return clusterMetadata(clusterRoute, canonicalUrl(`/rentals/${slug}`));
  const route = parseRentalSlug(slug);
  if (!route) return { robots: { index: false, follow: false } };

  const canonical = canonicalUrl(`/rentals/${slug}`);
  const photo = resolveDestinationPhoto({
    name: route.city.name,
    country: route.city.countryCode,
    region: route.city.region,
  });
  const title = metaTitle(route);
  const description = metaDescription(route);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [{ url: photo.url }],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const canonical = canonicalUrl(`/rentals/${slug}`);

  const clusterRoute = parseClusterSlug(slug);
  if (clusterRoute) {
    const clusterJsonLd = buildClusterJsonLd({ route: clusterRoute, canonical });
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: clusterJsonLd }} />
        <RentalClusterPage route={clusterRoute} />
      </>
    );
  }

  const route = parseRentalSlug(slug);
  if (!route) notFound();

  const jsonLd = buildRentalJsonLd({ route, canonical });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <RentalPage route={route} />
    </>
  );
}
