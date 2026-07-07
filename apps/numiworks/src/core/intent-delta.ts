import { z } from 'zod';
import { ReasoningChipSchema } from './trip-proposal';
import { TripIntentSchema } from './trip-intent';

// IntentDelta - `changed` keeps before/after as `unknown` since values can
// be arbitrary slice types on either side; the structural fact is that key
// "X" changed from BEFORE to AFTER.
export const IntentDeltaSchema = z.object({
  added: TripIntentSchema.partial(),
  changed: z.array(
    z.object({
      key: z.string(),
      before: z.unknown(),
      after: z.unknown(),
    }),
  ),
  removed: z.array(z.string()),
});
export type IntentDelta = z.infer<typeof IntentDeltaSchema>;

export const ProposalDiffSchema = z.object({
  heroChanged: z
    .object({
      before: z.string(),
      after: z.string(),
    })
    .nullable(),
  alternativesAdded: z.array(z.string()),
  alternativesRemoved: z.array(z.string()),
  alternativesReordered: z.boolean(),
  reasoningChanged: z.object({
    added: z.array(ReasoningChipSchema),
    removed: z.array(ReasoningChipSchema),
  }),
  totalCostDelta: z
    .object({
      before: z.number(),
      after: z.number(),
    })
    .optional(),
});
export type ProposalDiff = z.infer<typeof ProposalDiffSchema>;
