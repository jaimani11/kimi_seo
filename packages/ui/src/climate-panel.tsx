/**
 * 12-month climate strip for destination guides — server-rendered
 * pure HTML/CSS so the temperatures and rain pattern are crawlable
 * text, not a canvas. Enriches the "Best Time to Visit" section the
 * page already ranks for.
 *
 * Structurally typed against @adored/seo-data's CityClimate.months
 * without importing it — ui stays decoupled from the data package.
 */

export type ClimateMonths = ReadonlyArray<readonly [number, number, number, number]>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const cToF = (c: number) => Math.round((c * 9) / 5 + 32);

export function ClimatePanel({
  cityName,
  months,
}: {
  cityName: string;
  /** Jan→Dec: [avgHighC, avgLowC, rainDays, precipMm]. */
  months: ClimateMonths;
}) {
  if (months.length !== 12) return null;

  const stats = months.map((m, i) => ({ i, hi: m[0], lo: m[1], rain: m[2] }));
  const warmest = stats.reduce((a, b) => (b.hi > a.hi ? b : a));
  const coolest = stats.reduce((a, b) => (b.hi < a.hi ? b : a));
  const wettest = stats.reduce((a, b) => (b.rain > a.rain ? b : a));
  const maxRainDays = Math.max(1, wettest.rain);

  return (
    <div style={{ margin: '1.1rem 0 0' }}>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.92rem',
          lineHeight: 1.6,
          color: 'var(--ink-secondary)',
          margin: '0 0 0.9rem',
        }}
      >
        Warmest in {cityName}: <strong style={{ color: 'var(--ink-primary)' }}>
          {MONTHS[warmest.i]} ({warmest.hi}°C / {cToF(warmest.hi)}°F)
        </strong>
        {' · '}Coolest: <strong style={{ color: 'var(--ink-primary)' }}>
          {MONTHS[coolest.i]} ({coolest.hi}°C / {cToF(coolest.hi)}°F)
        </strong>
        {' · '}Wettest: <strong style={{ color: 'var(--ink-primary)' }}>
          {MONTHS[wettest.i]} (~{wettest.rain} rain days)
        </strong>
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: '0.3rem',
          padding: '0.9rem 0.75rem 0.7rem',
          borderRadius: '0.85rem',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {months.map((m, i) => (
          <div key={MONTHS[i]} style={{ textAlign: 'center', minWidth: 0 }}>
            <div
              title={`${MONTHS[i]}: high ${m[0]}°C/${cToF(m[0])}°F, low ${m[1]}°C/${cToF(m[1])}°F, ~${m[2]} rain days`}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: i === warmest.i || i === coolest.i ? 'var(--accent-primary)' : 'var(--ink-primary)',
                lineHeight: 1.2,
              }}
            >
              {m[0]}°
            </div>
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.66rem',
                color: 'var(--ink-tertiary)',
                lineHeight: 1.2,
              }}
            >
              {m[1]}°
            </div>
            <div
              aria-hidden
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                height: '30px',
                marginTop: '0.35rem',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: '58%',
                  height: `${Math.max(2, Math.round((m[2] / maxRainDays) * 28))}px`,
                  borderRadius: '3px 3px 1px 1px',
                  background: 'rgba(59,130,246,0.55)',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.6rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink-tertiary)',
                marginTop: '0.3rem',
              }}
            >
              {MONTHS[i]}
            </div>
          </div>
        ))}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.68rem',
          color: 'var(--ink-tertiary)',
          margin: '0.5rem 0 0',
        }}
      >
        Daily highs / lows in °C · bars show rain days per month · ERA5 climate normals (2020–2024)
      </p>
    </div>
  );
}
