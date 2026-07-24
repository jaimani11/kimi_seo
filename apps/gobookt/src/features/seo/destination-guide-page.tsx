import { SeoPageShell } from './seo-page-shell';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import type { SeoCity } from '@lib/seo/cities';
import type { DestinationGuide } from '@lib/seo/destination-content';
import { findClimate, findNeighborhoodPois } from '@adored/seo-data';
import { DestinationExperienceRenderer, SmartStayOffer } from '@adored/ui';
import {
  toCityFacts,
  buildBrandPlan,
  type ProviderAdapters,
} from '@adored/brand-experience';
import { bookingHotelsSearchHref } from '@lib/affiliate/booking-com-multicategory';
import { BookingSearchWidget } from '../site/booking-widget';

/**
 * GoBookt destination page — now driven by the shared @adored/brand-experience
 * engine (planner → DestinationExperience → shared renderer) instead of a
 * gobookt-only composition function. Brand identity lives in the gobookt
 * BrandSpec; this file only wires facts, the money-path adapter, the
 * Booking.com search-widget slot, and the bottom hand-off.
 */

const ADAPTERS: ProviderAdapters = {
  primarySearchHref: (query) => bookingHotelsSearchHref({ destination: query }),
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
  return buildBrandPlan('gobookt', facts, ADAPTERS, { canonical, imageUrl });
}

export function DestinationGuidePage({ city, guide }: { city: SeoCity; guide: DestinationGuide }) {
  const photo = resolveDestinationPhoto({ name: city.name, country: city.countryCode });
  const climate = findClimate(city.slug);
  // canonical/imageUrl only feed JSON-LD (rendered by the route), so a minimal
  // ctx is fine for the on-page render plan.
  const plan = planFor(city, guide, '', photo.url);
  const handoffHref = bookingHotelsSearchHref({ destination: city.name });

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
        slots={{ afterHero: <SearchCard cityName={city.name} /> }}
      />

      {handoffHref ? (
        <SmartStayOffer
          href={handoffHref}
          headline={`Set on ${city.name}? Compare stays on Booking.com.`}
          subline="Search live availability and prices — the price you pay is the same as booking direct."
          ctaLabel={`Search ${city.name} stays →`}
          storageKey={`sso-${city.slug}`}
        />
      ) : (
        <section className="mx-auto my-6 w-full max-w-3xl px-6">
          <div
            role="status"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.85rem',
              padding: '1rem 1.25rem',
              textAlign: 'center',
              fontFamily: 'var(--font-inter)',
              fontSize: '1.02rem',
              color: 'var(--ink-secondary)',
            }}
          >
            Live Booking.com search for {city.name} is temporarily unavailable. Please try again
            shortly — the search box above will be back.
          </div>
        </section>
      )}
    </SeoPageShell>
  );
}

/** Route keeps a single structured-data import surface; JSON-LD comes from the
 *  same plan the page renders, so page and schema can't drift. */
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

function SearchCard({ cityName }: { cityName: string }) {
  return (
    <section className="mx-auto -mt-10 mb-4 w-full max-w-3xl px-6">
      <div
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1rem',
          boxShadow: 'var(--elev-card)',
          padding: '1.1rem 1.1rem 1.25rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            margin: '0 0 0.6rem',
          }}
        >
          Search stays in {cityName} on Booking.com
        </p>
        <BookingSearchWidget />
      </div>
    </section>
  );
}
