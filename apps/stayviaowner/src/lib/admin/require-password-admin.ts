import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE_NAME,
  insecureLocalAdminBypass,
  isCookieValid,
  isPasswordGateEnabled,
} from './password-session';

/**
 * Gate a server component or route handler behind the admin password.
 * FAILS CLOSED: if `ADMIN_PASSWORD` is not configured, access is DENIED,
 * not opened. Local dev may bypass only with an explicit
 * `ALLOW_INSECURE_LOCAL_ADMIN=true` (never honored in production).
 *
 *   - No `ADMIN_PASSWORD` → deny (throws a generic config error), unless
 *     the explicit local-dev bypass is on.
 *   - `ADMIN_PASSWORD` set → require a valid signed session cookie, else
 *     redirect to /admin/login with the original path encoded.
 *
 * `redirect()` / the thrown error stop execution, so this function
 * "returns" only when access is granted.
 */
export async function requirePasswordAdmin(args?: {
  /** Where to bounce after a successful login. Defaults to the
   *  requested page. Pass an absolute path. */
  returnTo?: string;
}): Promise<void> {
  if (!isPasswordGateEnabled()) {
    // Explicit local-dev bypass only — never in production.
    if (insecureLocalAdminBypass()) return;
    // Fail closed: no admin password configured. Deny without naming the
    // missing variable to end users; log a privacy-safe server event.
    console.error('[admin] access denied — ADMIN_PASSWORD is not configured');
    throw new Error('Admin is not available on this deployment.');
  }

  const jar = await cookies();
  const cookie = jar.get(ADMIN_COOKIE_NAME)?.value;
  if (isCookieValid(cookie)) return; // logged in

  const target = args?.returnTo ? `?returnTo=${encodeURIComponent(args.returnTo)}` : '';
  redirect(`/admin/login${target}`);
}
