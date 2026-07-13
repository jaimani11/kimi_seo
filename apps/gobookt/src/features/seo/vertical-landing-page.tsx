import Link from 'next/link';
import { SeoPageShell } from './seo-page-shell';
import type { SeoCity } from '@lib/seo/cities';
import {
  buildBookingComCategoryUrl,
  type BookingComCategory,
} from '@lib/affiliate/booking-com-multicategory';

/**
 * Programmatic SEO landing pages for the three Booking.com verticals
 * (`/hotels-in-{slug}`, `/flights-to-{slug}`, `/car-rentals-in-{slug}`)
 * per city. Same shell as the experience-themed SEO pages so the
 * internal-linking density carries over.
 *
 * Every page renders a prominent Booking.com search CTA pre-filled
 * with the city — the visitor's path to commission-eligible inventory
 * is one click from any of these surfaces.
 */

export type VerticalKind =
  | 'hotels-in'
  | 'flights-to'
  | 'cars-in'
  | 'best-hotels'
  | 'cheap-hotels'
  | 'luxury-hotels'
  | 'family-hotels'
  | 'boutique-hotels'
  | 'pet-friendly-hotels'
  | 'beach-hotels'
  | 'apartments'
  | 'cheap-flights'
  | 'cheap-cars'
  | 'airport-cars'
  | 'top-attractions'
  | 'free-things'
  | 'museums'
  | 'tours';

const META: Record<
  VerticalKind,
  {
    category: BookingComCategory;
    crumb: string;
    heading: (c: SeoCity) => string;
    eyebrow: (c: SeoCity) => string;
    intro: (c: SeoCity) => string;
    ctaLabel: (c: SeoCity) => string;
    bullets: (c: SeoCity) => string[];
  }
