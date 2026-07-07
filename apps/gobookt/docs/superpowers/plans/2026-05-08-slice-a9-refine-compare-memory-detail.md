# StayScout Slice A9 - Refine Polish + Compare + Memory + Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Surface the four remaining seam-only features as visible UI, completing the workspace experience. Refine flow gets a synthesized adaptation note pass (banner actually fires in Slice A - Slice B's RankingAgent replaces with real notes). Compare mode lands as pin/unpin actions on cards + bottom tray + side-by-side modal. Memory hints render as a subtle italic tile in the chat sidebar when `MemoryHinter` detects a session pattern. Detail panel slides in from the right on stay-card click. After A9, the workspace is feature-complete; A10 is the marketing surface and mobile + deploy.

**Architecture:** Workspace store gains `compareSet`, `detailViewStayId`, `memoryHint`. New `src/lib/memory-hinter/` library - pure heuristic over completed turns, no LLM. Orchestrator wires the hinter post-turn and emits `concierge.memory.hint` when triggered. Synthesized adaptation lives in `src/orchestrator/synthesize-adaptation.ts` - derives notes from `IntentDelta`. UI: pin button on hero + alt cards, `<CompareTray>` floating at bottom of canvas, `<CompareView>` modal, `<DetailPanel>` slide-in, `<MemoryHintTile>` in chat sidebar.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §5.7–5.10, §6.2

---

## Slice A9 file structure

```
src/lib/memory-hinter/
├── memory-hinter.ts             [new] heuristic detector
└── index.ts                     [new] barrel

src/orchestrator/
├── synthesize-adaptation.ts     [new] IntentDelta → AdaptationNote[]
└── orchestrator.ts              [modify] wire MemoryHinter + adaptation synth

src/features/workspace/store/
└── workspace-store.ts           [modify] compareSet + detailViewStayId + memoryHint + actions

src/features/workspace/canvas/trip-board/
├── pin-button.tsx               [new] toggle compare pin
├── hero-stay-card.tsx           [modify] add pin button + onClick → openDetail
└── alternative-card.tsx         [modify] same

src/features/workspace/canvas/
├── compare-tray.tsx             [new] floating bottom strip
├── compare-view.tsx             [new] modal side-by-side
└── canvas.tsx                   [modify] mount CompareTray + DetailPanel + CompareView

src/features/workspace/detail/
├── detail-panel.tsx             [new] side-panel slide-in
└── confirm-redirect-modal.tsx   [new] booking placeholder

src/features/workspace/chat-sidebar/
├── memory-hint-tile.tsx         [new] subtle italic tile
└── chat-sidebar.tsx             [modify] mount above thread

src/features/shared/icons/index.ts [modify] add Bookmark, BookmarkCheck, ExternalLink

tests/
├── memory-hinter.test.ts        [new]
├── synthesize-adaptation.test.ts[new]
└── workspace-store.test.ts      [modify] +pin/detail/hint tests
```

Total: ~12 new files, ~6 modified.

---

## Task 1: MemoryHinter library

