import type { NextRequest } from 'next/server';
import { requireAdmin } from '@lib/admin/require-admin';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import { runMarketingScheduler } from '@lib/marketing/scheduler';
import { MARKETING_PLATFORMS, type MarketingPlatform } from '@lib/marketing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/marketing/run-now
 *
 * Body: { platform?: 'pinterest' | 'instagram' | 'tiktok', forceRun?: boolean }
 *
 * Manual trigger from the admin UI. Defaults to running every
 * platform whose dailyCount > 0 with forceRun=true so an operator
 * can preview content without flipping the live switch.
 */
export async function POST(req: NextRequest): Promise<Response> {
  await requirePasswordAdmin();
  await requireAdmin();
  let body: { platform?: string; forceRun?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // Empty body is fine — defaults apply.
  }
  const onlyPlatform =
    body.platform && (MARKETING_PLATFORMS as readonly string[]).includes(body.platform)
      ? (body.platform as MarketingPlatform)
      : undefined;
  const summary = await runMarketingScheduler({
    ...(onlyPlatform ? { onlyPlatform } : {}),
    forceRun: body.forceRun ?? true,
  });
  return Response.json({ ok: true, summary });
}
