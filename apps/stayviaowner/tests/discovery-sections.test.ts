import { describe, expect, it } from 'vitest';
import {
  assertValidSection,
  type DiscoverySection,
  type Property,
} from '@lib/discovery/property';
import { DISCOVERY_SECTIONS } from '@lib/discovery/sections';
import { buildPropertyAffiliateHref } from '@/features/cards/affiliate-href';
import { decodeAffiliateLink } from '@lib/affiliate/link-encoder';

/**
 * Behavioral guarantees:
 *
 * 1. The curated dataset loads without throwing (data drift safety
 *    net — module-level `assertValidSection` already runs, but we
 *    want a dedicated test failure if a contributor breaks shape).
 * 2. The validator catches the typical kinds of misconfiguration
 *    (empty rail, wrong card count per layout, malformed slug).
 * 3. `buildPropertyAffiliateHref` produces a redirect URL whose
 *    decoded payload points at a real Expedia search URL with the
 *    section's destination filled in.
 */

const SAMPLE_PROPERTY: Property = {
  id: 'sample',
  name: 'Sample Stay',
  destination: 'Paris',
  country: 'FR',
  photo: {
    id: 'abc-123',
    alt: 'sample',
    fallbackGradient: ['#000', '#fff'],
  },
  pricing: { fromUsd: 500, band: 'comfort', unit: 'night' },
  rating: { score: 9.0, reviews: 100 },
  amenities: ['Pool'],
  pitch: 'A stay.',
  tags: { bestFor: [], vibes: [], luxury: [] },
  cancellation: 'free-flexible',
  affiliate: {
    providerId: 'expedia',
    searchDestination: 'Paris, France',
    stayId: 'sample-stay',
    defaultAdults: 2,
  },
};

describe('DISCOVERY_SECTIONS', () => {
  it('loads at least four sections', () => {
    expect(DISCOVERY_SECTIONS.length).toBeGreaterThanOrEqual(4);
  });

  it('has unique section slugs', () => {
    const slugs = DISCOVERY_SECTIONS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has globally-unique property ids across all sections', () => {
    const ids = DISCOVERY_SECTIONS.flatMap((s) => s.properties.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses one of the four allowed layout variants per section', () => {
    const allowed = new Set(['carousel', 'hero-rail', 'grid', 'editorial-slab']);
    for (const section of DISCOVERY_SECTIONS) {
      expect(allowed.has(section.layout.variant)).toBe(true);
    }
  });

  it('every property has a non-empty pitch and at least one amenity', () => {
    for (const section of DISCOVERY_SECTIONS) {
      for (const property of section.properties) {
        expect(property.pitch.length).toBeGreaterThan(0);
        expect(property.amenities.length).toBeGreaterThan(0);
      }
    }
  });

  it('every property has a non-negative price and a rating between 0 and 10', () => {
    for (const section of DISCOVERY_SECTIONS) {
      for (const property of section.properties) {
        expect(property.pricing.fromUsd).toBeGreaterThan(0);
        expect(property.rating.score).toBeGreaterThanOrEqual(0);
        expect(property.rating.score).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('assertValidSection', () => {
  it('accepts a valid carousel of 4+ stays', () => {
    const section: DiscoverySection = {
      slug: 'good-carousel',
      eyebrow: 'X',
      title: 'X',
      subtitle: 'X',
      layout: { variant: 'carousel' },
      properties: [
        SAMPLE_PROPERTY,
        { ...SAMPLE_PROPERTY, id: 's2' },
        { ...SAMPLE_PROPERTY, id: 's3' },
        { ...SAMPLE_PROPERTY, id: 's4' },
      ],
    };
    expect(() => assertValidSection(section)).not.toThrow();
  });

  it('rejects a slug with uppercase or spaces', () => {
    const section: DiscoverySection = {
      slug: 'Bad Slug',
      eyebrow: 'X',
      title: 'X',
      subtitle: 'X',
      layout: { variant: 'grid' },
      properties: [SAMPLE_PROPERTY, SAMPLE_PROPERTY, SAMPLE_PROPERTY, SAMPLE_PROPERTY],
    };
    expect(() => assertValidSection(section)).toThrow(/kebab-case/);
  });

  it('rejects an empty rail', () => {
    const section: DiscoverySection = {
      slug: 'empty',
      eyebrow: 'X',
      title: 'X',
      subtitle: 'X',
      layout: { variant: 'grid' },
      properties: [],
    };
    expect(() => assertValidSection(section)).toThrow(/no properties/);
  });

  it('rejects an editorial-slab that is not exactly 2 properties', () => {
    const section: DiscoverySection = {
      slug: 'wrong-slab',
      eyebrow: 'X',
      title: 'X',
      subtitle: 'X',
      layout: {
        variant: 'editorial-slab',
        copy: { headline: 'H', body: 'B' },
      },
      properties: [SAMPLE_PROPERTY],
    };
    expect(() => assertValidSection(section)).toThrow(/exactly 2/);
  });

  it('rejects a hero-rail with fewer than 4 properties', () => {
    const section: DiscoverySection = {
      slug: 'short-hero',
      eyebrow: 'X',
      title: 'X',
      subtitle: 'X',
      layout: { variant: 'hero-rail' },
      properties: [SAMPLE_PROPERTY, SAMPLE_PROPERTY, SAMPLE_PROPERTY],
    };
    expect(() => assertValidSection(section)).toThrow(/at least 4/);
  });

  it('rejects a grid larger than 6 properties', () => {
    const tooMany = Array.from({ length: 7 }, (_, i) => ({
      ...SAMPLE_PROPERTY,
      id: `s${i}`,
    }));
    const section: DiscoverySection = {
      slug: 'big-grid',
      eyebrow: 'X',
      title: 'X',
      subtitle: 'X',
      layout: { variant: 'grid' },
      properties: tooMany,
    };
    expect(() => assertValidSection(section)).toThrow(/4-6/);
  });
});

describe('buildPropertyAffiliateHref', () => {
  // gotript routes the curated property cards to Expedia hotels
  // search by default (active stay provider). Viator + Expedia builders
  // remain in the codebase as one-env-var overrides.
  it('produces a /r/ redirect URL whose payload points at booking.com', () => {
    const href = buildPropertyAffiliateHref(SAMPLE_PROPERTY);
    expect(href.startsWith('/r/')).toBe(true);
    const id = href.slice(3);
    const payload = decodeAffiliateLink(id);
    expect(payload).not.toBeNull();
    expect(payload!.providerId).toBe('expedia');
    expect(payload!.url).toMatch(/^https:\/\/www\.booking\.com\/searchresults\.html\?/);
    expect(payload!.url).toContain('Paris');
    expect(payload!.stayId).toBe('sample-stay');
  });

  it('builds a working redirect for every curated property', () => {
    for (const section of DISCOVERY_SECTIONS) {
      for (const property of section.properties) {
        const href = buildPropertyAffiliateHref(property);
        expect(href.startsWith('/r/')).toBe(true);
        const id = href.slice(3);
        const payload = decodeAffiliateLink(id);
        expect(payload, `decode failed for ${property.id}`).not.toBeNull();
        expect(payload!.url).toMatch(/^https:\/\/www\.booking\.com\/searchresults\.html\?/);
      }
    }
  });
});
