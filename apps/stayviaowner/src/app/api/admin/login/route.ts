import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  mintSessionCookie,
  verifyPassword,
} from '@lib/admin/password-session';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/login
 *   body: { password: string }
 *
 * Verifies the submitted password against ADMIN_PASSWORD with
 * constant-time comparison. On success sets the signed session
 * cookie and returns 204. On failure returns 401 with no body —
 * deliberately quiet so we don't leak the gate's existence to
 * crawlers.
 */
const BodySchema = z.object({
  password: z.string().min(1).max(256),
});

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  if (!verifyPassword(parsed.data.password.trim())) {
    return new Response(null, { status: 401 });
  }
  const cookie = mintSessionCookie();
  const jar = await cookies();
  jar.set(cookie.name, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: cookie.maxAgeSec,
  });
  return new Response(null, { status: 204 });
}
