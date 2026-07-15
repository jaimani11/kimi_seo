import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildActiveStaySearchUrl,
  getActiveStayProvider,
  getActiveStayProviderId,
} from '@lib/affiliate/active-stay-provider';

const MODE_KEYS = [
  'NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER',
  'EXPEDIA_AFFILIATE_ID',
  'NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID',
  'EXPEDIA_AFFILIATE_LABEL',
  'NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL',
  'EXPEDIA_CAMPAIGN_ID',
  'NEXT_PUBLIC_EXPEDIA_CAMPAIGN_ID',
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

// stayviaowner is a Vrbo whole-home rental brand: the DEFAULT stay handoff is
// Vrbo, with Expedia hotels available as an env override. Both partners are on
// the DIRECT Expedia Group Creator / Partnerize program, so every tracked
// handoff is wrapped through prf.hn with camref 1110lFruB — the camref lives in
// the wrapper, not the destination query string.
const PARTNERIZE_PREFIX = 'https://prf.hn/click/camref:1110lFruB/destination:';

/** Assert the URL is Partnerize-wrapped, then decode the inner partner URL. */
function partnerizeTarget(url: string): string {
  expect(url.startsWith(PARTNERIZE_PREFIX), `expected Partnerize wrapper, got: ${url}`).toBe(true);
  return decodeURIComponent(url.slice(PARTNERIZE_PREFIX.length));
}

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

  it('defaults to vrbo when unset', () => {
    expect(getActiveStayProvider()).toBe('vrbo');
  });

  it('honors the expedia override', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    expect(getActiveStayProvider()).toBe('expedia');
  });

  it('honors the vrbo override', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'vrbo';
    expect(getActiveStayProvider()).toBe('vrbo');
  });

  it('explicitly accepts viator override', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'viator';
    expect(getActiveStayProvider()).toBe('viator');
  });

  it('falls back to vrbo on garbage values', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'garbage';
    expect(getActiveStayProvider()).toBe('vrbo');
  });

  it('is case-insensitive', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'VRBO';
    expect(getActiveStayProvider()).toBe('vrbo');
  });

  it('getActiveStayProviderId mirrors getActiveStayProvider', () => {
    expect(getActiveStayProviderId()).toBe('vrbo');
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    expect(getActiveStayProviderId()).toBe('expedia');
  });
});

describe('buildActiveStaySearchUrl — Vrbo default + Expedia override are Partnerize-tracked', () => {
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

  it('wraps the default (Vrbo) handoff through Partnerize camref 1110lFruB', () => {
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url.startsWith(PARTNERIZE_PREFIX)).toBe(true);
  });

  it('lands on the Vrbo search endpoint with the destination + dates preserved', () => {
    const target = new URL(partnerizeTarget(buildActiveStaySearchUrl(SAMPLE_INPUT)));
    expect(target.hostname).toBe('www.vrbo.com');
    expect(target.pathname).toBe('/search');
    expect(target.searchParams.get('destination')).toBe('Tuscany');
    expect(target.searchParams.get('startDate')).toBe('2026-09-01');
    expect(target.searchParams.get('endDate')).toBe('2026-09-05');
  });

  it('routes the Expedia override to the Expedia hotel-search endpoint, still tracked', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    const target = new URL(partnerizeTarget(buildActiveStaySearchUrl(SAMPLE_INPUT)));
    expect(target.hostname).toBe('www.expedia.com');
    expect(target.pathname).toBe('/Hotel-Search');
    expect(target.searchParams.get('destination')).toBe('Tuscany');
    expect(target.searchParams.get('startDate')).toBe('2026-09-01');
    expect(target.searchParams.get('endDate')).toBe('2026-09-05');
  });

  it('attaches the stayviaowner label + _src breadcrumbs on the Expedia target', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    const target = new URL(partnerizeTarget(buildActiveStaySearchUrl(SAMPLE_INPUT)));
    expect(target.searchParams.get('label')).toBe('stayviaowner');
    expect(target.searchParams.get('_src')).toBe('stayviaowner');
  });

  it('collapses childrenAges to a count on the Expedia target', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'expedia';
    const target = new URL(
      partnerizeTarget(buildActiveStaySearchUrl({ ...SAMPLE_INPUT, childrenAges: [8, 10] })),
    );
    expect(target.searchParams.get('adults')).toBe('2');
    expect(target.searchParams.get('children')).toBe('2');
  });

  it('never mixes in Awin/CJ params and encodes the target exactly once', () => {
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url).not.toContain('clickref'); // Awin/CJ attribution key — not this program
    expect(url).not.toContain('cj.com');
    expect(url).not.toContain('tkqlhce'); // CJ redirect host
    expect(url).not.toContain('anrdoezrs'); // CJ redirect host
    expect(partnerizeTarget(url)).not.toContain('%2F');
  });

  it('routes to viator.com when the env override is set', () => {
    process.env.NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER = 'viator';
    const url = buildActiveStaySearchUrl(SAMPLE_INPUT);
    expect(url).toContain('viator.com');
  });
});
