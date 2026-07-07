import { describe, expect, it } from 'vitest';
import {
  CitySocialPackSchema,
  PinterestPinSchema,
  ShortFormVideoScriptSchema,
} from '@/lib/social/types';
import { buildSocialPackFromTemplate } from '@/lib/social/template-generator';
import { TOKYO_SAMPLE_PACK } from '@/lib/social/samples/tokyo';
import { SEO_CITIES, findCityBySlug } from '@/lib/seo/cities';

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

  it('every CTA mentions gotript (per the brief)', () => {
    for (const p of TOKYO_SAMPLE_PACK.pinterest) {
      expect(p.cta.toLowerCase()).toContain('gotript');
    }
    for (const s of [
      ...TOKYO_SAMPLE_PACK.tiktok,
      ...TOKYO_SAMPLE_PACK.reels,
      ...TOKYO_SAMPLE_PACK.shorts,
    ]) {
      expect(s.cta.toLowerCase()).toContain('gotript');
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

  it('every CTA mentions gotript', () => {
    const city = findCityBySlug('paris')!;
    const pack = buildSocialPackFromTemplate(city);
    for (const p of pack.pinterest) expect(p.cta.toLowerCase()).toContain('gotript');
    for (const s of [...pack.tiktok, ...pack.reels, ...pack.shorts]) {
      expect(s.cta.toLowerCase()).toContain('gotript');
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
      cta: 'Plan on gotript.com',
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
      cta: 'Plan on gotript.com',
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
      cta: 'Plan on gotript.com',
      durationSec: 60,
      musicCue: 'lo-fi',
      hashtags: ['#a', '#b', '#c', '#d', '#e'],
    });
    expect(ok.success).toBe(false);
  });
});
