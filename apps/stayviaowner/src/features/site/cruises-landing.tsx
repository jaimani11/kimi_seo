import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { MultiCategoryHero } from '@/features/site/multi-category-hero';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { CRUISE_PORTS } from '@lib/affiliate/cruise-ports';
import type { CruiseRegion } from '@lib/seo/route-parser';

/**
 * /cruises — Pre & post-cruise port hotels.
 *
 * Expedia discontinued their consumer Cruises product, so the
 * stayviaowner Cruises tab is now a port-hotel discovery surface: pick
 * your embarkation port, stayviaowner links straight to Expedia hotels
 * for that city. The night before sailing + the night after
 * disembarking are real high-intent revenue.
 *
 * Page sections:
 *   1. Hero (search by port via MultiCategoryHero)
 *   2. Ports by region (5 regional accordions)
 *   3. Cruise lines (informational — direct visitors to the cruise
 *      line's own booking site)
 *   4. First-time cruise FAQ
 */

const REGION_LABEL: Record<CruiseRegion, string> = {
  caribbean: 'Caribbean',
  mediterranean: 'Mediterranean',
  alaska: 'Alaska',
  'northern-europe': 'Northern Europe',
  asia: 'Asia',
};

const REGION_ORDER: ReadonlyArray<CruiseRegion> = [
  'caribbean',
  'mediterranean',
  'alaska',
  'northern-europe',
  'asia',
];

const REGION_BLURB: Record<CruiseRegion, string> = {
  caribbean: 'Eastern, Western, Southern routes. Year-round sailing season.',
  mediterranean: 'Greek isles, Amalfi coast, Western Med. Apr–Oct peak.',
  alaska: 'Inside Passage, Glacier Bay. May–Sep season.',
  'northern-europe': 'Norwegian fjords, Baltic capitals, British Isles. May–Sep season.',
  asia: 'Japan, Southeast Asia, Vietnam-Cambodia. Oct–Apr peak.',
};

/** Cruise lines we link OUT to (no commission — pure UX play; the
 *  hotel booking is where stayviaowner earns).  */
const LINES: Array<{ name: string; url: string; tagline: string }> = [
  {
    name: 'Royal Caribbean',
    url: 'https://www.royalcaribbean.com',
    tagline: 'Mega-ships, FlowRider, biggest ships at sea.',
  },
  {
    name: 'Carnival',
    url: 'https://www.carnival.com',
    tagline: 'Lively, affordable, family-and-party-friendly Caribbean specialist.',
  },
  {
    name: 'Norwegian Cruise Line',
    url: 'https://www.ncl.com',
    tagline: 'Freestyle dining, popular for Alaska & Europe.',
  },
  {
    name: 'MSC Cruises',
    url: 'https://www.msccruises.com',
    tagline: 'Mediterranean-focused European line, strong Caribbean schedule.',
  },
  {
    name: 'Princess Cruises',
    url: 'https://www.princess.com',
    tagline: 'Premium-but-approachable, exceptional Alaska & Caribbean.',
  },
  {
    name: 'Celebrity Cruises',
    url: 'https://www.celebritycruises.com',
    tagline: 'Modern-luxury vibe, design-led ships.',
  },
  {
    name: 'Holland America',
    url: 'https://www.hollandamerica.com',
    tagline: 'Classic mid-size ships, longer voyages.',
  },
  {
    name: 'Disney Cruise Line',
    url: 'https://disneycruise.disney.go.com',
    tagline: 'Family-favourite, characters onboard, premium pricing.',
  },
  {
    name: 'Virgin Voyages',
    url: 'https://www.virginvoyages.com',
    tagline: 'Adults-only, design-forward, all-included fares.',
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Why book a hotel the night before a cruise?',
    a: 'Cruise lines board mid-morning, but most flights arrive too late to risk it. The standard advice is to fly in the day before, sleep at the port, and walk onboard rested. A cancelled flight on sail-day means you miss the ship — and the cruise.',
  },
  {
    q: 'How early should I book port hotels?',
    a: 'Port hotels around Miami, Barcelona, Seattle and Civitavecchia sell out 2-3 months before peak season. Free-cancellation rates on Expedia let you lock in early, then re-shop closer to sail-day if prices drop.',
  },
  {
    q: "What's typically included in a cruise fare?",
    a: "Stateroom, all main meals, kids' clubs, entertainment, most onboard activities. Drinks (alcohol, soda, specialty coffee), specialty restaurants, shore excursions, spa, gratuities, and Wi-Fi are usually extra.",
  },
  {
    q: 'Are cruises good for families with kids?',
    a: "Yes — Royal Caribbean, Carnival, Disney, and NCL run extensive kids' clubs (typically ages 3-17, free), have family-suite cabins, and dedicated pool / waterpark areas. Disney is most kid-focused; the others balance kids and adult spaces.",
  },
  {
    q: 'Do I need a passport for a cruise?',
    a: 'Almost always yes — even closed-loop Caribbean sailings recommend one. Asia, Europe, Alaska, and transatlantic always require a valid passport with 6+ months remaining beyond your return date.',
  },
];

