import { redirect } from 'next/navigation';
import { getServerAuth, type AuthState } from '@lib/auth';
import { getServerFeatures } from '@lib/env';

/**
 * Slice C5 - single admin auth gate.
 *
 * Three modes:
 *   - Auth on (Clerk configured) AND `STAYSCOUT_ADMIN_PUBLIC` unset →
 *     require an authenticated session, otherwise redirect home.
 *   - Auth off (no Clerk env) → open. Keyless dev convenience.
 *   - `STAYSCOUT_ADMIN_PUBLIC === '1'` → open in any mode (staging /
 *     preview deploys).
 *
 * Every `/admin/...` page calls this as the first line. Returns the
 * resolved `AuthState` so callers can label rows ("you, viewing as
 * <email>"), but the typical use is just for the side-effect.
 *
 * `redirect()` throws a Next-runtime exception when invoked, so this
 * function "returns" only on the success paths.
 */
export async function requireAdmin(): Promise<AuthState> {
  const features = getServerFeatures();
  const adminPublic = process.env.STAYSCOUT_ADMIN_PUBLIC === '1';
  const auth = await getServerAuth();

  if (features.auth && !adminPublic && auth.kind !== 'authenticated') {
    redirect('/');
  }

  return auth;
}
