import type { Metadata } from 'next';
import { requireAdmin } from '@lib/admin/require-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { ViatorDebugConsole } from '@/features/admin/viator/viator-debug-console';
import { viatorClientFromEnv } from '@/providers/viator/client';
import { viatorProviderFromEnv } from '@/providers/viator';
import { viatorAffiliateHref } from '@lib/affiliate/viator-link-builder';
import type { Experience } from '@core/experience';

export const metadata: Metadata = {
  title: 'Viator · Admin · gotript',
};

export const dynamic = 'force-dynamic';

/**
 * Viator integration debug console.
 *
 * Surfaces five things at a glance:
 *
 *   1. Provider mode banner - live vs. degraded vs. not-configured.
 *   2. Env var status - which Viator vars are set (values masked).
 *   3. Boot-time smoke test - a one-shot freetext search against
 *      the live API on every page load, with the raw response time
 *      and a sample mapped Experience.
 *   4. Interactive query console - type a term, see live mapped
 *      results + affiliate hrefs.
 *   5. Raw provider response panel - JSON for the most recent query.
 *
 * The page is force-dynamic so a config change + refresh shows the
 * new state immediately. requireAdmin() gates access so the API key
 * status (configured vs not) is never visible to non-admins.
 */

export default async function ViatorAdminPage() {
  await requireAdmin();

  const config = readConfigStatus();
  const smoke = config.apiKeyConfigured
    ? await runBootSmokeTest()
    : { ok: false as const, error: 'VIATOR_API_KEY not configured' as const };

  return (
    <AdminShell
      section="viator"
      title="Viator"
      subtitle="Live experience inventory diagnostics. Use this to verify the partner integration before depending on it in production."
    >
      <ModeBanner mode={resolveMode(config, smoke)} />
      <ConfigPanel config={config} />
      <BootSmokeTestPanel result={smoke} />
      <ViatorDebugConsole initialQuery="sunrise hot air balloon Cappadocia" />
    </AdminShell>
  );
}

// ============== Server-side helpers ==============

interface ConfigStatus {
  apiKeyConfigured: boolean;
  /** Masked partner id ("P0030****55") for visual confirmation
   *  without leaking the full value into the rendered HTML. */
  partnerIdMasked: string | null;
  baseUrl: string;
  defaultCurrency: string;
  acceptLanguage: string;
}

function readConfigStatus(): ConfigStatus {
  const apiKey = (process.env.VIATOR_API_KEY ?? '').trim();
  const partnerId = (process.env.VIATOR_PARTNER_ID ?? '').trim();
  return {
    apiKeyConfigured: apiKey.length > 0,
    partnerIdMasked: partnerId.length > 0 ? maskMiddle(partnerId) : null,
    baseUrl: (process.env.VIATOR_API_BASE_URL ?? '').trim() || 'https://api.viator.com/partner',
    defaultCurrency: (process.env.VIATOR_DEFAULT_CURRENCY ?? '').trim() || 'USD',
    acceptLanguage: (process.env.VIATOR_ACCEPT_LANGUAGE ?? '').trim() || 'en-US',
  };
}

function maskMiddle(s: string): string {
  if (s.length <= 4) return '*'.repeat(s.length);
  if (s.length <= 8) return `${s.slice(0, 2)}${'*'.repeat(s.length - 4)}${s.slice(-2)}`;
  return `${s.slice(0, 4)}${'*'.repeat(s.length - 8)}${s.slice(-4)}`;
}

type SmokeTestResult =
  | {
      ok: true;
      durationMs: number;
      totalCount: number;
      sample: {
        productCode: string;
        title: string;
        rawProductUrl: string;
        affiliateHref: string | null;
        mapped: Experience;
      } | null;
    }
  | { ok: false; error: string };

