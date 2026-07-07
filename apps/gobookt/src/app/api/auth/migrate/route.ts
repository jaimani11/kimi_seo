import type { NextRequest } from 'next/server';
import { getServerAuth } from '@lib/auth';
import { getSessionStore } from '@lib/session/factory';
import { jsonResponse } from '../../_lib/route-context';

export const runtime = 'nodejs';

/**
 * POST /api/auth/migrate - copies trips owned by the caller's anonymous
 * session id to their newly-authenticated userId. Idempotent: a second
 * call (or a duplicate from the post-sign-in client effect) returns
 * { alreadyMigrated: true } and does nothing.
 *
 * Trigger: client calls this after Clerk reports isSignedIn flips to
 * true. Server-side trust: we read userId from auth() (Clerk-signed)
 * and sessionId from the cookie (untrusted but bound to the user that
 * just signed in - anyone calling with a different cookie would only
 * be migrating their own anonymous bucket).
 */
export async function POST(_req: NextRequest): Promise<Response> {
  const auth = await getServerAuth();
  if (auth.kind !== 'authenticated') {
    return jsonResponse({ error: 'not signed in' }, { status: 401 });
  }

  const store = getSessionStore();
  try {
    const result = await store.migrateAnonymousToUser({
      fromSessionId: auth.sessionId,
      toUserId: auth.userId,
    });
    return jsonResponse({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    console.error('[auth/migrate] failed', err);
    return jsonResponse(
      { error: 'migrate failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
