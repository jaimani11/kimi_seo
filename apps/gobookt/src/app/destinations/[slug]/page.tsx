import type { Metadata } from 'next';
import { getSiteOrigin } from '@lib/site/origin';
import { notFound } from 'next/navigation';
import { ITALIAN_DESTINATIONS, findDestinationBySlugOrAlias } from '@lib/curation/destinations';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { DestinationHero } from '@/features/destinations/destination-hero';
import { PlanTripCta } from '@/features/destinations/plan-trip-cta';
import { gobooktDestinationCopy } from '@lib/seo/destination-copy';
import { DestinationJsonLd } from './destination-jsonld';
import { SEO_CITIES, findCityBySlug } from '@lib/seo/cities';
import { findDestinationGuide } from '@lib/seo/destination-content';
import {
  DestinationGuidePage,
  buildDestinationGuideJsonLd,
} from '@/features/seo/destination-guide-page';
import { canonicalUrl } from '@lib/site/origin';
import { applyGuideVoice } from '@adored/brand-config';

/**
 * Destination detail page. Generated at build time for each curated
 * destination; unknown slugs 404.
 *
 * Structure:
 *
 *   1. Hero - background photo resolved by `resolveDestinationPhoto`
 *      (curated Unsplash IDs in `lib/imagery/destination-photo-data`),
 *      editorial copy from `lib/curation/destinations`.
 *   2. "Where to stay" CTA - destination-prefilled Booking.com search,
 *      routed through `/r/[id]` for affiliate attribution.
 *
 * The page is SSG because each piece above is deterministic per slug.
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
    const description = gobooktDestinationCopy(italian.name, slug).body;
    return {
      title: `${italian.name} · gobookt`,
      description,
      openGraph: {
        title: `${italian.name} · gobookt`,
        description,
        url: `${siteUrl()}/destinations/${italian.slug}`,
        type: 'article',
        images: [{ url: heroPhoto.url }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${italian.name} · gobookt`,
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
    const title = `Where to Stay in ${seoCity.name}: Best Areas & Hotels · ${seoCity.countryName} · gobookt`;
    const description = `Where to stay in ${seoCity.name} — the best neighborhoods for hotels and apartments, with the weather, getting around and what's nearby, so you book the right base.`;
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

  return { title: 'Destination not found · gobookt' };
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
    // gobookt's accommodation voice so the hero doesn't read identically to the
    // sibling brands. (The photo is already per-brand via the imagery shim.)
    const copy = gobooktDestinationCopy(italian.name, slug);
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
        <DestinationGuidePage city={seoCity} guide={applyGuideVoice(guide, 'gobookt', seoCity.slug)} />
      </>
    );
  }

  notFound();
}

