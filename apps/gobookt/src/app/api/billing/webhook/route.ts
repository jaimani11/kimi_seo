import type { NextRequest } from 'next/server';
import { getBillingSubsystem } from '@lib/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/webhook
 *
 * Stripe webhook receiver. Reads the raw request body (required for
 * signature verification - JSON parsing would corrupt the bytes the
 * signature was computed over). Hands the body + signature header to
 * the billing provider, which:
 *
 *   1. Verifies the signature against STRIPE_WEBHOOK_SECRET.
 *   2. Atomically marks the event id processed (idempotency).
 *   3. Applies the event to the SubscriptionStore.
 *
 * Returns:
 *   - 400 on signature failure (Stripe will not retry these - they
 *     mean a misconfigured webhook secret, which an admin must fix).
 *   - 200 on every other outcome, including:
 *     · processed events
 *     · duplicate events (idempotent)
 *     · ignored event types
 *     · downstream apply errors (logged; we trust Stripe's retry of
 *       2xx-only would not help here, since the issue is on our side).
 *
 * The mock-provider path returns 503 - there's no webhook to deliver
 * in mock mode, but a misconfigured Stripe Dashboard pointed at this
 * URL while we're in mock mode should fail loudly so it gets noticed.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  const { provider } = getBillingSubsystem();
  const result = await provider.handleWebhook({ rawBody, signature });

  if (!result.ok) {
    if (result.reason === 'mock-provider') {
      // Misconfiguration alert - Stripe is calling us but we're in mock mode.
      console.warn(
        '[billing/webhook] received delivery while billing is in mock mode - set STRIPE_SECRET_KEY/_WEBHOOK_SECRET/_PRICE_ID to enable Stripe.',
      );
      return jsonReply({ error: 'billing-not-configured' }, 503);
    }
    if (result.reason === 'no-signature' || result.reason === 'signature') {
      return jsonReply({ error: 'invalid-signature' }, 400);
    }
    return jsonReply({ error: result.reason }, 400);
  }

  return jsonReply(
    {
      ok: true,
      eventType: result.eventType,
      eventId: result.eventId,
      ...(result.idempotent ? { idempotent: true } : {}),
      ...(result.ignored ? { ignored: true } : {}),
    },
    200,
  );
}

function jsonReply(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
