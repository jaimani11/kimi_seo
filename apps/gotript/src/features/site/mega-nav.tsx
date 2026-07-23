'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Desktop mega-dropdown nav — EDITORIAL-FIRST. gotript's job is "teach me
 * about this destination", so the nav leads with the editorial surfaces that
 * actually earn its search traffic (destination guides, then trip guides:
 * best-time / airport / where-to-stay pages) and DEMOTES the accommodation
 * matrix below them. This restores internal-link prominence + topical
 * hierarchy to those pages after the accommodation-first repositioning had
 * quietly pushed them out of the primary nav.
 *
 * Every href is a VERIFIED live internal route (direct 200, no redirect) —
 * the itinerary + things-to-do-in-{city} slugs were deliberately left out
 * because they 308-redirect. SEO internal-linking, no affiliate redirect
 * here. Hover opens a multi-column panel. Desktop only — mobile keeps the
 * search-led hero. Theme-aware via CSS vars.
 */

interface NavCol {
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}

const STAYS_COLS: readonly NavCol[] = [
  {
    heading: 'Property types',
    links: [
      { label: 'Vacation rentals', href: '/vacation-rentals' },
      { label: 'Villas', href: '/villas' },
      { label: 'Cabins', href: '/cabins' },
      { label: 'Cottages', href: '/cottages' },
      { label: 'Beach houses', href: '/beach-houses' },
      { label: 'Hotels & stays', href: '/stays' },
    ],
  },
  {
    heading: 'Special stays',
    links: [
      { label: 'Luxury villas', href: '/luxury-villas' },
      { label: 'Family villas', href: '/family-villas' },
      { label: 'Villas with pools', href: '/private-pool-villas' },
      { label: 'Pet-friendly rentals', href: '/pet-friendly-villas' },
      { label: 'Beach villas', href: '/beach-villas' },
    ],
  },
];

const CITIES = [
  'Rome', 'Santorini', 'Bali', 'Paris', 'Barcelona', 'Lisbon',
  'Tokyo', 'New York', 'Dubai', 'Marrakech', 'Reykjavík', 'Cappadocia',
];

const citySlug = (c: string) =>
  c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');

// Point at each city's destination GUIDE (weather/map/where-to-stay), not the
// retired Viator /search. On-brand and internal.
const DEST_COLS: readonly NavCol[] = [
  {
    heading: 'Popular destinations',
    links: CITIES.slice(0, 6).map((c) => ({ label: c, href: `/destinations/${citySlug(c)}` })),
  },
  {
    heading: 'More destinations',
    links: CITIES.slice(6).map((c) => ({ label: c, href: `/destinations/${citySlug(c)}` })),
  },
];

// Trip-guide editorial pages — gotript's actual search earners. Every href was
// verified as a DIRECT 200 against production (best-time / airport / where-to-
// stay). The itinerary + things-to-do-in-{city} slugs are intentionally NOT
// here: they 308-redirect (to /plan and to canonical guides), and linking a
// nav through a redirect wastes crawl budget + adds a hop for users.
const GUIDE_CITIES = ['Rome', 'Paris', 'Barcelona', 'Tokyo', 'Bali'] as const;
const guideSlug = (c: string) => c.toLowerCase();

const TRIP_GUIDE_COLS: readonly NavCol[] = [
  {
    heading: 'Best time to visit',
    links: GUIDE_CITIES.map((c) => ({ label: c, href: `/best-time-to-visit-${guideSlug(c)}` })),
  },
  {
    heading: 'Airport guides',
    links: GUIDE_CITIES.map((c) => ({ label: c, href: `/${guideSlug(c)}-airport-guide` })),
  },
  {
    heading: 'Where to stay',
    links: GUIDE_CITIES.map((c) => ({ label: c, href: `/where-to-stay-in-${guideSlug(c)}` })),
  },
];

