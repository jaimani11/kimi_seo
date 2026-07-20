'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkle } from '@/features/shared/icons';
import { track } from '@/lib/analytics/client';

/** Inline SMIL spinner — self-contained, inherits button text color. */
function Spinner({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

const POPULAR_DESTINATIONS = [
  'Rome, Italy',
  'Tokyo, Japan',
  'Paris, France',
  'Bali, Indonesia',
  'Reykjavík, Iceland',
  'Lisbon, Portugal',
  'Cappadocia, Türkiye',
  'New York, USA',
] as const;

const VIBE_TAGS = [
  'foodie',
  'culture',
  'adventure',
  'romantic',
  'family',
  'luxury',
  'walkable',
] as const;

export function PlanForm({
  initialDestination = '',
  initialNights = 4,
  initialVibe = [] as readonly string[],
}: {
  initialDestination?: string;
  initialNights?: number;
  initialVibe?: readonly string[];
}) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [nights, setNights] = useState(initialNights);
  const [vibe, setVibe] = useState<Set<string>>(new Set(initialVibe));
  // Keeps `isPending` true for the whole server round-trip — including the
  // multi-second AI itinerary build — so the button gives immediate feedback
  // instead of looking like the click did nothing.
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = destination.trim();
    if (!trimmed || isPending) return;
    const params = new URLSearchParams();
    params.set('d', trimmed);
    params.set('n', String(Math.max(1, Math.min(7, nights))));
    if (vibe.size > 0) params.set('v', Array.from(vibe).join(','));
    track('plan_submit', {
      destination: trimmed,
      nights,
      vibe: Array.from(vibe).join(','),
    });
    startTransition(() => {
      // Default scroll-to-top on navigation lands on the header + itinerary
      // (results render above the form once a plan exists).
      router.push(`/plan?${params.toString()}`);
    });
  };

  const toggleVibe = (tag: string) => {
    setVibe((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-3xl rounded-2xl border p-6 md:p-8"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
            marginBottom: '0.4rem',
          }}
        >
          Destination
        </legend>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Rome, Tokyo, Cappadocia…"
          list="popular-destinations"
          aria-label="Destination"
          className="rounded-xl border px-4 py-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.98rem',
            color: 'var(--ink-primary)',
            background: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            outline: 'none',
          }}
        />
        <datalist id="popular-destinations">
          {POPULAR_DESTINATIONS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </fieldset>

      <fieldset className="mt-5 flex flex-col gap-2 border-0 p-0">
        <legend
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
            marginBottom: '0.4rem',
          }}
        >
          How many days
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {[2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNights(n)}
              aria-pressed={nights === n}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '999px',
                background:
                  nights === n ? 'var(--accent-primary)' : 'var(--surface-base)',
                color: nights === n ? '#1a1a1a' : 'var(--ink-primary)',
                border: `1px solid ${
                  nights === n ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }`,
                fontWeight: nights === n ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 flex flex-col gap-2 border-0 p-0">
        <legend
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
            marginBottom: '0.4rem',
          }}
        >
          Vibe — pick any that fit
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {VIBE_TAGS.map((t) => {
            const on = vibe.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleVibe(t)}
                aria-pressed={on}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '999px',
                  background: on ? 'var(--accent-primary)' : 'var(--surface-base)',
                  color: on ? '#1a1a1a' : 'var(--ink-secondary)',
                  border: `1px solid ${on ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  fontWeight: on ? 600 : 400,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!destination.trim() || isPending}
        aria-busy={isPending}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 transition-all hover:translate-y-[-1px]"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.95rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontWeight: 500,
          background: destination.trim()
            ? 'var(--accent-primary)'
            : 'rgba(237,230,219,0.16)',
          color: destination.trim() ? '#1a1a1a' : 'var(--ink-tertiary)',
          border: 'none',
          cursor: !destination.trim() || isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.9 : 1,
        }}
      >
        {isPending ? (
          <>
            <Spinner size={15} />
            Building your itinerary…
          </>
        ) : (
          <>
            <Sparkle size={14} />
            Plan my trip
            <ArrowRight size={14} strokeWidth={2.4} />
          </>
        )}
      </button>
    </form>
  );
}
