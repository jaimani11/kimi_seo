import { describe, expect, it } from 'vitest';
import {
  CitySocialPackSchema,
  PinterestPinSchema,
  ShortFormVideoScriptSchema,
} from '@/lib/social/types';
import { clamp } from '@adored/marketing';
import { buildSocialPackFromTemplate } from '@/lib/social/template-generator';
import { TOKYO_SAMPLE_PACK } from '@/lib/social/samples/tokyo';
import { SEO_CITIES, findCityBySlug, type SeoCity } from '@/lib/seo/cities';

describe('TOKYO_SAMPLE_PACK', () => {
  it('parses against CitySocialPackSchema', () => {
    const parsed = CitySocialPackSchema.safeParse(TOKYO_SAMPLE_PACK);
    if (!parsed.success) console.error(parsed.error.issues.slice(0, 5));
    expect(parsed.success).toBe(true);
  });

  it('contains exactly 10 items per platform', () => {
    expect(TOKYO_SAMPLE_PACK.pinterest).toHaveLength(10);
    expect(TOKYO_SAMPLE_PACK.tiktok).toHaveLength(10);
    expect(TOKYO_SAMPLE_PACK.reels).toHaveLength(10);
    expect(TOKYO_SAMPLE_PACK.shorts).toHaveLength(10);
  });

  it('every CTA mentions gobookt (per the brief)', () => {
    for (const p of TOKYO_SAMPLE_PACK.pinterest) {
      expect(p.cta.toLowerCase()).toContain('gobookt');
    }
    for (const s of [
      ...TOKYO_SAMPLE_PACK.tiktok,
      ...TOKYO_SAMPLE_PACK.reels,
      ...TOKYO_SAMPLE_PACK.shorts,
    ]) {
      expect(s.cta.toLowerCase()).toContain('gobookt');
    }
  });

  it('every video script is 15–30 seconds (per the brief)', () => {
    for (const s of [
      ...TOKYO_SAMPLE_PACK.tiktok,
      ...TOKYO_SAMPLE_PACK.reels,
      ...TOKYO_SAMPLE_PACK.shorts,
    ]) {
      expect(s.durationSec).toBeGreaterThanOrEqual(15);
      expect(s.durationSec).toBeLessThanOrEqual(30);
    }
  });

  it('every script has the correct platform tag', () => {
    for (const s of TOKYO_SAMPLE_PACK.tiktok) expect(s.platform).toBe('tiktok');
    for (const s of TOKYO_SAMPLE_PACK.reels) expect(s.platform).toBe('instagram-reels');
    for (const s of TOKYO_SAMPLE_PACK.shorts) expect(s.platform).toBe('youtube-shorts');
  });
});

describe('Template generator fallback', () => {
  it('produces a parseable pack for every SEO city', () => {
    for (const c of SEO_CITIES) {
      const pack = buildSocialPackFromTemplate(c);
      const parsed = CitySocialPackSchema.safeParse(pack);
      if (!parsed.success) {
        console.error(`city=${c.slug} issues:`, parsed.error.issues.slice(0, 3));
      }
      expect(parsed.success).toBe(true);
    }
  });

  it('produces 10 items per platform regardless of guide presence', () => {
    for (const c of SEO_CITIES) {
      const pack = buildSocialPackFromTemplate(c);
      expect(pack.pinterest).toHaveLength(10);
      expect(pack.tiktok).toHaveLength(10);
      expect(pack.reels).toHaveLength(10);
      expect(pack.shorts).toHaveLength(10);
    }
  });

  it('every CTA mentions gobookt', () => {
    const city = findCityBySlug('paris')!;
    const pack = buildSocialPackFromTemplate(city);
    for (const p of pack.pinterest) expect(p.cta.toLowerCase()).toContain('gobookt');
    for (const s of [...pack.tiktok, ...pack.reels, ...pack.shorts]) {
      expect(s.cta.toLowerCase()).toContain('gobookt');
    }
  });

  it('every script is in the 15–30s window', () => {
    const city = findCityBySlug('cape-town')!;
    const pack = buildSocialPackFromTemplate(city);
    for (const s of [...pack.tiktok, ...pack.reels, ...pack.shorts]) {
      expect(s.durationSec).toBeGreaterThanOrEqual(15);
      expect(s.durationSec).toBeLessThanOrEqual(30);
    }
  });
});

