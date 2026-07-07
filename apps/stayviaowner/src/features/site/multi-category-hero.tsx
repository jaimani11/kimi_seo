'use client';

import { useState } from 'react';
import { CATEGORY_META, type ExpediaCategory } from '@lib/affiliate/expedia-multicategory';

/**
 * Gotript multi-category search hero.
 *
 * Visual sister to numiworks's SearchFormHero — same Expedia /
 * Expedia load-bearing pattern:
 *
 *   - Bold sans-serif Inter headline at maximum contrast
 *   - White panel layered on a blue gradient hero band
 *   - Yellow (highlight) border around the panel
 *   - Hard-coded colors so the render is identical in light + dark
 *     mode (CSS-variable-driven backgrounds were the cause of the
 *     prior \"form goes black in dark mode\" bug)
 *
 * On top of that base, stayviaowner's 5-tab category strip — Stays /
 * Flights / Things to do / Cars / Cruises — sits above the field
 * grid so a single hero search covers every Expedia vertical.
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
const TAB_ACTIVE = '#003580';
const TAB_INACTIVE = '#64748b';

export function MultiCategoryHero({
  initialCategory = 'hotels',
}: {
  initialCategory?: ExpediaCategory;
} = {}) {
  const today = new Date();
  const defaultIn = isoDate(addDays(today, 14));
  const defaultOut = isoDate(addDays(today, 17));

  const [category, setCategory] = useState<ExpediaCategory>(initialCategory);
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState('');
  const [checkIn, setCheckIn] = useState(defaultIn);
  const [checkOut, setCheckOut] = useState(defaultOut);
  const [travelers, setTravelers] = useState(2);
  const [children, setChildren] = useState(0);
  const [hover, setHover] = useState(false);

  function submit(dest: string = destination) {
    const trimmed = dest.trim();
    if (!trimmed) return;
    const params = new URLSearchParams({ category, destination: trimmed });
    const trimmedOrigin = origin.trim();
    if (trimmedOrigin) params.set('origin', trimmedOrigin);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('adults', String(travelers));
    if (children > 0) params.set('children', String(children));
    window.open(`/api/go/expedia?${params.toString()}`, '_blank', 'noopener,noreferrer');
  }

  const canSearch = destination.trim().length > 0;
  const headline = headlineFor(category);
  const subhead = subheadFor(category);
  const dateLabel = dateLabelFor(category);
  const destinationLabel = destinationLabelFor(category);
  const destinationPlaceholder = destinationPlaceholderFor(category);
  const showDates = true;
  const showTravelers =
    category === 'hotels' || category === 'flights' || category === 'packages';
  const showOrigin = category === 'flights';
  const destinationOptions = POPULAR_DESTINATIONS;
  const popularChipLabel = 'Popular';

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
            maxWidth: '54rem',
          }}
        >
          {headline}
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
          {subhead}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          style={{ width: '100%', maxWidth: '60rem', margin: '2.25rem auto 0' }}
        >
          {/* Tab strip — sits flush against the form like Expedia's
            * own search */}
          <div
            style={{
              background: PANEL_BG,
              borderRadius: '1rem 1rem 0 0',
              border: `4px solid ${HIGHLIGHT}`,
              borderBottom: `1px solid ${PANEL_DIVIDER}`,
              padding: '0.6rem 0.4rem 0',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              gap: '0.2rem',
            }}
          >
            {CATEGORY_META.map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `3px solid ${active ? TAB_ACTIVE : 'transparent'}`,
                    padding: '0.7rem 1rem',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: active ? TAB_ACTIVE : TAB_INACTIVE,
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Field grid */}
          <div
            style={{
              background: PANEL_BG,
              borderRadius: '0 0 1rem 1rem',
              borderLeft: `4px solid ${HIGHLIGHT}`,
              borderRight: `4px solid ${HIGHLIGHT}`,
              borderBottom: `4px solid ${HIGHLIGHT}`,
              boxShadow:
                '0 24px 60px -16px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.14)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: gridTemplateFor(showDates, showTravelers, showOrigin),
            }}
          >
            {showOrigin && (
              <Field label="Flying from" border>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. New York"
                  list="hero-origins"
                  aria-label="Flying from"
                  style={inputStyle()}
                />
                <datalist id="hero-origins">
                  {POPULAR_DESTINATIONS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
            )}

            <Field label={destinationLabel} border>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={destinationPlaceholder}
                list="hero-destinations"
                aria-label={destinationLabel}
                style={inputStyle()}
                autoFocus
              />
              <datalist id="hero-destinations">
                {destinationOptions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>

            {showDates && (
              <>
                <Field label={dateLabel.checkIn} border>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    aria-label={dateLabel.checkIn}
                    style={inputStyle()}
                  />
                </Field>
                <Field label={dateLabel.checkOut} border>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    aria-label={dateLabel.checkOut}
                    style={inputStyle()}
                  />
                </Field>
              </>
            )}

            {showTravelers && (
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
            )}

            {showTravelers && (
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
            )}

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
                transition: 'background-color 120ms ease',
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Popular destinations chips — mirrors numiworks's accelerator
          * pattern. Clicking a chip pre-fills + submits. */}
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
            {popularChipLabel}
          </span>
          {destinationOptions.slice(0, 6).map((d) => (
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

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.82)',
            marginTop: '1.5rem',
            marginBottom: 0,
          }}
        >
          Search hands off to <strong style={{ fontWeight: 700, color: '#ffd166' }}>Expedia</strong>. Affiliate link;
          the price you pay is the same.
        </p>
      </div>
    </section>
  );
}

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