async function runBootSmokeTest(): Promise<SmokeTestResult> {
  const client = viatorClientFromEnv();
  if (!client) return { ok: false, error: 'VIATOR_API_KEY not configured' };
  const provider = viatorProviderFromEnv();
  if (!provider) return { ok: false, error: 'Viator provider construction failed' };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(new Error('boot smoke test timeout')), 10000);
  const started = Date.now();
  try {
    const result = await provider.search(
      { searchTerm: 'private day tour', limit: 3, currency: 'USD' },
      { signal: controller.signal, secrets: {} },
    );
    const elapsed = Date.now() - started;
    const first = result.experiences[0];
    return {
      ok: true,
      durationMs: elapsed,
      totalCount: result.experiences.length,
      sample: first
        ? {
            productCode: first.productCode,
            title: first.title,
            rawProductUrl: first.affiliate.url,
            affiliateHref: viatorAffiliateHref(first),
            mapped: first,
          }
        : null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

type Mode = 'live' | 'configured-untested' | 'configured-failing' | 'not-configured';

function resolveMode(config: ConfigStatus, smoke: SmokeTestResult): Mode {
  if (!config.apiKeyConfigured) return 'not-configured';
  if (smoke.ok) return 'live';
  return 'configured-failing';
}

// ============== Presentational sub-components (server) ==============

function ModeBanner({ mode }: { mode: Mode }) {
  const palette = modePalette(mode);
  const label = modeLabel(mode);
  const detail = modeDetail(mode);
  return (
    <section className="mb-6">
      <div
        className="flex flex-col gap-1 rounded-[14px] border p-5"
        style={{ background: palette.bg, borderColor: palette.border }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Provider mode
        </p>
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-sm, 1.6rem)',
            fontWeight: 400,
            color: palette.fg,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </p>
        <p
          className="mt-1 max-w-2xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          {detail}
        </p>
      </div>
    </section>
  );
}

function ConfigPanel({ config }: { config: ConfigStatus }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm uppercase tracking-wider text-[color:var(--ink-tertiary)]">
        Environment
      </h2>
      <div
        className="grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border md:grid-cols-2"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--border-subtle)' }}
      >
        <ConfigRow
          name="VIATOR_API_KEY"
          value={config.apiKeyConfigured ? '<configured>' : '<unset>'}
          status={config.apiKeyConfigured ? 'set' : 'missing'}
        />
        <ConfigRow
          name="VIATOR_PARTNER_ID"
          value={config.partnerIdMasked ?? '<unset>'}
          status={config.partnerIdMasked ? 'set' : 'missing'}
        />
        <ConfigRow name="VIATOR_API_BASE_URL" value={config.baseUrl} status="info" />
        <ConfigRow name="VIATOR_DEFAULT_CURRENCY" value={config.defaultCurrency} status="info" />
        <ConfigRow name="VIATOR_ACCEPT_LANGUAGE" value={config.acceptLanguage} status="info" />
      </div>
    </section>
  );
}

function ConfigRow({
  name,
  value,
  status,
}: {
  name: string;
  value: string;
  status: 'set' | 'missing' | 'info';
}) {
  const dotColor = status === 'set' ? '#3a8a5a' : status === 'missing' ? '#a05050' : '#888';
  return (
    <div
      className="flex items-center justify-between gap-4 p-4"
      style={{ background: 'var(--surface-elevated)' }}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '999px',
            background: dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, ui-monospace)',
            fontSize: '0.78rem',
            color: 'var(--ink-secondary)',
          }}
        >
          {name}
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono, ui-monospace)',
          fontSize: '0.78rem',
          color: 'var(--ink-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function BootSmokeTestPanel({ result }: { result: SmokeTestResult }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm uppercase tracking-wider text-[color:var(--ink-tertiary)]">
        Boot smoke test
      </h2>
      {result.ok ? (
        <div
          className="rounded-[12px] border p-5"
          style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--ink-secondary)',
              marginBottom: '0.75rem',
            }}
          >
            Live freetext search for{' '}
            <strong style={{ color: 'var(--ink-primary)' }}>&ldquo;private day tour&rdquo;</strong>{' '}
            returned <strong style={{ color: 'var(--ink-primary)' }}>{result.totalCount}</strong>{' '}
            results in{' '}
            <strong style={{ color: 'var(--ink-primary)' }}>{result.durationMs}ms</strong>.
          </p>
          {result.sample ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <SamplePanel
                heading="Sample product"
                rows={[
                  { k: 'productCode', v: result.sample.productCode },
                  { k: 'title', v: result.sample.title },
                  {
                    k: 'pricing.fromPerPerson',
                    v: `${result.sample.mapped.pricing.fromPerPerson} ${result.sample.mapped.pricing.currency}`,
                  },
                  {
                    k: 'reviews',
                    v: `${result.sample.mapped.reviews.averageRating ?? '-'} / 5 (${result.sample.mapped.reviews.total})`,
                  },
                ]}
              />
              <SamplePanel
                heading="Affiliate link"
                rows={[
                  {
                    k: 'productUrl (raw)',
                    v: truncate(result.sample.rawProductUrl, 70),
                    title: result.sample.rawProductUrl,
                  },
                  {
                    k: '/r/[id] href',
                    v: result.sample.affiliateHref
                      ? truncate(result.sample.affiliateHref, 70)
                      : '(rejected by allowlist)',
                    href: result.sample.affiliateHref ?? undefined,
                  },
                ]}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className="rounded-[12px] border p-5"
          style={{ background: 'rgba(160,80,80,0.08)', borderColor: 'rgba(160,80,80,0.32)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--ink-primary)',
            }}
          >
            Smoke test failed
          </p>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-mono, ui-monospace)',
              fontSize: '0.78rem',
              color: 'var(--ink-secondary)',
              wordBreak: 'break-word',
            }}
          >
            {result.error}
          </p>
        </div>
      )}
    </section>
  );
}

