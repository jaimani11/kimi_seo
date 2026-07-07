import type { NextRequest } from 'next/server';
import { jsonResponse, resolveRouteContext } from '../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * GET /api/trips/[tripId] - fetch one saved trip. Returns 404 if the
 * current owner doesn't own it (no leakage between owners).
 *
 * DELETE /api/trips/[tripId] - unbookmark. 404 if not owned.
 */

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { tripId } = await params;
  const ctx = await resolveRouteContext(req);
  try {
    const trip = await ctx.store.getTrip({
      ownerKind: ctx.owner.ownerKind,
      ownerId: ctx.owner.ownerId,
      tripId,
    });
    if (!trip) {
      return jsonResponse({ error: 'not found' }, { status: 404 }, ctx.setCookie);
    }
    return jsonResponse({ trip }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    console.error('[trips/[tripId] GET] failed', err);
    return jsonResponse(
      { error: 'fetch failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { tripId } = await params;
  const ctx = await resolveRouteContext(req);
  try {
    const deleted = await ctx.store.deleteTrip({
      ownerKind: ctx.owner.ownerKind,
      ownerId: ctx.owner.ownerId,
      tripId,
    });
    if (!deleted) {
      return jsonResponse({ error: 'not found' }, { status: 404 }, ctx.setCookie);
    }
    return jsonResponse({ ok: true }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    console.error('[trips/[tripId] DELETE] failed', err);
    return jsonResponse(
      { error: 'delete failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
