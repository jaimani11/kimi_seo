import type { NextRequest } from 'next/server';
import { getOrMintSessionCookie, getServerAuth, ownerOf } from '@lib/auth';
import type { AuthState } from '@lib/auth';
import { getSessionStore } from '@lib/session/factory';
import type { OwnerKind, SessionStore } from '@lib/session/session-store';

/**
 * Common surface for trip routes: auth state, owner key derived from it,
 * the SessionStore, and the Set-Cookie header (if a new anonymous
 * session was minted on this request).
 *
 * Routes that read or mutate trips shouldn't reach for cookies/auth
 * directly - they call resolveRouteContext() and use what comes back.
 */
export interface RouteContext {
  auth: AuthState;
  owner: { ownerKind: OwnerKind; ownerId: string };
  store: SessionStore;
  setCookie: string | null;
}

export async function resolveRouteContext(_req?: NextRequest): Promise<RouteContext> {
  const auth = await getServerAuth();
  // Mint anonymous session cookie if missing - first request a new
  // user makes after a cold cookie jar shouldn't hit "no session".
  const { setCookieHeader } = await getOrMintSessionCookie();
  return {
    auth,
    owner: ownerOf(auth),
    store: getSessionStore(),
    setCookie: setCookieHeader,
  };
}

export function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
  setCookie: string | null = null,
): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  if (setCookie) {
    headers.append('Set-Cookie', setCookie);
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}
