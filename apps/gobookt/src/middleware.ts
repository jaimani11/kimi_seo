import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerFeatures } from '@lib/env';
import { resolveSession, SESSION_COOKIE } from '@lib/session/anonymous';

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
 * Two responsibilities, in order:
 *
 *   1. Mint the anonymous session cookie if it's missing. Set it
 *      on both the inbound request (so the route sees it) and the
 *      outbound response (so the client persists it).
 *
 *   2. Delegate to Clerk's middleware when auth is configured.
 *      Otherwise NextResponse.next() - keeps Clerk completely off
 *      the keyless build path. The dynamic import ensures Clerk's
 *      runtime isn't evaluated in keyless builds.
 */
export default async function middleware(req: NextRequest) {
  // Read the inbound cookie via NextRequest.cookies (typed) so we can
  // mutate it for downstream consumers if minting.
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  const session = existing ? { sessionId: existing, isNew: false as const } : resolveSession(null);

  // Propagate the minted id back onto the inbound request so any
  // route handler that reads cookies() sees it. This is the canonical
  // Next.js pattern for "I'm setting a cookie now AND want this same
  // request to act as if it were already set."
  if (session.isNew) {
    req.cookies.set(SESSION_COOKIE, session.sessionId);
  }

  let res: NextResponse | undefined;
  if (getServerFeatures().auth) {
    const { clerkMiddleware } = await import('@clerk/nextjs/server');
    const clerkRes = await clerkMiddleware()(req, undefined as never);
    res = clerkRes instanceof NextResponse ? clerkRes : undefined;
  }
  if (!res) {
    // Pass `request: { headers }` so the mutated request.cookies survive
    // to the route handler (Next forwards them through the rewritten
    // request when this option is provided).
    res = NextResponse.next({ request: { headers: req.headers } });
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
