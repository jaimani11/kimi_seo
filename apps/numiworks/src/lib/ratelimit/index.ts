import { createHash } from 'node:crypto';
import { getRateLimitStore } from './store';

export { __resetRateLimitStoreForTests } from './store';

/**
 * Fixed-window rate limiting with separate burst + sustained windows.
 *
 * - The identifier is a PRIVACY-PRESERVING key (hashed IP+session, or an opaque
 *   user id) — a raw IP is never stored in the limiter key or logs.
 * - Both windows are checked; the more restrictive one wins.
 * - Fails OPEN on a backend outage (see store.ts) so a limiter problem never
 *   blocks the booking flow.
 */

export interface RateWindow {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitConfig {
  burst: RateWindow;
  sustained: RateWindow;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds to advise the client to wait (Retry-After). 0 when allowed. */
  retryAfterSeconds: number;
  scope: 'burst' | 'sustained' | null;
  backend: 'redis' | 'memory';
}

/**
 * Derive a privacy-preserving rate-limit identifier. Prefers an opaque user /
 * session id; the raw IP is only ever hashed (SHA-256, truncated), never stored
 * or logged in the clear.
 */
export function deriveRateLimitKey(args: {
  userId?: string | null;
  sessionId?: string | null;
  ip?: string | null;
}): string {
  if (args.userId) return `u:${args.userId}`;
  const material = `${args.ip ?? 'noip'}|${args.sessionId ?? 'nosess'}`;
  const hash = createHash('sha256').update(material).digest('hex').slice(0, 20);
  return `a:${hash}`;
}

/** First x-forwarded-for hop (Vercel/proxy), or x-real-ip. Null if absent. */
export function clientIpFrom(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? null;
  return headers.get('x-real-ip');
}

const NS = 'rl:concierge';

async function bump(
  key: string,
  window: RateWindow,
): Promise<{ ok: boolean; count: number }> {
  const count = await getRateLimitStore().incr(key, window.windowSeconds);
  return { ok: count <= window.limit, count };
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const backend = getRateLimitStore().backend;
  try {
    const [burst, sustained] = await Promise.all([
      bump(`${NS}:b:${identifier}`, config.burst),
      bump(`${NS}:s:${identifier}`, config.sustained),
    ]);

    if (!burst.ok) {
      return { allowed: false, limit: config.burst.limit, remaining: 0, retryAfterSeconds: config.burst.windowSeconds, scope: 'burst', backend };
    }
    if (!sustained.ok) {
      return { allowed: false, limit: config.sustained.limit, remaining: 0, retryAfterSeconds: config.sustained.windowSeconds, scope: 'sustained', backend };
    }
    return {
      allowed: true,
      limit: config.sustained.limit,
      remaining: Math.max(0, config.sustained.limit - sustained.count),
      retryAfterSeconds: 0,
      scope: null,
      backend,
    };
  } catch (err) {
    // FAIL OPEN — never block the booking flow on a limiter outage.
    console.warn('[ratelimit] backend error — failing open', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, limit: config.sustained.limit, remaining: config.sustained.limit, retryAfterSeconds: 0, scope: null, backend };
  }
}