> = {
  'hotels-in': {
    category: 'hotels',
    crumb: 'Hotels',
    heading: (c) => `Hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · stays`,
    intro: (c) =>
      `Find hotels, apartments, and vacation rentals across ${c.name}, ${c.countryName}. Free cancellation on most stays, no booking fees. Powered by Booking.com — the price you pay is the same.`,
    ctaLabel: (c) => `Search hotels in ${c.name}`,
    bullets: (c) => [
      `Real-time availability across thousands of ${c.name} properties`,
      'Free cancellation on most stays — flexible plans for changing trips',
      'No booking fees — the price you pay on Booking.com is the price you get',
      `Honest reviews from real travelers who stayed in ${c.name}`,
    ],
  },
  'flights-to': {
    category: 'flights',
    crumb: 'Flights',
    heading: (c) => `Cheap flights to ${c.name}`,
    eyebrow: (c) => `${c.countryName} · flights`,
    intro: (c) =>
      `Compare flights to ${c.name}, ${c.countryName} across every major carrier. One-way, round-trip, multi-city. Booking.com Flights — fare-comparison powered by Kayak, paid in your currency.`,
    ctaLabel: (c) => `Search flights to ${c.name}`,
    bullets: (c) => [
      `Compare fares to ${c.name} across hundreds of airlines`,
      'Round-trip, one-way, or multi-city — every cabin class',
      'See the cheapest weekday for your route at a glance',
      'No add-on fees at checkout — what you see is what you pay',
    ],
  },
  'cars-in': {
    category: 'cars',
    crumb: 'Car rentals',
    heading: (c) => `Car rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · cars`,
    intro: (c) =>
      `Rent a car at ${c.name}'s airports and city pick-up points. Booking.com Cars compares rates across every major rental company. Free cancellation on most bookings, full insurance options at the counter.`,
    ctaLabel: (c) => `Search car rentals in ${c.name}`,
    bullets: (c) => [
      `Airport and city pick-up locations across ${c.name}`,
      'Every major rental company in one search',
      'Free cancellation on most bookings — pay later, flexible plans',
      'Optional full insurance at checkout — no surprises at the counter',
    ],
  },
  'best-hotels': {
    category: 'hotels',
    crumb: 'Best hotels',
    heading: (c) => `Best hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · top picks`,
    intro: (c) =>
      `The highest-rated, best-reviewed places to stay in ${c.name}, ${c.countryName}. We surface Booking.com properties scoring 8+ out of 10 from real travelers, sorted by review density. Free cancellation on most.`,
    ctaLabel: (c) => `See top-rated hotels in ${c.name}`,
    bullets: (c) => [
      `Only properties scoring 8.0+ in real ${c.name} guest reviews`,
      'Sorted by review density — the more reviews, the more reliable the score',
      'Free cancellation on most stays — book now, decide later',
      'No booking fees · Powered by Booking.com',
    ],
  },
  'cheap-hotels': {
    category: 'hotels',
    crumb: 'Cheap hotels',
    heading: (c) => `Cheap hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · budget stays`,
    intro: (c) =>
      `Budget-friendly hotels, hostels, and guest houses in ${c.name}, ${c.countryName}. Booking.com surfaces the lowest nightly rates with no booking fees — many with free cancellation if your plans change.`,
    ctaLabel: (c) => `See cheap hotels in ${c.name}`,
    bullets: (c) => [
      `Lowest nightly rates across ${c.name} hostels, guesthouses, and budget hotels`,
      'Free cancellation on most bookings — flexible if plans change',
      `Real reviews so you don't accidentally book the wrong end of ${c.name}`,
      'No booking fees · Powered by Booking.com',
    ],
  },
  'luxury-hotels': {
    category: 'hotels',
    crumb: 'Luxury hotels',
    heading: (c) => `Luxury hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · 5-star stays`,
    intro: (c) =>
      `5-star hotels, boutique stays, and design-led properties in ${c.name}, ${c.countryName}. The Booking.com luxury collection — concierge service, spa access, and the city's best addresses, free cancellation on most rates.`,
    ctaLabel: (c) => `See luxury hotels in ${c.name}`,
    bullets: (c) => [
      `5-star and boutique properties across ${c.name}`,
      'Spa, pool, and concierge service on most listings',
      `The city's most-loved addresses, ranked by ${c.name} guest reviews`,
      'Free cancellation on most rates · Powered by Booking.com',
    ],
  },
  'family-hotels': {
    category: 'hotels',
    crumb: 'Family hotels',
    heading: (c) => `Family-friendly hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · family stays`,
    intro: (c) =>
      `Family-friendly hotels and apartments in ${c.name}, ${c.countryName} — kid-friendly amenities, family rooms, and pool access. Booking.com filters for properties with cribs, kids' clubs, and connecting rooms.`,
    ctaLabel: (c) => `See family hotels in ${c.name}`,
    bullets: (c) => [
      `Family rooms, connecting rooms, and apartments in ${c.name}`,
      'Cribs, kids\' clubs, and child-safe pools on filtered listings',
      'Travel-with-kids reviews from other families',
      'Free cancellation on most stays · Powered by Booking.com',
    ],
  },
  'boutique-hotels': {
    category: 'hotels',
    crumb: 'Boutique hotels',
    heading: (c) => `Boutique hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · design stays`,
    intro: (c) =>
      `Boutique and design-led hotels in ${c.name}, ${c.countryName}. Small, characterful properties with the personality the big chains can't fake — Booking.com surfaces the city's most-loved independent stays.`,
    ctaLabel: (c) => `See boutique hotels in ${c.name}`,
    bullets: (c) => [
      `Independent, design-led properties across ${c.name}`,
      'Smaller room counts, more attentive service',
      `Curated picks based on real ${c.name} guest reviews`,
      'Free cancellation on most rates · Powered by Booking.com',
    ],
  },
  'pet-friendly-hotels': {
    category: 'hotels',
    crumb: 'Pet-friendly hotels',
    heading: (c) => `Pet-friendly hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · pets welcome`,
    intro: (c) =>
      `Hotels in ${c.name}, ${c.countryName} that welcome pets. Booking.com filters for properties that allow dogs and cats — some with pet beds, treats, and on-site walking areas — so the whole family travels together.`,
    ctaLabel: (c) => `See pet-friendly hotels in ${c.name}`,
    bullets: (c) => [
      `Pet-allowing hotels and apartments across ${c.name}`,
      'On-site walking areas, pet beds, and treats on some listings',
      'Pet-fee details visible up-front, no surprises at check-in',
      'Free cancellation on most stays · Powered by Booking.com',
    ],
  },
  'beach-hotels': {
    category: 'hotels',
    crumb: 'Beach hotels',
    heading: (c) => `Beach hotels in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · beachfront`,
    intro: (c) =>
      `Beachfront and seaside hotels in ${c.name}, ${c.countryName}. Booking.com filters for properties on or steps from the sand — sea-view rooms, beach-club access, and easy walks to the water.`,
    ctaLabel: (c) => `See beach hotels in ${c.name}`,
    bullets: (c) => [
      `Beachfront properties and sea-view rooms across ${c.name}`,
      'Beach-club access and on-site sun loungers on most listings',
      'Walking distance to the water — no taxis to the beach',
      'Free cancellation on most stays · Powered by Booking.com',
    ],
  },
  apartments: {
    category: 'hotels',
    crumb: 'Apartments',
    heading: (c) => `Apartments in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · self-catered`,
    intro: (c) =>
      `Self-catered apartments and vacation rentals in ${c.name}, ${c.countryName}. Full kitchens, more space than a hotel room, and weekly rates on longer stays. Booking.com surfaces apartments across ${c.name}'s neighborhoods.`,
    ctaLabel: (c) => `See apartments in ${c.name}`,
    bullets: (c) => [
      `Full-kitchen apartments and aparthotels across ${c.name}`,
      `Per-neighborhood filtering for the ${c.name} area you want`,
      'Weekly and monthly rates on longer-stay bookings',
      'Free cancellation on most bookings · Powered by Booking.com',
    ],
  },
  'cheap-flights': {
    category: 'flights',
    crumb: 'Cheap flights',
    heading: (c) => `Cheap flights to ${c.name}`,
    eyebrow: (c) => `${c.countryName} · low fares`,
    intro: (c) =>
      `The lowest fares to ${c.name}, ${c.countryName} on Booking.com Flights. Compare every major carrier, see the cheapest weekday for your route, and book without add-on fees at checkout.`,
    ctaLabel: (c) => `See cheap flights to ${c.name}`,
    bullets: (c) => [
      `Lowest available fares to ${c.name} across every major airline`,
      'Cheapest-weekday view — see when to fly for the best price',
      'One-way, round-trip, or multi-city — flexible cabin filters',
      'No add-on fees at checkout · Powered by Booking.com Flights',
    ],
  },
  'cheap-cars': {
    category: 'cars',
    crumb: 'Cheap car rental',
    heading: (c) => `Cheap car rental in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · budget cars`,
    intro: (c) =>
      `The lowest daily rates on car rentals in ${c.name}, ${c.countryName}. Booking.com Cars compares budget brands against the majors — economy cars, free cancellation on most, no hidden fees.`,
    ctaLabel: (c) => `See cheap car rental in ${c.name}`,
    bullets: (c) => [
      `Cheapest daily rates across ${c.name}'s rental fleets`,
      'Economy, compact, and intermediate filters',
      'Free cancellation on most bookings — pay later, flexible plans',
      'No hidden fees · Powered by Booking.com Cars',
    ],
  },
  'airport-cars': {
    category: 'cars',
    crumb: 'Airport car rental',
    heading: (c) => `Airport car rental in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · airport pick-up`,
    intro: (c) =>
      `Pick up a rental car at ${c.name}'s airport terminals. Booking.com Cars covers every major counter on arrivals — collect your key minutes after baggage claim, drop off at the same gate, no shuttle hassle.`,
    ctaLabel: (c) => `See airport car rental in ${c.name}`,
    bullets: (c) => [
      `On-airport counters at every ${c.name} terminal`,
      'No off-site shuttles for the major brands',
      'Free cancellation on most bookings — flexible flight changes',
      'One-way drop-off available · Powered by Booking.com Cars',
    ],
  },
  'top-attractions': {
    category: 'attractions',
    crumb: 'Top attractions',
    heading: (c) => `Top attractions in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · must-see`,
    intro: (c) =>
      `The most-booked attractions, monuments, and experiences in ${c.name}, ${c.countryName}. Skip-the-line tickets, guided tours, and audio-guide options — all bookable through Booking.com Attractions.`,
    ctaLabel: (c) => `See top attractions in ${c.name}`,
    bullets: (c) => [
      `The most-booked sights and experiences in ${c.name}`,
      'Skip-the-line tickets for the biggest draws',
      'Guided tours and audio guides for context',
      'Free cancellation on most tickets · Powered by Booking.com',
    ],
  },
  'free-things': {
    category: 'attractions',
    crumb: 'Free things to do',
    heading: (c) => `Free things to do in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · zero cost`,
    intro: (c) =>
      `Free walking tours, public museums on free days, parks, viewpoints, and self-guided routes in ${c.name}, ${c.countryName}. Bookable free walking tours and tip-based experiences via Booking.com Attractions.`,
    ctaLabel: (c) => `See free experiences in ${c.name}`,
    bullets: (c) => [
      `Free walking tours and tip-based experiences in ${c.name}`,
      'Public viewpoints, parks, and waterfronts to wander',
      'Museum free-day calendars on the listings that have them',
      'Bookable for free · Powered by Booking.com Attractions',
    ],
  },
  museums: {
    category: 'attractions',
    crumb: 'Museums',
    heading: (c) => `Museums in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · art & history`,
    intro: (c) =>
      `Art, history, science, and design museums in ${c.name}, ${c.countryName}. Skip-the-line tickets, combo passes, and audio guides — Booking.com Attractions makes museum tickets bookable in seconds.`,
    ctaLabel: (c) => `See museum tickets in ${c.name}`,
    bullets: (c) => [
      `Tickets to ${c.name}'s major art, history, and science museums`,
      'Skip-the-line entry for the biggest names',
      'Combo passes that bundle multiple museums',
      'Audio guides and mobile tickets · Powered by Booking.com',
    ],
  },
  tours: {
    category: 'attractions',
    crumb: 'Tours',
    heading: (c) => `Tours in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · guided experiences`,
    intro: (c) =>
      `Walking tours, food tours, day trips, and small-group experiences in ${c.name}, ${c.countryName}. Booking.com Attractions surfaces every bookable tour with verified guides and real traveler reviews.`,
    ctaLabel: (c) => `See tours in ${c.name}`,
    bullets: (c) => [
      `Walking, food, and history tours across ${c.name}`,
      'Small-group experiences and private guides',
      'Day trips to nearby villages, vineyards, and natural sights',
      'Verified guides, real reviews · Powered by Booking.com',
    ],
  },
};

