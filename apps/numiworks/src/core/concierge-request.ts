import { z } from 'zod';
import { ProposalRefSchema } from './partial';

export const ClientCapabilitiesSchema = z.object({
  supportsAdaptationDelta: z.boolean(),
  supportsMoodSnapshot: z.boolean(),
  supportsMemoryHint: z.boolean(),
});
export type ClientCapabilities = z.infer<typeof ClientCapabilitiesSchema>;

/**
 * Canonical orchestrator request shape - sessionId is always set by
 * the time the orchestrator runs.
 */
export const ConciergeRequestSchema = z.object({
  sessionId: z.string(), // anon_<uuid>
  turnId: z.string(),
  type: z.enum(['compose', 'refine']),
  input: z.object({
    rawInput: z.string().min(1),
    priorProposalRef: ProposalRefSchema.optional(),
    compareSet: z.array(z.string()).max(3).optional(),
  }),
  cancelPriorTurn: z.boolean().optional(),
  clientCapabilities: ClientCapabilitiesSchema,
});
export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;

/**
 * Wire-level body schema for `POST /api/concierge`. Looser than the
 * canonical shape: `sessionId` is optional so external callers /
 * smoke tests / replay tools don't have to know about this - the
 * cookie session is the canonical source. The route transforms a
 * parsed body into a `ConciergeRequest` by filling in the cookie
 * session id before passing it to the orchestrator.
 */
export const ConciergeRequestBodySchema = ConciergeRequestSchema.extend({
  sessionId: z.string().optional(),
});
