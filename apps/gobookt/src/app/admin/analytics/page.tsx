import type { Metadata } from 'next';
import { requireAdmin } from '@lib/admin/require-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { getSessionStore } from '@lib/session/factory';
import { getBookingSubsystem } from '@lib/booking/factory';
import {
  buildFunnel,
  cohortRows,
  providerCtr,
  recentActivity,
  summarizeKpis,
  topStays,
} from '@lib/analytics/rollup';
import { AnalyticsDashboard } from '@/features/admin/analytics-dashboard';

export const metadata: Metadata = {
  title: 'Analytics · Admin · gobookt',
};

/**
 * /admin/analytics — Phase 6. Consolidated dashboard:
 *
 *   - KPI strip
 *   - Funnel waterfall: Search → Recommendation → View → Click → Save → Booking
 *   - Provider CTR table
 *   - Cohort table (by first-click day)
 *   - Top stays
 *   - Recent activity feed
 *
 * Reads from the affiliate-click + booking stores. Without
 * DATABASE_URL the in-memory stores are empty on a fresh process —
 * the dashboard then surfaces an honest "no data yet" empty state
 * rather than fake numbers.
 */
export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const session = getSessionStore();
  const { store: bookingStore } = getBookingSubsystem();

  const [clicks, bookings, events] = await Promise.all([
    session.listClicks({ limit: 1000 }),
    bookingStore.listAll({ limit: 1000 }),
    session.listEvents({ limit: 5000 }),
  ]);

  const kpis = summarizeKpis(clicks, bookings);
  const funnel = buildFunnel(clicks, bookings, events);
  const providers = providerCtr(clicks);
  const cohorts = cohortRows(clicks, bookings);
  const tops = topStays(clicks, 10);
  const recent = recentActivity(clicks, bookings, 15);

  const subtitle = [
    `${kpis.totalClicks} clicks`,
    `${kpis.totalBookings} bookings`,
    `${kpis.uniqueSessions} sessions`,
    `${kpis.uniqueProviders} providers`,
  ].join(' · ');

  return (
    <AdminShell section="analytics" title="Analytics" subtitle={subtitle}>
      <AnalyticsDashboard
        kpis={kpis}
        funnel={funnel}
        providers={providers}
        cohorts={cohorts}
        tops={tops}
        recent={recent}
      />
    </AdminShell>
  );
}
