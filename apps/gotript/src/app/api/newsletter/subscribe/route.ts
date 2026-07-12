import type { NextRequest } from 'next/server';
import { subscribeEmail } from '@adored/marketing';
import { GOTRIPT } from '@adored/brand-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/newsletter/subscribe  — body: { email, company?, source? }
 *
 * `company` is the honeypot: real users never see the field, so any
 * value means a bot — we return a silent success and never touch Resend.
 */
export async function POST(req: NextRequest): Promise<Response> {
  let body: { email?: string; company?: string; source?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // fall through — empty body fails validation below
  }

  if (typeof body.company === 'string' && body.company.trim().length > 0) {
    return Response.json({ ok: true, status: 'subscribed', message: "You're in!" });
  }

  const result = await subscribeEmail({
    email: typeof body.email === 'string' ? body.email : '',
    brand: {
      name: GOTRIPT.name,
      domain: GOTRIPT.domain,
      siteUrl: GOTRIPT.siteUrl,
      primaryColor: GOTRIPT.colors.primary,
    },
    ...(typeof body.source === 'string' ? { source: body.source } : {}),
  });

  return Response.json(result, { status: result.status === 'invalid' ? 400 : 200 });
}
