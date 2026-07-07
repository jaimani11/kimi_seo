import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BillingError } from '@core/billing';
import { getBillingSubsystem } from '@lib/billing';
import { jsonResponse, resolveRouteContext } from '../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/billing/checkout
 *
 * Starts a checkout flow for the current owner. Anonymous owners get
 * 401 - sign-in is required to subscribe (the existing B1 anonymous→
 * user migration carries any saved trips and memories over). Returns a
 * URL the client redirects to:
 *
 *   - StripeBillingProvider → real Stripe Checkout URL.
 *   - MockBillingProvider   → in-app `/billing/mock-checkout` URL.
 */

const BodySchema = z.object({
  returnUrl: z.string().min(1).max(2048),
  cancelUrl: z.string().min(1).max(2048),
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
    const { provider } = getBillingSubsystem();
    const { url } = await provider.createCheckoutSession({
      owner: { ownerKind: ctx.owner.ownerKind, ownerId: ctx.owner.ownerId },
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
    });
    return jsonResponse({ url }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    if (err instanceof BillingError) {
      const status = err.reason === 'sign-in-required' ? 401 : 400;
      return jsonResponse({ error: err.reason, message: err.message }, { status }, ctx.setCookie);
    }
    console.error('[billing/checkout] unexpected error', err);
    return jsonResponse(
      { error: 'checkout-failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
