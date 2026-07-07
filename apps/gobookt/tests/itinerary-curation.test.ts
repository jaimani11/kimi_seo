import { describe, expect, it } from 'vitest';
import { CURATED_ITINERARIES } from '@/lib/curation/itineraries';
import { ITALIAN_DESTINATIONS } from '@/lib/curation/destinations';
import { containsBannedWord } from '@/lib/curation/voice';
import { ItinerarySchema } from '@core/itinerary';

/**
 * Per-destination invariants enforced for the curated itinerary
 * library. Each entry must:
 *   - parse against ItinerarySchema (after stamping tripId/generatedAt)
 *   - have exactly 3 days
 *   - have ≥4 slots per day
 *   - pass voice lint on every slot.detail + slot.title + summary
 *   - cover all curated destinations from the destinations library
 */

describe('curated itinerary library', () => {
  it('covers every curated Italian destination', () => {
    const destSlugs = ITALIAN_DESTINATIONS.map((d) => d.slug).sort();
    const itinSlugs = Object.keys(CURATED_ITINERARIES).sort();
    expect(itinSlugs).toEqual(destSlugs);
  });

  for (const [slug, template] of Object.entries(CURATED_ITINERARIES)) {
    describe(slug, () => {
      it('parses as a valid Itinerary (after stamping)', () => {
        const stamped = {
          ...template,
          tripId: 'test_trip',
          generatedAt: new Date().toISOString(),
        };
        const result = ItinerarySchema.safeParse(stamped);
        if (!result.success) {
          throw new Error(
            `${slug} failed schema: ${result.error.issues
              .slice(0, 3)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        expect(result.success).toBe(true);
      });

      it('has exactly 3 days', () => {
        expect(template.days).toHaveLength(3);
      });

      it('has at least 4 slots per day', () => {
        for (const day of template.days) {
          expect(day.slots.length).toBeGreaterThanOrEqual(4);
        }
      });

      it('every slot.title + slot.detail + day.theme + summary passes voice lint', () => {
        const fields: { where: string; text: string }[] = [];
        fields.push({ where: 'summary', text: template.summary });
        for (const day of template.days) {
          fields.push({ where: `day-${day.dayNumber}.theme`, text: day.theme });
          for (const slot of day.slots) {
            fields.push({ where: `${slot.id}.title`, text: slot.title });
            fields.push({ where: `${slot.id}.detail`, text: slot.detail });
          }
        }
        const violations = fields.filter((f) => containsBannedWord(f.text));
        if (violations.length > 0) {
          throw new Error(
            `voice lint failed for ${slug}: ${violations
              .slice(0, 3)
              .map((v) => `${v.where} → "${v.text}"`)
              .join('; ')}`,
          );
        }
        expect(violations).toEqual([]);
      });

      it('slot ids are unique within an itinerary', () => {
        const ids = new Set<string>();
        for (const day of template.days) {
          for (const slot of day.slots) {
            expect(ids.has(slot.id)).toBe(false);
            ids.add(slot.id);
          }
        }
      });
    });
  }
});
