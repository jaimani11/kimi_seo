import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@lib/admin/require-admin';
import { findCityBySlug } from '@lib/seo/cities';
import { generateCitySocialPack } from '@lib/social/generator';

/**
 * POST /api/social/generate
 *   body: { citySlug: string, skipSample?: boolean, forceTemplate?: boolean }
 *   returns: CitySocialPack
 *
 * Admin-only. Generates a social pack for one city using whichever
 * mode is available (sample > LLM > template). The admin UI uses this
 * to populate the per-city view + to trigger regeneration on demand.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  citySlug: z.string().min(2).max(60),
  skipSample: z.boolean().optional(),
  forceTemplate: z.boolean().optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid request', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const city = findCityBySlug(parsed.data.citySlug);
  if (!city) {
    return Response.json({ error: 'unknown city slug' }, { status: 404 });
  }

  try {
    const pack = await generateCitySocialPack(city, {
      ...(parsed.data.skipSample !== undefined ? { skipSample: parsed.data.skipSample } : {}),
      ...(parsed.data.forceTemplate !== undefined
        ? { forceTemplate: parsed.data.forceTemplate }
        : {}),
    });
    return Response.json(pack);
  } catch (err) {
    console.error('[api/social/generate] failed', err);
    return Response.json(
      { error: 'generation failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
