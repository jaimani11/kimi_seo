import type {
  TripIntent,
  TripDates,
  VibeTag,
  BudgetIntent,
} from '@core/trip-intent';

/**
 * Phase B — deterministic trip-state model.
 *
 * The concierge is an iterative planner: it holds a structured TripState across
 * turns, asks only the single highest-value MISSING question, and applies user
 * refinements as small, targeted DELTAS (patch, not regenerate). Everything in
 * this module is pure + deterministic — the LLM's only job upstream is to turn
 * natural language ("make it cheaper") into a `TripIntentDelta`; the merge,
 * conflict detection, next-question, and patch-vs-rebuild decision are code and
 * fully unit-testable without a model.
 *
 * Session-scoped only (Phase B). Durable memory is Phase D. We keep normalized
 * intent + deltas, not raw conversation text.
 */

// ── TripState ────────────────────────────────────────────────────────

export interface TripState {
  intent: TripIntent;
  /** Pace, kept alongside vibe for clarity ('relaxed' | 'moderate' | 'packed'). */
  pace: 'relaxed' | 'moderate' | 'packed' | null;
  /** Dietary needs ("vegetarian-friendly only"). */
  dietary: string[];
  /** Items the user asked to preserve across edits ("keep the house"). */
  mustKeep: string[];
  /** Questions the user explicitly skipped — never re-asked. */
  skipped: MissingField[];
  /** Human-readable log of edits applied this session (newest last). */
  editLog: string[];
}

export function emptyTripState(intent: TripIntent): TripState {
  return { intent, pace: null, dietary: [], mustKeep: [], skipped: [], editLog: [] };
}

// ── Missing-question model (priority order) ──────────────────────────

export type MissingField =
  | 'destination'
  | 'dates'
  | 'travelers'
  | 'budget'
  | 'style'
  | 'interests';

export interface MissingQuestion {
  field: MissingField;
  question: string;
  /** A clearly-labelled default the concierge can assume if the user skips. */
  assumptionIfSkipped: string;
}

/** Priority order — never ask a low-value field before the high-value ones. */
const FIELD_ORDER: readonly MissingField[] = [
  'destination',
  'dates',
  'travelers',
  'budget',
  'style',
  'interests',
];

export function isFieldKnown(intent: TripIntent, field: MissingField): boolean {
  switch (field) {
    case 'destination':
      return intent.destinations.length > 0;
    case 'dates':
      return intent.dates.kind !== 'unspecified' || intent.duration.nights > 0;
    case 'travelers':
      return intent.travelers.adults > 0 || intent.travelers.groupKind != null;
    case 'budget':
      return intent.budget.kind !== 'unspecified';
    case 'style':
      return intent.vibe.tags.length > 0;
    case 'interests':
      return intent.vibe.tags.length > 0 || intent.preferences.amenities.length > 0;
  }
}

/** Every still-unknown field, in priority order (for a trip-state summary). */
export function unresolvedFields(state: TripState): MissingField[] {
  return FIELD_ORDER.filter(
    (f) => !isFieldKnown(state.intent, f) && !state.skipped.includes(f),
  );
}

const QUESTIONS: Record<MissingField, MissingQuestion> = {
  destination: {
    field: 'destination',
    question: 'Where are you thinking of going?',
    assumptionIfSkipped: "I'll suggest a few destinations that fit.",
  },
  dates: {
    field: 'dates',
    question: 'When would you like to travel — exact dates, or a rough month?',
    assumptionIfSkipped: 'Assuming flexible dates in the next few months.',
  },
  travelers: {
    field: 'travelers',
    question: "Who's coming — how many adults, and any children (with ages)?",
    assumptionIfSkipped: 'Assuming 2 adults.',
  },
  budget: {
    field: 'budget',
    question: "Roughly what's your budget — per night, or total for the trip?",
    assumptionIfSkipped: 'Assuming a mid-range budget.',
  },
  style: {
    field: 'style',
    question: "What's the vibe — relaxed, adventurous, foodie, cultural…?",
    assumptionIfSkipped: 'Assuming a balanced mix.',
  },
  interests: {
    field: 'interests',
    question: 'Anything you especially want to do or see?',
    assumptionIfSkipped: "I'll pick highlights that match your vibe.",
  },
};

