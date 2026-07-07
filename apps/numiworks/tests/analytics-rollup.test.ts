import { describe, expect, it } from 'vitest';
import type {
  AffiliateClickRecord,
  FunnelEventKind,
  FunnelEventRecord,
} from '@/lib/session/session-store';
import type { Booking } from '@core/booking';
import {
  buildFunnel,
  cohortRows,
  providerCtr,
  recentActivity,
  summarizeKpis,
  topStays,
} from '@/lib/analytics/rollup';

function click(
  args: Partial<AffiliateClickRecord> & {
    sessionId: string;
    providerId: string;
    stayId: string;
    createdAt: string;
  },
): AffiliateClickRecord {
  return {
    id: args.id ?? `c-${Math.random().toString(36).slice(2, 8)}`,
    ownerKind: args.ownerKind ?? 'session',
    ownerId: args.ownerId ?? args.sessionId,
    sessionId: args.sessionId,
    stayId: args.stayId,
    providerId: args.providerId,
    affiliateUrl: args.affiliateUrl ?? `https://example.com/${args.stayId}`,
    createdAt: args.createdAt,
  };
}

// Minimum-fields fixture; we only read `id` + `confirmedAt`/
// `canceledAt` from the rollups. Cast keeps Booking-typed test data
// compact. The `confirmedAt` arg here drives every time-windowed
// rollup; tests pass the same ISO timestamp the old fixture used.
function booking(args: { id: string; createdAt: string }): Booking {
  return {
    id: args.id,
    confirmedAt: args.createdAt,
    canceledAt: null,
  } as unknown as Booking;
}

function event(args: {
  kind: FunnelEventKind;
  sessionId: string;
  createdAt?: string;
  ref?: string;
}): FunnelEventRecord {
  const out: FunnelEventRecord = {
    id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    kind: args.kind,
    ownerKind: 'session',
    ownerId: args.sessionId,
    sessionId: args.sessionId,
    createdAt: args.createdAt ?? '2026-06-01T00:00:00Z',
  };
  if (args.ref) out.ref = args.ref;
  return out;
}

describe('summarizeKpis', () => {
  it('handles the empty case without throwing', () => {
    const k = summarizeKpis([], []);
    expect(k.totalClicks).toBe(0);
    expect(k.totalBookings).toBe(0);
    expect(k.uniqueSessions).toBe(0);
    expect(k.uniqueProviders).toBe(0);
    expect(Number.isNaN(k.saveBookRatePct)).toBe(true);
    expect(Number.isNaN(k.ctrToBookPct)).toBe(true);
  });

  it('counts clicks/bookings/sessions/providers correctly', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's1', providerId: 'viator', stayId: 'b', createdAt: '2026-06-01T01:00:00Z' }),
      click({ sessionId: 's2', providerId: 'booking-com', stayId: 'a', createdAt: '2026-06-02T00:00:00Z' }),
    ];
    const bookings = [booking({ id: 'b1', createdAt: '2026-06-02T01:00:00Z' })];
    const k = summarizeKpis(clicks, bookings);
    expect(k.totalClicks).toBe(3);
    expect(k.totalBookings).toBe(1);
    expect(k.uniqueSessions).toBe(2);
    expect(k.uniqueProviders).toBe(2);
    expect(k.ctrToBookPct).toBeCloseTo((1 / 3) * 100, 5);
    // distinct stays = 2 (a, b); save-to-book = 1/2
    expect(k.saveBookRatePct).toBeCloseTo(50, 5);
  });
});

describe('buildFunnel', () => {
  it('emits 6 stages, all NaN-safe on empty input', () => {
    const f = buildFunnel([], []);
    expect(f).toHaveLength(6);
    for (const s of f) expect(s.count).toBe(0);
    // top is 0 → rates are NaN
    for (const s of f.slice(1)) {
      expect(Number.isNaN(s.rateFromPrev)).toBe(true);
      expect(Number.isNaN(s.rateFromTop)).toBe(true);
    }
  });

  it('uses event records for Search / Recommendation / View / Save', () => {
    const events: FunnelEventRecord[] = [
      event({ kind: 'search_results_view', sessionId: 's1' }),
      event({ kind: 'search_results_view', sessionId: 's2' }),
      event({ kind: 'search_results_view', sessionId: 's2' }), // duplicate session
      event({ kind: 'recommendation_impression', sessionId: 's1' }),
      event({ kind: 'experience_view', sessionId: 's1' }),
      event({ kind: 'experience_view', sessionId: 's3' }),
      event({ kind: 'save_click', sessionId: 's1' }),
    ];
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's3', providerId: 'viator', stayId: 'c', createdAt: '2026-06-01T02:00:00Z' }),
    ];
    const bookings = [booking({ id: 'b1', createdAt: '2026-06-01T04:00:00Z' })];

    const f = buildFunnel(clicks, bookings, events);
    expect(f[0]?.count).toBe(2);   // Search: distinct s1, s2
    expect(f[1]?.count).toBe(1);   // Recommendation: s1
    expect(f[2]?.count).toBe(2);   // View: s1, s3
    expect(f[3]?.count).toBe(2);   // Click: clicks.length
    expect(f[4]?.name).toBe('Save'); // exact (not proxy)
    expect(f[4]?.count).toBe(1);
    expect(f[5]?.count).toBe(1);   // Booking
  });

  it('falls back to "distinct stays" save proxy when no save events recorded', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's2', providerId: 'viator', stayId: 'b', createdAt: '2026-06-01T01:00:00Z' }),
    ];
    const f = buildFunnel(clicks, [], []);
    expect(f[4]?.name).toMatch(/proxy/i);
    expect(f[4]?.count).toBe(2);
  });

  it('distinct-counts sessions across event repeats', () => {
    const events: FunnelEventRecord[] = [
      event({ kind: 'experience_view', sessionId: 's1' }),
      event({ kind: 'experience_view', sessionId: 's1' }),
      event({ kind: 'experience_view', sessionId: 's1' }),
    ];
    const f = buildFunnel([], [], events);
    expect(f[2]?.count).toBe(1);
  });
});

