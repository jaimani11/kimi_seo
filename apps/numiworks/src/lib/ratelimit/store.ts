/**
 * Distributed-capable fixed-window rate-limit store.
 *
 * PRODUCTION backend: a Redis REST endpoint (Upstash or Vercel KV). This is
 * required for correct limiting on Vercel's distributed/serverless runtime,
 * where consecutive requests can land on different instances. Configure via env:
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (Upstash), or
 *   KV_REST_API_URL       + KV_REST_API_TOKEN           (Vercel KV).
 *
 * FALLBACK: an in-process Map. DEV-ONLY — it counts per-instance, so on Vercel
 * it under-counts (each cold start / instance has its own map) and must not be
 * relied on for real protection. A one-time error is logged if it is selected
 * in a production environment.
 *
 * UNAVAILABLE backend: if the Redis endpoint errors or times out at request
 * time, `incr` throws and the caller (rateLimit) FAILS OPEN — the request is
 * allowed and a warning is logged. Availability of the booking flow beats
 * strict limiting, and a hard dependency on Redis would be its own outage risk.
 */

export interface RateLimitStore {
  readonly backend: 'redis' | 'memory';
  /**
   * Atomically increment the counter at `key`, creating it with a TTL of
   * `windowSeconds` on first use (fixed window). Returns the post-increment
   * count. Throws on backend failure (caller fails open).
   */
  incr(key: string, windowSeconds: number): Promise<number>;
}

function redisEnv(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '').trim();
  return url && token ? { url, token } : null;
}

class RedisRestStore implements RateLimitStore {
  readonly backend = 'redis' as const;
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async incr(key: string, windowSeconds: number): Promise<number> {
    // Upstash / Vercel-KV REST pipeline: INCR, then EXPIRE … NX so the TTL is
    // set only on the first increment of the window (a true fixed window).
    const res = await fetch(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSeconds), 'NX'],
      ]),
      signal: AbortSignal.timeout(1500), // never hang the request path on the limiter
    });
    if (!res.ok) throw new Error(`ratelimit redis http ${res.status}`);
    const body = (await res.json()) as Array<{ result?: number; error?: string }>;
    const count = body?.[0]?.result;
    if (typeof count !== 'number') throw new Error('ratelimit redis malformed response');
    return count;
  }
}

interface Bucket {
  count: number;
  expiresAt: number;
}

class InMemoryStore implements RateLimitStore {
  readonly backend = 'memory' as const;
  private readonly map = new Map<string, Bucket>();

  async incr(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const existing = this.map.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.map.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
      if (this.map.size > 5000) {
        for (const [k, v] of this.map) if (v.expiresAt <= now) this.map.delete(k);
      }
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }
}

let cached: RateLimitStore | null = null;
let warnedMemoryInProd = false;

export function getRateLimitStore(): RateLimitStore {
  if (cached) return cached;
  const env = redisEnv();
  if (env) {
    cached = new RedisRestStore(env.url, env.token);
  } else {
    if (process.env.NODE_ENV === 'production' && !warnedMemoryInProd) {
      warnedMemoryInProd = true;
      console.error(
        '[ratelimit] no Redis REST backend configured (UPSTASH_REDIS_REST_URL/TOKEN or ' +
          'KV_REST_API_URL/TOKEN) — using a PER-INSTANCE in-memory limiter, which ' +
          'under-counts on Vercel. Configure Redis for real distributed protection.',
      );
    }
    cached = new InMemoryStore();
  }
  return cached;
}

/** Test hook — reset the cached store so env changes take effect. */
export function __resetRateLimitStoreForTests(): void {
  cached = null;
  warnedMemoryInProd = false;
}
