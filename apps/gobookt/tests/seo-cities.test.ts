import { describe, expect, it } from 'vitest';
import {
  SEO_CITIES,
  SEO_ITINERARY_DAYS,
  citiesByRegion,
  findCityBySlug,
  isValidItineraryDays,
} from '@/lib/seo/cities';

describe('SEO_CITIES allowlist', () => {
  it('has at least 25 cities for meaningful programmatic surface', () => {
    expect(SEO_CITIES.length).toBeGreaterThanOrEqual(25);
  });

  it('every slug is kebab-case ASCII (no underscores, spaces, accents)', () => {
    for (const c of SEO_CITIES) {
      expect(c.slug).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(c.slug).not.toContain('--');
      expect(c.slug.length).toBeGreaterThanOrEqual(3);
      expect(c.slug.length).toBeLessThanOrEqual(40);
    }
  });

  it('no duplicate slugs', () => {
    const slugs = SEO_CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('country codes are uppercase ISO 3166-1 alpha-2', () => {
    for (const c of SEO_CITIES) {
      expect(c.countryCode).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('coordinates are within Earth bounds', () => {
    for (const c of SEO_CITIES) {
      expect(c.coordinates.lat).toBeGreaterThan(-90);
      expect(c.coordinates.lat).toBeLessThan(90);
      expect(c.coordinates.lng).toBeGreaterThan(-180);
      expect(c.coordinates.lng).toBeLessThan(180);
    }
  });

  it('every city has a meaningful oneLiner (≥ 30 chars, ≤ 140)', () => {
    for (const c of SEO_CITIES) {
      expect(c.oneLiner.length).toBeGreaterThanOrEqual(30);
      expect(c.oneLiner.length).toBeLessThanOrEqual(140);
    }
  });

  it('covers at least 3 continents', () => {
    const regions = new Set(SEO_CITIES.map((c) => c.region));
    expect(regions.size).toBeGreaterThanOrEqual(3);
  });
});

describe('findCityBySlug', () => {
  it('finds a known city', () => {
    const tokyo = findCityBySlug('tokyo');
    expect(tokyo).not.toBeNull();
    expect(tokyo!.name).toBe('Tokyo');
  });

  it('returns null for unknown city', () => {
    expect(findCityBySlug('atlantis')).toBeNull();
    expect(findCityBySlug('')).toBeNull();
  });
});

describe('SEO_ITINERARY_DAYS', () => {
  it('only allows reasonable trip lengths', () => {
    for (const n of SEO_ITINERARY_DAYS) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(14);
    }
  });

  it('isValidItineraryDays accepts allowlist + rejects others', () => {
    for (const n of SEO_ITINERARY_DAYS) expect(isValidItineraryDays(n)).toBe(true);
    expect(isValidItineraryDays(99)).toBe(false);
    expect(isValidItineraryDays(0)).toBe(false);
    expect(isValidItineraryDays(-1)).toBe(false);
  });
});

describe('citiesByRegion', () => {
  it('partitions every city into exactly one region', () => {
    const grouped = citiesByRegion();
    const flat = Object.values(grouped).flat();
    expect(flat.length).toBe(SEO_CITIES.length);
    expect(new Set(flat).size).toBe(SEO_CITIES.length);
  });
});
