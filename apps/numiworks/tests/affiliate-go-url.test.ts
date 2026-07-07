import { describe, expect, it } from 'vitest';
import { generateGoUrl } from '@/lib/affiliate/go-url';
import { providerId, stayId } from '@core/ids';
import type { Stay } from '@core/stay';

function fakeStay(): Stay {
  return {
    id: stayId('mock-italy:aman-venice'),
    providerId: providerId('mock-italy'),
    name: 'Aman Venice',
    type: 'palazzo',
    location: { country: 'IT', region: 'Veneto' },
    photos: [],
    pricing: { pricePerNight: { amount: 1850, currency: 'EUR' } },
    capacity: { sleeps: 3 },
    amenities: [],
    signals: { tags: ['luxury'] },
    description: '',
    bookingLink: {
      url: 'https://example.com/redirect?provider=mock-italy&id=aman-venice&utm=foo',
      type: 'redirect',
    },
    fetchedAt: new Date().toISOString(),
  };
}

describe('generateGoUrl', () => {
  it('builds a relative /api/go URL with required params', () => {
    const url = generateGoUrl({ stay: fakeStay() });
    expect(url.startsWith('/api/go?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('s')).toBe('mock-italy:aman-venice');
    expect(params.get('p')).toBe('mock-italy');
    expect(params.get('u')).toBe(
      'https://example.com/redirect?provider=mock-italy&id=aman-venice&utm=foo',
    );
  });

  it('encodes the bookingLink URL safely (decodes back to the original)', () => {
    const url = generateGoUrl({ stay: fakeStay() });
    const params = new URLSearchParams(url.split('?')[1]);
    // URLSearchParams decodes - this should round-trip.
    expect(params.get('u')).toContain('?provider=mock-italy');
    expect(params.get('u')).toContain('utm=foo');
  });

  it('includes optional turnId/conversationId when provided', () => {
    const url = generateGoUrl({
      stay: fakeStay(),
      turnId: 't_123',
      conversationId: 'c_456',
    });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('t')).toBe('t_123');
    expect(params.get('c')).toBe('c_456');
  });

  it('omits empty optional params (no t= when undefined)', () => {
    const url = generateGoUrl({ stay: fakeStay() });
    expect(url).not.toContain('t=');
    expect(url).not.toContain('c=');
  });
});
