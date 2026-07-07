import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BookingAgent } from '@agents/booking-agent';
import { BookingError, TravelerInfoSchema } from '@core/booking';
import { getBookingSubsystem } from '@lib/booking';
import { jsonResponse, resolveRouteContext } from '../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/bookings/draft
 *
 * Owner-gated. Body: `{ savedTripId, traveler }`. Returns the
 * structured draft (with idempotencyKey + total + cancellation policy)
 * without calling the provider yet - the user reviews the draft + then
 * POSTs to /api/bookings/confirm.
 *
 * 404 if the saved trip doesn't belong to the caller.
 * 401 if the caller is anonymous (Slice D requires auth to book -
 *   even a "free" booking, since we need a stable owner key for the
 *   confirmation page + admin trail).
 */

const BodySchema = z.object({
  savedTripId: z.string().min(1),
  traveler: TravelerInfoSchema,
});

export async function POST(req: NextRequest): Promise<Response> {
  const ctx = await resolveRouteContext(req);
  if (ctx.owner.ownerKind === 'session') {
    return jsonResponse({ error: 'sign-in-required' }, { status: 401 }, ctx.setCookie);
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = (await req.json()) as unknown;
    body = BodySchema.parse(raw);
  } catch (err) {
    return jsonResponse(
      {
        error: 'invalid-body',
        message: err instanceof Error ? err.message : 'invalid body',
      },
      { status: 400 },
      ctx.setCookie,
    );
  }

  const trip = await ctx.store.getTrip({
    ownerKind: ctx.owner.ownerKind,
    ownerId: ctx.owner.ownerId,
    tripId: body.savedTripId,
  });
  if (!trip) {
    return jsonResponse({ error: 'trip-not-found' }, { status: 404 }, ctx.setCookie);
  }

  try {
    const subsystem = getBookingSubsystem();
    const agent = new BookingAgent(subsystem.provider, subsystem.store);
    const draft = await agent.draftBooking({ savedTrip: trip, traveler: body.traveler });
    return jsonResponse({ draft }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    if (err instanceof BookingError) {
      return jsonResponse(
        { error: err.reason, message: err.message },
        { status: err.reason === 'invalid-traveler' ? 400 : 500 },
        ctx.setCookie,
      );
    }
    console.error('[bookings/draft] unexpected error', err);
    return jsonResponse(
      { error: 'draft-failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
