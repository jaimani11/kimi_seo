import { describe, expect, it } from 'vitest';
import {
  NUMIWORKS_DOMAIN_LABEL,
  brandedNumiworksUrl,
} from '../src/lib/marketing/branded-url';

describe('brandedNumiworksUrl', () => {
  it('routes to numiworks.com / destinations / {slug}', () => {
    expect(brandedNumiworksUrl({ citySlug: 'tokyo', platform: 'pinterest' })).toMatch(
      /^https:\/\/www\.numiworks\.com\/destinations\/tokyo\?/,
    );
  });

  it('carries utm_source for the platform', () => {
    expect(brandedNumiworksUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_source=pinterest',
    );
    expect(brandedNumiworksUrl({ citySlug: 'agra', platform: 'instagram' })).toContain(
      'utm_source=instagram',
    );
    expect(brandedNumiworksUrl({ citySlug: 'agra', platform: 'tiktok' })).toContain(
      'utm_source=tiktok',
    );
  });

  it('always sets utm_medium=organic', () => {
    expect(brandedNumiworksUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_medium=organic',
    );
  });

  it('utm_campaign is city-scoped for attribution', () => {
    expect(brandedNumiworksUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_campaign=daily-agra',
    );
  });

  it('exports the bare domain label for surface copy', () => {
    expect(NUMIWORKS_DOMAIN_LABEL).toBe('numiworks.com');
  });
});
