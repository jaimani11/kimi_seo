import type { NextRequest } from 'next/server';
import { jsonResponse, resolveRouteContext } from '../../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/trips/[tripId]/resurface - owner-gated. Primes the
 * SessionStore with a synthetic TurnRecord so refining a resurfaced
 * saved trip works (the orchestrator's `getTurn(priorProposalRef.turnId)`
 * lookup finds it). Idempotent - putTurn overwrites by turnId.
 *
 * Why a separate endpoint instead of doing it on saveTrip: most saved
 * trips never get refined. Lazy-priming on resurface keeps the saveTrip
 * path lean and only pays the write when the user actually opens a
 * saved trip on the canvas.
 */

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<Response> {
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

    // Synthetic turnId mirrors the workspace's resurface convention
    // (`trip.id` is what the workspace store uses as turnId for
    // resurfaced trips). Refines from this turn carry the same
    // priorProposalRef.turnId, which now resolves to this record.
    await ctx.store.putTurn({
      turnId: trip.id,
      sessionId: ctx.auth.sessionId,
      type: 'compose',
      rawInput: trip.intent.rawInput,
      intent: trip.intent,
      proposal: trip.proposal,
      durationMs: 0,
      completedAt: Date.parse(trip.bookmarkedAt) || Date.now(),
    });

    return jsonResponse({ ok: true, turnId: trip.id }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    console.error('[trips/resurface] failed', err);
    return jsonResponse(
      { error: 'resurface failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
