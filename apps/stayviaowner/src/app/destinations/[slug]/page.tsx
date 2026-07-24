import type { Metadata } from 'next';
import { getSiteOrigin } from '@lib/site/origin';
import { notFound } from 'next/navigation';
import { ITALIAN_DESTINATIONS, findDestinationBySlugOrAlias } from '@lib/curation/destinations';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { DestinationHero } from '@/features/destinations/destination-hero';
import { PlanTripCta } from '@/features/destinations/plan-trip-cta';
import { DestinationThingsToDoRail } from '@/features/destinations/destination-things-to-do-rail';
import { stayviaownerDestinationCopy, stayviaownerHeroPhoto } from '@lib/seo/destination-copy';
import { DestinationJsonLd } from './destination-jsonld';
import { SEO_CITIES, findCityBySlug } from '@lib/seo/cities';
import { findDestinationGuide } from '@lib/seo/destination-content';
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
    const description = stayviaownerDestinationCopy(italian.name, slug).body;
    return {
      title: `${italian.name} · stayviaowner`,
      description,
      openGraph: {
        title: `${italian.name} · stayviaowner`,
        description,
        url: `${siteUrl()}/destinations/${italian.slug}`,
        type: 'article',
        images: [{ url: heroPhoto.url }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${italian.name} · stayviaowner`,
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
    const title = `${seoCity.name} Vacation Rentals: Apartments & Whole Homes · ${seoCity.countryName} · stayviaowner`;
    const description = `Vacation rentals in ${seoCity.name} — the best areas for whole-home apartments and houses, plus the weather, neighborhoods and getting around.`;
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

  return { title: 'Destination not found · stayviaowner' };
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
    // Anti-duplicate: the hero facts (photo, name) are shared across brands via
    // seo-data, so override the shared `headline`/`oneLiner` with stayviaowner's
    // whole-home VOICE and request a distinct photo crop. Facts stay; the words
    // and image diverge so Google doesn't see four identical hero blocks.
    const copy = stayviaownerDestinationCopy(italian.name, slug);
    const heroDestination = { ...italian, headline: copy.headline, oneLiner: copy.body };
    return (
      <main>
        <DestinationJsonLd destination={heroDestination} baseUrl={siteUrl()} imageUrl={heroPhoto.url} />
        <DestinationHero
          destination={heroDestination}
          heroImageUrl={stayviaownerHeroPhoto(heroPhoto.url)}
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
        <DestinationGuidePage city={seoCity} guide={guide} />
      </>
    );
  }

  notFound();
}

