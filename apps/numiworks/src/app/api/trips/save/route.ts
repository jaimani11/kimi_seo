import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { TripProposalSchema, type TripProposal } from '@core/trip-proposal';
import { TripIntentSchema } from '@core/trip-intent';
import { ProposalRefSchema } from '@core/partial';
import { jsonResponse, resolveRouteContext } from '../../_lib/route-context';

export const runtime = 'nodejs';

const SaveTripBodySchema = z.object({
  proposal: TripProposalSchema,
  intent: TripIntentSchema,
  proposalRef: ProposalRefSchema,
  conversationId: z.string().optional(),
});

/**
 * POST /api/trips/save - bookmark a proposal for the current owner.
 * Anonymous sessions own trips by sessionId; authenticated users own
 * by userId. Idempotent on (ownerId, proposalId) - the same proposal
 * saved twice surfaces the existing row.
 */
export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, { status: 400 });
  }

  const parsed = SaveTripBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: 'invalid request', issues: parsed.error.issues }, { status: 400 });
  }

  const ctx = await resolveRouteContext(req);

  try {
    const saved = await ctx.store.saveTrip({
      ownerKind: ctx.owner.ownerKind,
      ownerId: ctx.owner.ownerId,
      proposalId: parsed.data.proposalRef.proposalId,
      proposalSummary: parsed.data.proposalRef.summary,
      // Branded ids (StayId, ProviderId) survive runtime intact; the
      // Zod-parsed object has identical shape so this cast is safe.
      proposal: parsed.data.proposal as TripProposal,
      intent: parsed.data.intent,
      ...(parsed.data.conversationId ? { conversationId: parsed.data.conversationId } : {}),
    });
    return jsonResponse({ ok: true, trip: saved }, { status: 200 }, ctx.setCookie);
  } catch (err) {
    console.error('[trips/save] failed', err);
    return jsonResponse(
      { error: 'save failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
      ctx.setCookie,
    );
  }
}
