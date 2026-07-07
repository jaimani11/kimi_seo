# StayScout Slice A7 - Workspace Shell + Chat Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the A1 placeholder hero with a working split-pane workspace. Chat sidebar (greeting → suggestions → message thread → agent step list → input bar). Canvas (empty state with featured stay → shimmer during stream → basic Trip Board after `proposal.ready`). Zustand store fed by typed events from the JSONL stream. After A7, typing in the input and pressing send actually composes a trip end-to-end. The cinematic Trip Board materialization lands in A8 - A7 ships a structurally-correct but motion-light version so the workflow is visible.

**Architecture:** Single client component `<Workspace>` mounted at `/`. Zustand store at `src/features/workspace/store/` owns ALL UI state derived from the wire (events → state). `useConciergeStream()` hook handles fetch + JSONL parsing + dispatch. Chat sidebar and canvas are dumb-renderers reading from the store. Voice rules (Fraunces italic for concierge speech, Inter for UI) enforced via design-token usage from A1.

**Tests:** Pure-function reducer tests on the store. Hook + components manually verified during the final smoke (no API key needed for the basic structural test - the orchestrator emits `turn.failed` cleanly when the Anthropic key is missing).

**Tech additions:** `zustand`.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §5.1, §5.2, §5.3, §5.4, §5.7, §6.8

---

## Slice A7 file structure

```
src/features/workspace/
├── workspace.tsx                    [new] split-pane shell, mounts everything
├── store/
│   ├── workspace-store.ts           [new] Zustand store + reducer
│   └── derived.ts                   [new] selectors (current turn, phase)
├── hooks/
│   └── use-concierge-stream.ts      [new] POST + JSONL → store dispatch
├── chat-sidebar/
│   ├── chat-sidebar.tsx             [new] header + thread + input bar
│   ├── greeting.tsx                 [new] empty-state greeting + suggestion chips
│   ├── message-thread.tsx           [new] turn-by-turn rendering
│   ├── user-message.tsx             [new] user bubble
│   ├── agent-step-list.tsx          [new] the ✦ stepped-progress UX
│   ├── concierge-message.tsx        [new] AI summary in Fraunces italic
│   └── input-bar.tsx                [new] glass pill + sparkle prefix + send
├── canvas/
│   ├── canvas.tsx                   [new] router: empty / shimmer / proposal
│   ├── empty-state.tsx              [new] "Featured today" with curated hero
│   ├── shimmer-placeholder.tsx      [new] layout grid with shimmer cells
│   └── stay-list.tsx                [new] basic Trip Board (A8 cinematizes)
└── featured-today.ts                [new] daily-rotation logic over curated seed

src/features/landing/                [modify] keep header, drop the placeholder hero
└── workspace-shell-placeholder.tsx  [delete]

src/app/page.tsx                     [modify] render <Workspace/> instead of placeholder

tests/
├── workspace-store.test.ts          [new] reducer dispatch tests per event kind
└── featured-today.test.ts           [new] daily-rotation determinism
```

Total: ~14 new files, 2 modified, 1 deleted.

---

## Task 1: Install Zustand

- [ ] `pnpm add zustand`
- [ ] Commit: `chore: install zustand`

## Task 2: Workspace store

