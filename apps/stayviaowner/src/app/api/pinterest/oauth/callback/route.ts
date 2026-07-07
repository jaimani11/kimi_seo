import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import { getSiteOrigin } from '@lib/site/origin';
import { exchangeCodeForTokens } from '@adored/marketing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/pinterest/oauth/callback — Pinterest redirects here after
 * the operator authorizes. Exchanges the code and DISPLAYS the
 * refresh token with copy-paste env instructions. Nothing is stored
 * server-side; env vars are the persistence layer.
 */
export async function GET(req: NextRequest): Promise<Response> {
  await requirePasswordAdmin({ returnTo: '/api/pinterest/oauth/start' });
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const jar = await cookies();
  const expected = jar.get('pin_oauth_state')?.value;
  jar.delete('pin_oauth_state');
  if (!code) {
    return html(400, `<h2>Missing ?code</h2><p>Start again at /api/pinterest/oauth/start</p>`);
  }
  if (!expected || state !== expected) {
    return html(400, `<h2>State mismatch</h2><p>Possible CSRF or expired attempt (10 min). Start again at /api/pinterest/oauth/start</p>`);
  }
  const appId = (process.env.PINTEREST_APP_ID ?? '').trim();
  const appSecret = (process.env.PINTEREST_APP_SECRET ?? '').trim();
  if (!appId || !appSecret) {
    return html(500, `<h2>Missing PINTEREST_APP_ID / PINTEREST_APP_SECRET</h2>`);
  }
  try {
    const grant = await exchangeCodeForTokens({
      appId,
      appSecret,
      code,
      redirectUri: `${getSiteOrigin()}/api/pinterest/oauth/callback`,
    });
    const refreshExpiry = grant.refreshTokenExpiresAt
      ? new Date(grant.refreshTokenExpiresAt).toDateString()
      : '~1 year from now';
    return html(
      200,
      `<h2>✅ Pinterest authorized</h2>
       <p>Scopes: <code>${grant.scope ?? 'unknown'}</code></p>
       <p>Add this to <strong>all four Vercel projects</strong> (Production), then redeploy each:</p>
       <pre>PINTEREST_REFRESH_TOKEN=${grant.refreshToken ?? '(no refresh token returned!)'}</pre>
       <p>Refresh token valid until: <strong>${refreshExpiry}</strong> — re-run this flow before then.</p>
       <p>Access tokens now mint + refresh automatically; the static PINTEREST_ACCESS_TOKEN env var is no longer needed (kept as fallback if present).</p>`,
    );
  } catch (err) {
    return html(
      502,
      `<h2>Token exchange failed</h2><pre>${
        err instanceof Error ? err.message : String(err)
      }</pre><p>Check the Redirect URI in Pinterest app settings matches exactly: <code>${getSiteOrigin()}/api/pinterest/oauth/callback</code></p>`,
    );
  }
}

function html(status: number, body: string): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">
     <body style="font-family:-apple-system,sans-serif;max-width:44rem;margin:3rem auto;padding:0 1rem;color:#0f2340">
     ${body}</body>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}
