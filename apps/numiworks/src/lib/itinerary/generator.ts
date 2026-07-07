import type { Itinerary, ItinerarySlot } from '@core/itinerary';
import type { SavedTrip } from '@lib/session/session-store';
import { findDestinationBySlugOrAlias } from '@lib/curation/destinations';
import { CURATED_ITINERARIES, type CuratedItineraryTemplate } from '@lib/curation/itineraries';

/**
 * ItineraryGenerator - produces a 3-day plan for a saved trip.
 *
 * Two implementations:
 *   - `CuratedItineraryGenerator` (this file, default): looks up the
 *     destination's hand-authored template and stamps it with the
 *     trip's id + a generation timestamp. Falls through to
 *     `SynthesizedItineraryGenerator` for non-curated destinations.
 *   - `ModelItineraryGenerator` (C3.x): live model + activity-provider
 *     context. Same interface, drop-in.
 */

export interface ItineraryGenerator {
  generate(trip: SavedTrip): Promise<Itinerary>;
}

export class CuratedItineraryGenerator implements ItineraryGenerator {
  constructor(private readonly fallback: ItineraryGenerator) {}

  async generate(trip: SavedTrip): Promise<Itinerary> {
    const dest = trip.intent.destinations[0];
    const slug = resolveSlug(dest?.name);
    const template = slug ? CURATED_ITINERARIES[slug] : undefined;
    if (template) {
      return stampTemplate(template, trip.id);
    }
    return this.fallback.generate(trip);
  }
}

/**
 * Synthesized - generic 3-day skeleton derived from the trip's
 * intent. Mediocre on detail but never crashes the UX. Used when the
 * destination is outside the curated library.
 */
export class SynthesizedItineraryGenerator implements ItineraryGenerator {
  async generate(trip: SavedTrip): Promise<Itinerary> {
    const dest = trip.intent.destinations[0];
    const destName = dest?.name ?? trip.proposalSummary.destinationName ?? 'your destination';
    const tags = trip.intent.vibe.tags ?? [];
    const groupKind = trip.intent.travelers.groupKind;
    const summary = `Three slow days in ${destName}. Adapt the rhythm to what you find on the ground.`;

    return {
      tripId: trip.id,
      generatedAt: new Date().toISOString(),
      source: 'synthesized',
      summary,
      days: [
        synthDay(1, `Settling into ${destName}`, destName, tags, groupKind),
        synthDay(2, `Wider afield`, destName, tags, groupKind),
        synthDay(3, `One last unhurried day`, destName, tags, groupKind),
      ],
    };
  }
}

// ============== Internals ==============

function stampTemplate(template: CuratedItineraryTemplate, tripId: string): Itinerary {
  return {
    tripId,
    generatedAt: new Date().toISOString(),
    source: template.source,
    summary: template.summary,
    days: template.days.map((d) => ({ ...d, slots: d.slots.map((s) => ({ ...s })) })),
  };
}

function resolveSlug(name?: string): string | null {
  if (!name) return null;
  return findDestinationBySlugOrAlias(name)?.slug ?? null;
}

function synthDay(
  dayNumber: number,
  theme: string,
  destName: string,
  tags: readonly string[],
  groupKind?: string,
): { dayNumber: number; theme: string; slots: ItinerarySlot[] } {
  const familyHint = groupKind === 'family' ? 'with kids in mind' : '';
  const walkable = tags.includes('walkable');
  const slow = tags.includes('slow');
  const food = tags.includes('foodie');
  const cultural = tags.includes('cultural');

  const morningTitle = walkable ? `A morning walk through ${destName}` : `Coffee in ${destName}`;
  const morningDetail = slow
    ? `Move at the pace the place suggests. Coffee, a long walk, no firm plan.`
    : `Get the lay of the land. The first morning sets the rhythm for the rest.`;

  const afternoonTitle = cultural
    ? `Afternoon at the local museum or church`
    : walkable
      ? `Afternoon wandering`
      : `Afternoon explore`;

  const dinnerTitle = food
    ? `Dinner at the kind of place a local would take you`
    : `Dinner somewhere quiet`;
  const dinnerDetail =
    `Ask your hotel for the nearest table they'd return to themselves. ${familyHint}`.trim();

  return {
    dayNumber,
    theme,
    slots: [
      {
        id: `s-d${dayNumber}-m`,
        kind: 'meal',
        startHint: 'morning',
        title: morningTitle,
        detail: morningDetail,
        costTier: 'low',
      },
      {
        id: `s-d${dayNumber}-a1`,
        kind: 'activity',
        startHint: 'morning',
        title: `Get oriented`,
        detail: `Whatever's central, on foot. The map you build today is the one you'll use the rest of the trip.`,
        durationMinutes: 90,
        costTier: 'free',
      },
      {
        id: `s-d${dayNumber}-l`,
        kind: 'meal',
        startHint: 'midday',
        title: `Lunch, somewhere local`,
        detail: `Skip the place with the laminated English menu. Watch for the tables full of locals.`,
        costTier: 'mid',
      },
      {
        id: `s-d${dayNumber}-a2`,
        kind: 'activity',
        startHint: 'afternoon',
        title: afternoonTitle,
        detail: `Pick one thing. Don't try to see everything; the second-day list is for that.`,
        durationMinutes: 120,
        costTier: 'low',
      },
      {
        id: `s-d${dayNumber}-d`,
        kind: 'meal',
        startHint: 'evening',
        title: dinnerTitle,
        detail: dinnerDetail,
        costTier: 'mid',
      },
    ],
  };
}
