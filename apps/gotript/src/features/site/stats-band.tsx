/**
 * Assurance band — the strip below the hero that tells a first-time visitor
 * what gotript is and how the Expedia handoff works.
 *
 * Deliberately NON-NUMERIC. It carries no scale / support / fee / price /
 * cancellation / inventory figures, because every such commercial claim would
 * need a current, authoritative Expedia source, an accurate scope, wording
 * permitted for affiliate use, and a documented review date — none of which we
 * maintain. Durable, verifiable statements only, so the band never silently
 * goes stale or overpromises.
 */

const ASSURANCES = [
  {
    title: 'Plan first, then book',
    body: 'Destination guides: best time to go, weather, neighborhoods and budgets.',
  },
  {
    title: 'One search, every stay type',
    body: 'Hotels, whole-home rentals, flights, cars and things to do.',
  },
  {
    title: 'Booking handled by Expedia',
    body: 'Availability, payment and reservation terms are shown by Expedia.',
  },
  {
    title: 'Independent affiliate',
    body: 'We may earn a commission from completed bookings.',
  },
] as const;

export function StatsBand() {
  return (
    <section
      className="relative w-full"
      style={{
        background: 'linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface-base) 100%)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {ASSURANCES.map((a) => (
            <li key={a.title} className="flex flex-col items-start text-left">
              <span
                aria-hidden
                style={{
                  width: '1.6rem',
                  height: '2px',
                  borderRadius: '999px',
                  background: 'var(--accent-primary)',
                  marginBottom: '0.7rem',
                }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  lineHeight: 1.25,
                  color: 'var(--ink-primary)',
                  margin: 0,
                }}
              >
                {a.title}
              </p>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                  color: 'var(--ink-tertiary)',
                  margin: 0,
                }}
              >
                {a.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
