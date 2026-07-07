import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildViatorStaySearchUrl,
  getViatorStayLinkConfig,
} from '../src/lib/affiliate/viator-stay-link-builder';

const KEYS = [
  'NEXT_PUBLIC_VIATOR_PARTNER_ID',
  'VIATOR_PARTNER_ID',
  'NEXT_PUBLIC_VIATOR_STAY_MCID',
  'VIATOR_STAY_MCID',
  'NEXT_PUBLIC_VIATOR_BASE_URL',
  'VIATOR_BASE_URL',
] as const;

describe('getViatorStayLinkConfig', () => {
  const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};
  beforeEach(() => {
    for (const k of KEYS) saved[k] = process.env[k];
    for (const k of KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('returns null partnerId when no env var is set', () => {
    expect(getViatorStayLinkConfig().partnerId).toBeNull();
  });

  it('reads VIATOR_PARTNER_ID from env', () => {
    process.env.VIATOR_PARTNER_ID = 'P00012345';
    expect(getViatorStayLinkConfig().partnerId).toBe('P00012345');
  });

  it('prefers NEXT_PUBLIC_VIATOR_PARTNER_ID over the server var', () => {
    process.env.VIATOR_PARTNER_ID = 'server-only';
    process.env.NEXT_PUBLIC_VIATOR_PARTNER_ID = 'client-safe';
    expect(getViatorStayLinkConfig().partnerId).toBe('client-safe');
  });

  it('defaults mcid to gobookt-stay', () => {
    expect(getViatorStayLinkConfig().mcid).toBe('gobookt-stay');
  });

  it('honors NEXT_PUBLIC_VIATOR_STAY_MCID override', () => {
    process.env.NEXT_PUBLIC_VIATOR_STAY_MCID = 'custom-channel';
    expect(getViatorStayLinkConfig().mcid).toBe('custom-channel');
  });

  it('defaults baseUrl to https://www.viator.com', () => {
    expect(getViatorStayLinkConfig().baseUrl).toBe('https://www.viator.com');
  });

  it('strips a trailing slash from the configured base URL', () => {
    process.env.NEXT_PUBLIC_VIATOR_BASE_URL = 'https://www.viator.com/';
    expect(getViatorStayLinkConfig().baseUrl).toBe('https://www.viator.com');
  });
});

describe('buildViatorStaySearchUrl', () => {
  const baseConfig = {
    partnerId: 'P00012345',
    mcid: 'gobookt-stay',
    baseUrl: 'https://www.viator.com',
  };

  it('builds the canonical /searchResults/all URL with the destination', () => {
    const url = buildViatorStaySearchUrl({ destination: 'Agra' }, baseConfig);
    expect(url).toBe(
      'https://www.viator.com/searchResults/all?text=Agra&pid=P00012345&mcid=gobookt-stay&medium=link',
    );
  });

  it('URL-encodes destinations with spaces', () => {
    const url = buildViatorStaySearchUrl({ destination: 'Mexico City' }, baseConfig);
    expect(url).toContain('text=Mexico+City');
  });

  it('omits the pid param when partnerId is null', () => {
    const url = buildViatorStaySearchUrl(
      { destination: 'Tokyo' },
      { ...baseConfig, partnerId: null },
    );
    expect(url).not.toContain('pid=');
    expect(url).toContain('text=Tokyo');
    expect(url).toContain('mcid=gobookt-stay');
  });

  it('always includes medium=link and the configured mcid', () => {
    const url = buildViatorStaySearchUrl(
      { destination: 'Rome' },
      { ...baseConfig, mcid: 'gobookt-card' },
    );
    expect(url).toContain('mcid=gobookt-card');
    expect(url).toContain('medium=link');
  });
});