/**
 * The single highest-value missing question in priority order (destination →
 * dates → travelers → budget → style → interests), or null when nothing is
 * missing. Pure priority — the CALLER decides whether to block on it (see
 * `essentialsKnown`): ask before results while essentials are missing; once
 * essentials are in hand, show results and surface the next question only as an
 * optional, non-blocking refinement.
 */
export function nextMissingQuestion(state: TripState): MissingQuestion | null {
  const first = unresolvedFields(state)[0];
  return first ? QUESTIONS[first] : null;
}

/**
 * Essentials for a first useful result: destination + dates + travelers. Once
 * these are known we never block the user behind more questions — we show
 * results (budget/style/interests become optional refinements).
 */
export function essentialsKnown(state: TripState): boolean {
  return (
    isFieldKnown(state.intent, 'destination') &&
    isFieldKnown(state.intent, 'dates') &&
    isFieldKnown(state.intent, 'travelers')
  );
}

// ── Delta model ──────────────────────────────────────────────────────

export interface TripIntentDelta {
  setDestination?: { name: string; country?: string };
  setDates?: TripDates;
  setDateFlexible?: boolean;
  setAdults?: number;
  setChildren?: { count: number; ages?: number[] };
  setGroupKind?: TripIntent['travelers']['groupKind'];
  /** Relative budget nudge. */
  budgetDirection?: 'cheaper' | 'more-luxurious';
  /** Absolute budget. */
  setBudget?: BudgetIntent;
  paceDirection?: 'slower' | 'faster';
  addVibe?: VibeTag[];
  removeVibe?: VibeTag[];
  addAvoid?: string[];
  removeAvoid?: string[];
  addInterest?: string[];
  addDietary?: string[];
  addAccessibility?: string[];
  setTransportation?: TripIntent['preferences']['transportation'];
  keepLodging?: boolean;
  replaceActivities?: boolean;
  replaceDay?: number;
  addFreeAfternoon?: boolean;
  removeItems?: string[];
  keepItems?: string[];
  /** The user skipped a question — mark the field so it's never re-asked. */
  skipQuestion?: MissingField;
}

/** A structural edit to the itinerary (applied by the plan layer in Phase C). */
export interface ItineraryEdit {
  kind: 'keep-lodging' | 'replace-activities' | 'replace-day' | 'add-free-afternoon' | 'remove-items';
  day?: number;
  items?: string[];
}

export interface Conflict {
  kind: string;
  message: string;
  /** 'block' → ask the user; 'assume' → apply the safe default + state it. */
  severity: 'block' | 'assume';
  assumption?: string;
}

export interface MergeResult {
  state: TripState;
  /** Human-readable list of what changed (for the "what changed" UI). */
  changed: string[];
  conflicts: Conflict[];
  /** Rebuild only on a material core change (destination / full date range). */
  strategy: 'patch' | 'rebuild';
  /** Structural itinerary edits for the plan layer to apply. */
  itineraryEdits: ItineraryEdit[];
}

// ── merge helpers ────────────────────────────────────────────────────

function uniq(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter((s) => s.length > 0))];
}

function addVibes(tags: VibeTag[], add: VibeTag[], remove: VibeTag[]): VibeTag[] {
  const set = new Set(tags);
  for (const t of add) set.add(t);
  for (const t of remove) set.delete(t);
  return [...set];
}

const CHEAPER_REDUCTION = 0.75;
const LUXE_INCREASE = 1.4;

function nudgeBudget(b: BudgetIntent, direction: 'cheaper' | 'more-luxurious'): BudgetIntent {
  const factor = direction === 'cheaper' ? CHEAPER_REDUCTION : LUXE_INCREASE;
  if (b.kind === 'total' || b.kind === 'per-night') {
    return { ...b, amount: Math.max(1, Math.round(b.amount * factor)) };
  }
  return b; // unspecified — the vibe change carries the signal
}

/**
 * Merge a normalized delta into the current state. Deterministic + safe: a
 * malformed / empty delta is a no-op (never throws). Returns what changed, any
 * conflicts, whether to patch or rebuild, and structural itinerary edits.
 */
