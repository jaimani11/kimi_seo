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
    const refreshToken = grant.refreshToken ?? '';
    return html(
      200,
      `<h2>✅ Pinterest authorized</h2>
       <p>Scopes: <code>${grant.scope ?? 'unknown'}</code></p>
       <p>Set <code>PINTEREST_REFRESH_TOKEN</code> to the value below on <strong>all four Vercel projects</strong> (Production), then redeploy each. It's long — use the <em>Copy</em> button so you don't truncate it:</p>
       <textarea id="tok" readonly rows="4" onclick="this.select()" style="width:100%;box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.4;padding:10px;border:1px solid #ccd;border-radius:8px;word-break:break-all;white-space:pre-wrap;color:#0f2340;background:#f7f8fa">${refreshToken || '(no refresh token returned!)'}</textarea>
       <p style="margin-top:10px">
         <button id="copy" type="button" style="padding:9px 16px;font-size:14px;font-weight:600;border-radius:8px;border:0;background:#006ce4;color:#fff;cursor:pointer">Copy token</button>
         <span id="msg" style="margin-left:10px;color:#0a7d33;font-weight:600"></span>
         <span style="margin-left:10px;color:#667">expected length: <strong>${refreshToken.length}</strong> characters</span>
       </p>
       <p style="color:#667;font-size:0.9em">Tip: after you paste it into Vercel and it's still masked, you can't see the length — but if posting still 401s, re-run this flow and compare this number.</p>
       <p>Refresh token valid until: <strong>${refreshExpiry}</strong> — re-run this flow before then.</p>
       <p>Access tokens now mint + refresh automatically; the static PINTEREST_ACCESS_TOKEN env var is no longer needed (kept as fallback if present).</p>
       <script>
         (function(){
           var b=document.getElementById('copy'),t=document.getElementById('tok'),m=document.getElementById('msg');
           if(!b||!t)return;
           b.addEventListener('click',function(){
             t.select();t.setSelectionRange(0,t.value.length);
             function ok(){m.textContent='Copied all '+t.value.length+' chars \\u2713';}
             if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(ok,function(){document.execCommand('copy');ok();});}
             else{document.execCommand('copy');ok();}
           });
         })();
       </script>`,
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
