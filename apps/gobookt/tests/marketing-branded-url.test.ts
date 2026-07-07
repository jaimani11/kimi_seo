import { describe, expect, it } from 'vitest';
import {
  GOBOOKT_DOMAIN_LABEL,
  brandedGobooktUrl,
} from '../src/lib/marketing/branded-url';

describe('brandedGobooktUrl', () => {
  it('routes to gobookt.com / destinations / {slug}', () => {
    expect(brandedGobooktUrl({ citySlug: 'tokyo', platform: 'pinterest' })).toMatch(
      /^https:\/\/www\.gobookt\.com\/destinations\/tokyo\?/,
    );
  });

  it('carries utm_source for the platform', () => {
    expect(brandedGobooktUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_source=pinterest',
    );
    expect(brandedGobooktUrl({ citySlug: 'agra', platform: 'instagram' })).toContain(
      'utm_source=instagram',
    );
    expect(brandedGobooktUrl({ citySlug: 'agra', platform: 'tiktok' })).toContain(
      'utm_source=tiktok',
    );
  });

  it('always sets utm_medium=organic', () => {
    expect(brandedGobooktUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_medium=organic',
    );
  });

  it('utm_campaign is city-scoped for attribution', () => {
    expect(brandedGobooktUrl({ citySlug: 'agra', platform: 'pinterest' })).toContain(
      'utm_campaign=daily-agra',
    );
  });

  it('exports the bare domain label for surface copy', () => {
    expect(GOBOOKT_DOMAIN_LABEL).toBe('gobookt.com');
  });
});