describe('providerCtr', () => {
  it('sorts by click count descending and computes share%', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's1', providerId: 'viator', stayId: 'b', createdAt: '2026-06-01T01:00:00Z' }),
      click({ sessionId: 's1', providerId: 'viator', stayId: 'c', createdAt: '2026-06-01T02:00:00Z' }),
      click({ sessionId: 's2', providerId: 'booking-com', stayId: 'x', createdAt: '2026-06-01T03:00:00Z' }),
    ];
    const rows = providerCtr(clicks);
    expect(rows).toEqual([
      { providerId: 'viator', clicks: 3, sharePct: 75 },
      { providerId: 'booking-com', clicks: 1, sharePct: 25 },
    ]);
  });

  it('returns [] on empty input', () => {
    expect(providerCtr([])).toEqual([]);
  });
});

describe('cohortRows', () => {
  it('buckets sessions by first-click day', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's2', providerId: 'viator', stayId: 'b', createdAt: '2026-06-01T01:00:00Z' }),
      click({ sessionId: 's3', providerId: 'viator', stayId: 'c', createdAt: '2026-06-02T00:00:00Z' }),
    ];
    const rows = cohortRows(clicks, []);
    expect(rows).toHaveLength(2);
    const jun1 = rows.find((r) => r.cohortDate === '2026-06-01');
    expect(jun1?.newSessions).toBe(2);
    const jun2 = rows.find((r) => r.cohortDate === '2026-06-02');
    expect(jun2?.newSessions).toBe(1);
  });

  it('counts returning + multi-day sessions', () => {
    const clicks = [
      // s1 active on June 1 + June 3 → returning + multi-day
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's1', providerId: 'viator', stayId: 'b', createdAt: '2026-06-03T00:00:00Z' }),
      // s2 active only on June 1
      click({ sessionId: 's2', providerId: 'viator', stayId: 'c', createdAt: '2026-06-01T00:00:00Z' }),
    ];
    const rows = cohortRows(clicks, []);
    const jun1 = rows.find((r) => r.cohortDate === '2026-06-01');
    expect(jun1?.newSessions).toBe(2);
    expect(jun1?.returningSessions).toBe(1);
    expect(jun1?.multiDayActiveSessions).toBe(1);
  });

  it('attributes bookings to the day they happened (not the first-click day)', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
    ];
    const bookings = [booking({ id: 'b1', createdAt: '2026-06-01T05:00:00Z' })];
    const rows = cohortRows(clicks, bookings);
    expect(rows.find((r) => r.cohortDate === '2026-06-01')?.bookings).toBe(1);
  });

  it('sorts cohorts most-recent first', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's2', providerId: 'viator', stayId: 'b', createdAt: '2026-06-02T00:00:00Z' }),
      click({ sessionId: 's3', providerId: 'viator', stayId: 'c', createdAt: '2026-06-03T00:00:00Z' }),
    ];
    const rows = cohortRows(clicks, []);
    expect(rows.map((r) => r.cohortDate)).toEqual(['2026-06-03', '2026-06-02', '2026-06-01']);
  });
});

describe('topStays', () => {
  it('groups by (providerId, stayId) and returns top N descending', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's2', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T01:00:00Z' }),
      click({ sessionId: 's3', providerId: 'viator', stayId: 'b', createdAt: '2026-06-01T02:00:00Z' }),
      // Same stayId but a different provider — distinct row.
      click({ sessionId: 's4', providerId: 'booking-com', stayId: 'a', createdAt: '2026-06-01T03:00:00Z' }),
    ];
    const rows = topStays(clicks, 3);
    expect(rows[0]).toEqual({ providerId: 'viator', stayId: 'a', clicks: 2 });
    expect(rows).toHaveLength(3);
  });

  it('honors the limit', () => {
    const clicks = Array.from({ length: 20 }, (_, i) =>
      click({
        sessionId: `s${i}`,
        providerId: 'viator',
        stayId: `stay-${i}`,
        createdAt: '2026-06-01T00:00:00Z',
      }),
    );
    expect(topStays(clicks, 5)).toHaveLength(5);
  });
});

describe('recentActivity', () => {
  it('merges clicks + bookings, sorted desc by createdAt', () => {
    const clicks = [
      click({ sessionId: 's1', providerId: 'viator', stayId: 'a', createdAt: '2026-06-01T00:00:00Z' }),
      click({ sessionId: 's2', providerId: 'viator', stayId: 'b', createdAt: '2026-06-03T00:00:00Z' }),
    ];
    const bookings = [booking({ id: 'b1', createdAt: '2026-06-02T00:00:00Z' })];
    const items = recentActivity(clicks, bookings, 10);
    expect(items.map((i) => i.createdAt)).toEqual([
      '2026-06-03T00:00:00Z',
      '2026-06-02T00:00:00Z',
      '2026-06-01T00:00:00Z',
    ]);
    expect(items[0]?.kind).toBe('click');
    expect(items[1]?.kind).toBe('booking');
  });

  it('honors the limit', () => {
    const clicks = Array.from({ length: 50 }, (_, i) =>
      click({
        sessionId: `s${i}`,
        providerId: 'viator',
        stayId: `stay-${i}`,
        createdAt: `2026-06-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
      }),
    );
    expect(recentActivity(clicks, [], 10)).toHaveLength(10);
  });
});
