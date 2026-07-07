import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isCookieValid,
  isPasswordGateEnabled,
  mintSessionCookie,
  verifyPassword,
} from '../src/lib/admin/password-session';

const KEYS = ['ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET'] as const;
const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('password gate config', () => {
  it('is disabled when ADMIN_PASSWORD is unset', () => {
    expect(isPasswordGateEnabled()).toBe(false);
  });

  it('is enabled when ADMIN_PASSWORD is set', () => {
    process.env.ADMIN_PASSWORD = 'secret-2026';
    expect(isPasswordGateEnabled()).toBe(true);
  });
});

describe('verifyPassword', () => {
  it('returns false when no password is configured', () => {
    expect(verifyPassword('anything')).toBe(false);
  });

  it('accepts the right password', () => {
    process.env.ADMIN_PASSWORD = 'change-me-immediately';
    expect(verifyPassword('change-me-immediately')).toBe(true);
  });

  it('rejects a wrong password (constant-time)', () => {
    process.env.ADMIN_PASSWORD = 'change-me-immediately';
    expect(verifyPassword('change-me-immediatelY')).toBe(false);
    expect(verifyPassword('short')).toBe(false);
    expect(verifyPassword('')).toBe(false);
  });
});

describe('mint + verify session cookie', () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'a'.repeat(32);
  });

  it('mints a cookie that immediately validates', () => {
    const c = mintSessionCookie(new Date('2026-06-13T00:00:00Z'));
    expect(isCookieValid(c.value, new Date('2026-06-13T00:00:01Z'))).toBe(true);
  });

  it('rejects a cookie whose expiry has passed', () => {
    const c = mintSessionCookie(new Date('2026-06-13T00:00:00Z'));
    // 7 days + 1 second later
    expect(isCookieValid(c.value, new Date('2026-06-20T00:00:01Z'))).toBe(false);
  });

  it('rejects a cookie with a tampered expiry timestamp', () => {
    const c = mintSessionCookie(new Date('2026-06-13T00:00:00Z'));
    const tampered = c.value.replace(/^[^.]+/, '2099-01-01T00:00:00.000Z');
    expect(isCookieValid(tampered, new Date('2026-06-14T00:00:00Z'))).toBe(false);
  });

  it('rejects a cookie with a tampered signature', () => {
    const c = mintSessionCookie(new Date('2026-06-13T00:00:00Z'));
    const tampered = c.value.replace(/.$/, (last) => (last === '0' ? '1' : '0'));
    expect(isCookieValid(tampered, new Date('2026-06-13T00:01:00Z'))).toBe(false);
  });

  it('rejects empty / malformed values', () => {
    expect(isCookieValid(undefined)).toBe(false);
    expect(isCookieValid('')).toBe(false);
    expect(isCookieValid('not-a-cookie')).toBe(false);
  });

  it('does not cross-validate cookies signed with different secrets', () => {
    const c1 = mintSessionCookie(new Date('2026-06-13T00:00:00Z'));
    // Rotate the secret. A cookie signed by the old secret must not
    // validate under the new one — that's the whole point of
    // session-secret rotation.
    process.env.ADMIN_SESSION_SECRET = 'b'.repeat(32);
    expect(isCookieValid(c1.value, new Date('2026-06-13T00:01:00Z'))).toBe(false);
  });
});
