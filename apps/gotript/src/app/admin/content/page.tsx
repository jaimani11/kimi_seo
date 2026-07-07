import type { Metadata } from 'next';
import { requireAdmin } from '@lib/admin/require-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { ContentOpsDashboard } from '@/features/admin/content-ops-dashboard';
import { SEO_CITIES } from '@lib/seo/cities';
import { cityContentStatus, contentSummary } from '@lib/seo/content-status';

export const metadata: Metadata = {
  title: 'Content Ops · Admin · gotript',
};

/**
 * /admin/content — consolidated content operations dashboard.
 * KPI strip across the top + per-city action table + bulk
 * social-pack regeneration. The dashboard is the entry point that
 * Sprint 14's /admin/social and Sprint 12's destination guides both
 * link out from; lives here so an editor lands in one place.
 */
export default async function AdminContentPage() {
  await requireAdmin();
  const summary = contentSummary();
  const statuses = SEO_CITIES.map(cityContentStatus);

  const subtitle = [
    `${summary.totalCities} cities`,
    `${summary.citiesWithGuide}/${summary.totalCities} with rich guide`,
    `${summary.totalSeoUrls} indexable SEO URLs`,
    `${summary.totalSocialItems} social items`,
  ].join(' · ');

  return (
    <AdminShell section="content" title="Content operations" subtitle={subtitle}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Destinations" value={String(summary.totalCities)} hint="SEO cities" />
        <Kpi
          label="Rich guides"
          value={`${summary.citiesWithGuide} / ${summary.totalCities}`}
          hint="hand-authored content"
        />
        <Kpi
          label="SEO URLs"
          value={String(summary.totalSeoUrls)}
          hint="programmatic, indexable"
        />
        <Kpi
          label="Social items"
          value={String(summary.totalSocialItems)}
          hint="10 × 4 platforms × city"
        />
      </div>

      <div className="mt-8">
        <ContentOpsDashboard statuses={statuses} />
      </div>
    </AdminShell>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
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
    </div>
  );
}
