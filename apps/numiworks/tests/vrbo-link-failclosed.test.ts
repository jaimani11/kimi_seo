import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  wrapVrboAffiliate,
  buildVrboSearchUrl,
  vrboLinkMode,
  vrboCarriesDestination,
} from '@/lib/affiliate/vrbo-link';
import { checkAffiliateConfig } from '@/lib/affiliate/config-guard';

const ENV_KEYS = [
  'NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE',
  'NEXT_PUBLIC_VRBO_CAMREF',
  'NEXT_PUBLIC_VRBO_SHORTLINK',
  'NEXT_PUBLIC_VRBO_ALLOW_EMERGENCY_FALLBACK',
  'NEXT_PUBLIC_VIATOR_PARTNER_ID',
  'VIATOR_PARTNER_ID',
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

describe('VRBO affiliate links — fail-closed + attribution', () => {
  const TEMPLATE = 'https://prf.hn/click/camref:1110lFruB/destination:{TARGET}';
  const INNER_ROME = 'https://www.vrbo.com/search?destination=Rome%2C+Italy';

  it('uses the Partnerize template and encodes the target exactly once', () => {
    process.env.NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE = TEMPLATE;
    const href = buildVrboSearchUrl('Rome, Italy');
    expect(href).toBe(
      'https://prf.hn/click/camref:1110lFruB/destination:' + encodeURIComponent(INNER_ROME),
    );
    // "exactly once": decoding the destination segment a SINGLE time recovers
    // the clean inner VRBO url (double-encoding would need two decodes).
    expect(href).not.toBeNull();
    const dest = (href as string).split('/destination:')[1] ?? '';
    expect(decodeURIComponent(dest)).toBe(INNER_ROME);
    expect(vrboLinkMode()).toBe('template');
    expect(vrboCarriesDestination()).toBe(true);
  });

  it('builds the prf.hn wrapper from a bare camref', () => {
    process.env.NEXT_PUBLIC_VRBO_CAMREF = '1110lFruB';
    const href = buildVrboSearchUrl('Tokyo, Japan');
    expect(href).toContain('https://prf.hn/click/camref:1110lFruB/destination:');
    expect(href).toContain(encodeURIComponent('https://www.vrbo.com/search?destination=Tokyo%2C+Japan'));
    expect(vrboLinkMode()).toBe('camref');
    expect(vrboCarriesDestination()).toBe(true);
  });

  it('FAILS CLOSED (null) when VRBO is unconfigured — never a homepage bounce', () => {
    expect(buildVrboSearchUrl('Paris, France')).toBeNull();
    expect(wrapVrboAffiliate('https://www.vrbo.com/')).toBeNull();
    expect(vrboLinkMode()).toBe('unconfigured');
    expect(vrboCarriesDestination()).toBe(false);
  });

  it('surfaces the emergency bounce ONLY when explicitly opted in, and it carries no destination', () => {
    process.env.NEXT_PUBLIC_VRBO_ALLOW_EMERGENCY_FALLBACK = 'true';
    const href = wrapVrboAffiliate('https://www.vrbo.com/search?destination=Bali');
    expect(href).toBe('https://vrbo.com/affiliate/zVJTNin');
    expect(vrboLinkMode()).toBe('emergency');
    // emergency = homepage bounce → must NOT be presented as carrying a destination
    expect(vrboCarriesDestination()).toBe(false);
  });
});

describe('affiliate config guard', () => {
  it('flags unconfigured VRBO + missing Viator partner id', () => {
    const status = checkAffiliateConfig();
    expect(status.ok).toBe(false);
    expect(status.vrbo).toBe('unconfigured');
    expect(status.viatorPartnerId).toBe(false);
    expect(status.issues.length).toBeGreaterThanOrEqual(2);
  });

  it('is ok when VRBO template + Viator partner id are set', () => {
    process.env.NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE = 'https://prf.hn/click/camref:1110lFruB/destination:{TARGET}';
    process.env.VIATOR_PARTNER_ID = 'P00012345';
    const status = checkAffiliateConfig();
    expect(status.ok).toBe(true);
    expect(status.vrbo).toBe('template');
    expect(status.viatorPartnerId).toBe(true);
    expect(status.issues).toEqual([]);
  });

  it('flags the emergency bounce as a problem even though a link is produced', () => {
    process.env.NEXT_PUBLIC_VRBO_ALLOW_EMERGENCY_FALLBACK = 'true';
    process.env.VIATOR_PARTNER_ID = 'P00012345';
    const status = checkAffiliateConfig();
    expect(status.vrbo).toBe('emergency');
    expect(status.ok).toBe(false);
    expect(status.issues.some((i) => i.includes('emergency'))).toBe(true);
  });
});
