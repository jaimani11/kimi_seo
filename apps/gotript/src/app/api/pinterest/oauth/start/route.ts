import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import { getSiteOrigin } from '@lib/site/origin';
import { buildPinterestAuthorizeUrl } from '@adored/marketing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/pinterest/oauth/start — begin the one-time Pinterest
 * authorization that mints the long-lived refresh token. Admin-gated.
 *
 * Prereqs: PINTEREST_APP_ID env set, and this site's callback URL
 * registered as a Redirect URI in the Pinterest app settings:
 *   {SITE_URL}/api/pinterest/oauth/callback
 */
export async function GET(): Promise<Response> {
  await requirePasswordAdmin({ returnTo: '/api/pinterest/oauth/start' });
  const appId = (process.env.PINTEREST_APP_ID ?? '').trim();
  if (!appId) {
    return new Response(
      'PINTEREST_APP_ID is not set. Add it (from developers.pinterest.com) and redeploy.',
      { status: 500 },
    );
  }
  const state = randomUUID();
  const jar = await cookies();
  jar.set('pin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/pinterest/oauth',
    maxAge: 600,
  });
  redirect(
    buildPinterestAuthorizeUrl({
      appId,
      redirectUri: `${getSiteOrigin()}/api/pinterest/oauth/callback`,
      state,
    }),
  );
}
