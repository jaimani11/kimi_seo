import { cookies, type headers } from 'next/headers';
import { getServerFeatures } from '@lib/env';
import { resolveSession, setSessionCookieHeader } from '@lib/session/anonymous';
import type { AuthState } from './auth-state';

/**
 * Server-side resolution of the current AuthState. Used by route
 * handlers and RSC pages. Derives the cookie session id (creating one
 * if none exists), then if Clerk is configured AND the user is signed
 * in, surfaces the Clerk userId.
 */
export async function getServerAuth(): Promise<AuthState> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const sessionId = resolveSession(cookieHeader || null).sessionId;

  if (!getServerFeatures().auth) {
    return { kind: 'anonymous', sessionId };
  }

  try {
    const { auth } = await import('@clerk/nextjs/server');
    const a = await auth();
    if (a.userId) {
      return { kind: 'authenticated', userId: a.userId, sessionId };
    }
  } catch (err) {
    console.warn('[auth] Clerk auth() failed, falling back to anonymous:', err);
  }
  return { kind: 'anonymous', sessionId };
}

/**
 * Resolve the session id for inclusion in a Set-Cookie response header
 * (route handlers that mint a new anonymous session need this).
 */
export async function getOrMintSessionCookie(): Promise<{
  sessionId: string;
  setCookieHeader: string | null;
}> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const session = resolveSession(cookieHeader || null);
  return {
    sessionId: session.sessionId,
    setCookieHeader: session.isNew ? setSessionCookieHeader(session.sessionId) : null,
  };
}

// Defensive shim: makes `headers` import non-tree-shaken so future server
// utilities keep this module-level dep. (Remove if/when getServerAuth
// itself uses headers().)
export type _ServerAuthDeps = typeof headers;
