import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryHinter, type CompletedTurn } from '@/lib/memory-hinter/memory-hinter';
import type { TripIntent } from '@core/trip-intent';

function turn(tags: string[]): CompletedTurn {
  const intent: TripIntent = {
    destinations: [],
    dates: { kind: 'unspecified' },
    duration: { nights: 0, flexible: true },
    travelers: { adults: 1, children: { count: 0 }, infants: 0 },
    budget: { kind: 'unspecified' },
    vibe: { tags: tags as TripIntent['vibe']['tags'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: tags.join(','),
  };
  return { intent };
}

let hinter: MemoryHinter;

beforeEach(() => {
  hinter = new MemoryHinter();
});

describe('MemoryHinter', () => {
  it('returns null below threshold', () => {
    hinter.observeTurn(turn(['walkable']));
    hinter.observeTurn(turn(['walkable']));
    expect(hinter.evaluate()).toBeNull();
  });

  it('fires when 3+ turns share a vibe tag with a phrasing', () => {
    hinter.observeTurn(turn(['walkable', 'family-friendly']));
    hinter.observeTurn(turn(['walkable', 'foodie']));
    hinter.observeTurn(turn(['walkable']));
    const hint = hinter.evaluate();
    expect(hint).not.toBeNull();
    expect(hint?.signalKey).toBe('walkable');
    expect(hint?.message).toContain('walkable');
  });

  it('does not double-fire after markFired', () => {
    for (let i = 0; i < 4; i++) hinter.observeTurn(turn(['walkable']));
    expect(hinter.evaluate()).not.toBeNull();
    hinter.markFired();
    expect(hinter.evaluate()).toBeNull();
  });

  it('reset clears observations + fired state', () => {
    for (let i = 0; i < 3; i++) hinter.observeTurn(turn(['walkable']));
    hinter.markFired();
    hinter.reset();
    expect(hinter.evaluate()).toBeNull();
    for (let i = 0; i < 3; i++) hinter.observeTurn(turn(['walkable']));
    expect(hinter.evaluate()).not.toBeNull();
  });

  it('returns null for tags without phrasings', () => {
    for (let i = 0; i < 3; i++) hinter.observeTurn(turn(['mid-range']));
    expect(hinter.evaluate()).toBeNull();
  });

  it('picks the most-frequent dominant tag when ties exist', () => {
    hinter.observeTurn(turn(['walkable', 'foodie']));
    hinter.observeTurn(turn(['walkable', 'foodie']));
    hinter.observeTurn(turn(['walkable']));
    hinter.observeTurn(turn(['foodie']));
    const hint = hinter.evaluate();
    expect(hint?.signalKey).toBe('walkable');
  });
});