- [ ] Create `src/features/workspace/store/workspace-store.ts`:
  ```ts
  'use client';

  import { create } from 'zustand';
  import type { OrchestratorEvent } from '@core/orchestrator-event';
  import type { TripIntent } from '@core/trip-intent';
  import type { TripProposal } from '@core/trip-proposal';
  import type { MoodSnapshot } from '@core/reasoning';
  import type { ProposalRef } from '@core/partial';

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
    proposalRef?: ProposalRef;
    moodSnapshot?: MoodSnapshot;
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
    reset: () => void;
  }

  const INITIAL_STATE: WorkspaceState = {
    phase: 'idle',
    currentTurnId: null,
    turns: [],
    sessionId: null,
    inputDraft: '',
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
            status: 'streaming',
            startedAt: Date.now(),
          },
        ],
      }));
    },

    dispatch(event: OrchestratorEvent) {
      // Skip events from cancelled/unknown turns (defensive).
      if ('turnId' in event && event.turnId !== get().currentTurnId) {
        // Allow session.started which doesn't carry turnId.
        if (event.kind !== 'session.started') return;
      }

      switch (event.kind) {
        case 'session.started':
          set({ sessionId: event.sessionId });
          break;

        case 'turn.started':
          // beginTurn was called client-side already; nothing to do here.
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
          // Slice A: no per-step UI for progress messages; ignore.
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
          // Slice A: no UI for explanations. Slice B/C surface them.
          break;

        case 'intent.extracted':
          updateCurrentTurn(set, get, (turn) => ({ ...turn, intent: event.intent }));
          break;

        case 'intent.refined':
          updateCurrentTurn(set, get, (turn) => ({ ...turn, intent: event.intent }));
          break;

        case 'provider.search.completed':
          // Stays land via proposal.ready; nothing to do here for Slice A UI.
          break;

        case 'proposal.shimmering':
          set({ phase: 'shimmering' });
          break;

        case 'proposal.refining':
          set({ phase: 'refining' });
          break;

        case 'proposal.adaptation':
          // Slice A: no banner UI yet (A9 will surface it). Slice A8 may render.
          break;

        case 'proposal.ready':
          set({ phase: 'settled' });
          updateCurrentTurn(set, get, (turn) => ({ ...turn, proposal: event.proposal }));
          break;

        case 'proposal.evolved':
          set({ phase: 'evolved' });
          updateCurrentTurn(set, get, (turn) => ({ ...turn, proposal: event.proposal }));
          break;

        case 'proposal.bookmarkable':
          updateCurrentTurn(set, get, (turn) => ({ ...turn, proposalRef: event.ref }));
          break;

        case 'proposal.provenance.computed':
          break;

        case 'concierge.message':
          updateCurrentTurn(set, get, (turn) => ({
            ...turn,
            conciergeMessage: { text: event.message, tone: event.tone },
          }));
          break;

        case 'concierge.memory.hint':
          // Slice A: no memory-hint UI yet. Lands in A9.
          break;

        case 'mood.snapshot.ready':
          updateCurrentTurn(set, get, (turn) => ({ ...turn, moodSnapshot: event.snapshot }));
          break;

        case 'turn.completed':
          updateCurrentTurn(set, get, (turn) => ({ ...turn, status: 'settled' }));
          break;

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

    reset() {
      set({ ...INITIAL_STATE });
    },
  }));

  function updateCurrentTurn(
    set: (partial: Partial<WorkspaceState>) => void,
    get: () => WorkspaceState,
    mutator: (turn: Turn) => Turn,
  ): void {
    const state = get();
    if (!state.currentTurnId) return;
    set({
      turns: state.turns.map((t) => (t.turnId === state.currentTurnId ? mutator(t) : t)),
    });
  }
  ```

- [ ] Create `src/features/workspace/store/derived.ts`:
  ```ts
  import type { Turn, WorkspaceState } from './workspace-store';

  export function selectCurrentTurn(s: WorkspaceState): Turn | null {
    if (!s.currentTurnId) return null;
    return s.turns.find((t) => t.turnId === s.currentTurnId) ?? null;
  }

  export function selectActiveStep(s: WorkspaceState) {
    const t = selectCurrentTurn(s);
    return t?.steps.find((step) => step.status === 'active') ?? null;
  }
  ```

- [ ] Commit: `feat(workspace): add Zustand store + reducer for OrchestratorEvent stream`

## Task 3: `useConciergeStream()` hook

