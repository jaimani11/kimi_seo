import type { NextRequest } from 'next/server';
import { isCronAuthorized } from '@lib/admin/cron-auth';
import { runMarketingScheduler } from '@lib/marketing/scheduler';
import { pinterestPostedToday } from '@adored/marketing';

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
// Full posting run: parallel pack generation + serial pin posting.
// Hobby's 10s default kills the run before the first pin — raise to
// the plan ceiling.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  // Idempotency guard — same durable-record check the catch-up cron
  // uses. An admin "Run now" earlier in the day (or a retried cron)
  // must not double-post; the board is the source of truth. Unlike
  // the catch-up, an UNVERIFIABLE board (null) still runs: this is
  // the primary daily and a flaky read shouldn't cost the whole day.
  // (Pinterest is the only live adapter today — revisit the guard's
  // scope when Instagram/TikTok go live.)
  const boardId = (process.env.PINTEREST_BOARD_ID ?? '').trim();
  const posted = await pinterestPostedToday(boardId);
  if (posted === true) {
    return Response.json({ ok: true, action: 'skip', reason: 'already posted today' });
  }
  try {
    const summary = await runMarketingScheduler({});
    return Response.json({ ok: true, action: 'ran', summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/marketing-daily] scheduler threw', err);
    return Response.json({ ok: false, error: message }, { status: 200 });
  }
}

function isAuthorized(req: NextRequest): boolean {
  // Fail closed + timing-safe — see lib/admin/cron-auth.
  return isCronAuthorized(req.headers.get('authorization'));
}
