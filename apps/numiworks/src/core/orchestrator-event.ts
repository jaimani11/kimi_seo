import { z } from 'zod';
import { TripIntentSchema } from './trip-intent';
import { TripProposalSchema } from './trip-proposal';
import { IntentDeltaSchema, ProposalDiffSchema } from './intent-delta';
import { AdaptationNoteSchema, MoodSnapshotSchema, ExplanationTopicSchema } from './reasoning';
import { ProviderBadgeSchema } from './provider';
import { FreshnessInfoSchema } from './trust';
import { ProposalRefSchema, PartialnessReportSchema } from './partial';
import { SearchOpportunitySchema } from './search-opportunity';

// Every event the UI sees flows through this discriminated union. The
// Zustand store has one reducer that pattern-matches `kind`. `turnId`
// ties events together; events from cancelled turns are dropped client-side.

const SessionStarted = z.object({
  kind: z.literal('session.started'),
  sessionId: z.string(),
  timestamp: z.number(),
});
const TurnStarted = z.object({
  kind: z.literal('turn.started'),
  turnId: z.string(),
  type: z.enum(['compose', 'refine']),
  priorTurnId: z.string().optional(),
});
const TurnCompleted = z.object({
  kind: z.literal('turn.completed'),
  turnId: z.string(),
  durationMs: z.number().int(),
  partial: PartialnessReportSchema.optional(),
});
const TurnFailed = z.object({
  kind: z.literal('turn.failed'),
  turnId: z.string(),
  error: z.string(),
  recoverable: z.boolean(),
});

const AgentStepStarted = z.object({
  kind: z.literal('agent.step.started'),
  turnId: z.string(),
  stepId: z.string(),
  agentId: z.string(),
  label: z.string(),
});
const AgentStepProgress = z.object({
  kind: z.literal('agent.step.progress'),
  turnId: z.string(),
  stepId: z.string(),
  message: z.string().optional(),
  counter: z.object({ current: z.number().int(), total: z.number().int() }).optional(),
});
const AgentStepCompleted = z.object({
  kind: z.literal('agent.step.completed'),
  turnId: z.string(),
  stepId: z.string(),
  durationMs: z.number().int(),
});
const AgentStepFailed = z.object({
  kind: z.literal('agent.step.failed'),
  turnId: z.string(),
  stepId: z.string(),
  error: z.string(),
  recoverable: z.boolean(),
});

const AgentExplanation = z.object({
  kind: z.literal('agent.explanation'),
  turnId: z.string(),
  agentId: z.string(),
  topic: ExplanationTopicSchema,
  summary: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

const IntentExtracted = z.object({
  kind: z.literal('intent.extracted'),
  turnId: z.string(),
  intent: TripIntentSchema,
});
const IntentRefined = z.object({
  kind: z.literal('intent.refined'),
  turnId: z.string(),
  intent: TripIntentSchema,
  delta: IntentDeltaSchema,
});

const ProviderSearchCompleted = z.object({
  kind: z.literal('provider.search.completed'),
  turnId: z.string(),
  providerId: z.string(),
  staysFound: z.number().int(),
  badges: z.array(ProviderBadgeSchema),
  freshness: FreshnessInfoSchema,
});

const ProposalShimmering = z.object({
  kind: z.literal('proposal.shimmering'),
  turnId: z.string(),
  expectedCount: z.number().int(),
});
const ProposalRefining = z.object({
  kind: z.literal('proposal.refining'),
  turnId: z.string(),
  priorProposalRef: ProposalRefSchema,
});
const ProposalAdaptation = z.object({
  kind: z.literal('proposal.adaptation'),
  turnId: z.string(),
  notes: z.array(AdaptationNoteSchema),
});
const ProposalReady = z.object({
  kind: z.literal('proposal.ready'),
  turnId: z.string(),
  proposal: TripProposalSchema,
});
const ProposalEvolved = z.object({
  kind: z.literal('proposal.evolved'),
  turnId: z.string(),
  proposal: TripProposalSchema,
  diff: ProposalDiffSchema,
});
const ProposalBookmarkable = z.object({
  kind: z.literal('proposal.bookmarkable'),
  turnId: z.string(),
  ref: ProposalRefSchema,
  storage: z.enum(['session', 'persistent']),
});
const ProposalProvenanceComputed = z.object({
  kind: z.literal('proposal.provenance.computed'),
  turnId: z.string(),
  provenanceMap: z.record(
    z.string(),
    z.array(
      z.object({
        kind: z.string(),
        vsProviderId: z.string().optional(),
        delta: z.string().optional(),
      }),
    ),
  ),
});

const ConciergeMessage = z.object({
  kind: z.literal('concierge.message'),
  turnId: z.string(),
  message: z.string(),
  tone: z.enum(['narrate', 'reassure', 'apologize']).optional(),
});
const ConciergeMemoryHint = z.object({
  kind: z.literal('concierge.memory.hint'),
  turnId: z.string(),
  message: z.string(),
  signalKey: z.string(),
  confidence: z.number().min(0).max(1),
});

const MoodSnapshotReady = z.object({
  kind: z.literal('mood.snapshot.ready'),
  turnId: z.string(),
  destinationName: z.string(),
  snapshot: MoodSnapshotSchema,
});

// Slice F1 - search-opportunity board (emitted when no real/curated
// provider can back the destination). The UI swaps in
// `<SearchOpportunityBoard>` instead of `<TripBoard>` for this turn.
const SearchOpportunityReady = z.object({
  kind: z.literal('search.opportunity.ready'),
  turnId: z.string(),
  opportunity: SearchOpportunitySchema,
});

export const OrchestratorEventSchema = z.discriminatedUnion('kind', [
  SessionStarted,
  TurnStarted,
  TurnCompleted,
  TurnFailed,
  AgentStepStarted,
  AgentStepProgress,
  AgentStepCompleted,
  AgentStepFailed,
  AgentExplanation,
  IntentExtracted,
  IntentRefined,
  ProviderSearchCompleted,
  ProposalShimmering,
  ProposalRefining,
  ProposalAdaptation,
  ProposalReady,
  ProposalEvolved,
  ProposalBookmarkable,
  ProposalProvenanceComputed,
  ConciergeMessage,
  ConciergeMemoryHint,
  MoodSnapshotReady,
  SearchOpportunityReady,
]);
export type OrchestratorEvent = z.infer<typeof OrchestratorEventSchema>;

// Convenience kind-indexed helper for client reducers
export type EventOfKind<K extends OrchestratorEvent['kind']> = Extract<
  OrchestratorEvent,
  { kind: K }
>;