- [ ] Create `src/features/workspace/hooks/use-concierge-stream.ts`:
  ```ts
  'use client';

  import { useCallback, useRef } from 'react';
  import { OrchestratorEventSchema } from '@core/orchestrator-event';
  import type { ProposalRef } from '@core/partial';
  import { useWorkspaceStore } from '../store/workspace-store';

  export interface SendArgs {
    rawInput: string;
    type?: 'compose' | 'refine';
    priorProposalRef?: ProposalRef;
  }

  export interface UseConciergeStream {
    send: (args: SendArgs) => Promise<void>;
    cancel: () => void;
  }

  export function useConciergeStream(): UseConciergeStream {
    const dispatch = useWorkspaceStore((s) => s.dispatch);
    const beginTurn = useWorkspaceStore((s) => s.beginTurn);
    const sessionId = useWorkspaceStore((s) => s.sessionId);
    const ctrlRef = useRef<AbortController | null>(null);

    const send = useCallback(
      async ({ rawInput, type = 'compose', priorProposalRef }: SendArgs): Promise<void> => {
        ctrlRef.current?.abort();
        const turnId = `t_${crypto.randomUUID()}`;
        const finalSessionId = sessionId ?? `anon_${crypto.randomUUID()}`;

        beginTurn({ turnId, sessionId: finalSessionId, userMessage: rawInput, type });

        const ctrl = new AbortController();
        ctrlRef.current = ctrl;

        try {
          const resp = await fetch('/api/concierge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: finalSessionId,
              turnId,
              type,
              input: {
                rawInput,
                ...(priorProposalRef ? { priorProposalRef } : {}),
              },
              clientCapabilities: {
                supportsAdaptationDelta: true,
                supportsMoodSnapshot: true,
                supportsMemoryHint: true,
              },
            }),
            signal: ctrl.signal,
          });

          if (!resp.ok || !resp.body) {
            dispatch({
              kind: 'turn.failed',
              turnId,
              error: `HTTP ${resp.status}`,
              recoverable: false,
            });
            return;
          }

          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.trim()) continue;
              let parsed: unknown;
              try {
                parsed = JSON.parse(line);
              } catch {
                continue;
              }
              const result = OrchestratorEventSchema.safeParse(parsed);
              if (result.success) {
                dispatch(result.data);
              } else {
                console.warn('[useConciergeStream] dropped invalid event', parsed);
              }
            }
          }
        } catch (err) {
          if (ctrl.signal.aborted) return;
          dispatch({
            kind: 'turn.failed',
            turnId,
            error: err instanceof Error ? err.message : String(err),
            recoverable: false,
          });
        }
      },
      [dispatch, beginTurn, sessionId],
    );

    const cancel = useCallback((): void => {
      ctrlRef.current?.abort();
    }, []);

    return { send, cancel };
  }
  ```

## Task 4: Featured-today helper

- [ ] Create `src/features/workspace/featured-today.ts`:
  ```ts
  import type { Stay } from '@core/stay';
  import { ALL_STAYS } from '@/providers/mock-italy/data';

  /**
   * Daily-rotated featured stay over the curated set. Deterministic: the
   * same UTC day returns the same stay across all sessions.
   */
  export function pickFeaturedToday(now: Date = new Date()): Stay {
    const dayBucket = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
    const idx = dayBucket % ALL_STAYS.length;
    const stay = ALL_STAYS[idx];
    if (!stay) throw new Error('ALL_STAYS is empty');
    return stay;
  }
  ```

## Task 5: Chat sidebar components

- [ ] Create `src/features/workspace/chat-sidebar/greeting.tsx`:
  ```tsx
  'use client';

  import { Sparkle } from '@/features/shared/icons';
  import { useWorkspaceStore } from '../store/workspace-store';
  import { useConciergeStream } from '../hooks/use-concierge-stream';

  const SUGGESTIONS = [
    'Tuscany, slow and walkable',
    'Tokyo for a long weekend',
    'Patagonia in shoulder season',
  ];

  export function Greeting() {
    const setDraft = useWorkspaceStore((s) => s.setInputDraft);
    const { send } = useConciergeStream();

    return (
      <div className="px-5 pt-6 pb-4">
        <div
          className="mb-4 inline-flex items-center gap-2 text-[color:var(--ink-tertiary)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <Sparkle size={11} style={{ color: 'var(--accent-primary)' }} />
          Concierge
        </div>
        <h1
          className="mb-5"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-sm)',
            fontWeight: 300,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: 'var(--ink-primary)',
          }}
        >
          {greetingText()}
          <br />
          <em style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>next?</em>
        </h1>
        <ul className="space-y-1.5">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  setDraft(s);
                  void send({ rawInput: s });
                }}
                className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-3 py-2 text-left transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-[color:var(--border-emphasis)] hover:bg-[color:var(--surface-overlay)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--ink-secondary)',
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function greetingText(): string {
    const h = new Date().getHours();
    if (h < 5) return 'Where to,';
    if (h < 12) return 'Good morning. Where to,';
    if (h < 18) return 'Good afternoon. Where to,';
    return 'Good evening. Where to,';
  }
  ```

