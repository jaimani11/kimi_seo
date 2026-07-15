'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Rental-focused home hero for stayviaowner.com.
 *
 * Matches the RentByOwner reference:
 *   - Full-bleed dark image with white overlay copy
 *   - Big headline: "STAYVIAOWNER VACATION RENTALS ARE YOURS TO DISCOVER"
 *   - White search band with Destination + Dates + green "Show best prices"
 *   - Property-type chips below the search
 *
 * Search: hands off directly to /api/go/expedia (the tracked VRBO/Expedia
 * redirect) in ONE step — no intermediate /vacation-rentals search form.
 */

const NAVY = '#0f2340';
const NAVY_DEEP = '#0a1930';
const MINT = '#37d0a1';
const MINT_HOVER = '#2fbb90';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=2400&q=80&auto=format&fit=crop';

const PROPERTY_CHIPS: readonly { label: string; emoji: string; href: string }[] = [
  { label: 'Villas', emoji: '🏛️', href: '/villas' },
  { label: 'Cabins', emoji: '🪵', href: '/cabins' },
  { label: 'Cottages', emoji: '🏡', href: '/cottages' },
  { label: 'Beach houses', emoji: '🏖️', href: '/beach-houses' },
  { label: 'Ski lodges', emoji: '⛷️', href: '/ski-lodges' },
  { label: 'Lake houses', emoji: '🛶', href: '/lake-houses' },
];

const POPULAR_DESTINATIONS: readonly string[] = [
  'Palm Desert, California',
  'Miami, Florida',
  'Santorini, Greece',
  'Tulum, Mexico',
  'Whistler, Canada',
  'Lake Como, Italy',
];

export function RentalHero() {
  const [destination, setDestination] = useState('Palm Desert, California, USA');
  const [checkIn, setCheckIn] = useState('2026-07-20');
  const [checkOut, setCheckOut] = useState('2026-07-27');

  // One-step handoff: go straight to VRBO via the tracked /api/go/expedia
  // redirect (same route the /vacation-rentals search uses). Previously this
  // linked to /vacation-rentals?ss=… — a page that ignored the params and
  // showed an empty form, forcing a second search. No more middle step.
  const goToVrbo = () => {
    const dest = destination.trim();
    if (!dest) return;
    const params = new URLSearchParams({
      category: 'vacation-rentals',
      destination: dest,
      adults: '2',
    });
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    window.open(`/api/go/expedia?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '78vh',
        background: `linear-gradient(180deg, rgba(15,35,64,0.55) 0%, rgba(10,25,48,0.85) 100%), url("${HERO_IMAGE}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pt-16 pb-14 text-center md:pt-24 md:pb-16">
        <h1
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(1.9rem, 4.5vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#fff',
            margin: 0,
            maxWidth: '54rem',
            textTransform: 'uppercase',
          }}
        >
          Vacation rentals by owner — villas, cabins &amp; beach houses
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.9)',
            margin: '1rem auto 0',
            maxWidth: '36rem',
          }}
        >
          Whole homes, villas, cabins and cottages from Vrbo — one search across every property type.
        </p>

        {/* Search band */}
        <form
          className="mt-10 w-full"
          style={{ maxWidth: '60rem' }}
          onSubmit={(e) => {
            e.preventDefault();
            goToVrbo();
          }}
        >
          <div
            className="grid gap-0"
            style={{
              background: '#fff',
              borderRadius: '0.55rem',
              overflow: 'hidden',
              boxShadow: '0 20px 45px -12px rgba(0,0,0,0.45)',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr) auto',
            }}
          >
            <label
              style={{
                padding: '1rem 1.25rem',
                borderRight: '1px solid #e2e8f0',
                textAlign: 'left',
                cursor: 'text',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.14em',
                  color: '#64748b',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Where to?
              </span>
              <input
                type="text"
                list="popular-destinations"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                aria-label="Destination"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  padding: 0,
                  marginTop: '0.2rem',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: NAVY_DEEP,
                  background: 'transparent',
                  textTransform: 'uppercase',
                }}
              />
              <datalist id="popular-destinations">
                {POPULAR_DESTINATIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </label>

            <div
              style={{
                padding: '1rem 1.25rem',
                borderRight: '1px solid #e2e8f0',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
              <label style={{ display: 'block' }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.14em',
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Check-in
                </span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  aria-label="Check-in"
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    marginTop: '0.2rem',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: NAVY_DEEP,
                    background: 'transparent',
                  }}
                />
              </label>
              <label style={{ display: 'block' }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.14em',
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Check-out
                </span>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  aria-label="Check-out"
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    marginTop: '0.2rem',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: NAVY_DEEP,
                    background: 'transparent',
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              style={{
                background: MINT,
                color: NAVY_DEEP,
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '0 2.25rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = MINT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = MINT)}
            >
              Show best prices
            </button>
          </div>
        </form>

        {/* Property-type chips */}
        <div
          className="mt-8 flex flex-wrap items-center justify-center"
          style={{ gap: '0.6rem' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              marginRight: '0.5rem',
            }}
          >
            Popular
          </span>
          {PROPERTY_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1.05rem',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.32)',
                color: '#fff',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                fontWeight: 500,
                textDecoration: 'none',
                backdropFilter: 'blur(6px)',
              }}
            >
              <span aria-hidden>{chip.emoji}</span>
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile responsive: collapse the search grid to one column */}
      <style>{`
        @media (max-width: 720px) {
          form > div {
            grid-template-columns: 1fr !important;
          }
          form > div > label,
          form > div > div {
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0;
          }
          form > div > button {
            padding: 1rem !important;
          }
        }
      `}</style>
    </section>
  );
}
