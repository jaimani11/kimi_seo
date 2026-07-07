import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@lib/admin/password-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/logout
 *
 * Clears the admin session cookie. No password check — anyone
 * holding the cookie can choose to drop it. Always returns 204.
 */
export async function POST(): Promise<Response> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return new Response(null, { status: 204 });
}
