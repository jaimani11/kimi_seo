import { describe, expect, it } from 'vitest';
import { SEO_CITIES, SEO_ITINERARY_DAYS } from '@/lib/seo/cities';
import {
  CITIES_WITH_SOCIAL_SAMPLE,
  cityContentStatus,
  contentSummary,
} from '@/lib/seo/content-status';
import { hasDestinationGuide } from '@/lib/seo/destination-content';

describe('cityContentStatus', () => {
  it('produces a status for every SEO city', () => {
    for (const c of SEO_CITIES) {
      const s = cityContentStatus(c);
      expect(s.city.slug).toBe(c.slug);
    }
  });

  it('hasGuide tracks hasDestinationGuide', () => {
    for (const c of SEO_CITIES) {
      const s = cityContentStatus(c);
      expect(s.hasGuide).toBe(hasDestinationGuide(c.slug));
    }
  });

  it('reports the correct SEO URL count per city (1 + 3 + 1 + N)', () => {
    const expected = 1 + 3 + 1 + SEO_ITINERARY_DAYS.length;
    for (const c of SEO_CITIES) {
      expect(cityContentStatus(c).totalSeoUrls).toBe(expected);
    }
  });

  it('flags exactly the cities listed in CITIES_WITH_SOCIAL_SAMPLE', () => {
    for (const c of SEO_CITIES) {
      const s = cityContentStatus(c);
      expect(s.hasSocialSample).toBe(CITIES_WITH_SOCIAL_SAMPLE.has(c.slug));
    }
  });
});

describe('contentSummary', () => {
  it('counts cities consistently with the per-city status', () => {
    const summary = contentSummary();
    expect(summary.totalCities).toBe(SEO_CITIES.length);

    const expectedGuided = SEO_CITIES.filter((c) => hasDestinationGuide(c.slug)).length;
    expect(summary.citiesWithGuide).toBe(expectedGuided);

    const expectedSampled = SEO_CITIES.filter((c) => CITIES_WITH_SOCIAL_SAMPLE.has(c.slug)).length;
    expect(summary.citiesWithSample).toBe(expectedSampled);
  });

  it('totalSeoUrls is cities × (1 + 3 + 1 + days)', () => {
    const summary = contentSummary();
    const perCity = 1 + 3 + 1 + SEO_ITINERARY_DAYS.length;
    expect(summary.totalSeoUrls).toBe(SEO_CITIES.length * perCity);
  });

  it('totalSocialItems is cities × 40', () => {
    expect(contentSummary().totalSocialItems).toBe(SEO_CITIES.length * 40);
  });
});