export function CruisesLanding() {
  return (
    <>
      <SiteHeader />
      <MultiCategoryHero initialCategory="cruises" />

      {/* Intro band */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <header className="mx-auto max-w-3xl text-center">
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
            stayviaowner · cruise port hotels
          </p>
          <h2
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(1.8rem, 3.6vw, 2.8rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            Sleep at the port. Walk onboard rested.
          </h2>
          <p
            className="mt-4"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 400,
              fontSize: '1.05rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            Cruise day starts early. Fly in the night before, sleep at the embarkation port, and
            avoid the cancelled-flight nightmare that costs you the ship. We list hotels at every
            major cruise port — all bookable through Expedia, free cancellation on most.
          </p>
        </header>
      </section>

      {/* Ports by region */}
      <section className="mx-auto max-w-5xl px-6 pb-10">
        {REGION_ORDER.map((region) => {
          const ports = CRUISE_PORTS.filter((p) => p.region === region);
          if (ports.length === 0) return null;
          return (
            <div key={region} className="mb-10">
              <div className="mb-3 flex items-baseline justify-between">
                <h3
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    letterSpacing: '-0.015em',
                    color: 'var(--ink-primary)',
                    margin: 0,
                  }}
                >
                  {REGION_LABEL[region]}
                </h3>
                <Link
                  href={`/${region}-cruises`}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                  }}
                >
                  All {REGION_LABEL[region]} ports →
                </Link>
              </div>
              <p
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.92rem',
                  color: 'var(--ink-secondary)',
                  margin: '0 0 1rem',
                }}
              >
                {REGION_BLURB[region]}
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {ports.map((port) => {
                  const hotelsUrl = buildExpediaCategoryUrl('hotels', {
                    destination: port.bookingDestination,
                  });
                  return (
                    <a
                      key={port.slug}
                      href={hotelsUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="rounded-2xl border p-5 transition-colors hover:border-[color:var(--accent-primary)]"
                      style={{
                        background: 'var(--surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          letterSpacing: '-0.01em',
                          color: 'var(--ink-primary)',
                          margin: 0,
                        }}
                      >
                        {port.name}
                      </h4>
                      <p
                        className="mt-1"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.78rem',
                          color: 'var(--ink-tertiary)',
                          margin: 0,
                        }}
                      >
                        {port.country}
                      </p>
                      <p
                        className="mt-2"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.88rem',
                          lineHeight: 1.5,
                          color: 'var(--ink-secondary)',
                          margin: 0,
                        }}
                      >
                        {port.blurb}
                      </p>
                      <p
                        className="mt-3"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          color: 'var(--accent-primary)',
                          margin: 0,
                        }}
                      >
                        Hotels in {port.city} →
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Cruise lines — link out to their own booking sites */}
      <section className="mx-auto max-w-5xl px-6 pb-10">
        <h3
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.015em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Book the cruise itself
        </h3>
        <p
          className="mb-4 mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.92rem',
            color: 'var(--ink-secondary)',
            margin: '0.5rem 0 1rem',
          }}
        >
          Cruise fares are best booked directly with the cruise line — they price-match agents and
          run their own perks (onboard credit, cabin upgrades, drink packages). Pick a line by
          itinerary, ship style, and what's included.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {LINES.map((line) => (
            <a
              key={line.name}
              href={line.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border p-4 transition-colors hover:border-[color:var(--accent-primary)]"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              <h4
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  color: 'var(--ink-primary)',
                  margin: 0,
                }}
              >
                {line.name} →
              </h4>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: 'var(--ink-secondary)',
                  margin: 0,
                }}
              >
                {line.tagline}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-14">
        <h3
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.015em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Cruise + port hotel FAQ
        </h3>
        <div className="mt-4 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="rounded-xl border p-4"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <summary
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  cursor: 'pointer',
                  listStyle: 'none',
                }}
              >
                {f.q}
              </summary>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  color: 'var(--ink-secondary)',
                  margin: 0,
                }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
