import { describe, expect, it } from 'vitest';
import { computeProposalDiff } from '@/orchestrator/proposal-diff';
import { fakeStayPool } from './helpers/fake-stays';
import type { Stay } from '@core/stay';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';

const ALL_STAYS = fakeStayPool(10);

const intent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 0 }, infants: 0 },
  budget: { kind: 'unspecified' },
  vibe: { tags: [] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'a',
};

function build(stays: readonly Stay[]): TripProposal {
  const [hero, ...alts] = stays;
  if (!hero) throw new Error('need at least one stay');
  return {
    intent,
    hero,
    alternatives: alts.slice(0, 3),
    reasoning: { highlights: [], summary: '' },
    agentTrace: { agents: [], totalDurationMs: 0 },
    generatedAt: new Date().toISOString(),
  };
}

describe('computeProposalDiff', () => {
  it('reports null heroChanged when hero is the same', () => {
    const p = build(ALL_STAYS.slice(0, 4));
    const diff = computeProposalDiff(p, p);
    expect(diff.heroChanged).toBeNull();
    expect(diff.alternativesAdded).toEqual([]);
    expect(diff.alternativesRemoved).toEqual([]);
  });

  it('reports heroChanged when hero swaps', () => {
    const a = build(ALL_STAYS.slice(0, 4));
    const b = build(ALL_STAYS.slice(1, 5));
    const diff = computeProposalDiff(a, b);
    expect(diff.heroChanged).not.toBeNull();
    expect(diff.heroChanged?.before).toBe(a.hero.id);
    expect(diff.heroChanged?.after).toBe(b.hero.id);
  });

  it('reports added/removed alternatives', () => {
    const a = build(ALL_STAYS.slice(0, 4));
    const b = build([a.hero, ...ALL_STAYS.slice(4, 7)]);
    const diff = computeProposalDiff(a, b);
    expect(diff.alternativesAdded.length).toBeGreaterThan(0);
    expect(diff.alternativesRemoved.length).toBeGreaterThan(0);
  });
});
