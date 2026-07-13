import { timingSafeEqual } from 'node:crypto';
import { insecureLocalAdminBypass } from './password-session';

/**
 * Authorize a cron request. FAILS CLOSED: without `CRON_SECRET` the request
 * is rejected. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`, so
 * every scheduled job must present that header. Local dev may bypass only
 * with an explicit `ALLOW_INSECURE_LOCAL_ADMIN=true`. Comparison is
 * timing-safe, and the secret is never accepted through a query parameter.
 */
export function isCronAuthorized(authorizationHeader: string | null): boolean {
  const secret = (process.env.CRON_SECRET ?? '').trim();
  if (!secret) return insecureLocalAdminBypass();
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authorizationHeader ?? '', 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  return a.length === b.length && timingSafeEqual(a, b);
}
