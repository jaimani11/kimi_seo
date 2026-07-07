import type { DestinationScores } from '@lib/seo/destination-scores';
import { SCORE_DIMENSIONS } from '@lib/seo/destination-scores';

/**
 * Destination Intelligence scorecard — 8 dimensions rendered as
 * labeled bars on a city's guide page. Missing dimensions from
 * DESTINATION_SCORES simply hide the entire card at the page level
 * (see /destinations/[slug]/page.tsx).
 */
export function DestinationScorecard({
  cityName,
  scores,
}: {
  cityName: string;
  scores: DestinationScores;
}) {
  return (
    <section
      className="mx-auto max-w-4xl px-6 py-10"
      style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="text-center">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Destination Intelligence
        </p>
        <h2
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {cityName} scored on 8 dimensions
        </h2>
        <p
          className="mx-auto mt-3 max-w-2xl"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: 'var(--ink-tertiary)',
            margin: '0.75rem auto 0',
          }}
        >
          Editorial scores 0–10 — a lived assessment across the dimensions travelers actually
          weigh. Higher is better on each axis.
        </p>
      </div>

      <div
        className="mt-8 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        {SCORE_DIMENSIONS.map((dim) => {
          const value = scores[dim.key];
          return (
            <ScoreRow
              key={dim.key}
              emoji={dim.emoji}
              label={dim.label}
              blurb={dim.blurb}
              value={value}
            />
          );
        })}
      </div>
    </section>
  );
}

function ScoreRow({
  emoji,
  label,
  blurb,
  value,
}: {
  emoji: string;
  label: string;
  blurb: string;
  value: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  const barColor = colorForScore(value);
  return (
    <div
      style={{
        padding: '0.85rem 1rem',
        borderRadius: '0.65rem',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-overlay)',
      }}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>
          {emoji}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--ink-primary)',
          }}
        >
          {label}
        </span>
        <span
          className="ml-auto"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
          <span
            style={{
              fontWeight: 400,
              color: 'var(--ink-tertiary)',
              fontSize: '0.75rem',
              marginLeft: '0.15rem',
            }}
          >
            /10
          </span>
        </span>
      </div>
      <div
        className="mt-2"
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '999px',
          background: 'rgba(148, 163, 184, 0.20)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: barColor,
            borderRadius: '999px',
            transition: 'width 200ms ease',
          }}
        />
      </div>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.75rem',
          lineHeight: 1.45,
          color: 'var(--ink-tertiary)',
          margin: '0.4rem 0 0',
        }}
      >
        {blurb}
      </p>
    </div>
  );
}

function colorForScore(v: number): string {
  if (v >= 9) return 'linear-gradient(90deg, #10b981, #22c55e)';
  if (v >= 7) return 'linear-gradient(90deg, #22c55e, #84cc16)';
  if (v >= 5) return 'linear-gradient(90deg, #f59e0b, #eab308)';
  if (v >= 3) return 'linear-gradient(90deg, #f97316, #f59e0b)';
  return 'linear-gradient(90deg, #ef4444, #f97316)';
}
