import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import {
  buildExpediaCategoryUrl,
} from '@lib/affiliate/expedia-multicategory';
import {
  CRUISE_PORTS,
  cruisePortsForRegion,
} from '@lib/affiliate/cruise-ports';
import { CRUISE_REGIONS, type CruiseRegion } from '@lib/seo/route-parser';

/**
 * /{region}-cruises landings — Expedia no longer sells cruises,
 * so these now showcase **hotels at the cruise embarkation ports** in
 * the region. Same revenue mechanic as /cruises (pre & post-cruise
 * stays drive real hotel commission) but scoped to one region's
 * ports.
 */

const REGION_META: Record<
  CruiseRegion,
  {
    label: string;
    eyebrow: string;
    intro: string;
    bullets: string[];
    seasonHint: string;
  }
> = {
  mediterranean: {
    label: 'Mediterranean cruise port hotels',
    eyebrow: 'Europe · pre & post-cruise stays',
    intro:
      "Sailing the Med? Lock in your pre-cruise night at the embarkation port — Barcelona, Civitavecchia (Rome), Athens (Piraeus), or Venice. Walk onboard rested, not airport-tired. Every major Expedia hotel in each port city.",
    bullets: [
      'Hotels at every major Western & Eastern Med embarkation port',
      'Refundable rates labelled per property — book early, decide later',
      'Filter by airport-proximity, port-proximity, or city center',
      'Real Expedia guest reviews from past cruise travelers',
    ],
    seasonHint: 'Mediterranean cruise season runs April through October.',
  },
  caribbean: {
    label: 'Caribbean cruise port hotels',
    eyebrow: 'Americas · pre & post-cruise stays',
    intro:
      "Caribbean sailings board mid-morning — fly in the day before to Miami, Fort Lauderdale, Port Canaveral, Tampa, San Juan, or Galveston. Sleep at the port, walk onto the ship at breakfast time. Expedia lists every major hotel near each cruise terminal.",
    bullets: [
      'Hotels at every Caribbean embarkation port (Miami, Lauderdale, Tampa, SJU, Galveston)',
      'Most properties offer free port shuttles to the cruise terminal',
      'Refundable rates labelled per property — flexible if your cruise rebooks',
      "Hotels with 'cruise-and-snooze' parking packages on filtered listings",
    ],
    seasonHint: 'Caribbean cruise season runs year-round; peak Nov–Apr.',
  },
  alaska: {
    label: 'Alaska cruise port hotels',
    eyebrow: 'North America · pre & post-cruise stays',
    intro:
      "Alaska cruises embark from Seattle (round-trip Inside Passage) or Vancouver (one-way Gulf of Alaska). Both port cities deserve a night or two on either end — Seattle's Pike Place, Vancouver's seawall + Stanley Park. Expedia hotels at both.",
    bullets: [
      'Seattle and Vancouver hotels within an easy ride of the cruise terminal',
      'Most one-way Alaska sailings warrant 1-2 nights at the disembarkation port',
      'Pacific Northwest weather: pick hotels with refundable rates',
      'Real Expedia reviews from past cruise passengers',
    ],
    seasonHint: 'Alaska cruise season runs May through September only.',
  },
  'northern-europe': {
    label: 'Northern Europe cruise port hotels',
    eyebrow: 'Europe · pre & post-cruise stays',
    intro:
      "Norwegian fjord, Baltic, and British Isles cruises embark from Southampton, Copenhagen, or Bergen. The port cities are destinations in themselves — Southampton + a London side-trip, Copenhagen's harbour district, Bergen's UNESCO Bryggen wharf. Expedia hotels at every port.",
    bullets: [
      'Southampton, Copenhagen, and Bergen hotels near each cruise terminal',
      'Most Northern Europe ports are walkable city centers — skip the rental car',
      'Summer-only sailing season · refundable rates labelled per property',
      'Pair with a city-break on either side of your cruise',
    ],
    seasonHint: 'Norwegian fjord + Baltic season runs May through September.',
  },
  asia: {
    label: 'Asia cruise port hotels',
    eyebrow: 'Asia-Pacific · pre & post-cruise stays',
    intro:
      "Asia cruises typically embark from Singapore, Hong Kong, or Yokohama (Tokyo). Each is a destination in its own right — most travelers extend their cruise with 2-3 nights in the embarkation city. Expedia lists every major hotel near each port.",
    bullets: [
      'Singapore, Hong Kong, and Yokohama (Tokyo) hotels near each terminal',
      'Asia cruises run October through April — outside typhoon season',
      'Easy local taxi to the port · refundable rates labelled per property',
      'Most cruise passengers extend their trip with 2-3 port-city nights',
    ],
    seasonHint: 'Asia cruise season runs October through April.',
  },
};

export function CruiseRegionPage({ region }: { region: CruiseRegion }) {
  const meta = REGION_META[region];
  const ports = cruisePortsForRegion(region);

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 pt-10 pb-6 md:pt-16">
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
          {meta.eyebrow}
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
          {meta.label}
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
          {meta.intro}
        </p>
        <p
          className="mt-3 max-w-2xl"
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 600,
            fontSize: '0.88rem',
            color: 'var(--accent-primary)',
            margin: 0,
          }}
        >
          {meta.seasonHint}
        </p>

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
          {meta.bullets.map((b) => (
            <li
              key={b}
              className="rounded-xl border p-4"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span style={{ marginRight: '0.4rem', color: 'var(--accent-primary)' }}>✓</span>
              {b}
            </li>
          ))}
        </ul>

        {/* Port hotel grid — each links to Expedia Hotels for the port city */}
        <section className="mt-10">
          <h2
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {ports.length} embarkation port{ports.length === 1 ? '' : 's'} in this region
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  <h3
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      color: 'var(--ink-primary)',
                      margin: 0,
                    }}
                  >
                    {port.name}
                  </h3>
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
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: 'var(--accent-primary)',
                      margin: 0,
                    }}
                  >
                    Hotels in {port.city} on Expedia →
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        {/* Cross-region links */}
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
            Other regions
          </span>
          {CRUISE_REGIONS.filter((r) => r !== region).map((r) => (
            <Link
              key={r}
              href={`/${r}-cruises`}
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
              {REGION_META[r].label} →
            </Link>
          ))}
          <Link
            href="/cruises"
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
            All cruise ports →
          </Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

export function buildCruiseRegionJsonLd({
  region,
  canonical,
}: {
  region: CruiseRegion;
  canonical: string;
}): string {
  const meta = REGION_META[region];
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.label,
    description: meta.intro,
    url: canonical,
    about: {
      '@type': 'Place',
      name: meta.label,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: cruisePortsForRegion(region).map((port, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Hotels in ${port.name}`,
      })),
    },
  };
  return JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// Re-export the per-port list so any other module that imports from
// here can also enumerate ports without a separate import.
export { CRUISE_PORTS };
