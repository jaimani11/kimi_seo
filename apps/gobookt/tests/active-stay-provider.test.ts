import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildActiveStaySearchUrl,
  getActiveStayProvider,
  getActiveStayProviderId,
} from '@lib/affiliate/active-stay-provider';

const MODE_KEYS = [
  'NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER',
  'BOOKING_COM_AFFILIATE_ID',
  'NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID',
  'EXPEDIA_AFFILIATE_CID',
  'NEXT_PUBLIC_VIATOR_PARTNER_ID',
  'VIATOR_PARTNER_ID',
  'NEXT_PUBLIC_VIATOR_STAY_MCID',
  'VIATOR_STAY_MCID',
] as const;

const SAMPLE_INPUT = {
  destination: 'Tuscany',
  checkIn: '2026-09-01',
  checkOut: '2026-09-05',
  adults: 2,
};

describe('getActiveStayProvider', () => {
  const saved: Partial<Record<(typeof MODE_KEYS)[number], string | undefined>> = {};
  beforeEach(() => {
    for (const k of MODE_KEYS) saved[k] = process.env[k];
    for (const k of MODE_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of MODE_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('defaults to booking-com when unset', () => {
    expect(getActiveStayProvider()).toBe('booking-com');
  });

  it('honors NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER=expedia override', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    expect(getActiveStayProvider()).toBe('expedia');
  });

  it('honors booking-com override', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'booking-com';
    expect(getActiveStayProvider()).toBe('booking-com');
  });

  it('explicitly accepts viator override', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'viator';
    expect(getActiveStayProvider()).toBe('viator');
  });

  it('falls back to booking-com on garbage values', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'garbage';
    expect(getActiveStayProvider()).toBe('booking-com');
  });

  it('is case-insensitive', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'EXPEDIA';
    expect(getActiveStayProvider()).toBe('expedia');
  });

  it('getActiveStayProviderId mirrors getActiveStayProvider', () => {
    expect(getActiveStayProviderId()).toBe('booking-com');
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    expect(getActiveStayProviderId()).toBe('expedia');
  });
});

describe('buildActiveStaySearchUrl', () => {
  const saved: Partial<Record<(typeof MODE_KEYS)[number], string | undefined>> = {};
  beforeEach(() => {
    for (const k of MODE_KEYS) saved[k] = process.env[k];
    for (const k of MODE_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of MODE_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('routes to booking.com by default', () => {
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url).toMatch(/^https:\/\/www\.booking\.com\//);
  });

  it('lands on the Booking.com search endpoint with the destination as ss=', () => {
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url).toContain('/searchresults.html?');
    expect(url).toContain('ss=Tuscany');
  });

  it('attaches the gobookt label for click attribution', () => {
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url).toContain('label=gobookt');
  });

  it('forwards date + traveler params to the Booking.com URL', () => {
    const url = buildActiveStaySearchUrl({ ...SAMPLE_INPUT, childrenAges: [8] });
    expect(url).toContain('checkin=');
    expect(url).toContain('checkout=');
    expect(url).toContain('group_adults=');
    expect(url).toContain('group_children=1');
  });

  it('routes to booking.com when the env override is set', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'booking-com';
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url).toMatch(/^https:\/\/www\.booking\.com\//);
  });

  it('routes to expedia.com when the env override is set', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url).toMatch(/^https:\/\/www\.expedia\.com\//);
  });

  it('forwards the inventoryFilter on Booking.com routes', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'booking-com';
    const url = buildActiveStaySearchUrl({ ...SAMPLE_INPUT, inventoryFilter: 'apartments' });
    expect(url).toContain('nflt=ht_id%3D204');
  });

  it('collapses childrenAges to a count when routing to Booking.com', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'booking-com';
    const url = buildActiveStaySearchUrl({ ...SAMPLE_INPUT, childrenAges: [8, 10] });
    expect(url).toContain('group_children=2');
  });

  it('passes childrenAges through verbatim when routing to Expedia', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    const url = buildActiveStaySearchUrl({ ...SAMPLE_INPUT, childrenAges: [8, 10] });
    // Expedia uses comma-joined ages on `children=`.
    expect(url).toContain('children=8%2C10');
  });
});
