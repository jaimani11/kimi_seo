import { describe, expect, it } from 'vitest';
import {
  buildExpediaCategoryUrl,
  type ExpediaCategory,
} from '@lib/affiliate/expedia-multicategory';
import { auditBrandLinks } from '@adored/affiliate';

/**
 * Per-deploy money-link integrity guard for stayviaowner.
 *
 * stayviaowner is a PURE Partnerize brand (VRBO + Expedia only), so its
 * link-policy asserts the Partnerize `camref` in addition to the host + leak
 * guard — a stronger check than the multi-network brands. Runs the portfolio
 * link-health audit over a representative sample of the brand's real builder
 * output on every CI/deploy via `vitest run`.
 */

const CATEGORIES: ExpediaCategory[] = ['hotels', 'vacation-rentals', 'flights', 'cars', 'packages'];
const DESTINATIONS = ['Santorini, Greece', 'Gatlinburg, TN, USA', 'Bali, Indonesia'];

function sampleMoneyLinks(): string[] {
  return CATEGORIES.flatMap((category) =>
    DESTINATIONS.map((destination) =>
      buildExpediaCategoryUrl(category, {
        destination,
        origin: 'London, UK',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
      }),
    ),
  );
}

describe('stayviaowner money-link integrity', () => {
  it('every VRBO/Expedia builder output passes the brand link-policy (host + camref)', () => {
    const urls = sampleMoneyLinks();
    const report = auditBrandLinks('stayviaowner', urls);
    expect(report.failures).toEqual([]);
    expect(report.ok).toBe(urls.length);
  });

  it('is a live guard — an untracked bare vrbo.com link (no camref) is flagged', () => {
    const report = auditBrandLinks('stayviaowner', [
      'https://www.vrbo.com/search?destination=Santorini',
    ]);
    expect(report.failed).toBe(1);
    expect(report.byCode.untracked).toBe(1);
  });

  it('is a live guard — a wrong-partner (booking.com) link is flagged as leaked', () => {
    const report = auditBrandLinks('stayviaowner', [
      'https://www.booking.com/searchresults.html?ss=Santorini',
    ]);
    expect(report.byCode.leaked).toBe(1);
  });
});
