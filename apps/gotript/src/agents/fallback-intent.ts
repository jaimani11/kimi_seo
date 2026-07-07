import type { Destination, TripIntent, VibeTag } from '@core/trip-intent';
import { ITALIAN_DESTINATIONS } from '@lib/curation/destinations';

/**
 * Deterministic fallback for the IntentAgent. Used when the Anthropic
 * call fails OR when the model's response can't be coerced into a
 * valid `TripIntent`. The demo never blocks on a model error.
 *
 * The output is intentionally conservative - heuristics over a regex
 * pass on `rawInput`. Anything not extractable defaults to
 * `unspecified` / empty / `flexible: true` so downstream agents can
 * still proceed (provider search, mood snapshot, etc.).
 *
 * Tested against the example phrasings in the system prompt.
 */
export function synthesizeFallbackIntent(rawInput: string): TripIntent {
  const lower = rawInput.toLowerCase();

  return {
    destinations: extractDestinations(lower),
    dates: { kind: 'unspecified' },
    duration: extractDuration(lower),
    travelers: extractTravelers(lower),
    budget: { kind: 'unspecified' },
    vibe: { tags: extractVibeTags(lower) },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput,
  };
}

function extractDestinations(lower: string): Destination[] {
  // Curated-first lookup against the Italian destinations library.
  for (const d of ITALIAN_DESTINATIONS) {
    if (
      lower.includes(d.slug) ||
      lower.includes(d.name.toLowerCase()) ||
      d.aliases.some((a) => lower.includes(a))
    ) {
      return [{ kind: 'curated', name: d.name, country: d.country }];
    }
  }
  // No curated hit - leave destinations empty. The orchestrator's
  // empty-search-result handler emits a friendly concierge message
  // instead of crashing.
  return [];
}

function extractDuration(lower: string): TripIntent['duration'] {
  const m = lower.match(/(\d+)\s*(day|night)/);
  if (m && m[1]) {
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n > 0) {
      return { nights: n, flexible: false };
    }
  }
  return { nights: 0, flexible: true };
}

function extractTravelers(lower: string): TripIntent['travelers'] {
  // Family of N → 2 adults + (N-2) children. Cap children at 0..8.
  const familyOf = lower.match(/family of (\d+)/);
  if (familyOf && familyOf[1]) {
    const total = Number.parseInt(familyOf[1], 10);
    const children = Math.max(0, Math.min(total - 2, 8));
    return {
      adults: 2,
      children: { count: children },
      infants: 0,
      groupKind: 'family',
    };
  }
  if (/(couple|partner|wife|husband)/.test(lower)) {
    return {
      adults: 2,
      children: { count: 0 },
      infants: 0,
      groupKind: 'couple',
    };
  }
  if (/(just me|solo)/.test(lower)) {
    return {
      adults: 1,
      children: { count: 0 },
      infants: 0,
      groupKind: 'solo',
    };
  }
  // Default: single adult, no kids - least-surprise default for a query
  // that didn't specify.
  return {
    adults: 1,
    children: { count: 0 },
    infants: 0,
  };
}

function extractVibeTags(lower: string): VibeTag[] {
  const tags = new Set<VibeTag>();
  if (/(walkable|walking)/.test(lower)) tags.add('walkable');
  if (/(luxury|high-end|boutique)/.test(lower)) tags.add('luxury');
  if (/(budget|cheap|affordable)/.test(lower)) tags.add('budget');
  if (/(no tourist|off the beaten|tourist trap)/.test(lower)) tags.add('avoid-tourist-traps');
  if (/family-friendly|kid-friendly|with kids/.test(lower)) tags.add('family-friendly');
  if (/(foodie|food)/.test(lower)) tags.add('foodie');
  if (/\bslow\b/.test(lower)) tags.add('slow');
  if (/(cultural|culture|history|historic)/.test(lower)) tags.add('cultural');
  if (/(romantic|romance|honeymoon|anniversary)/.test(lower)) tags.add('romantic');
  if (/(nature|hiking|wilderness)/.test(lower)) tags.add('nature');
  if (/(beach|coast|ocean|seaside)/.test(lower)) tags.add('beach');
  if (/(mountain|alpine|peak)/.test(lower)) tags.add('mountains');
  if (/(remote|secluded)/.test(lower)) tags.add('remote');
  if (/(urban|city)/.test(lower)) tags.add('urban');
  if (/(adventure|adventurous|active)/.test(lower)) tags.add('adventure');
  if (/(wellness|spa|retreat)/.test(lower)) tags.add('wellness');
  return [...tags];
}

/**
 * Tool-use shortcut coercion. Anthropic tool-use occasionally bungles
 * the discriminated-union variants for `dates` / `budget`. We've
 * observed three forms in the wild:
 *
 *   1. Bare-string discriminator:   `"dates": "unspecified"`
 *   2. JSON-encoded object string:  `"dates": "{\"kind\": \"unspecified\"}"`
 *   3. Correct object form:         `"dates": {"kind": "unspecified"}`
 *
 * This helper normalizes (1) and (2) to (3) so Zod's strict
 * discriminated-union parse accepts the value. Targeted to known
 * fields only - we never blanket-walk the response, so user-provided
 * strings elsewhere stay untouched.
 */
export function coerceTripIntentShortcuts(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };
  for (const field of ['dates', 'budget'] as const) {
    const v = out[field];
    if (typeof v !== 'string') continue;
    const trimmed = v.trim();
    // Variant 2: JSON-encoded object → parse + use the parsed value.
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (parsed && typeof parsed === 'object') {
          out[field] = parsed;
          continue;
        }
      } catch {
        // Fall through to variant 1 handling.
      }
    }
    // Variant 1: bare discriminator → wrap as {kind: <value>}.
    out[field] = { kind: trimmed };
  }
  return out;
}
