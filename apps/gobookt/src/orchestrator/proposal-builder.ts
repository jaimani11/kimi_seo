import type { ReasoningChip, TripProposal, AgentTraceSummary } from '@core/trip-proposal';
import type { Stay } from '@core/stay';
import type { TripIntent } from '@core/trip-intent';
import type { ProposalRef } from '@core/partial';

/**
 * Stitch the ranked stays from the provider into a TripProposal. The hero
 * is the top-ranked stay; up to 3 alternatives follow. Reasoning highlights
 * are derived from the user's intent (source: 'intent') - Slice B's
 * RankingAgent will add 'agent'-source chips on top.
 */
export function buildProposal(args: {
  intent: TripIntent;
  stays: readonly Stay[];
  agentTrace: AgentTraceSummary;
}): TripProposal {
  const [hero, ...rest] = args.stays;
  if (!hero) {
    throw new Error('buildProposal: no stays provided');
  }
  const alternatives = rest.slice(0, 3);

  const highlights: ReasoningChip[] = args.intent.vibe.tags.map((tag) => ({
    label: humanizeTag(tag),
    source: 'intent',
  }));

  const totalCost =
    args.intent.duration.nights > 0
      ? {
          amount: hero.pricing.pricePerNight.amount * args.intent.duration.nights,
          currency: hero.pricing.pricePerNight.currency,
        }
      : undefined;

  return {
    intent: args.intent,
    hero,
    alternatives,
    reasoning: {
      highlights,
      summary: buildConciergeSummary(args.intent, hero, alternatives.length),
      ...(totalCost ? { totalCost } : {}),
    },
    agentTrace: args.agentTrace,
    generatedAt: new Date().toISOString(),
  };
}

export function buildConciergeSummary(intent: TripIntent, hero: Stay, altCount: number): string {
  const dest = intent.destinations[0]?.name ?? hero.location.region ?? hero.location.country;
  const tags = intent.vibe.tags.slice(0, 2).map(humanizeTag);
  const tagPart = tags.length > 0 ? ` - ${tags.join(', ')}` : '';
  return `${dest}${tagPart}. Hero pick plus ${altCount} alternative${altCount === 1 ? '' : 's'}.`;
}

export function buildProposalRef(proposal: TripProposal, turnId: string): ProposalRef {
  return {
    turnId,
    proposalId: stableProposalId(proposal),
    generatedAt: proposal.generatedAt,
    summary: {
      destinationName:
        proposal.intent.destinations[0]?.name ??
        proposal.hero.location.region ??
        proposal.hero.location.country,
      nights: proposal.intent.duration.nights,
      heroStayName: proposal.hero.name,
    },
  };
}

function stableProposalId(proposal: TripProposal): string {
  // Slice A: stable id from hero + alternatives ids. Slice B can hash the
  // full proposal contents.
  const ids = [proposal.hero.id, ...proposal.alternatives.map((a) => a.id)];
  return `p_${Buffer.from(ids.join('|')).toString('base64url').slice(0, 22)}`;
}

function humanizeTag(tag: string): string {
  return tag.replace(/-/g, ' ');
}
