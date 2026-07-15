import Link from 'next/link';
import { SeoPageShell } from './seo-page-shell';
import type { SeoCity } from '@lib/seo/cities';
import {
  buildExpediaCategoryUrl,
  type ExpediaCategory,
} from '@lib/affiliate/expedia-multicategory';
import {
  buildViatorStaySearchUrl,
  getViatorStayLinkConfig,
} from '@lib/affiliate/viator-stay-link-builder';

/**
 * Programmatic SEO landing pages, one per city. stayviaowner is a Vrbo
 * whole-home rental brand, so the hotel-themed kinds (`hotels-in`,
 * `best/cheap/luxury/family/boutique/pet-friendly/beach-hotels`,
 * `apartments`) are Vrbo-LED: their `category` is `vacation-rentals`, so
 * every CTA builds a vrbo.com search (via Partnerize) and the copy is
 * vacation-rental-first — no hotel inventory, no Expedia branding. The
 * flights/cars kinds are retired (404 via the route-parser shim); the
 * attractions kinds remain a separate follow-up.
 *
 * Every page renders a prominent destination-level Vrbo search CTA
 * pre-filled with the city.
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

export const META: Record<
  VerticalKind,
  {
    category: ExpediaCategory;
    crumb: string;
    heading: (c: SeoCity) => string;
    eyebrow: (c: SeoCity) => string;
    intro: (c: SeoCity) => string;
    ctaLabel: (c: SeoCity) => string;
    bullets: (c: SeoCity) => string[];
  }
> = {
  'hotels-in': {
    category: 'vacation-rentals',
    crumb: 'Vacation rentals',
    heading: (c) => `Vacation rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · whole homes`,
    intro: (c) =>
      `Whole homes, villas, apartments and cottages across ${c.name}, ${c.countryName} — more space, a kitchen, and privacy for the whole group. Book on Vrbo; the price you pay is the same.`,
    ctaLabel: (c) => `Search vacation rentals in ${c.name}`,
    bullets: (c) => [
      `Real-time availability across thousands of ${c.name} rentals`,
      'Whole homes — kitchens, laundry, and room to spread out',
      'The price you pay on Vrbo is the price you see — no booking fees',
      `Honest reviews from real guests who stayed in ${c.name}`,
    ],
  },
  'flights-to': {
    category: 'flights',
    crumb: 'Flights',
    heading: (c) => `Cheap flights to ${c.name}`,
    eyebrow: (c) => `${c.countryName} · flights`,
    intro: (c) =>
      `Compare flights to ${c.name}, ${c.countryName} across every major carrier. One-way, round-trip, multi-city. Expedia Flights — fare-comparison powered by Kayak, paid in your currency.`,
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
      `Rent a car at ${c.name}'s airports and city pick-up points. Expedia Cars compares rates across every major rental company. Free cancellation on most bookings, full insurance options at the counter.`,
    ctaLabel: (c) => `Search car rentals in ${c.name}`,
    bullets: (c) => [
      `Airport and city pick-up locations across ${c.name}`,
      'Every major rental company in one search',
      'Free cancellation on most bookings — pay later, flexible plans',
      'Optional full insurance at checkout — no surprises at the counter',
    ],
  },
  'best-hotels': {
    category: 'vacation-rentals',
    crumb: 'Top-rated rentals',
    heading: (c) => `Top-rated vacation rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · top picks`,
    intro: (c) =>
      `The highest-rated, best-reviewed vacation rentals in ${c.name}, ${c.countryName} — whole homes and apartments loved by real guests, sorted by rating and review count. Book on Vrbo.`,
    ctaLabel: (c) => `See top-rated rentals in ${c.name}`,
    bullets: (c) => [
      `The best-reviewed whole-home rentals across ${c.name}`,
      'Sorted by guest rating — the more reviews, the more reliable',
      'Whole homes with kitchens, space, and privacy',
      'The price you pay on Vrbo is the price you see',
    ],
  },
  'cheap-hotels': {
    category: 'vacation-rentals',
    crumb: 'Affordable rentals',
    heading: (c) => `Affordable vacation rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · budget stays`,
    intro: (c) =>
      `Budget-friendly whole homes, apartments and studios in ${c.name}, ${c.countryName}. Split a rental across the group and the per-person nightly cost often beats a hotel room. Book on Vrbo.`,
    ctaLabel: (c) => `See affordable rentals in ${c.name}`,
    bullets: (c) => [
      `Lowest nightly rates across ${c.name} apartments and studios`,
      'A kitchen to cook in — save on eating out, too',
      'Weekly and monthly discounts on longer stays',
      'No booking fees — the price you pay on Vrbo is the price you see',
    ],
  },
  'luxury-hotels': {
    category: 'vacation-rentals',
    crumb: 'Luxury villas',
    heading: (c) => `Luxury villas & vacation rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · premium homes`,
    intro: (c) =>
      `Design-led villas, premium homes and penthouses in ${c.name}, ${c.countryName} — private pools, chef's kitchens, and the area's best addresses, with space and privacy no suite can match. Book on Vrbo.`,
    ctaLabel: (c) => `See luxury rentals in ${c.name}`,
    bullets: (c) => [
      `Private-pool villas and design-led homes across ${c.name}`,
      'Space, privacy, and premium finishes for the whole group',
      `The most-loved luxury rentals, ranked by ${c.name} guest reviews`,
      'The price you pay on Vrbo is the price you see',
    ],
  },
  'family-hotels': {
    category: 'vacation-rentals',
    crumb: 'Family rentals',
    heading: (c) => `Family vacation rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · family homes`,
    intro: (c) =>
      `Family-friendly whole homes and apartments in ${c.name}, ${c.countryName} — separate bedrooms, a kitchen for picky eaters, and room for everyone. Many with pools, gardens and cribs. Book on Vrbo.`,
    ctaLabel: (c) => `See family rentals in ${c.name}`,
    bullets: (c) => [
      `Multi-bedroom homes and apartments across ${c.name}`,
      'Kitchens, laundry, and the space kids actually need',
      'Pools, gardens, and cribs on many listings',
      'Travel-with-kids reviews from other families',
    ],
  },
  'boutique-hotels': {
    category: 'vacation-rentals',
    crumb: 'Unique rentals',
    heading: (c) => `Unique & boutique vacation rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · characterful homes`,
    intro: (c) =>
      `Characterful, design-led homes in ${c.name}, ${c.countryName} — converted lofts, historic cottages, and architect-designed villas with the personality a chain hotel can't fake. Book on Vrbo.`,
    ctaLabel: (c) => `See unique rentals in ${c.name}`,
    bullets: (c) => [
      `Design-led, one-of-a-kind homes across ${c.name}`,
      'Lofts, historic conversions, and architect-designed villas',
      `Curated picks based on real ${c.name} guest reviews`,
      'The price you pay on Vrbo is the price you see',
    ],
  },
  'pet-friendly-hotels': {
    category: 'vacation-rentals',
    crumb: 'Pet-friendly rentals',
    heading: (c) => `Pet-friendly vacation rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · pets welcome`,
    intro: (c) =>
      `Whole homes in ${c.name}, ${c.countryName} that welcome dogs and cats — fenced gardens, room to roam, and no cramped hotel room. Many with pet beds and on-site walking areas. Book on Vrbo.`,
    ctaLabel: (c) => `See pet-friendly rentals in ${c.name}`,
    bullets: (c) => [
      `Pet-welcoming whole homes across ${c.name}`,
      'Fenced gardens and room to roam — better than a hotel room',
      'Pet-fee details visible up-front, no surprises at check-in',
      'The whole family travels together',
    ],
  },
  'beach-hotels': {
    category: 'vacation-rentals',
    crumb: 'Beach rentals',
    heading: (c) => `Beachfront rentals & beach houses in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · beachfront`,
    intro: (c) =>
      `Beach houses and seaside villas in ${c.name}, ${c.countryName} — steps from the sand, with sea-view terraces and space for the whole group. Book on Vrbo.`,
    ctaLabel: (c) => `See beach rentals in ${c.name}`,
    bullets: (c) => [
      `Beach houses and sea-view homes across ${c.name}`,
      'Private terraces and gardens steps from the water',
      'Room for the whole group — no cramped beach hotel',
      'The price you pay on Vrbo is the price you see',
    ],
  },
  apartments: {
    category: 'vacation-rentals',
    crumb: 'Apartment rentals',
    heading: (c) => `Apartment rentals in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · self-catered`,
    intro: (c) =>
      `Self-catered apartments in ${c.name}, ${c.countryName} — full kitchens, more space than a hotel room, and weekly rates on longer stays. Book on Vrbo.`,
    ctaLabel: (c) => `See apartment rentals in ${c.name}`,
    bullets: (c) => [
      `Full-kitchen apartments across ${c.name}'s neighborhoods`,
      `Per-neighborhood filtering for the ${c.name} area you want`,
      'Weekly and monthly rates on longer-stay bookings',
      'The price you pay on Vrbo is the price you see',
    ],
  },
  'cheap-flights': {
    category: 'flights',
    crumb: 'Cheap flights',
    heading: (c) => `Cheap flights to ${c.name}`,
    eyebrow: (c) => `${c.countryName} · low fares`,
    intro: (c) =>
      `The lowest fares to ${c.name}, ${c.countryName} on Expedia Flights. Compare every major carrier, see the cheapest weekday for your route, and book without add-on fees at checkout.`,
    ctaLabel: (c) => `See cheap flights to ${c.name}`,
    bullets: (c) => [
      `Lowest available fares to ${c.name} across every major airline`,
      'Cheapest-weekday view — see when to fly for the best price',
      'One-way, round-trip, or multi-city — flexible cabin filters',
      'No add-on fees at checkout · Powered by Expedia Flights',
    ],
  },
  'cheap-cars': {
    category: 'cars',
    crumb: 'Cheap car rental',
    heading: (c) => `Cheap car rental in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · budget cars`,
    intro: (c) =>
      `The lowest daily rates on car rentals in ${c.name}, ${c.countryName}. Expedia Cars compares budget brands against the majors — economy cars, free cancellation on most, no hidden fees.`,
    ctaLabel: (c) => `See cheap car rental in ${c.name}`,
    bullets: (c) => [
      `Cheapest daily rates across ${c.name}'s rental fleets`,
      'Economy, compact, and intermediate filters',
      'Free cancellation on most bookings — pay later, flexible plans',
      'No hidden fees · Powered by Expedia Cars',
    ],
  },
  'airport-cars': {
    category: 'cars',
    crumb: 'Airport car rental',
    heading: (c) => `Airport car rental in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · airport pick-up`,
    intro: (c) =>
      `Pick up a rental car at ${c.name}'s airport terminals. Expedia Cars covers every major counter on arrivals — collect your key minutes after baggage claim, drop off at the same gate, no shuttle hassle.`,
    ctaLabel: (c) => `See airport car rental in ${c.name}`,
    bullets: (c) => [
      `On-airport counters at every ${c.name} terminal`,
      'No off-site shuttles for the major brands',
      'Free cancellation on most bookings — flexible flight changes',
      'One-way drop-off available · Powered by Expedia Cars',
    ],
  },
  'top-attractions': {
    category: 'attractions',
    crumb: 'Top attractions',
    heading: (c) => `Top attractions in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · must-see`,
    intro: (c) =>
      `The most-booked attractions, monuments, and experiences in ${c.name}, ${c.countryName} — skip-the-line tickets, guided tours, and audio guides, all bookable on Viator.`,
    ctaLabel: (c) => `See top attractions in ${c.name}`,
    bullets: (c) => [
      `The most-booked sights and experiences in ${c.name}`,
      'Skip-the-line tickets for the biggest draws',
      'Guided tours and audio guides for context',
      'Free cancellation on most tickets · Powered by Viator',
    ],
  },
  'free-things': {
    category: 'attractions',
    crumb: 'Free things to do',
    heading: (c) => `Free things to do in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · zero cost`,
    intro: (c) =>
      `Free walking tours, public museums on free days, parks, viewpoints, and self-guided routes in ${c.name}, ${c.countryName}. Bookable free walking tours and tip-based experiences on Viator.`,
    ctaLabel: (c) => `See free experiences in ${c.name}`,
    bullets: (c) => [
      `Free walking tours and tip-based experiences in ${c.name}`,
      'Public viewpoints, parks, and waterfronts to wander',
      'Museum free-day calendars on the listings that have them',
      'Bookable free of charge · Powered by Viator',
    ],
  },
  museums: {
    category: 'attractions',
    crumb: 'Museums',
    heading: (c) => `Museums in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · art & history`,
    intro: (c) =>
      `Art, history, science, and design museums in ${c.name}, ${c.countryName}. Skip-the-line tickets, combo passes, and audio guides — museum tickets bookable in seconds on Viator.`,
    ctaLabel: (c) => `See museum tickets in ${c.name}`,
    bullets: (c) => [
      `Tickets to ${c.name}'s major art, history, and science museums`,
      'Skip-the-line entry for the biggest names',
      'Combo passes that bundle multiple museums',
      'Audio guides and mobile tickets · Powered by Viator',
    ],
  },
  tours: {
    category: 'attractions',
    crumb: 'Tours',
    heading: (c) => `Tours in ${c.name}`,
    eyebrow: (c) => `${c.countryName} · guided experiences`,
    intro: (c) =>
      `Walking tours, food tours, day trips, and small-group experiences in ${c.name}, ${c.countryName}. Viator surfaces every bookable tour with verified guides and real traveler reviews.`,
    ctaLabel: (c) => `See tours in ${c.name}`,
    bullets: (c) => [
      `Walking, food, and history tours across ${c.name}`,
      'Small-group experiences and private guides',
      'Day trips to nearby villages, vineyards, and natural sights',
      'Verified guides, real reviews · Powered by Viator',
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
  // Route each vertical to the best provider for the job — never Expedia:
  // lodging → Vrbo (Partnerize), experiences → Viator (the provider the rest of
  // stayviaowner's things-to-do surfaces already use).
  const isAttractions = meta.category === 'attractions';
  const searchUrl = isAttractions
    ? buildViatorStaySearchUrl(
        { destination: `${city.name} tours` },
        getViatorStayLinkConfig(),
      )
    : buildExpediaCategoryUrl(meta.category, { destination: city.name });

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

        {/* Primary CTA — Expedia search for the right vertical,
          *  pre-filled with the city. */}
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
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
          {ctaLabel} on {isAttractions ? 'Viator' : 'Vrbo'} →
        </a>

        {/* Why-this-vertical-on-Expedia bullets */}
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

        {/* Cross-links — internal-linking density into the rental hub +
          *  destination content, reinforcing the whole-home positioning. */}
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
          <CrossLink href={`/rentals/${city.slug}`} label="Vacation rentals" />
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
