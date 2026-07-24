import type { Metadata } from 'next';
import { getSiteOrigin } from '@lib/site/origin';
import { notFound } from 'next/navigation';
import { ITALIAN_DESTINATIONS, findDestinationBySlugOrAlias } from '@lib/curation/destinations';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { DestinationHero } from '@/features/destinations/destination-hero';
import { PlanTripCta } from '@/features/destinations/plan-trip-cta';
import { DestinationThingsToDoRail } from '@/features/destinations/destination-things-to-do-rail';
import { numiworksDestinationCopy } from '@lib/seo/destination-copy';
import { DestinationJsonLd } from './destination-jsonld';
import { SEO_CITIES, findCityBySlug } from '@lib/seo/cities';
import { findDestinationGuide } from '@lib/seo/destination-content';
import { findScores } from '@lib/seo/destination-scores';
import {
  DestinationGuidePage,
  buildDestinationGuideJsonLd,
} from '@/features/seo/destination-guide-page';
import { canonicalUrl } from '@lib/site/origin';

/**
 * Destination detail page. Generated at build time for each curated
 * destination; unknown slugs 404.
 *
 * Post-H2 structure (no mock-italy):
 *
 *   1. Hero - background photo resolved by `resolveDestinationPhoto`
 *      (curated Unsplash IDs in `lib/imagery/destination-photo-data`),
 *      editorial copy from `lib/curation/destinations`.
 *   2. Live "Things to do" rail - Viator inventory scoped to the
 *      destination, fetched client-side.
 *   3. "Where to stay" CTA - destination-prefilled Expedia search,
 *      routed through `/r/[id]` for affiliate attribution. Until
 *      real stay inventory lands we don't pretend to have it; the
 *      CTA is honest about handing off to the partner.
 *   4. Plan-trip CTA - lands the visitor in the workspace with the
 *      destination prompt pre-filled.
 *
 * The page is SSG because each piece above is deterministic per slug;
 * the Viator rail fetches on the client so the static HTML stays
 * fast + cacheable.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const italian = ITALIAN_DESTINATIONS.map((d) => ({ slug: d.slug }));
  const seo = SEO_CITIES.map((c) => ({ slug: c.slug }));
  return [...italian, ...seo];
}

function siteUrl(): string {
  // Delegates to the canonical origin resolver - VERCEL_URL must
  // never leak into robots/sitemap/canonical output.
  return getSiteOrigin();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Path A: Italian curated destinations (existing).
  const italian = findDestinationBySlugOrAlias(slug);
  if (italian) {
    const heroPhoto = resolveDestinationPhoto({
      name: italian.name,
      country: 'IT',
      region: italian.region,
    });
    // Brand voice for the meta/OG description too (not just the visible hero),
    // so the shared seo-data oneLiner doesn't duplicate across brands.
    const description = numiworksDestinationCopy(italian.name, slug).body;
    return {
      title: `${italian.name} · numiworks`,
      description,
      openGraph: {
        title: `${italian.name} · numiworks`,
        description,
        url: `${siteUrl()}/destinations/${italian.slug}`,
        type: 'article',
        images: [{ url: heroPhoto.url }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${italian.name} · numiworks`,
        description,
        images: [heroPhoto.url],
      },
    };
  }

  // Path B: SEO cities with rich guides.
  const seoCity = findCityBySlug(slug);
  const guide = seoCity ? findDestinationGuide(slug) : null;
  if (seoCity && guide) {
    const heroPhoto = resolveDestinationPhoto({
      name: seoCity.name,
      country: seoCity.countryCode,
    });
    const canonical = canonicalUrl(`/destinations/${slug}`);
    const title = `Best of ${seoCity.name}: Experiences, Food & Day Trips · ${seoCity.countryName} · numiworks`;
    const description = `The best of ${seoCity.name} — top experiences, food and day trips worth planning a trip around, plus when to go and how to get around.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'article',
        images: [{ url: heroPhoto.url }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [heroPhoto.url],
      },
    };
  }

  return { title: 'Destination not found · numiworks' };
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;

  // Path A: Italian curated destinations (preserved as-is).
  const italian = findDestinationBySlugOrAlias(slug);
  if (italian) {
    const heroPhoto = resolveDestinationPhoto({
      name: italian.name,
      country: 'IT',
      region: italian.region,
    });
    // Anti-duplicate: override the shared seo-data headline/oneLiner with
    // numiworks's experiences voice so the hero doesn't read identically to the
    // sibling brands. (The photo is already per-brand via the imagery shim.)
    const copy = numiworksDestinationCopy(italian.name, slug);
    const heroDestination = { ...italian, headline: copy.headline, oneLiner: copy.body };
    return (
      <main>
        <DestinationJsonLd destination={heroDestination} baseUrl={siteUrl()} imageUrl={heroPhoto.url} />
        <DestinationHero
          destination={heroDestination}
          heroImageUrl={heroPhoto.url}
          heroImageAlt={heroPhoto.alt}
          eyebrow={copy.eyebrow}
        />
        <DestinationThingsToDoRail destinationName={italian.name} />
        <PlanTripCta destination={italian} />
      </main>
    );
  }

  // Path B: SEO city with rich guide.
  const seoCity = findCityBySlug(slug);
  const guide = seoCity ? findDestinationGuide(slug) : null;
  if (seoCity && guide) {
    const heroPhoto = resolveDestinationPhoto({
      name: seoCity.name,
      country: seoCity.countryCode,
    });
    const canonical = canonicalUrl(`/destinations/${slug}`);
    const jsonLd = buildDestinationGuideJsonLd({
      city: seoCity,
      guide,
      canonical,
      imageUrl: heroPhoto.url,
    });
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <DestinationGuidePage city={seoCity} guide={guide} scores={findScores(slug)} />
      </>
    );
  }

  notFound();
}

