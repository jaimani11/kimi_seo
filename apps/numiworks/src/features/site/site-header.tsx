import Link from 'next/link';
import { ThemeToggle } from '@/lib/theme/theme-toggle';
import { MegaNav } from '@/features/site/mega-nav';

/**
 * Sticky site header — token-driven so it picks up the active theme
 * (bright glass on the light marketplace palette, dark glass on the
 * cinematic dark palette).
 *
 * Logo · primary nav (Search · Destinations · Plan a trip · Concierge)
 * · theme toggle.
 */
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-30 w-full"
      style={{
        background: 'var(--surface-base)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 3px rgba(12, 20, 38, 0.04)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5 md:py-4">
        <Link
          href="/"
          aria-label="numiworks home"
          className="inline-flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <span
            aria-hidden
            className="grid place-items-center"
            style={{
              width: '1.85rem',
              height: '1.85rem',
              borderRadius: '0.55rem',
              background: 'linear-gradient(135deg, var(--brand-hero-from) 0%, var(--brand-hero-to) 100%)',
              boxShadow: '0 2px 8px rgba(216, 67, 21, 0.32)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5c.5 3.7 1.8 5 5.5 5.5-3.7.5-5 1.8-5.5 5.5-.5-3.7-1.8-5-5.5-5.5 3.7-.5 5-1.8 5.5-5.5Z"
                fill="#fff"
              />
            </svg>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.2rem',
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: 'var(--ink-primary)',
            }}
          >
            numiworks
          </span>
        </Link>

        <MegaNav />

        <div className="flex items-center gap-2">
          <Link
            href="/plan"
            className="hidden items-center gap-1.5 rounded-full px-4 py-2 transition-all hover:brightness-110 md:inline-flex"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: 'var(--accent-secondary)',
              color: '#ffffff',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(12, 20, 38, 0.12)',
            }}
          >
            Plan now
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
