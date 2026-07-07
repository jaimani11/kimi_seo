import type { NextRequest } from 'next/server';
import { getMonitoringSubsystem, type MonitoringEvent } from '@lib/monitoring';
import { jsonResponse, resolveRouteContext } from '../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * GET /api/trips/list - list saved trips for the current owner.
 * Anonymous sessions see only the trips they bookmarked; authenticated
 * users see only theirs. Order: most recently bookmarked first.
 *
 * Slice C2 - each trip in the response is enriched with
 * `monitoringEvents: MonitoringEvent[]` (unacknowledged events for
 * that trip). The MonitoringRunner is called inline; throttled checks
 * skip work when a trip was checked recently. Failures in monitoring
 * never block the trips list - the response always returns the trips.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const ctx = await resolveRouteContext(req);
  try {
    const trips = await ctx.store.listTrips({
      ownerKind: ctx.owner.ownerKind,
      ownerId: ctx.owner.ownerId,
    });

    let monitoringByTrip: Map<string, MonitoringEvent[]>;
    try {
      const monitoring = getMonitoringSubsystem();
      monitoringByTrip = await monitoring.runner.checkOwner({
        owner: { ownerKind: ctx.owner.ownerKind, ownerId: ctx.owner.ownerId },
        trips,
      });
    } catch (err) {
      console.warn('[trips/list] monitoring runner failed; returning trips without events', err);
      monitoringByTrip = new Map();
    }

    const enrichedTrips = trips.map((t) => ({
      ...t,
      monitoringEvents: monitoringByTrip.get(t.id) ?? [],
    }));

    return jsonResponse({ trips: enrichedTrips }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    console.error('[trips/list] failed', err);
    return jsonResponse(
      { error: 'list failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
