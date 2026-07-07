'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { estimateTripCost, type TripStyle } from '@lib/trip-cost/calculator';
import { hasDestinationGuide } from '@lib/seo/destination-content';
import { SEO_CITIES, type SeoCity } from '@lib/seo/cities';

/**
 * Interactive Trip Cost Estimator + Budget Optimizer. Client-only —
 * every calculation runs in the browser off the same
 * DestinationGuide data that powers /destinations/{slug} pages.
 * Only cities with hand-authored guides are available (those are
 * the only ones we can price honestly).
 */

const STYLES: readonly { value: TripStyle; label: string; blurb: string; emoji: string }[] = [
  { value: 'backpack', label: 'Backpack', blurb: 'Hostels + street food', emoji: '🎒' },
  { value: 'comfortable', label: 'Comfortable', blurb: '3-4★ hotels, sit-down dinners', emoji: '🛋️' },
  { value: 'elevated', label: 'Elevated', blurb: '4★+ hotels, guided tours', emoji: '💎' },
  { value: 'luxury', label: 'Luxury', blurb: '5★ hotels, private everything', emoji: '👑' },
];

export function TripCostForm() {
  const cities = useMemo(
    () =>
      SEO_CITIES.filter((c) => hasDestinationGuide(c.slug)).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [],
  );

  const [citySlug, setCitySlug] = useState<string>(cities[0]?.slug ?? '');
  const [nights, setNights] = useState<number>(7);
  const [adults, setAdults] = useState<number>(2);
  const [kids, setKids] = useState<number>(0);
  const [style, setStyle] = useState<TripStyle>('comfortable');
  const [maxBudget, setMaxBudget] = useState<string>('');

  const maxBudgetUSD = maxBudget ? Math.max(0, Math.floor(Number(maxBudget))) : undefined;

  const estimate = useMemo(
    () =>
      estimateTripCost({
        citySlug,
        nights,
        adults,
        kids,
        style,
        ...(maxBudgetUSD ? { maxBudgetUSD } : {}),
      }),
    [citySlug, nights, adults, kids, style, maxBudgetUSD],
  );

  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-16">
      <div className="text-center">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 700,
          }}
        >
          Numiworks · trip cost estimator
        </p>
        <h1
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            color: 'var(--ink-primary)',
          }}
        >
          What will this trip actually cost?
        </h1>
        <p
          className="mx-auto mt-3 max-w-2xl"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: 'var(--ink-tertiary)',
          }}
        >
          Enter the destination, dates, group size, and comfort level. Numbers come from the same
          on-the-ground data our destination guides use — flights, hotels, food, activities, transit.
        </p>
      </div>

      <div
        className="mt-10 grid gap-8"
        style={{ gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)' }}
      >
        {/* ── Form ────────────────────────────────────────────── */}
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            borderRadius: '1rem',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-overlay)',
            padding: '1.5rem',
          }}
        >
          <Field label="Destination">
            <select
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              style={inputStyle()}
            >
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}, {c.countryName}
                </option>
              ))}
            </select>
          </Field>

          <div
            className="mt-4 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
          >
            <Field label="Nights">
              <input
                type="number"
                min={1}
                max={30}
                value={nights}
                onChange={(e) => setNights(Number(e.target.value) || 0)}
                style={inputStyle()}
              />
            </Field>
            <Field label="Adults">
              <input
                type="number"
                min={1}
                max={12}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value) || 0)}
                style={inputStyle()}
              />
            </Field>
            <Field label="Kids">
              <input
                type="number"
                min={0}
                max={10}
                value={kids}
                onChange={(e) => setKids(Number(e.target.value) || 0)}
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="Travel style" className="mt-4">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {STYLES.map((s) => {
                const active = s.value === style;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0.55rem',
                      border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      background: active ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      fontFamily: 'var(--font-inter)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 120ms ease, background 120ms ease',
                    }}
                  >
                    <span aria-hidden style={{ fontSize: '1.15rem' }}>
                      {s.emoji}
                    </span>
                    <span>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--ink-primary)',
                          display: 'block',
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--ink-tertiary)',
                        }}
                      >
                        {s.blurb}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Optional — your budget cap ($)" className="mt-4">
            <input
              type="number"
              min={0}
              placeholder="e.g., 6000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              style={inputStyle()}
            />
          </Field>
        </form>

        {/* ── Estimate ───────────────────────────────────────── */}
        <div>
          {estimate ? (
            <EstimateCard
              estimate={estimate}
              overBudget={
                maxBudgetUSD !== undefined && estimate.totalUSD > maxBudgetUSD
              }
            />
          ) : (
            <div
              style={{
                borderRadius: '1rem',
                border: '1px solid var(--border-subtle)',
                padding: '1.5rem',
                fontFamily: 'var(--font-inter)',
                color: 'var(--ink-tertiary)',
                fontSize: '0.95rem',
              }}
            >
              Pick a destination with a full guide to see an estimate.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EstimateCard({
  estimate,
  overBudget,
}: {
  estimate: NonNullable<ReturnType<typeof estimateTripCost>>;
  overBudget: boolean;
}) {
  const { city, breakdown, totalUSD, perPersonUSD, suggestions } = estimate;
  const rows: { label: string; value: number; emoji: string }[] = [
    { label: 'Flights (round-trip)', value: breakdown.flights, emoji: '✈️' },
    { label: 'Hotels', value: breakdown.hotels, emoji: '🏨' },
    { label: 'Food + drinks', value: breakdown.food, emoji: '🍽️' },
    { label: 'Activities + tours', value: breakdown.activities, emoji: '🎟️' },
    { label: 'Local transit', value: breakdown.localTransit, emoji: '🚕' },
  ];
  return (
    <div
      style={{
        borderRadius: '1rem',
        border: `1.5px solid ${overBudget ? '#f97316' : 'var(--accent-primary)'}`,
        background: 'var(--surface-overlay)',
        padding: '1.5rem',
        position: 'sticky',
        top: '1rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          fontWeight: 700,
        }}
      >
        Estimated total · {city.name}, {city.countryName}
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '2.6rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--ink-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        ${totalUSD.toLocaleString()}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.85rem',
          color: 'var(--ink-tertiary)',
          margin: '0.15rem 0 0',
        }}
      >
        ≈ ${perPersonUSD.toLocaleString()} per person
        {overBudget ? ' — over your cap' : ''}
      </p>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '1.5rem 0 0',
          display: 'grid',
          gap: '0.65rem',
        }}
      >
        {rows.map((r) => (
          <li
            key={r.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              color: 'var(--ink-secondary)',
            }}
          >
            <span aria-hidden style={{ fontSize: '1.1rem' }}>
              {r.emoji}
            </span>
            <span style={{ flex: 1 }}>{r.label}</span>
            <span
              style={{
                fontWeight: 700,
                color: 'var(--ink-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${r.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      {suggestions.length > 0 ? (
        <div className="mt-6">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Budget optimizer
          </p>
          <ul
            style={{
              listStyle: 'disc',
              margin: '0.75rem 0 0',
              padding: '0 0 0 1.15rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              color: 'var(--ink-secondary)',
            }}
          >
            {suggestions.map((s) => (
              <li key={s} style={{ marginBottom: '0.4rem' }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/destinations/${city.slug}?utm_source=cost-estimator`}
          style={ctaPrimary()}
        >
          Open {city.name} guide →
        </Link>
        <Link
          href={`/${city.slug}-${estimate.input.nights <= 3 ? '3' : estimate.input.nights <= 5 ? '5' : '7'}-day-itinerary?utm_source=cost-estimator`}
          style={ctaSecondary()}
        >
          Build an itinerary
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className} style={{ display: 'block' }}>
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.7rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          fontWeight: 700,
          margin: '0 0 0.35rem',
          display: 'block',
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
    fontFamily: 'var(--font-inter)',
    fontSize: '0.95rem',
    padding: '0.65rem 0.85rem',
    borderRadius: '0.55rem',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-base)',
    color: 'var(--ink-primary)',
    width: '100%',
    outline: 'none',
  };
}

function ctaPrimary(): React.CSSProperties {
  return {
    padding: '0.65rem 1.15rem',
    borderRadius: '999px',
    background: 'var(--accent-primary)',
    color: '#fff',
    fontFamily: 'var(--font-inter)',
    fontSize: '0.9rem',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  };
}

function ctaSecondary(): React.CSSProperties {
  return {
    padding: '0.65rem 1.15rem',
    borderRadius: '999px',
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--ink-primary)',
    fontFamily: 'var(--font-inter)',
    fontSize: '0.9rem',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  };
}