function gridTemplateFor(
  showDates: boolean,
  showTravelers: boolean,
  showOrigin: boolean,
): string {
  // Build a sensible grid template per category. Always reserve a
  // column for the Search button at the end. When origin is shown
  // (flights only), it sits as the first field before destination.
  const cols: string[] = [];
  if (showOrigin) {
    cols.push('minmax(0, 1.2fr)'); // flying from
  }
  cols.push('minmax(0, 1.4fr)'); // destination (slightly narrower when origin shows)
  if (showDates) {
    cols.push('minmax(0, 1fr)', 'minmax(0, 1fr)'); // checkIn, checkOut
  }
  if (showTravelers) {
    cols.push('minmax(0, 0.85fr)', 'minmax(0, 0.7fr)'); // travelers, children
  }
  cols.push('auto'); // search button
  return cols.join(' ');
}

function headlineFor(c: ExpediaCategory): string {
  switch (c) {
    case 'vacation-rentals':
      return 'Vacation rentals — whole homes, cabins & villas on VRBO';
    case 'flights':
      return 'Cheap flights, every major airline worldwide';
    case 'cars':
      return 'Car rentals at airports and city pick-up points';
    case 'cruises':
      return 'River, ocean & expedition cruises worldwide';
    case 'attractions':
      return 'Tours, day trips, food walks & attraction tickets';
    case 'packages':
      return 'Hotel + flight bundles — save more booking together';
    default:
      return 'Find hotels, vacation rentals, flights & things to do worldwide';
  }
}

function subheadFor(c: ExpediaCategory): string {
  const tail = 'Powered by Expedia. Real-time prices, free cancellation on most bookings.';
  switch (c) {
    case 'vacation-rentals':
      return `More space, kitchens, room to spread out — VRBO's 2M+ whole-home listings. ${tail.replace('Expedia', 'Expedia Group')}`;
    case 'flights':
      return `Compare fares across hundreds of carriers. ${tail}`;
    case 'cars':
      return `Every major rental company in one search. ${tail}`;
    case 'cruises':
      return `Caribbean, Mediterranean, Alaska, fjords — every major cruise line. ${tail}`;
    case 'attractions':
      return `Skip-the-line tickets, guided tours, half-day adventures. ${tail}`;
    case 'packages':
      return `Bundle hotel + flight in one search — Expedia's package deals beat à-la-carte. ${tail}`;
    default:
      return `Search across hotels, vacation rentals, flights, cars, cruises and bookable experiences. ${tail}`;
  }
}

function destinationLabelFor(c: ExpediaCategory): string {
  switch (c) {
    case 'flights':
      return 'Flying to';
    case 'cars':
      return 'Pick-up location';
    case 'cruises':
      return 'Region or port';
    case 'packages':
      return 'Destination';
    default:
      return 'Destination';
  }
}

function destinationPlaceholderFor(c: ExpediaCategory): string {
  switch (c) {
    case 'flights':
      return 'e.g. Tokyo';
    case 'cars':
      return 'e.g. Rome Fiumicino';
    case 'cruises':
      return 'e.g. Caribbean';
    case 'attractions':
      return 'e.g. Paris';
    case 'packages':
      return 'e.g. Cancun';
    default:
      return 'Where to?';
  }
}

function dateLabelFor(c: ExpediaCategory): { checkIn: string; checkOut: string } {
  switch (c) {
    case 'flights':
      return { checkIn: 'Depart', checkOut: 'Return' };
    case 'cars':
      return { checkIn: 'Pick-up', checkOut: 'Return' };
    default:
      return { checkIn: 'Check-in', checkOut: 'Check-out' };
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(d.getDate() + n);
  return out;
}
