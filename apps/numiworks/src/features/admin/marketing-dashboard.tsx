'use client';

import { useState } from 'react';
import type {
  MarketingPlatform,
  MarketingPlatformConfig,
  MarketingPost,
  MarketingRunSummary,
  MarketingScheduleConfig,
} from '@lib/marketing/types';
import { MARKETING_PLATFORMS } from '@lib/marketing/types';
import type { PinterestStatus } from '@lib/marketing/adapters/pinterest-client';

interface AdapterStatus {
  platform: MarketingPlatform;
  isLive: boolean;
  requiredCredentials: string[];
}

interface MarketingDashboardProps {
  config: MarketingScheduleConfig;
  adapterStatus: AdapterStatus[];
  recent: MarketingPost[];
  pinterestStatus: PinterestStatus;
}

const PLATFORM_META: Record<MarketingPlatform, { label: string; tagline: string }> = {
  pinterest: { label: 'Pinterest', tagline: 'Image pins to a connected business board.' },
  instagram: { label: 'Instagram', tagline: 'Feed posts via the Instagram Graph API.' },
  tiktok: { label: 'TikTok', tagline: 'Scripts queued for filming; direct video upload is v2.' },
};

export function MarketingDashboard({
  config: initial,
  adapterStatus,
  recent,
  pinterestStatus,
}: MarketingDashboardProps) {
  const [config, setConfig] = useState<MarketingScheduleConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<MarketingRunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setPlatform(platform: MarketingPlatform, next: Partial<MarketingPlatformConfig>) {
    setConfig((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], ...next },
      updatedAt: new Date().toISOString(),
    }));
  }

  async function saveConfig() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/marketing/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinterest: config.pinterest,
          instagram: config.instagram,
          tiktok: config.tiktok,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function runNow(platform?: MarketingPlatform) {
    setRunning(true);
    setError(null);
    setLastRun(null);
    try {
      const res = await fetch('/api/admin/marketing/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(platform ? { platform } : {}), forceRun: true }),
      });
      if (!res.ok) throw new Error(`Run failed (${res.status})`);
      const body = (await res.json()) as { summary: MarketingRunSummary };
      setLastRun(body.summary);
      // Reload the page after a moment so the recent-posts table picks
      // up the new rows. Simpler than threading state.
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: 'var(--accent-warm)',
            background: 'var(--surface-elevated)',
            color: 'var(--ink-secondary)',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
          }}
        >
          Error: {error}
        </div>
      ) : null}

      {/* ============== Pinterest connection ============== */}
      <PinterestConnectionPanel status={pinterestStatus} />

      {/* ============== Schedule controls ============== */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {MARKETING_PLATFORMS.map((platform) => {
          const meta = PLATFORM_META[platform];
          const cfg = config[platform];
          const status = adapterStatus.find((s) => s.platform === platform);
          return (
            <article
              key={platform}
              className="rounded-xl border p-5"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-fraunces)',
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      color: 'var(--ink-primary)',
                      margin: 0,
                    }}
                  >
                    {meta.label}
                  </h2>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.78rem',
                      color: 'var(--ink-tertiary)',
                      margin: 0,
                    }}
                  >
                    {meta.tagline}
                  </p>
                </div>
                <LiveBadge isLive={status?.isLive ?? false} />
              </header>

              <label className="mb-3 flex items-center justify-between gap-3">
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.85rem',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Enabled
                </span>
                <input
                  type="checkbox"
                  checked={cfg.enabled}
                  onChange={(e) => setPlatform(platform, { enabled: e.target.checked })}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.85rem',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Posts per day
                </span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={cfg.dailyCount}
                  onChange={(e) =>
                    setPlatform(platform, {
                      dailyCount: Math.max(0, Math.min(50, Number(e.target.value))),
                    })
                  }
                  className="w-20 rounded border px-2 py-1"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    background: 'var(--surface-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </label>

              {!status?.isLive ? (
                <p
                  className="mt-3"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.72rem',
                    color: 'var(--ink-tertiary)',
                    lineHeight: 1.55,
                  }}
                >
                  Stub mode — set <code>{status?.requiredCredentials.join(', ')}</code> in env
                  to enable live posting. Content still generates and logs.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => runNow(platform)}
                disabled={running}
                className="mt-4 rounded-md border px-3 py-1.5 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  color: 'var(--ink-secondary)',
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--surface-base)',
                }}
              >
                Run {meta.label} now
              </button>
            </article>
          );
        })}
      </section>

      {/* ============== Global actions ============== */}
      <section
        className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={saveConfig}
          disabled={saving}
          className="rounded-md px-4 py-2 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            fontWeight: 500,
            background: 'var(--accent-primary)',
            color: 'var(--surface-base)',
            border: 'none',
          }}
        >
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
        <button
          type="button"
          onClick={() => runNow()}
          disabled={running}
          className="rounded-md border px-4 py-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--ink-secondary)',
            borderColor: 'var(--border-subtle)',
            background: 'var(--surface-base)',
          }}
        >
          {running ? 'Running…' : 'Run all platforms now'}
        </button>
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          Last updated: {new Date(config.updatedAt).toLocaleString()}
        </span>
      </section>

      {/* ============== Last run summary ============== */}
      {lastRun ? (
        <section
          className="rounded-xl border p-4"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--accent-primary)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            Last run · {lastRun.durationMs}ms
          </h3>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              color: 'var(--ink-secondary)',
            }}
          >
            {lastRun.totals.posted} posted · {lastRun.totals.failed} failed ·{' '}
            {lastRun.totals.skipped} skipped · refreshing…
          </p>
        </section>
      ) : null}

      {/* ============== Recent posts table ============== */}
      <section>
        <h2
          className="mb-3"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.2rem',
            fontWeight: 500,
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Recent posts
        </h2>
        {recent.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              color: 'var(--ink-tertiary)',
            }}
          >
            No posts yet. Click <strong>Run all platforms now</strong> to generate a preview batch.
          </p>
        ) : (
          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <table className="w-full text-left">
              <thead style={{ background: 'var(--surface-elevated)' }}>
                <tr>
                  <Th>When</Th>
                  <Th>Platform</Th>
                  <Th>City</Th>
                  <Th>Status</Th>
                  <Th>Headline</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((post) => (
                  <tr
                    key={post.id}
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <Td>
                      <span
                        style={{
                          fontFamily: 'var(--font-geist-mono)',
                          fontSize: '0.72rem',
                          color: 'var(--ink-tertiary)',
                        }}
                      >
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </Td>
                    <Td>{PLATFORM_META[post.platform].label}</Td>
                    <Td>{post.cityName}</Td>
                    <Td>
                      <StatusBadge status={post.status} />
                    </Td>
                    <Td>
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.82rem',
                          color: 'var(--ink-secondary)',
                        }}
                      >
                        {headlineOf(post)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function headlineOf(post: MarketingPost): string {
  const p = post.payload as { title?: string; hook?: string };
  return (p.title ?? p.hook ?? '').slice(0, 110);
}

function LiveBadge({ isLive }: { isLive: boolean }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.62rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '0.25rem 0.5rem',
        borderRadius: '0.3rem',
        background: isLive ? 'var(--accent-primary-soft)' : 'var(--surface-overlay)',
        color: isLive ? 'var(--accent-primary)' : 'var(--ink-tertiary)',
        border: `1px solid ${isLive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
      }}
    >
      {isLive ? 'Live' : 'Stub'}
    </span>
  );
}

function StatusBadge({ status }: { status: MarketingPost['status'] }) {
  const color =
    status === 'posted'
      ? 'var(--accent-primary)'
      : status === 'failed'
      ? 'var(--accent-warm)'
      : status === 'skipped'
      ? 'var(--ink-tertiary)'
      : 'var(--ink-secondary)';
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.65rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color,
      }}
    >
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-3 py-2"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.62rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-tertiary)',
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}

function PinterestConnectionPanel({ status }: { status: PinterestStatus }) {
  // Decide tone + headline up front so the markup stays simple.
  let toneColor = 'var(--ink-tertiary)';
  let badgeText = 'Not configured';
  let headline = 'Pinterest';
  let body: React.ReactNode = null;

  if (status.state === 'no-token') {
    toneColor = 'var(--ink-tertiary)';
    badgeText = 'No token';
    headline = 'Pinterest — token not set';
    body = (
      <p style={panelTextStyle}>
        Set <code style={inlineCodeStyle}>PINTEREST_ACCESS_TOKEN</code> in Vercel (Production
        only). The page will then list your boards so you can grab the right{' '}
        <code style={inlineCodeStyle}>PINTEREST_BOARD_ID</code>.
      </p>
    );
  } else if (status.state === 'token-invalid') {
    toneColor = 'var(--accent-warm)';
    badgeText = 'Invalid';
    headline = 'Pinterest — token rejected';
    body = <p style={panelTextStyle}>{status.message}</p>;
  } else {
    // connected-readonly or connected-full
    const isReadonly = status.state === 'connected-readonly';
    toneColor = isReadonly ? 'var(--accent-warm)' : 'var(--accent-primary)';
    badgeText = isReadonly ? 'Read-only (trial)' : 'Live';
    headline = `Pinterest — connected · ${status.boards.length} boards`;
    body = (
      <>
        {isReadonly && 'note' in status ? (
          <p style={panelTextStyle}>{status.note}</p>
        ) : null}
        <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
          <table className="w-full text-left">
            <thead style={{ background: 'var(--surface-base)' }}>
              <tr>
                <Th>Board</Th>
                <Th>Pins</Th>
                <Th>ID — paste into PINTEREST_BOARD_ID</Th>
              </tr>
            </thead>
            <tbody>
              {status.boards.length === 0 ? (
                <tr>
                  <Td>
                    <span style={panelTextStyle}>No boards yet. Create one on pinterest.com first.</span>
                  </Td>
                  <Td>—</Td>
                  <Td>—</Td>
                </tr>
              ) : (
                status.boards.map((b) => (
                  <tr key={b.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <Td>
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          color: 'var(--ink-primary)',
                        }}
                      >
                        {b.name}
                      </span>
                    </Td>
                    <Td>
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.82rem',
                          color: 'var(--ink-tertiary)',
                        }}
                      >
                        {b.pinCount}
                      </span>
                    </Td>
                    <Td>
                      <code style={inlineCodeStyle}>{b.id}</code>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <section
      className="rounded-xl border p-5"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.15rem',
            fontWeight: 500,
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {headline}
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '0.25rem 0.5rem',
            borderRadius: '0.3rem',
            color: toneColor,
            border: `1px solid ${toneColor}`,
          }}
        >
          {badgeText}
        </span>
      </div>
      <div className="mt-2">{body}</div>

      {/* Connect / reconnect via OAuth — this is the authentication
        * moment shown in the Pinterest Standard-access demo video, and
        * the one-click way to mint the durable refresh token. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href="/api/pinterest/oauth/start"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.15rem',
            borderRadius: '0.5rem',
            background: '#e60023',
            color: '#ffffff',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '1.1rem',
              height: '1.1rem',
              borderRadius: '999px',
              background: '#ffffff',
              color: '#e60023',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            P
          </span>
          {status.state === 'no-token' ? 'Connect Pinterest' : 'Reconnect Pinterest'}
        </a>
        <span style={{ ...panelTextStyle, fontSize: '0.72rem', color: 'var(--ink-tertiary)' }}>
          Opens Pinterest&apos;s secure authorize screen (OAuth). Needs{' '}
          <code style={inlineCodeStyle}>PINTEREST_APP_ID</code> +{' '}
          <code style={inlineCodeStyle}>PINTEREST_APP_SECRET</code> in Vercel.
        </span>
      </div>
    </section>
  );
}

const panelTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.85rem',
  lineHeight: 1.55,
  color: 'var(--ink-secondary)',
  margin: 0,
};

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)',
  fontSize: '0.78rem',
  background: 'var(--surface-base)',
  padding: '0.12rem 0.38rem',
  borderRadius: '0.25rem',
  color: 'var(--ink-primary)',
};