- [ ] Create `src/features/workspace/chat-sidebar/user-message.tsx`:
  ```tsx
  export function UserMessage({ text }: { text: string }) {
    return (
      <div
        className="ml-auto max-w-[88%] rounded-xl border px-3 py-2"
        style={{
          background: 'var(--accent-primary-soft)',
          borderColor: 'var(--accent-primary-soft)',
          color: 'var(--ink-primary)',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-body-sm)',
          lineHeight: 1.45,
        }}
      >
        {text}
      </div>
    );
  }
  ```

- [ ] Create `src/features/workspace/chat-sidebar/agent-step-list.tsx`:
  ```tsx
  'use client';

  import { motion } from 'framer-motion';
  import type { AgentStep } from '../store/workspace-store';
  import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

  export function AgentStepList({ steps }: { steps: AgentStep[] }) {
    const reduced = useReducedMotion();
    if (steps.length === 0) return null;
    return (
      <ul className="space-y-1.5">
        {steps.map((step, idx) => (
          <motion.li
            key={step.stepId}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0.2 : 0.35,
              delay: reduced ? 0 : idx * 0.06,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            className="flex items-center gap-2.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-3 py-1.5"
          >
            <StepIcon status={step.status} />
            <span
              className="flex-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: step.status === 'failed' ? 'var(--ink-tertiary)' : 'var(--ink-secondary)',
                textDecoration: step.status === 'failed' ? 'line-through' : 'none',
              }}
            >
              {step.status === 'active' ? presentParticiple(step.label) : pastTense(step.label)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.6875rem',
                color: 'var(--accent-primary)',
                fontStyle: 'italic',
              }}
            >
              · {step.agentId}
            </span>
          </motion.li>
        ))}
      </ul>
    );
  }

  function StepIcon({ status }: { status: AgentStep['status'] }) {
    if (status === 'completed') {
      return (
        <span
          aria-hidden
          className="grid h-3 w-3 place-items-center rounded-full"
          style={{ background: 'var(--accent-primary)' }}
        >
          <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#14171C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    }
    if (status === 'failed') {
      return <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: 'var(--ink-tertiary)' }} />;
    }
    return (
      <motion.span
        aria-hidden
        animate={{ boxShadow: ['0 0 0 0 var(--accent-primary-glow)', '0 0 0 4px transparent'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="h-3 w-3 rounded-full border-2"
        style={{ borderColor: 'var(--accent-primary)', background: 'var(--accent-primary-soft)' }}
      />
    );
  }

  // "Reading your trip" → "Read your trip" - naive but works for our prompts.
  function pastTense(label: string): string {
    return label
      .replace(/^Reading/i, 'Read')
      .replace(/^Adjusting/i, 'Adjusted')
      .replace(/^Searching/i, 'Searched')
      .replace(/^Composing/i, 'Composed')
      .replace(/^Ranking/i, 'Ranked');
  }

  function presentParticiple(label: string): string {
    // The orchestrator already emits present participle; pass through.
    return label;
  }
  ```

- [ ] Create `src/features/workspace/chat-sidebar/concierge-message.tsx`:
  ```tsx
  'use client';

  import { motion } from 'framer-motion';
  import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
  import type { Turn } from '../store/workspace-store';

  export function ConciergeMessage({ turn }: { turn: Turn }) {
    const reduced = useReducedMotion();
    const cm = turn.conciergeMessage;
    const mood = turn.moodSnapshot;
    if (!cm && !mood) return null;
    return (
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-3 py-2"
      >
        {cm && (
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body-sm)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.45,
              color: 'var(--ink-primary)',
            }}
          >
            {cm.text}
          </p>
        )}
        {mood && (
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body-sm)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.45,
              color: 'var(--ink-secondary)',
            }}
          >
            {mood.text}
          </p>
        )}
      </motion.div>
    );
  }
  ```

