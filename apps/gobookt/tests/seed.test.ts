import { describe, expect, it } from 'vitest';
import { CURATED_MOODS } from '@lib/curation/moods';
import { ITALIAN_DESTINATIONS } from '@lib/curation/destinations';
import { lintField } from '@lib/quality/taste-lint';

/**
 * Editorial curation invariants.
 *
 * Pre-H2 this file also lint-checked the mock-italy seed (30 hand-
 * authored stays). Those stays are gone; the curation that stayed -
 * destination metadata + per-destination mood blurbs - is still
 * lint-protected here.
 *
 * New editorial copy is added the same way: write it, run this test,
 * fix the banned-word warnings.
 */

describe('curated editorial content', () => {
  it('every destination has a curated mood', () => {
    for (const dest of ITALIAN_DESTINATIONS) {
      expect(CURATED_MOODS[dest.slug]).toBeDefined();
    }
  });

  it('every curated mood passes banned-word lint', () => {
    const issues = Object.entries(CURATED_MOODS).flatMap(([slug, m]) =>
      lintField(slug, 'mood.text', m.text),
    );
    if (issues.length > 0) {
      throw new Error(
        `mood lint failed:\n${issues.map((i) => `[${i.path}] "${i.word}"`).join('\n')}`,
      );
    }
  });
});

describe('voice lint smoke', () => {
  it('catches an obvious banned word', () => {
    const r = lintField(
      'test',
      'desc',
      'A magical place - your unforgettable journey starts here.',
    );
    expect(r.length).toBeGreaterThanOrEqual(2);
  });

  it('passes restrained editorial copy', () => {
    const r = lintField(
      'test',
      'desc',
      'A working vineyard since the 1100s; six rooms above the cellars.',
    );
    expect(r.length).toBe(0);
  });
});
