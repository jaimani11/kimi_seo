import type {
  AnalyticsKpis,
  CohortRow,
  FunnelStage,
  ProviderCtrRow,
  RecentActivityItem,
  TopStayRow,
} from '@lib/analytics/rollup';

/**
 * Pure presentation. Server-fetched data flows in; no client state.
 * Charts are CSS-driven (no chart library) so this stays a server
 * component — fast first paint, no hydration cost.
 */

interface Props {
  kpis: AnalyticsKpis;
  funnel: FunnelStage[];
  providers: ProviderCtrRow[];
  cohorts: CohortRow[];
  tops: TopStayRow[];
  recent: RecentActivityItem[];
}

export function AnalyticsDashboard({
  kpis,
  funnel,
  providers,
  cohorts,
  tops,
  recent,
}: Props) {
  const hasData = kpis.totalClicks > 0 || kpis.totalBookings > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total clicks" value={String(kpis.totalClicks)} />
        <Kpi label="Total bookings" value={String(kpis.totalBookings)} />
        <Kpi label="Unique sessions" value={String(kpis.uniqueSessions)} />
        <Kpi
          label="CTR → Book"
          value={Number.isNaN(kpis.ctrToBookPct) ? '—' : `${kpis.ctrToBookPct.toFixed(1)}%`}
          hint="bookings ÷ clicks"
        />
      </section>

      {!hasData ? (
        <section
          className="rounded-xl border p-6 text-center"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
              maxWidth: '46rem',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            No clicks or bookings recorded yet on this server. Click an affiliate CTA on the
            live site or run a search-to-reserve flow to populate the dashboard. With{' '}
            <Code>DATABASE_URL</Code> unset, in-memory stores reset on every restart.
          </p>
        </section>
      ) : null}

      {/* Funnel */}
      <Section title="Funnel" eyebrow="Search → Book">
        <ul style={listStyle}>
          {funnel.map((stage, i) => {
            const topCount = funnel[0]?.count ?? 0;
            const width = topCount > 0 ? Math.max(2, (stage.count / topCount) * 100) : 0;
            return (
              <li
                key={stage.name}
                className="rounded-md p-3"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span style={stageLabelStyle}>{i + 1}. {stage.name}</span>
                  <span style={stageCountStyle}>
                    {stage.count.toLocaleString()}
                    {i > 0 && !Number.isNaN(stage.rateFromPrev) ? (
                      <span style={stageRateStyle}>
                        {' '}
                        · {(stage.rateFromPrev * 100).toFixed(1)}% from prev
                      </span>
                    ) : null}
                  </span>
                </div>
                <div
                  aria-hidden
                  className="mt-2 h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'var(--surface-raised)' }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: '100%',
                      background: 'var(--accent-primary)',
                      transition: 'width 240ms ease',
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Provider CTR + Save/Book ratios */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Provider CTR" eyebrow="Where clicks land">
          {providers.length === 0 ? (
            <EmptyNote>No clicks recorded yet.</EmptyNote>
          ) : (
            <ul style={listStyle}>
              {providers.map((p) => (
                <li
                  key={p.providerId}
                  className="rounded-md p-3"
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <span style={stageLabelStyle}>{p.providerId}</span>
                    <span style={stageCountStyle}>
                      {p.clicks.toLocaleString()}
                      {!Number.isNaN(p.sharePct) ? (
                        <span style={stageRateStyle}> · {p.sharePct.toFixed(1)}%</span>
                      ) : null}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="mt-2 h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'var(--surface-raised)' }}
                  >
                    <div
                      style={{
                        width: `${Number.isNaN(p.sharePct) ? 0 : p.sharePct}%`,
                        height: '100%',
                        background: 'var(--accent-primary)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Save / Book ratios" eyebrow="Proxy: distinct stays">
          <div
            className="rounded-md p-4"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Kpi
              label="Save → Book"
              value={
                Number.isNaN(kpis.saveBookRatePct)
                  ? '—'
                  : `${kpis.saveBookRatePct.toFixed(1)}%`
              }
              hint="bookings ÷ distinct stays clicked"
            />
            <p
              className="mt-3"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                color: 'var(--ink-tertiary)',
                margin: 0,
              }}
            >
              &ldquo;Distinct stays&rdquo; is a proxy for save intent until the admin{' '}
              <Code>listAllTrips()</Code> path lands.
            </p>
          </div>
        </Section>
      </div>

      {/* Cohorts */}
      <Section title="Cohorts" eyebrow="By first-click day">
        {cohorts.length === 0 ? (
          <EmptyNote>No sessions recorded yet.</EmptyNote>
        ) : (
          <div
            className="overflow-hidden rounded-md"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="grid items-center gap-3 border-b px-4 py-2"
              style={{
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.7fr)',
                borderColor: 'var(--border-subtle)',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.66rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--ink-tertiary)',
              }}
            >
              <span>Cohort date</span>
              <span>New</span>
              <span>Returning</span>
              <span>Multi-day</span>
              <span>Bookings</span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {cohorts.slice(0, 20).map((c) => (
                <li
                  key={c.cohortDate}
                  className="grid items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
                  style={{
                    gridTemplateColumns:
                      'minmax(0,1fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.7fr)',
                    borderColor: 'var(--border-subtle)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.85rem',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <span style={{ color: 'var(--ink-primary)', fontWeight: 600 }}>{c.cohortDate}</span>
                  <span>{c.newSessions}</span>
                  <span>{c.returningSessions}</span>
                  <span>{c.multiDayActiveSessions}</span>
                  <span>{c.bookings}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* Top stays + recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Top stays" eyebrow="Most-clicked">
          {tops.length === 0 ? (
            <EmptyNote>No clicks recorded yet.</EmptyNote>
          ) : (
            <ul style={listStyle}>
              {tops.map((t) => (
                <li
                  key={`${t.providerId}::${t.stayId}`}
                  className="grid items-center gap-3 rounded-md p-3"
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    gridTemplateColumns: 'minmax(0,1fr) auto',
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span
                      className="truncate"
                      style={{
                        fontFamily: 'var(--font-geist-mono)',
                        fontSize: '0.78rem',
                        color: 'var(--ink-primary)',
                      }}
                    >
                      {t.stayId}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.7rem',
                        color: 'var(--ink-tertiary)',
                      }}
                    >
                      {t.providerId}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {t.clicks}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent activity" eyebrow="Last 15 events">
          {recent.length === 0 ? (
            <EmptyNote>No activity yet.</EmptyNote>
          ) : (
            <ul style={listStyle}>
              {recent.map((r, i) => (
                <li
                  key={`${r.kind}-${i}`}
                  className="flex items-baseline justify-between rounded-md px-3 py-2"
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-geist-mono)',
                      fontSize: '0.74rem',
                      color: 'var(--ink-secondary)',
                    }}
                  >
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.7rem',
                      color: 'var(--ink-tertiary)',
                    }}
                  >
                    {r.createdAt.slice(0, 19).replace('T', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

// ============== Helpers ==============

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.62rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: 'var(--ink-tertiary)',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '1.7rem',
          fontWeight: 800,
          color: 'var(--accent-primary)',
          margin: '0.3rem 0 0',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </p>
      {hint ? (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            color: 'var(--ink-secondary)',
            margin: 0,
          }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            margin: 0,
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            margin: '0.15rem 0 0',
          }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-md border p-3 text-center"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.85rem',
        color: 'var(--ink-tertiary)',
        borderColor: 'var(--border-subtle)',
        background: 'var(--surface-elevated)',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'var(--font-geist-mono)',
        fontSize: '0.85em',
        background: 'var(--surface-raised)',
        padding: '0.05rem 0.3rem',
        borderRadius: '4px',
      }}
    >
      {children}
    </code>
  );
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
};

const stageLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--ink-primary)',
};

const stageCountStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.88rem',
  color: 'var(--ink-secondary)',
};

const stageRateStyle: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono)',
  fontSize: '0.78rem',
  color: 'var(--ink-tertiary)',
};
