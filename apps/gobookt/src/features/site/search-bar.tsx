'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkle } from '@/features/shared/icons';
import { track } from '@/lib/analytics/client';

/**
 * Compact search bar used at the top of /search. Lets the visitor
 * refine without going back to the homepage.
 */
export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    track('search_submit', { query: trimmed, length: trimmed.length });
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mx-auto w-full max-w-3xl"
    >
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{
          borderRadius: '999px',
          background: 'var(--surface-elevated)',
          border: `1px solid ${
            focused ? 'var(--accent-primary)' : 'var(--border-subtle)'
          }`,
          boxShadow: 'var(--elev-card)',
          transition: 'border-color 180ms ease',
        }}
      >
        <Sparkle size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search experiences..."
          aria-label="Search experiences"
          className="flex-1 bg-transparent outline-none"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.94rem',
            color: 'var(--ink-primary)',
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
            width: '2.2rem',
            height: '2.2rem',
            borderRadius: '999px',
            border: 'none',
            background: query.trim() ? 'var(--accent-primary)' : 'rgba(237,230,219,0.16)',
            color: query.trim() ? '#1a1a1a' : 'var(--ink-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: query.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <ArrowRight size={14} strokeWidth={2.2} />
        </button>
      </div>
    </form>
  );
}