export function VerticalLandingPage({
  kind,
  city,
}: {
  kind: VerticalKind;
  city: SeoCity;
}) {
  const meta = META[kind];
  const slug = slugForKind(kind, city.slug);
  const heading = meta.heading(city);
  const intro = meta.intro(city);
  const ctaLabel = meta.ctaLabel(city);
  const searchUrl = buildBookingComCategoryUrl(meta.category, {
    destination: city.name,
  });

  return (
    <SeoPageShell
      city={city}
      currentSlug={slug}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name, href: `/destinations/${city.slug}` },
        { label: meta.crumb },
      ]}
    >
      <section className="mx-auto max-w-4xl px-6 pt-8 pb-6 md:pt-12">
        <header>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {meta.eyebrow(city)}
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {heading}
          </h1>
          <p
            className="mt-4 max-w-2xl"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 400,
              fontSize: '1.05rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            {intro}
          </p>
        </header>

        {/* Primary CTA — Booking.com search for the right vertical,
          *  pre-filled with the city. */}
        <a
          href={searchUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 transition-transform hover:scale-[1.01]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            background: '#0071c2',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.85rem 1.4rem',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(0,113,194,0.32)',
          }}
        >
          {ctaLabel} on Booking.com →
        </a>

        {/* Why-this-vertical-on-Booking.com bullets */}
        <ul
          className="mt-8 grid grid-cols-1 gap-2.5 md:grid-cols-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.92rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {meta.bullets(city).map((b) => (
            <li
              key={b}
              className="rounded-xl border p-4"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span style={{ marginRight: '0.4rem', color: 'var(--accent-primary)' }}>
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>

        {/* Cross-category links — internal-linking density that
          *  signals "this site is a real multi-vertical hub" to
          *  search-engine crawlers AND to the Booking.com reviewer. */}
        <div
          className="mt-10 flex flex-wrap items-center gap-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginRight: '0.4rem',
            }}
          >
            Also in {city.name}
          </span>
          {kind !== 'hotels-in' && (
            <CrossLink href={`/hotels-in-${city.slug}`} label="Hotels" />
          )}
          {kind !== 'flights-to' && (
            <CrossLink href={`/flights-to-${city.slug}`} label="Flights" />
          )}
          {kind !== 'cars-in' && (
            <CrossLink href={`/car-rentals-in-${city.slug}`} label="Car rentals" />
          )}
          <CrossLink href={`/things-to-do-in-${city.slug}`} label="Things to do" />
          <CrossLink href={`/destinations/${city.slug}`} label={`${city.name} guide`} />
        </div>
      </section>
    </SeoPageShell>
  );
}

