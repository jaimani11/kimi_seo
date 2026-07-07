import { describe, expect, it } from 'vitest';
import { mapBookingHotel } from '@/providers/booking-com/mapper';
import type { BookingComHotel } from '@/providers/booking-com/types';

function fixtureHotel(overrides: Partial<BookingComHotel> = {}): BookingComHotel {
  return {
    hotel_id: 12345,
    hotel_name: 'Hotel Cipriani',
    city: 'Venice',
    district: 'Giudecca',
    country_code: 'IT',
    latitude: 45.4267,
    longitude: 12.3287,
    review_score: 9.4,
    review_nr: 1875,
    description: 'A storied 5-star palace on Giudecca with a saltwater pool.',
    main_photo_url: 'https://cf.bstatic.com/photos/cipriani.jpg',
    photos: [{ url_original: 'https://cf.bstatic.com/photos/cipriani-2.jpg' }],
    min_total_price: 920,
    currency_code: 'EUR',
    max_persons: 3,
    accommodation_type_name: 'Hotel',
    ...overrides,
  };
}

describe('mapBookingHotel', () => {
  it('maps required fields to Stay shape', () => {
    const stay = mapBookingHotel(fixtureHotel(), 'partner_42');
    expect(stay.id).toBe('booking-com:12345');
    expect(stay.providerId).toBe('booking-com');
    expect(stay.name).toBe('Hotel Cipriani');
    expect(stay.location.country).toBe('IT');
    expect(stay.location.locality).toBe('Venice');
    expect(stay.location.coordinates).toEqual({ lat: 45.4267, lng: 12.3287 });
    expect(stay.pricing.pricePerNight.amount).toBe(920);
    expect(stay.pricing.pricePerNight.currency).toBe('EUR');
    expect(stay.capacity.sleeps).toBe(3);
    expect(stay.rating?.score).toBe(9.4);
    expect(stay.rating?.reviewCount).toBe(1875);
    expect(stay.rating?.source).toBe('booking');
  });

  it('builds an affiliate URL with the partner id baked in', () => {
    const stay = mapBookingHotel(fixtureHotel(), 'partner_42');
    expect(stay.bookingLink.url).toContain('booking.com');
    expect(stay.bookingLink.url).toContain('aid=partner_42');
    expect(stay.bookingLink.url).toContain('hotel_id=12345');
    expect(stay.bookingLink.type).toBe('redirect');
    expect(stay.bookingLink.attribution?.network).toBe('booking-com');
    expect(stay.bookingLink.attribution?.deepLinkParams?.aid).toBe('partner_42');
  });

  it('maps accommodation_type_name to our enum', () => {
    expect(mapBookingHotel(fixtureHotel({ accommodation_type_name: 'Villa' }), 'p').type).toBe(
      'villa',
    );
    expect(mapBookingHotel(fixtureHotel({ accommodation_type_name: 'Apartment' }), 'p').type).toBe(
      'apartment',
    );
    expect(
      mapBookingHotel(fixtureHotel({ accommodation_type_name: 'Agriturismo' }), 'p').type,
    ).toBe('agriturismo');
    expect(mapBookingHotel(fixtureHotel({ accommodation_type_name: 'B&B' }), 'p').type).toBe(
      'guesthouse',
    );
    // Unknown → safe default.
    expect(mapBookingHotel(fixtureHotel({ accommodation_type_name: 'WACKY' }), 'p').type).toBe(
      'hotel',
    );
  });

  it('uses main_photo_url + photos array, in order', () => {
    const stay = mapBookingHotel(fixtureHotel(), 'p');
    expect(stay.photos).toHaveLength(2);
    expect(stay.photos[0]?.url).toBe('https://cf.bstatic.com/photos/cipriani.jpg');
    expect(stay.photos[0]?.source).toBe('booking');
  });

  it('falls back to a synthesized description when missing', () => {
    const stay = mapBookingHotel(fixtureHotel({ description: undefined }), 'p');
    expect(stay.description).toContain('Hotel Cipriani');
  });

  it('handles missing rating gracefully (omits the field)', () => {
    const stay = mapBookingHotel(
      fixtureHotel({ review_score: undefined, review_nr: undefined }),
      'p',
    );
    expect(stay.rating).toBeUndefined();
  });
});
