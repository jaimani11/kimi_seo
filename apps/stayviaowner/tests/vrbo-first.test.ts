import { describe, expect, it } from 'vitest';
import { META, type VerticalKind } from '@/features/seo/vertical-landing-page';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import {
  buildViatorStaySearchUrl,
  getViatorStayLinkConfig,
} from '@lib/affiliate/viator-stay-link-builder';
import { enumerateAllSeoSlugs, parseSeoSlug } from '@lib/seo/route-parser';
import { SEO_CITIES } from '@lib/seo/cities';

/**
 * Regression guard for the stayviaowner Vrbo-first reposition: the nine
 * hotel-themed programmatic families were converted from Expedia-led hotel
 * pages to Vrbo-led vacation-rental pages. These tests prove no retained page
 * says "Powered by Expedia" or routes to Expedia hotel inventory, and that the
 * hub-dup (`hotels-in`) is redirected rather than duplicated.
 */

const HOTEL_KINDS: VerticalKind[] = [
  'hotels-in',
  'best-hotels',
  'cheap-hotels',
  'luxury-hotels',
  'family-hotels',
  'boutique-hotels',
  'pet-friendly-hotels',
  'beach-hotels',
  'apartments',
];

const ATTRACTION_KINDS: VerticalKind[] = ['top-attractions', 'free-things', 'museums', 'tours'];

const city = SEO_CITIES[0]!;

function renderedCopy(kind: VerticalKind): string {
  const m = META[kind];
  return [
    m.crumb,
    m.heading(city),
    m.eyebrow(city),
    m.intro(city),
    m.ctaLabel(city),
    ...m.bullets(city),
  ].join(' · ');
}

describe('stayviaowner hotel-themed pages are Vrbo-first', () => {
  it('every hotel-themed kind builds its CTA from the vacation-rentals (Vrbo) category', () => {
    for (const kind of HOTEL_KINDS) {
      expect(META[kind].category).toBe('vacation-rentals');
    }
  });

  it('the vacation-rentals CTA resolves to vrbo.com — never expedia.com hotel inventory', () => {
    const url = buildExpediaCategoryUrl('vacation-rentals', { destination: 'Paris, France' });
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('vrbo.com/search');
    expect(url.toLowerCase()).not.toContain('expedia.com');
  });

  it('no retained hotel-themed page copy contains "Expedia" or "Powered by Expedia"', () => {
    for (const kind of HOTEL_KINDS) {
      const copy = renderedCopy(kind);
      expect(copy, `${kind} copy still mentions Expedia`).not.toMatch(/Expedia/i);
    }
  });

  it('every hotel-themed heading leads with rentals, not hotels', () => {
    // hotels-in redirects, but its (defensive) heading is still rental-led.
    for (const kind of HOTEL_KINDS) {
      expect(META[kind].heading(city).toLowerCase()).toMatch(/rental|villa|home|apartment|beach house/);
    }
  });

  it('generic hotels-in is redirected: parseable (so [slug] can 308 it) but out of the sitemap', () => {
    const slug = `hotels-in-${city.slug}`;
    expect(parseSeoSlug(slug)?.kind).toBe('hotels-in');
    expect(enumerateAllSeoSlugs()).not.toContain(slug);
  });

  it('retired flights/cars/cruise kinds 404 (parse to null) and never enter the sitemap', () => {
    expect(parseSeoSlug(`flights-to-${city.slug}`)).toBeNull();
    expect(parseSeoSlug(`cars-in-${city.slug}`)).toBeNull();
    const all = enumerateAllSeoSlugs();
    expect(
      all.some(
        (s) =>
          s.startsWith('flights-to-') ||
          s.startsWith('cars-in-') ||
          s.startsWith('cruise') ||
          s.includes('-flights-') ||
          s.includes('-cars-'),
      ),
    ).toBe(false);
  });

  it('the 8 themed hotel families are reworked in place — still generated + in the sitemap', () => {
    const all = enumerateAllSeoSlugs();
    for (const marker of ['best-hotels', 'luxury-hotels', 'family-hotels', 'pet-friendly-hotels']) {
      expect(all.some((s) => s.includes(marker)), `${marker} slugs missing from sitemap`).toBe(true);
    }
  });

  it('attractions-themed pages route to Viator (experiences), never Expedia', () => {
    const url = buildViatorStaySearchUrl({ destination: 'Paris tours' }, getViatorStayLinkConfig());
    expect(url).toContain('viator.com');
    expect(url.toLowerCase()).not.toContain('expedia.com');
    for (const kind of ATTRACTION_KINDS) {
      expect(META[kind].category, `${kind} should stay category:attractions (render routes to Viator)`).toBe(
        'attractions',
      );
    }
  });

  it('no attractions-themed page copy contains "Expedia"', () => {
    for (const kind of ATTRACTION_KINDS) {
      expect(renderedCopy(kind), `${kind} copy still mentions Expedia`).not.toMatch(/Expedia/i);
    }
  });
});
