import { describe, expect, it } from 'vitest';
import type { Experience } from '@core/experience';
import { buildViatorRedirect, viatorAffiliateHref } from '@lib/affiliate/viator-link-builder';
import { decodeAffiliateLink } from '@lib/affiliate/link-encoder';

function makeExperience(overrides: Partial<Experience['affiliate']> = {}): Experience {
  return {
    id: 'viator:TEST123',
    productCode: 'TEST123',
    title: 'Test experience',
    summary: 'Test summary.',
    location: { destination: 'Tokyo', destinationRef: null, country: null },
    photos: [],
    duration: { kind: 'fixed', minutes: 120, fromMinutes: null, toMinutes: null, label: null },
    pricing: { fromPerPerson: 100, fromPerPersonBeforeDiscount: null, currency: 'USD' },
    reviews: { averageRating: 4.5, total: 10 },
    flags: [],
    confirmation: 'instant',
    tags: [],
    affiliate: {
      providerId: 'viator',
      url: 'https://www.viator.com/tours/Tokyo/Test/d334-TEST123?campaign-value=stayscout',
      stayId: 'viator-TEST123',
      ...overrides,
    },
  };
}

describe('buildViatorRedirect', () => {
  it('builds a redirect whose decoded payload matches the experience URL exactly', () => {
    const experience = makeExperience();
    const built = buildViatorRedirect({ experience });
    expect(built).not.toBeNull();
    const payload = decodeAffiliateLink(built!.id);
    expect(payload).not.toBeNull();
    expect(payload!.url).toBe(experience.affiliate.url);
    expect(payload!.providerId).toBe('viator');
    expect(payload!.stayId).toBe('viator-TEST123');
  });

  it('threads turnId + conversationId into the payload when provided', () => {
    const built = buildViatorRedirect({
      experience: makeExperience(),
      turnId: 'turn-42',
      conversationId: 'conv-7',
    });
    expect(built).not.toBeNull();
    const payload = decodeAffiliateLink(built!.id);
    expect(payload!.turnId).toBe('turn-42');
    expect(payload!.conversationId).toBe('conv-7');
  });

  it('returns null when the URL is missing', () => {
    const built = buildViatorRedirect({ experience: makeExperience({ url: '' }) });
    expect(built).toBeNull();
  });

  it('rejects URLs whose host is not on the affiliate allowlist', () => {
    const built = buildViatorRedirect({
      experience: makeExperience({ url: 'https://phishing.bad-host.com/tours/x' }),
    });
    expect(built).toBeNull();
  });

  it('rejects non-https URLs', () => {
    const built = buildViatorRedirect({
      experience: makeExperience({ url: 'http://www.viator.com/tours/x' }),
    });
    expect(built).toBeNull();
  });
});

describe('viatorAffiliateHref', () => {
  it('returns a /r/<id> path for a valid experience', () => {
    const href = viatorAffiliateHref(makeExperience());
    expect(href).not.toBeNull();
    expect(href!.startsWith('/r/')).toBe(true);
  });

  it('returns null when the experience has no valid affiliate URL', () => {
    const href = viatorAffiliateHref(makeExperience({ url: '' }));
    expect(href).toBeNull();
  });
});
