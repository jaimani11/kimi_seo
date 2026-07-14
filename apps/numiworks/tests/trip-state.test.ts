import { describe, expect, it } from 'vitest';
import type { TripIntent } from '@core/trip-intent';
import {
  emptyTripState,
  nextMissingQuestion,
  essentialsKnown,
  unresolvedFields,
  isFieldKnown,
  applyDelta,
  detectConflicts,
  historyOf,
  pushState,
  current,
  undo,
  reset,
  type TripIntentDelta,
} from '@/lib/concierge/trip-state';
import { isNumiworksAffiliateSafe } from '@/lib/affiliate/numiworks-guard';

function makeIntent(over: Partial<TripIntent> = {}): TripIntent {
  return {
    destinations: [],
    dates: { kind: 'unspecified' },
    duration: { nights: 0, flexible: true },
    travelers: { adults: 0, children: { count: 0 }, infants: 0 },
    budget: { kind: 'unspecified' },
    vibe: { tags: [] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: '',
    ...over,
  };
}

const ROME = { kind: 'curated' as const, name: 'Rome', country: 'IT' };
const withDest = () => makeIntent({ destinations: [ROME] });
const withDestDates = () =>
  makeIntent({ destinations: [ROME], dates: { kind: 'flexible-month', month: 'August', year: 2026 } });
const withEssentials = () =>
  makeIntent({
    destinations: [ROME],
    dates: { kind: 'flexible-month', month: 'August', year: 2026 },
    travelers: { adults: 2, children: { count: 0 }, infants: 0 },
  });

describe('Phase B — next missing question (priority order)', () => {
  it('1. asks for destination first when nothing is known', () => {
    expect(nextMissingQuestion(emptyTripState(makeIntent()))?.field).toBe('destination');
  });
  it('2. asks for dates once destination is known', () => {
    expect(nextMissingQuestion(emptyTripState(withDest()))?.field).toBe('dates');
  });
  it('3. asks for travelers once destination + dates are known', () => {
    expect(nextMissingQuestion(emptyTripState(withDestDates()))?.field).toBe('travelers');
  });
  it('4. asks for budget once destination + dates + travelers are known', () => {
    const s = emptyTripState(withEssentials());
    expect(nextMissingQuestion(s)?.field).toBe('budget');
    // …but essentials are known, so the caller should show results (non-blocking).
    expect(essentialsKnown(s)).toBe(true);
  });
  it('5. never re-asks a known field, and never re-asks a skipped field', () => {
    // destination known → not asked
    expect(unresolvedFields(emptyTripState(withDest()))).not.toContain('destination');
    // skip dates → not asked again
    const skipped = applyDelta(emptyTripState(withDest()), { skipQuestion: 'dates' }).state;
    expect(unresolvedFields(skipped)).not.toContain('dates');
    expect(nextMissingQuestion(skipped)?.field).toBe('travelers');
  });
});

describe('Phase B — refinements as targeted deltas', () => {
  it('6. "make it cheaper" lowers budget + shifts vibe to budget, patches', () => {
    const prior = emptyTripState(
      makeIntent({ budget: { kind: 'per-night', amount: 400, currency: 'EUR', flexibility: 'flexible' }, vibe: { tags: ['luxury'] } }),
    );
    const r = applyDelta(prior, { budgetDirection: 'cheaper' });
    expect(r.strategy).toBe('patch');
    expect(r.state.intent.budget.kind === 'per-night' && r.state.intent.budget.amount).toBe(300);
    expect(r.state.intent.vibe.tags).toContain('budget');
    expect(r.state.intent.vibe.tags).not.toContain('luxury');
  });
  it('7. "more luxurious" raises budget + shifts vibe to luxury', () => {
    const prior = emptyTripState(
      makeIntent({ budget: { kind: 'per-night', amount: 100, currency: 'EUR', flexibility: 'flexible' }, vibe: { tags: ['budget'] } }),
    );
    const r = applyDelta(prior, { budgetDirection: 'more-luxurious' });
    expect(r.state.intent.vibe.tags).toContain('luxury');
    expect(r.state.intent.vibe.tags).not.toContain('budget');
    expect(r.state.intent.budget.kind === 'per-night' && r.state.intent.budget.amount).toBe(140);
  });
  it('8. "no museums" adds to avoid + emits a remove-items itinerary edit, patches', () => {
    const r = applyDelta(emptyTripState(withEssentials()), { addAvoid: ['museums'] });
    expect(r.strategy).toBe('patch');
    expect(r.state.intent.preferences.avoid).toContain('museums');
    expect(r.itineraryEdits).toContainEqual({ kind: 'remove-items', items: ['museums'] });
  });
  it('9. "two children, ages 6 and 9" updates party + keeps destination + dates', () => {
    const r = applyDelta(emptyTripState(withEssentials()), { setChildren: { count: 2, ages: [6, 9] } });
    expect(r.strategy).toBe('patch');
    expect(r.state.intent.travelers.children).toEqual({ count: 2, ages: [6, 9] });
    expect(r.state.intent.travelers.groupKind).toBe('family');
    // destination + dates intact
    expect(r.state.intent.destinations[0]?.name).toBe('Rome');
    expect(r.state.intent.dates.kind).toBe('flexible-month');
  });
  it('10. "replace day three" emits a replace-day edit only (patches)', () => {
    const r = applyDelta(emptyTripState(withEssentials()), { replaceDay: 3 });
    expect(r.strategy).toBe('patch');
    expect(r.itineraryEdits).toContainEqual({ kind: 'replace-day', day: 3 });
  });
  it('11. "keep the house, change activities" preserves lodging', () => {
    const r = applyDelta(emptyTripState(withEssentials()), { keepLodging: true, replaceActivities: true });
    expect(r.state.mustKeep).toContain('lodging');
    expect(r.itineraryEdits).toContainEqual({ kind: 'keep-lodging' });
    expect(r.itineraryEdits).toContainEqual({ kind: 'replace-activities' });
  });
  it('12. changing destination triggers a rebuild', () => {
    const r = applyDelta(emptyTripState(withEssentials()), { setDestination: { name: 'Lisbon', country: 'PT' } });
    expect(r.strategy).toBe('rebuild');
    expect(r.state.intent.destinations[0]?.name).toBe('Lisbon');
  });
  it('13. changing the whole date range triggers a rebuild', () => {
    const r = applyDelta(emptyTripState(withEssentials()), {
      setDates: { kind: 'specific', start: '2026-08-10', end: '2026-08-14' },
    });
    expect(r.strategy).toBe('rebuild');
    expect(r.state.intent.dates).toEqual({ kind: 'specific', start: '2026-08-10', end: '2026-08-14' });
  });
  it('16. accessibility requirement is recorded', () => {
    const r = applyDelta(emptyTripState(withEssentials()), { addAccessibility: ['wheelchair'] });
    expect(r.state.intent.preferences.accessibility).toContain('wheelchair');
  });
  it('17. dietary requirement is recorded on state (not raw text)', () => {
    const r = applyDelta(emptyTripState(withEssentials()), { addDietary: ['vegetarian'] });
    expect(r.state.dietary).toContain('vegetarian');
  });
  it('18. a malformed / empty delta is a safe no-op (never throws)', () => {
    const prior = emptyTripState(withEssentials());
    expect(() => applyDelta(prior, {} as TripIntentDelta)).not.toThrow();
    expect(() => applyDelta(prior, null as unknown as TripIntentDelta)).not.toThrow();
    const r = applyDelta(prior, { setChildren: { count: -5 } as never });
    // negative count is clamped/ignored gracefully, destination preserved
    expect(r.state.intent.destinations[0]?.name).toBe('Rome');
  });
});

describe('Phase B — conflicts', () => {
  it('15. flags budget-vs-luxury as a stated assumption (not a block)', () => {
    const s = emptyTripState(makeIntent({ vibe: { tags: ['budget', 'luxury'] } }));
    const c = detectConflicts(s);
    expect(c.some((x) => x.kind === 'budget-vs-luxury' && x.severity === 'assume')).toBe(true);
  });
  it('flags avoid-vs-must-keep as a blocking conflict', () => {
    const base = emptyTripState(makeIntent({ preferences: { amenities: [], avoid: ['museums'] } }));
    const s = { ...base, mustKeep: ['museums'] };
    const c = detectConflicts(s);
    expect(c.some((x) => x.kind === 'avoid-vs-mustkeep' && x.severity === 'block')).toBe(true);
  });
});

describe('Phase B — session history (undo / reset)', () => {
  it('14. undo reverts the last edit', () => {
    const h0 = historyOf(emptyTripState(withEssentials()));
    const afterCheaper = applyDelta(current(h0), { budgetDirection: 'cheaper' }).state;
    const h1 = pushState(h0, afterCheaper);
    expect(current(h1).intent.vibe.tags).toContain('budget');
    const h2 = undo(h1);
    expect(current(h2).intent.vibe.tags).not.toContain('budget'); // back to before the edit
  });
  it('19. reset (start over) returns to the initial session state', () => {
    const h0 = historyOf(emptyTripState(withEssentials()));
    let h = pushState(h0, applyDelta(current(h0), { addAvoid: ['museums'] }).state);
    h = pushState(h, applyDelta(current(h), { setChildren: { count: 2, ages: [6, 9] } }).state);
    const back = reset(h);
    expect(current(back).intent.preferences.avoid).toEqual([]);
    expect(current(back).intent.travelers.children.count).toBe(0);
  });
});

describe('Phase B — no cross-brand affiliate regression', () => {
  it('20. state edits never introduce a sibling-brand affiliate id', () => {
    // The state model holds no URLs; assert the guard still rejects foreign ids.
    expect(isNumiworksAffiliateSafe('https://www.anrdoezrs.net/click-101803878-17293132')).toBe(false);
    expect(isNumiworksAffiliateSafe('https://www.viator.com/tours/Rome/x/d511-P123')).toBe(true);
  });
});
