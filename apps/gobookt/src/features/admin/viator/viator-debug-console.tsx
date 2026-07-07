'use client';

import { useCallback, useState } from 'react';
import type { Experience } from '@core/experience';
import { ExperienceSchema } from '@core/experience';
import { viatorAffiliateHref } from '@lib/affiliate/viator-link-builder';

interface ViatorDebugConsoleProps {
  initialQuery: string;
}

interface QueryRun {
  /** Wall-clock duration of the round trip. */
  durationMs: number;
  /** HTTP status the API returned. */
  status: number;
  /** Parsed experiences (post mapper, post zod safe-parse). */
  experiences: Experience[];
  /** Raw response JSON for the panel. Pretty-printed. */
  rawJson: string;
  /** Set if the API returned non-2xx or threw. */
  error: string | null;
}

/**
 * Interactive query console. Drives /api/discovery/experiences from the
 * browser, then renders three things:
 *
 *   - Timing + result count + status code chip
 *   - One mini-card per result showing the title, price, rating, the
 *     raw Viator URL (truncated, link), and the encoded /r/[id] redirect
 *     for that same product
 *   - A collapsed raw-JSON panel with the full API response
 *
 * Lives in features/admin so the page itself stays a server component.
 */
export function ViatorDebugConsole({ initialQuery }: ViatorDebugConsoleProps) {
  const [query, setQuery] = useState(initialQuery);
  const [limit, setLimit] = useState(8);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState<QueryRun | null>(null);
  const [rawOpen, setRawOpen] = useState(false);

  const fire = useCallback(
    async (q: string, lim: number) => {
      const trimmed = q.trim();
      if (trimmed.length === 0) return;
      setLoading(true);
      const params = new URLSearchParams({ query: trimmed, limit: String(lim) });
      const url = `/api/discovery/experiences?${params.toString()}`;
      const started = performance.now();
      try {
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        const elapsed = Math.round(performance.now() - started);
        const text = await res.text();
        const json = safeJsonParse(text);
        const rawJson = json ? JSON.stringify(json, null, 2) : text;
        const experiences: Experience[] = [];
        if (json && Array.isArray((json as { experiences?: unknown }).experiences)) {
          for (const e of (json as { experiences: unknown[] }).experiences) {
            const parsed = ExperienceSchema.safeParse(e);
            if (parsed.success) experiences.push(parsed.data);
          }
        }
        setRun({
          durationMs: elapsed,
          status: res.status,
          experiences,
          rawJson,
          error: res.ok ? null : `${res.status} ${res.statusText}`,
        });
      } catch (err) {
        const elapsed = Math.round(performance.now() - started);
        setRun({
          durationMs: elapsed,
          status: 0,
          experiences: [],
          rawJson: err instanceof Error ? err.message : String(err),
          error: err instanceof Error ? err.message : 'network failure',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return (
    <section className="mb-12">
      <h2 className="mb-3 text-sm uppercase tracking-wider text-[color:var(--ink-tertiary)]">
        Interactive query
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void fire(query, limit);
        }}
        className="mb-5 flex flex-col gap-3 md:flex-row md:items-end"
      >
        <label className="flex flex-1 flex-col gap-1.5">
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            Search term
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="sunrise hot air balloon Cappadocia"
            spellCheck={false}
            style={{
              fontFamily: 'var(--font-mono, ui-monospace)',
              fontSize: '0.85rem',
              padding: '0.55rem 0.85rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-elevated)',
              color: 'var(--ink-primary)',
              borderRadius: '0.4rem',
            }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            Limit
          </span>
          <input
            type="number"
            min={1}
            max={24}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
            style={{
              fontFamily: 'var(--font-mono, ui-monospace)',
              fontSize: '0.85rem',
              padding: '0.55rem 0.85rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-elevated)',
              color: 'var(--ink-primary)',
              borderRadius: '0.4rem',
              width: '5rem',
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading || query.trim().length === 0}
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0.62rem 1.1rem',
            background: 'var(--accent-primary)',
            color: '#0b0d10',
            border: 'none',
            borderRadius: '0.4rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || query.trim().length === 0 ? 0.5 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          {loading ? 'Querying…' : 'Run query'}
        </button>
      </form>

      {run ? <RunSummary run={run} /> : null}
      {run && run.experiences.length > 0 ? <ResultList experiences={run.experiences} /> : null}
      {run ? (
        <details
          open={rawOpen}
          onToggle={(e) => setRawOpen((e.currentTarget as HTMLDetailsElement).open)}
          className="mt-6"
        >
          <summary
            className="cursor-pointer select-none"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
              padding: '0.5rem 0',
            }}
          >
            Raw API response · {run.rawJson.length} bytes
          </summary>
          <pre
            className="overflow-auto p-4"
            style={{
              fontFamily: 'var(--font-mono, ui-monospace)',
              fontSize: '0.72rem',
              lineHeight: 1.55,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-elevated)',
              color: 'var(--ink-primary)',
              borderRadius: '0.5rem',
              maxHeight: '32rem',
            }}
          >
            {run.rawJson}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

// ============== Sub-components ==============

function RunSummary({ run }: { run: QueryRun }) {
  const palette = run.error
    ? { bg: 'rgba(170,90,60,0.10)', border: 'rgba(170,90,60,0.30)' }
    : { bg: 'rgba(60,140,90,0.10)', border: 'rgba(60,140,90,0.30)' };
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] border p-3"
      style={{ background: palette.bg, borderColor: palette.border }}
    >
      <Stat label="status" value={run.status === 0 ? 'network' : String(run.status)} />
      <Stat label="latency" value={`${run.durationMs}ms`} />
      <Stat label="results" value={String(run.experiences.length)} />
      {run.error ? <Stat label="error" value={run.error} /> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono, ui-monospace)',
          fontSize: '0.85rem',
          color: 'var(--ink-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ResultList({ experiences }: { experiences: readonly Experience[] }) {
  return (
    <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
      {experiences.map((e) => (
        <ResultRow key={e.id} experience={e} />
      ))}
    </ul>
  );
}

function ResultRow({ experience }: { experience: Experience }) {
  const rawUrl = experience.affiliate.url;
  const trackedHref = viatorAffiliateHref(experience);
  const cover = experience.photos[0];
  return (
    <li
      className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:gap-5"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div
        className="relative w-full flex-shrink-0 overflow-hidden md:w-32"
        style={{
          aspectRatio: '4/3',
          borderRadius: '0.4rem',
          background: 'linear-gradient(140deg, #1a1f2a 0%, #3a4a5a 100%)',
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.alt ?? experience.title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className="break-words"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.05rem',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {experience.title}
        </h3>
        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: '0.74rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          {experience.productCode} ·{' '}
          {experience.pricing.fromPerPerson > 0
            ? `${experience.pricing.fromPerPerson} ${experience.pricing.currency} / person`
            : 'price n/a'}{' '}
          ·{' '}
          {experience.reviews.averageRating !== null
            ? `${experience.reviews.averageRating.toFixed(2)}★ (${experience.reviews.total})`
            : 'no reviews'}
        </p>
        <div className="mt-2 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5 text-sm">
          <span className="opacity-70" style={{ fontSize: '0.68rem' }}>
            raw URL
          </span>
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="break-all"
            style={{
              fontFamily: 'var(--font-mono, ui-monospace)',
              fontSize: '0.7rem',
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
            }}
          >
            {rawUrl}
          </a>
          <span className="opacity-70" style={{ fontSize: '0.68rem' }}>
            /r/[id]
          </span>
          {trackedHref ? (
            <a
              href={trackedHref}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="break-all"
              style={{
                fontFamily: 'var(--font-mono, ui-monospace)',
                fontSize: '0.7rem',
                color: 'var(--accent-primary)',
                textDecoration: 'underline',
              }}
            >
              {trackedHref}
            </a>
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-mono, ui-monospace)',
                fontSize: '0.7rem',
                color: 'rgba(170,90,60,0.95)',
              }}
            >
              (rejected by allowlist)
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
