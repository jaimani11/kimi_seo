import { describe, expect, it } from 'vitest';
import { planDayThemes, themeLabel, themeRationale } from '@/lib/plan/themes';

describe('planDayThemes', () => {
  it('always starts with arrival', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      const themes = planDayThemes(n, []);
      expect(themes[0]).toBe('arrival');
    }
  });

  it('ends with farewell for trips of 2+ nights', () => {
    for (const n of [2, 3, 4, 5, 6, 7]) {
      const themes = planDayThemes(n, []);
      expect(themes[themes.length - 1]).toBe('farewell');
    }
  });

  it('introduces food-and-wine for 3+ night trips', () => {
    const themes = planDayThemes(3, []);
    expect(themes).toContain('food-and-wine');
  });

  it('introduces a day trip for 5+ night trips', () => {
    const themes = planDayThemes(5, []);
    expect(themes).toContain('day-trip');
  });

  it('promotes adventure earlier when vibe includes adventure', () => {
    const baseline = planDayThemes(4, []);
    const adventure = planDayThemes(4, ['adventure']);
    // Both should include adventure somewhere, but the adventure
    // vibe should land it on day 2 (index 1) specifically.
    expect(adventure[1]).toBe('adventure');
    // Baseline doesn't necessarily put adventure at index 1.
    expect(baseline[1]).not.toBe('adventure');
  });

  it('softens adventure to culture for family trips', () => {
    const family = planDayThemes(4, ['family']);
    expect(family).not.toContain('adventure');
  });
});

describe('themeLabel + themeRationale', () => {
  it('returns a destination-flavored label', () => {
    expect(themeLabel('arrival', 'Rome')).toContain('Rome');
    expect(themeLabel('food-and-wine', 'Tokyo')).toContain('Tokyo');
  });

  it('returns a rationale for arrival and farewell days', () => {
    expect(themeRationale('arrival', 'first')).toMatch(/light/i);
    expect(themeRationale('farewell', 'last')).toMatch(/loose ends/i);
  });

  it('returns no rationale for a generic culture day', () => {
    expect(themeRationale('culture-and-history', 'middle')).toBeUndefined();
  });
});
