import type { NextRequest } from 'next/server';
import { getMonitoringSubsystem } from '@lib/monitoring';
import { jsonResponse, resolveRouteContext } from '../../../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/trips/[tripId]/monitoring/acknowledge
 *
 * Marks every unacknowledged monitoring event for the given trip as
 * read for the calling owner. Idempotent - re-calling is a no-op.
 *
 * Used by the saved-trips panel: when the user clicks a row to
 * resurface, the panel also fires this endpoint to clear the badge.
 */

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { tripId } = await params;
  const ctx = await resolveRouteContext(req);

  // Defense-in-depth: confirm the caller owns this trip before
  // acknowledging - prevents one anonymous session from clearing
  // another's badges if the route is hit with a foreign tripId.
  const trip = await ctx.store.getTrip({
    ownerKind: ctx.owner.ownerKind,
    ownerId: ctx.owner.ownerId,
    tripId,
  });
  if (!trip) {
    return jsonResponse({ error: 'not found' }, { status: 404 }, ctx.setCookie);
  }

  try {
    const monitoring = getMonitoringSubsystem();
    const flipped = await monitoring.store.acknowledgeAll({
      ownerKind: ctx.owner.ownerKind,
      ownerId: ctx.owner.ownerId,
      tripId,
    });
    return jsonResponse({ ok: true, acknowledged: flipped }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    console.error('[monitoring/acknowledge] failed', err);
    return jsonResponse(
      { error: 'acknowledge failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
