import type { Metadata } from 'next';
import { requireAdmin } from '@lib/admin/require-admin';
import { getServerFeatures } from '@lib/env';
import {
  buildExpediaSearchUrl,
  getExpediaAffiliateConfig,
} from '@lib/affiliate/expedia-link-builder';
import { encodeAffiliateLink } from '@lib/affiliate/link-encoder';
import { AdminShell } from '@/features/admin/admin-shell';

export const metadata: Metadata = {
  title: 'Affiliate · Admin · numiworks',
};

export const dynamic = 'force-dynamic';

/**
 * Operator-facing affiliate diagnostics.
 *
 * Five things at a glance:
 *
 *   1. Is the Expedia affiliate CID configured?
 *   2. Sample generated Expedia URL (Tuscany, 4 nights, 2 adults).
 *   3. Sample tracked redirect URL (the same payload through /r/[id]).
 *   4. Are Rapid API keys configured?
 *   5. Current provider mode: affiliate-only / mock / live-rapid.
 *
 * Open in dev or staging when wiring keys to verify everything resolves.
 * The page server-renders on every request (`force-dynamic`) so a
 * config flip + page refresh shows the new state immediately.
 */

export default async function AffiliateDebugPage() {
  await requireAdmin();
  const features = getServerFeatures();
  const config = getExpediaAffiliateConfig();

  // Sample inputs - fixed so the URLs are reproducible across reloads.
  const sampleInputs = {
    destination: 'Tuscany, Italy',
    checkIn: '2026-09-01',
    checkOut: '2026-09-05',
    adults: 2,
  };
  const sampleExpediaUrl = buildExpediaSearchUrl(sampleInputs, config);
  const sampleTrackedId = encodeAffiliateLink({
    url: sampleExpediaUrl,
    providerId: 'expedia',
    stayId: 'demo:tuscany-sample',
    turnId: 't_demo',
  });
  const sampleTrackedUrl = `/r/${sampleTrackedId}`;

  const mode = resolveMode(features);

  return (
    <AdminShell
      section="affiliate"
      title="Affiliate"
      subtitle="Expedia affiliate + Rapid API status. Use this page to verify keys are wired before depending on revenue."
    >
      {/* Mode banner */}
      <section className="mb-6">
        <div
          className="flex flex-col gap-1 rounded-[14px] border p-5"
          style={{
            background: modeColors(mode).bg,
            borderColor: modeColors(mode).border,
          }}
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
              fontSize: 'var(--text-display-sm)',
              fontWeight: 400,
              color: modeColors(mode).fg,
              letterSpacing: '-0.01em',
            }}
          >
            {modeLabel(mode)}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--ink-secondary)',
              lineHeight: 1.5,
            }}
          >
            {modeDescription(mode)}
          </p>
        </div>
      </section>

      {/* Configuration tiles */}
      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ConfigTile
          label="Expedia affiliate CID"
          status={config.cid ? 'ok' : 'missing'}
          value={config.cid ? maskCid(config.cid) : null}
          help={
            config.cid
              ? `Set via ${envSourceFor('CID')}. Commission tracks on every click.`
              : 'Set NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID in .env.local. Without it, links work but commission is not tracked.'
          }
        />
        <ConfigTile
          label="Affiliate label"
          status={config.label ? 'ok' : 'optional'}
          value={config.label ?? '-'}
          help={
            config.label
              ? 'Sub-channel tag attached to every URL.'
              : 'Optional. Set NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL to distinguish web/email/social in Expedia reports.'
          }
        />
        <ConfigTile
          label="Affiliate base URL"
          status="ok"
          value={config.baseUrl}
          help="Locale override. Default www.expedia.com (US)."
        />
        <ConfigTile
          label="Affiliate site id"
          status="ok"
          value={String(config.siteId)}
          help="Expedia siteid (1=US, 3=UK, 23=AU, etc.)."
        />
        <ConfigTile
          label="Rapid API key"
          status={features.providers.expedia ? 'ok' : 'missing'}
          value={features.providers.expedia ? '✓ EXPEDIA_API_KEY set' : null}
          help={
            features.providers.expedia
              ? 'Live availability calls active. Listings come from real Expedia.'
              : 'Set EXPEDIA_API_KEY + EXPEDIA_SHARED_SECRET to enable real Expedia inventory. Apply at partner-solutions.expediagroup.com.'
          }
        />
        <ConfigTile
          label="Vrbo Rapid"
          status={resolveVrboStatus(features)}
          value={resolveVrboStatus(features) === 'ok' ? '✓ VRBO_API_KEY set' : null}
          help="Set VRBO_API_KEY + VRBO_SHARED_SECRET to enable Vrbo vacation-rental inventory."
        />
      </section>

      {/* Sample URLs */}
      <section className="mb-6">
        <h2
          className="mb-3"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-sm)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Sample URLs
        </h2>
        <p
          className="mb-4"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-tertiary)',
            lineHeight: 1.5,
          }}
        >
          Both URLs use a fixed sample input - Tuscany, Italy · 2026-09-01 → 2026-09-05 · 2 adults -
          so they&apos;re reproducible across reloads. Click either to verify the affcid round-trip.
        </p>
        <UrlPanel
          label="Generated Expedia URL"
          help="Built from the sample input above by buildExpediaSearchUrl. This is what /r/[id] redirects to."
          url={sampleExpediaUrl}
        />
        <UrlPanel
          label="Tracked redirect URL (/r/[id])"
          help="The shortlink the app actually puts in CTAs. Click it to test the full attribution path."
          url={sampleTrackedUrl}
        />
      </section>

      {/* Quick actions */}
      <section
        className="rounded-[14px] border p-5"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <h2
          className="mb-3"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-sm)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Test the redirect
        </h2>
        <p
          className="mb-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          Clicking the button below opens the sample tracked URL in a new tab. The redirect should
          land you on Expedia with <code>affcid</code> visible in the address bar. The click is also
          recorded - visit <code>/admin/clicks</code> to see it.
        </p>
        <a
          href={sampleTrackedUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center gap-2 rounded-md transition-opacity hover:opacity-90"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            letterSpacing: '0.04em',
            padding: '0.7rem 1.1rem',
            background: 'var(--accent-primary)',
            color: 'var(--surface-base)',
            border: 'none',
            fontWeight: 500,
          }}
        >
          Open sample redirect →
        </a>
      </section>
    </AdminShell>
  );
}

