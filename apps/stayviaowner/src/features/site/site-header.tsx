'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * StayViaOwner site header — vacation-rental focus.
 *
 * Layout matches the RentByOwner reference we're targeting:
 * dark navy bar, mint-green "SEARCH STAYS" pill on the right,
 * 4 nav labels each with a hoverable mega-menu (RENTALS,
 * NEARBY, DESTINATIONS, FOR OWNERS).
 *
 * The mega-menus are click/hover-driven from a single active-menu
 * state so only one panel is open at a time and they collapse on
 * outside click.
 */

const NAVY = '#0f2340';
const NAVY_DEEP = '#0a1930';
const MINT = '#37d0a1';
const MINT_HOVER = '#2fbb90';
const INK_LIGHT = 'rgba(255,255,255,0.92)';
const INK_MUTED = 'rgba(255,255,255,0.7)';

type MenuKey = 'rentals' | 'nearby' | 'destinations' | 'owners' | null;

export function SiteHeader() {
  const [open, setOpen] = useState<MenuKey>(null);

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: NAVY,
        borderBottom: `1px solid ${NAVY_DEEP}`,
      }}
      onMouseLeave={() => setOpen(null)}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3.5">
        {/* Logo */}
        <Link
          href="/"
          aria-label="stayviaowner home"
          className="inline-flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <span
            aria-hidden
            className="grid place-items-center"
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.4rem',
              background: MINT,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="3" cy="3" r="1.5" fill="#fff" />
              <circle cx="8" cy="3" r="1.5" fill="#fff" />
              <circle cx="13" cy="3" r="1.5" fill="#fff" />
              <circle cx="3" cy="8" r="1.5" fill="#fff" />
              <circle cx="13" cy="8" r="1.5" fill="#fff" />
              <circle cx="3" cy="13" r="1.5" fill="#fff" />
              <circle cx="8" cy="13" r="1.5" fill="#fff" />
              <circle cx="13" cy="13" r="1.5" fill="#fff" />
            </svg>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.4rem',
              fontWeight: 500,
              letterSpacing: '-0.015em',
              color: '#fff',
            }}
          >
            stay <span style={{ fontWeight: 700 }}>via</span> owner
          </span>
        </Link>

        {/* Nav */}
        <nav
          className="ml-auto hidden items-center gap-1 md:flex"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          <NavItem label="RENTALS" active={open === 'rentals'} onOpen={() => setOpen('rentals')} />
          <NavItem label="NEARBY" active={open === 'nearby'} onOpen={() => setOpen('nearby')} />
          <NavItem
            label="DESTINATIONS"
            active={open === 'destinations'}
            onOpen={() => setOpen('destinations')}
          />
          <NavItem
            label="FOR OWNERS"
            active={open === 'owners'}
            onOpen={() => setOpen('owners')}
          />
        </nav>

        {/* Search stays button */}
        <Link
          href="/vacation-rentals"
          className="hidden items-center gap-2 md:inline-flex"
          style={{
            background: MINT,
            color: NAVY_DEEP,
            padding: '0.65rem 1.4rem',
            borderRadius: '999px',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = MINT_HOVER)}
          onMouseLeave={(e) => (e.currentTarget.style.background = MINT)}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M7 12.5A5.5 5.5 0 1 1 7 1.5a5.5 5.5 0 0 1 0 11Zm4.5-1L14 14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Search stays
        </Link>
      </div>

      {/* Mega-menus */}
      {open === 'rentals' ? <RentalsMenu /> : null}
      {open === 'nearby' ? <NearbyMenu /> : null}
      {open === 'destinations' ? <DestinationsMenu /> : null}
      {open === 'owners' ? <OwnersMenu /> : null}
    </header>
  );
}

// ── Nav item ──────────────────────────────────────────────────────

function NavItem({
  label,
  active,
  onOpen,
}: {
  label: string;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onOpen}
      onFocus={onOpen}
      style={{
        background: 'transparent',
        border: 'none',
        color: active ? '#fff' : INK_LIGHT,
        fontFamily: 'var(--font-inter)',
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '0.65rem 1rem',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {label}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '1rem',
          right: '1rem',
          bottom: '0.4rem',
          height: '2px',
          background: active ? MINT : 'transparent',
          borderRadius: '2px',
        }}
      />
    </button>
  );
}

// ── Menu panel wrapper ────────────────────────────────────────────

function MenuPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
        borderTop: `1px solid ${NAVY_DEEP}`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}

// ── Rentals mega-menu (3 columns) ────────────────────────────────

function RentalsMenu() {
  return (
    <MenuPanel>
      <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <MenuColumn heading="PROPERTY TYPES">
          <MenuLink href="/vacation-rentals">All vacation rentals</MenuLink>
          <MenuLink href="/villas">Villas</MenuLink>
          <MenuLink href="/cabins">Cabins</MenuLink>
          <MenuLink href="/cottages">Cottages</MenuLink>
          <MenuLink href="/beach-houses">Beach houses</MenuLink>
          <MenuLink href="/ski-lodges">Ski lodges</MenuLink>
          <MenuLink href="/lake-houses">Lake houses</MenuLink>
          <MenuLink href="/stays">Hotels &amp; resorts</MenuLink>
        </MenuColumn>
        <MenuColumn heading="SPECIAL STAYS">
          <MenuLink href="/villas">Luxury rentals</MenuLink>
          <MenuLink href="/beach-houses">Family rentals</MenuLink>
          <MenuLink href="/cottages">Pet-friendly rentals</MenuLink>
          <MenuLink href="/villas">Vacation rentals with pools</MenuLink>
          <MenuLink href="/beach-houses">Oceanfront vacation rentals</MenuLink>
          <MenuLink href="/lake-houses">Waterfront rentals</MenuLink>
          <MenuLink href="/beach-houses">Summer rentals</MenuLink>
          <MenuLink href="/ski-lodges">Winter rentals</MenuLink>
        </MenuColumn>
        <MenuColumn heading="TYPES OF TRAVEL">
          <MenuLink href="/villas">Group travel</MenuLink>
          <MenuLink href="/cabins">Weekend getaways</MenuLink>
          <MenuLink href="/beach-houses">Honeymoon stays</MenuLink>
          <MenuLink href="/cottages">Slow travel</MenuLink>
          <MenuLink href="/vacation-rentals">Long-term stays</MenuLink>
        </MenuColumn>
      </div>
    </MenuPanel>
  );
}

