import { ThemeToggle } from '@/lib/theme/theme-toggle';

export function Footer() {
  return (
    <footer
      className="relative w-full border-t"
      style={{
        background: 'var(--surface-base)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1.05rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'var(--ink-primary)',
            }}
          >
            stayscout
          </span>
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body-sm)',
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'var(--ink-tertiary)',
            }}
          >
            Travel concierge software.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className="rounded-full px-2 py-0.5"
            style={{
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.625rem',
              letterSpacing: '0.04em',
              color: 'var(--ink-tertiary)',
            }}
          >
            v0.1 · public preview
          </span>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--ink-tertiary)',
            }}
          >
            Affiliate disclosure: prices identical, we earn on bookings.
          </span>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
