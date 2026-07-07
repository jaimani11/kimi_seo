'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Sparkle } from '@/features/shared/icons';

/**
 * Cinematic search hero - photo background, editorial copy, one
 * prominent text input + Go button. Replaces the AI chat input that
 * lived here before.
 *
 * Submits to /search?q=<term> via Next router push so the visitor
 * lands on the SSR'd results page with their query baked into the URL
 * (shareable, refresh-stable).
 */
export function SearchHero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section
      className="relative w-full"
      style={{ minHeight: '78vh', background: 'var(--surface-base)' }}
    >
      {/* Background photo - a cinematic Cappadocia balloon shot
       *  (a real Viator product feel). Reasonably durable Unsplash
       *  id; falls back to gradient on error. */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=2400&q=80&fit=crop&auto=format"
          alt="Hot air balloons over Cappadocia at sunrise"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,10,14,0.32) 0%, rgba(8,10,14,0.55) 60%, rgba(8,10,14,0.92) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center px-6 pt-28 pb-20 text-center md:pt-36 md:pb-24">
        <p
          className="mb-5"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(237,230,219,0.78)',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          Discover · Reserve · Travel
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(2.8rem, 6vw, 4.8rem)',
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            color: '#EDE6DB',
            textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            margin: 0,
            maxWidth: '48rem',
          }}
        >
          The hours of your trip
          <br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>worth booking.</em>
        </h1>

        <p
          className="mt-5"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'rgba(237,230,219,0.92)',
            textShadow: '0 1px 4px rgba(0,0,0,0.55)',
            margin: 0,
            maxWidth: '36rem',
          }}
        >
          Curated tours, tastings, and small-group experiences in every city we cover. Search a
          place. Pick the morning that fits. Reserve with one tap.
        </p>

        {/* Search input - a single editorial pill. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-10 w-full max-w-2xl"
        >
          <div
            className="flex items-center gap-3 px-5 py-3.5"
            style={{
              borderRadius: '999px',
              background: 'rgba(12, 12, 14, 0.88)',
              border: `1px solid ${
                focused ? 'var(--accent-primary)' : 'rgba(237,230,219,0.55)'
              }`,
              backdropFilter: 'blur(14px)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
              transition: 'border-color 180ms ease',
            }}
          >
            <Sparkle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Try Tokyo, sunrise balloon, food tour..."
              aria-label="Search experiences"
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                color: '#EDE6DB',
                letterSpacing: '0.005em',
              }}
            />
            <button
              type="submit"
              disabled={!query.trim()}
              aria-label="Search"
              className="transition-transform hover:translate-x-0.5"
              style={{
                flexShrink: 0,
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '999px',
                border: 'none',
                background: query.trim() ? 'var(--accent-primary)' : 'rgba(237,230,219,0.18)',
                color: query.trim() ? '#1a1a1a' : 'rgba(237,230,219,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: query.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <ArrowRight size={15} strokeWidth={2.2} />
            </button>
          </div>

          {/* Suggested searches */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(237,230,219,0.6)',
                marginRight: '0.4rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              Try
            </span>
            {SUGGESTED.map((q) => (
              <SuggestedChip
                key={q}
                term={q}
                onPick={(t) => {
                  setQuery(t);
                  router.push(`/search?q=${encodeURIComponent(t)}`);
                }}
              />
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}

const SUGGESTED = [
  'Cappadocia balloon',
  'Tokyo food tour',
  'Paris cooking class',
  'Iceland Northern Lights',
] as const;

function SuggestedChip({ term, onPick }: { term: string; onPick: (t: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(term)}
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.72rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '999px',
        background: 'rgba(12, 12, 14, 0.78)',
        border: '1px solid rgba(237,230,219,0.4)',
        color: '#EDE6DB',
        cursor: 'pointer',
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {term}
    </button>
  );
}
