import type { Stay } from '@core/stay';
import type { Turn, WorkspaceState } from './workspace-store';

export function selectCurrentTurn(s: WorkspaceState): Turn | null {
  if (!s.currentTurnId) return null;
  return s.turns.find((t) => t.turnId === s.currentTurnId) ?? null;
}

export function selectActiveStep(s: WorkspaceState) {
  const t = selectCurrentTurn(s);
  return t?.steps.find((step) => step.status === 'active') ?? null;
}

/**
 * True iff the current turn has produced something the canvas can
 * render - either a full proposal (real inventory) or a search
 * opportunity (Expedia/Vrbo/Hotels.com cards). The workspace shell
 * uses this to decide between a full-width chat (still streaming, no
 * results) vs. the split chat+canvas layout (results landed).
 */
export function selectCurrentTurnHasResults(s: WorkspaceState): boolean {
  const t = selectCurrentTurn(s);
  if (!t) return false;
  return !!(t.proposal || t.searchOpportunity);
}

/**
 * Find a Stay by id across all turns' proposals (hero or alternative).
 * Slice A's compare/detail UIs lean on this lookup; turns is a small list
 * so the linear scan is fine. Returns null if not found.
 */
export function selectStayById(s: WorkspaceState, stayId: string): Stay | null {
  for (const t of s.turns) {
    if (!t.proposal) continue;
    if (t.proposal.hero.id === stayId) return t.proposal.hero;
    const alt = t.proposal.alternatives.find((a) => a.id === stayId);
    if (alt) return alt;
  }
  return null;
}

/**
 * Locate the Turn whose proposal contains the given stayId. Used by the
 * detail panel's Save Trip CTA - the user opened detail on a stay, but
 * what they bookmark is the entire proposal that produced it.
 */
export function selectTurnContainingStay(s: WorkspaceState, stayId: string): Turn | null {
  for (const t of s.turns) {
    if (!t.proposal) continue;
    if (t.proposal.hero.id === stayId) return t;
    if (t.proposal.alternatives.some((a) => a.id === stayId)) return t;
  }
  return null;
}

// Intentionally NOT exporting a `selectStaysByIds(state, ids)` helper here:
// using it inside a `useWorkspaceStore(...)` selector would create a fresh
// array every render and trigger Zustand's reference-equality re-render
// loop. Components that need multi-stay lookups should subscribe to
// `compareSet` + `turns` separately and derive via `useMemo`. See
// `CompareTray` for the pattern.
