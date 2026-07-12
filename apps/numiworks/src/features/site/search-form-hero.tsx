'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from '@/features/shared/icons';
import { track } from '@/lib/analytics/client';

/**
 * Reference-site style hero — solid brand-blue band, white search
 * panel layered on top, sans-serif heading at maximum contrast. The
 * Booking.com / Expedia load-bearing hero pattern, tuned for
 * affiliate-marketplace conversion.
 *
 * Colors are hardcoded inline so the hero renders identically across
 * themes and isn't subject to CSS variable resolution timing.
 */

const POPULAR_DESTINATIONS = [
  'Tokyo',
  'Rome',
  'Paris',
  'Bali',
  'Cappadocia',
  'Reykjavík',
  'Lisbon',
  'New York',
  'Santorini',
  'Marrakech',
  'Dubai',
  'Barcelona',
] as const;

const HERO_BG = 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)';
const PANEL_BG = '#ffffff';
const PANEL_TEXT = '#0c1426';
const PANEL_LABEL = '#64748b';
const PANEL_DIVIDER = '#e2e8f0';
const BTN_BG = '#006ce4';
const BTN_BG_HOVER = '#0050a8';
const BTN_DISABLED = '#cbd5e1';
const HIGHLIGHT = '#ffd166';

export function SearchFormHero() {
  const router = useRouter();
  const today = new Date();
  const defaultIn = isoDate(addDays(today, 14));
  const defaultOut = isoDate(addDays(today, 17));

  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState(defaultIn);
  const [checkOut, setCheckOut] = useState(defaultOut);
  const [travelers, setTravelers] = useState(2);
  const [hover, setHover] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = destination.trim();
    if (!trimmed) return;
    track('hero_search_submit', {
      destination: trimmed,
      checkIn,
      checkOut,
      travelers,
    });
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const canSearch = destination.trim().length > 0;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: HERO_BG,
        color: '#ffffff',
      }}
    >
      {/* Soft accent highlights for depth without obscuring text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 70% at 80% 20%, rgba(255,255,255,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 10% 90%, rgba(255,255,255,0.06) 0%, transparent 60%)',
        }}
      />

      <div
        className="relative mx-auto flex flex-col items-center justify-center text-center"
        style={{
          maxWidth: '72rem',
          padding: '2.75rem 1.5rem 3rem',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            margin: 0,
            maxWidth: '48rem',
          }}
        >
          Plan your trip with AI — tours, hotels &amp; vacation rentals, booked in one place.
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 400,
            fontSize: 'clamp(0.9rem, 1.2vw, 1.02rem)',
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.92)',
            margin: '0.65rem auto 0',
            maxWidth: '38rem',
          }}
        >
          Live Viator inventory · VRBO whole-home rentals · AI concierge itineraries.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            maxWidth: '60rem',
            margin: '2.5rem auto 0',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.85fr) auto',
              background: PANEL_BG,
              borderRadius: '1rem',
              border: `4px solid ${HIGHLIGHT}`,
              boxShadow:
                '0 24px 60px -16px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.14)',
              overflow: 'hidden',
            }}
            className="hero-search-grid"
          >
            <Field label="Destination" border>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where to?"
                list="hero-destinations"
                aria-label="Where to?"
                style={inputStyle}
                autoFocus
              />
              <datalist id="hero-destinations">
                {POPULAR_DESTINATIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
            <Field label="Check-in" border>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                aria-label="Check-in date"
                style={inputStyle}
              />
            </Field>
            <Field label="Check-out" border>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                aria-label="Check-out date"
                style={inputStyle}
              />
            </Field>
            <Field label="Travelers" border>
              <select
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                aria-label="Number of travelers"
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'traveler' : 'travelers'}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="submit"
              disabled={!canSearch}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                background: !canSearch
                  ? BTN_DISABLED
                  : hover
                    ? BTN_BG_HOVER
                    : BTN_BG,
                color: '#ffffff',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                padding: '1.25rem 2rem',
                border: 'none',
                cursor: canSearch ? 'pointer' : 'not-allowed',
                minWidth: '8rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                transition: 'background 160ms ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M7 12.5A5.5 5.5 0 1 1 7 1.5a5.5 5.5 0 0 1 0 11Zm4.5-1L14 14"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
              Search
            </button>
          </div>
        </form>

        <div
          style={{
            margin: '2rem auto 0',
            maxWidth: '52rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.82)',
              marginRight: '0.4rem',
            }}
          >
            Popular
          </span>
          {POPULAR_DESTINATIONS.slice(0, 6).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDestination(d);
                router.push(`/search?q=${encodeURIComponent(d)}`);
              }}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.84rem',
                fontWeight: 500,
                padding: '0.4rem 0.95rem',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.32)',
                color: '#ffffff',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                transition: 'background 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.24)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
              }}
            >
              {d}
            </button>
          ))}
          <a
            href="#agentic-concierge"
            style={{
              marginLeft: '0.6rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: HIGHLIGHT,
              textDecoration: 'none',
            }}
          >
            ✨ Try the AI concierge <ArrowRight size={11} strokeWidth={2.4} />
          </a>
          <a
            href="/quiz"
            style={{
              marginLeft: '0.6rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: HIGHLIGHT,
              textDecoration: 'none',
            }}
          >
            🧭 Where should I go? <ArrowRight size={11} strokeWidth={2.4} />
          </a>
          <a
            href="/trip-cost-estimator"
            style={{
              marginLeft: '0.6rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: HIGHLIGHT,
              textDecoration: 'none',
            }}
          >
            💵 Trip cost estimator <ArrowRight size={11} strokeWidth={2.4} />
          </a>
          <a
            href={process.env.NEXT_PUBLIC_VRBO_SHORTLINK || 'https://vrbo.com/affiliate/zVJTNin'}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              marginLeft: '0.6rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#0A2B45',
              background: '#FBC700',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              textDecoration: 'none',
            }}
          >
            🏡 Whole homes on VRBO <ArrowRight size={11} strokeWidth={2.4} />
          </a>
        </div>
      </div>

      {/* Mobile: collapse the search grid to one column. */}
      <style>{`
        @media (max-width: 760px) {
          .hero-search-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1rem',
  fontWeight: 500,
  color: PANEL_TEXT,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  width: '100%',
  padding: 0,
};

function Field({
  label,
  children,
  border,
}: {
  label: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        padding: '0.95rem 1.25rem',
        textAlign: 'left',
        cursor: 'text',
        borderRight: border ? `1px solid ${PANEL_DIVIDER}` : 'none',
        background: PANEL_BG,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: PANEL_LABEL,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
}
