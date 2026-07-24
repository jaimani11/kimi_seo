/**
 * "How it works" 3-step section — the trust/onboarding strip that
 * every affiliate marketplace runs once below the destination grid.
 * Aimed at first-time visitors who need to understand the affiliate
 * relationship before they engage.
 */

const STEPS = [
  {
    number: '01',
    title: 'Map your trip',
    body: 'Start with a destination guide — when to go, how many days, which neighborhood — and build a day-by-day itinerary.',
  },
  {
    number: '02',
    title: 'Choose your base',
    body: 'Compare hotels and whole homes for your dates, weigh location against your itinerary, and shortlist where to stay.',
  },
  {
    number: '03',
    title: 'Book on Expedia',
    body: 'One tap hands you off to Expedia. Same price as booking direct, and free cancellation on most stays.',
  },
] as const;

export function HowGotriptWorks() {
  return (
    <section
      className="relative w-full"
      style={{
        background: 'var(--surface-base)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <header className="mb-10 max-w-xl">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              margin: 0,
            }}
          >
            How gotript works
          </p>
          <h2
            className="mt-2"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(1.85rem, 3.6vw, 2.8rem)',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            Plan first,{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              book when you&rsquo;re ready.
            </em>
          </h2>
        </header>

        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.number}
              className="flex flex-col gap-3 rounded-2xl border p-6"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--elev-card)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.18em',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {s.number}
              </p>
              <h3
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: '1.35rem',
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: 'var(--ink-primary)',
                  margin: 0,
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontWeight: 300,
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--ink-secondary)',
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        <p
          className="mt-10 text-center"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'var(--ink-tertiary)',
            margin: 0,
          }}
        >
          Affiliate links to Expedia. Prices are identical to booking direct. Commission keeps the site free.
        </p>
      </div>
    </section>
  );
}
