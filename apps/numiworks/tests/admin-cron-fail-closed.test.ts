import { afterEach, describe, expect, it, vi } from 'vitest';
import { insecureLocalAdminBypass } from '@lib/admin/password-session';
import { isCronAuthorized } from '@lib/admin/cron-auth';

afterEach(() => vi.unstubAllEnvs());

/**
 * Admin + cron gates must FAIL CLOSED: absent secrets deny access in
 * production. A dev bypass exists but only behind an explicit flag and
 * never in production.
 */
describe('insecureLocalAdminBypass', () => {
  it('is false in production even with the flag set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_INSECURE_LOCAL_ADMIN', 'true');
    expect(insecureLocalAdminBypass()).toBe(false);
  });
  it('is false in dev without the explicit flag', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ALLOW_INSECURE_LOCAL_ADMIN', '');
    expect(insecureLocalAdminBypass()).toBe(false);
  });
  it('is true in dev only with the explicit flag', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ALLOW_INSECURE_LOCAL_ADMIN', 'true');
    expect(insecureLocalAdminBypass()).toBe(true);
  });
});

describe('isCronAuthorized (fail closed)', () => {
  it('rejects when CRON_SECRET is unset in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');
    expect(isCronAuthorized('Bearer anything')).toBe(false);
  });
  it('rejects a missing Authorization header', () => {
    vi.stubEnv('CRON_SECRET', 's3cret-value');
    expect(isCronAuthorized(null)).toBe(false);
  });
  it('rejects an incorrect secret', () => {
    vi.stubEnv('CRON_SECRET', 's3cret-value');
    expect(isCronAuthorized('Bearer wrong')).toBe(false);
  });
  it('accepts the correct Bearer secret', () => {
    vi.stubEnv('CRON_SECRET', 's3cret-value');
    expect(isCronAuthorized('Bearer s3cret-value')).toBe(true);
  });
});