export function applyDelta(prior: TripState, delta: TripIntentDelta): MergeResult {
  const intent: TripIntent = structuredClone(prior.intent);
  const state: TripState = {
    intent,
    pace: prior.pace,
    dietary: [...prior.dietary],
    mustKeep: [...prior.mustKeep],
    skipped: [...prior.skipped],
    editLog: [...prior.editLog],
  };
  const changed: string[] = [];
  const itineraryEdits: ItineraryEdit[] = [];
  let strategy: 'patch' | 'rebuild' = 'patch';

  if (!delta || typeof delta !== 'object') {
    return { state, changed, conflicts: [], strategy, itineraryEdits };
  }

  // Destination — material change → rebuild.
  if (delta.setDestination?.name) {
    intent.destinations = [
      {
        kind: 'synthesized',
        name: delta.setDestination.name,
        country: (delta.setDestination.country ?? 'XX').slice(0, 2).toUpperCase(),
      },
    ];
    changed.push(`destination → ${delta.setDestination.name}`);
    strategy = 'rebuild';
  }

  // Dates — full range change → rebuild.
  if (delta.setDates) {
    intent.dates = delta.setDates;
    changed.push('dates updated');
    strategy = 'rebuild';
  }
  if (typeof delta.setDateFlexible === 'boolean') {
    intent.duration = { ...intent.duration, flexible: delta.setDateFlexible };
    changed.push(delta.setDateFlexible ? 'dates flexible' : 'dates fixed');
  }

  // Travelers — patch (preserve destination + dates).
  if (typeof delta.setAdults === 'number' && delta.setAdults >= 0) {
    intent.travelers = { ...intent.travelers, adults: Math.round(delta.setAdults) };
    changed.push(`adults → ${intent.travelers.adults}`);
  }
  if (delta.setChildren && delta.setChildren.count >= 0) {
    const ages = Array.isArray(delta.setChildren.ages)
      ? delta.setChildren.ages.filter((a) => typeof a === 'number' && a >= 0)
      : undefined;
    intent.travelers = {
      ...intent.travelers,
      children: { count: Math.round(delta.setChildren.count), ...(ages ? { ages } : {}) },
      groupKind: intent.travelers.groupKind ?? (delta.setChildren.count > 0 ? 'family' : intent.travelers.groupKind),
    };
    changed.push(
      delta.setChildren.count > 0
        ? `children → ${delta.setChildren.count}${ages && ages.length ? ` (ages ${ages.join(', ')})` : ''}`
        : 'children → 0',
    );
  }
  if (delta.setGroupKind) {
    intent.travelers = { ...intent.travelers, groupKind: delta.setGroupKind };
    changed.push(`group → ${delta.setGroupKind}`);
  }

  // Budget.
  if (delta.setBudget) {
    intent.budget = delta.setBudget;
    changed.push('budget updated');
  } else if (delta.budgetDirection) {
    intent.budget = nudgeBudget(intent.budget, delta.budgetDirection);
    if (delta.budgetDirection === 'cheaper') {
      intent.vibe.tags = addVibes(intent.vibe.tags, ['budget'], ['luxury']);
      changed.push('budget → cheaper');
    } else {
      intent.vibe.tags = addVibes(intent.vibe.tags, ['luxury'], ['budget']);
      changed.push('budget → more luxurious');
    }
  }

  // Pace.
  if (delta.paceDirection === 'slower') {
    intent.vibe.tags = addVibes(intent.vibe.tags, ['slow'], ['fast-paced']);
    state.pace = 'relaxed';
    changed.push('pace → slower');
  } else if (delta.paceDirection === 'faster') {
    intent.vibe.tags = addVibes(intent.vibe.tags, ['fast-paced'], ['slow']);
    state.pace = 'packed';
    changed.push('pace → faster');
  }

  // Vibe / interests / avoidances.
  if (delta.addVibe?.length || delta.removeVibe?.length) {
    intent.vibe.tags = addVibes(intent.vibe.tags, delta.addVibe ?? [], delta.removeVibe ?? []);
    changed.push('style updated');
  }
  if (delta.addInterest?.length) {
    intent.preferences.amenities = uniq([...intent.preferences.amenities, ...delta.addInterest]);
    changed.push(`added: ${delta.addInterest.join(', ')}`);
  }
  if (delta.addAvoid?.length) {
    intent.preferences.avoid = uniq([...intent.preferences.avoid, ...delta.addAvoid]);
    itineraryEdits.push({ kind: 'remove-items', items: uniq(delta.addAvoid) });
    changed.push(`avoiding: ${delta.addAvoid.join(', ')}`);
  }
  if (delta.removeAvoid?.length) {
    const drop = new Set(delta.removeAvoid.map((s) => s.toLowerCase().trim()));
    intent.preferences.avoid = intent.preferences.avoid.filter((a) => !drop.has(a.toLowerCase().trim()));
    changed.push('avoid list updated');
  }

  // Dietary / accessibility / transport.
  if (delta.addDietary?.length) {
    state.dietary = uniq([...state.dietary, ...delta.addDietary]);
    changed.push(`dietary: ${delta.addDietary.join(', ')}`);
  }
  if (delta.addAccessibility?.length) {
    intent.preferences.accessibility = uniq([
      ...(intent.preferences.accessibility ?? []),
      ...delta.addAccessibility,
    ]);
    changed.push(`accessibility: ${delta.addAccessibility.join(', ')}`);
  }
  if (delta.setTransportation) {
    intent.preferences.transportation = delta.setTransportation;
    changed.push(`transport → ${delta.setTransportation}`);
  }

  // Itinerary edits (patch — preserve unaffected parts).
  if (delta.keepLodging) {
    state.mustKeep = uniq([...state.mustKeep, 'lodging']);
    itineraryEdits.push({ kind: 'keep-lodging' });
    changed.push('keeping current lodging');
  }
  if (delta.keepItems?.length) {
    state.mustKeep = uniq([...state.mustKeep, ...delta.keepItems]);
    changed.push(`keeping: ${delta.keepItems.join(', ')}`);
  }
  if (delta.replaceActivities) {
    itineraryEdits.push({ kind: 'replace-activities' });
    changed.push('refreshing the activities');
  }
  if (typeof delta.replaceDay === 'number' && delta.replaceDay > 0) {
    itineraryEdits.push({ kind: 'replace-day', day: Math.round(delta.replaceDay) });
    changed.push(`replacing day ${Math.round(delta.replaceDay)}`);
  }
  if (delta.addFreeAfternoon) {
    itineraryEdits.push({ kind: 'add-free-afternoon' });
    changed.push('adding a free afternoon');
  }
  if (delta.removeItems?.length) {
    itineraryEdits.push({ kind: 'remove-items', items: uniq(delta.removeItems) });
    changed.push(`removing: ${delta.removeItems.join(', ')}`);
  }

  // Skips — never re-ask.
  if (delta.skipQuestion && !state.skipped.includes(delta.skipQuestion)) {
    state.skipped = [...state.skipped, delta.skipQuestion];
  }

  if (changed.length > 0) state.editLog = [...state.editLog, changed.join('; ')];

  const conflicts = detectConflicts(state);
  return { state, changed, conflicts, strategy, itineraryEdits };
}

