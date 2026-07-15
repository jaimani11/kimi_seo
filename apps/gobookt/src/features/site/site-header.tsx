import Link from 'next/link';
import { ThemeToggle } from '@/lib/theme/theme-toggle';

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
      {/* Booking.com attribution strip — narrow band above the
       *  header. Reads at first glance for every visitor (and the
       *  Booking.com affiliate-program reviewer): "this site is
       *  an official Booking.com affiliate." Without this band the
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
        Official <strong style={{ fontWeight: 600 }}>Booking.com</strong> affiliate ·
        Hotels, apartments, villas &amp; unique stays worldwide · The price you pay is the same
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
          aria-label="gobookt home"
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
              <path d="M4.3 7L8 3.8 11.7 7Z" fill="#fff" />
              <rect x="4.9" y="7" width="6.2" height="6" rx="0.6" fill="#fff" />
              <rect x="6" y="8.4" width="1.5" height="1.5" fill="#006ce4" />
              <rect x="8.5" y="8.4" width="1.5" height="1.5" fill="#006ce4" />
              <rect x="6" y="10.6" width="1.5" height="1.5" fill="#006ce4" />
              <rect x="8.5" y="10.6" width="1.5" height="1.5" fill="#006ce4" />
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
            gobookt
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/stays">Stays</NavLink>
          <NavLink href="/destinations">Destinations</NavLink>
          <NavLink href="/things-to-do">Things to do</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>

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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 transition-colors hover:bg-[color:var(--surface-overlay)]"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.82rem',
        fontWeight: 500,
        color: 'var(--ink-secondary)',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}
