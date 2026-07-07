'use client';

import { ThemeToggle } from '@/lib/theme/theme-toggle';
import { SavedHeaderButton } from '@/features/workspace/saved-trips/saved-header-button';

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 backdrop-blur-[8px]">
      <div className="flex items-center gap-3">
        <span
          className="text-[color:var(--ink-primary)]"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.05rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          stayscout
        </span>
        <span
          className="hidden rounded-full border border-[color:var(--border-subtle)] px-2 py-0.5 text-[color:var(--ink-tertiary)] sm:inline-block"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.625rem',
            letterSpacing: '0.04em',
          }}
        >
          v0.1 · public preview
        </span>
      </div>
      <div className="flex items-center gap-2">
        <SavedHeaderButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