// ── conflict detection ───────────────────────────────────────────────

export function detectConflicts(state: TripState): Conflict[] {
  const { intent } = state;
  const conflicts: Conflict[] = [];
  const tags = new Set(intent.vibe.tags);
  const avoid = intent.preferences.avoid.map((a) => a.toLowerCase().trim());
  const mustKeep = state.mustKeep.map((m) => m.toLowerCase().trim());

  // Budget vs luxury.
  if (tags.has('budget') && tags.has('luxury')) {
    conflicts.push({
      kind: 'budget-vs-luxury',
      message: 'You asked for both budget and luxury.',
      severity: 'assume',
      assumption: 'Prioritising the best value at the higher end of your range.',
    });
  }

  // Adults-only vibe/experience with children present.
  if (intent.travelers.children.count > 0 && (tags.has('romantic') && !tags.has('family-friendly'))) {
    conflicts.push({
      kind: 'adults-only-vs-children',
      message: 'Children are travelling but the vibe reads adults-only.',
      severity: 'assume',
      assumption: 'Filtering to family-suitable options.',
    });
  }

  // "no X" that is also a must-keep.
  for (const a of avoid) {
    if (mustKeep.some((m) => m.includes(a) || a.includes(m))) {
      conflicts.push({
        kind: 'avoid-vs-mustkeep',
        message: `You asked to avoid "${a}" but also to keep it.`,
        severity: 'block',
      });
    }
  }

  // Relaxed pace with a very long interest list.
  if ((tags.has('slow') || state.pace === 'relaxed') && intent.preferences.amenities.length > 6) {
    conflicts.push({
      kind: 'relaxed-vs-too-many',
      message: 'A relaxed pace with a lot of planned activities.',
      severity: 'assume',
      assumption: 'Keeping the days light — surfacing the top few, not all.',
    });
  }

  return conflicts;
}

