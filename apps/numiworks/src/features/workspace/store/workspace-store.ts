'use client';

import { create } from 'zustand';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';
import type { AdaptationNote, MoodSnapshot } from '@core/reasoning';
import type { MemoryHint } from '@core/memory';
import type { ProposalRef } from '@core/partial';
import type { SearchOpportunity } from '@core/search-opportunity';

export type Phase =
  | 'idle'
  | 'composing'
  | 'shimmering'
  | 'settled'
  | 'refining'
  | 'evolved'
  | 'error';

export interface AgentStep {
  stepId: string;
  agentId: string;
  label: string;
  status: 'active' | 'completed' | 'failed';
  durationMs?: number;
  error?: string;
}

export interface Turn {
  turnId: string;
  type: 'compose' | 'refine';
  userMessage: string;
  steps: AgentStep[];
  intent?: TripIntent;
  proposal?: TripProposal;
  /** Slice F1 - set when the orchestrator chose the opportunity path
   *  instead of producing a proposal. The Canvas renders SearchOpportunityBoard
   *  when this is present (and no proposal). */
  searchOpportunity?: SearchOpportunity;
  proposalRef?: ProposalRef;
  moodSnapshot?: MoodSnapshot;
  adaptationNotes: AdaptationNote[];
  conciergeMessage?: { text: string; tone?: 'narrate' | 'reassure' | 'apologize' };
  status: 'streaming' | 'settled' | 'failed';
  error?: string;
  startedAt: number;
}

export interface WorkspaceState {
  phase: Phase;
  currentTurnId: string | null;
  turns: Turn[]; // ordered oldest → newest
  sessionId: string | null;
  inputDraft: string;
  compareSet: string[]; // StayId list, max 3 (oldest rotates out)
  detailViewStayId: string | null; // open when not null
  memoryHint: MemoryHint | null; // session-scoped, set by concierge.memory.hint
  savedPanelOpen: boolean;
}

export interface WorkspaceActions {
  dispatch: (event: OrchestratorEvent) => void;
  beginTurn: (args: {
    turnId: string;
    sessionId: string;
    userMessage: string;
    type: 'compose' | 'refine';
  }) => void;
  setInputDraft: (draft: string) => void;
  pinStay: (id: string) => void;
  unpinStay: (id: string) => void;
  clearCompare: () => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  openSavedPanel: () => void;
  closeSavedPanel: () => void;
  /**
   * Push a saved trip onto the workspace as a synthetic settled turn.
   * The canvas then renders it like any other turn - pin/compare/detail
   * already work against a Turn record. Refining a resurfaced trip is
   * a B3.x concern (priorTurn lookup may 404 cross-process).
   */
  resurfaceSavedTrip: (args: {
    turnId: string;
    proposal: TripProposal;
    intent: TripIntent;
    proposalRef: ProposalRef;
    bookmarkedAt: string;
  }) => void;
  reset: () => void;
}

const COMPARE_MAX = 3;

