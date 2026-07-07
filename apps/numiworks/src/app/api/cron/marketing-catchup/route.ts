import type { NextRequest } from 'next/server';
import { runMarketingScheduler } from '@lib/marketing/scheduler';
import { pinterestPostedToday } from '@adored/marketing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/marketing-catchup
 *
 * Second daily cron (a few hours after the primary). Self-healing for
 * missed 13:00 runs: checks the Pinterest BOARD (the durable record —
 * the marketing store is in-memory on serverless) and only runs the
 * batch when nothing was pinned today.
 *
 *   posted today  → no-op ("already ran")
 *   nothing today → run the full scheduler
 *   can't verify  → no-op (never risk double-posting on a flaky read)
 *
 * Note: a PARTIALLY-completed morning run counts as "posted" — the
 * daily rotation is deterministic per day, so re-running would
 * duplicate the pins that did land. One pin = day done.
 */
export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const boardId = (process.env.PINTEREST_BOARD_ID ?? '').trim();
  const posted = await pinterestPostedToday(boardId);
  if (posted === true) {
    return Response.json({ ok: true, action: 'skip', reason: 'already posted today' });
  }
  if (posted === null) {
    return Response.json({
      ok: true,
      action: 'skip',
      reason: 'could not verify board state — skipping to avoid double-posting',
    });
  }
  try {
    const summary = await runMarketingScheduler({});
    return Response.json({ ok: true, action: 'ran-catchup', summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/marketing-catchup] scheduler threw', err);
    return Response.json({ ok: false, error: message }, { status: 200 });
  }
}

function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET ?? '').trim();
  if (!secret) return true;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}