// ── history: undo / reset ────────────────────────────────────────────

/**
 * Session-scoped state history. `push` records each merged state; `undo` steps
 * back one edit; `reset` clears to the initial state. Immutable — returns new
 * arrays. (Persistence is out of scope for Phase B — this lives in the session.)
 */
export interface StateHistory {
  stack: TripState[];
}

export function historyOf(initial: TripState): StateHistory {
  return { stack: [initial] };
}

export function pushState(history: StateHistory, state: TripState): StateHistory {
  return { stack: [...history.stack, state] };
}

export function current(history: StateHistory): TripState {
  return history.stack[history.stack.length - 1] as TripState;
}

/** Undo the last edit. No-op when only the initial state remains. */
export function undo(history: StateHistory): StateHistory {
  if (history.stack.length <= 1) return history;
  return { stack: history.stack.slice(0, -1) };
}

/** Start over — back to the first state in the session. */
export function reset(history: StateHistory): StateHistory {
  const first = history.stack[0];
  return { stack: first ? [first] : [] };
}

// ── turn computation (the "each turn produces" contract) ─────────────

export interface TurnComputation {
  /** The state before this turn's edit. */
  previousIntent: TripIntent;
  /** The normalized delta applied. */
  delta: TripIntentDelta;
  /** The merged state after applying the delta. */
  merged: TripState;
  /** Human-readable list of what changed. */
  changed: string[];
  conflicts: Conflict[];
  strategy: 'patch' | 'rebuild';
  itineraryEdits: ItineraryEdit[];
  /** The single next question to ask, or null. */
  nextQuestion: MissingQuestion | null;
  /** Whether enough is known to show results (destination + dates + travelers). */
  essentialsKnown: boolean;
  /** Assumptions the concierge is making (from 'assume'-severity conflicts). */
  assumptions: string[];
}

/**
 * Everything a turn produces from a prior state + a normalized delta: previous
 * intent, delta, merged state, conflicts, next question, patch-vs-rebuild, and
 * the assumptions to surface. Deterministic — the LLM only supplies the delta.
 */
export function computeTurn(prior: TripState, delta: TripIntentDelta): TurnComputation {
  const merge = applyDelta(prior, delta);
  return {
    previousIntent: prior.intent,
    delta,
    merged: merge.state,
    changed: merge.changed,
    conflicts: merge.conflicts,
    strategy: merge.strategy,
    itineraryEdits: merge.itineraryEdits,
    nextQuestion: nextMissingQuestion(merge.state),
    essentialsKnown: essentialsKnown(merge.state),
    assumptions: merge.conflicts
      .filter((c) => c.severity === 'assume' && c.assumption)
      .map((c) => c.assumption as string),
  };
}

/**
 * Recover what changed + the patch-vs-rebuild strategy from two full intents.
 * The current LLM path extracts a whole refined TripIntent (rather than a
 * delta); this derives the same signal deterministically so the orchestrator
 * can patch instead of regenerate. Rebuild only on a material core change
 * (destination or the whole date range).
 */
export function diffIntents(
  prior: TripIntent,
  next: TripIntent,
): { changed: string[]; strategy: 'patch' | 'rebuild' } {
  const changed: string[] = [];
  let strategy: 'patch' | 'rebuild' = 'patch';

  const pd = prior.destinations[0]?.name?.toLowerCase() ?? '';
  const nd = next.destinations[0]?.name?.toLowerCase() ?? '';
  if (pd !== nd) {
    changed.push('destination');
    strategy = 'rebuild';
  }
  if (JSON.stringify(prior.dates) !== JSON.stringify(next.dates)) {
    changed.push('dates');
    strategy = 'rebuild';
  }
  if (
    prior.travelers.adults !== next.travelers.adults ||
    prior.travelers.children.count !== next.travelers.children.count
  ) {
    changed.push('travelers');
  }
  if (JSON.stringify(prior.budget) !== JSON.stringify(next.budget)) changed.push('budget');
  if (prior.vibe.tags.slice().sort().join(',') !== next.vibe.tags.slice().sort().join(',')) {
    changed.push('style');
  }
  if (prior.preferences.avoid.slice().sort().join(',') !== next.preferences.avoid.slice().sort().join(',')) {
    changed.push('avoidances');
  }
  return { changed, strategy };
}

