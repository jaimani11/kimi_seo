import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_AFFILIATE_IDS,
  findForeignAffiliateMarker,
  isNumiworksAffiliateSafe,
} from '@/lib/affiliate/numiworks-guard';
import { encodeAffiliateLink, decodeAffiliateLink } from '@/lib/affiliate/link-encoder';

describe('numiworks cross-brand affiliate guard', () => {
  it('flags each forbidden sibling/off-strategy id in a CJ-style url', () => {
    expect(findForeignAffiliateMarker('https://www.anrdoezrs.net/click-101803878-17293132')).toBe('101803878'); // gobookt
    expect(findForeignAffiliateMarker('https://www.anrdoezrs.net/click-101803920-17293132')).toBe('101803920'); // gotript
    expect(findForeignAffiliateMarker('https://www.kqzyfj.com/click-101827399-17293132')).toBe('101827399'); // numiworks Booking.com (off-strategy)
  });

  it('passes clean numiworks-owned outbound urls', () => {
    // Real Viator product url (partner pid baked server-side by Viator)
    expect(isNumiworksAffiliateSafe('https://www.viator.com/tours/Rome/Cooking-Class/d511-12345P7')).toBe(true);
    // Viator destination search with a numiworks partner id
    expect(
      isNumiworksAffiliateSafe(
        'https://www.viator.com/searchResults/all?text=cooking+class+Rome&pid=P00012345&mcid=numiworks-stay',
      ),
    ).toBe(true);
    // VRBO via the numiworks Partnerize camref
    expect(
      isNumiworksAffiliateSafe(
        'https://prf.hn/click/camref:1110lFruB/destination:https%3A%2F%2Fwww.vrbo.com%2Fsearch%3Fdestination%3DRome',
      ),
    ).toBe(true);
  });

  it('does not false-positive on a longer number that merely contains a forbidden id', () => {
    // forbidden id flanked by digits on either side must NOT match
    expect(findForeignAffiliateMarker('https://www.viator.com/x?ts=91018038780')).toBeNull();
    expect(findForeignAffiliateMarker('https://www.viator.com/x?ts=1018039201')).toBeNull();
  });

  it('treats each forbidden id as an exact 9-digit numeric marker', () => {
    for (const id of FORBIDDEN_AFFILIATE_IDS) expect(id).toMatch(/^\d{9}$/);
  });

  it('the outbound decoder rejects a tampered payload carrying a forbidden id (even on an allowlisted host)', () => {
    // anrdoezrs.net IS allowlisted (for gobookt's CJ links) — only the guard stops this.
    const id = encodeAffiliateLink({
      url: 'https://www.anrdoezrs.net/click-101803878-17293132',
      providerId: 'booking',
    });
    expect(decodeAffiliateLink(id)).toBeNull();
  });

  it('the outbound decoder still accepts a clean numiworks Viator link', () => {
    const url = 'https://www.viator.com/tours/Rome/Cooking-Class/d511-12345P7';
    const id = encodeAffiliateLink({ url, providerId: 'viator' });
    expect(decodeAffiliateLink(id)?.url).toBe(url);
  });
});
