/**
 * Assurance band — the strip that tells a first-time visitor what numiworks
 * is: an experiences-first trip planner that hands off to Viator (and to Vrbo
 * for whole-home stays).
 *
 * Deliberately NON-NUMERIC. It carries no catalog-size / country / rating /
 * support figures, because every such commercial claim would need a current,
 * authoritative Viator source, an accurate scope, and wording permitted for
 * affiliate use — none of which we maintain. (The old band carried a
 * fabricated "4.6*" and unsourced "190+" / "24/7"; all gone.) Durable,
 * verifiable statements only.
 */

const ASSURANCES = [
  {
    title: 'Experiences, first',
    body: 'Tours, tickets, activities and day trips — bookable in seconds.',
  },
  {
    title: 'Plan, then book',
    body: 'Describe your trip and let AI shape the days before you commit.',
  },
  {
    title: 'Booking handled by the provider',
    body: 'Availability, pricing and cancellation terms are shown by Viator.',
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
