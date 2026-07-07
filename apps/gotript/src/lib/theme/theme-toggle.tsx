'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-secondary)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[color:var(--surface-overlay)] hover:text-[color:var(--ink-primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary-glow)] focus-visible:outline-none"
    >
      <Icon className="h-4 w-4" strokeWidth={1.6} />
    </button>
  );
}
