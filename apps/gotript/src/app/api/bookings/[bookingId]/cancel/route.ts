import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BookingAgent } from '@agents/booking-agent';
import { BookingError } from '@core/booking';
import { getBookingSubsystem } from '@lib/booking';
import { jsonResponse, resolveRouteContext } from '../../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/bookings/[bookingId]/cancel
 *
 * Owner-gated. Optional body: `{ reason }`. Idempotent: a second
 * cancel of an already-canceled booking returns the same booking
 * unchanged (200).
 *
 * Status mapping:
 *   - unknown-booking → 404
 *   - not-cancelable  → 409 (status doesn't allow cancel, or
 *                       free-until has passed)
 *   - any other       → 500
 */

interface RouteParams {
  params: Promise<{ bookingId: string }>;
}

const BodySchema = z.object({ reason: z.string().max(500).optional() }).optional();

export async function POST(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const ctx = await resolveRouteContext(req);
  const { bookingId } = await params;
  if (ctx.owner.ownerKind === 'session') {
    return jsonResponse({ error: 'sign-in-required' }, { status: 401 }, ctx.setCookie);
  }

  let reason: string | undefined;
  try {
    // Body is optional; accept empty body too.
    const text = await req.text();
    if (text.trim().length > 0) {
      const parsed = BodySchema.parse(JSON.parse(text) as unknown);
      reason = parsed?.reason;
    }
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

  try {
    const subsystem = getBookingSubsystem();
    const agent = new BookingAgent(subsystem.provider, subsystem.store);
    const booking = await agent.cancelBooking({
      ownerKey: { ownerKind: ctx.owner.ownerKind, ownerId: ctx.owner.ownerId },
      bookingId,
      ...(reason ? { reason } : {}),
    });
    return jsonResponse({ booking }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    if (err instanceof BookingError) {
      const status =
        err.reason === 'unknown-booking' ? 404 : err.reason === 'not-cancelable' ? 409 : 400;
      return jsonResponse({ error: err.reason, message: err.message }, { status }, ctx.setCookie);
    }
    console.error('[bookings/cancel] unexpected error', err);
    return jsonResponse(
      {
        error: 'cancel-failed',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
