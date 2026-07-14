import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  rateLimit,
  deriveRateLimitKey,
  clientIpFrom,
  __resetRateLimitStoreForTests,
} from '@/lib/ratelimit';

const REDIS_ENV = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of REDIS_ENV) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  __resetRateLimitStoreForTests(); // force a fresh in-memory store per test
});
afterEach(() => {
  for (const k of REDIS_ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  __resetRateLimitStoreForTests();
});

describe('rateLimit (in-memory dev store)', () => {
  it('allows up to the burst limit, then denies with scope=burst + Retry-After', async () => {
    const cfg = { burst: { limit: 3, windowSeconds: 10 }, sustained: { limit: 100, windowSeconds: 3600 } };
    for (let i = 0; i < 3; i++) {
      expect((await rateLimit('k-burst', cfg)).allowed).toBe(true);
    }
    const denied = await rateLimit('k-burst', cfg);
    expect(denied.allowed).toBe(false);
    expect(denied.scope).toBe('burst');
    expect(denied.retryAfterSeconds).toBe(10);
    expect(denied.backend).toBe('memory');
  });

  it('enforces the sustained window independently of burst', async () => {
    const cfg = { burst: { limit: 1000, windowSeconds: 10 }, sustained: { limit: 3, windowSeconds: 3600 } };
    for (let i = 0; i < 3; i++) {
      expect((await rateLimit('k-sustained', cfg)).allowed).toBe(true);
    }
    const denied = await rateLimit('k-sustained', cfg);
    expect(denied.allowed).toBe(false);
    expect(denied.scope).toBe('sustained');
    expect(denied.retryAfterSeconds).toBe(3600);
  });

  it('isolates budgets per identifier', async () => {
    const cfg = { burst: { limit: 1, windowSeconds: 10 }, sustained: { limit: 100, windowSeconds: 3600 } };
    expect((await rateLimit('alice', cfg)).allowed).toBe(true);
    expect((await rateLimit('bob', cfg)).allowed).toBe(true); // separate key, own budget
    expect((await rateLimit('alice', cfg)).allowed).toBe(false); // alice's 2nd → burst denied
  });

  it('reports remaining on an allowed request', async () => {
    const cfg = { burst: { limit: 5, windowSeconds: 10 }, sustained: { limit: 10, windowSeconds: 3600 } };
    const r = await rateLimit('k-remaining', cfg);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(9); // sustained limit 10, one consumed
  });
});

describe('deriveRateLimitKey — privacy-preserving', () => {
  it('prefers an opaque user id', () => {
    expect(deriveRateLimitKey({ userId: 'user_123' })).toBe('u:user_123');
  });

  it('hashes IP+session for anon and never exposes the raw IP', () => {
    const k = deriveRateLimitKey({ ip: '203.0.113.7', sessionId: 'sess-abc' });
    expect(k.startsWith('a:')).toBe(true);
    expect(k).not.toContain('203.0.113.7');
    // deterministic + collision-resistant across IPs
    expect(deriveRateLimitKey({ ip: '203.0.113.7', sessionId: 'sess-abc' })).toBe(k);
    expect(deriveRateLimitKey({ ip: '203.0.113.8', sessionId: 'sess-abc' })).not.toBe(k);
  });
});

describe('clientIpFrom', () => {
  it('takes the first x-forwarded-for hop', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' });
    expect(clientIpFrom(h)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, else null', () => {
    expect(clientIpFrom(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    expect(clientIpFrom(new Headers())).toBeNull();
  });
});
