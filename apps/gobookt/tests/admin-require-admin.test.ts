import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `requireAdmin` reads three things at call time: server features
 * (auth on/off), the STAYSCOUT_ADMIN_PUBLIC env var, and the resolved
 * AuthState. The test mocks all three so each scenario is hermetic.
 *
 * `redirect()` from `next/navigation` throws a Next-runtime exception;
 * we mock it to throw a sentinel error and assert that for the gated
 * cases.
 */

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`__redirect__:${url}`);
  }),
}));

const mockAuth = vi.fn();
vi.mock('@lib/auth', () => ({
  getServerAuth: () => mockAuth(),
}));

const mockFeatures = vi.fn();
vi.mock('@lib/env', () => ({
  getServerFeatures: () => mockFeatures(),
}));

import { requireAdmin } from '@/lib/admin/require-admin';

describe('requireAdmin', () => {
  beforeEach(() => {
    delete process.env.STAYSCOUT_ADMIN_PUBLIC;
    mockAuth.mockReset();
    mockFeatures.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth state without redirecting when auth is off (keyless dev)', async () => {
    mockFeatures.mockReturnValue({ auth: false });
    mockAuth.mockResolvedValue({ kind: 'anonymous', sessionId: 'anon_test' });
    const auth = await requireAdmin();
    expect(auth.kind).toBe('anonymous');
  });

  it('returns auth state when STAYSCOUT_ADMIN_PUBLIC=1, even with Clerk on + signed-out', async () => {
    process.env.STAYSCOUT_ADMIN_PUBLIC = '1';
    mockFeatures.mockReturnValue({ auth: true });
    mockAuth.mockResolvedValue({ kind: 'anonymous', sessionId: 'anon_test' });
    const auth = await requireAdmin();
    expect(auth.kind).toBe('anonymous');
  });

  it('redirects home when auth is on AND user is not signed in', async () => {
    mockFeatures.mockReturnValue({ auth: true });
    mockAuth.mockResolvedValue({ kind: 'anonymous', sessionId: 'anon_test' });
    await expect(requireAdmin()).rejects.toThrow('__redirect__:/');
  });

  it('returns the authenticated state when auth is on AND user is signed in', async () => {
    mockFeatures.mockReturnValue({ auth: true });
    mockAuth.mockResolvedValue({
      kind: 'authenticated',
      userId: 'user_test',
      sessionId: 'anon_test',
    });
    const auth = await requireAdmin();
    expect(auth.kind).toBe('authenticated');
    if (auth.kind === 'authenticated') expect(auth.userId).toBe('user_test');
  });
});
