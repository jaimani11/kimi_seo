import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildExpediaSearchUrl,
  getExpediaAffiliateConfig,
} from '@lib/affiliate/expedia-link-builder';

const ENV_KEYS = [
  'EXPEDIA_AFFILIATE_ID',
  'NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID',
  'EXPEDIA_AFFILIATE_LABEL',
  'NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL',
  'EXPEDIA_BASE_URL',
  'NEXT_PUBLIC_EXPEDIA_BASE_URL',
] as const;

describe('buildExpediaSearchUrl', () => {
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

  it('builds a Expedia searchresults URL with destination + dates + occupancy', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Tuscany',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
      },
      getExpediaAffiliateConfig(),
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
    process.env.EXPEDIA_AFFILIATE_ID = '1234567';
    const url = buildExpediaSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getExpediaAffiliateConfig(),
    );
    expect(url).toContain('aid=1234567');
  });

  it('omits aid when not configured (URL still resolves to a usable search)', () => {
    const url = buildExpediaSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getExpediaAffiliateConfig(),
    );
    expect(url).not.toContain('aid=');
    // Still valid - the visitor lands on a real search.
    expect(url).toMatch(/^https:\/\/www\.booking\.com\/searchresults\.html\?/);
  });

  it('uses the default "gotript" label when no env override is set', () => {
    const url = buildExpediaSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getExpediaAffiliateConfig(),
    );
    expect(url).toContain('label=gotript');
  });

  it('honors a custom NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL override', () => {
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL = 'social-twitter';
    const url = buildExpediaSearchUrl(
      { destination: 'Tokyo', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getExpediaAffiliateConfig(),
    );
    expect(url).toContain('label=social-twitter');
  });

  it('emits children count when supplied', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Paris',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
        children: 2,
      },
      getExpediaAffiliateConfig(),
    );
    expect(url).toContain('group_children=2');
  });

  it('applies the apartments filter via nflt=ht_id%3D204', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Lisbon',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
        inventoryFilter: 'apartments',
      },
      getExpediaAffiliateConfig(),
    );
    expect(url).toContain('nflt=ht_id%3D204');
  });

  it('applies the luxury filter via nflt=class%3D4%3Bclass%3D5', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Maldives',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
        inventoryFilter: 'luxury',
      },
      getExpediaAffiliateConfig(),
    );
    expect(url).toContain('nflt=class%3D4%3Bclass%3D5');
  });

  it('tags _src=gotript for post-click analytics', () => {
    const url = buildExpediaSearchUrl(
      { destination: 'Berlin', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 },
      getExpediaAffiliateConfig(),
    );
    expect(url).toContain('_src=gotript');
  });

  it('produces a valid URL (parseable, https)', () => {
    const url = buildExpediaSearchUrl(
      { destination: 'Tuscany, Italy', checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 4 },
      getExpediaAffiliateConfig(),
    );
    const parsed = new URL(url);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('www.booking.com');
    expect(parsed.pathname).toBe('/searchresults.html');
  });
});
