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
  it('drops the redirected Viator families but keeps comparisons + cruise regions', () => {
    const slugs = enumerateAllSeoSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    // Redirected Viator families are dropped from the sitemap/static-params set
    // by the gobookt-retirement shim; `[slug]` 308s them instead.
    expect(slugs.some((s) => /-day-itinerary$/.test(s))).toBe(false);
    expect(slugs.some((s) => /^weekend-in-/.test(s))).toBe(false);
    expect(slugs.some((s) => /^things-to-do-in-/.test(s))).toBe(false);
    // Comparisons + cruise regions (non-Viator) are retained.
    expect(slugs.filter((s) => /-vs-/.test(s)).length).toBeGreaterThan(0);
    expect(slugs.filter((s) => /-cruises$/.test(s)).length).toBe(CRUISE_REGIONS.length);
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

  it('keeps HELD themed-list shapes but drops REDIRECTED ones, for every city', () => {
    const slugs = new Set(enumerateAllSeoSlugs());
    for (const c of SEO_CITIES) {
      // Held (pure-experience) themes stay enumerated pending the traffic review.
      expect(slugs.has(`best-food-tours-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`day-trips-from-${c.slug}`)).toBe(true);
      // Redirected shapes (family -> family-hotels; weekend -> stays) are dropped.
      expect(slugs.has(`best-family-activities-in-${c.slug}`)).toBe(false);
      expect(slugs.has(`weekend-in-${c.slug}`)).toBe(false);
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

  it('includes flight, car, and things-to-do themed shapes for every city', () => {
    const slugs = new Set(enumerateAllSeoSlugs());
    for (const c of SEO_CITIES) {
      expect(slugs.has(`cheap-flights-to-${c.slug}`)).toBe(true);
      expect(slugs.has(`cheap-car-rental-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`airport-car-rental-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`top-attractions-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`free-things-to-do-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`museums-in-${c.slug}`)).toBe(true);
      expect(slugs.has(`tours-in-${c.slug}`)).toBe(true);
    }
  });

  it('includes every cruise region as a fixed page', () => {
    const slugs = new Set(enumerateAllSeoSlugs());
    for (const r of CRUISE_REGIONS) {
      expect(slugs.has(`${r}-cruises`)).toBe(true);
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
  it('parses cheap-flights-to-{city}', () => {
    const m = parseSeoSlug('cheap-flights-to-paris');
    expect(m?.kind).toBe('flights-themed');
  });

  it('parses cheap-car-rental + airport-car-rental', () => {
    const a = parseSeoSlug('cheap-car-rental-in-paris');
    const b = parseSeoSlug('airport-car-rental-in-paris');
    expect(a?.kind).toBe('cars-themed');
    expect(b?.kind).toBe('cars-themed');
    if (a?.kind === 'cars-themed') expect(a.theme).toBe('cheap');
    if (b?.kind === 'cars-themed') expect(b.theme).toBe('airport');
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
  it('parses each cruise region', () => {
    for (const r of CRUISE_REGIONS) {
      const m = parseSeoSlug(`${r}-cruises`);
      expect(m?.kind).toBe('cruise-region');
      if (m?.kind === 'cruise-region') {
        expect(m.region).toBe(r);
      }
    }
  });

  it('rejects unknown cruise regions', () => {
    expect(parseSeoSlug('atlantis-cruises')).toBeNull();
    expect(parseSeoSlug('mars-cruises')).toBeNull();
  });
});
