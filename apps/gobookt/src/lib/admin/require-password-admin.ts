import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE_NAME,
  isCookieValid,
  isPasswordGateEnabled,
} from './password-session';

/**
 * Gate a server component or route handler behind the admin password.
 *
 *   - If `ADMIN_PASSWORD` is NOT set in env → gate is OPEN, returns
 *     without redirect. Use this for local dev.
 *   - If `ADMIN_PASSWORD` IS set → must have a valid signed session
 *     cookie. Otherwise redirect to /admin/login with the original
 *     path encoded so we can bounce back after login.
 *
 * `redirect()` throws a Next-runtime exception when invoked, so this
 * function "returns" only when access is granted.
 */
export async function requirePasswordAdmin(args?: {
  /** Where to bounce after a successful login. Defaults to the
   *  requested page. Pass an absolute path. */
  returnTo?: string;
}): Promise<void> {
  if (!isPasswordGateEnabled()) return; // dev mode

  const jar = await cookies();
  const cookie = jar.get(ADMIN_COOKIE_NAME)?.value;
  if (isCookieValid(cookie)) return; // logged in

  const target = args?.returnTo ? `?returnTo=${encodeURIComponent(args.returnTo)}` : '';
  redirect(`/admin/login${target}`);
}
