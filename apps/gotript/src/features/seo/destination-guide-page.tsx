import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SeoPageShell } from './seo-page-shell';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import { findClimate, findNeighborhoodPois } from '@adored/seo-data';
import { DestinationExperienceRenderer, SmartStayOffer } from '@adored/ui';
import { toCityFacts, buildBrandPlan, type ProviderAdapters } from '@adored/brand-experience';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { VrboCityCallout } from '@/features/destinations/vrbo-city-callout';

/**
 * GoTript destination page — now driven by the shared @adored/brand-experience
 * engine via the gotript BrandSpec. This file only wires facts, the Expedia
 * money-path adapter, the itinerary-chip hero slot, and the whole-home (Vrbo)
 * + hand-off surfaces that stay app-specific.
 */

const ADAPTERS: ProviderAdapters = {
  primarySearchHref: (query) => buildExpediaCategoryUrl('hotels', { destination: query }),
};

function planFor(city: SeoCity, guide: DestinationGuide, canonical: string, imageUrl: string) {
  const facts = toCityFacts({
    city: {
      slug: city.slug,
      name: city.name,
      countryName: city.countryName,
      countryCode: city.countryCode,
      region: city.region,
      coordinates: city.coordinates,
    },
    guide,
    climate: findClimate(city.slug),
    neighborhoodPois: findNeighborhoodPois(city.slug),
  });
  return buildBrandPlan('gotript', facts, ADAPTERS, { canonical, imageUrl });
}

export function DestinationGuidePage({ city, guide }: { city: SeoCity; guide: DestinationGuide }) {
  const photo = resolveDestinationPhoto({ name: city.name, country: city.countryCode });
  const climate = findClimate(city.slug);
  const plan = planFor(city, guide, '', photo.url);
  const handoffHref = buildExpediaCategoryUrl('hotels', { destination: city.name });

  return (
    <SeoPageShell
      city={city}
      currentSlug={`destinations/${city.slug}`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name },
      ]}
    >
      <DestinationExperienceRenderer
        experience={plan}
        presentation={{
          cityName: city.name,
          photoUrl: photo.url,
          photoAlt: photo.alt,
          center: city.coordinates,
          climate: climate ? { tz: climate.tz, months: climate.months } : null,
        }}
        slots={{
          heroBelow: (
            <>
              {[3, 5, 7].map((n) => (
                <Link key={n} href={`/${city.slug}-${n}-day-itinerary`} style={heroChip}>
                  {n}-day plan
                </Link>
              ))}
            </>
          ),
        }}
      />

      <VrboCityCallout city={city} />

      <SmartStayOffer
        href={handoffHref}
        headline={`Ready to plan ${city.name}? Lock in where you'll stay.`}
        subline="Hotels and homes on Expedia — the price you pay is the same as booking direct."
        ctaLabel={`See ${city.name} stays →`}
        storageKey={`sso-${city.slug}`}
      />
    </SeoPageShell>
  );
}

export function buildDestinationGuideJsonLd({
  city,
  guide,
  canonical,
  imageUrl,
}: {
  city: SeoCity;
  guide: DestinationGuide;
  canonical: string;
  imageUrl: string;
}): string {
  return planFor(city, guide, canonical, imageUrl).jsonLd;
}

const heroChip: CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  fontWeight: 700,
  padding: '0.55rem 1.05rem',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.32)',
  color: '#ffffff',
  textDecoration: 'none',
  backdropFilter: 'blur(6px)',
};
