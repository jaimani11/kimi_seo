import { describe, expect, it } from 'vitest';
import type { Experience } from '@core/experience';
import type { TripIntent } from '@core/trip-intent';
import {
  toGroundedCard,
  whyItFitsFor,
  groundedSearchFallback,
  withBoundedRetry,
  isTransientProviderError,
  CARD_DISCLOSURE,
  type GroundedCardContext,
} from '@/lib/concierge/grounded-card';

function makeExp(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 'viator:P123',
    productCode: 'P123',
    title: 'Rome Twilight Food Tour',
    summary: 'A tasty evening walk through Trastevere.',
    location: { destination: '', destinationRef: '684', country: 'IT' },
    photos: [],
    duration: { kind: 'unstructured', minutes: null, fromMinutes: null, toMinutes: null, label: '3 hours' },
    pricing: { fromPerPerson: 0, fromPerPersonBeforeDiscount: null, currency: 'EUR' },
    reviews: { averageRating: null, total: 0 },
    flags: [],
    confirmation: 'instant',
    tags: [],
    affiliate: { providerId: 'viator', url: 'https://www.viator.com/tours/Rome/x/d511-P123', stayId: 's1' },
    ...overrides,
  };
}

const CTX: GroundedCardContext = {
  destinationLabel: 'Rome, Italy',
  whyItFits: 'Free cancellation',
  retrievedAt: '2026-07-14T00:00:00.000Z',
};

describe('toGroundedCard — never invents optional fields', () => {
  it('omits price/rating/image when the provider did not supply them', () => {
    const card = toGroundedCard(makeExp(), CTX);
    expect(card).not.toBeNull();
    expect(card!.price).toBeUndefined(); // fromPerPerson 0 → absent, not "$0"
    expect(card!.rating).toBeUndefined(); // no reviews → absent, not "0 stars"
    expect(card!.imageUrl).toBeUndefined();
    // required, always-present grounded fields
    expect(card!.provider).toBe('Viator');
    expect(card!.productId).toBe('P123');
    expect(card!.title).toBe('Rome Twilight Food Tour');
    expect(card!.url).toBe('https://www.viator.com/tours/Rome/x/d511-P123');
    expect(card!.disclosure).toBe(CARD_DISCLOSURE);
    expect(card!.retrievedAt).toBe('2026-07-14T00:00:00.000Z');
  });

  it('carries price/rating/image ONLY when the provider supplied real values', () => {
    const card = toGroundedCard(
      makeExp({
        pricing: { fromPerPerson: 59, fromPerPersonBeforeDiscount: null, currency: 'EUR' },
        reviews: { averageRating: 4.6, total: 120 },
        photos: [{ url: 'https://img.viator.com/p.jpg', width: 800, height: 600, alt: 'food' }],
      }),
      CTX,
    );
    expect(card!.price).toEqual({ amount: 59, currency: 'EUR' });
    expect(card!.rating).toEqual({ average: 4.6, count: 120 });
    expect(card!.imageUrl).toBe('https://img.viator.com/p.jpg');
    expect(card!.imageAlt).toBe('food');
  });

  it('uses the intent destination label when the provider omits a readable name', () => {
    expect(toGroundedCard(makeExp(), CTX)!.destination).toBe('Rome, Italy');
  });

  it("prefers the provider's own destination name when present", () => {
    const card = toGroundedCard(makeExp({ location: { destination: 'Trastevere', destinationRef: '684', country: 'IT' } }), CTX);
    expect(card!.destination).toBe('Trastevere');
  });

  it('returns null when there is no tracked URL (no dead cards)', () => {
    expect(toGroundedCard(makeExp({ affiliate: { providerId: 'viator', url: '', stayId: 's1' } }), CTX)).toBeNull();
  });

  it('does not treat a zero rating with zero reviews as a real rating', () => {
    const card = toGroundedCard(makeExp({ reviews: { averageRating: 0, total: 0 } }), CTX);
    expect(card!.rating).toBeUndefined();
  });
});

