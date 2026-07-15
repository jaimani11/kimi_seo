import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildExpediaSearchUrl,
  getExpediaAffiliateConfig,
} from '@/lib/affiliate/expedia-link-builder';

// expedia-link-builder is a thin compat shim over the shared multi-category
// Partnerize builder. Every stay hand-off it produces is wrapped through
// prf.hn with camref 1110lFruB (the DIRECT Expedia Group Creator program) —
// the camref lives in the wrapper, not the destination query string.
const PARTNERIZE_PREFIX = 'https://prf.hn/click/camref:1110lFruB/destination:';

function partnerizeTarget(url: string): URL {
  expect(url.startsWith(PARTNERIZE_PREFIX), `expected Partnerize wrapper, got: ${url}`).toBe(true);
  return new URL(decodeURIComponent(url.slice(PARTNERIZE_PREFIX.length)));
}

describe('getExpediaAffiliateConfig', () => {
  const ENV_KEYS = [
    'NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID',
    'EXPEDIA_AFFILIATE_ID',
    'NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL',
    'EXPEDIA_AFFILIATE_LABEL',
    'EXPEDIA_SITE_ID',
  ] as const;
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('defaults to null affiliate id, the gotript label, expedia.com base, siteId 1', () => {
    const cfg = getExpediaAffiliateConfig();
    expect(cfg.affiliateId).toBeNull();
    expect(cfg.cid).toBeNull(); // cid is a back-compat mirror of affiliateId
    expect(cfg.label).toBe('gotript');
    expect(cfg.baseUrl).toBe('https://www.expedia.com');
    expect(cfg.siteId).toBe(1);
  });

  it('reads the affiliate id from env (cid mirrors it)', () => {
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID = 'AID123';
    const cfg = getExpediaAffiliateConfig();
    expect(cfg.affiliateId).toBe('AID123');
    expect(cfg.cid).toBe('AID123');
  });

  it('honors a custom label override', () => {
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL = 'web';
    expect(getExpediaAffiliateConfig().label).toBe('web');
  });

  it('reads a numeric EXPEDIA_SITE_ID, falling back to 1 on garbage', () => {
    process.env.EXPEDIA_SITE_ID = '3';
    expect(getExpediaAffiliateConfig().siteId).toBe(3);
    process.env.EXPEDIA_SITE_ID = 'not-a-number';
    expect(getExpediaAffiliateConfig().siteId).toBe(1);
  });
});

describe('buildExpediaSearchUrl — Partnerize-tracked hotel search', () => {
  it('wraps an expedia.com hotel search through prf.hn, preserving destination + dates', () => {
    const target = partnerizeTarget(
      buildExpediaSearchUrl({
        destination: 'Tuscany, Italy',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
      }),
    );
    expect(target.hostname).toBe('www.expedia.com');
    expect(target.pathname).toBe('/Hotel-Search');
    expect(target.searchParams.get('destination')).toBe('Tuscany, Italy');
    expect(target.searchParams.get('startDate')).toBe('2026-09-01');
    expect(target.searchParams.get('endDate')).toBe('2026-09-05');
    expect(target.searchParams.get('adults')).toBe('2');
    expect(target.searchParams.get('rooms')).toBe('1');
    expect(target.searchParams.get('label')).toBe('gotript');
    expect(target.searchParams.get('_src')).toBe('gotript');
  });

  it('emits a children count when supplied', () => {
    const target = partnerizeTarget(buildExpediaSearchUrl({ destination: 'Paris', children: 2 }));
    expect(target.searchParams.get('children')).toBe('2');
  });

  it('never mixes in Awin/CJ attribution params', () => {
    const url = buildExpediaSearchUrl({ destination: 'Tokyo' });
    expect(url).not.toContain('clickref'); // Awin/CJ key — not this program
    expect(url).not.toContain('affcid'); // the retired Awin-style CID param
    expect(url).not.toContain('cj.com');
    expect(url).not.toContain('tkqlhce');
  });
});
