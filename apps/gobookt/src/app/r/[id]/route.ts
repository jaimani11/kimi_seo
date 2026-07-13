import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerAuth, ownerOf } from '@lib/auth';
import { getSessionStore } from '@lib/session/factory';
import { decodeAffiliateLink } from '@lib/affiliate/link-encoder';
import { decorateOutboundUrl } from '@lib/affiliate/decorate-outbound';
import { describeBookingCjUrl } from '@lib/affiliate/booking-cj-links';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /r/[id] - short affiliate redirect with self-contained payload.
 *
 * The `[id]` segment is a base64url-encoded JSON payload (see
 * `lib/affiliate/link-encoder.ts`) carrying:
 *   - the outbound URL (must pass the host allowlist on decode)
 *   - the providerId for click attribution
 *   - optional stayId, turnId, conversationId for analytics
 *
 * Flow:
 *   1. Decode + validate (decoder re-checks the allowlist as a
 *      tamper guard).
 *   2. Resolve the owner from cookie/auth.
 *   3. Record an AffiliateClick row keyed on the current owner.
 *      Failures are logged but never block the 302 - the user
 *      clicked, they should land on the provider regardless of our
 *      analytics health.
 *   4. 302 to the decoded URL.
 *
 * Why a separate route from /api/go: shorter URLs (better for
 * sharing/embedding), self-contained payload (no query-string
 * juggling), single canonical entrypoint for affiliate clicks. The
 * existing /api/go stays in place for back-compat with anything
 * already linking to it.
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { id } = await params;
  const payload = decodeAffiliateLink(id);
  if (!payload) {
    // 404 (not 400) so hostile crawlers don't get a signal that
    // they hit a real entrypoint with a malformed payload.
    return new Response('Not found', { status: 404 });
  }

  const auth = await getServerAuth();
  const owner = ownerOf(auth);

  // Append gobookt UTM + turn-id tracking to the outbound URL so
  // every affiliate click is attributable in the partner dashboard
  // and joinable to the originating turn in our own /admin/clicks.
  const outbound = decorateOutboundUrl(payload.url, {
    campaign: payload.providerId,
    ...(payload.stayId ? { content: payload.stayId } : {}),
    ...(payload.turnId ? { turnId: payload.turnId } : {}),
  });

  try {
    await getSessionStore().recordClick({
      ownerKind: owner.ownerKind,
      ownerId: owner.ownerId,
      sessionId: auth.sessionId,
      stayId: payload.stayId ?? `${payload.providerId}:unknown`,
      providerId: payload.providerId,
      affiliateUrl: outbound,
      ...(payload.turnId ? { turnId: payload.turnId } : {}),
      ...(payload.conversationId ? { conversationId: payload.conversationId } : {}),
    });
  } catch (err) {
    console.error('[r] recordClick failed', err);
  }

  // Truncated log line so ops can see traffic + provider attribution
  // without leaking the full URL into logs at scale.
  const desc = describeBookingCjUrl(outbound);
  console.info('[r] redirecting', {
    site: 'gobookt',
    providerId: payload.providerId,
    stayId: payload.stayId ?? null,
    turnId: payload.turnId ?? null,
    tracked: desc.tracked,
    cjDomain: desc.cjDomain,
    creativeId: desc.creativeId,
  });

  // 302, not 301 - affiliate URLs may change campaign params; we don't
  // want browsers caching the redirect.
  return NextResponse.redirect(outbound, 302);
}
