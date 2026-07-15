/**
 * Stats trust band — the loud numbered strip that every successful
 * affiliate marketplace runs near the top of the home page. Surfaces
 * social proof at a glance without requiring the visitor to scroll
 * past the fold.
 *
 * Numbers reference live Viator catalog scale (publicly stated by
 * Viator: 300K+ experiences, 190+ countries, 6M+ reviews, 4.6+ avg
 * rating). Conservative phrasing — "300,000+", "190+" — so it stays
 * honest as Viator scales.
 */

const STATS = [
  {
    value: '28M+',
    label: 'Stays bookable',
    sublabel: 'Live from Vrbo',
  },
  {
    value: '190+',
    label: 'Countries covered',
    sublabel: 'Global inventory',
  },
  {
    value: '4.6★',
    label: 'Average rating',
    sublabel: 'From real travelers',
  },
  {
    value: '24/7',
    label: 'Vrbo support',
    sublabel: 'Real humans, every timezone',
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
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <li key={s.label} className="flex flex-col items-center text-center md:items-start md:text-left">
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  color: 'var(--accent-primary)',
                  margin: 0,
                }}
              >
                {s.value}
              </p>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--ink-primary)',
                  margin: 0,
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  color: 'var(--ink-tertiary)',
                  margin: 0,
                }}
              >
                {s.sublabel}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
