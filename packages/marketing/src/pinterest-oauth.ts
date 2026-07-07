/**
 * Pinterest OAuth 2.0 — authorize + automatic refresh.
 *
 * Why: access tokens generated in Pinterest's developer UI expire
 * (~30 days) and killed the posting pipeline silently. The durable
 * setup is OAuth: a one-time browser authorization mints a
 * long-lived REFRESH token (~1 year); each serverless instance then
 * exchanges it for a fresh 30-day ACCESS token on demand and caches
 * it in memory. Refresh tokens are not rotated on use, so every
 * instance can refresh independently from the same env value.
 *
 * Env (set on every brand's Vercel project):
 *   PINTEREST_APP_ID         — from developers.pinterest.com
 *   PINTEREST_APP_SECRET     — same page
 *   PINTEREST_REFRESH_TOKEN  — minted once via /api/pinterest/oauth/start
 *
 * PINTEREST_ACCESS_TOKEN (static) remains supported as a fallback for
 * quick manual setups; the refresh trio wins when present.
 *
 * Annual maintenance: the refresh token itself expires after ~365
 * days — re-run the authorize flow once a year. checkPinterestStatus
 * surfaces the expiry date so the admin UI can warn ahead of time.
 */

const OAUTH_TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token';
const AUTHORIZE_URL = 'https://www.pinterest.com/oauth/';

export const PINTEREST_SCOPES = [
  'boards:read',
  'boards:write',
  'pins:read',
  'pins:write',
] as const;

export interface PinterestOAuthEnv {
  appId: string;
  appSecret: string;
  refreshToken: string;
}

/** The refresh trio from env, or null when not fully configured. */
export function getPinterestOAuthEnv(): PinterestOAuthEnv | null {
  const appId = (process.env.PINTEREST_APP_ID ?? '').trim();
  const appSecret = (process.env.PINTEREST_APP_SECRET ?? '').trim();
  const refreshToken = (process.env.PINTEREST_REFRESH_TOKEN ?? '').trim();
  if (!appId || !appSecret || !refreshToken) return null;
  return { appId, appSecret, refreshToken };
}

export function buildPinterestAuthorizeUrl(args: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', args.appId);
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', PINTEREST_SCOPES.join(','));
  url.searchParams.set('state', args.state);
  return url.toString();
}

export interface PinterestTokenGrant {
  accessToken: string;
  /** Epoch ms when the access token expires. */
  accessTokenExpiresAt: number;
  refreshToken?: string;
  /** Epoch ms when the refresh token expires (when Pinterest reports it). */
  refreshTokenExpiresAt?: number;
  scope?: string;
}

function basicAuth(appId: string, appSecret: string): string {
  return `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`;
}

async function tokenRequest(
  appId: string,
  appSecret: string,
  form: Record<string, string>,
): Promise<PinterestTokenGrant> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: basicAuth(appId, appSecret),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(form).toString(),
  });
  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    scope?: string;
    message?: string;
    code?: number;
  };
  if (!res.ok || !body.access_token) {
    throw new Error(
      `Pinterest token endpoint ${res.status}: ${body.message ?? JSON.stringify(body).slice(0, 200)}`,
    );
  }
  const now = Date.now();
  return {
    accessToken: body.access_token,
    accessTokenExpiresAt: now + (body.expires_in ?? 2_592_000) * 1000,
    ...(body.refresh_token ? { refreshToken: body.refresh_token } : {}),
    ...(body.refresh_token_expires_in
      ? { refreshTokenExpiresAt: now + body.refresh_token_expires_in * 1000 }
      : {}),
    ...(body.scope ? { scope: body.scope } : {}),
  };
}

/** One-time exchange after the browser authorize redirect. */
export async function exchangeCodeForTokens(args: {
  appId: string;
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<PinterestTokenGrant> {
  return tokenRequest(args.appId, args.appSecret, {
    grant_type: 'authorization_code',
    code: args.code,
    redirect_uri: args.redirectUri,
  });
}

/** Mint a fresh ~30-day access token from the long-lived refresh token. */
export async function refreshAccessToken(args: {
  appId: string;
  appSecret: string;
  refreshToken: string;
}): Promise<PinterestTokenGrant> {
  return tokenRequest(args.appId, args.appSecret, {
    grant_type: 'refresh_token',
    refresh_token: args.refreshToken,
  });
}

// ── Managed token: instance-local cache over the env refresh token ──

let cached: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

/**
 * The access token the platform should use right now.
 *
 *   1. Refresh trio in env → cached access token, refreshed on demand.
 *   2. Static PINTEREST_ACCESS_TOKEN → returned as-is (legacy mode).
 *   3. Neither → null (callers stay in stub mode).
 */
export async function getManagedPinterestToken(): Promise<string | null> {
  const oauth = getPinterestOAuthEnv();
  if (!oauth) {
    const staticToken = (process.env.PINTEREST_ACCESS_TOKEN ?? '').trim();
    return staticToken.length > 0 ? staticToken : null;
  }
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
    return cached.token;
  }
  // Deduplicate concurrent refreshes within this instance.
  if (!inflight) {
    inflight = refreshAccessToken(oauth)
      .then((grant) => {
        cached = { token: grant.accessToken, expiresAt: grant.accessTokenExpiresAt };
        return grant.accessToken;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Which auth mode is active — surfaced in the admin status panel. */
export function describePinterestAuthMode(): 'oauth-refresh' | 'static-token' | 'none' {
  if (getPinterestOAuthEnv()) return 'oauth-refresh';
  if ((process.env.PINTEREST_ACCESS_TOKEN ?? '').trim()) return 'static-token';
  return 'none';
}

/** Test hook. */
export function _resetManagedPinterestToken(): void {
  cached = null;
  inflight = null;
}
