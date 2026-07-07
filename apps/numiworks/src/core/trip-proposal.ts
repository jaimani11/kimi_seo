import { z } from 'zod';
import { StaySchema, type Stay } from './stay';
import { TripIntentSchema } from './trip-intent';

export const ReasoningChipSchema = z.object({
  label: z.string(),
  source: z.enum(['intent', 'agent']),
  emphasized: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type ReasoningChip = z.infer<typeof ReasoningChipSchema>;

export const AgentTraceSummarySchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      durationMs: z.number().int(),
      modelMeta: z
        .object({
          model: z.string(),
          tokensIn: z.number().int(),
          tokensOut: z.number().int(),
          cacheHit: z.boolean().optional(),
        })
        .optional(),
    }),
  ),
  totalDurationMs: z.number().int(),
});
export type AgentTraceSummary = z.infer<typeof AgentTraceSummarySchema>;

export const TripProposalSchema = z.object({
  intent: TripIntentSchema,
  hero: StaySchema,
  alternatives: z.array(StaySchema).max(4),
  reasoning: z.object({
    highlights: z.array(ReasoningChipSchema),
    summary: z.string(),
    totalCost: z.object({ amount: z.number(), currency: z.string().length(3) }).optional(),
  }),
  agentTrace: AgentTraceSummarySchema,
  generatedAt: z.string(),
});
// Use the branded Stay TS type, not the schema-inferred string ids.
export type TripProposal = Omit<z.infer<typeof TripProposalSchema>, 'hero' | 'alternatives'> & {
  hero: Stay;
  alternatives: Stay[];
};
