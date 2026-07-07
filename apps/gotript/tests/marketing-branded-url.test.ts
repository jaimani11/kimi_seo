import { describe, expect, it } from 'vitest';
import {
  GOTRIPT_DOMAIN_LABEL,
  brandedGotriptUrl,
} from '../src/lib/marketing/branded-url';

describe('brandedGotriptUrl', () => {
  it('routes to gotript.com / destinations / {slug}', () => {
    expect(brandedGotriptUrl({ citySlug: 'tokyo', platform: 'pinterest' })).toMatch(
      /^https:\/\/www\.gotript\.com\/destinations\/tokyo\?/,
    );
  });

  it('carries utm_source for the platform', () => {
    expect(brandedGotriptUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_source=pinterest',
    );
    expect(brandedGotriptUrl({ citySlug: 'agra', platform: 'instagram' })).toContain(
      'utm_source=instagram',
    );
    expect(brandedGotriptUrl({ citySlug: 'agra', platform: 'tiktok' })).toContain(
      'utm_source=tiktok',
    );
  });

  it('always sets utm_medium=organic', () => {
    expect(brandedGotriptUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_medium=organic',
    );
  });

  it('utm_campaign is city-scoped for attribution', () => {
    expect(brandedGotriptUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_campaign=daily-agra',
    );
  });

  it('exports the bare domain label for surface copy', () => {
    expect(GOTRIPT_DOMAIN_LABEL).toBe('gotript.com');
  });
});
