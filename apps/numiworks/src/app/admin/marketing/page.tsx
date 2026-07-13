import type { Metadata } from 'next';
import { requireAdmin } from '@lib/admin/require-admin';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { getMarketingStore } from '@lib/marketing/marketing-store';
import { getMarketingAdapters } from '@lib/marketing/adapters';
import { MARKETING_PLATFORMS } from '@lib/marketing/types';
import {
  checkPinterestStatus,
  type PinterestStatus,
} from '@lib/marketing/adapters/pinterest-client';
import { MarketingDashboard } from '@/features/admin/marketing-dashboard';

export const metadata: Metadata = {
  title: 'Marketing · Admin · numiworks',
};

/**
 * /admin/marketing — daily auto-posting controls.
 *
 * Three pieces:
 *
 *   1. Schedule controls — per-platform on/off + daily count.
 *      POSTs to /api/admin/marketing/config.
 *
 *   2. Live-status indicator — for each platform, whether the
 *      required env vars are set (i.e. live posting vs. stub mode).
 *
 *   3. Recent posts table — most-recent-first, grouped by platform.
 *
 *   4. Run Now button — manual trigger that ignores the live
 *      `enabled` flag so an operator can preview a daily batch
 *      without flipping the switch.
 *
 * Auth: requireAdmin() at the top.
 */
export default async function AdminMarketingPage() {
  // Two-layer gate: the existing Clerk/STAYSCOUT_ADMIN_PUBLIC check
  // (for shared-team admin surfaces) AND the password gate (so only
  // the operator with ADMIN_PASSWORD can touch the schedule).
  await requirePasswordAdmin({ returnTo: '/admin/marketing' });
  await requireAdmin();
  const store = getMarketingStore();
  const adapters = getMarketingAdapters();
  const config = await store.getConfig();
  const recent = await store.listPosts({ limit: 60 });

  // Best-effort Pinterest connection check. Wrapped so a network blip
  // or a malformed token never breaks the admin page itself.
  let pinterestStatus: PinterestStatus = { state: 'no-token' };
  try {
    pinterestStatus = await checkPinterestStatus();
  } catch (err) {
    pinterestStatus = {
      state: 'token-invalid',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  const adapterStatus = MARKETING_PLATFORMS.map((platform) => {
    const adapter = adapters.get(platform);
    return {
      platform,
      isLive: adapter?.isLive ?? false,
      requiredCredentials: Array.from(adapter?.requiredCredentials ?? []),
    };
  });

  const subtitle = [
    `${recent.filter((p) => p.status === 'posted').length} posted`,
    `${recent.filter((p) => p.status === 'failed').length} failed`,
    `${recent.length} total`,
  ].join(' · ');

  return (
    <AdminShell section="marketing" title="Marketing automation" subtitle={subtitle}>
      {/* Internal ops reference — the phased Security & Analytics (Part B)
       *  plan. Canonical copy is rendered internally from a version-
       *  controlled repo doc (no Claude login needed); the private artifact
       *  is now only a secondary external mirror. */}
      <a
        href="/admin/marketing/security-analytics-plan"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginBottom: '0.5rem',
          padding: '0.85rem 1.1rem',
          borderRadius: '0.7rem',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)',
          textDecoration: 'none',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.85rem',
          color: 'var(--ink-secondary)',
        }}
      >
        <span aria-hidden style={{ fontSize: '1.05rem' }}>📋</span>
        <span style={{ flex: 1, lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--ink-primary)' }}>Part&nbsp;B — Security &amp; Analytics plan</strong>
          {' '}· phased program · planning only, not yet implemented
        </span>
        <span aria-hidden style={{ color: 'var(--accent-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          View&nbsp;→
        </span>
      </a>
      <p
        style={{
          margin: '0 0 1.25rem',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          color: 'var(--ink-tertiary, var(--ink-secondary))',
        }}
      >
        External mirror (read-only, needs a Claude login):{' '}
        <a
          href="https://claude.ai/code/artifact/3cb2343e-bf39-45fe-9f00-9aaa571c6c89"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--ink-secondary)', textDecoration: 'underline' }}
        >
          Claude artifact&nbsp;↗
        </a>
      </p>
      <MarketingDashboard
        config={config}
        adapterStatus={adapterStatus}
        recent={recent}
        pinterestStatus={pinterestStatus}
      />
    </AdminShell>
  );
}
