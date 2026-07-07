import { describe, expect, it } from 'vitest';
import { mapExpediaProperty } from '@/providers/expedia/mapper';
import type { ExpediaProperty } from '@/providers/expedia/types';

function fixtureProperty(overrides: Partial<ExpediaProperty> = {}): ExpediaProperty {
  return {
    property_id: 'eps-77821',
    name: 'Belmond Hotel Splendido',
    address: {
      country_code: 'IT',
      city: 'Portofino',
      state_province_name: 'Liguria',
      neighborhood_name: 'Castello',
    },
    location: {
      coordinates: { latitude: 44.305, longitude: 9.207 },
    },
    category: { id: '1', name: 'Hotel' },
    star_rating: '5.0',
    guest_rating: { overall: 9.6, total_reviews: 432 },
    description: 'Hilltop hotel above Portofino bay with a saltwater pool.',
    images: [
      { url: 'https://images.expedia.com/splendido-1.jpg', caption: 'Pool deck' },
      { url: 'https://images.expedia.com/splendido-2.jpg' },
    ],
    rates: [
      {
        totals: {
          inclusive: {
            billable_currency: { value: '1280.00', currency: 'EUR' },
          },
        },
      },
    ],
    max_occupancy: 4,
    ...overrides,
  };
}

describe('mapExpediaProperty', () => {
  it('maps required fields to Stay shape', () => {
    const stay = mapExpediaProperty(fixtureProperty(), 'apikey_99');
    expect(stay.id).toBe('expedia:eps-77821');
    expect(stay.providerId).toBe('expedia');
    expect(stay.name).toBe('Belmond Hotel Splendido');
    expect(stay.location.country).toBe('IT');
    expect(stay.location.locality).toBe('Portofino');
    expect(stay.location.region).toBe('Liguria');
    expect(stay.location.coordinates).toEqual({ lat: 44.305, lng: 9.207 });
    expect(stay.pricing.pricePerNight.amount).toBeCloseTo(1280, 2);
    expect(stay.pricing.pricePerNight.currency).toBe('EUR');
    expect(stay.capacity.sleeps).toBe(4);
    expect(stay.rating?.score).toBe(9.6);
    expect(stay.rating?.reviewCount).toBe(432);
    expect(stay.rating?.source).toBe('expedia');
  });

  it('builds an affiliate URL with the api key baked in', () => {
    const stay = mapExpediaProperty(fixtureProperty(), 'apikey_99');
    expect(stay.bookingLink.url).toContain('expedia.com');
    expect(stay.bookingLink.url).toContain('aid=apikey_99');
    expect(stay.bookingLink.url).toContain('property_id=eps-77821');
    expect(stay.bookingLink.attribution?.network).toBe('expedia');
  });

  it('maps category to our enum', () => {
    expect(
      mapExpediaProperty(fixtureProperty({ category: { id: '16', name: 'Villa' } }), 'p').type,
    ).toBe('villa');
    expect(
      mapExpediaProperty(fixtureProperty({ category: { id: '23', name: 'Bed & Breakfast' } }), 'p')
        .type,
    ).toBe('guesthouse');
    // Unknown category → safe default.
    expect(mapExpediaProperty(fixtureProperty({ category: { name: 'Spaceship' } }), 'p').type).toBe(
      'hotel',
    );
  });

  it('handles missing rates (price 0) without throwing', () => {
    const stay = mapExpediaProperty(fixtureProperty({ rates: [] }), 'p');
    expect(stay.pricing.pricePerNight.amount).toBe(0);
  });

  it('falls back to a synthesized description when missing', () => {
    const stay = mapExpediaProperty(fixtureProperty({ description: undefined }), 'p');
    expect(stay.description).toContain('Belmond Hotel Splendido');
  });

  it('omits rating when guest_rating is missing', () => {
    const stay = mapExpediaProperty(fixtureProperty({ guest_rating: undefined }), 'p');
    expect(stay.rating).toBeUndefined();
  });
});
