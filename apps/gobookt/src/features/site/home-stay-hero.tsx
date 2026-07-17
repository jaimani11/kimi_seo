'use client';

import Link from 'next/link';
import { BookingSearchWidget } from './booking-widget';

/**
 * Gobookt home hero — accommodation-first, powered by the Booking.com
 * affiliate widget.
 *
 * gobookt is a Booking.com stays-discovery site, not a full-service OTA: the
 * hero does ONE thing well — help you find a place to stay — and hands off to
 * Booking.com. The search itself is Booking's own affiliate WIDGET (see
 * booking-widget.tsx): it's the only path that keeps BOTH the searched
 * destination AND CJ attribution, because every fixed CJ creative we have
 * (homepage banner 17293132, Advanced-Link 17323532) deep-links ONLY to the
 * Booking.com homepage — a hand-rolled form can track but always lost the city.
 *
 * Flights / cars / things-to-do are NOT equal tabs; they're a quiet "plan the
 * rest of your trip" secondary row (the multi-category hero still serves the
 * /flights, /cars vertical landing pages).
 *
 * Popular cities link to our OWN /destinations/[slug] guides — good for crawl +
 * UX. They can't drive the iframe widget, and the old "click a chip → search"
 * path only ever reached the Booking homepage, so an internal link is strictly
 * better.
 *
 * Visual base preserved from the previous hero: bold Inter headline, white panel
 * on a blue gradient band, yellow highlight border, hard-coded colors so the
 * render is identical in light + dark mode.
 */

/** Popular cities — each has a /destinations/[slug] guide (confirmed present). */
const POPULAR_CITIES = [
  { label: 'Tokyo', slug: 'tokyo' },
  { label: 'Rome', slug: 'rome' },
  { label: 'Paris', slug: 'paris' },
  { label: 'Bali', slug: 'bali' },
  { label: 'Lisbon', slug: 'lisbon' },
  { label: 'Barcelona', slug: 'barcelona' },
] as const;

/** Secondary trip-planning links — deliberately quiet, not equal tabs. */
const SECONDARY_LINKS = [
  { label: 'Things to do', href: '/things-to-do' },
  { label: 'Car rentals', href: '/cars' },
  { label: 'Flights', href: '/flights' },
] as const;

const HERO_BG = 'linear-gradient(135deg, #003580 0%, #006ce4 100%)';
const PANEL_BG = '#ffffff';
const HIGHLIGHT = '#ffd166';

export function HomeStayHero() {
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

        {/* Booking.com affiliate search widget — the tracked, destination-correct
            search. Booking's SDK renders the search box in an iframe; the yellow
            panel keeps gobookt chrome and reserves height (no layout shift). */}
        <div
          style={{
            width: '100%',
            maxWidth: '60rem',
            margin: '2.25rem auto 0',
            background: PANEL_BG,
            borderRadius: '1rem',
            border: `4px solid ${HIGHLIGHT}`,
            boxShadow: '0 24px 60px -16px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.14)',
            padding: '1.1rem 1.25rem',
          }}
        >
          <BookingSearchWidget />
        </div>

        {/* Popular cities → our own destination guides (internal links). */}
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
          {POPULAR_CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/destinations/${c.slug}`}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.86rem',
                fontWeight: 500,
                background: 'rgba(255,255,255,0.14)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.34)',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                transition: 'background-color 140ms ease, transform 140ms ease',
              }}
            >
              {c.label}
            </Link>
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
          Search powered by{' '}
          <strong style={{ fontWeight: 700, color: '#ffd166' }}>Booking.com</strong>. Affiliate
          link; the price you pay is the same.
        </p>
      </div>
    </section>
  );
}
