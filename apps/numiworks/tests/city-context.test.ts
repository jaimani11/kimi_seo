import { describe, expect, it } from 'vitest';
import { SEO_CITIES } from '@lib/seo/cities';
import { buildCityContext } from '@lib/seo/city-context';

/**
 * Guards the thin-content fix: the themed-list + occasion long-tail were
 * ~92–96% token-swap-identical city-to-city (only `city.oneLiner` varied),
 * so Google shelved them as thin/doorway pages. `buildCityContext` injects
 * per-city prose (neighborhoods, guide travel-styles, climate) so the
 * non-inventory text diverges hard. These tests prove that divergence.
 */

function normalize(cityName: string, countryName: string, text: string): string {
  return text
    .replace(new RegExp(cityName, 'gi'), 'CITY')
    .replace(new RegExp(countryName, 'gi'), 'COUNTRY')
    .toLowerCase();
}

/** Jaccard word-set overlap — the same signal Google's near-dup filter uses. */
function similarity(a: string, b: string): number {
  const wa = new Set(a.split(/\W+/).filter(Boolean));
  const wb = new Set(b.split(/\W+/).filter(Boolean));
  const inter = [...wa].filter((w) => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return union === 0 ? 1 : inter / union;
}

const guided = SEO_CITIES.filter((c) => buildCityContext(c, 'honeymoon').tier === 1);

describe('numiworks city-context injection', () => {
  it('most cities reach Tier 1 (a rich DestinationGuide)', () => {
    // ~161/215 have a guide; assert the bulk get high-fidelity injection.
    expect(guided.length).toBeGreaterThan(120);
  });

  it('Tier 1 injects real neighborhoods + multiple sentences + FAQs', () => {
    const c = guided[0]!;
    const ctx = buildCityContext(c, 'honeymoon');
    expect(ctx.tier).toBe(1);
    expect(ctx.neighborhoods.length).toBeGreaterThanOrEqual(2);
    expect(ctx.sentences.length).toBeGreaterThanOrEqual(2);
    expect(ctx.faqs.length).toBeGreaterThanOrEqual(1);
    // sentences actually name the city + its neighborhoods
    const joined = ctx.sentences.join(' ');
    expect(joined).toContain(c.name);
    expect(ctx.neighborhoods.every((n) => joined.includes(n))).toBe(true);
  });

  it('breaks token-swap duplication between two cities (<0.65 normalized similarity)', () => {
    const a = guided[0]!;
    const b = guided[1]!;
    const ca = buildCityContext(a, 'honeymoon');
    const cb = buildCityContext(b, 'honeymoon');
    // the geo-name arrays must not overlap — the core similarity-breaker
    expect(ca.neighborhoods.some((n) => cb.neighborhoods.includes(n))).toBe(false);
    const sim = similarity(
      normalize(a.name, a.countryName, ca.sentences.join(' ')),
      normalize(b.name, b.countryName, cb.sentences.join(' ')),
    );
    expect(sim).toBeLessThan(0.65);
  });

  it('same city, different angle → different travel-style prose', () => {
    const c = guided[0]!;
    const honeymoon = buildCityContext(c, 'honeymoon').sentences.join(' ');
    const family = buildCityContext(c, 'family with-kids').sentences.join(' ');
    expect(honeymoon).not.toEqual(family);
  });

  it('is null-safe for guide-less cities — Tier 2/3, never throws, always city-named', () => {
    const unguided = SEO_CITIES.filter((c) => buildCityContext(c, 'honeymoon').tier !== 1);
    for (const c of unguided.slice(0, 8)) {
      const ctx = buildCityContext(c, 'honeymoon');
      expect([2, 3]).toContain(ctx.tier);
      expect(ctx.sentences.length).toBeGreaterThanOrEqual(1);
      expect(ctx.sentences.join(' ')).toContain(c.name);
    }
  });
});
