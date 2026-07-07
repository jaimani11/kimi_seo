import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { viatorProviderFromEnv } from '@/providers/viator';
import { ExperienceSchema, type Experience } from '@core/experience';

export const runtime = 'nodejs';

/**
 * Cache for 5 minutes at the edge / 1 hour stale-while-revalidate.
 * Partner product content updates daily; the homepage rail can be a
 * little stale without anyone noticing, and we don't want to hammer
 * the partner API on every page view.
 */
export const revalidate = 300;

/**
 * Vercel function cap. Partner freetext search ~800ms steady-state,
 * but a cold start + slow upstream can push past Vercel's 10s
 * Hobby default. 30s gives us comfortable headroom without making
 * a stuck upstream call hold the function indefinitely.
 */
export const maxDuration = 30;

/**
 * GET /api/discovery/experiences?query=<term>&limit=<n>&currency=<iso>
 *
 * Server-side Viator search. The API key never crosses the network to
 * the browser; the response is a sanitized `Experience[]`.
 *
 * Returns 503 when `VIATOR_API_KEY` isn't configured so the homepage
 * can gracefully degrade (the rail shows its empty state instead of
 * erroring out). 502 indicates the partner API itself failed.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const url = req.nextUrl;
  const query = (url.searchParams.get('query') ?? '').trim();
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }
  const limitRaw = url.searchParams.get('limit');
  const limit = clampInt(parseInt(limitRaw ?? '', 10), 1, 24, 12);
  const currency = (url.searchParams.get('currency') ?? '').trim() || undefined;

  const provider = viatorProviderFromEnv();
  if (!provider) {
    return NextResponse.json(
      { error: 'viator-not-configured', experiences: [] },
      { status: 503, headers: { 'cache-control': 'public, max-age=60' } },
    );
  }

  try {
    const controller = new AbortController();
    const result = await provider.search(
      {
        searchTerm: query,
        ...(currency ? { currency } : {}),
        limit,
      },
      { signal: controller.signal, secrets: {} },
    );

    // Strip empties + parse defensively so a malformed product
    // doesn't poison the whole rail. Mapper already softened the
    // common cases; this is the safety net.
    const experiences: Experience[] = [];
    for (const e of result.experiences) {
      const parsed = ExperienceSchema.safeParse(e);
      if (parsed.success) experiences.push(parsed.data);
    }

    return NextResponse.json(
      { experiences, freshness: result.freshness },
      {
        status: 200,
        headers: {
          'cache-control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Don't leak provider internals (URLs, keys). The shared
    // ProviderError already masks query strings; we only re-emit
    // the human message.
    return NextResponse.json(
      { error: 'viator-upstream-failed', detail: message.slice(0, 240) },
      { status: 502, headers: { 'cache-control': 'no-store' } },
    );
  }
}

function clampInt(n: number, lo: number, hi: number, fallback: number): number {
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}
