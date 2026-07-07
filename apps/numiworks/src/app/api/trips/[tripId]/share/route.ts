import type { NextRequest } from 'next/server';
import { jsonResponse, resolveRouteContext } from '../../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/trips/[tripId]/share - owner-gated. Mints a share slug for
 * the trip if one doesn't exist; returns the existing slug otherwise.
 * Idempotent. 404 if the trip isn't owned by the caller.
 *
 * Response: { slug, url } where url is the absolute /t/[slug] link.
 */

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { tripId } = await params;
  const ctx = await resolveRouteContext(req);

  try {
    const slug = await ctx.store.mintShareSlug({
      ownerKind: ctx.owner.ownerKind,
      ownerId: ctx.owner.ownerId,
      tripId,
    });
    if (!slug) {
      return jsonResponse({ error: 'not found' }, { status: 404 }, ctx.setCookie);
    }
    // Build absolute URL - works behind a proxy because we use the
    // request's own host header. NEXT_PUBLIC_APP_URL would be more
    // robust in production; B3 uses the host so dev works zero-config.
    const origin = req.nextUrl.origin;
    return jsonResponse(
      { ok: true, slug, url: `${origin}/t/${slug}` },
      { status: 200 },
      ctx.setCookie,
    );
  } catch (err) {
    console.error('[trips/share] failed', err);
    return jsonResponse(
      { error: 'share failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
