import { z } from 'zod';
import type { ItineraryEdit } from './trip-state';

/**
 * Phase C — the validated structured itinerary.
 *
 * The concierge's primary output is validated STRUCTURED DATA the UI renders as
 * real components (not just markdown). The model/builder may produce narrative
 * text, but the itinerary itself is schema-checked; malformed output degrades to
 * a safe fallback instead of rendering garbage.
 *
 * Bookable cards inside the itinerary follow the same never-invent rule as the
 * grounded-card contract: price/rating/image are present ONLY when a real
 * provider supplied them. The builder fills these from real inventory — the
 * schema just validates the shape.
 */

export const MoneyRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  currency: z.string().length(3),
});
export type MoneyRange = z.infer<typeof MoneyRangeSchema>;

/** A bookable card embedded in an itinerary item — grounded, never invented. */
export const ItineraryBookableSchema = z.object({
  title: z.string(),
  provider: z.string(),
  url: z.string(),
  destination: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.object({ amount: z.number().positive(), currency: z.string().length(3) }).optional(),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().nonnegative() }).optional(),
  disclosure: z.string(),
});
export type ItineraryBookable = z.infer<typeof ItineraryBookableSchema>;

export const TimeOfDaySchema = z.enum(['morning', 'afternoon', 'evening']);
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

export const ItineraryItemSchema = z.object({
  timeOfDay: TimeOfDaySchema,
  /** experience = bookable activity; meal; free = open time; travel = transfer; note. */
  kind: z.enum(['experience', 'meal', 'free', 'travel', 'note']),
  title: z.string(),
  description: z.string().optional(),
  /** Travel-time consideration for this item ("~25 min metro from the centre"). */
  travelNote: z.string().optional(),
  bookable: ItineraryBookableSchema.optional(),
});
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;

export const ItineraryDaySchema = z.object({
  day: z.number().int().positive(),
  theme: z.string().optional(),
  items: z.array(ItineraryItemSchema),
});
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;

export const LodgingSuggestionSchema = z.object({
  title: z.string(),
  area: z.string().optional(),
  why: z.string().optional(),
  url: z.string().optional(),
});
export type LodgingSuggestion = z.infer<typeof LodgingSuggestionSchema>;

export const StructuredItinerarySchema = z.object({
  tripSummary: z.string(),
  assumptions: z.array(z.string()),
  days: z.array(ItineraryDaySchema),
  lodging: z.array(LodgingSuggestionSchema),
  budget: z
    .object({ perDay: MoneyRangeSchema.optional(), total: MoneyRangeSchema.optional() })
    .optional(),
  /** Weather / seasonal caveats — only when grounded in real climate data. */
  weatherCaveats: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
});
export type StructuredItinerary = z.infer<typeof StructuredItinerarySchema>;

// ── validation + safe fallback ───────────────────────────────────────

export interface ParseResult {
  ok: boolean;
  itinerary: StructuredItinerary | null;
  error: string | null;
}

/** Strict validation — returns the itinerary or a structured error, never throws. */
export function parseItinerary(raw: unknown): ParseResult {
  const result = StructuredItinerarySchema.safeParse(raw);
  if (result.success) return { ok: true, itinerary: result.data, error: null };
  const first = result.error.issues[0];
  return {
    ok: false,
    itinerary: null,
    error: first ? `${first.path.join('.')}: ${first.message}` : 'invalid itinerary',
  };
}

/**
 * Best-effort itinerary — always returns a valid StructuredItinerary. If `raw`
 * validates, use it; otherwise salvage what's valid (a coherent-but-partial
 * shape) so the UI never renders garbage, and record the issue as an unresolved
 * question rather than failing the whole turn.
 */
export function safeItinerary(raw: unknown, fallbackSummary = 'Your trip'): StructuredItinerary {
  const parsed = parseItinerary(raw);
  if (parsed.ok && parsed.itinerary) return parsed.itinerary;

  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const days: ItineraryDay[] = [];
  if (Array.isArray(obj.days)) {
    for (const d of obj.days) {
      const day = ItineraryDaySchema.safeParse(d);
      if (day.success) days.push(day.data);
    }
  }
  return {
    tripSummary: typeof obj.tripSummary === 'string' ? obj.tripSummary : fallbackSummary,
    assumptions: Array.isArray(obj.assumptions) ? obj.assumptions.filter((a): a is string => typeof a === 'string') : [],
    days,
    lodging: [],
    weatherCaveats: [],
    unresolvedQuestions: [
      "We couldn't fully build the day-by-day plan — tell me a bit more and I'll refine it.",
    ],
  };
}

// ── apply Phase B itinerary edits (patch, preserve unaffected days) ──

function matchesAny(title: string, needles: string[]): boolean {
  const t = title.toLowerCase();
  return needles.some((n) => t.includes(n.toLowerCase().trim()));
}

/**
 * Apply the structural edits Phase B emits — the day-level "patch, don't
 * regenerate" promise. Unaffected days are preserved verbatim.
 *
 *   replace-day        → clear that one day's items (for regeneration); others untouched
 *   replace-activities → clear only the bookable EXPERIENCE items app-wide; meals/free/travel kept
 *   add-free-afternoon → insert a free afternoon into the first day without one
 *   remove-items       → drop items whose title matches any term, across all days
 *   keep-lodging       → preserve the lodging block (no-op on days)
 */
export function applyItineraryEdits(
  itinerary: StructuredItinerary,
  edits: readonly ItineraryEdit[],
): StructuredItinerary {
  let days = itinerary.days.map((d) => ({ ...d, items: [...d.items] }));
  let lodging = itinerary.lodging;

  for (const edit of edits) {
    switch (edit.kind) {
      case 'replace-day': {
        const target = edit.day;
        if (typeof target === 'number') {
          days = days.map((d) => (d.day === target ? { ...d, items: [] } : d));
        }
        break;
      }
      case 'replace-activities': {
        days = days.map((d) => ({
          ...d,
          items: d.items.filter((i) => i.kind !== 'experience'),
        }));
        break;
      }
      case 'remove-items': {
        const needles = edit.items ?? [];
        if (needles.length > 0) {
          days = days.map((d) => ({
            ...d,
            items: d.items.filter((i) => !matchesAny(i.title, needles)),
          }));
        }
        break;
      }
      case 'add-free-afternoon': {
        const idx = days.findIndex((d) => !d.items.some((i) => i.timeOfDay === 'afternoon' && i.kind === 'free'));
        if (idx >= 0) {
          const d = days[idx] as ItineraryDay;
          days[idx] = {
            ...d,
            items: [...d.items, { timeOfDay: 'afternoon', kind: 'free', title: 'Free afternoon', description: 'Unstructured time to wander, rest, or follow a whim.' }],
          };
        }
        break;
      }
      case 'keep-lodging':
        lodging = itinerary.lodging; // explicitly preserved
        break;
    }
  }

  return { ...itinerary, days, lodging };
}
