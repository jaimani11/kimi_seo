import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionStore } from '@lib/session/factory';
import { getServerAuth, ownerOf } from '@lib/auth';
import { FUNNEL_EVENT_KINDS } from '@lib/session/session-store';

/**
 * POST /api/analytics/event
 *   body: { kind: FunnelEventKind, ref?: string }
 *
 * Best-effort write-only endpoint that backs the client `track()`
 * call. Always returns 204 on a valid payload (even if the store
 * write fails) so a flaky analytics path never surfaces to the UI.
 *
 * The owner/session is resolved from the cookie session — clients
 * don't send identifiers.
 */
export const runtime = 'nodejs';

/**
 * Metadata payload: small, primitive-valued bag for the funnel event.
 * Cap of 12 keys + 200-char values stops a runaway client from
 * persisting unbounded blobs through the analytics endpoint.
 */
const MetadataSchema = z
  .record(z.string(), z.union([z.string().max(200), z.number(), z.boolean()]))
  .refine((m) => Object.keys(m).length <= 12, {
    message: 'metadata has too many keys (max 12)',
  })
  .optional();

const BodySchema = z.object({
  kind: z.enum(FUNNEL_EVENT_KINDS),
  ref: z.string().max(200).optional(),
  metadata: MetadataSchema,
});

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(null, { status: 204 });
  }

  const auth = await getServerAuth();
  const owner = ownerOf(auth);

  try {
    await getSessionStore().recordEvent({
      kind: parsed.data.kind,
      ownerKind: owner.ownerKind,
      ownerId: owner.ownerId,
      sessionId: auth.sessionId,
      ...(parsed.data.ref ? { ref: parsed.data.ref } : {}),
      ...(parsed.data.metadata ? { metadata: parsed.data.metadata } : {}),
    });
  } catch (err) {
    // Funnel-event writes never block the UI; log + swallow.
    console.error('[analytics/event] recordEvent failed', err);
  }
  return new Response(null, { status: 204 });
}
