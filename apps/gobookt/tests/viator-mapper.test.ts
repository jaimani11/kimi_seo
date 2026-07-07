import { describe, expect, it } from 'vitest';
import fixture from './fixtures/viator-freetext-search.fixture.json' with { type: 'json' };
import { mapViatorProductToExperience } from '@/providers/viator/mapper';
import {
  ViatorFreetextSearchResponseSchema,
  type ViatorProductSummary,
} from '@/providers/viator/types';
import { ExperienceSchema, formatExperienceDuration } from '@core/experience';

/**
 * Mapper contract tests. The recorded fixture above mirrors the
 * Viator OpenAPI ProductSummary shape; if Viator changes their wire
 * shape, our schema parse will fail loudly and we update the
 * fixture + mapper together.
 */

describe('mapViatorProductToExperience', () => {
  const parsed = ViatorFreetextSearchResponseSchema.parse(fixture);
  const products = parsed.products?.results ?? [];

  it('parses the recorded freetext-search fixture without errors', () => {
    expect(products.length).toBe(2);
  });

  it('produces an Experience that passes ExperienceSchema for each product', () => {
    for (const p of products) {
      const exp = mapViatorProductToExperience(p, { currency: 'USD' });
      const result = ExperienceSchema.safeParse(exp);
      expect(result.success, JSON.stringify(result, null, 2)).toBe(true);
    }
  });

  it('preserves the Viator productUrl verbatim (affiliate attribution depends on it)', () => {
    const p = products[0]!;
    const exp = mapViatorProductToExperience(p, { currency: 'USD' });
    expect(exp.affiliate.url).toBe(p.productUrl);
    expect(exp.affiliate.url).toContain('campaign-value=stayscout-homepage');
  });

  it('uses `viator:<productCode>` for the id', () => {
    const p = products[0]!;
    const exp = mapViatorProductToExperience(p, { currency: 'USD' });
    expect(exp.id).toBe(`viator:${p.productCode}`);
  });

  it('maps fixed durations to a fixed-kind duration with minutes set', () => {
    const exp = mapViatorProductToExperience(products[0]!, { currency: 'USD' });
    expect(exp.duration.kind).toBe('fixed');
    expect(exp.duration.minutes).toBe(210);
    expect(formatExperienceDuration(exp.duration)).toBe('3h 30m');
  });

  it('maps variable durations to a range-kind duration with from/to set', () => {
    const exp = mapViatorProductToExperience(products[1]!, { currency: 'USD' });
    expect(exp.duration.kind).toBe('range');
    expect(exp.duration.fromMinutes).toBe(90);
    expect(exp.duration.toMinutes).toBe(150);
    expect(formatExperienceDuration(exp.duration)).toBe('1h 30m to 2h 30m');
  });

  it('exposes the pre-discount price when the product is on sale', () => {
    const exp = mapViatorProductToExperience(products[0]!, { currency: 'USD' });
    expect(exp.pricing.fromPerPerson).toBe(248);
    expect(exp.pricing.fromPerPersonBeforeDiscount).toBe(295);
  });

  it('clamps + normalizes the average rating to one decimal', () => {
    const exp = mapViatorProductToExperience(products[0]!, { currency: 'USD' });
    expect(exp.reviews.averageRating).toBe(4.84);
    expect(exp.reviews.total).toBe(1284);
  });

  it('maps Viator flag enum strings to our normalized flag enum', () => {
    const exp = mapViatorProductToExperience(products[0]!, { currency: 'USD' });
    expect(exp.flags).toContain('free-cancellation');
    expect(exp.flags).toContain('likely-to-sell-out');
    expect(exp.flags).not.toContain('NEW_ON_VIATOR' as never); // raw strings filtered
  });

  it('flags instant confirmation correctly', () => {
    const exp = mapViatorProductToExperience(products[0]!, { currency: 'USD' });
    expect(exp.confirmation).toBe('instant');
  });

  it('returns a short pitch summary - one sentence-ish, max 180 chars', () => {
    const exp = mapViatorProductToExperience(products[0]!, { currency: 'USD' });
    expect(exp.summary.length).toBeLessThanOrEqual(180);
    expect(exp.summary.length).toBeGreaterThan(20);
    // Must not include the trailing sentence after the first period.
    expect(exp.summary).toMatch(/[.!?]$/);
  });

  it('degrades gracefully when the response is sparse', () => {
    const sparse = {
      productCode: 'SPARSE001',
    } satisfies ViatorProductSummary;
    const exp = mapViatorProductToExperience(sparse, { currency: 'EUR' });
    const result = ExperienceSchema.safeParse(exp);
    expect(result.success).toBe(true);
    expect(exp.title).toBe('(untitled experience)');
    expect(exp.pricing.fromPerPerson).toBe(0);
    expect(exp.pricing.currency).toBe('EUR');
    expect(exp.reviews.total).toBe(0);
    expect(exp.reviews.averageRating).toBeNull();
    expect(exp.flags).toEqual([]);
  });

  it('extracts at least one photo when images are present', () => {
    const exp = mapViatorProductToExperience(products[0]!, { currency: 'USD' });
    expect(exp.photos.length).toBeGreaterThan(0);
    // The cover photo's variants should appear first.
    expect(exp.photos[0]!.url).toContain('5657/');
  });
});