- [ ] Create `src/features/workspace/chat-sidebar/message-thread.tsx`:
  ```tsx
  'use client';

  import { useWorkspaceStore } from '../store/workspace-store';
  import { UserMessage } from './user-message';
  import { AgentStepList } from './agent-step-list';
  import { ConciergeMessage } from './concierge-message';

  export function MessageThread() {
    const turns = useWorkspaceStore((s) => s.turns);
    if (turns.length === 0) return null;
    return (
      <div className="flex flex-col gap-3 px-5 pt-2 pb-3">
        {turns.map((t, idx) => (
          <div
            key={t.turnId}
            className="flex flex-col gap-2"
            style={{ opacity: idx === turns.length - 1 ? 1 : 0.7 }}
          >
            <UserMessage text={t.userMessage} />
            <AgentStepList steps={t.steps} />
            <ConciergeMessage turn={t} />
            {t.status === 'failed' && t.error ? (
              <div
                className="rounded-lg border px-3 py-1.5"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--surface-overlay)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--ink-tertiary)',
                  fontStyle: 'italic',
                }}
              >
                Stream interrupted - try again?
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] Create `src/features/workspace/chat-sidebar/input-bar.tsx`:
  ```tsx
  'use client';

  import { useState } from 'react';
  import { Send } from '@/features/shared/icons';
  import { Sparkle } from '@/features/shared/icons';
  import { useWorkspaceStore } from '../store/workspace-store';
  import { useConciergeStream } from '../hooks/use-concierge-stream';
  import { selectCurrentTurn } from '../store/derived';

  export function InputBar() {
    const draft = useWorkspaceStore((s) => s.inputDraft);
    const setDraft = useWorkspaceStore((s) => s.setInputDraft);
    const phase = useWorkspaceStore((s) => s.phase);
    const currentTurn = useWorkspaceStore((s) => selectCurrentTurn(s));
    const { send } = useConciergeStream();
    const [focused, setFocused] = useState(false);

    const isStreaming = phase === 'composing' || phase === 'shimmering' || phase === 'refining';

    const submit = (): void => {
      if (!draft.trim() || isStreaming) return;
      const isRefine = !!currentTurn?.proposalRef && currentTurn.status === 'settled';
      if (isRefine && currentTurn.proposalRef) {
        void send({ rawInput: draft, type: 'refine', priorProposalRef: currentTurn.proposalRef });
      } else {
        void send({ rawInput: draft, type: 'compose' });
      }
    };

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="px-4 py-3"
      >
        <div
          className="flex items-center gap-2 rounded-full border px-3 py-2 backdrop-blur-[10px]"
          style={{
            background: 'var(--surface-overlay)',
            borderColor: focused ? 'var(--accent-primary-glow)' : 'var(--border-emphasis)',
            transition: 'border-color var(--dur-fast) var(--ease-out)',
          }}
        >
          <Sparkle size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Composing your trip…' : 'Tell me about your trip…'}
            className="flex-1 bg-transparent outline-none disabled:opacity-60"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--ink-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || isStreaming}
            aria-label="Send"
            className="grid h-7 w-7 place-items-center rounded-full transition-opacity duration-[var(--dur-fast)] disabled:opacity-40"
            style={{
              background: 'var(--accent-primary)',
              color: '#14171C',
            }}
          >
            <Send size={13} strokeWidth={2.2} />
          </button>
        </div>
      </form>
    );
  }
  ```

- [ ] Create `src/features/workspace/chat-sidebar/chat-sidebar.tsx`:
  ```tsx
  'use client';

  import { useWorkspaceStore } from '../store/workspace-store';
  import { Greeting } from './greeting';
  import { MessageThread } from './message-thread';
  import { InputBar } from './input-bar';

  export function ChatSidebar() {
    const turns = useWorkspaceStore((s) => s.turns);
    const isEmpty = turns.length === 0;

    return (
      <aside
        className="flex h-full flex-col overflow-hidden border-r"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? <Greeting /> : <MessageThread />}
        </div>
        <InputBar />
      </aside>
    );
  }
  ```

## Task 6: Canvas components

- [ ] Create `src/features/workspace/canvas/empty-state.tsx`:
  ```tsx
  'use client';

  import Image from 'next/image';
  import { useMemo } from 'react';
  import { pickFeaturedToday } from '../featured-today';

  export function EmptyState() {
    const featured = useMemo(() => pickFeaturedToday(), []);
    const photo = featured.photos[0];

    return (
      <div className="flex h-full flex-col gap-4 px-6 py-6">
        <div
          className="mb-1"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Featured today
        </div>
        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-[22px] border"
          style={{
            aspectRatio: '4/3',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--elev-hero)',
          }}
        >
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 1280px) 60vw, 800px"
              className="object-cover"
              priority
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-display-sm)',
                  fontWeight: 400,
                  color: '#EDE6DB',
                  lineHeight: 1.1,
                }}
              >
                {featured.name}
              </p>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  color: 'rgba(237,230,219,0.7)',
                }}
              >
                {featured.location.region ?? featured.location.country}
                {featured.location.neighborhood ? ` · ${featured.location.neighborhood}` : ''}
              </p>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-display-sm)',
                color: 'var(--accent-primary)',
              }}
            >
              {featured.pricing.pricePerNight.amount}{' '}
              <span style={{ fontSize: 'var(--text-body-sm)' }}>
                {featured.pricing.pricePerNight.currency}
              </span>
            </p>
          </div>
        </div>
        <p
          className="max-w-md"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.5,
          }}
        >
          Tell me about your trip - or start with one of the suggestions.
        </p>
      </div>
    );
  }
  ```

- [ ] Create `src/features/workspace/canvas/shimmer-placeholder.tsx`:
  ```tsx
  'use client';

  export function ShimmerPlaceholder() {
    return (
      <div className="grid h-full grid-cols-2 grid-rows-[1.4fr_0.7fr_0.6fr] gap-3 px-6 py-6">
        <Cell className="col-span-2 rounded-[22px]" />
        <Cell className="rounded-[18px]" />
        <Cell className="rounded-[18px]" />
        <Cell className="col-span-2 rounded-[14px]" />
      </div>
    );
  }

  function Cell({ className }: { className?: string }) {
    return (
      <div
        className={`relative overflow-hidden border ${className ?? ''}`}
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--accent-primary-soft) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'stayscout-shimmer 1.6s linear infinite',
          }}
        />
        <style>{`
          @keyframes stayscout-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }
  ```

- [ ] Create `src/features/workspace/canvas/stay-list.tsx`:
  ```tsx
  'use client';

  import Image from 'next/image';
  import { motion } from 'framer-motion';
  import type { Stay } from '@core/stay';
  import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

  export function StayList({ hero, alternatives }: { hero: Stay; alternatives: Stay[] }) {
    return (
      <div className="grid h-full grid-cols-2 grid-rows-[1.4fr_0.7fr_0.6fr] gap-3 px-6 py-6">
        <HeroCard className="col-span-2" stay={hero} />
        {alternatives.slice(0, 2).map((s, i) => (
          <AltCard key={s.id} stay={s} index={i + 1} />
        ))}
      </div>
    );
  }

  function HeroCard({ stay, className }: { stay: Stay; className?: string }) {
    const reduced = useReducedMotion();
    const photo = stay.photos[0];
    return (
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: reduced ? 0.2 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-[22px] border ${className ?? ''}`}
        style={{ borderColor: 'var(--border-subtle)', boxShadow: 'var(--elev-hero)' }}
      >
        {photo && (
          <Image src={photo.url} alt={photo.alt} fill sizes="60vw" className="object-cover" priority />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.62) 100%)' }}
        />
        <span
          className="absolute top-3 left-3 rounded-full px-2 py-0.5"
          style={{
            background: 'var(--accent-primary)',
            color: '#14171C',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Top pick
        </span>
        <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
          <div>
            <p
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-display-sm)',
                fontWeight: 400,
                color: '#EDE6DB',
                lineHeight: 1.1,
              }}
            >
              {stay.name}
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: 'rgba(237,230,219,0.7)',
              }}
            >
              {stay.location.region ?? stay.location.country}
              {stay.location.neighborhood ? ` · ${stay.location.neighborhood}` : ''}
            </p>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-sm)',
              color: 'var(--accent-primary)',
            }}
          >
            {stay.pricing.pricePerNight.amount}{' '}
            <span style={{ fontSize: 'var(--text-body-sm)' }}>
              {stay.pricing.pricePerNight.currency}
            </span>
          </p>
        </div>
      </motion.div>
    );
  }

  function AltCard({ stay, index }: { stay: Stay; index: number }) {
    const reduced = useReducedMotion();
    const photo = stay.photos[0];
    return (
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{
          duration: reduced ? 0.2 : 0.6,
          delay: reduced ? 0 : index * 0.06,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative overflow-hidden rounded-[18px] border"
        style={{ borderColor: 'var(--border-subtle)', boxShadow: 'var(--elev-card)' }}
      >
        {photo && (
          <Image src={photo.url} alt={photo.alt} fill sizes="30vw" className="object-cover" />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)' }}
        />
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: '#EDE6DB',
              fontWeight: 500,
            }}
          >
            {stay.name}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body)',
              color: 'var(--accent-primary)',
            }}
          >
            {stay.pricing.pricePerNight.amount}
          </p>
        </div>
      </motion.div>
    );
  }
  ```

- [ ] Create `src/features/workspace/canvas/canvas.tsx`:
  ```tsx
  'use client';

  import { useWorkspaceStore } from '../store/workspace-store';
  import { selectCurrentTurn } from '../store/derived';
  import { EmptyState } from './empty-state';
  import { ShimmerPlaceholder } from './shimmer-placeholder';
  import { StayList } from './stay-list';

  export function Canvas() {
    const phase = useWorkspaceStore((s) => s.phase);
    const turn = useWorkspaceStore((s) => selectCurrentTurn(s));

    if (phase === 'idle' || !turn) {
      return <EmptyState />;
    }
    if (phase === 'shimmering' || phase === 'refining') {
      return <ShimmerPlaceholder />;
    }
    if (turn.proposal) {
      return <StayList hero={turn.proposal.hero} alternatives={turn.proposal.alternatives} />;
    }
    return <EmptyState />;
  }
  ```

## Task 7: Workspace shell + page wiring

- [ ] Create `src/features/workspace/workspace.tsx`:
  ```tsx
  'use client';

  import { Header } from '@/features/landing/header';
  import { ChatSidebar } from './chat-sidebar/chat-sidebar';
  import { Canvas } from './canvas/canvas';

  export function Workspace() {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <main className="grid min-h-0 flex-1 grid-cols-[38%_62%]">
          <ChatSidebar />
          <section className="min-h-0">
            <Canvas />
          </section>
        </main>
      </div>
    );
  }
  ```

- [ ] Replace `src/app/page.tsx`:
  ```tsx
  import { Workspace } from '@/features/workspace/workspace';

  export default function Page() {
    return <Workspace />;
  }
  ```

- [ ] Delete `src/features/landing/workspace-shell-placeholder.tsx`.

## Task 8: Tests

- [ ] Create `tests/workspace-store.test.ts` covering each event kind (10–12 tests).

- [ ] Create `tests/featured-today.test.ts` covering daily-rotation determinism (2 tests).

(Both written as pure-function tests - no React, no DOM.)

## Task 9: Final pipeline + manual smoke + tag

- [ ] Run:
  ```bash
  pnpm format
  pnpm typecheck
  pnpm lint
  pnpm format:check
  pnpm test
  pnpm build
  ```
- [ ] Tag:
  ```bash
  git tag -a slice-a7 -m "Slice A7 complete: Workspace + Chat Sidebar + Canvas (basic)"
  ```
- [ ] After A7, write the Slice A8 plan (Trip Board cinematic materialization).