// ── UI summary ───────────────────────────────────────────────────────

export interface TripStateSummary {
  destination: string | null;
  dates: string | null;
  travelers: string | null;
  budget: string | null;
  style: string | null;
  preferences: string[];
}

function formatDates(d: TripDates): string | null {
  switch (d.kind) {
    case 'specific':
      return `${d.start} → ${d.end}`;
    case 'flexible-month':
      return `${d.month} ${d.year} (flexible)`;
    case 'flexible-season':
      return `${d.season} ${d.year}`;
    case 'unspecified':
      return null;
  }
}

function formatTravelers(t: TripIntent['travelers']): string | null {
  if (t.adults <= 0 && t.children.count <= 0 && !t.groupKind) return null;
  const parts: string[] = [];
  if (t.adults > 0) parts.push(`${t.adults} adult${t.adults === 1 ? '' : 's'}`);
  if (t.children.count > 0) {
    const ages = t.children.ages?.length ? ` (ages ${t.children.ages.join(', ')})` : '';
    parts.push(`${t.children.count} child${t.children.count === 1 ? '' : 'ren'}${ages}`);
  }
  return parts.join(' · ') || (t.groupKind ?? null);
}

function formatBudget(b: BudgetIntent): string | null {
  if (b.kind === 'unspecified') return null;
  const per = b.kind === 'per-night' ? '/night' : ' total';
  return `${b.currency} ${b.amount}${per}`;
}

/** The trip-state payload the orchestrator streams to the UI each turn. */
export interface TripStateSnapshot {
  summary: TripStateSummary;
  /** What changed this turn (empty on the first compose). */
  changed: string[];
  nextQuestion: { field: MissingField; question: string } | null;
  essentialsKnown: boolean;
  assumptions: string[];
}

/**
 * Build the streamed snapshot from the extracted intent (+ the prior intent on
 * a refine turn, to compute what changed). Pure — used by the orchestrator.
 */
export function buildTripStateSnapshot(
  intent: TripIntent,
  priorIntent?: TripIntent,
): TripStateSnapshot {
  const state = emptyTripState(intent);
  const nq = nextMissingQuestion(state);
  const conflicts = detectConflicts(state);
  return {
    summary: summarizeState(state),
    changed: priorIntent ? diffIntents(priorIntent, intent).changed : [],
    nextQuestion: nq ? { field: nq.field, question: nq.question } : null,
    essentialsKnown: essentialsKnown(state),
    assumptions: conflicts
      .filter((c) => c.severity === 'assume' && c.assumption)
      .map((c) => c.assumption as string),
  };
}

/** A compact, editable trip-state summary for the UI. */
export function summarizeState(state: TripState): TripStateSummary {
  const { intent } = state;
  const prefs: string[] = [];
  if (state.pace) prefs.push(`${state.pace} pace`);
  for (const a of intent.preferences.amenities.slice(0, 4)) prefs.push(a);
  if (intent.preferences.avoid.length) prefs.push(`no ${intent.preferences.avoid.slice(0, 3).join(', ')}`);
  for (const d of state.dietary.slice(0, 2)) prefs.push(d);
  if (intent.preferences.accessibility?.length) prefs.push(...intent.preferences.accessibility.slice(0, 2));
  if (state.mustKeep.length) prefs.push(`keep ${state.mustKeep.slice(0, 2).join(', ')}`);

  return {
    destination: intent.destinations[0]?.name ?? null,
    dates: formatDates(intent.dates),
    travelers: formatTravelers(intent.travelers),
    budget: formatBudget(intent.budget),
    style: intent.vibe.tags.length ? intent.vibe.tags.slice(0, 4).join(', ') : null,
    preferences: prefs,
  };
}
