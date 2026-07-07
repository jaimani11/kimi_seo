import { describe, expect, it } from 'vitest';
import { ITALIAN_DESTINATIONS, findDestinationBySlugOrAlias } from '@/lib/curation/destinations';
import { CURATED_MOODS } from '@/lib/curation/moods';
import { containsBannedWord } from '@/lib/curation/voice';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';

/**
 * Per-destination invariants enforced for `/destinations/[slug]` to
 * render meaningfully. Each curated entry must:
 *   - have a Fraunces-italic headline + oneLiner that pass the voice lint
 *   - resolve via findDestinationBySlugOrAlias
 *   - have a curated mood snapshot
 *   - have a resolvable hero photo via `resolveDestinationPhoto`
 *
 * Slice H2 removed the stays-per-destination requirement - destination
 * pages now show a live "Things to do" rail (Viator) plus an Expedia
 * search CTA instead of fake stay cards. The hero photo comes from
 * the curated destination-photo lib instead of the mock provider.
 *
 * Adding a destination later means satisfying these invariants - the
 * test is the contract.
 */

describe('destination page data', () => {
  for (const d of ITALIAN_DESTINATIONS) {
    describe(d.slug, () => {
      it('headline + oneLiner pass voice lint (no banned words)', () => {
        expect(containsBannedWord(d.headline)).toBe(false);
        expect(containsBannedWord(d.oneLiner)).toBe(false);
      });

      it('headline is short and oneLiner is single-sentence-ish', () => {
        // Headlines are fragments - fewer than 10 words.
        expect(d.headline.split(/\s+/).length).toBeLessThanOrEqual(10);
        // OneLiners are single sentences - ≤30 words to keep it tight.
        expect(d.oneLiner.split(/\s+/).length).toBeLessThanOrEqual(30);
      });

      it('resolves via findDestinationBySlugOrAlias', () => {
        const resolved = findDestinationBySlugOrAlias(d.slug);
        expect(resolved?.slug).toBe(d.slug);
      });

      it('has a curated MoodSnapshot', () => {
        const mood = CURATED_MOODS[d.slug];
        expect(mood).toBeDefined();
        expect(mood?.destinationName).toBeTruthy();
      });

      it('resolves to a hero photo via resolveDestinationPhoto', () => {
        const photo = resolveDestinationPhoto({
          name: d.name,
          country: 'IT',
          region: d.region,
        });
        expect(photo.url).toMatch(/^https:\/\/images\.unsplash\.com\//);
        expect(photo.alt.length).toBeGreaterThan(0);
      });
    });
  }
});