describe('whyItFitsFor — grounded in real signals only', () => {
  const intent = { vibe: { tags: ['foodie'] } } as unknown as TripIntent;

  it('combines a real provider flag with the traveler intent vibe', () => {
    const s = whyItFitsFor(intent, makeExp({ flags: ['free-cancellation'] }));
    expect(s).toBe('Free cancellation · matches your foodie vibe');
  });

  it('falls back to a neutral, non-inventive line when no signals exist', () => {
    const bland = { vibe: { tags: [] } } as unknown as TripIntent;
    expect(whyItFitsFor(bland, makeExp())).toBe('Bookable now, with real traveler reviews.');
  });
});

describe('groundedSearchFallback — honest empty/timeout state', () => {
  it('is a clearly-labelled SEARCH card that preserves the destination + url', () => {
    const c = groundedSearchFallback({
      destinationLabel: 'Rome',
      categoryLabel: 'cooking classes',
      searchUrl: 'https://www.viator.com/searchResults/all?text=cooking+class+Rome&pid=P1',
      retrievedAt: CTX.retrievedAt,
      reason: 'no-inventory',
    });
    expect(c.kind).toBe('search');
    expect(c.title).toBe('Search cooking classes in Rome on Viator');
    expect(c.destination).toBe('Rome');
    expect(c.url).toContain('pid=P1'); // attribution retained by the builder
    expect(c.disclosure).toBe(CARD_DISCLOSURE);
    expect(c.note).toContain('No specific matching experiences');
  });

  it('gives a provider-unavailable note distinct from no-inventory', () => {
    const c = groundedSearchFallback({ destinationLabel: 'Rome', searchUrl: 'https://www.viator.com/x', retrievedAt: CTX.retrievedAt, reason: 'provider-unavailable' });
    expect(c.note).toContain("couldn't reach live availability");
  });
});

describe('withBoundedRetry — one retry on transient only', () => {
  it('retries a transient failure once, then succeeds', async () => {
    let calls = 0;
    const out = await withBoundedRetry(
      async () => {
        calls++;
        if (calls === 1) throw new Error('ECONNRESET');
        return 'ok';
      },
      { isTransient: isTransientProviderError },
    );
    expect(out).toBe('ok');
    expect(calls).toBe(2);
  });

  it('does NOT retry a non-transient (validation) error', async () => {
    let calls = 0;
    await expect(
      withBoundedRetry(
        async () => {
          calls++;
          throw new Error('invalid request');
        },
        { isTransient: isTransientProviderError },
      ),
    ).rejects.toThrow('invalid request');
    expect(calls).toBe(1);
  });

  it('does NOT retry an abort (user/navigation or slot budget)', async () => {
    let calls = 0;
    await expect(
      withBoundedRetry(
        async () => {
          calls++;
          throw new Error('The operation was aborted');
        },
        { isTransient: isTransientProviderError },
      ),
    ).rejects.toThrow('aborted');
    expect(calls).toBe(1);
  });

  it('stops after the retry budget on persistent transient failure', async () => {
    let calls = 0;
    await expect(
      withBoundedRetry(
        async () => {
          calls++;
          throw new Error('network error');
        },
        { isTransient: isTransientProviderError },
      ),
    ).rejects.toThrow('network');
    expect(calls).toBe(2); // 1 + 1 retry
  });
});

describe('isTransientProviderError', () => {
  it('classifies network / 5xx as transient', () => {
    expect(isTransientProviderError(new Error('ECONNRESET'))).toBe(true);
    expect(isTransientProviderError(new Error('fetch failed'))).toBe(true);
    expect(isTransientProviderError(new Error('upstream returned 503'))).toBe(true);
  });
  it('classifies aborts and validation as NOT transient', () => {
    expect(isTransientProviderError(new Error('This operation was aborted'))).toBe(false);
    expect(isTransientProviderError(new Error('slot timeout'))).toBe(false);
    expect(isTransientProviderError(new Error('invalid request'))).toBe(false);
  });
});
