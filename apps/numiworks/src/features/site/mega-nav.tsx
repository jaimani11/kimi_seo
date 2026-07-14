'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Numiworks desktop mega-dropdown nav (BedroomVillas / hotala style).
 * Numiworks is the whole-home + AI-planning brand and has no per-type
 * internal routes, so:
 *   - "Vacation homes" funnels each whole-home type to VRBO (the tracked
 *     affiliate — external, sponsored).
 *   - "Destinations" runs numiworks's own Viator experience search (/search).
 *   - Flat links cover the AI tools.
 * Desktop only; mobile keeps the search-led hero. Theme-aware via CSS vars.
 *
 * The dropdown panel is flush to its trigger (top: 100%) with a transparent
 * paddingTop "bridge" rather than an empty margin gap, so moving the cursor
 * from the trigger into the panel never leaves the hover target — the menu
 * stays open and its links stay clickable.
 */

const VRBO_LINK = process.env.NEXT_PUBLIC_VRBO_SHORTLINK || 'https://vrbo.com/affiliate/zVJTNin';

const HOME_TYPES = [
  'Villas', 'Cabins', 'Cottages', 'Beach homes',
  'Family homes', 'Homes with pools', 'Pet-friendly', 'Ski chalets',
];

const CITIES = [
  'Rome', 'Santorini', 'Bali', 'Paris', 'Barcelona', 'Lisbon',
  'Tokyo', 'New York', 'Dubai', 'Marrakech', 'Reykjavík', 'Cappadocia',
];

export function MegaNav() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="relative hidden items-center gap-0.5 md:flex" onMouseLeave={() => setOpen(null)}>
      {/* Vacation homes -> VRBO (external, tracked) */}
      <div style={{ position: 'relative' }} onMouseEnter={() => setOpen('homes')}>
        <button type="button" aria-expanded={open === 'homes'} style={triggerStyle(open === 'homes')}>
          Vacation homes
          <Chevron open={open === 'homes'} />
        </button>
        {open === 'homes' && (
          <Panel>
            <div>
              <p style={colHeadingStyle}>Whole homes on VRBO</p>
              <ul style={listStyle}>
                {HOME_TYPES.slice(0, 4).map((t) => (
                  <li key={t}><VrboLink label={t} /></li>
                ))}
              </ul>
            </div>
            <div>
              <p style={colHeadingStyle}>By style</p>
              <ul style={listStyle}>
                {HOME_TYPES.slice(4).map((t) => (
                  <li key={t}><VrboLink label={t} /></li>
                ))}
              </ul>
              <a href={VRBO_LINK} target="_blank" rel="sponsored nofollow noopener noreferrer" style={footerLinkStyle}>
                Browse all on VRBO →
              </a>
            </div>
          </Panel>
        )}
      </div>

      {/* Destinations -> Viator experience search */}
      <div style={{ position: 'relative' }} onMouseEnter={() => setOpen('dest')}>
        <button type="button" aria-expanded={open === 'dest'} style={triggerStyle(open === 'dest')}>
          Destinations
          <Chevron open={open === 'dest'} />
        </button>
        {open === 'dest' && (
          <Panel>
            {[CITIES.slice(0, 6), CITIES.slice(6)].map((col, i) => (
              <div key={i}>
                <p style={colHeadingStyle}>{i === 0 ? 'Popular destinations' : 'More destinations'}</p>
                <ul style={listStyle}>
                  {col.map((c) => (
                    <li key={c}>
                      <Link href={`/search?q=${encodeURIComponent(c)}`} style={panelLinkStyle}>{c}</Link>
                    </li>
                  ))}
                </ul>
                {i === 1 && (
                  <Link href="/destinations" style={footerLinkStyle}>See all destinations →</Link>
                )}
              </div>
            ))}
          </Panel>
        )}
      </div>

      <FlatLink href="/plan" onHover={() => setOpen(null)}>Plan with AI</FlatLink>
      <FlatLink href="/quiz" onHover={() => setOpen(null)}>Where to go</FlatLink>
      <FlatLink href="/about" onHover={() => setOpen(null)}>About</FlatLink>
    </nav>
  );
}

/**
 * Absolute dropdown panel. The outer element is flush to the trigger
 * (top: 100%) and carries a transparent paddingTop bridge; the inner
 * element is the visible card. Keeping the bridge as part of the panel
 * is what makes the menu "stick" while the cursor travels into it.
 */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div role="menu" style={panelBridgeStyle}>
      <div style={panelCardStyle}>{children}</div>
    </div>
  );
}

function VrboLink({ label }: { label: string }) {
  return (
    <a href={VRBO_LINK} target="_blank" rel="sponsored nofollow noopener noreferrer" style={panelLinkStyle}>
      {label}
    </a>
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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 140ms ease' }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

const panelBridgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: 40,
  paddingTop: '0.5rem',
};

const panelCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2.5rem',
  padding: '1.25rem 1.5rem',
  borderRadius: '0.9rem',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-subtle)',
  boxShadow: '0 24px 60px -20px rgba(12,20,38,0.35), 0 8px 20px rgba(12,20,38,0.10)',
};

const colHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'var(--accent-primary)',
  margin: '0 0 0.6rem',
};

const listStyle: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.15rem', minWidth: '9.5rem' };

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
