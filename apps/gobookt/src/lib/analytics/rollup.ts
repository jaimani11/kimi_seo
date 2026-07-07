import type {
  AffiliateClickRecord,
  FunnelEventKind,
  FunnelEventRecord,
} from '@lib/session/session-store';
import type { Booking } from '@core/booking';

/**
 * Booking has no single `createdAt` — `confirmedAt` and `canceledAt`
 * cover the two terminal states, both nullable for drafts / failed
 * bookings. The analytics rollups pick the best available timestamp;
 * drafts without one drop out of time-windowed views.
 */
function bookingTimestamp(b: Booking): string | null {
  return b.confirmedAt ?? b.canceledAt ?? null;
}

function distinctSessionsByEventKind(
  events: readonly FunnelEventRecord[],
  kind: FunnelEventKind,
): number {
  const seen = new Set<string>();
  for (const e of events) if (e.kind === kind) seen.add(e.sessionId);
  return seen.size;
}

/**
 * Pure aggregation helpers — take already-fetched arrays of records
 * and compute the rollups the /admin/analytics dashboard shows. No
 * IO, no clock reads except for windowed rollups (which take a now
 * timestamp as an arg).
 *
 * Keeping these pure makes them trivial to unit-test against fixture
 * data — every Phase-6 metric is just an array fold.
 */

// ============== Funnel ==============

export interface FunnelStage {
  name: string;
  count: number;
  rateFromPrev: number; // 0..1, NaN when prev is 0
  rateFromTop: number; // 0..1, NaN when top is 0
}

/**
 * Six-stage funnel computed from server-side signals + the
 * client-instrumented funnel-event log (Sprint 17).
 *
 *   - Search          = distinct sessions with `search_results_view`
 *   - Recommendation  = distinct sessions with `recommendation_impression`
 *   - View            = distinct sessions with `experience_view`
 *   - Click           = total affiliate clicks
 *   - Save            = distinct sessions with `save_click`
 *                       (falls back to "distinct stayIds clicked" when
 *                       no save events have been recorded yet, so
 *                       freshly-deployed installs still show a
 *                       reasonable funnel)
 *   - Booking         = total bookings
 *
 * Each stage independently distinct-counts by sessionId so the funnel
 * doesn't over-count repeat actions from the same visitor.
 */
export function buildFunnel(
  clicks: readonly AffiliateClickRecord[],
  bookings: readonly Booking[],
  events: readonly FunnelEventRecord[] = [],
): FunnelStage[] {
  const distinctStays = new Set(clicks.map((c) => c.stayId)).size;
  const clickCount = clicks.length;
  const bookingCount = bookings.length;

  const searchSessions = distinctSessionsByEventKind(events, 'search_results_view');
  const recSessions = distinctSessionsByEventKind(events, 'recommendation_impression');
  const viewSessions = distinctSessionsByEventKind(events, 'experience_view');
  const saveSessions = distinctSessionsByEventKind(events, 'save_click');
  const saveCount = saveSessions > 0 ? saveSessions : distinctStays;
  const saveLabel = saveSessions > 0 ? 'Save' : 'Save (proxy: distinct stays)';

  const stages = [
    { name: 'Search', count: searchSessions },
    { name: 'Recommendation', count: recSessions },
    { name: 'View', count: viewSessions },
    { name: 'Outbound click', count: clickCount },
    { name: saveLabel, count: saveCount },
    { name: 'Booking', count: bookingCount },
  ];

  const top = stages[0]?.count ?? 0;
  let prev = top;
  return stages.map((s) => {
    const rateFromPrev = prev === 0 ? Number.NaN : s.count / prev;
    const rateFromTop = top === 0 ? Number.NaN : s.count / top;
    prev = s.count;
    return { ...s, rateFromPrev, rateFromTop };
  });
}

// ============== Provider CTR ==============

export interface ProviderCtrRow {
  providerId: string;
  clicks: number;
  sharePct: number; // 0..100, NaN when total is 0
}

