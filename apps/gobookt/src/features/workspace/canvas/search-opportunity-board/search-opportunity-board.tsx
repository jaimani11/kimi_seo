'use client';

import type { SearchOpportunity } from '@core/search-opportunity';
import { useWorkspaceStore } from '../../store/workspace-store';
import { SearchOpportunityCard } from './search-opportunity-card';
import { ThingsToDoRail } from './things-to-do-rail';

/**
 * Slice F1 - SearchOpportunityBoard.
 *
 * Renders when the orchestrator decided not to build a proposal because
 * neither a real provider nor curated inventory can serve the
 * destination. Three goals:
 *
 *   1. Honesty - show the user that we're routing them to the partner
 *      for live availability, never invent a hotel.
 *   2. Continuity - keep the same intent digest visible so the user
 *      can refine ("make it 6 people") and see the URLs update.
 *   3. Monetization - every CTA routes through `/r/[id]` for click
 *      attribution + affcid attachment (E2 plumbing).
 *
 * Structure:
 *   Hero band  - destination name, optional flavor line, intent digest
 *                chip, destination photo background
 *   Cards row  - Expedia / Vrbo / Hotels.com tiles (in builder order)
 *   Footnote   - "We pull real availability from these partners. Your
 *                click earns commission and is logged at /admin/clicks."
 *                (subtle, present-tense, honest)
 */

interface Props {
  opportunity: SearchOpportunity;
}

export function SearchOpportunityBoard({ opportunity }: Props) {
  const turnId = useWorkspaceStore((s) => s.currentTurnId);

  return (
    // overflow-y-auto + min-h-0 lets the board scroll inside the
    // fixed-height canvas pane. Without overflow-y-auto, content
    // past the viewport (the live Things-to-do rail, footer copy)
    // is silently clipped because the parent grid pane is height-
    // capped by the workspace 38/62 layout.
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-6 py-6">
      <HeroBand opportunity={opportunity} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {opportunity.providers.map((p) => (
          <SearchOpportunityCard
            key={p.providerId}
            provider={p}
            destinationName={opportunity.destination.name}
            {...(turnId ? { turnId } : {})}
          />
        ))}
      </div>

      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.7rem',
          lineHeight: 1.5,
          color: 'var(--ink-tertiary)',
          marginTop: '0.4rem',
          maxWidth: '46rem',
        }}
      >
        Each card sends you straight to bookable Viator experiences in{' '}
        {opportunity.destination.name}. Affiliate links · prices may change.
      </p>

      <ThingsToDoRail
        destination={opportunity.destination.name}
        vibeTags={opportunity.intentDigest.vibeTags}
      />
    </div>
  );
}

function HeroBand({ opportunity }: { opportunity: SearchOpportunity }) {
  const digest = describeDigest(opportunity);
  // Hero is gradient-only for now. Unsplash photo IDs keep getting
  // repurposed (we've lost three this slice alone: a Tuscan castle
  // turned into a burger, a Tuscany ID started serving London, and
  // two consecutive Lisbon IDs went dark). Until we self-host or
  // adopt a stable image source, the hero relies on a deterministic
  // destination-themed gradient + bold typography - which never
  // breaks and reads as intentional editorial chrome.
  const gradient = destinationGradient(opportunity.destination.name);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        borderRadius: '1.1rem',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
        minHeight: '15rem',
        background: `linear-gradient(140deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
      }}
    >
      {/* Subtle vignette so the editorial copy stays legible at the
       *  top + bottom of the hero. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      <div className="relative flex h-full flex-col justify-between gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.55rem',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(237,230,219,0.5)',
              color: '#EDE6DB',
              borderRadius: '0.2rem',
              backdropFilter: 'blur(4px)',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {digest}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 2.6rem)',
              lineHeight: 1.1,
              color: '#EDE6DB',
              textShadow: '0 2px 6px rgba(0,0,0,0.55)',
              margin: 0,
              fontWeight: 500,
            }}
          >
            {opportunity.destination.name}
          </h2>
          {opportunity.flavor && (
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-md)',
                lineHeight: 1.45,
                color: '#EDE6DB',
                textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                margin: 0,
                maxWidth: '36rem',
              }}
            >
              {opportunity.flavor}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** "2 adults · Sep 1–5 · luxury, walkable" - compact summary for the chip. */
function describeDigest(o: SearchOpportunity): string {
  const { intentDigest } = o;
  const partyParts: string[] = [];
  partyParts.push(`${intentDigest.adults} ${intentDigest.adults === 1 ? 'adult' : 'adults'}`);
  if (intentDigest.children > 0) {
    partyParts.push(
      `${intentDigest.children} ${intentDigest.children === 1 ? 'child' : 'children'}`,
    );
  }
  const party = partyParts.join(' · ');

  const dates = formatDateRange(intentDigest.checkIn, intentDigest.checkOut);

  const vibe = intentDigest.vibeTags.slice(0, 3).join(', ');

  return [party, dates, vibe].filter(Boolean).join(' · ');
}

/**
 * Pick a fallback gradient when the hero photo fails to load. The
 * gradient is derived deterministically from the destination name so
 * the same destination always falls back to the same colours - never
 * a random splash.
 */
function destinationGradient(name: string): [string, string] {
  const palettes: Array<[string, string]> = [
    ['#1a2a4a', '#5a3a7a'], // dusk
    ['#0a4f7a', '#3aafbf'], // ocean
    ['#3a1a1a', '#8b2c2c'], // ember
    ['#1a3a2a', '#3a7a5a'], // forest
    ['#3a2a1a', '#aa7a4a'], // terracotta
    ['#2a2a4a', '#7a5a3a'], // antique
  ];
  // FNV-1a 32-bit hash of the destination name so a given destination
  // always picks the same palette.
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return palettes[h % palettes.length]!;
}

function formatDateRange(checkIn: string, checkOut: string): string {
  // ISO YYYY-MM-DD → "Sep 1–5". Same year assumed.
  try {
    const start = new Date(checkIn + 'T00:00:00Z');
    const end = new Date(checkOut + 'T00:00:00Z');
    const monthIn = start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const monthOut = end.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const dayIn = start.getUTCDate();
    const dayOut = end.getUTCDate();
    if (monthIn === monthOut) {
      return `${monthIn} ${dayIn}–${dayOut}`;
    }
    return `${monthIn} ${dayIn} – ${monthOut} ${dayOut}`;
  } catch {
    return `${checkIn} – ${checkOut}`;
  }
}