export function MegaNav() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="relative hidden items-center gap-0.5 md:flex" onMouseLeave={() => setOpen(null)}>
      {/* Editorial-first order: gotript's job is "teach me about this place",
       *  so Destinations + Trip guides lead. Vacation rentals is demoted below
       *  the editorial surfaces (it's stayviaowner's core intent, not this
       *  brand's) — this restores internal-link prominence to the guide,
       *  best-time and airport pages that actually earn gotript's traffic. */}
      <MegaItem
        id="dest"
        label="Destinations"
        cols={DEST_COLS}
        open={open === 'dest'}
        onHover={setOpen}
        footer={{ label: 'All destination guides →', href: '/destinations' }}
      />
      <MegaItem
        id="guides"
        label="Trip guides"
        cols={TRIP_GUIDE_COLS}
        open={open === 'guides'}
        onHover={setOpen}
        footer={{ label: 'Plan your trip →', href: '/plan' }}
      />
      <FlatLink href="/things-to-do" onHover={() => setOpen(null)}>Things to do</FlatLink>
      <MegaItem
        id="stays"
        label="Vacation rentals"
        cols={STAYS_COLS}
        open={open === 'stays'}
        onHover={setOpen}
        footer={{ label: 'Browse all stays →', href: '/vacation-rentals' }}
      />
      <FlatLink href="/flights" onHover={() => setOpen(null)}>Flights</FlatLink>
      <FlatLink href="/cars" onHover={() => setOpen(null)}>Cars</FlatLink>
      <FlatLink href="/about" onHover={() => setOpen(null)}>About</FlatLink>
    </nav>
  );
}

function MegaItem({
  id,
  label,
  cols,
  open,
  onHover,
  footer,
}: {
  id: string;
  label: string;
  cols: readonly NavCol[];
  open: boolean;
  onHover: (id: string) => void;
  footer: { label: string; href: string };
}) {
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => onHover(id)}>
      <button type="button" aria-expanded={open} style={triggerStyle(open)}>
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 140ms ease' }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            // Flush to the trigger (top: 100%) with a transparent paddingTop
            // "bridge" instead of an empty margin gap. The bridge is part of
            // this element, so moving the cursor from the trigger down into
            // the panel never leaves the hover target — the menu stays open
            // and its links are clickable.
            top: '100%',
            left: 0,
            zIndex: 40,
            paddingTop: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '2.5rem',
              padding: '1.25rem 1.5rem',
              borderRadius: '0.9rem',
              background: 'var(--surface-base)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 24px 60px -20px rgba(12,20,38,0.35), 0 8px 20px rgba(12,20,38,0.10)',
            }}
          >
          {cols.map((col) => (
            <div key={col.heading}>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  margin: '0 0 0.6rem',
                }}
              >
                {col.heading}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.15rem', minWidth: '9.5rem' }}>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} style={panelLinkStyle}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {col === cols[cols.length - 1] && (
                <Link href={footer.href} style={footerLinkStyle}>
                  {footer.label}
                </Link>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlatLink({ href, onHover, children }: { href: string; onHover: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      className="rounded-md px-3 py-1.5 transition-colors hover:bg-[color:var(--surface-overlay)]"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.82rem',
        fontWeight: 500,
        color: 'var(--ink-secondary)',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}

function triggerStyle(open: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    background: open ? 'var(--surface-overlay)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    padding: '0.375rem 0.75rem',
    fontFamily: 'var(--font-inter)',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: open ? 'var(--ink-primary)' : 'var(--ink-secondary)',
    transition: 'background-color 140ms ease, color 140ms ease',
  };
}

const panelLinkStyle: React.CSSProperties = {
  display: 'block',
  padding: '0.35rem 0.5rem',
  borderRadius: '0.375rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.86rem',
  fontWeight: 500,
  color: 'var(--ink-secondary)',
  textDecoration: 'none',
};

const footerLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '0.75rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--accent-primary)',
  textDecoration: 'none',
};