export function providerCtr(clicks: readonly AffiliateClickRecord[]): ProviderCtrRow[] {
  const counts = new Map<string, number>();
  for (const c of clicks) {
    counts.set(c.providerId, (counts.get(c.providerId) ?? 0) + 1);
  }
  const total = clicks.length;
  return [...counts.entries()]
    .map(([providerId, count]) => ({
      providerId,
      clicks: count,
      sharePct: total === 0 ? Number.NaN : (count / total) * 100,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

// ============== Cohort analysis ==============

export interface CohortRow {
  cohortDate: string; // ISO YYYY-MM-DD
  newSessions: number;
  returningSessions: number;
  /** Sessions that produced ≥1 click on a different day than their
   *  first day. */
  multiDayActiveSessions: number;
  bookings: number;
}

/**
 * Group sessions by the date of their first observed click. Returning
 * sessions = ones that had a click on a later date than their first.
 * Multi-day active sessions = sessions with clicks on 2+ distinct
 * dates. Bookings counts bookings whose first associated click was in
 * the cohort window.
 *
 * Implementation: build a per-session first-day map + a per-session
 * day-set, then bucket.
 */
export function cohortRows(
  clicks: readonly AffiliateClickRecord[],
  bookings: readonly Booking[],
): CohortRow[] {
  const firstDayBySession = new Map<string, string>();
  const daysBySession = new Map<string, Set<string>>();
  for (const c of clicks) {
    const day = c.createdAt.slice(0, 10);
    const sid = c.sessionId;
    const seenFirst = firstDayBySession.get(sid);
    if (!seenFirst || day < seenFirst) firstDayBySession.set(sid, day);
    const set = daysBySession.get(sid) ?? new Set<string>();
    set.add(day);
    daysBySession.set(sid, set);
  }

  const bookingsByDay = new Map<string, number>();
  for (const b of bookings) {
    const ts = bookingTimestamp(b);
    if (!ts) continue;
    const day = ts.slice(0, 10);
    bookingsByDay.set(day, (bookingsByDay.get(day) ?? 0) + 1);
  }

  const cohorts = new Map<string, CohortRow>();
  for (const [sid, firstDay] of firstDayBySession) {
    const days = daysBySession.get(sid);
    const row = cohorts.get(firstDay) ?? {
      cohortDate: firstDay,
      newSessions: 0,
      returningSessions: 0,
      multiDayActiveSessions: 0,
      bookings: 0,
    };
    row.newSessions += 1;
    if (days && days.size > 1) row.multiDayActiveSessions += 1;
    cohorts.set(firstDay, row);
  }

  // Returning = sessions whose firstDay is different from a later
  // click day for that same session.
  for (const [sid, firstDay] of firstDayBySession) {
    const days = daysBySession.get(sid);
    if (!days) continue;
    for (const d of days) {
      if (d > firstDay) {
        const row = cohorts.get(firstDay);
        if (row) {
          row.returningSessions += 1;
          break;
        }
      }
    }
  }

  for (const [day, count] of bookingsByDay) {
    const row = cohorts.get(day);
    if (row) row.bookings += count;
  }

  return [...cohorts.values()].sort((a, b) => b.cohortDate.localeCompare(a.cohortDate));
}

// ============== KPI summary ==============

export interface AnalyticsKpis {
  totalClicks: number;
  totalBookings: number;
  uniqueSessions: number;
  uniqueProviders: number;
  saveBookRatePct: number; // bookings / distinct-stays, 0..100, NaN when 0
  ctrToBookPct: number; // bookings / clicks, 0..100, NaN when 0
}

export function summarizeKpis(
  clicks: readonly AffiliateClickRecord[],
  bookings: readonly Booking[],
): AnalyticsKpis {
  const distinctStays = new Set(clicks.map((c) => c.stayId)).size;
  return {
    totalClicks: clicks.length,
    totalBookings: bookings.length,
    uniqueSessions: new Set(clicks.map((c) => c.sessionId)).size,
    uniqueProviders: new Set(clicks.map((c) => c.providerId)).size,
    saveBookRatePct: distinctStays === 0 ? Number.NaN : (bookings.length / distinctStays) * 100,
    ctrToBookPct: clicks.length === 0 ? Number.NaN : (bookings.length / clicks.length) * 100,
  };
}

// ============== Top stays / cities ==============

export interface TopStayRow {
  stayId: string;
  providerId: string;
  clicks: number;
}

export function topStays(
  clicks: readonly AffiliateClickRecord[],
  limit = 10,
): TopStayRow[] {
  const counts = new Map<string, { stayId: string; providerId: string; clicks: number }>();
  for (const c of clicks) {
    const key = `${c.providerId}::${c.stayId}`;
    const existing = counts.get(key);
    if (existing) existing.clicks += 1;
    else counts.set(key, { stayId: c.stayId, providerId: c.providerId, clicks: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

// ============== Recent activity ==============

export interface RecentActivityItem {
  kind: 'click' | 'booking';
  createdAt: string;
  label: string;
  providerId?: string;
}

export function recentActivity(
  clicks: readonly AffiliateClickRecord[],
  bookings: readonly Booking[],
  limit = 15,
): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const c of clicks) {
    items.push({
      kind: 'click',
      createdAt: c.createdAt,
      label: `click · ${c.stayId}`,
      providerId: c.providerId,
    });
  }
  for (const b of bookings) {
    const ts = bookingTimestamp(b);
    if (!ts) continue;
    items.push({
      kind: 'booking',
      createdAt: ts,
      label: `booking · ${b.id}`,
    });
  }
  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