// ============== Sub-components ==============

interface ConfigTileProps {
  label: string;
  status: 'ok' | 'missing' | 'optional';
  value: string | null;
  help: string;
}

function ConfigTile({ label, status, value, help }: ConfigTileProps) {
  const tone =
    status === 'ok'
      ? { fg: 'var(--accent-primary)', dot: 'var(--accent-primary)' }
      : status === 'missing'
        ? { fg: 'var(--accent-warning)', dot: 'var(--accent-warning)' }
        : { fg: 'var(--ink-tertiary)', dot: 'var(--ink-tertiary)' };

  return (
    <div
      className="rounded-[14px] border p-5"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: tone.dot }}
        />
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {label}
        </p>
      </div>
      <p
        className="mt-1"
        style={{
          fontFamily:
            value && /^[A-Za-z0-9_:.-]/.test(value)
              ? 'var(--font-geist-mono)'
              : 'var(--font-fraunces)',
          fontSize: value ? '0.85rem' : 'var(--text-body)',
          color: tone.fg,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          wordBreak: 'break-all',
        }}
      >
        {value ?? statusLabel(status)}
      </p>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontStyle: 'italic',
          fontSize: '0.78rem',
          color: 'var(--ink-tertiary)',
          lineHeight: 1.5,
        }}
      >
        {help}
      </p>
    </div>
  );
}

interface UrlPanelProps {
  label: string;
  help: string;
  url: string;
}