// ── Nearby menu ──────────────────────────────────────────────────

function NearbyMenu() {
  return (
    <MenuPanel>
      <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <MenuColumn heading="NEAR YOU">
          <MenuLink href="/vacation-rentals?ss=nearby">All near me</MenuLink>
          <MenuLink href="/vacation-rentals?ss=nearby&drive=2h">Less than 2 hours</MenuLink>
          <MenuLink href="/vacation-rentals?ss=nearby&drive=4h">Less than 4 hours</MenuLink>
          <MenuLink href="/vacation-rentals?ss=nearby&drive=6h">Less than 6 hours</MenuLink>
          <MenuLink href="/vacation-rentals?ss=nearby&drive=8h">Less than 8 hours</MenuLink>
        </MenuColumn>
        <MenuColumn heading="QUICK GETAWAYS">
          <MenuLink href="/cabins">Weekend cabin escapes</MenuLink>
          <MenuLink href="/beach-houses">Coastal weekends</MenuLink>
          <MenuLink href="/lake-houses">Lakeside long weekends</MenuLink>
          <MenuLink href="/cottages">Countryside staycations</MenuLink>
        </MenuColumn>
      </div>
    </MenuPanel>
  );
}

// ── Destinations mega-menu ────────────────────────────────────────

function DestinationsMenu() {
  return (
    <MenuPanel>
      <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <MenuColumn heading="POPULAR CITIES">
          <MenuLink href="/destinations/paris">Paris, France</MenuLink>
          <MenuLink href="/destinations/rome">Rome, Italy</MenuLink>
          <MenuLink href="/destinations/tokyo">Tokyo, Japan</MenuLink>
          <MenuLink href="/destinations/tulum">Tulum, Mexico</MenuLink>
          <MenuLink href="/destinations/bali">Bali, Indonesia</MenuLink>
          <MenuLink href="/destinations/santorini">Santorini, Greece</MenuLink>
        </MenuColumn>
        <MenuColumn heading="U.S. HOTSPOTS">
          <MenuLink href="/destinations/miami">Miami, Florida</MenuLink>
          <MenuLink href="/destinations/nashville">Nashville, Tennessee</MenuLink>
          <MenuLink href="/destinations/new-orleans">New Orleans, Louisiana</MenuLink>
          <MenuLink href="/destinations/austin">Austin, Texas</MenuLink>
          <MenuLink href="/destinations/charleston">Charleston, South Carolina</MenuLink>
          <MenuLink href="/destinations/honolulu">Honolulu, Hawaii</MenuLink>
        </MenuColumn>
        <MenuColumn heading="MOUNTAIN + LAKE">
          <MenuLink href="/destinations/banff">Banff, Canada</MenuLink>
          <MenuLink href="/destinations/whistler">Whistler, Canada</MenuLink>
          <MenuLink href="/destinations/zermatt">Zermatt, Switzerland</MenuLink>
          <MenuLink href="/destinations/interlaken">Interlaken, Switzerland</MenuLink>
          <MenuLink href="/destinations/lake-como">Lake Como, Italy</MenuLink>
          <MenuLink href="/destinations/queenstown">Queenstown, New Zealand</MenuLink>
        </MenuColumn>
      </div>
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(15, 35, 64, 0.12)',
          textAlign: 'center',
        }}
      >
        <Link
          href="/destinations"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: NAVY,
            textDecoration: 'none',
          }}
        >
          Explore all 187+ destinations →
        </Link>
      </div>
    </MenuPanel>
  );
}

// ── Owners menu ──────────────────────────────────────────────────

function OwnersMenu() {
  return (
    <MenuPanel>
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              color: NAVY_DEEP,
              fontWeight: 700,
              margin: 0,
            }}
          >
            OWNER RESOURCES
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: 'rgba(15,35,64,0.7)',
            }}
          >
            List with our partner networks · Expedia + VRBO reach 750M+ travelers a month.
          </p>
        </div>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              color: NAVY_DEEP,
              fontWeight: 700,
              margin: 0,
            }}
          >
            LIST YOUR PROPERTY
          </p>
          <a
            href="https://www.vrbo.com/lodging/hosting"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-2 inline-block"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: NAVY,
              textDecoration: 'underline',
            }}
          >
            Add a listing to VRBO →
          </a>
        </div>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              color: NAVY_DEEP,
              fontWeight: 700,
              margin: 0,
            }}
          >
            SUPPORT
          </p>
          <Link
            href="/contact"
            className="mt-2 inline-block"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: NAVY,
              textDecoration: 'underline',
            }}
          >
            Contact us →
          </Link>
        </div>
      </div>
    </MenuPanel>
  );
}

// ── Menu building blocks ─────────────────────────────────────────

function MenuColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          letterSpacing: '0.16em',
          color: NAVY_DEEP,
          fontWeight: 700,
          margin: '0 0 1rem',
        }}
      >
        {heading}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.65rem' }}>
        {children}
      </ul>
    </div>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.95rem',
          color: NAVY,
          textDecoration: 'none',
          fontWeight: 400,
        }}
      >
        {children}
      </Link>
    </li>
  );
}
