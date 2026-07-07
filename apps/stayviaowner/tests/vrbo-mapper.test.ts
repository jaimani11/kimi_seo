import { describe, expect, it } from 'vitest';
import { mapVrboProperty } from '@/providers/vrbo/mapper';
import { StaySchema } from '@core/stay';
import type { VrboProperty } from '@/providers/vrbo/types';

function rawVrbo(overrides: Partial<VrboProperty> = {}): VrboProperty {
  return {
    property_id: 'vrbo-123',
    name: 'A vineyard cottage in Sonoma',
    address: {
      country_code: 'US',
      city: 'Sonoma',
      state_province_name: 'California',
    },
    category: { id: '8', name: 'Cottage' },
    description: 'Two-bedroom stone cottage on a working vineyard. Pool, sunset deck, kitchen.',
    images: [{ url: 'https://example.com/p.jpg', caption: 'cottage exterior' }],
    rates: [
      {
        totals: {
          inclusive: {
            billable_currency: { value: '420.00', currency: 'USD' },
          },
        },
      },
    ],
    max_occupancy: 6,
    guest_rating: { overall: 9.4, total_reviews: 87 },
    ...overrides,
  };
}

describe('mapVrboProperty', () => {
  it('produces a Stay that passes StaySchema', () => {
    const stay = mapVrboProperty(rawVrbo(), 'aff_test');
    expect(() => StaySchema.parse(stay)).not.toThrow();
  });

  it('namespaces id as vrbo:<property_id>', () => {
    const stay = mapVrboProperty(rawVrbo({ property_id: 'abc-987' }), 'aff_test');
    expect(stay.id).toBe('vrbo:abc-987');
  });

  it('sets providerId to vrbo (drives provenance chip + analytics)', () => {
    const stay = mapVrboProperty(rawVrbo(), 'aff_test');
    expect(stay.providerId).toBe('vrbo');
  });

  it('maps Rapid category 16 (vacation rental) → villa', () => {
    const stay = mapVrboProperty(
      rawVrbo({ category: { id: '16', name: 'Vacation rental' } }),
      'aff_test',
    );
    expect(stay.type).toBe('villa');
  });

  it('maps Rapid category 22 (cabin) → farmhouse (closest in our enum)', () => {
    const stay = mapVrboProperty(rawVrbo({ category: { id: '22', name: 'Cabin' } }), 'aff_test');
    expect(stay.type).toBe('farmhouse');
  });

  it('falls back to villa when category is missing (vacation-rental default)', () => {
    const stay = mapVrboProperty(rawVrbo({ category: undefined }), 'aff_test');
    expect(stay.type).toBe('villa');
  });

  it('builds an affiliate URL pointing at vrbo.com with affiliateId + utm_source', () => {
    const stay = mapVrboProperty(rawVrbo({ property_id: 'abc-987' }), 'aff_test_id');
    expect(stay.bookingLink.url).toContain('https://www.vrbo.com/abc-987');
    expect(stay.bookingLink.url).toContain('affiliateId=aff_test_id');
    expect(stay.bookingLink.url).toContain('utm_source=aff_test_id');
  });

  it('preserves rating in 0..10 scale with source vrbo', () => {
    const stay = mapVrboProperty(rawVrbo(), 'aff_test');
    expect(stay.rating?.score).toBe(9.4);
    expect(stay.rating?.source).toBe('vrbo');
  });

  it('parses pricing from rates billable_currency', () => {
    const stay = mapVrboProperty(rawVrbo(), 'aff_test');
    expect(stay.pricing.pricePerNight.amount).toBe(420);
    expect(stay.pricing.pricePerNight.currency).toBe('USD');
  });
});
