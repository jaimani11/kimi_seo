import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerAuth, ownerOf } from '@lib/auth';
import { getSessionStore } from '@lib/session/factory';
import { isAllowedAffiliateHost } from '@lib/affiliate/allowlist';
import { findForeignAffiliateMarker } from '@lib/affiliate/numiworks-guard';
import { decorateOutboundUrl } from '@lib/affiliate/decorate-outbound';

export const runtime = 'nodejs';

/**
 * GET /api/go - affiliate redirect router.
 *
 * Flow:
 *   1. Parse query: s (stayId), p (providerId), u (affiliateUrl), t (turnId?), c (conversationId?)
 *   2. Validate u against the host allowlist - no open-redirect (would
 *      otherwise be usable for phishing with StayScout's domain).
 *   3. Resolve owner from auth (user) or session cookie (anonymous).
 *   4. Record an AffiliateClick row. Failures are logged but don't
 *      block the redirect - booking flow is sacred.
 *   5. 302 to u.
 *
 * The user lands on the provider with first-party cookies set on the
 * cross-origin hop, which is what affiliate networks need for tracking.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const params = req.nextUrl.searchParams;
  const stayId = params.get('s');
  const providerId = params.get('p');
  const affiliateUrl = params.get('u');
  const turnId = params.get('t') ?? undefined;
  const conversationId = params.get('c') ?? undefined;

  if (!stayId || !providerId || !affiliateUrl) {
    return Response.json({ error: 'missing required params' }, { status: 400 });
  }

  if (!isAllowedAffiliateHost(affiliateUrl)) {
    return Response.json({ error: 'redirect target not on allowlist' }, { status: 400 });
  }

  // Defense-in-depth: never redirect through a sibling-brand / off-strategy
  // affiliate id (gobookt/gotript/Booking.com). Fail closed on a leak.
  const foreignMarker = findForeignAffiliateMarker(affiliateUrl);
  if (foreignMarker) {
    console.error('[go] blocked cross-brand affiliate id in outbound url', { marker: foreignMarker });
    return Response.json({ error: 'cross-brand affiliate id not permitted' }, { status: 400 });
  }

  const auth = await getServerAuth();
  const owner = ownerOf(auth);

  const outbound = decorateOutboundUrl(affiliateUrl, {
    campaign: providerId,
    content: stayId,
    ...(turnId ? { turnId } : {}),
  });

  try {
    await getSessionStore().recordClick({
      ownerKind: owner.ownerKind,
      ownerId: owner.ownerId,
      sessionId: auth.sessionId,
      stayId,
      providerId,
      affiliateUrl: outbound,
      ...(turnId ? { turnId } : {}),
      ...(conversationId ? { conversationId } : {}),
    });
  } catch (err) {
    // DON'T block the booking - the user clicked Continue, they should
    // get to the provider regardless of our analytics health.
    console.error('[go] recordClick failed', err);
  }

  return NextResponse.redirect(outbound, 302);
}
