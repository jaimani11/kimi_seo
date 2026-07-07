import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildExpediaPropertyUrl,
  buildExpediaSearchUrl,
  getExpediaAffiliateConfig,
} from '@/lib/affiliate/expedia-link-builder';

describe('getExpediaAffiliateConfig', () => {
  const ENV_KEYS = [
    'NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID',
    'NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL',
    'NEXT_PUBLIC_EXPEDIA_AFFILIATE_BASE_URL',
    'NEXT_PUBLIC_EXPEDIA_AFFILIATE_SITE_ID',
    'EXPEDIA_AFFILIATE_CID',
    'EXPEDIA_AFFILIATE_LABEL',
    'EXPEDIA_AFFILIATE_BASE_URL',
    'EXPEDIA_AFFILIATE_SITE_ID',
  ] as const;

  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });

  it('returns null cid + null label + default baseUrl + siteId 1 when nothing is set', () => {
    expect(getExpediaAffiliateConfig()).toEqual({
      cid: null,
      label: null,
      baseUrl: 'https://www.expedia.com',
      siteId: 1,
    });
  });

  it('reads NEXT_PUBLIC_-prefixed names', () => {
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID = 'CID123';
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL = 'web';
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_BASE_URL = 'https://www.expedia.co.uk';
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_SITE_ID = '3';
    expect(getExpediaAffiliateConfig()).toEqual({
      cid: 'CID123',
      label: 'web',
      baseUrl: 'https://www.expedia.co.uk',
      siteId: 3,
    });
  });

  it('falls back to non-prefixed names server-side', () => {
    process.env.EXPEDIA_AFFILIATE_CID = 'CID-fallback';
    expect(getExpediaAffiliateConfig().cid).toBe('CID-fallback');
  });

  it('strips trailing slash on baseUrl', () => {
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_BASE_URL = 'https://www.expedia.de/';
    expect(getExpediaAffiliateConfig().baseUrl).toBe('https://www.expedia.de');
  });

  it('rejects non-numeric siteId, falls back to default 1', () => {
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_SITE_ID = 'not-a-number';
    expect(getExpediaAffiliateConfig().siteId).toBe(1);
  });
});

describe('buildExpediaSearchUrl', () => {
  it('produces a destination-search URL with all canonical params', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Tuscany, Italy',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
      },
      { cid: 'CID123', label: 'web', baseUrl: 'https://www.expedia.com', siteId: 1 },
    );
    expect(url).toContain('https://www.expedia.com/Hotel-Search?');
    expect(url).toContain('destination=Tuscany%2C+Italy');
    expect(url).toContain('startDate=2026-09-01');
    expect(url).toContain('endDate=2026-09-05');
    expect(url).toContain('adults=2');
    expect(url).toContain('rooms=1');
    expect(url).toContain('siteid=1');
    expect(url).toContain('affcid=CID123');
    expect(url).toContain('label=web');
    expect(url).toContain('_src=gobookt');
  });

  it('omits affcid when no cid configured (mock-safe - URL still works)', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Tokyo',
        checkIn: '2026-04-12',
        checkOut: '2026-04-15',
        adults: 1,
      },
      { cid: null, label: null, baseUrl: 'https://www.expedia.com', siteId: 1 },
    );
    expect(url).not.toContain('affcid');
    expect(url).not.toContain('label');
    expect(url).toContain('destination=Tokyo');
    expect(url).toContain('startDate=2026-04-12');
  });

  it('encodes children ages as comma-separated list', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Paris',
        checkIn: '2026-06-10',
        checkOut: '2026-06-13',
        adults: 2,
        childrenAges: [4, 8],
      },
      { cid: 'C', label: null, baseUrl: 'https://www.expedia.com', siteId: 1 },
    );
    expect(url).toContain('children=4%2C8');
  });

  it('clamps child ages to [0, 17]', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'Lisbon',
        checkIn: '2026-06-10',
        checkOut: '2026-06-13',
        adults: 2,
        childrenAges: [-5, 99],
      },
      { cid: null, label: null, baseUrl: 'https://www.expedia.com', siteId: 1 },
    );
    expect(url).toContain('children=0%2C17');
  });

  it('respects baseUrl override (locale)', () => {
    const url = buildExpediaSearchUrl(
      {
        destination: 'London',
        checkIn: '2026-06-10',
        checkOut: '2026-06-13',
        adults: 2,
      },
      { cid: 'CID', label: null, baseUrl: 'https://www.expedia.co.uk', siteId: 3 },
    );
    expect(url.startsWith('https://www.expedia.co.uk/Hotel-Search?')).toBe(true);
    expect(url).toContain('siteid=3');
  });
});

describe('buildExpediaPropertyUrl', () => {
  it('produces a property-information URL with the affcid attached', () => {
    const url = buildExpediaPropertyUrl(
      {
        propertyId: '12345',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
      },
      { cid: 'CID', label: null, baseUrl: 'https://www.expedia.com', siteId: 1 },
    );
    expect(url).toContain('https://www.expedia.com/h12345.Hotel-Information');
    expect(url).toContain('affcid=CID');
    expect(url).toContain('chkin=2026-09-01');
    expect(url).toContain('rm1=a2');
  });

  it('strips a leading h on the property id (accepts both forms)', () => {
    const url = buildExpediaPropertyUrl(
      { propertyId: 'h99887' },
      { cid: null, label: null, baseUrl: 'https://www.expedia.com', siteId: 1 },
    );
    expect(url).toContain('/h99887.Hotel-Information');
  });
});
