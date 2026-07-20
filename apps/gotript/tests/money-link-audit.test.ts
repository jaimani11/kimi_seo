import { describe, expect, it } from 'vitest';
import {
  buildExpediaCategoryUrl,
  type ExpediaCategory,
} from '@lib/affiliate/expedia-multicategory';
import { auditBrandLinks } from '@adored/affiliate';

/**
 * Per-deploy money-link integrity guard for gotript.
 *
 * Generates a representative sample of the brand's REAL outbound money-links
 * (the Expedia/VRBO builder for every category × a few destinations) and runs
 * the portfolio link-health audit (`@adored/affiliate` → `@adored/portfolio-
 * revenue`) over them. A leaked, wrong-host, or untracked money-link FAILS the
 * build — the automated catch for the "Paris→Dallas / stays→flights" class of
 * silent revenue bug, running on every CI/deploy via `vitest run`.
 */

const CATEGORIES: ExpediaCategory[] = [
  'hotels',
  'vacation-rentals',
  'flights',
  'cars',
  'packages',
  'attractions',
  'cruises',
];

const DESTINATIONS = ['Rome, Italy', 'Tokyo, Japan', 'New York, USA', 'Cappadocia, Türkiye'];

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

describe('gotript money-link integrity', () => {
  it('every Expedia/VRBO builder output passes the brand link-policy', () => {
    const urls = sampleMoneyLinks();
    const report = auditBrandLinks('gotript', urls);
    // A non-empty failures list means a money-link leaked to the wrong partner
    // or lost its host — block the deploy and show exactly which links broke.
    expect(report.failures).toEqual([]);
    expect(report.total).toBe(urls.length);
    expect(report.ok).toBe(urls.length);
  });

  it('is a live guard — a wrong-partner (booking.com) link is flagged as leaked', () => {
    const report = auditBrandLinks('gotript', [
      'https://www.booking.com/searchresults.html?ss=Rome',
    ]);
    expect(report.failed).toBe(1);
    expect(report.byCode.leaked).toBe(1);
  });
});
