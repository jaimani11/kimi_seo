import type { NextRequest } from 'next/server';
import { requireAdmin } from '@lib/admin/require-admin';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import { runMarketingScheduler, getRecentPosts } from '@lib/marketing/scheduler';
import { MARKETING_PLATFORMS, type MarketingPlatform } from '@lib/marketing/types';

export const runtime = 'nodejs';
// Full posting run: parallel pack generation + serial pin posting.
// Hobby's 10s default kills the run before the first pin — raise to
// the plan ceiling.
export const maxDuration = 60;
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

  // Surface the concrete per-pin outcome from THIS run. The store is
  // in-memory on serverless, so the errors only exist inside this same
  // lambda — read them here or lose them. Deduped error messages make
  // a failing run self-diagnosing instead of a silent "failed: 10".
  const recent = await getRecentPosts(30);
  const justNow = recent.filter((p) => p.scheduledFor === summary.startedAt);
  const errorCounts = new Map<string, number>();
  let sampleExternalUrl: string | undefined;
  for (const p of justNow) {
    if (p.status === 'failed' && p.errorMessage) {
      errorCounts.set(p.errorMessage, (errorCounts.get(p.errorMessage) ?? 0) + 1);
    }
    if (p.status === 'posted' && p.externalUrl && !sampleExternalUrl) {
      sampleExternalUrl = p.externalUrl;
    }
  }
  const errors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([message, count]) => ({ message, count }));

  return Response.json({
    ok: true,
    diag: 3, // bump on each diagnostic deploy so watchers detect it
    summary,
    ...(errors.length > 0 ? { errors } : {}),
    ...(sampleExternalUrl ? { samplePinUrl: sampleExternalUrl } : {}),
  });
}
