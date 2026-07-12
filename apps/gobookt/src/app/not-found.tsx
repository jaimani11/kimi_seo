import Link from 'next/link';

/**
 * Root 404. Next.js serves this through a minimal fallback document
 * (no root-layout wrapper) for unmatched routes and `notFound()` calls
 * from the `[slug]` catch-all, so it must paint its OWN background —
 * the layout's `--surface-base` wrapper isn't present here.
 */
export default function NotFound() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: 'var(--surface-base)' }}
    >
      <div className="max-w-md text-center">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          404 — Page not found
        </p>
        <h1
          className="mt-3 mb-4"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-md)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
          }}
        >
          Off the trail.
        </h1>
        <p
          className="mb-8"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--ink-secondary)',
          }}
        >
          This page moved or never existed. Let&rsquo;s get you back on route.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-block rounded-full px-5 py-2.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#ffffff',
              backgroundColor: 'var(--accent-primary)',
              textDecoration: 'none',
            }}
          >
            Back to home
          </Link>
          <Link
            href="/destinations"
            className="inline-block rounded-full px-5 py-2.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--ink-primary)',
              border: '1px solid var(--border-subtle)',
              textDecoration: 'none',
            }}
          >
            Browse destinations
          </Link>
        </div>
      </div>
    </main>
  );
}
