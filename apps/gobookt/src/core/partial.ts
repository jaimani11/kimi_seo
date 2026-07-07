import { z } from 'zod';

export const PartialnessReportSchema = z.object({
  missingComponents: z.array(z.enum(['ranking', 'mood', 'provenance', 'reasoning'])),
  degradedComponents: z.array(z.object({ component: z.string(), reason: z.string() })),
});
export type PartialnessReport = z.infer<typeof PartialnessReportSchema>;

// ProposalRef - stable lookup token for a proposal. Same shape used in:
//   * proposal.refining.priorProposalRef
//   * proposal.bookmarkable.ref
//   * ConciergeRequest.input.priorProposalRef
export const ProposalRefSchema = z.object({
  turnId: z.string(),
  proposalId: z.string(),
  generatedAt: z.string(),
  summary: z.object({
    destinationName: z.string(),
    nights: z.number().int(),
    heroStayName: z.string(),
  }),
});
export type ProposalRef = z.infer<typeof ProposalRefSchema>;