- [ ] Create `src/lib/memory-hinter/memory-hinter.ts`:
  ```ts
  import type { MemoryHint } from '@core/memory';
  import type { TripIntent, VibeTag } from '@core/trip-intent';

  export interface CompletedTurn {
    intent: TripIntent;
  }

  /**
   * Session-scoped heuristic detector. Slice A pattern: 3+ turns sharing a
   * vibe tag → fire a hint about that preference. Fires at most once per
   * session - once the orchestrator emits the hint, it should call
   * markFired() so we don't repeat.
   *
   * Slice C replaces this with the real Memory Agent reading from pgvector
   * cross-session. Same MemoryHint output shape; the orchestrator's
   * concierge.memory.hint event wire stays identical.
   */
  export class MemoryHinter {
    private observed: CompletedTurn[] = [];
    private fired = false;
    private static MIN_OBSERVATIONS = 3;

    observeTurn(turn: CompletedTurn): void {
      this.observed.push(turn);
    }

    /**
     * Evaluate the observed turns. Returns a hint if the threshold is met
     * AND we haven't fired one yet this session. Otherwise null.
     */
    evaluate(): MemoryHint | null {
      if (this.fired) return null;
      if (this.observed.length < MemoryHinter.MIN_OBSERVATIONS) return null;

      const tally = this.tallyVibeTags();
      const dominant = pickDominant(tally, MemoryHinter.MIN_OBSERVATIONS);
      if (!dominant) return null;

      const message = phraseFor(dominant.tag);
      if (!message) return null;
      return {
        message,
        signalKey: dominant.tag,
        confidence: clamp(dominant.count / this.observed.length, 0, 1),
      };
    }

    markFired(): void {
      this.fired = true;
    }

    reset(): void {
      this.observed = [];
      this.fired = false;
    }

    private tallyVibeTags(): Map<VibeTag, number> {
      const tally = new Map<VibeTag, number>();
      for (const turn of this.observed) {
        const seen = new Set<VibeTag>();
        for (const tag of turn.intent.vibe.tags) {
          if (seen.has(tag)) continue;
          seen.add(tag);
          tally.set(tag, (tally.get(tag) ?? 0) + 1);
        }
      }
      return tally;
    }
  }

  function pickDominant(
    tally: Map<VibeTag, number>,
    threshold: number,
  ): { tag: VibeTag; count: number } | null {
    let best: { tag: VibeTag; count: number } | null = null;
    for (const [tag, count] of tally.entries()) {
      if (count < threshold) continue;
      if (!best || count > best.count) best = { tag, count };
    }
    return best;
  }

  // Phrasings keyed by vibe tag. Restrained - never anthropomorphic, never
  // editorialising. If a tag isn't here, we don't fire (better silent than corny).
  const PHRASINGS: Partial<Record<VibeTag, string>> = {
    walkable: 'You seem to prefer walkable destinations.',
    'avoid-tourist-traps': 'You consistently steer away from tourist traps.',
    slow: 'You seem to gravitate toward slower-paced trips.',
    luxury: 'You consistently lean toward higher-end stays.',
    'family-friendly': 'Family-friendly seems to be a constant for you.',
    foodie: "Food keeps coming up - you're a foodie traveler.",
    cultural: 'You consistently include cultural depth in your trips.',
    nature: 'Nature settings recur in your trips.',
    beach: 'Beach destinations seem to be a draw.',
    mountains: 'Mountains keep coming up in your travel.',
    remote: 'You consistently choose remote, quieter places.',
    urban: 'You gravitate toward dense urban destinations.',
    wellness: 'Wellness seems to be a recurring priority.',
    romantic: 'Romantic settings keep coming up.',
  };

  function phraseFor(tag: VibeTag): string | null {
    return PHRASINGS[tag] ?? null;
  }

  function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
  }
  ```

- [ ] Create `src/lib/memory-hinter/index.ts`:
  ```ts
  export * from './memory-hinter';
  ```

## Task 2: Synthesize adaptation notes

- [ ] Create `src/orchestrator/synthesize-adaptation.ts`:
  ```ts
  import type { AdaptationNote } from '@core/reasoning';
  import type { IntentDelta } from '@core/intent-delta';

  /**
   * Slice A synthesizer - derives AdaptationNotes from a structural
   * IntentDelta. Slice B's RankingAgent replaces with real reasoning. The
   * note `description` is restrained-editorial, not chatty.
   */
  export function synthesizeAdaptationNotes(delta: IntentDelta): AdaptationNote[] {
    const notes: AdaptationNote[] = [];

    for (const change of delta.changed) {
      if (change.key === 'vibe') {
        const before = (change.before as { tags: string[] } | undefined)?.tags ?? [];
        const after = (change.after as { tags: string[] } | undefined)?.tags ?? [];
        const beforeSet = new Set(before);
        const afterSet = new Set(after);
        for (const t of after) {
          if (!beforeSet.has(t)) {
            notes.push({
              description: `Prioritized ${humanize(t)}`,
              signal: t,
              direction: 'up',
            });
          }
        }
        for (const t of before) {
          if (!afterSet.has(t)) {
            notes.push({
              description: `Reduced ${humanize(t)} weighting`,
              signal: t,
              direction: 'down',
            });
          }
        }
      } else if (change.key === 'budget') {
        notes.push({
          description: 'Adjusted budget weighting',
          signal: 'budget',
          direction: 'add',
        });
      } else if (change.key === 'duration') {
        notes.push({
          description: 'Adjusted trip length',
          signal: 'duration',
          direction: 'add',
        });
      } else if (change.key === 'destinations') {
        notes.push({
          description: 'Updated destination set',
          signal: 'destinations',
          direction: 'add',
        });
      }
    }

    return notes;
  }

  function humanize(tag: string): string {
    return tag.replace(/-/g, ' ');
  }
  ```

## Task 3: Orchestrator wires hinter + adaptation

- [ ] Modify `src/orchestrator/orchestrator.ts`:
  - Add `MemoryHinter` import + private instance
  - Add `import { synthesizeAdaptationNotes }`
  - On refine turns, after `intent.refined`, compute notes from delta and emit `proposal.adaptation` *before* `proposal.evolved`
  - On `turn.completed`, call `memoryHinter.observeTurn({intent})`, then `evaluate()` - if a hint emerges, emit `concierge.memory.hint` and call `markFired()`

  (Implement carefully - the memory hint emission must come *before* `turn.completed` per the wire format.)

## Task 4: Workspace store extensions