function UrlPanel({ label, help, url }: UrlPanelProps) {
  return (
    <div
      className="mb-3 rounded-[14px] border p-4"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {label}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          Open ↗
        </a>
      </div>
      <code
        className="block"
        style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '0.7rem',
          color: 'var(--ink-secondary)',
          wordBreak: 'break-all',
          lineHeight: 1.5,
          padding: '0.5rem',
          background: 'var(--surface-overlay)',
          borderRadius: '0.4rem',
          display: 'block',
        }}
      >
        {url}
      </code>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontStyle: 'italic',
          fontSize: '0.78rem',
          color: 'var(--ink-tertiary)',
          lineHeight: 1.5,
        }}
      >
        {help}
      </p>
    </div>
  );
}

// ============== Mode resolution ==============

type Mode = 'live-rapid' | 'affiliate-only' | 'mock';

function resolveMode(features: ReturnType<typeof getServerFeatures>): Mode {
  if (features.providers.expedia) return 'live-rapid';
  if (features.affiliate.expediaConfigured) return 'affiliate-only';
  return 'mock';
}

function modeLabel(mode: Mode): string {
  switch (mode) {
    case 'live-rapid':
      return 'Live Rapid · Real Expedia inventory';
    case 'affiliate-only':
      return 'Affiliate-only · Real CTAs, mock listings';
    case 'mock':
      return 'Mock · No tracking, demo only';
  }
}

function modeDescription(mode: Mode): string {
  switch (mode) {
    case 'live-rapid':
      return 'Listings come from real Expedia + Rapid availability; every CTA carries your affcid; commission tracks on every click. Fully wired.';
    case 'affiliate-only':
      return 'Listings are curated (7 Italian regions) for in-region queries; everywhere else surfaces a SearchOpportunityBoard with prefilled Expedia/Vrbo/Hotels.com search URLs. Every click carries your affcid and tracks commission. Add EXPEDIA_API_KEY + EXPEDIA_SHARED_SECRET to swap the opportunity board for real Expedia inventory.';
    case 'mock':
      return 'Demo mode. Listings are mock; CTAs link to Expedia search but no affcid attached → commission does NOT track. Add NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID to start earning.';
  }
}

function modeColors(mode: Mode): { bg: string; border: string; fg: string } {
  switch (mode) {
    case 'live-rapid':
      return {
        bg: 'var(--accent-primary-soft)',
        border: 'var(--accent-primary)',
        fg: 'var(--accent-primary)',
      };
    case 'affiliate-only':
      return {
        bg: 'var(--surface-elevated)',
        border: 'var(--accent-primary)',
        fg: 'var(--accent-primary)',
      };
    case 'mock':
      return {
        bg: 'var(--accent-warning-soft)',
        border: 'var(--accent-warning)',
        fg: 'var(--accent-warning)',
      };
  }
}

// ============== Helpers ==============

function statusLabel(status: 'ok' | 'missing' | 'optional'): string {
  if (status === 'ok') return 'Configured';
  if (status === 'missing') return 'Missing';
  return 'Optional · not set';
}

function maskCid(cid: string): string {
  // Show first 3 + last 3 chars, mask the middle. Affcids aren't
  // secret per se but not worth blasting in full on a screenshare.
  if (cid.length <= 8) return cid;
  return `${cid.slice(0, 3)}…${cid.slice(-3)}`;
}

function envSourceFor(_kind: 'CID'): string {
  // Prefer the canonical NEXT_PUBLIC name; fall back to non-prefixed
  // when only that's set.
  if (process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID) {
    return 'NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID';
  }
  return 'EXPEDIA_AFFILIATE_CID (server-only fallback)';
}

function resolveVrboStatus(features: ReturnType<typeof getServerFeatures>): 'ok' | 'missing' {
  // We don't have features.providers.vrbo today (only bookingCom + expedia
  // are surfaced). Read env directly. When that flag lands later this
  // becomes a one-line change.
  const set = !!process.env.VRBO_API_KEY && !!process.env.VRBO_SHARED_SECRET;
  void features; // silence unused - reserved for future flag
  return set ? 'ok' : 'missing';
}
