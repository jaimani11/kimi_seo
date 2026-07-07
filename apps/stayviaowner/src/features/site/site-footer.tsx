import Link from 'next/link';

/**
 * Clean footer with partner-attribution disclosure. Replaces the
 * old marketing footer which referenced multiple partners.
 */
export function SiteFooter() {
  return (
    <footer
      className="w-full"
      style={{
        background: 'var(--surface-base)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: 'var(--ink-primary)',
                textDecoration: 'none',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: '1.65rem',
                  height: '1.65rem',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)',
                  boxShadow: '0 2px 6px rgba(0, 108, 228, 0.28)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 4l5 4 5-4M3 12l5-4 5 4"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              stayviaowner
            </Link>
            <p
              className="mt-3 max-w-md"
              style={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 400,
                fontSize: '0.9rem',
                lineHeight: 1.55,
                color: 'var(--ink-secondary)',
              }}
            >
              Official <strong style={{ fontWeight: 600, color: '#003580' }}>Expedia</strong>{' '}
              affiliate. Search hotels, flights, things to do, car rentals, and cruises across
              175+ destinations. Affiliate links; the price you pay is the same.
            </p>
          </div>

          <nav className="flex flex-col gap-2 md:items-end">
            <FooterLink href="/stays">Stays</FooterLink>
            <FooterLink href="/flights">Flights</FooterLink>
            <FooterLink href="/packages">Packages</FooterLink>
            <FooterLink href="/things-to-do">Things to do</FooterLink>
            <FooterLink href="/cars">Car rentals</FooterLink>
            <FooterLink href="/cruises">Cruises</FooterLink>
            <FooterLink href="/destinations">Destinations</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/profile/memory">Your memory</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </nav>
        </div>

        <div
          className="flex flex-col gap-2 border-t pt-6"
          style={{
            borderColor: 'var(--border-subtle)',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.68rem',
            lineHeight: 1.55,
            color: 'var(--ink-tertiary)',
          }}
        >
          <p>
            stayviaowner is an independent travel publisher and an official Expedia affiliate.
            All searches route through Expedia under their Partner Programme. We earn a
            commission on completed bookings; the price you pay is unchanged.
          </p>
          <p>© {new Date().getUTCFullYear()} stayviaowner. Expedia is a trademark of Expedia B.V.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.72rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-secondary)',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}