function SamplePanel({
  heading,
  rows,
}: {
  heading: string;
  rows: Array<{ k: string; v: string; href?: string; title?: string }>;
}) {
  return (
    <div
      className="rounded-[10px] border p-4"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-base)' }}
    >
      <h3
        className="mb-2"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {heading}
      </h3>
      <dl className="grid grid-cols-[10rem_1fr] gap-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.k} className="contents">
            <dt
              style={{
                fontFamily: 'var(--font-mono, ui-monospace)',
                fontSize: '0.74rem',
                color: 'var(--ink-tertiary)',
                lineHeight: 1.5,
              }}
            >
              {row.k}
            </dt>
            <dd
              title={row.title}
              style={{
                fontFamily: 'var(--font-mono, ui-monospace)',
                fontSize: '0.74rem',
                color: 'var(--ink-primary)',
                lineHeight: 1.5,
                wordBreak: 'break-word',
                margin: 0,
              }}
            >
              {row.href ? (
                <a
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
                >
                  {row.v}
                </a>
              ) : (
                row.v
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

// ============== Mode palette helpers ==============

function modePalette(mode: Mode): { bg: string; border: string; fg: string } {
  switch (mode) {
    case 'live':
      return {
        bg: 'rgba(60,140,90,0.10)',
        border: 'rgba(60,140,90,0.30)',
        fg: 'var(--ink-primary)',
      };
    case 'configured-failing':
      return {
        bg: 'rgba(170,90,60,0.10)',
        border: 'rgba(170,90,60,0.30)',
        fg: 'var(--ink-primary)',
      };
    case 'configured-untested':
      return {
        bg: 'rgba(180,160,80,0.10)',
        border: 'rgba(180,160,80,0.30)',
        fg: 'var(--ink-primary)',
      };
    case 'not-configured':
      return {
        bg: 'rgba(120,120,120,0.10)',
        border: 'var(--border-subtle)',
        fg: 'var(--ink-secondary)',
      };
  }
}

function modeLabel(mode: Mode): string {
  switch (mode) {
    case 'live':
      return 'Live · serving Viator inventory';
    case 'configured-failing':
      return 'Configured · partner API is failing';
    case 'configured-untested':
      return 'Configured · awaiting verification';
    case 'not-configured':
      return 'Not configured · degraded';
  }
}

function modeDetail(mode: Mode): string {
  switch (mode) {
    case 'live':
      return 'Homepage rails and chat results are populated by real Viator products. Affiliate URLs carry the partner id and campaign tag for attribution.';
    case 'configured-failing':
      return "The API key is present but the partner endpoint isn't responding. The homepage rails fall back to their empty state.";
    case 'configured-untested':
      return 'Run a query below to confirm the key works.';
    case 'not-configured':
      return 'Set VIATOR_API_KEY in .env.local and reload. Without it the live rails render their empty state and chat surfaces only stay results.';
  }
}
