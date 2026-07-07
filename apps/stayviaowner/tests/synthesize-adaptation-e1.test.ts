import { describe, expect, it } from 'vitest';
import { synthesizeAdaptationNotes } from '@/orchestrator/synthesize-adaptation';
import type { IntentDelta } from '@core/intent-delta';

/**
 * Slice E1 promoted vague adaptation labels into specific, action-
 * cited ones so refines visibly change the trip-board reasoning chips.
 * These tests cover the new wording surface.
 */

function delta(changed: IntentDelta['changed']): IntentDelta {
  return { added: {}, changed, removed: [] };
}

describe('synthesizeAdaptationNotes - Slice E1 specificity', () => {
  it('vibe added/removed → "Added: …" / "Dropped: …" notes', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'vibe',
          before: { tags: ['remote', 'slow'] },
          after: { tags: ['walkable', 'slow'] },
        },
      ]),
    );
    const descriptions = notes.map((n) => n.description);
    expect(descriptions).toContain('Added: walkable');
    expect(descriptions).toContain('Dropped: remote');
  });

  it('budget tightening cites the new cap with currency symbol', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'budget',
          before: { kind: 'per-night', amount: 350, currency: 'EUR', flexibility: 'firm' },
          after: { kind: 'per-night', amount: 200, currency: 'EUR', flexibility: 'firm' },
        },
      ]),
    );
    expect(notes[0]?.description).toBe('Tightened budget to €200/night');
    expect(notes[0]?.direction).toBe('down');
  });

  it('budget loosening reads as "Raised budget"', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'budget',
          before: { kind: 'total', amount: 1000, currency: 'USD', flexibility: 'firm' },
          after: { kind: 'total', amount: 2000, currency: 'USD', flexibility: 'firm' },
        },
      ]),
    );
    expect(notes[0]?.description).toBe('Raised budget to $2,000 total');
  });

  it('introducing a budget where there was none → "Set budget"', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'budget',
          before: { kind: 'unspecified' },
          after: { kind: 'per-night', amount: 250, currency: 'GBP', flexibility: 'firm' },
        },
      ]),
    );
    expect(notes[0]?.description).toBe('Set budget: £250/night');
  });

  it('preferences must-have addition → "Now requires: …"', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'preferences',
          before: { amenities: [], avoid: [] },
          after: { amenities: ['pool', 'breakfast'], avoid: [] },
        },
      ]),
    );
    expect(notes.find((n) => n.signal === 'amenities')?.description).toBe(
      'Now requires: pool, breakfast',
    );
  });

  it('preferences avoid addition → "Avoiding: …"', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'preferences',
          before: { amenities: [], avoid: [] },
          after: { amenities: [], avoid: ['shared-bathroom'] },
        },
      ]),
    );
    expect(notes.find((n) => n.signal === 'avoid')?.description).toBe('Avoiding: shared bathroom');
  });

  it('destinations swap → New + Dropped notes', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'destinations',
          before: [{ name: 'Tuscany' }],
          after: [{ name: 'Umbria' }],
        },
      ]),
    );
    const descriptions = notes.map((n) => n.description);
    expect(descriptions).toContain('New destination: Umbria');
    expect(descriptions).toContain('Dropped destination: Tuscany');
  });

  it('duration with explicit nights → "Trip length now N nights"', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'duration',
          before: { nights: 5 },
          after: { nights: 7 },
        },
      ]),
    );
    expect(notes[0]?.description).toBe('Trip length now 7 nights');
  });

  it('travelers count change reads as "Now N travelers"', () => {
    const notes = synthesizeAdaptationNotes(
      delta([
        {
          key: 'travelers',
          before: { adults: 2, children: { count: 0 }, infants: 0 },
          after: { adults: 2, children: { count: 2 }, infants: 0 },
        },
      ]),
    );
    expect(notes[0]?.description).toBe('Now 4 travelers');
    expect(notes[0]?.direction).toBe('up');
  });
});