describe('Schema invariants', () => {
  it('rejects a Pinterest pin with an over-long title', () => {
    const ok = PinterestPinSchema.safeParse({
      platform: 'pinterest',
      title: 'x'.repeat(150),
      description: 'A reasonable description that easily meets the minimum length requirement.',
      visualConcept: 'A reasonable visual concept that easily meets the minimum length requirement.',
      hashtags: ['#a', '#b', '#c'],
      cta: 'Plan on gobookt.com',
    });
    expect(ok.success).toBe(false);
  });

  it('rejects a hashtag missing #', () => {
    const ok = PinterestPinSchema.safeParse({
      platform: 'pinterest',
      title: 'A perfectly fine pin title',
      description: 'A perfectly fine description that meets the minimum length easily.',
      visualConcept: 'A perfectly fine visual concept that meets the minimum length easily.',
      hashtags: ['nohash', '#good'],
      cta: 'Plan on gobookt.com',
    });
    expect(ok.success).toBe(false);
  });

  it('rejects a video script outside 15–30s', () => {
    const ok = ShortFormVideoScriptSchema.safeParse({
      platform: 'tiktok',
      hook: 'A perfectly fine hook',
      scenes: [
        {
          visual: 'A perfectly fine visual',
          text: 'overlay',
          voiceover: 'A perfectly fine voiceover line.',
        },
        {
          visual: 'A perfectly fine visual',
          text: 'overlay',
          voiceover: 'A perfectly fine voiceover line.',
        },
        {
          visual: 'A perfectly fine visual',
          text: 'overlay',
          voiceover: 'A perfectly fine voiceover line.',
        },
      ],
      cta: 'Plan on gobookt.com',
      durationSec: 60,
      musicCue: 'lo-fi',
      hashtags: ['#a', '#b', '#c', '#d', '#e'],
    });
    expect(ok.success).toBe(false);
  });
});

describe('caption length clamp', () => {
  it('leaves a caption exactly at the limit unchanged', () => {
    const s = 'x'.repeat(220);
    expect(clamp(s, 220)).toBe(s);
    expect(clamp(s, 220).length).toBe(220);
  });

  it('clamps an over-limit caption to <= the limit, ending with an ellipsis', () => {
    const out = clamp('word '.repeat(80), 220); // 400 chars
    expect(out.length).toBeLessThanOrEqual(220);
    expect(out.endsWith('…')).toBe(true);
  });

  it('does not cut a word in half when a boundary is available', () => {
    const out = clamp('alpha '.repeat(60), 220);
    expect(out.replace(/…$/u, '').trimEnd().endsWith('alpha')).toBe(true);
  });

  it('never leaves a broken surrogate pair when an emoji straddles the cut', () => {
    const out = clamp('a'.repeat(216) + '😀😀😀😀', 220);
    expect(out.length).toBeLessThanOrEqual(220);
    // No lone high/low surrogate in the result.
    expect(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(out),
    ).toBe(false);
  });
});

describe('Template generator — long names + brand-safe CTAs', () => {
  it('produces a schema-valid pack for New Orleans (the long-name regression)', () => {
    const city = findCityBySlug('new-orleans')!;
    expect(CitySocialPackSchema.safeParse(buildSocialPackFromTemplate(city)).success).toBe(true);
  });

  it('produces a schema-valid pack for a very long destination name + blurb', () => {
    const city = {
      slug: 'a-very-long-synthetic-destination',
      name: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
      countryName: 'United Kingdom of Great Britain and Northern Ireland',
      countryCode: 'GB',
      region: 'Europe',
      coordinates: { lat: 53.2, lng: -4.2 },
      oneLiner: 'An extraordinarily long one-liner that keeps going and going. '.repeat(12),
      viatorQuery: 'x',
    } as unknown as SeoCity;
    const parsed = CitySocialPackSchema.safeParse(buildSocialPackFromTemplate(city));
    if (!parsed.success) console.error(parsed.error.issues.slice(0, 4));
    expect(parsed.success).toBe(true);
  });

  it('emits no Viator / AI-planner CTA (gobookt is a Booking.com stays brand)', () => {
    const pack = buildSocialPackFromTemplate(findCityBySlug('paris')!);
    const ctas = [
      ...pack.pinterest.map((p) => p.cta),
      ...pack.tiktok.map((s) => s.cta),
      ...pack.reels.map((s) => s.cta),
      ...pack.shorts.map((s) => s.cta),
    ];
    for (const cta of ctas) {
      expect(cta.toLowerCase()).not.toContain('viator');
      expect(cta.toLowerCase()).not.toContain('ai trip planner');
    }
  });
});
