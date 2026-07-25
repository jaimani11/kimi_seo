'use client';

import { useState } from 'react';
import { CATEGORY_META, type ExpediaCategory } from '@lib/affiliate/expedia-multicategory';

/**
 * Gotript multi-category search hero — LIGHT editorial travel-guide identity.
 *
 * De-twinned from its siblings: an editorial Fraunces SERIF headline on a
 * LIGHT warm-IVORY hero band (the visual opposite of numiworks' dark rust),
 * with AUBERGINE/PLUM primary actions and a soft-gold hairline. (Was: a dark
 * wine/claret gradient band that read too close to numiworks.)
 *
 *   - Editorial Fraunces serif headline in warm dark ink
 *   - White search panel lifted off a light ivory/cream hero band
 *   - Soft-gold (highlight) top accent + subtle warm borders on the panel
 *   - Aubergine primary button + active tab; plum-tinted popular chips
 *   - Hard-coded colors so the render is identical in light + dark
 *     mode (CSS-variable-driven backgrounds were the cause of the
 *     prior \"form goes black in dark mode\" bug)
 *
 * On top of that base, gotript's 5-tab category strip — Stays /
 * Flights / Things to do / Cars / Cruises — sits above the field
 * grid so a single hero search covers every Expedia vertical.
 */

// gotript's OWN roster — first-time / bucket-list planning cities (mirrors the
// homepage grid). The first six render as the visible "Popular" chips, which
// seed the trip planner; all twelve are search-field autocomplete.
const POPULAR_DESTINATIONS = [
  'Paris',
  'Rome',
  'Tokyo',
  'London',
  'New York',
  'Barcelona',
  'Kyoto',
  'Istanbul',
  'Prague',
  'Sydney',
  'Amsterdam',
  'Cairo',
] as const;


// LIGHT ivory hero band + aubergine/plum accents. Hard-coded so the render
// is identical in light + dark mode.
const HERO_BG = 'linear-gradient(165deg, #fbf8f1 0%, #f3ead9 55%, #eee3cf 100%)';
const HERO_INK = '#23201c'; // warm dark ink — headline + default hero text
const HERO_INK_SOFT = '#5a5248'; // subhead, "Popular" label, disclaimer (6.6:1 on band)
const PANEL_BG = '#ffffff';
const PANEL_TEXT = '#23201c';
const PANEL_LABEL = '#726a5c'; // field labels — 5.3:1 on white
const PANEL_DIVIDER = '#e7decb'; // warm hairline between fields
const PANEL_BORDER = '#e4d9c4'; // subtle warm border framing the white panel
const PANEL_INPUT_BG = '#ffffff';
const BTN_BG = '#4a2c4d'; // aubergine — white text 11.9:1
const BTN_BG_HOVER = '#6e4a78'; // lighter plum on hover — white text 7.2:1
const BTN_DISABLED = '#d8cbb0';
const HIGHLIGHT = '#b0894f'; // soft gold hairline (decorative)
const TAB_ACTIVE = '#4a2c4d'; // aubergine — 11.9:1 on white
const TAB_INACTIVE = '#726a5c'; // 5.3:1 on white

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
      style={{ background: HERO_BG, color: HERO_INK }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 70% at 80% 20%, rgba(74,44,77,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 10% 90%, rgba(176,137,79,0.07) 0%, transparent 60%)',
        }}
      />

      <div
        className="relative mx-auto flex flex-col items-center justify-center text-center"
        style={{ maxWidth: '72rem', padding: '5rem 1.5rem 7rem' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(2.4rem, 5.4vw, 4rem)',
            fontWeight: 600,
            lineHeight: 1.06,
            letterSpacing: '-0.015em',
            color: HERO_INK,
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
            color: HERO_INK_SOFT,
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
              borderTop: `3px solid ${HIGHLIGHT}`,
              borderLeft: `1px solid ${PANEL_BORDER}`,
              borderRight: `1px solid ${PANEL_BORDER}`,
              borderBottom: `1px solid ${PANEL_DIVIDER}`,
              padding: '0.6rem 0.4rem 0',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              gap: '0.2rem',
            }}
          >
            {CATEGORY_META.filter((c) => c.id !== 'cruises' && c.id !== 'packages').map((c) => {
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
              borderLeft: `1px solid ${PANEL_BORDER}`,
              borderRight: `1px solid ${PANEL_BORDER}`,
              borderBottom: `1px solid ${PANEL_BORDER}`,
              boxShadow:
                '0 20px 48px -18px rgba(35,32,28,0.28), 0 6px 14px rgba(35,32,28,0.10)',
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
              color: HERO_INK_SOFT,
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
                background: 'rgba(74, 44, 77, 0.06)',
                color: '#4a2c4d',
                border: '1px solid rgba(74, 44, 77, 0.20)',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                cursor: 'pointer',
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
            color: HERO_INK_SOFT,
            marginTop: '1.5rem',
            marginBottom: 0,
          }}
        >
          Search hands off to <strong style={{ fontWeight: 700, color: '#4a2c4d' }}>Expedia</strong>. Affiliate link —
          we may earn a commission from completed bookings.
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
      return 'Where to go, when to go, and where to stay';
  }
}

function subheadFor(c: ExpediaCategory): string {
  const tail = 'Powered by Expedia — you continue to Expedia to check prices and book.';
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
      return `Real destination guides — month-by-month weather, neighborhood maps, itineraries and the best time to go for 100+ places. ${tail}`;
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
