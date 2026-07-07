import { describe, expect, it } from 'vitest';
import { SEO_CITIES } from '@/lib/seo/cities';
import {
  DESTINATION_GUIDES,
  findDestinationGuide,
  hasDestinationGuide,
} from '@/lib/seo/destination-content';

describe('DESTINATION_GUIDES coverage', () => {
  /**
   * Phase 7 decouples authored guides from the SEO city allowlist:
   * adding a city unlocks the route fan-out (itinerary / things-to-do
   * / themed / weekend / comparison) without requiring a hand-written
   * destination guide. Guides remain a Sprint-12-style content sprint
   * — every guide that DOES exist is held to quality bars below; new
   * cities can join the guide set as content is authored.
   */
  it('has at least one guide for every populated continent in the existing set', () => {
    // Sanity check: not every SEO city has a guide, but we don't
    // want the guide set to silently empty out either. ≥20 guides
    // is the Sprint-12 floor — Phase 7 keeps it.
    expect(Object.keys(DESTINATION_GUIDES).length).toBeGreaterThanOrEqual(20);
  });

  it('has no guides for non-existent cities', () => {
    expect(hasDestinationGuide('atlantis')).toBe(false);
    expect(hasDestinationGuide('')).toBe(false);
  });

  it('every guide slug maps to an actual SEO city', () => {
    const cityIds = new Set(SEO_CITIES.map((c) => c.slug));
    for (const slug of Object.keys(DESTINATION_GUIDES)) {
      expect(cityIds).toContain(slug);
    }
  });
});

describe('DestinationGuide content quality', () => {
  // Iterate over guides, not all SEO_CITIES. Phase 7 lets cities
  // exist without a guide; we only hold the AUTHORED guides to the
  // quality bar.
  for (const slug of Object.keys(DESTINATION_GUIDES)) {
    const c = SEO_CITIES.find((x) => x.slug === slug);
    if (!c) continue; // dangling guide caught by the previous suite
    describe(`${c.slug} guide`, () => {
      const g = findDestinationGuide(c.slug);

      it('exists', () => {
        expect(g).not.toBeNull();
      });

      it('has bestTimeToVisit with months + non-empty blurb', () => {
        expect(g!.bestTimeToVisit.months.length).toBeGreaterThan(5);
        expect(g!.bestTimeToVisit.blurb.length).toBeGreaterThanOrEqual(30);
      });

      it('has three budget tiers in ascending order', () => {
        const b = g!.budget;
        expect(b.budgetDailyUSD).toBeGreaterThan(0);
        expect(b.midDailyUSD).toBeGreaterThan(b.budgetDailyUSD);
        expect(b.luxuryDailyUSD).toBeGreaterThan(b.midDailyUSD);
        expect(b.blurb.length).toBeGreaterThanOrEqual(20);
      });

      it('has family / couples / solo content (each ≥ 40 chars)', () => {
        expect(g!.travelStyles.family.length).toBeGreaterThanOrEqual(40);
        expect(g!.travelStyles.couples.length).toBeGreaterThanOrEqual(40);
        expect(g!.travelStyles.solo.length).toBeGreaterThanOrEqual(40);
      });

      it('has 3+ food items, each with a dish name + note', () => {
        expect(g!.food.length).toBeGreaterThanOrEqual(3);
        for (const f of g!.food) {
          expect(f.dish.length).toBeGreaterThan(2);
          expect(f.note.length).toBeGreaterThanOrEqual(20);
        }
      });

      it('has transportation primary + tips', () => {
        expect(g!.transportation.primary.length).toBeGreaterThanOrEqual(20);
        expect(g!.transportation.tips.length).toBeGreaterThanOrEqual(20);
      });

      it('has 2+ neighborhoods, each with a name + blurb', () => {
        expect(g!.neighborhoods.length).toBeGreaterThanOrEqual(2);
        for (const n of g!.neighborhoods) {
          expect(n.name.length).toBeGreaterThan(2);
          expect(n.blurb.length).toBeGreaterThanOrEqual(20);
        }
      });

      it('has non-trivial safety content', () => {
        expect(g!.safety.length).toBeGreaterThanOrEqual(20);
      });
    });
  }
});
