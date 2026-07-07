import type { AdaptationNote } from '@core/reasoning';
import type { IntentDelta } from '@core/intent-delta';

/**
 * Synthesize AdaptationNotes from a structural IntentDelta.
 *
 * Slice E1 promotes vague labels ("Adjusted budget weighting") into
 * specific ones ("Tightened budget to $200/night", "Now requires:
 * pool, breakfast", "Dropped: remote") so a refine actually shows
 * the user what changed in the search criteria, not just that
 * something changed.
 *
 * Notes appear as chips on the trip-board adaptation banner; the
 * description string is the chip text. Keep it short - the chip is
 * narrow.
 */

export function synthesizeAdaptationNotes(delta: IntentDelta): AdaptationNote[] {
  const notes: AdaptationNote[] = [];

  for (const change of delta.changed) {
    if (change.key === 'vibe') {
      notes.push(...vibeNotes(change.before, change.after));
    } else if (change.key === 'budget') {
      notes.push(...budgetNotes(change.before, change.after));
    } else if (change.key === 'duration') {
      notes.push(...durationNotes(change.before, change.after));
    } else if (change.key === 'destinations') {
      notes.push(...destinationNotes(change.before, change.after));
    } else if (change.key === 'preferences') {
      notes.push(...preferenceNotes(change.before, change.after));
    } else if (change.key === 'travelers') {
      notes.push(...travelerNotes(change.before, change.after));
    }
  }

  return notes;
}

// ============== Vibe ==============

function vibeNotes(beforeRaw: unknown, afterRaw: unknown): AdaptationNote[] {
  const before = (beforeRaw as { tags: string[] } | undefined)?.tags ?? [];
  const after = (afterRaw as { tags: string[] } | undefined)?.tags ?? [];
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((t) => !beforeSet.has(t));
  const removed = before.filter((t) => !afterSet.has(t));

  const out: AdaptationNote[] = [];
  if (added.length > 0) {
    out.push({
      description: `Added: ${added.map(humanize).join(', ')}`,
      signal: added[0]!,
      direction: 'up',
    });
  }
  if (removed.length > 0) {
    out.push({
      description: `Dropped: ${removed.map(humanize).join(', ')}`,
      signal: removed[0]!,
      direction: 'down',
    });
  }
  return out;
}

// ============== Budget ==============

interface BudgetShape {
  kind?: 'total' | 'per-night' | 'flexible' | 'unspecified';
  amount?: number;
  currency?: string;
}

function budgetNotes(beforeRaw: unknown, afterRaw: unknown): AdaptationNote[] {
  const after = (afterRaw ?? {}) as BudgetShape;
  const before = (beforeRaw ?? {}) as BudgetShape;

  // No-amount → amount: user introduced a budget cap.
  if (
    (before.kind === 'unspecified' || before.kind === 'flexible' || before.amount == null) &&
    typeof after.amount === 'number'
  ) {
    const unit = after.kind === 'per-night' ? '/night' : ' total';
    const sym = currencySymbol(after.currency);
    return [
      {
        description: `Set budget: ${sym}${after.amount.toLocaleString()}${unit}`,
        signal: 'budget',
        direction: 'add',
      },
    ];
  }
  // Tightening - amount went down.
  if (
    typeof before.amount === 'number' &&
    typeof after.amount === 'number' &&
    after.amount < before.amount
  ) {
    const unit = after.kind === 'per-night' ? '/night' : ' total';
    const sym = currencySymbol(after.currency ?? before.currency);
    return [
      {
        description: `Tightened budget to ${sym}${after.amount.toLocaleString()}${unit}`,
        signal: 'budget',
        direction: 'down',
      },
    ];
  }
  // Loosening - amount went up.
  if (
    typeof before.amount === 'number' &&
    typeof after.amount === 'number' &&
    after.amount > before.amount
  ) {
    const unit = after.kind === 'per-night' ? '/night' : ' total';
    const sym = currencySymbol(after.currency ?? before.currency);
    return [
      {
        description: `Raised budget to ${sym}${after.amount.toLocaleString()}${unit}`,
        signal: 'budget',
        direction: 'up',
      },
    ];
  }
  return [
    {
      description: 'Adjusted budget weighting',
      signal: 'budget',
      direction: 'add',
    },
  ];
}

// ============== Duration ==============

