import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BookingAgent } from '@agents/booking-agent';
import { BookingError } from '@core/booking';
import { getBookingSubsystem } from '@lib/booking';
import { jsonResponse, resolveRouteContext } from '../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/bookings/confirm
 *
 * Body: `{ idempotencyKey }`. The provider's `book(draft)` is idempotent
 * on this key - double-clicks coalesce to a single booking, network
 * retries are safe.
 *
 * Status mapping:
 *   - unknown-draft → 404
 *   - not-owner     → 403
 *   - provider-error → 502 (the failed Booking row is persisted; the
 *                       client surfaces the error and may offer retry)
 *   - any other     → 500
 */

const BodySchema = z.object({
  idempotencyKey: z.string().min(1),
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

  try {
    const subsystem = getBookingSubsystem();
    const agent = new BookingAgent(subsystem.provider, subsystem.store);
    const booking = await agent.confirmBooking({
      ownerKey: { ownerKind: ctx.owner.ownerKind, ownerId: ctx.owner.ownerId },
      idempotencyKey: body.idempotencyKey,
    });
    return jsonResponse({ booking }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    if (err instanceof BookingError) {
      const status =
        err.reason === 'unknown-draft'
          ? 404
          : err.reason === 'not-owner'
            ? 403
            : err.reason === 'provider-error'
              ? 502
              : 400;
      return jsonResponse({ error: err.reason, message: err.message }, { status }, ctx.setCookie);
    }
    console.error('[bookings/confirm] unexpected error', err);
    return jsonResponse(
      {
        error: 'confirm-failed',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
