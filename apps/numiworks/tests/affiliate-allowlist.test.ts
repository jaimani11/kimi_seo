import { describe, expect, it } from 'vitest';
import { AFFILIATE_HOST_ALLOWLIST, isAllowedAffiliateHost } from '@/lib/affiliate/allowlist';

describe('isAllowedAffiliateHost', () => {
  it('accepts exact-match allowed hosts over https', () => {
    for (const host of AFFILIATE_HOST_ALLOWLIST) {
      expect(isAllowedAffiliateHost(`https://${host}/path`)).toBe(true);
    }
  });

  it('accepts subdomains of allowed hosts', () => {
    expect(isAllowedAffiliateHost('https://www.booking.com/hotel/x')).toBe(true);
    expect(isAllowedAffiliateHost('https://secure.booking.com/checkout')).toBe(true);
    expect(isAllowedAffiliateHost('https://partner.expedia.com/r/x')).toBe(true);
  });

  it('rejects http (no first-party cookies on cross-origin)', () => {
    expect(isAllowedAffiliateHost('http://booking.com/foo')).toBe(false);
  });

  it('rejects unknown hosts', () => {
    expect(isAllowedAffiliateHost('https://evil.example.org/phish')).toBe(false);
    expect(isAllowedAffiliateHost('https://googlebooking.com/x')).toBe(false);
    expect(isAllowedAffiliateHost('https://booking.com.evil.org/x')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isAllowedAffiliateHost('not-a-url')).toBe(false);
    expect(isAllowedAffiliateHost('')).toBe(false);
    expect(isAllowedAffiliateHost('javascript:alert(1)')).toBe(false);
  });

  it('rejects host that just contains an allowed substring', () => {
    // Naive endsWith without the leading "." would match these.
    expect(isAllowedAffiliateHost('https://fakebooking.com/x')).toBe(false);
    expect(isAllowedAffiliateHost('https://expedia.com.attacker.io/x')).toBe(false);
  });
});
