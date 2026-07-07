/**
 * Anonymous session cookie. Slice A keeps things minimal - a UUID stored
 * in an HttpOnly cookie. Slice B replaces with a signed cookie once we
 * have real user accounts and need tamper-detection.
 */
export const SESSION_COOKIE = 'stayscout-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export interface SessionResolution {
  sessionId: string;
  isNew: boolean;
}

export function resolveSession(cookieHeader: string | null): SessionResolution {
  if (cookieHeader) {
    const match = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`).exec(cookieHeader);
    if (match?.[1]) {
      return { sessionId: match[1], isNew: false };
    }
  }
  return { sessionId: `anon_${crypto.randomUUID()}`, isNew: true };
}

export function setSessionCookieHeader(sessionId: string): string {
  return `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; HttpOnly`;
}
