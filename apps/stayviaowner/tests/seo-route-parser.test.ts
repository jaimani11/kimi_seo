import { describe, expect, it } from 'vitest';
import {
  CRUISE_REGIONS,
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
  it('produces the reposition slug set — city shapes + comparisons, retired verticals dropped', () => {
    const slugs = enumerateAllSeoSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    // Cruise / flight / car verticals were retired in the Vrbo reposition — the
    // shim drops them from the base enumeration, so none are emitted.
    expect(slugs.filter((s) => /-cruises$/.test(s)).length).toBe(0);
    expect(slugs.filter((s) => /^cheap-flights-to-/.test(s)).length).toBe(0);
    expect(slugs.filter((s) => /car-rental-in-/.test(s)).length).toBe(0);
    // Comparisons are retained.
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

  it('includes all 8 hotel-themed shapes for every city', () => {
    const slugs = new Set(enumerateAllSeoSlugs());
    for (const c of SEO_CITIES) {
      expect(slugs.has(`best-hotels-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`cheap-hotels-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`luxury-hotels-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`family-hotels-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`boutique-hotels-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`pet-friendly-hotels-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`beach-hotels-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`apartments-in-${c.slug}`)).toBe(true);
    }
  });

  it('retires flight + car themed shapes but keeps things-to-do, for every city', () => {
    const slugs = new Set(enumerateAllSeoSlugs());
    for (const c of SEO_CITIES) {
      // Retired verticals (Vrbo reposition) — absent from the enumeration.
      expect(slugs.has(`cheap-flights-to-${c.slug}`)).toBe(false);
      expect(slugs.has(`cheap-car-rental-in-${c.slug}`)).toBe(false);
      expect(slugs.has(`airport-car-rental-in-${c.slug}`)).toBe(false);
      // Things-to-do shapes are kept.
      expect(slugs.has(`top-attractions-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`free-things-to-do-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`museums-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`tours-in-${c.slug}`)).toBe(true);
    }
  });

  it('excludes every cruise region from the enumeration (retired)', () => {
    const slugs = new Set(enumerateAllSeoSlugs());
    for (const r of CRUISE_REGIONS) {
      expect(slugs.has(`${r}-cruises`)).toBe(false);
    }
  });
});

describe('parseSeoSlug — hotel-themed shapes', () => {
  it('parses each of the 8 hotel themes', () => {
    const cases: Array<[string, string]> = [
      ['best-hotels-in-tokyo', 'best'],
      ['cheap-hotels-in-tokyo', 'cheap'],
      ['luxury-hotels-in-tokyo', 'luxury'],
      ['family-hotels-in-tokyo', 'family'],
      ['boutique-hotels-in-tokyo', 'boutique'],
      ['pet-friendly-hotels-in-tokyo', 'pet-friendly'],
      ['beach-hotels-in-tokyo', 'beach'],
      ['apartments-in-tokyo', 'apartments'],
    ];
    for (const [slug, theme] of cases) {
      const m = parseSeoSlug(slug);
      expect(m?.kind).toBe('hotels-themed');
      if (m?.kind === 'hotels-themed') {
        expect(m.theme).toBe(theme);
      }
    }
  });

  it('rejects hotel themes with unknown cities', () => {
    expect(parseSeoSlug('boutique-hotels-in-atlantis')).toBeNull();
    expect(parseSeoSlug('apartments-in-atlantis')).toBeNull();
  });
});

describe('parseSeoSlug — flight/car/things sub-shapes', () => {
  it('retires cheap-flights-to-{city} → null (404)', () => {
    expect(parseSeoSlug('cheap-flights-to-paris')).toBeNull();
  });

  it('retires cheap-car-rental + airport-car-rental → null (404)', () => {
    expect(parseSeoSlug('cheap-car-rental-in-paris')).toBeNull();
    expect(parseSeoSlug('airport-car-rental-in-paris')).toBeNull();
  });

  it('parses the four things-themed variants', () => {
    const variants: Array<[string, string]> = [
      ['top-attractions-in-tokyo', 'top-attractions'],
      ['free-things-to-do-in-tokyo', 'free'],
      ['museums-in-tokyo', 'museums'],
      ['tours-in-tokyo', 'tours'],
    ];
    for (const [slug, variant] of variants) {
      const m = parseSeoSlug(slug);
      expect(m?.kind).toBe('things-themed');
      if (m?.kind === 'things-themed') {
        expect(m.variant).toBe(variant);
      }
    }
  });
});

describe('parseSeoSlug — cruise regions', () => {
  it('retires each cruise region → null (404)', () => {
    for (const r of CRUISE_REGIONS) {
      expect(parseSeoSlug(`${r}-cruises`)).toBeNull();
    }
  });

  it('rejects unknown cruise regions', () => {
    expect(parseSeoSlug('atlantis-cruises')).toBeNull();
    expect(parseSeoSlug('mars-cruises')).toBeNull();
  });
});
