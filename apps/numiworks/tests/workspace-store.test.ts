import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { TripIntent } from '@core/trip-intent';

const validIntent: TripIntent = {
  destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
  dates: { kind: 'unspecified' },
  duration: { nights: 7, flexible: false },
  travelers: { adults: 2, children: { count: 0 }, infants: 0 },
  budget: { kind: 'unspecified' },
  vibe: { tags: ['walkable'] },
  preferences: { amenities: [], avoid: [] },
  caveats: [],
  rawInput: 'Tuscany walkable',
};

function dispatch(events: OrchestratorEvent[]): void {
  for (const e of events) useWorkspaceStore.getState().dispatch(e);
}

beforeEach(() => {
  useWorkspaceStore.getState().reset();
});

describe('workspace store', () => {
  it('beginTurn enters composing phase and seeds the turn', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'hi', type: 'compose' });
    const s = useWorkspaceStore.getState();
    expect(s.phase).toBe('composing');
    expect(s.currentTurnId).toBe('t1');
    expect(s.turns.length).toBe(1);
    expect(s.turns[0]?.userMessage).toBe('hi');
  });

  it('refine begins in refining phase', () => {
    useWorkspaceStore.getState().beginTurn({
      turnId: 't2',
      sessionId: 'anon_1',
      userMessage: 'less touristy',
      type: 'refine',
    });
    expect(useWorkspaceStore.getState().phase).toBe('refining');
  });

  it('drops events from non-current turns', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([
      {
        kind: 'agent.step.started',
        turnId: 't-other',
        stepId: 's1',
        agentId: 'intent',
        label: 'Reading your trip',
      },
    ]);
    const turn = useWorkspaceStore.getState().turns[0];
    expect(turn?.steps.length).toBe(0);
  });

  it('agent.step.started/completed transitions step status', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([
      {
        kind: 'agent.step.started',
        turnId: 't1',
        stepId: 's1',
        agentId: 'intent',
        label: 'Reading your trip',
      },
      { kind: 'agent.step.completed', turnId: 't1', stepId: 's1', durationMs: 120 },
    ]);
    const step = useWorkspaceStore.getState().turns[0]?.steps[0];
    expect(step?.status).toBe('completed');
    expect(step?.durationMs).toBe(120);
  });

  it('agent.step.failed records the error', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([
      {
        kind: 'agent.step.started',
        turnId: 't1',
        stepId: 's1',
        agentId: 'intent',
        label: 'Reading your trip',
      },
      {
        kind: 'agent.step.failed',
        turnId: 't1',
        stepId: 's1',
        error: 'boom',
        recoverable: false,
      },
    ]);
    const step = useWorkspaceStore.getState().turns[0]?.steps[0];
    expect(step?.status).toBe('failed');
    expect(step?.error).toBe('boom');
  });

  it('proposal.shimmering enters shimmering phase', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([{ kind: 'proposal.shimmering', turnId: 't1', expectedCount: 3 }]);
    expect(useWorkspaceStore.getState().phase).toBe('shimmering');
  });

  it('intent.extracted attaches the intent to the current turn', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([{ kind: 'intent.extracted', turnId: 't1', intent: validIntent }]);
    expect(useWorkspaceStore.getState().turns[0]?.intent?.destinations[0]?.name).toBe('Tuscany');
  });

  it('concierge.message is captured with optional tone', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([
      { kind: 'concierge.message', turnId: 't1', message: 'Tuscany - slower.', tone: 'narrate' },
    ]);
    const cm = useWorkspaceStore.getState().turns[0]?.conciergeMessage;
    expect(cm?.text).toBe('Tuscany - slower.');
    expect(cm?.tone).toBe('narrate');
  });

  it('mood.snapshot.ready stores the snapshot', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([
      {
        kind: 'mood.snapshot.ready',
        turnId: 't1',
        destinationName: 'Tuscany',
        snapshot: {
          destinationName: 'Tuscany',
          text: 'Golden-hour vineyard dinners.',
          source: 'curated',
          confidence: 1,
        },
      },
    ]);
    expect(useWorkspaceStore.getState().turns[0]?.moodSnapshot?.text).toContain('Golden');
  });

  it('turn.completed marks turn settled', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([{ kind: 'turn.completed', turnId: 't1', durationMs: 2400 }]);
    expect(useWorkspaceStore.getState().turns[0]?.status).toBe('settled');
  });

  it('turn.failed sets phase=error and records on the turn', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([{ kind: 'turn.failed', turnId: 't1', error: 'cancelled', recoverable: true }]);
    const s = useWorkspaceStore.getState();
    expect(s.phase).toBe('error');
    expect(s.turns[0]?.status).toBe('failed');
    expect(s.turns[0]?.error).toBe('cancelled');
  });

  it('session.started captures sessionId even without an active turn', () => {
    dispatch([{ kind: 'session.started', sessionId: 'anon_xyz', timestamp: 1 }]);
    expect(useWorkspaceStore.getState().sessionId).toBe('anon_xyz');
  });

  it('proposal.adaptation appends notes to the current turn', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'refine' });
    dispatch([
      {
        kind: 'proposal.adaptation',
        turnId: 't1',
        notes: [
          { description: 'Reduced nightlife weighting', signal: 'vibrancy', direction: 'down' },
          {
            description: 'Prioritized quieter neighborhoods',
            signal: 'noise',
            direction: 'down',
          },
        ],
      },
    ]);
    const turn = useWorkspaceStore.getState().turns[0];
    expect(turn?.adaptationNotes.length).toBe(2);
    expect(turn?.adaptationNotes[0]?.description).toContain('nightlife');
  });

  it('beginTurn initializes adaptationNotes empty', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    expect(useWorkspaceStore.getState().turns[0]?.adaptationNotes).toEqual([]);
  });

  it('pinStay/unpinStay manages compareSet (max 3, oldest rotates)', () => {
    const s = useWorkspaceStore.getState();
    s.pinStay('a');
    s.pinStay('b');
    s.pinStay('c');
    expect(useWorkspaceStore.getState().compareSet).toEqual(['a', 'b', 'c']);
    s.pinStay('d');
    expect(useWorkspaceStore.getState().compareSet).toEqual(['b', 'c', 'd']);
    s.unpinStay('c');
    expect(useWorkspaceStore.getState().compareSet).toEqual(['b', 'd']);
  });

  it('pinStay is idempotent - pinning the same id twice is a no-op', () => {
    const s = useWorkspaceStore.getState();
    s.pinStay('a');
    s.pinStay('a');
    expect(useWorkspaceStore.getState().compareSet).toEqual(['a']);
  });

  it('clearCompare empties the set', () => {
    const s = useWorkspaceStore.getState();
    s.pinStay('a');
    s.pinStay('b');
    s.clearCompare();
    expect(useWorkspaceStore.getState().compareSet).toEqual([]);
  });

  it('openDetail/closeDetail toggles detailViewStayId', () => {
    const s = useWorkspaceStore.getState();
    s.openDetail('mock-italy:villa');
    expect(useWorkspaceStore.getState().detailViewStayId).toBe('mock-italy:villa');
    s.closeDetail();
    expect(useWorkspaceStore.getState().detailViewStayId).toBeNull();
  });

  it('concierge.memory.hint stores the hint at session level', () => {
    useWorkspaceStore
      .getState()
      .beginTurn({ turnId: 't1', sessionId: 'anon_1', userMessage: 'a', type: 'compose' });
    dispatch([
      {
        kind: 'concierge.memory.hint',
        turnId: 't1',
        message: 'You seem to prefer slower destinations.',
        signalKey: 'slow',
        confidence: 0.8,
      },
    ]);
    expect(useWorkspaceStore.getState().memoryHint?.signalKey).toBe('slow');
    expect(useWorkspaceStore.getState().memoryHint?.message).toContain('slower');
  });
});
