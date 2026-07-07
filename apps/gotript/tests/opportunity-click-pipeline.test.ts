import { describe, expect, it } from 'vitest';
import { encodeAffiliateLink, decodeAffiliateLink } from '@/lib/affiliate/link-encoder';
import { isAllowedAffiliateHost } from '@/lib/affiliate/allowlist';
import { InMemorySessionStore } from '@lib/session';

/**
 * Slice F1 - SearchOpportunityCard click pipeline.
 *
 * Each opportunity card renders `/r/<encoded-id>` as its href. This
 * test pins the contract end-to-end so the F1 path can't silently
 * regress to "card looks fine, click goes nowhere":
 *
 *   1. The host allowlist accepts all three providers (Expedia, Vrbo,
 *      Hotels.com) - without this, `/r/[id]` would 404.
 *   2. The payload round-trips through encode + decode.
 *   3. `recordClick` writes a row keyed on the providerId we encoded,
 *      so `expedia` / `vrbo` / `hotels-com` show up in `/admin/clicks`
 *      distinct from the curated `mock-italy` clicks.
 */

const SAMPLE_URLS = {
  expedia:
    'https://www.expedia.com/Hotel-Search?destination=Austria&startDate=2026-06-10&endDate=2026-06-16&rooms=1&adults=6&siteid=1&affcid=demo&_src=stayscout',
  vrbo: 'https://www.vrbo.com/search?q=Vancouver&checkin=2026-06-10&checkout=2026-06-13&adults=2&affiliateId=demo&_src=stayscout',
  'hotels-com':
    'https://www.hotels.com/Hotel-Search?q-destination=Vancouver&q-check-in=2026-06-10&q-check-out=2026-06-13&q-rooms=1&q-room-0-adults=2&rffrid=demo&_src=stayscout',
} as const;

describe('F1 click pipeline (encode → decode → recordClick)', () => {
  it.each(Object.entries(SAMPLE_URLS))(
    'persists a click row with providerId=%s when an opportunity card is followed',
    async (providerId, url) => {
      expect(isAllowedAffiliateHost(url)).toBe(true);

      const id = encodeAffiliateLink({
        url,
        providerId,
        stayId: 'opportunity',
        turnId: 'turn-test',
      });
      const decoded = decodeAffiliateLink(id);
      expect(decoded?.url).toBe(url);
      expect(decoded?.providerId).toBe(providerId);

      const store = new InMemorySessionStore();
      await store.recordClick({
        ownerKind: 'session',
        ownerId: 'sess-test',
        sessionId: 'sess-test',
        stayId: decoded!.stayId ?? `${providerId}:unknown`,
        providerId: decoded!.providerId,
        affiliateUrl: decoded!.url,
        ...(decoded!.turnId ? { turnId: decoded!.turnId } : {}),
      });

      const clicks = await store.listClicks({ limit: 10 });
      expect(clicks).toHaveLength(1);
      expect(clicks[0]?.providerId).toBe(providerId);
      expect(clicks[0]?.affiliateUrl).toBe(url);
      expect(clicks[0]?.turnId).toBe('turn-test');
    },
  );
});
