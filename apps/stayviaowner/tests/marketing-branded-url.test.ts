import { describe, expect, it } from 'vitest';
import {
  STAYVIAOWNER_DOMAIN_LABEL,
  brandedStayviaownerUrl,
} from '../src/lib/marketing/branded-url';

describe('brandedStayviaownerUrl', () => {
  it('routes to stayviaowner.com / destinations / {slug}', () => {
    // stayviaowner's canonical host is www (brand-config siteUrl).
    expect(brandedStayviaownerUrl({ citySlug: 'tokyo', platform: 'pinterest' })).toMatch(
      /^https:\/\/www\.stayviaowner\.com\/destinations\/tokyo\?/,
    );
  });

  it('routes VRBO-rotation posts to /vacation-rentals', () => {
    expect(
      brandedStayviaownerUrl({ citySlug: 'tokyo', platform: 'pinterest', variant: 'vrbo-direct' }),
    ).toMatch(/^https:\/\/www\.stayviaowner\.com\/vacation-rentals\?ss=tokyo/);
  });

  it('carries utm_source for the platform', () => {
    expect(brandedStayviaownerUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_source=pinterest',
    );
    expect(brandedStayviaownerUrl({ citySlug: 'agra', platform: 'instagram' })).toContain(
      'utm_source=instagram',
    );
    expect(brandedStayviaownerUrl({ citySlug: 'agra', platform: 'tiktok' })).toContain(
      'utm_source=tiktok',
    );
  });

  it('always sets utm_medium=organic', () => {
    expect(brandedStayviaownerUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_medium=organic',
    );
  });

  it('utm_campaign is city-scoped for attribution', () => {
    // ~30% of cities land on the /vacation-rentals (VRBO) rotation → vrbo-{city};
    // the rest → daily-{city}. Either way the campaign is scoped to the city.
    expect(brandedStayviaownerUrl({ citySlug: 'agra', platform: 'pinterest' })).toMatch(
      /utm_campaign=(daily|vrbo)-agra(?:&|$)/,
    );
  });

  it('exports the bare domain label for surface copy', () => {
    expect(STAYVIAOWNER_DOMAIN_LABEL).toBe('stayviaowner.com');
  });
});
