'use client';

import { useMemo, useState } from 'react';
import {
  TRAVELER_PROFILES,
  recommendForProfile,
  type ProfileId,
  type ScoredNeighborhood,
} from '@lib/seo/where-to-stay-fit';

/**
 * Interactive "which area fits me" layer over a city's editor-ranked
 * neighborhoods. Progressive enhancement: with no profile selected it renders
 * the exact editor ranking (server-rendered, crawlable). Pick a trip type and
 * the list re-ranks by fit, with an explainable recommendation + a targeted
 * stay-search CTA for the winning neighborhood.
 *
 * All scoring is client-side and deterministic (see `where-to-stay-fit.ts`) —
 * no network, no per-city content. The CTA routes through the same internal
 * `/vacation-rentals` go-link the rest of the site uses (money-path safe).
 */

interface Props {
  neighborhoods: readonly { name: string; blurb: string }[];
  /** Pre-computed walk/drive distance label per neighborhood name (optional). */
  distanceByName?: Record<string, string>;
  cityName: string;
  /** Internal go-link path for the stay search, e.g. "/vacation-rentals". */
  staySearchPath: string;
}

/** Per-profile phrasing for the tailored search CTA. */
const CTA_HINT: Record<ProfileId, string> = {
  'first-time': 'central stays in',
  couples: 'romantic stays in',
  families: 'family-friendly stays in',
  budget: 'good-value stays in',
  nightlife: 'stays near the bars in',
  quiet: 'quiet stays in',
};

const card = {
  padding: '1.1rem 1.25rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-elevated)',
} as const;

const label = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.7rem',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--accent-primary)',
} as const;

export function WhereToStayDecider({
  neighborhoods,
  distanceByName = {},
  cityName,
  staySearchPath,
}: Props) {
  const [active, setActive] = useState<ProfileId | null>(null);

  const rec = useMemo(
    () => (active ? recommendForProfile(neighborhoods, active) : null),
    [active, neighborhoods],
  );

  // No profile → editors' order (unchanged, SEO baseline). Profile → fit order.
  const ordered: ScoredNeighborhood[] = useMemo(
    () =>
      rec
        ? rec.ranked
        : neighborhoods.map((n, i) => ({
            name: n.name,
            blurb: n.blurb,
            editorRank: i,
            score: 0,
            matched: [],
          })),
    [rec, neighborhoods],
  );

  const stayHref = (name: string) =>
    `${staySearchPath}?ss=${encodeURIComponent(`${name}, ${cityName}`)}`;

  return (
    <section aria-label={`Find the right area of ${cityName} for your trip`}>
      {/* ── Decision prompt + profile chips ─────────────────────────── */}
      <div style={{ ...card, margin: '2rem 0 0' }}>
        <p style={{ ...label, margin: 0 }}>Decide by trip type</p>
        <h2
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--ink-primary)',
            margin: '0.3rem 0 0.2rem',
          }}
        >
          Not sure which area? Tell us about your trip.
        </h2>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--ink-secondary)', margin: '0 0 0.9rem' }}>
          We’ll match {cityName}’s neighborhoods to how you travel — and show you why.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Traveler type">
          {TRAVELER_PROFILES.map((p) => {
            const on = active === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => setActive(on ? null : p.id)}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '999px',
                  border: on ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: on ? 'var(--accent-primary)' : 'transparent',
                  color: on ? 'var(--accent-on-primary, #fff)' : 'var(--ink-primary)',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recommendation banner (only when a profile is active) ────── */}
      {rec && rec.top ? (
        <div
          style={{
            ...card,
            margin: '1rem 0 0',
            borderColor: 'var(--accent-primary)',
            borderWidth: '1.5px',
          }}
        >
          <p style={{ ...label, margin: 0 }}>
            {rec.confident ? `Best for ${rec.profile.label.toLowerCase()}` : 'Our overall top pick'}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--ink-primary)',
              margin: '0.2rem 0 0.4rem',
            }}
          >
            Stay in {rec.top.name}
          </p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.92rem', color: 'var(--ink-secondary)', margin: 0 }}>
            {rec.top.blurb}
          </p>
          {rec.confident && rec.top.matched.length > 0 ? (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: '0.6rem 0 0' }}>
              <strong style={{ color: 'var(--ink-primary)' }}>Why:</strong>{' '}
              matches {rec.profile.intent} — {uniqueMatched(rec.top.matched).slice(0, 4).join(', ')}.
            </p>
          ) : (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: '0.6rem 0 0' }}>
              None of the areas signalled strongly for this trip type, so this is the editors’ all-round pick.
            </p>
          )}
          <div style={{ margin: '0.9rem 0 0' }}>
            <a
              href={stayHref(rec.top.name)}
              rel="sponsored nofollow noopener noreferrer"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 700,
                padding: '0.6rem 1.1rem',
                borderRadius: '0.7rem',
                background: 'var(--accent-primary)',
                color: 'var(--accent-on-primary, #fff)',
                textDecoration: 'none',
              }}
            >
              Search {CTA_HINT[rec.profile.id]} {rec.top.name} →
            </a>
          </div>
        </div>
      ) : null}

      {/* ── Neighborhood list (re-ranked when a profile is active) ───── */}
      <div style={{ margin: '1rem 0 0', display: 'grid', gap: '1rem' }}>
        {ordered.map((n, i) => {
          const dist = distanceByName[n.name];
          const isTop = i === 0;
          const badge = rec
            ? isTop
              ? rec.confident
                ? 'Best fit'
                : 'Top pick'
              : `#${i + 1}`
            : isTop
              ? 'Top pick'
              : `#${i + 1}`;
          return (
            <div
              key={n.name}
              style={{
                ...card,
                borderColor: rec && isTop ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem' }}>
                <p style={{ ...label, margin: 0, color: rec && isTop ? 'var(--accent-primary)' : 'var(--ink-secondary)' }}>
                  {badge}
                </p>
                {rec && n.matched.length > 0 ? (
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>
                    {n.matched.length} match{n.matched.length === 1 ? '' : 'es'}
                  </p>
                ) : null}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--ink-primary)',
                  margin: '0.25rem 0 0.4rem',
                }}
              >
                {n.name}
              </h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.92rem', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.55 }}>
                {n.blurb}
              </p>
              {rec && n.matched.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.6rem 0 0' }}>
                  {uniqueMatched(n.matched).slice(0, 5).map((m) => (
                    <span
                      key={m}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : null}
              {dist ? (
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: '0.55rem 0 0' }}>
                  {dist}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Dedupe matched signals while preserving profile order (for "why" copy). */
function uniqueMatched(matched: readonly string[]): string[] {
  return [...new Set(matched)];
}
