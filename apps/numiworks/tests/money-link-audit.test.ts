import { describe, expect, it } from 'vitest';
import {
  GYG_PARTNER_ID,
  buildGygActivityUrl,
  buildGygSearchUrl,
} from '@lib/affiliate/getyourguide';
import { auditBrandLinks } from '@adored/affiliate';

/**
 * Per-deploy money-link integrity guard for numiworks.
 *
 * numiworks is the experiences hub — a MULTI-network brand (Viator +
 * GetYourGuide + Vrbo), so its link-policy is host-only (allowed:
 * getyourguide.com / viator.com / vrbo.com / prf.hn; forbidden: every other
 * provider's host, incl. Expedia + Booking/CJ = the cross-brand leak guard).
 *
 * The build-time-auditable money path here is GetYourGuide: buildGygSearchUrl /
 * buildGygActivityUrl emit the real getyourguide.com deeplinks with a
 * build-time `partner_id` attribution baked in — so this asserts BOTH that
 * every GYG link stays on-network (no Expedia/Booking leak) AND that it carries
 * the partner_id (numiworks would otherwise ship $0-earning untracked GYG
 * links). numiworks' Viator productUrls are minted at runtime from the Viator
 * API, so a Viator-attribution audit is a runtime check (v2), not a build one.
 */

const DESTINATIONS = ['Bangkok, Thailand', 'Rome, Italy', 'Cusco, Peru'];
const ACTIVITY_IDS = ['12345', '67890', 424242];

function sampleMoneyLinks(): string[] {
  return [
    ...DESTINATIONS.map((destination) => buildGygSearchUrl({ destination, source: 'numiworks' })),
    ...ACTIVITY_IDS.map((id) => buildGygActivityUrl(id, { source: 'numiworks' })),
  ];
}

describe('numiworks money-link integrity', () => {
  it('every GetYourGuide builder output stays on-network (no Expedia/Booking leak)', () => {
    const urls = sampleMoneyLinks();
    const report = auditBrandLinks('numiworks', urls);
    expect(report.failures).toEqual([]);
    expect(report.ok).toBe(urls.length);
  });

  it('every GetYourGuide link carries the build-time partner_id attribution', () => {
    // Multi-network policy is host-only, so guard GYG attribution explicitly:
    // partner_id IS in the built URL (unlike Viator runtime / Booking cjevent).
    expect(GYG_PARTNER_ID.length).toBeGreaterThan(0);
    for (const url of sampleMoneyLinks()) {
      expect(url).toContain(`partner_id=${GYG_PARTNER_ID}`);
    }
  });

  it('is a live guard — wrong-partner links (booking.com, expedia.com) are flagged as leaked', () => {
    const report = auditBrandLinks('numiworks', [
      'https://www.booking.com/searchresults.html?ss=Rome',
      'https://www.expedia.com/Hotel-Search?destination=Rome',
    ]);
    expect(report.byCode.leaked).toBe(2);
  });
});
