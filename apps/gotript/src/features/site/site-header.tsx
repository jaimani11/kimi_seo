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
    <>
      {/* Expedia attribution strip — narrow band above the
       *  header. Reads at first glance for every visitor (and the
       *  Expedia affiliate-program reviewer): "this site is
       *  an official Expedia affiliate." Without this band the
       *  affiliate application gets rejected for being too brand-
       *  ambiguous, which is what happened with the prior submission. */}
      <div
        className="w-full"
        style={{
          background: '#003580',
          color: '#ffffff',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          letterSpacing: '0.06em',
          textAlign: 'center',
          padding: '0.4rem 0.75rem',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '999px',
            background: '#FEBB02',
            boxShadow: '0 0 6px rgba(254,187,2,0.6)',
            marginRight: '0.5rem',
            verticalAlign: 'middle',
          }}
        />
        Official <strong style={{ fontWeight: 600 }}>Expedia</strong> affiliate ·
        Vacation rentals, hotels, flights, cars &amp; things to do · The price you pay is the same
      </div>
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
          aria-label="gotript home"
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
              background: 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)',
              boxShadow: '0 2px 8px rgba(0, 108, 228, 0.32)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 4l5 4 5-4M3 12l5-4 5 4"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
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
            gotript
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
    </>
  );
}
