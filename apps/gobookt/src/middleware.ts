import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerFeatures } from '@lib/env';
import { resolveSession, SESSION_COOKIE } from '@lib/session/anonymous';
import { getSiteOrigin } from '@lib/site/origin';
import { isUserAgentBlocked, classifyBot } from '@adored/seo-routing/crawler-policy';

/**
 * Canonical-host redirect. Forces every production request onto the single
 * www host from getSiteOrigin(), so Google never sees two live copies of a
 * page (the "Duplicate without user-selected canonical" trap: apex AND www
 * both returning 200). 308 = permanent + method-preserving. Path and query
 * are preserved.
 *
 * Skips localhost and *.vercel.app previews so local dev and Vercel preview
 * deployments keep working on their own hostnames. The canonical host is
 * derived from the brand's own siteUrl, so this logic is identical across
 * every site and copies verbatim to new ones.
 */
function canonicalHostRedirect(req: NextRequest): NextResponse | null {
  const host = req.headers.get('host');
  if (!host) return null;
  if (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.endsWith('.vercel.app')
  ) {
    return null;
  }

  let canonicalHost: string;
  try {
    canonicalHost = new URL(getSiteOrigin()).host;
  } catch {
    return null;
  }
  if (!canonicalHost || host === canonicalHost) return null;

  const url = req.nextUrl.clone();
  url.host = canonicalHost;
  url.protocol = 'https:';
  url.port = '';
  return NextResponse.redirect(url, 308);
}

/**
 * Anonymous-session minting + Clerk delegation.
 *
 * Single source of truth for `stayscout-session`: when missing,
 * middleware mints it AND propagates it onto `request.cookies` so
 * downstream route handlers see the same id via `cookies()` /
 * `getServerAuth()`. Without that propagation, the route would re-
 * mint a different uuid (each `resolveSession(null)` call returns
 * a fresh one) - owner attribution would diverge from the cookie
 * the client receives, and trips saved on request 1 would be
 * invisible on request 2.
 *
 * Order of responsibilities:
 *
 *   0. Canonical-host redirect — before anything else. No point minting a
 *      session on a request we're about to 308 away.
 *
 *   1. Mint the anonymous session cookie if it's missing (on the inbound
 *      request so the route sees it, and the outbound response so the
 *      client persists it).
 *
 *   2. Publish the pathname as `x-pathname` so the root layout can emit a
 *      self-referencing <link rel="canonical">. Pathname only — query
 *      strings are intentionally dropped so ?utm=… / ?ss=… variants all
 *      consolidate onto one canonical URL.
 *
 *   3. Delegate to Clerk's middleware when auth is configured. Otherwise
 *      NextResponse.next() - keeps Clerk completely off the keyless build
 *      path. The dynamic import ensures Clerk's runtime isn't evaluated in
 *      keyless builds.
 */
export default async function middleware(req: NextRequest) {
  const hostRedirect = canonicalHostRedirect(req);
  if (hostRedirect) return hostRedirect;

  // Reversible per-bot hard block (AI_BOTS_BLOCKED). robots.txt is advisory;
  // a bot that ignores it still costs a function invocation per hit. When an
  // operator lists a bot in AI_BOTS_BLOCKED we 403 it at the edge here, before
  // any session mint or downstream render. Empty env → nothing blocked (GEO
  // reach preserved). Reverse by clearing the env var + redeploying — no
  // code change (Vercel binds env vars at deploy time).
  const userAgent = req.headers.get('user-agent');
  if (isUserAgentBlocked(userAgent)) {
    console.info('[crawler-block]', {
      bot: classifyBot(userAgent) ?? 'unknown',
      path: req.nextUrl.pathname,
    });
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Read the inbound cookie via NextRequest.cookies (typed) so we can
  // mutate it for downstream consumers if minting.
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  const session = existing ? { sessionId: existing, isNew: false as const } : resolveSession(null);

  // Propagate the minted id back onto the inbound request so any
  // route handler that reads cookies() sees it. This is the canonical
  // Next.js pattern for "I'm setting a cookie now AND want this same
  // request to act as if it were already set." Mutating req.cookies here
  // also updates the underlying `cookie` header, which we copy below.
  if (session.isNew) {
    req.cookies.set(SESSION_COOKIE, session.sessionId);
  }

  // Copy the (now cookie-updated) request headers and add x-pathname so the
  // layout can build a canonical URL. Copying AFTER the cookie mutation is
  // what keeps the session cookie flowing to the route handler.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);

  let res: NextResponse | undefined;
  if (getServerFeatures().auth) {
    const { clerkMiddleware } = await import('@clerk/nextjs/server');
    const clerkRes = await clerkMiddleware()(req, undefined as never);
    res = clerkRes instanceof NextResponse ? clerkRes : undefined;
  }
  if (!res) {
    // Pass `request: { headers }` so the mutated request headers (session
    // cookie + x-pathname) survive to the route handler.
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (session.isNew) {
    res.cookies.set(SESSION_COOKIE, session.sessionId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 90,
      sameSite: 'lax',
      httpOnly: true,
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
