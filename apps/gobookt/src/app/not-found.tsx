import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
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
          404
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
        <Link
          href="/"
          className="inline-block underline"
          style={{
            fontFamily: 'var(--font-inter)',
            color: 'var(--accent-primary)',
          }}
        >
          Back to the workspace
        </Link>
      </div>
    </main>
  );
}
