import type { NextRequest } from 'next/server';
import { getBillingSubsystem } from '@lib/billing';
import { jsonResponse, resolveRouteContext } from '../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * GET /api/billing/entitlement
 *
 * Returns the current owner's entitlement. Used by:
 *   - The post-checkout return page, which polls until the webhook
 *     flips the subscription to 'active' (or 'trialing').
 *   - The workspace shell, to render the small "Premium" badge.
 *
 * Anonymous owners always get free; the cookie session is established
 * on first call so subsequent checkout attempts have a stable owner key.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const ctx = await resolveRouteContext(req);
  const { provider } = getBillingSubsystem();
  try {
    const entitlement = await provider.getEntitlement({
      ownerKind: ctx.owner.ownerKind,
      ownerId: ctx.owner.ownerId,
    });
    return jsonResponse(
      {
        plan: entitlement.plan,
        source: entitlement.source,
        premiumUntil: entitlement.premiumUntil ? entitlement.premiumUntil.toISOString() : null,
      },
      { status: 200 },
      ctx.setCookie,
    );
  } catch (err) {
    console.error('[billing/entitlement] failed', err);
    return jsonResponse(
      { error: 'entitlement-failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