const INITIAL_STATE: WorkspaceState = {
  phase: 'idle',
  currentTurnId: null,
  turns: [],
  sessionId: null,
  inputDraft: '',
  compareSet: [],
  detailViewStayId: null,
  memoryHint: null,
  savedPanelOpen: false,
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set, get) => ({
  ...INITIAL_STATE,

  beginTurn({ turnId, sessionId, userMessage, type }) {
    set((s) => ({
      currentTurnId: turnId,
      sessionId: s.sessionId ?? sessionId,
      inputDraft: '',
      phase: type === 'refine' ? 'refining' : 'composing',
      turns: [
        ...s.turns,
        {
          turnId,
          type,
          userMessage,
          steps: [],
          adaptationNotes: [],
          status: 'streaming',
          startedAt: Date.now(),
        },
      ],
    }));
  },

  dispatch(event: OrchestratorEvent) {
    // Drop events from cancelled/non-current turns. session.started has no
    // turnId, so the `'turnId' in event` guard lets it through.
    if ('turnId' in event && event.turnId !== get().currentTurnId) {
      return;
    }

    switch (event.kind) {
      case 'session.started':
        set({ sessionId: event.sessionId });
        break;

      case 'turn.started':
        // beginTurn was called client-side already.
        break;

      case 'agent.step.started':
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          steps: [
            ...turn.steps,
            {
              stepId: event.stepId,
              agentId: event.agentId,
              label: event.label,
              status: 'active',
            },
          ],
        }));
        break;

      case 'agent.step.progress':
        break;

      case 'agent.step.completed':
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          steps: turn.steps.map((s) =>
            s.stepId === event.stepId
              ? { ...s, status: 'completed', durationMs: event.durationMs }
              : s,
          ),
        }));
        break;

      case 'agent.step.failed':
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          steps: turn.steps.map((s) =>
            s.stepId === event.stepId ? { ...s, status: 'failed', error: event.error } : s,
          ),
        }));
        break;

      case 'agent.explanation':
        break;

      case 'intent.extracted':
        updateCurrentTurn(set, get, (turn) => ({ ...turn, intent: event.intent }));
        break;

      case 'intent.refined':
        updateCurrentTurn(set, get, (turn) => ({ ...turn, intent: event.intent }));
        break;

      case 'provider.search.completed':
        break;

      case 'proposal.shimmering':
        set({ phase: 'shimmering' });
        break;

      case 'proposal.refining':
        set({ phase: 'refining' });
        break;

      case 'proposal.adaptation':
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          adaptationNotes: [...turn.adaptationNotes, ...event.notes],
        }));
        break;

      case 'proposal.ready':
        set({ phase: 'settled' });
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          proposal: event.proposal as unknown as TripProposal,
        }));
        break;

      case 'proposal.evolved':
        set({ phase: 'evolved' });
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          proposal: event.proposal as unknown as TripProposal,
        }));
        break;

      case 'search.opportunity.ready':
        // Settle the canvas immediately - no shimmer skeleton waiting
        // for a `proposal.ready` that's never going to come.
        set({ phase: 'settled' });
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          searchOpportunity: event.opportunity,
        }));
        break;

      case 'proposal.bookmarkable':
        updateCurrentTurn(set, get, (turn) => ({ ...turn, proposalRef: event.ref }));
        break;

      case 'proposal.provenance.computed':
        break;

      case 'concierge.message':
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          conciergeMessage: { text: event.message, ...(event.tone ? { tone: event.tone } : {}) },
        }));
        break;

      case 'concierge.memory.hint':
        set({
          memoryHint: {
            message: event.message,
            signalKey: event.signalKey,
            confidence: event.confidence,
          },
        });
        break;

      case 'mood.snapshot.ready':
        updateCurrentTurn(set, get, (turn) => ({ ...turn, moodSnapshot: event.snapshot }));
        break;

      case 'turn.completed': {
        updateCurrentTurn(set, get, (turn) => ({ ...turn, status: 'settled' }));
        // If the turn finished without producing a proposal or
        // search-opportunity (e.g. the orchestrator's "tell me where"
        // short-circuit), the phase was stuck at 'composing' / 'refining'
        // and the InputBar's disabled state never lifted. Drop the phase
        // back to a non-streaming state so the user can type again.
        const phase = get().phase;
        if (phase === 'composing' || phase === 'refining' || phase === 'shimmering') {
          set({ phase: 'settled' });
        }
        break;
      }

      case 'turn.failed':
        set({ phase: 'error' });
        updateCurrentTurn(set, get, (turn) => ({
          ...turn,
          status: 'failed',
          error: event.error,
        }));
        break;
    }
  },

  setInputDraft(draft) {
    set({ inputDraft: draft });
  },

  pinStay(id) {
    set((s) => {
      if (s.compareSet.includes(id)) return s;
      const next = [...s.compareSet, id];
      // Rotate oldest out when over limit.
      const rotated = next.length > COMPARE_MAX ? next.slice(next.length - COMPARE_MAX) : next;
      return { compareSet: rotated };
    });
  },

  unpinStay(id) {
    set((s) => ({ compareSet: s.compareSet.filter((x) => x !== id) }));
  },

  clearCompare() {
    set({ compareSet: [] });
  },

  openDetail(id) {
    set({ detailViewStayId: id });
  },

  closeDetail() {
    set({ detailViewStayId: null });
  },

  openSavedPanel() {
    set({ savedPanelOpen: true });
  },

  closeSavedPanel() {
    set({ savedPanelOpen: false });
  },

  resurfaceSavedTrip({ turnId, proposal, intent, proposalRef, bookmarkedAt }) {
    set((s) => {
      // De-dupe - clicking the same saved trip twice shouldn't stack.
      if (s.turns.some((t) => t.turnId === turnId)) {
        return { currentTurnId: turnId, savedPanelOpen: false, phase: 'settled' };
      }
      const turn: Turn = {
        turnId,
        type: 'compose',
        userMessage: `(Reopened a saved trip from ${new Date(bookmarkedAt).toLocaleDateString()})`,
        steps: [],
        intent,
        proposal,
        proposalRef,
        adaptationNotes: [],
        status: 'settled',
        startedAt: Date.parse(bookmarkedAt) || Date.now(),
      };
      return {
        turns: [...s.turns, turn],
        currentTurnId: turnId,
        savedPanelOpen: false,
        phase: 'settled',
      };
    });
  },

  reset() {
    set({ ...INITIAL_STATE });
  },
}));

function updateCurrentTurn(
  set: (
    partial:
      | Partial<WorkspaceState & WorkspaceActions>
      | ((s: WorkspaceState & WorkspaceActions) => Partial<WorkspaceState & WorkspaceActions>),
  ) => void,
  get: () => WorkspaceState & WorkspaceActions,
  mutator: (turn: Turn) => Turn,
): void {
  const state = get();
  if (!state.currentTurnId) return;
  set({
    turns: state.turns.map((t) => (t.turnId === state.currentTurnId ? mutator(t) : t)),
  });
}
