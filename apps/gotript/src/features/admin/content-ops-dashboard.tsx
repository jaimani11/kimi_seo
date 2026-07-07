'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { SeoCity } from '@lib/seo/cities';
import type { CityContentStatus } from '@lib/seo/content-status';

/**
 * Content Operations dashboard — client UI that hosts:
 *
 *   - KPIs (received as a server-rendered prop block)
 *   - Per-city table with quick links to every content surface
 *   - Bulk-regenerate panel (sequential POSTs to
 *     /api/social/generate, with progress)
 *
 * Bulk regen is intentionally sequential rather than parallel —
 * Anthropic rate limits + gotript' single-tenant Vercel function
 * caps make a serial run safer for a 28-city sweep. The client
 * surfaces "X / Y done · current: tokyo" while it runs.
 */

interface Props {
  statuses: CityContentStatus[];
}

type RowState = 'idle' | 'queued' | 'running' | 'done' | 'error';

export function ContentOpsDashboard({ statuses }: Props) {
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [rowSource, setRowSource] = useState<Record<string, string>>({});
  const [scope, setScope] = useState<'all' | 'guided' | 'unguided'>('all');
  const [forceTemplate, setForceTemplate] = useState(false);
  const [skipSample, setSkipSample] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string | null }>({
    done: 0,
    total: 0,
    current: null,
  });
  const [errored, setErrored] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = statuses.filter((s) => {
    if (scope === 'guided') return s.hasGuide;
    if (scope === 'unguided') return !s.hasGuide;
    return true;
  });

  const regenerateOne = async (city: SeoCity): Promise<{ ok: boolean; source?: string; error?: string }> => {
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citySlug: city.slug,
          skipSample,
          forceTemplate,
        }),
      });
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` };
      }
      const body = (await res.json()) as { source?: string };
      return { ok: true, ...(body.source ? { source: body.source } : {}) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  };

  const runBulk = () => {
    if (running) return;
    setErrored(null);
    const queue = filtered.map((s) => s.city);
    if (queue.length === 0) return;

    setRowState((prev) => {
      const next = { ...prev };
      for (const c of queue) next[c.slug] = 'queued';
      return next;
    });
    setProgress({ done: 0, total: queue.length, current: null });
    setRunning(true);

    startTransition(async () => {
      let done = 0;
      for (const city of queue) {
        setProgress({ done, total: queue.length, current: city.name });
        setRowState((prev) => ({ ...prev, [city.slug]: 'running' }));
        const r = await regenerateOne(city);
        done += 1;
        setRowState((prev) => ({ ...prev, [city.slug]: r.ok ? 'done' : 'error' }));
        if (r.source) setRowSource((prev) => ({ ...prev, [city.slug]: r.source as string }));
        if (!r.ok) {
          setErrored(`${city.name}: ${r.error ?? 'unknown'}`);
        }
        setProgress({ done, total: queue.length, current: city.name });
      }
      setRunning(false);
      setProgress((p) => ({ ...p, current: null }));
    });
  };

  const counts = {
    queued: Object.values(rowState).filter((s) => s === 'queued').length,
    running: Object.values(rowState).filter((s) => s === 'running').length,
    done: Object.values(rowState).filter((s) => s === 'done').length,
    error: Object.values(rowState).filter((s) => s === 'error').length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Bulk control panel */}
      <section
        className="flex flex-col gap-4 rounded-xl border p-4"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <header>
          <h2
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
            Bulk social regeneration
          </h2>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
              maxWidth: '46rem',
            }}
          >
            Runs the social-pack generator sequentially across the filter you choose. With{' '}
            <code style={codeStyle}>ANTHROPIC_API_KEY</code> set, content runs through the LLM;
            otherwise the deterministic template fallback fires. Either way every city ends up
            with 40 ready items.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Scope"
            value={scope}
            onChange={(v) => setScope(v as typeof scope)}
            options={[
              { id: 'all', label: `All (${statuses.length})` },
              { id: 'guided', label: `With guide (${statuses.filter((s) => s.hasGuide).length})` },
              {
                id: 'unguided',
                label: `Without guide (${statuses.filter((s) => !s.hasGuide).length})`,
              },
            ]}
          />
          <Toggle
            checked={skipSample}
            onChange={setSkipSample}
            label="Skip sample"
            hint="Force-regenerate cities that ship hand-curated content"
          />
          <Toggle
            checked={forceTemplate}
            onChange={setForceTemplate}
            label="Force template"
            hint="Skip LLM mode even when ANTHROPIC_API_KEY is set"
          />
          <button
            type="button"
            onClick={runBulk}
            disabled={running || filtered.length === 0}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '0.6rem 1.15rem',
              borderRadius: '999px',
              background: running
                ? 'var(--surface-raised)'
                : 'var(--accent-primary)',
              color: running ? 'var(--ink-tertiary)' : '#fff',
              border: 'none',
              cursor: running || filtered.length === 0 ? 'wait' : 'pointer',
              marginLeft: 'auto',
            }}
          >
            {running
              ? `Running… ${progress.done}/${progress.total}`
              : `Regenerate ${filtered.length}`}
          </button>
        </div>

        {running ? (
          <div className="flex items-center gap-3 text-sm">
            <progress
              value={progress.done}
              max={progress.total}
              style={{ width: '14rem', height: '0.5rem' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                color: 'var(--ink-secondary)',
              }}
            >
              {progress.current ? `Generating ${progress.current}…` : 'Wrapping up…'}
            </span>
          </div>
        ) : null}

        {counts.done + counts.error > 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            {counts.done} succeeded · {counts.error > 0 ? `${counts.error} failed · ` : ''}
            {counts.queued + counts.running} pending
          </p>
        ) : null}

        {errored ? (
          <p
            className="rounded-md border px-3 py-2"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              color: '#a04030',
              borderColor: 'rgba(160, 64, 48, 0.3)',
              background: 'rgba(160, 64, 48, 0.06)',
              margin: 0,
            }}
          >
            Last error · {errored}
          </p>
        ) : null}
      </section>

      {/* Per-city table */}
      <section>
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="grid items-center gap-3 border-b px-4 py-3"
            style={{
              gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,0.6fr) minmax(0,0.6fr) minmax(0,1.6fr) minmax(0,0.8fr)',
              borderColor: 'var(--border-subtle)',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'var(--ink-tertiary)',
            }}
          >
            <span>City</span>
            <span>Country</span>
            <span>Guide</span>
            <span>Social</span>
            <span>Quick links</span>
            <span style={{ textAlign: 'right' }}>State</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filtered.map((s) => {
              const state: RowState = rowState[s.city.slug] ?? 'idle';
              const source = rowSource[s.city.slug];
              return (
                <li
                  key={s.city.slug}
                  className="grid items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
                  style={{
                    gridTemplateColumns:
                      'minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,0.6fr) minmax(0,0.6fr) minmax(0,1.6fr) minmax(0,0.8fr)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--ink-primary)',
                      margin: 0,
                    }}
                  >
                    {s.city.name}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.8rem',
                      color: 'var(--ink-secondary)',
                      margin: 0,
                    }}
                  >
                    {s.city.countryName}
                  </p>
                  <Pill tone={s.hasGuide ? 'positive' : 'neutral'}>
                    {s.hasGuide ? 'rich' : 'minimal'}
                  </Pill>
                  <Pill tone={s.hasSocialSample ? 'positive' : 'neutral'}>
                    {s.hasSocialSample ? 'sample' : 'template'}
                  </Pill>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <ActionLink href={`/destinations/${s.city.slug}`}>Guide</ActionLink>
                    <ActionLink href={`/things-to-do-in-${s.city.slug}`}>Things to do</ActionLink>
                    <ActionLink href={`/${s.city.slug}-3-day-itinerary`}>3-day</ActionLink>
                    <ActionLink href={`/weekend-in-${s.city.slug}`}>Weekend</ActionLink>
                    <ActionLink href={`/admin/social/${s.city.slug}`}>Social pack</ActionLink>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StatusPill state={state} sourceLabel={source} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

// ============== Sub-components ==============

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.7rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </span>
      <div
        className="flex gap-1 rounded-full p-1"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '0.3rem 0.7rem',
              borderRadius: '999px',
              background:
                value === o.id ? 'var(--accent-primary)' : 'transparent',
              color:
                value === o.id ? '#fff' : 'var(--ink-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label
      className="flex items-center gap-2"
      title={hint}
      style={{ cursor: 'pointer' }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--accent-primary)' }}
      />
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          color: 'var(--ink-secondary)',
        }}
      >
        {label}
      </span>
    </label>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: 'positive' | 'neutral';
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.66rem',
        letterSpacing: '0.05em',
        fontWeight: 600,
        padding: '0.15rem 0.55rem',
        borderRadius: '999px',
        color:
          tone === 'positive' ? 'var(--accent-primary)' : 'var(--ink-tertiary)',
        background:
          tone === 'positive' ? 'var(--accent-primary-soft)' : 'var(--surface-raised)',
        border:
          tone === 'positive'
            ? '1px solid var(--accent-primary-soft)'
            : '1px solid var(--border-subtle)',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.78rem',
        color: 'var(--ink-secondary)',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      }}
      className="hover:text-[color:var(--ink-primary)]"
    >
      {children}
    </Link>
  );
}

function StatusPill({ state, sourceLabel }: { state: RowState; sourceLabel?: string }) {
  if (state === 'idle') {
    return (
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.7rem',
          color: 'var(--ink-tertiary)',
        }}
      >
        —
      </span>
    );
  }
  const labels: Record<RowState, string> = {
    idle: '',
    queued: 'queued',
    running: 'running…',
    done: sourceLabel ? `done · ${sourceLabel}` : 'done',
    error: 'error',
  };
  const colors: Record<RowState, string> = {
    idle: 'var(--ink-tertiary)',
    queued: 'var(--ink-tertiary)',
    running: 'var(--accent-primary)',
    done: 'var(--accent-primary)',
    error: '#a04030',
  };
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.74rem',
        fontWeight: 600,
        color: colors[state],
      }}
    >
      {labels[state]}
    </span>
  );
}

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono)',
  fontSize: '0.78rem',
  background: 'var(--surface-raised)',
  padding: '0.05rem 0.3rem',
  borderRadius: '4px',
};