- [ ] Modify `src/features/workspace/store/workspace-store.ts`:
  - State: `compareSet: string[]`, `detailViewStayId: string | null`, `memoryHint: MemoryHint | null`
  - Actions: `pinStay(id)`, `unpinStay(id)`, `openDetail(id)`, `closeDetail()`
  - Pin enforces `max 3` - adding a 4th rotates oldest out
  - Dispatch handler for `concierge.memory.hint` → `set({memoryHint: {…}})`

## Task 5: Icon barrel additions

- [ ] Modify `src/features/shared/icons/index.ts` - re-export `Bookmark`, `BookmarkCheck`, `ExternalLink`, `Pin` from lucide.

## Task 6: Pin button + card hookups

- [ ] Create `src/features/workspace/canvas/trip-board/pin-button.tsx`:
  ```tsx
  'use client';

  import { Bookmark, BookmarkCheck } from '@/features/shared/icons';
  import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

  export function PinButton({ stayId, variant = 'overlay' }: { stayId: string; variant?: 'overlay' | 'inline' }) {
    const compareSet = useWorkspaceStore((s) => s.compareSet);
    const pinStay = useWorkspaceStore((s) => s.pinStay);
    const unpinStay = useWorkspaceStore((s) => s.unpinStay);
    const isPinned = compareSet.includes(stayId);
    const Icon = isPinned ? BookmarkCheck : Bookmark;

    return (
      <button
        type="button"
        aria-label={isPinned ? 'Unpin from compare' : 'Pin to compare'}
        onClick={(e) => {
          e.stopPropagation();
          isPinned ? unpinStay(stayId) : pinStay(stayId);
        }}
        className="grid h-8 w-8 place-items-center rounded-full backdrop-blur-[10px] transition-colors duration-[var(--dur-fast)]"
        style={{
          background: variant === 'overlay' ? 'rgba(0,0,0,0.32)' : 'var(--surface-overlay)',
          color: isPinned ? 'var(--accent-primary)' : '#EDE6DB',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      >
        <Icon size={14} strokeWidth={1.8} />
      </button>
    );
  }
  ```

- [ ] Modify `hero-stay-card.tsx` and `alternative-card.tsx` to:
  - Render `<PinButton>` overlay (top-right corner)
  - Add `onClick` handler: `openDetail(stay.id)` from store

## Task 7: Compare tray + view

- [ ] Create `src/features/workspace/canvas/compare-tray.tsx`:
  - Floating strip pinned to the bottom of the canvas
  - Renders pinned stays as 48×48 thumbnails with name on hover
  - "Compare" button on the right opens `<CompareView>`
  - "Clear" button removes all pins
  - Auto-hides when `compareSet.length === 0`
  - Slides up via Framer Motion when first stay pinned

- [ ] Create `src/features/workspace/canvas/compare-view.tsx`:
  - Modal dialog (Esc/click-outside to close)
  - Side-by-side cards (max 3) showing photo, name, region, price-per-night, sleeps, walkability/familyFit if present, primary tags
  - Highlights price differences (cheapest in gold, others in ink)
  - "Close" + "Clear all" buttons in header

## Task 8: Detail panel + booking modal

- [ ] Create `src/features/workspace/detail/detail-panel.tsx`:
  - Side panel slides in from right (480px wide)
  - Photo at top (4:3), then name + region, description, amenity chips, price + sleeps row, "Continue to Booking →" CTA
  - Close via Esc / click-outside / X button
  - Affiliate disclosure: small italic line "*StayScout earns affiliate commission on bookings. Prices identical.*"
  - Click CTA → opens `<ConfirmRedirectModal>`

- [ ] Create `src/features/workspace/detail/confirm-redirect-modal.tsx`:
  - Small modal: "Slice A demo - booking redirect lives in Slice B." + Close

## Task 9: Memory hint tile

- [ ] Create `src/features/workspace/chat-sidebar/memory-hint-tile.tsx`:
  - Reads `memoryHint` from store
  - Renders subtle italic tile with sparkle prefix; nothing if null
  - Sits between greeting/thread and the input bar

## Task 10: Canvas + sidebar mounting

- [ ] Modify `canvas.tsx` to mount `<CompareTray>`, `<CompareView>` (gated on UI state), `<DetailPanel>` (gated on `detailViewStayId`)
- [ ] Modify `chat-sidebar.tsx` to mount `<MemoryHintTile>` above the thread

## Task 11: Tests

- [ ] `tests/memory-hinter.test.ts` - threshold not met, threshold met, fires once, reset
- [ ] `tests/synthesize-adaptation.test.ts` - vibe added/removed, budget changed, no changes
- [ ] `tests/workspace-store.test.ts` - +pin/unpin (max 3, oldest rotates), open/close detail, memory hint dispatch

## Task 12: Final pipeline + tag

- [ ] Run pipeline; tag `slice-a9`.
