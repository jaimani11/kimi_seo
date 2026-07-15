import { describe, expect, it } from 'vitest';
import {
  StructuredItinerarySchema,
  ItineraryBookableSchema,
  parseItinerary,
  safeItinerary,
  applyItineraryEdits,
  type StructuredItinerary,
  type ItineraryItem,
} from '@/lib/concierge/itinerary-schema';
import { applyDelta, emptyTripState } from '@/lib/concierge/trip-state';
import type { TripIntent } from '@core/trip-intent';

const item = (timeOfDay: ItineraryItem['timeOfDay'], kind: ItineraryItem['kind'], title: string): ItineraryItem => ({
  timeOfDay,
  kind,
  title,
});

function makeItin(): StructuredItinerary {
  return {
    tripSummary: '5 days in Rome',
    assumptions: ['2 adults', 'flexible dates'],
    days: [
      { day: 1, items: [item('morning', 'experience', 'Colosseum tour'), item('afternoon', 'meal', 'Trastevere lunch')] },
      { day: 2, items: [item('morning', 'experience', 'Vatican tour'), item('evening', 'experience', 'Boat tour on the Tiber')] },
      { day: 3, items: [item('morning', 'experience', 'Cooking class'), item('afternoon', 'free', 'Free afternoon')] },
      { day: 4, items: [item('morning', 'experience', 'Day trip to Pompeii')] },
      { day: 5, items: [item('morning', 'experience', 'Borghese Gallery')] },
    ],
    lodging: [{ title: 'Central B&B', area: 'Monti' }],
    weatherCaveats: [],
    unresolvedQuestions: [],
  };
}

function makeIntent(over: Partial<TripIntent> = {}): TripIntent {
  return {
    destinations: [{ kind: 'curated', name: 'Rome', country: 'IT' }],
    dates: { kind: 'flexible-month', month: 'August', year: 2026 },
    duration: { nights: 5, flexible: true },
    travelers: { adults: 2, children: { count: 0 }, infants: 0 },
    budget: { kind: 'unspecified' },
    vibe: { tags: [] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: '',
    ...over,
  };
}

describe('Phase C — schema validation + safe fallback', () => {
  it('validates a well-formed itinerary', () => {
    expect(StructuredItinerarySchema.safeParse(makeItin()).success).toBe(true);
    expect(parseItinerary(makeItin()).ok).toBe(true);
  });

  it('rejects malformed output with a structured error (never throws)', () => {
    const bad = { tripSummary: 'x', days: 'not-an-array' };
    const r = parseItinerary(bad);
    expect(r.ok).toBe(false);
    expect(r.itinerary).toBeNull();
    expect(r.error).toBeTruthy();
  });

  it('safeItinerary always returns a valid itinerary, salvaging valid days', () => {
    const partial = {
      tripSummary: 'Rome trip',
      days: [
        { day: 1, items: [item('morning', 'experience', 'Colosseum')] }, // valid
        { day: 'oops', items: [] }, // invalid → dropped
      ],
    };
    const out = safeItinerary(partial);
    expect(StructuredItinerarySchema.safeParse(out).success).toBe(true);
    expect(out.days).toHaveLength(1);
    expect(out.tripSummary).toBe('Rome trip');
  });

  it('safeItinerary on garbage returns a valid shell with an unresolved question', () => {
    const out = safeItinerary('total garbage');
    expect(StructuredItinerarySchema.safeParse(out).success).toBe(true);
    expect(out.days).toEqual([]);
    expect(out.unresolvedQuestions.length).toBeGreaterThan(0);
  });

  it('bookable cards never-invent: a zero price is rejected by the schema', () => {
    const base = { title: 'Tour', provider: 'Viator', url: 'https://www.viator.com/x', disclosure: 'Affiliate' };
    expect(ItineraryBookableSchema.safeParse({ ...base }).success).toBe(true); // no price → fine
    expect(ItineraryBookableSchema.safeParse({ ...base, price: { amount: 0, currency: 'EUR' } }).success).toBe(false);
    expect(ItineraryBookableSchema.safeParse({ ...base, price: { amount: 59, currency: 'EUR' } }).success).toBe(true);
  });
});

describe('Phase C — apply itinerary edits (patch, preserve unaffected days)', () => {
  it('replace-day clears only that day; others are preserved verbatim', () => {
    const out = applyItineraryEdits(makeItin(), [{ kind: 'replace-day', day: 3 }]);
    expect(out.days.find((d) => d.day === 3)?.items).toEqual([]);
    expect(out.days.find((d) => d.day === 1)?.items).toHaveLength(2);
    expect(out.days.find((d) => d.day === 4)?.items[0]?.title).toBe('Day trip to Pompeii');
    expect(out.days.find((d) => d.day === 5)?.items).toHaveLength(1);
  });

  it('remove-items drops matching items across days, keeps the rest', () => {
    const out = applyItineraryEdits(makeItin(), [{ kind: 'remove-items', items: ['boat'] }]);
    const allTitles = out.days.flatMap((d) => d.items.map((i) => i.title.toLowerCase()));
    expect(allTitles.some((t) => t.includes('boat'))).toBe(false);
    expect(allTitles).toContain('colosseum tour'); // unaffected item survives
  });

  it('replace-activities clears bookable experiences but keeps meals / free / travel', () => {
    const out = applyItineraryEdits(makeItin(), [{ kind: 'replace-activities' }]);
    const kinds = out.days.flatMap((d) => d.items.map((i) => i.kind));
    expect(kinds).not.toContain('experience');
    expect(kinds).toContain('meal'); // Trastevere lunch kept
    expect(kinds).toContain('free');
  });

  it('add-free-afternoon inserts a free afternoon into the first day without one', () => {
    const out = applyItineraryEdits(makeItin(), [{ kind: 'add-free-afternoon' }]);
    const day1 = out.days.find((d) => d.day === 1);
    expect(day1?.items.some((i) => i.timeOfDay === 'afternoon' && i.kind === 'free')).toBe(true);
  });

  it('keep-lodging preserves the lodging block', () => {
    const out = applyItineraryEdits(makeItin(), [{ kind: 'keep-lodging' }]);
    expect(out.lodging[0]?.title).toBe('Central B&B');
  });
});

describe('Phase C — B→C wiring: Phase B deltas drive itinerary patches', () => {
  it('"replace day 3" from Phase B applies as a day-3 clear in Phase C', () => {
    const merge = applyDelta(emptyTripState(makeIntent()), { replaceDay: 3 });
    const out = applyItineraryEdits(makeItin(), merge.itineraryEdits);
    expect(out.days.find((d) => d.day === 3)?.items).toEqual([]);
    expect(out.days.find((d) => d.day === 2)?.items).toHaveLength(2); // day 2 untouched
  });

  it('"no museums" from Phase B removes museum items but keeps the rest', () => {
    const itin = makeItin();
    itin.days[0]!.items.push(item('afternoon', 'experience', 'Capitoline Museums'));
    const merge = applyDelta(emptyTripState(makeIntent()), { addAvoid: ['museums'] });
    const out = applyItineraryEdits(itin, merge.itineraryEdits);
    const titles = out.days.flatMap((d) => d.items.map((i) => i.title.toLowerCase()));
    expect(titles.some((t) => t.includes('museum'))).toBe(false);
    expect(titles).toContain('colosseum tour');
  });
});
