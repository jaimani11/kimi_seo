import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  affiliateDisclosure,
  getBrandingMode,
  partnerAriaLabel,
  partnerCardHint,
  partnerCardLabel,
  partnerCtaLabel,
  partnerDisplayName,
  partnerPoweredBy,
  partnerProvenanceLine,
  partnerProvenancePhrase,
} from '@lib/branding/provider-branding';

/**
 * Behavioral contract for the provider-branding presentation layer.
 *
 * - Default mode is `neutral` (brand-safe while Booking.com partnership
 *   review is in progress).
 * - `NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE` flips between modes.
 * - In `neutral` and `hidden` modes, no helper ever returns a string
 *   containing a competitor brand name (Expedia / Vrbo / Hotels.com /
 *   Viator / Airbnb / Booking.com / Hotelbeds / GetYourGuide).
 * - In `explicit` mode, brand names DO appear so we can flip them back
 *   on with one env toggle once the review completes.
 */

const COMPETITOR_BRAND_PATTERN = /\b(Expedia|Vrbo|Hotels\.com|Viator|Airbnb|Booking\.com|Hotelbeds|GetYourGuide)\b/i;
const PROVIDER_IDS = ['expedia', 'vrbo', 'hotels-com', 'booking-com', 'viator'] as const;

function clearMode() {
  delete process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE;
}

function setMode(mode: 'hidden' | 'neutral' | 'explicit' | string) {
  process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE = mode;
}

describe('getBrandingMode', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE;
    clearMode();
  });
  afterEach(() => {
    if (saved === undefined) clearMode();
    else process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE = saved;
  });

  it('defaults to explicit when unset (Viator-affiliate positioning)', () => {
    expect(getBrandingMode()).toBe('explicit');
  });

  it('reads neutral / hidden / explicit when set', () => {
    setMode('neutral');
    expect(getBrandingMode()).toBe('neutral');
    setMode('hidden');
    expect(getBrandingMode()).toBe('hidden');
    setMode('explicit');
    expect(getBrandingMode()).toBe('explicit');
  });

  it('falls back to the default mode on unknown values', () => {
    setMode('garbage');
    expect(getBrandingMode()).toBe('explicit');
    setMode('');
    expect(getBrandingMode()).toBe('explicit');
  });

  it('is case-insensitive', () => {
    setMode('EXPLICIT');
    expect(getBrandingMode()).toBe('explicit');
  });
});

describe('neutral mode (default) - no competitor brand names anywhere', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE;
    setMode('neutral');
  });
  afterEach(() => {
    if (saved === undefined) clearMode();
    else process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE = saved;
  });

  for (const id of PROVIDER_IDS) {
    describe(`provider id "${id}"`, () => {
      it('partnerDisplayName returns "our partner"', () => {
        expect(partnerDisplayName(id)).toBe('our partner');
      });

      it('partnerCtaLabel never names the brand', () => {
        for (const kind of ['find-dates', 'reserve', 'view-stay', 'check-availability', 'book-stay'] as const) {
          const label = partnerCtaLabel(id, kind);
          expect(label, `cta ${kind}/${id}`).not.toMatch(COMPETITOR_BRAND_PATTERN);
        }
      });

      it('partnerProvenanceLine never names the brand', () => {
        expect(partnerProvenanceLine(id)).not.toMatch(COMPETITOR_BRAND_PATTERN);
      });

      it('partnerProvenancePhrase never names the brand', () => {
        expect(partnerProvenancePhrase(id)).not.toMatch(COMPETITOR_BRAND_PATTERN);
      });

      it('partnerAriaLabel never names the brand', () => {
        expect(partnerAriaLabel(id, 'sample item')).not.toMatch(COMPETITOR_BRAND_PATTERN);
      });

      it('affiliateDisclosure never names the brand', () => {
        expect(affiliateDisclosure(id)).not.toMatch(COMPETITOR_BRAND_PATTERN);
      });

      it('partnerPoweredBy never names the brand', () => {
        expect(partnerPoweredBy(id)).not.toMatch(COMPETITOR_BRAND_PATTERN);
      });

      it('partnerCardLabel never names the brand', () => {
        expect(partnerCardLabel(id)).not.toMatch(COMPETITOR_BRAND_PATTERN);
      });

      it('partnerCardHint never names the brand', () => {
        // Pass a brand-laden fallback to confirm the helper actively
        // strips it instead of leaking the explicit hint through.
        const result = partnerCardHint(id, 'Hotels.com - Expedia Group sibling; loyalty rewards.');
        expect(result).not.toMatch(COMPETITOR_BRAND_PATTERN);
      });
    });
  }

  it('partnerCtaLabel returns the right neutral verb', () => {
    expect(partnerCtaLabel('expedia', 'find-dates')).toBe('Find dates →');
    expect(partnerCtaLabel('viator', 'reserve')).toBe('Reserve →');
    expect(partnerCtaLabel('expedia', 'view-stay')).toBe('View stay →');
    expect(partnerCtaLabel('expedia', 'check-availability')).toBe('Check availability →');
    expect(partnerCtaLabel('expedia', 'book-stay')).toBe('Book stay →');
  });

  it('arrow:false strips the directional arrow', () => {
    expect(partnerCtaLabel('expedia', 'find-dates', { arrow: false })).toBe('Find dates');
  });
});