interface DurationShape {
  nights?: number;
}

function durationNotes(beforeRaw: unknown, afterRaw: unknown): AdaptationNote[] {
  const before = (beforeRaw ?? {}) as DurationShape;
  const after = (afterRaw ?? {}) as DurationShape;
  if (typeof after.nights === 'number' && after.nights > 0) {
    return [
      {
        description:
          typeof before.nights === 'number' && before.nights > 0
            ? `Trip length now ${after.nights} ${after.nights === 1 ? 'night' : 'nights'}`
            : `Set trip length: ${after.nights} ${after.nights === 1 ? 'night' : 'nights'}`,
        signal: 'duration',
        direction: 'add',
      },
    ];
  }
  return [{ description: 'Adjusted trip length', signal: 'duration', direction: 'add' }];
}

// ============== Destinations ==============

function destinationNotes(beforeRaw: unknown, afterRaw: unknown): AdaptationNote[] {
  const before = ((beforeRaw as Array<{ name?: string }>) ?? [])
    .map((d) => d?.name)
    .filter(Boolean);
  const after = ((afterRaw as Array<{ name?: string }>) ?? []).map((d) => d?.name).filter(Boolean);
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((d) => !beforeSet.has(d));
  const removed = before.filter((d) => !afterSet.has(d));
  const out: AdaptationNote[] = [];
  if (added.length > 0) {
    out.push({
      description: `New destination: ${added.join(', ')}`,
      signal: 'destinations',
      direction: 'up',
    });
  }
  if (removed.length > 0) {
    out.push({
      description: `Dropped destination: ${removed.join(', ')}`,
      signal: 'destinations',
      direction: 'down',
    });
  }
  if (out.length === 0) {
    out.push({
      description: 'Updated destination set',
      signal: 'destinations',
      direction: 'add',
    });
  }
  return out;
}

// ============== Preferences (must-have / avoid amenities) ==============

interface PreferencesShape {
  amenities?: string[];
  avoid?: string[];
}

function preferenceNotes(beforeRaw: unknown, afterRaw: unknown): AdaptationNote[] {
  const before = (beforeRaw ?? {}) as PreferencesShape;
  const after = (afterRaw ?? {}) as PreferencesShape;
  const out: AdaptationNote[] = [];

  const beforeReq = new Set(before.amenities ?? []);
  const afterReq = new Set(after.amenities ?? []);
  const newReq = [...afterReq].filter((a) => !beforeReq.has(a));
  if (newReq.length > 0) {
    out.push({
      description: `Now requires: ${newReq.map(humanize).join(', ')}`,
      signal: 'amenities',
      direction: 'up',
    });
  }

  const beforeAvoid = new Set(before.avoid ?? []);
  const afterAvoid = new Set(after.avoid ?? []);
  const newAvoid = [...afterAvoid].filter((a) => !beforeAvoid.has(a));
  if (newAvoid.length > 0) {
    out.push({
      description: `Avoiding: ${newAvoid.map(humanize).join(', ')}`,
      signal: 'avoid',
      direction: 'down',
    });
  }
  return out;
}

// ============== Travelers ==============

interface TravelersShape {
  adults?: number;
  children?: { count?: number };
  infants?: number;
}

function travelerNotes(beforeRaw: unknown, afterRaw: unknown): AdaptationNote[] {
  const before = (beforeRaw ?? {}) as TravelersShape;
  const after = (afterRaw ?? {}) as TravelersShape;
  const beforeTotal = (before.adults ?? 0) + (before.children?.count ?? 0) + (before.infants ?? 0);
  const afterTotal = (after.adults ?? 0) + (after.children?.count ?? 0) + (after.infants ?? 0);
  if (afterTotal !== beforeTotal && afterTotal > 0) {
    return [
      {
        description: `Now ${afterTotal} ${afterTotal === 1 ? 'traveler' : 'travelers'}`,
        signal: 'travelers',
        direction: afterTotal > beforeTotal ? 'up' : 'down',
      },
    ];
  }
  return [];
}

// ============== Helpers ==============

function humanize(tag: string): string {
  return tag.replace(/-/g, ' ');
}

function currencySymbol(currency: string | undefined): string {
  if (!currency) return '';
  switch (currency.toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'INR':
      return '₹';
    default:
      return `${currency.toUpperCase()} `;
  }
}
