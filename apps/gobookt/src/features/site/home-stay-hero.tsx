'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Gobookt home hero — accommodation-first.
 *
 * gobookt is a Booking.com stays-discovery site, not a full-service OTA:
 * the hero does ONE thing well — help you find a place to stay — and
 * hands off to Booking.com. Flights / cars / things-to-do are NOT equal
 * tabs; they're a small "plan the rest of your trip" secondary row. The
 * multi-category hero is preserved for the /flights, /cars vertical
 * landing pages; the homepage uses this stays-only hero.
 *
 * Visual base preserved from the multi-category hero: bold Inter headline,
 * white panel on a blue gradient band, yellow highlight border, hard-coded
 * colors so the render is identical in light + dark mode.
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

/** Secondary trip-planning links — deliberately quiet, not equal tabs. */
const SECONDARY_LINKS = [
  { label: 'Things to do', href: '/things-to-do' },
  { label: 'Car rentals', href: '/cars' },
  { label: 'Flights', href: '/flights' },
] as const;

const HERO_BG = 'linear-gradient(135deg, #003580 0%, #006ce4 100%)';
const PANEL_BG = '#ffffff';
const PANEL_TEXT = '#0c1426';
const PANEL_LABEL = '#64748b';
const PANEL_DIVIDER = '#e2e8f0';
const PANEL_INPUT_BG = '#ffffff';
const BTN_BG = '#006ce4';
const BTN_BG_HOVER = '#0050a8';
const BTN_DISABLED = '#cbd5e1';
const HIGHLIGHT = '#ffd166';

export function HomeStayHero() {
  const today = new Date();
  const defaultIn = isoDate(addDays(today, 14));
  const defaultOut = isoDate(addDays(today, 17));

  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState(defaultIn);
  const [checkOut, setCheckOut] = useState(defaultOut);
  const [travelers, setTravelers] = useState(2);
  const [children, setChildren] = useState(0);
  const [hover, setHover] = useState(false);

  function submit(dest: string = destination) {
    const trimmed = dest.trim();
    if (!trimmed) return;
    // gobookt is Booking.com stays-only — the hero always searches hotels.
    const params = new URLSearchParams({ category: 'hotels', destination: trimmed });
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('adults', String(travelers));
    if (children > 0) params.set('children', String(children));
    window.open(`/api/go/booking?${params.toString()}`, '_blank', 'noopener,noreferrer');
  }

  const canSearch = destination.trim().length > 0;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: HERO_BG, color: '#ffffff' }}
    >
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
        style={{ maxWidth: '72rem', padding: '5rem 1.5rem 7rem' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(2.4rem, 5.4vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: '#ffffff',
            margin: 0,
            maxWidth: '48rem',
          }}
        >
          Find a better place to stay
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 400,
            fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.96)',
            margin: '1.25rem auto 0',
            maxWidth: '44rem',
          }}
        >
          Discover hotels, vacation homes, villas, apartments, resorts, cabins, and unique
          stays around the world.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          style={{ width: '100%', maxWidth: '60rem', margin: '2.25rem auto 0' }}
        >
          {/* Stays search — one panel, no vertical tabs. */}
          <div
            style={{
              background: PANEL_BG,
              borderRadius: '1rem',
              border: `4px solid ${HIGHLIGHT}`,
              boxShadow:
                '0 24px 60px -16px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.14)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: STAYS_GRID,
            }}
          >
            <Field label="Destination" border>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where to?"
                list="hero-destinations"
                aria-label="Destination"
                style={inputStyle()}
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
                aria-label="Check-in"
                style={inputStyle()}
              />
            </Field>
            <Field label="Check-out" border>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                aria-label="Check-out"
                style={inputStyle()}
              />
            </Field>

            <Field label="Travelers" border>
              <select
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                aria-label="Number of travelers"
                style={{ ...inputStyle(), cursor: 'pointer' }}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'traveler' : 'travelers'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Children" border>
              <select
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                aria-label="Number of children"
                style={{ ...inputStyle(), cursor: 'pointer' }}
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
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
                background: !canSearch ? BTN_DISABLED : hover ? BTN_BG_HOVER : BTN_BG,
                color: '#ffffff',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                padding: '1.25rem 2rem',
                border: 'none',
                cursor: canSearch ? 'pointer' : 'not-allowed',
                transition: 'background-color 120ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              Search stays
            </button>
          </div>
        </form>

        {/* Popular destinations — click to pre-fill + search. */}
        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: '0.55rem', margin: '1.75rem auto 0' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.78)',
              fontWeight: 700,
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
                submit(d);
              }}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.86rem',
                fontWeight: 500,
                background: 'rgba(255,255,255,0.14)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.34)',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'background-color 140ms ease, transform 140ms ease',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Secondary trip-planning — quiet links, not equal tabs. */}
        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: '0.35rem 1rem', margin: '1.6rem auto 0' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            Planning the rest of your trip?
          </span>
          {SECONDARY_LINKS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#ffffff',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                textDecorationColor: 'rgba(255,255,255,0.45)',
              }}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.82)',
            marginTop: '1.5rem',
            marginBottom: 0,
          }}
        >
          Search hands off to{' '}
          <strong style={{ fontWeight: 700, color: '#ffd166' }}>Booking.com</strong>. Affiliate
          link; the price you pay is the same.
        </p>
      </div>
    </section>
  );
}

/** Destination · Check-in · Check-out · Travelers · Children · Search. */
const STAYS_GRID =
  'minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.85fr) minmax(0, 0.7fr) auto';

function Field({
  label,
  border,
  children,
}: {
  label: string;
  border?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: 'block',
        textAlign: 'left',
        padding: '0.9rem 1.1rem',
        borderRight: border ? `1px solid ${PANEL_DIVIDER}` : 'none',
        background: PANEL_INPUT_BG,
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: 'block',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: PANEL_LABEL,
          fontWeight: 700,
          marginBottom: '0.35rem',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '0.1rem 0',
    fontFamily: 'var(--font-inter)',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: PANEL_TEXT,
    minWidth: 0,
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(d.getDate() + n);
  return out;
}
