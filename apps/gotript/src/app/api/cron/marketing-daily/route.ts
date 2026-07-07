import type { NextRequest } from 'next/server';
import { runMarketingScheduler } from '@lib/marketing/scheduler';

/**
 * GET /api/cron/marketing-daily
 *
 * Vercel Cron entry point. Configure `vercel.json` to call this
 * once a day (or as often as required). Vercel Cron sends a header
 * `authorization: Bearer ${CRON_SECRET}` so we can reject everyone
 * else.
 *
 * The handler always responds 200 with a JSON summary, even if
 * platforms fail individually. A non-200 response would put Vercel
 * Cron into a retry loop, and we don't want a flaky Pinterest API
 * to drag the whole job into restart hell.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const summary = await runMarketingScheduler({});
    return Response.json({ ok: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/marketing-daily] scheduler threw', err);
    return Response.json({ ok: false, error: message }, { status: 200 });
  }
}

function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET ?? '').trim();
  // When CRON_SECRET is unset, the endpoint is open. That's fine
  // for local dev — production deploys MUST set the secret.
  if (!secret) return true;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}
