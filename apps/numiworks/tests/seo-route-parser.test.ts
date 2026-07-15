import { describe, expect, it } from 'vitest';
import {
  enumerateAllSeoSlugs,
  parseSeoSlug,
} from '@/lib/seo/route-parser';
import { SEO_CITIES, SEO_ITINERARY_DAYS } from '@/lib/seo/cities';

describe('parseSeoSlug — itinerary form', () => {
  it('parses the canonical pattern', () => {
    const match = parseSeoSlug('tokyo-3-day-itinerary');
    expect(match?.kind).toBe('itinerary');
    if (match?.kind === 'itinerary') {
      expect(match.city.slug).toBe('tokyo');
      expect(match.days).toBe(3);
    }
  });

  it('parses every allowed (city × days) tuple', () => {
    for (const c of SEO_CITIES) {
      for (const days of SEO_ITINERARY_DAYS) {
        const match = parseSeoSlug(`${c.slug}-${days}-day-itinerary`);
        expect(match?.kind).toBe('itinerary');
        if (match?.kind === 'itinerary') {
          expect(match.city.slug).toBe(c.slug);
          expect(match.days).toBe(days);
        }
      }
    }
  });

  it('rejects unknown cities', () => {
    expect(parseSeoSlug('atlantis-3-day-itinerary')).toBeNull();
    expect(parseSeoSlug('mars-7-day-itinerary')).toBeNull();
  });

  it('rejects disallowed durations', () => {
    expect(parseSeoSlug('tokyo-99-day-itinerary')).toBeNull();
    expect(parseSeoSlug('tokyo-0-day-itinerary')).toBeNull();
    expect(parseSeoSlug('tokyo-1-day-itinerary')).toBeNull(); // 1 is not in allowlist
  });

  it('rejects spam-shape variants', () => {
    expect(parseSeoSlug('TOKYO-3-DAY-ITINERARY')).toBeNull(); // uppercase
    expect(parseSeoSlug('tokyo_3_day_itinerary')).toBeNull(); // underscores
    expect(parseSeoSlug('tokyo 3 day itinerary')).toBeNull(); // spaces
    expect(parseSeoSlug('tokyo-3-day-itinerary-bonus')).toBeNull(); // trailing junk
    expect(parseSeoSlug('-3-day-itinerary')).toBeNull(); // empty city
  });
});

describe('parseSeoSlug — things-to-do form', () => {
  it('parses the canonical pattern', () => {
    const match = parseSeoSlug('things-to-do-in-tokyo');
    expect(match?.kind).toBe('things-to-do');
    if (match?.kind === 'things-to-do') {
      expect(match.city.slug).toBe('tokyo');
    }
  });

  it('parses every allowed city', () => {
    for (const c of SEO_CITIES) {
      const match = parseSeoSlug(`things-to-do-in-${c.slug}`);
      expect(match?.kind).toBe('things-to-do');
    }
  });

  it('rejects unknown cities', () => {
    expect(parseSeoSlug('things-to-do-in-atlantis')).toBeNull();
  });

  it('rejects spam-shape variants', () => {
    expect(parseSeoSlug('Things-To-Do-In-Tokyo')).toBeNull();
    expect(parseSeoSlug('things_to_do_in_tokyo')).toBeNull();
    expect(parseSeoSlug('things-to-do-in-tokyo-extra')).toBeNull();
  });
});

describe('parseSeoSlug — invariants', () => {
  it('rejects empty / oversized / null-ish inputs', () => {
    expect(parseSeoSlug('')).toBeNull();
    expect(parseSeoSlug('x'.repeat(200))).toBeNull();
  });

  it('rejects unrelated paths', () => {
    expect(parseSeoSlug('about')).toBeNull();
    expect(parseSeoSlug('privacy-policy')).toBeNull();
    expect(parseSeoSlug('home')).toBeNull();
  });
});

describe('parseSeoSlug — themed-list forms', () => {
  it('parses /best-family-activities-in-{city}', () => {
    const m = parseSeoSlug('best-family-activities-in-tokyo');
    expect(m?.kind).toBe('themed-list');
    if (m?.kind === 'themed-list') {
      expect(m.theme).toBe('family');
      expect(m.city.slug).toBe('tokyo');
    }
  });

  it('parses /best-food-tours-in-{city}', () => {
    const m = parseSeoSlug('best-food-tours-in-paris');
    expect(m?.kind).toBe('themed-list');
    if (m?.kind === 'themed-list') {
      expect(m.theme).toBe('food');
    }
  });

  it('parses /day-trips-from-{city}', () => {
    const m = parseSeoSlug('day-trips-from-rome');
    expect(m?.kind).toBe('themed-list');
    if (m?.kind === 'themed-list') {
      expect(m.theme).toBe('day-trips');
    }
  });

  it('rejects themed-list with unknown city', () => {
    expect(parseSeoSlug('best-family-activities-in-atlantis')).toBeNull();
    expect(parseSeoSlug('best-food-tours-in-atlantis')).toBeNull();
    expect(parseSeoSlug('day-trips-from-atlantis')).toBeNull();
  });

  it('rejects spam-shape themed-list variants', () => {
    expect(parseSeoSlug('best-family-activities-in-Tokyo')).toBeNull();
    expect(parseSeoSlug('best-food-tours-in-tokyo-extra')).toBeNull();
    expect(parseSeoSlug('day-trips-from-')).toBeNull();
  });
});

describe('parseSeoSlug — weekend form', () => {
  it('parses /weekend-in-{city}', () => {
    const m = parseSeoSlug('weekend-in-tokyo');
    expect(m?.kind).toBe('weekend');
    if (m?.kind === 'weekend') {
      expect(m.city.slug).toBe('tokyo');
    }
  });

  it('parses every allowed city as a weekend', () => {
    for (const c of SEO_CITIES) {
      const m = parseSeoSlug(`weekend-in-${c.slug}`);
      expect(m?.kind).toBe('weekend');
    }
  });

  it('rejects unknown weekend cities + spam variants', () => {
    expect(parseSeoSlug('weekend-in-atlantis')).toBeNull();
    expect(parseSeoSlug('weekend-in-tokyo-extra')).toBeNull();
    expect(parseSeoSlug('weekend-in-')).toBeNull();
  });
});

describe('enumerateAllSeoSlugs', () => {
  it('produces a large (city × shape) set including city-vs-city comparisons', () => {
    const slugs = enumerateAllSeoSlugs();
    // Many shapes fan out per city (things-to-do, themed lists, weekend,
    // itineraries, hotels/flights/cars, climate, …) plus curated city-vs-city
    // comparisons. Exact per-city counts drift as shapes are added, so assert
    // structural invariants rather than a brittle exact formula.
    const minFanOut = SEO_CITIES.length * (1 + SEO_ITINERARY_DAYS.length);
    expect(slugs.length).toBeGreaterThanOrEqual(minFanOut);
    expect(slugs.filter((s) => /-vs-/.test(s)).length).toBeGreaterThan(0);
  });

  it('every emitted slug parses back into a valid match', () => {
    for (const slug of enumerateAllSeoSlugs()) {
      const match = parseSeoSlug(slug);
      expect(match).not.toBeNull();
    }
  });

  it('produces no duplicates', () => {
    const slugs = enumerateAllSeoSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('includes the four new template shapes for every city', () => {
    const slugs = new Set(enumerateAllSeoSlugs());
    for (const c of SEO_CITIES) {
      expect(slugs.has(`best-family-activities-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`best-food-tours-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`day-trips-from-${c.slug}`)).toBe(true);
      expect(slugs.has(`weekend-in-${c.slug}`)).toBe(true);
    }
  });
});