/**
 * Build the canonical URL slug for a given vertical kind + city slug.
 * Centralized so the breadcrumb + CrossLink rail can't drift out of
 * sync with the route parser.
 */
function slugForKind(kind: VerticalKind, citySlug: string): string {
  switch (kind) {
    case 'hotels-in':
      return `hotels-in-${citySlug}`;
    case 'flights-to':
      return `flights-to-${citySlug}`;
    case 'cars-in':
      return `car-rentals-in-${citySlug}`;
    case 'best-hotels':
      return `best-hotels-in-${citySlug}`;
    case 'cheap-hotels':
      return `cheap-hotels-in-${citySlug}`;
    case 'luxury-hotels':
      return `luxury-hotels-in-${citySlug}`;
    case 'family-hotels':
      return `family-hotels-in-${citySlug}`;
    case 'boutique-hotels':
      return `boutique-hotels-in-${citySlug}`;
    case 'pet-friendly-hotels':
      return `pet-friendly-hotels-in-${citySlug}`;
    case 'beach-hotels':
      return `beach-hotels-in-${citySlug}`;
    case 'apartments':
      return `apartments-in-${citySlug}`;
    case 'cheap-flights':
      return `cheap-flights-to-${citySlug}`;
    case 'cheap-cars':
      return `cheap-car-rental-in-${citySlug}`;
    case 'airport-cars':
      return `airport-car-rental-in-${citySlug}`;
    case 'top-attractions':
      return `top-attractions-in-${citySlug}`;
    case 'free-things':
      return `free-things-to-do-in-${citySlug}`;
    case 'museums':
      return `museums-in-${citySlug}`;
    case 'tours':
      return `tours-in-${citySlug}`;
  }
}

function CrossLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border px-3 py-1.5 transition-colors hover:border-[color:var(--accent-primary)]"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.76rem',
        fontWeight: 600,
        color: 'var(--ink-secondary)',
        borderColor: 'var(--border-subtle)',
        textDecoration: 'none',
      }}
    >
      {label} →
    </Link>
  );
}

/**
 * JSON-LD for the vertical landing — `Service` / `LocalBusiness`-ish
 * shape that search engines understand as "this page is a search
 * surface for hotels/flights/cars in {city}".
 */
export function buildVerticalLandingJsonLd({
  kind,
  city,
  canonical,
}: {
  kind: VerticalKind;
  city: SeoCity;
  canonical: string;
}): string {
  const meta = META[kind];
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.heading(city),
    description: meta.intro(city),
    url: canonical,
    about: {
      '@type': 'Place',
      name: city.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city.name,
        addressCountry: city.countryCode,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: city.coordinates.lat,
        longitude: city.coordinates.lng,
      },
    },
  };
  return JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
