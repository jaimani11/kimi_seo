import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activeStaySearchHref,
  resolveActiveStaySearch,
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

  it('falls back to booking-com on garbage values (incl. the retired viator value)', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'viator';
    expect(getActiveStayProvider()).toBe('booking-com');
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

describe('activeStaySearchHref / resolveActiveStaySearch (money-path safe)', () => {
  afterEach(() => vi.unstubAllEnvs());

  const DEEPLINK = 'https://www.anrdoezrs.net/click-101803878-17293132?url={TARGET}';

  it('default fail_closed with no deep-link → null (never a homepage link)', () => {
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', '');
    vi.stubEnv('NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER', 'booking-com');
    expect(activeStaySearchHref(SAMPLE_INPUT)).toBeNull();
    expect(resolveActiveStaySearch(SAMPLE_INPUT).status).toBe('unavailable');
  });

  it('tracked deep-link → CJ url wrapping the destination-correct target (ss= survives)', () => {
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', DEEPLINK);
    const href = activeStaySearchHref(SAMPLE_INPUT);
    expect(href).toContain('click-101803878-17293132');
    const inner = new URL(new URL(href as string).searchParams.get('url') as string);
    expect(inner.pathname).toBe('/searchresults.html');
    expect(inner.searchParams.get('ss')).toBe('Tuscany');
    expect(href).not.toContain('17288985');
  });

  it('untracked_fallback → destination-correct booking.com target, never the fixed creative', () => {
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', '');
    vi.stubEnv('SEARCH_HANDOFF_MODE', 'untracked_fallback');
    const href = activeStaySearchHref(SAMPLE_INPUT) as string;
    expect(href).toMatch(/^https:\/\/www\.booking\.com\/searchresults\.html\?/);
    expect(href).toContain('ss=Tuscany');
    expect(href).toContain('label=gobookt');
    expect(href).not.toContain('17288985');
  });

  it('never emits group_adults=0 (adults defaulted)', () => {
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', '');
    vi.stubEnv('SEARCH_HANDOFF_MODE', 'untracked_fallback');
    const href = activeStaySearchHref({ destination: 'Rome', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 0 }) as string;
    expect(href).toContain('group_adults=2');
    expect(href).not.toContain('group_adults=0');
  });

  it('collapses childrenAges to a count on Booking.com', () => {
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', '');
    vi.stubEnv('SEARCH_HANDOFF_MODE', 'untracked_fallback');
    const href = activeStaySearchHref({ ...SAMPLE_INPUT, childrenAges: [8, 10] }) as string;
    expect(href).toContain('group_children=2');
  });

  it('forwards the inventoryFilter on Booking.com routes', () => {
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', '');
    vi.stubEnv('SEARCH_HANDOFF_MODE', 'untracked_fallback');
    const href = activeStaySearchHref({ ...SAMPLE_INPUT, inventoryFilter: 'apartments' }) as string;
    expect(href).toContain('nflt=ht_id%3D204');
  });

  it('expedia override → expedia url (dormant provider, always a string)', () => {
    vi.stubEnv('NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER', 'expedia');
    const href = activeStaySearchHref(SAMPLE_INPUT) as string;
    expect(href).toMatch(/^https:\/\/www\.expedia\.com\//);
  });

  it('expedia passes childrenAges through verbatim', () => {
    vi.stubEnv('NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER', 'expedia');
    const href = activeStaySearchHref({ ...SAMPLE_INPUT, childrenAges: [8, 10] }) as string;
    expect(href).toContain('children=8%2C10');
  });
});
