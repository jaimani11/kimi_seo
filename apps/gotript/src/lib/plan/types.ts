import type { Experience } from '@core/experience';

/**
 * Lightweight itinerary types for `/plan`. Distinct from the
 * Slice-C3 ItinerarySchema because:
 *
 *   - C3's itinerary is owned by a SavedTrip and is editorial
 *     (curated text, no bookable items).
 *   - /plan's itinerary is anonymous, query-string-shareable, and
 *     hydrated with bookable Viator experiences end-to-end.
 *
 * The two coexist; C3's curated content stays the long-form trip
 * planner for signed-in users with saved trips.
 */

export type DayTheme =
  | 'arrival'
  | 'food-and-wine'
  | 'culture-and-history'
  | 'adventure'
  | 'sunset-and-water'
  | 'day-trip'
  | 'farewell'
  | 'free-day';

export interface PlanSlot {
  /** Stable id within the plan — used for keys + Reserve-all batching. */
  id: string;
  /** "Morning", "Midday", "Afternoon", "Evening". */
  timeBand: 'morning' | 'midday' | 'afternoon' | 'evening';
  /** Italic editorial line. Tells the user what this slot is for. */
  brief: string;
  /** Matching Viator experiences (1–3) with affiliate redirect href. */
  picks: PlanPick[];
}

export interface PlanPick {
  experience: Experience;
  reserveHref: string;
}

export interface PlanDay {
  dayNumber: number;
  theme: DayTheme;
  /** Short Fraunces-italic theme label, e.g. "Slow Roman mornings". */
  themeLabel: string;
  /** Smart-sequencing note — why this day is shaped this way relative
   *  to the days around it. Optional. */
  rationale?: string;
  slots: PlanSlot[];
}

export interface Plan {
  destination: string;
  nights: number;
  vibe: readonly string[];
  /** Short editorial summary for the page header. */
  summary: string;
  days: PlanDay[];
  /** Stable query-string this plan was generated from, for share URL. */
  query: PlanQuery;
}

export interface PlanQuery {
  destination: string;
  nights: number;
  vibeTags: readonly string[];
}
