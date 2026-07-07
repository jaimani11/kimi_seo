import type { TripProposal } from '@core/trip-proposal';
import type { ProposalDiff } from '@core/intent-delta';

/**
 * Diff between two TripProposals - drives the canvas's diff transition
 * (cards present in both freeze; removed fade; added materialize; hero
 * cross-fades on swap). Identity tracking is by Stay.id.
 */
export function computeProposalDiff(prior: TripProposal, next: TripProposal): ProposalDiff {
  const heroChanged: ProposalDiff['heroChanged'] =
    prior.hero.id === next.hero.id ? null : { before: prior.hero.id, after: next.hero.id };

  const priorAlts = new Set(prior.alternatives.map((s) => s.id));
  const nextAlts = new Set(next.alternatives.map((s) => s.id));
  const alternativesAdded = next.alternatives
    .filter((s) => !priorAlts.has(s.id))
    .map((s) => s.id as string);
  const alternativesRemoved = prior.alternatives
    .filter((s) => !nextAlts.has(s.id))
    .map((s) => s.id as string);

  const sameSet = alternativesAdded.length === 0 && alternativesRemoved.length === 0;
  const alternativesReordered =
    sameSet &&
    prior.alternatives.map((s) => s.id).join('|') !== next.alternatives.map((s) => s.id).join('|');

  const priorChips = new Set(prior.reasoning.highlights.map((c) => `${c.source}:${c.label}`));
  const nextChips = new Set(next.reasoning.highlights.map((c) => `${c.source}:${c.label}`));
  const reasoningChanged = {
    added: next.reasoning.highlights.filter((c) => !priorChips.has(`${c.source}:${c.label}`)),
    removed: prior.reasoning.highlights.filter((c) => !nextChips.has(`${c.source}:${c.label}`)),
  };

  const totalCostDelta =
    prior.reasoning.totalCost && next.reasoning.totalCost
      ? {
          before: prior.reasoning.totalCost.amount,
          after: next.reasoning.totalCost.amount,
        }
      : undefined;

  return {
    heroChanged,
    alternativesAdded,
    alternativesRemoved,
    alternativesReordered,
    reasoningChanged,
    ...(totalCostDelta ? { totalCostDelta } : {}),
  };
}
