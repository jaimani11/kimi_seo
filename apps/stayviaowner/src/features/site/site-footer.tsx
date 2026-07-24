import Link from 'next/link';
import { NewsletterSignup } from '@adored/ui';

/**
 * Clean footer with partner-attribution disclosure. stayviaowner is a
 * Vrbo whole-home rental brand — the disclosure and nav reflect that.
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
        <NewsletterSignup compact />
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
                  background: '#37d0a1',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <g fill="#fff">
                    <circle cx="4" cy="4" r="1.4" />
                    <circle cx="8" cy="4" r="1.4" />
                    <circle cx="12" cy="4" r="1.4" />
                    <circle cx="4" cy="8" r="1.4" />
                    <circle cx="12" cy="8" r="1.4" />
                    <circle cx="4" cy="12" r="1.4" />
                    <circle cx="8" cy="12" r="1.4" />
                    <circle cx="12" cy="12" r="1.4" />
                  </g>
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
              Independent <strong style={{ fontWeight: 600, color: '#2fbb90' }}>Vrbo</strong>{' '}
              affiliate. Compare whole homes, villas, cabins and cottages across thousands of
              destinations. Affiliate links — we may earn a commission from completed bookings.
            </p>
          </div>

          <nav className="flex flex-col gap-2 md:items-end">
            <FooterLink href="/vacation-rentals">Vacation rentals</FooterLink>
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
            stayviaowner is an independent vacation-rental publisher and a Vrbo affiliate.
            Rental searches route to Vrbo through its partner programme. We earn a commission
            on completed bookings; the price you pay is unchanged.
          </p>
          <p>© {new Date().getUTCFullYear()} stayviaowner. Vrbo is a trademark of Expedia Group, Inc.</p>
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
