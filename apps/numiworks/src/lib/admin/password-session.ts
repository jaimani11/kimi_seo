import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Cookie-session admin gate.
 *
 * Lightweight password gate for admin pages that don't have a full
 * Clerk session. The user enters a single password (read from
 * `ADMIN_PASSWORD`), the server validates it with constant-time
 * comparison, and a signed cookie keeps them logged in for 7 days.
 *
 * Two env vars:
 *
 *   ADMIN_PASSWORD          — the login password. Required for the
 *                              gate to do anything. Without it,
 *                              `isPasswordSessionValid` returns
 *                              `true` for any request — i.e. the
 *                              gate is OPEN. That keeps dev easy.
 *
 *   ADMIN_SESSION_SECRET    — HMAC key used to sign cookies. If
 *                              unset, a process-local random key is
 *                              generated at boot. Setting it in
 *                              production env keeps sessions valid
 *                              across serverless instances + restarts.
 *
 * The cookie is HTTP-only, Secure in production, SameSite=Lax. The
 * value is `${exp}.${hmac(exp, secret)}` — no PII, no roles.
 */

const COOKIE_NAME = 'numiworks_admin';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let cachedSecret: Buffer | null = null;

function getSessionSecret(): Buffer {
  const fromEnv = (process.env.ADMIN_SESSION_SECRET ?? '').trim();
  if (fromEnv.length > 0) {
    // Previously secrets under 16 chars were silently IGNORED, which
    // fell back to per-instance random keys - cookies minted on one
    // serverless instance failed on the next, so login looped forever.
    // Accept any non-empty secret; nag when it is weak.
    if (fromEnv.length < 16) {
      console.warn(
        '[admin-session] ADMIN_SESSION_SECRET is shorter than 16 chars - working, but use a longer random value (e.g. openssl rand -hex 32).',
      );
    }
    return Buffer.from(fromEnv, 'utf-8');
  }
  if (cachedSecret) return cachedSecret;
  cachedSecret = randomBytes(32);
  console.warn(
    '[admin-session] ADMIN_SESSION_SECRET not set — using a process-local random secret. Sessions will invalidate on restart.',
  );
  return cachedSecret;
}

function getAdminPassword(): string | null {
  const raw = (process.env.ADMIN_PASSWORD ?? '').trim();
  return raw.length > 0 ? raw : null;
}

/**
 * Explicit, dev-only bypass for the admin + cron gates. True ONLY outside
 * production AND when the operator opts in with ALLOW_INSECURE_LOCAL_ADMIN=true.
 * Never true in Vercel Production/Preview (NODE_ENV === 'production'). This is
 * what lets the gates fail CLOSED without blocking local development.
 */
export function insecureLocalAdminBypass(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    (process.env.ALLOW_INSECURE_LOCAL_ADMIN ?? '').trim() === 'true'
  );
}

/**
 * Returns true when the password gate is configured. When false, the
 * admin page is open — useful for local dev.
 */
export function isPasswordGateEnabled(): boolean {
  return getAdminPassword() !== null;
}

/**
 * Verify a submitted password against ADMIN_PASSWORD. Constant-time
 * to mitigate timing attacks; the constant time is cheap because
 * the strings are short.
 */
export function verifyPassword(submitted: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  const a = Buffer.from(submitted, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Mint a cookie value for a fresh login. The cookie format is
 * `${expIso}.${hex(hmac)}`. The HMAC binds the expiry timestamp
 * so a tampered exp doesn't validate.
 */
export function mintSessionCookie(now: Date = new Date()): {
  name: string;
  value: string;
  maxAgeSec: number;
} {
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  const expIso = expiresAt.toISOString();
  const secret = getSessionSecret();
  const sig = createHmac('sha256', secret).update(expIso).digest('hex');
  return {
    name: COOKIE_NAME,
    value: `${expIso}.${sig}`,
    maxAgeSec: Math.floor(SESSION_DURATION_MS / 1000),
  };
}

/**
 * Verify a cookie value pulled off the request. Returns true when
 * the signature matches AND the expiry hasn't passed.
 */
export function isCookieValid(value: string | undefined, now: Date = new Date()): boolean {
  if (!value) return false;
  // ISO timestamps contain dots (the .000 milliseconds). Split on the
  // LAST dot so `expIso.sig` parses correctly.
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return false;
  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const secret = getSessionSecret();
  const expectedSig = createHmac('sha256', secret).update(exp).digest('hex');
  if (sig.length !== expectedSig.length) return false;
  const sigOk = timingSafeEqual(Buffer.from(sig, 'utf-8'), Buffer.from(expectedSig, 'utf-8'));
  if (!sigOk) return false;
  const expMs = Date.parse(exp);
  if (Number.isNaN(expMs)) return false;
  return expMs > now.getTime();
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
