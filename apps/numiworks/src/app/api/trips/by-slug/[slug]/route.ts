import type { NextRequest } from 'next/server';
import { isValidShareSlug } from '@lib/session/share-slug';
import { getSessionStore } from '@lib/session/factory';

export const runtime = 'nodejs';

/**
 * GET /api/trips/by-slug/[slug] - PUBLIC, no auth. Returns the
 * sanitized SharedTrip (no ownerId, no rawInput). 400 if the slug is
 * malformed (cheap pre-DB check). 404 if not found.
 *
 * Cache: short edge cache (60s) is OK - slugs are immutable. Owner
 * deletes are reflected within the TTL; that's acceptable for share-
 * link UX.
 */

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { slug } = await params;

  if (!isValidShareSlug(slug)) {
    return Response.json({ error: 'invalid slug' }, { status: 400 });
  }

  try {
    const store = getSessionStore();
    const shared = await store.getTripBySlug(slug);
    if (!shared) {
      return Response.json({ error: 'not found' }, { status: 404 });
    }
    return Response.json(
      { trip: shared },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (err) {
    console.error('[trips/by-slug] failed', err);
    return Response.json(
      { error: 'fetch failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
