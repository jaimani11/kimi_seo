import { describe, expect, it } from 'vitest';
import {
  TRAVELER_PROFILES,
  recommendForProfile,
  scoreNeighborhoodsForProfile,
  type NeighborhoodInput,
} from '@lib/seo/where-to-stay-fit';

/**
 * Deterministic-core tests for the where-to-stay decision engine. Uses the real
 * Tokyo neighborhood blurbs so the heuristics are validated against the actual
 * content shape they run on in production.
 */

const TOKYO: NeighborhoodInput[] = [
  { name: 'Shibuya', blurb: 'The scramble crossing, izakaya streets, late-night ramen.' },
  { name: 'Asakusa', blurb: 'Senso-ji temple, traditional shops, low-rise old Tokyo.' },
  { name: 'Shinjuku', blurb: 'Skyline observation decks, Golden Gai bars, Robot Restaurant.' },
  { name: 'Shimokitazawa', blurb: 'Indie cafés, vintage shops, the city’s most walkable district.' },
];

describe('where-to-stay fit scoring', () => {
  it('routes nightlife seekers to the bar districts (Shinjuku / Shibuya), not Asakusa', () => {
    const rec = recommendForProfile(TOKYO, 'nightlife');
    expect(rec.confident).toBe(true);
    expect(['Shinjuku', 'Shibuya']).toContain(rec.top?.name);
    // Asakusa (temple / low-rise) must not be the nightlife pick.
    expect(rec.top?.name).not.toBe('Asakusa');
    // The recommendation is explainable — a real matched signal drove it.
    expect(rec.top?.matched.length).toBeGreaterThan(0);
  });

  it('routes budget travelers to the indie/vintage area (Shimokitazawa)', () => {
    const rec = recommendForProfile(TOKYO, 'budget');
    expect(rec.confident).toBe(true);
    expect(rec.top?.name).toBe('Shimokitazawa');
    expect(rec.top?.matched).toEqual(expect.arrayContaining(['vintage', 'indie']));
  });

  it('nudges first-timers to the editors’ top pick unless clearly out-signalled', () => {
    const rec = recommendForProfile(TOKYO, 'first-time');
    // Shibuya is editor rank 0 and central/walkable-adjacent; the +1 nudge keeps
    // it at the top for a first-timer.
    expect(rec.top?.name).toBe('Shibuya');
  });

  it('is deterministic — stable order regardless of input array identity', () => {
    const a = scoreNeighborhoodsForProfile(TOKYO, 'families');
    const b = scoreNeighborhoodsForProfile([...TOKYO], 'families');
    expect(a.map((n) => n.name)).toEqual(b.map((n) => n.name));
  });

  it('ties break by editors’ original order, never by array position', () => {
    // Two neighborhoods with identical zero signal → editor rank decides.
    const blank: NeighborhoodInput[] = [
      { name: 'Beta', blurb: 'xxxx' },
      { name: 'Alpha', blurb: 'yyyy' },
    ];
    const ranked = scoreNeighborhoodsForProfile(blank, 'nightlife');
    expect(ranked.map((n) => n.name)).toEqual(['Beta', 'Alpha']); // input order preserved on a pure tie
    expect(ranked.every((n) => n.score === 0)).toBe(true);
  });

  it('reports low confidence when nothing matches, so the UI can soften the pitch', () => {
    const blank: NeighborhoodInput[] = [{ name: 'Nowhere', blurb: 'a place' }];
    const rec = recommendForProfile(blank, 'couples');
    expect(rec.confident).toBe(false);
    expect(rec.top?.name).toBe('Nowhere'); // still returns a fallback pick
  });

  it('exposes exactly six profiles with non-empty signal sets', () => {
    expect(TRAVELER_PROFILES).toHaveLength(6);
    for (const p of TRAVELER_PROFILES) {
      expect(p.signals.length).toBeGreaterThan(0);
      expect(p.label.length).toBeGreaterThan(0);
    }
  });
});
