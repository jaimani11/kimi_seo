import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildBookingComSearchUrl,
  getBookingComAffiliateConfig,
} from '@lib/affiliate/booking-com-link-builder';

const ENV_KEYS = [
  'BOOKING_COM_AFFILIATE_ID',
  'NEXT_PUBLIC_BOOKING_COM_AFFILIATE_ID',
  'BOOKING_COM_AFFILIATE_LABEL',
  'NEXT_PUBLIC_BOOKING_COM_AFFILIATE_LABEL',
  'BOOKING_COM_BASE_URL',
  'NEXT_PUBLIC_BOOKING_COM_BASE_URL',
] as const;

describe('buildBookingComSearchUrl', () => {
  const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('builds a Booking.com searchresults URL with destination + dates + occupancy', () => {
    const url = buildBookingComSearchUrl(
      {
        destination: 'Tuscany',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
      },
      getBookingComAffiliateConfig(),
    );
    expect(url).toMatch(/^https:\/\/www\.booking\.com\/searchresults\.html\?/);
    expect(url).toContain('ss=Tuscany');
    expect(url).toContain('checkin=2026-09-01');
    expect(url).toContain('checkout=2026-09-05');
    expect(url).toContain('group_adults=2');
    expect(url).toContain('group_children=0');
    expect(url).toContain('no_rooms=1');
  });

  it('attaches the affiliate id (aid) when configured', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = '1234567';
    const url = buildBookingComSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getBookingComAffiliateConfig(),
    );
    expect(url).toContain('aid=1234567');
  });

  it('omits aid when not configured (URL still resolves to a usable search)', () => {
    const url = buildBookingComSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getBookingComAffiliateConfig(),
    );
    expect(url).not.toContain('aid=');
    // Still valid - the visitor lands on a real search.
    expect(url).toMatch(/^https:\/\/www\.booking\.com\/searchresults\.html\?/);
  });

  it('uses the default "gobookt" label when no env override is set', () => {
    const url = buildBookingComSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getBookingComAffiliateConfig(),
    );
    expect(url).toContain('label=gobookt');
  });

  it('honors a custom NEXT_PUBLIC_BOOKING_COM_AFFILIATE_LABEL override', () => {
    process.env.NEXT_PUBLIC_BOOKING_COM_AFFILIATE_LABEL = 'social-twitter';
    const url = buildBookingComSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getBookingComAffiliateConfig(),
    );
    expect(url).toContain('label=social-twitter');
  });

  it('emits children count when supplied', () => {
    const url = buildBookingComSearchUrl(
      {
        destination: 'Paris',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
        children: 2,
      },
      getBookingComAffiliateConfig(),
    );
    expect(url).toContain('group_children=2');
  });

  it('applies the apartments filter via nflt=ht_id%3D204', () => {
    const url = buildBookingComSearchUrl(
      {
        destination: 'Lisbon',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
        inventoryFilter: 'apartments',
      },
      getBookingComAffiliateConfig(),
    );
    expect(url).toContain('nflt=ht_id%3D204');
  });

  it('applies the luxury filter via nflt=class%3D4%3Bclass%3D5', () => {
    const url = buildBookingComSearchUrl(
      {
        destination: 'Maldives',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
        inventoryFilter: 'luxury',
      },
      getBookingComAffiliateConfig(),
    );
    expect(url).toContain('nflt=class%3D4%3Bclass%3D5');
  });

  it('tags _src=gobookt for post-click analytics', () => {
    const url = buildBookingComSearchUrl(
      { destination: 'Berlin', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getBookingComAffiliateConfig(),
    );
    expect(url).toContain('_src=gobookt');
  });

  it('produces a valid URL (parseable, https)', () => {
    const url = buildBookingComSearchUrl(
      { destination: 'Tuscany, Italy', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 4 },
      getBookingComAffiliateConfig(),
    );
    const parsed = new URL(url);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('www.booking.com');
    expect(parsed.pathname).toBe('/searchresults.html');
  });
});
