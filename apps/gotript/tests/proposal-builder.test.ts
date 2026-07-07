import { describe, expect, it } from 'vitest';
import { buildProposal, buildProposalRef } from '@/orchestrator/proposal-builder';
import { fakeStayPool } from './helpers/fake-stays';
import type { TripIntent } from '@core/trip-intent';

const ALL_STAYS = fakeStayPool(8);

const intent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
  budget: { kind: 'unspecified' },
  vibe: { tags: ['walkable', 'family-friendly'] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'a',
};

const emptyTrace = { agents: [], totalDurationMs: 0 };

describe('buildProposal', () => {
  it('throws when no stays given', () => {
    expect(() => buildProposal({ intent, stays: [], agentTrace: emptyTrace })).toThrow();
  });

  it('uses first stay as hero and up to 3 alternatives', () => {
    const stays = ALL_STAYS.slice(0, 6);
    const p = buildProposal({ intent, stays, agentTrace: emptyTrace });
    expect(p.hero.id).toBe(stays[0]?.id);
    expect(p.alternatives.length).toBe(3);
  });

  it('derives reasoning chips from intent vibe tags', () => {
    const stays = ALL_STAYS.slice(0, 4);
    const p = buildProposal({ intent, stays, agentTrace: emptyTrace });
    const labels = p.reasoning.highlights.map((c) => c.label);
    expect(labels).toContain('walkable');
    expect(labels).toContain('family friendly');
  });

  it('computes totalCost when nights > 0', () => {
    const stays = ALL_STAYS.slice(0, 4);
    const p = buildProposal({ intent, stays, agentTrace: emptyTrace });
    const hero = stays[0];
    expect(p.reasoning.totalCost?.amount).toBe((hero?.pricing.pricePerNight.amount ?? 0) * 7);
  });
});

describe('buildProposalRef', () => {
  it('returns a stable proposalId for the same proposal', () => {
    const stays = ALL_STAYS.slice(0, 4);
    const p = buildProposal({ intent, stays, agentTrace: emptyTrace });
    const r1 = buildProposalRef(p, 't1');
    const r2 = buildProposalRef(p, 't1');
    expect(r1.proposalId).toBe(r2.proposalId);
  });
});