describe('hidden mode - even quieter than neutral', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE;
    setMode('hidden');
  });
  afterEach(() => {
    if (saved === undefined) clearMode();
    else process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE = saved;
  });

  it('partnerDisplayName returns empty string', () => {
    expect(partnerDisplayName('expedia')).toBe('');
  });

  it('partnerProvenanceLine omits the noun entirely', () => {
    expect(partnerProvenanceLine('viator')).toBe('Live availability. Refreshed continuously.');
  });

  for (const id of PROVIDER_IDS) {
    it(`no helper output for "${id}" leaks any competitor brand`, () => {
      const outputs = [
        partnerDisplayName(id),
        partnerCtaLabel(id, 'find-dates'),
        partnerCtaLabel(id, 'reserve'),
        partnerProvenanceLine(id),
        partnerProvenancePhrase(id),
        partnerAriaLabel(id, 'sample item'),
        affiliateDisclosure(id),
        partnerPoweredBy(id),
        partnerCardLabel(id),
        partnerCardHint(id, 'Hotels.com loyalty rewards via Expedia Group.'),
      ];
      for (const o of outputs) {
        expect(o).not.toMatch(COMPETITOR_BRAND_PATTERN);
      }
    });
  }
});

describe('explicit mode - brand names CAN appear', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE;
    setMode('explicit');
  });
  afterEach(() => {
    if (saved === undefined) clearMode();
    else process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE = saved;
  });

  it('partnerDisplayName returns the brand', () => {
    expect(partnerDisplayName('expedia')).toBe('Expedia');
    expect(partnerDisplayName('viator')).toBe('Viator');
    expect(partnerDisplayName('vrbo')).toBe('Vrbo');
  });

  it('partnerCtaLabel weaves the brand into the CTA', () => {
    expect(partnerCtaLabel('expedia', 'find-dates')).toBe('Find dates on Expedia →');
    expect(partnerCtaLabel('viator', 'reserve')).toBe('Reserve on Viator →');
  });

  it('partnerProvenanceLine names the brand', () => {
    expect(partnerProvenanceLine('viator')).toBe(
      'Live availability through Viator. Refreshed continuously.',
    );
  });

  it('partnerPoweredBy names the brand', () => {
    expect(partnerPoweredBy('expedia')).toBe('Powered by Expedia');
  });

  it('partnerCardLabel returns the brand for opportunity cards', () => {
    expect(partnerCardLabel('expedia')).toBe('Expedia');
    expect(partnerCardLabel('vrbo')).toBe('Vrbo');
    expect(partnerCardLabel('hotels-com')).toBe('Hotels.com');
  });

  it('affiliateDisclosure names the brand', () => {
    expect(affiliateDisclosure('expedia')).toContain('Expedia');
  });
});

describe('per-call mode override', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE;
    setMode('neutral');
  });
  afterEach(() => {
    if (saved === undefined) clearMode();
    else process.env.NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE = saved;
  });

  it('explicit override returns branded label even when env says neutral', () => {
    expect(partnerCtaLabel('expedia', 'find-dates', { mode: 'explicit' })).toBe(
      'Find dates on Expedia →',
    );
  });

  it('hidden override returns the hidden form even when env says neutral', () => {
    expect(partnerDisplayName('expedia', 'hidden')).toBe('');
  });
});
