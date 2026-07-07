# StayScout Slice A8 - Trip Board Cinematic Materialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the structurally-correct-but-motion-light A7 stay list with the choreographed Trip Board materialization moment per spec §5.6. Hero card with Top pick badge, materialize→breathe motion sequence, photo with warm-bloom top + scrim bottom. Alternative cards with stagger. Reasoning chip strip with intent-vs-AI provenance distinction. Diff transition for `proposal.evolved` (cards present in both freeze, removed fade, added materialize, hero cross-fade on swap). "Why this changed" adaptation banner seam (renders when Slice B's RankingAgent emits adaptation notes). Hover states, prefers-reduced-motion fallbacks. After A8, the highest-leverage moment of the product - the showpiece - is polished.

**Architecture:** New folder `src/features/workspace/canvas/trip-board/` with focused components, each owning its motion. `<AnimatePresence>` with stable `stay.id` keys handles diff transitions for free - cards present in both proposals don't re-animate. Workspace store gains `currentTurn.adaptationNotes` + `proposal.adaptation` event handler so Slice B can surface the banner without UI changes.

**Tests:** Pure-function additions to `workspace-store.test.ts` for the new event. Visual components rely on manual verification + existing pipeline gates.

**Tech additions:** none.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §4.5, §4.7, §5.6, §5.7

---

## Slice A8 file structure

```
src/features/workspace/canvas/trip-board/
├── motion-tokens.ts              [new] shared timing constants
├── hero-stay-card.tsx            [new] hero with materialize→breathe + Top pick + bloom
├── alternative-card.tsx          [new] alt card with materialize + hover
├── reasoning-strip.tsx           [new] "Why these" chip row
├── adaptation-banner.tsx         [new] "Why this changed" - seam, Slice B activates
└── trip-board.tsx                [new] container with AnimatePresence diff transitions

src/features/workspace/canvas/canvas.tsx   [modify] use TripBoard, drop StayList
src/features/workspace/canvas/stay-list.tsx [delete] replaced by trip-board

src/features/workspace/store/workspace-store.ts [modify] adaptationNotes handling

tests/workspace-store.test.ts     [modify] add proposal.adaptation tests
```

Total: ~6 new files, 2 modified, 1 deleted.

---

## Task 1: Motion tokens

- [ ] Create `src/features/workspace/canvas/trip-board/motion-tokens.ts`:
  ```ts
  // Shared timing for the Trip Board materialization sequence (spec §5.6).
  // Values chosen to match the cinematic 700ms-total reveal.

  export const EASE_EMPHASIZED = [0.16, 1, 0.3, 1] as const;
  export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;
  export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

  // Materialization choreography (frame budget below).
  export const HERO_DURATION = 0.6;
  export const ALT_DURATION = 0.6;
  export const ALT_STAGGER = 0.06;
  export const REASONING_STRIP_DELAY = 0.4;
  export const REASONING_STRIP_DURATION = 0.35;
  export const BREATHE_DELAY_MS = 600;
  export const BREATHE_DURATION_S = 5;

  // Reduced-motion fallback duration (spec §4.5).
  export const REDUCED_DURATION = 0.2;

  // Refine flow timings (spec §5.7).
  export const REFINING_RIPPLE_DURATION = 1.4;
  export const HERO_SWAP_DURATION = 0.8;
  export const ADAPTATION_BANNER_LIFETIME_MS = 5000;
  ```

## Task 2: Reasoning strip

- [ ] Create `src/features/workspace/canvas/trip-board/reasoning-strip.tsx`:
  ```tsx
  'use client';

  import { motion } from 'framer-motion';
  import type { ReasoningChip } from '@core/trip-proposal';
  import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
  import {
    EASE_EMPHASIZED,
    REASONING_STRIP_DELAY,
    REASONING_STRIP_DURATION,
    REDUCED_DURATION,
  } from './motion-tokens';

  export function ReasoningStrip({
    highlights,
    totalCost,
  }: {
    highlights: ReasoningChip[];
    totalCost?: { amount: number; currency: string };
  }) {
    const reduced = useReducedMotion();

    return (
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{
          duration: reduced ? REDUCED_DURATION : REASONING_STRIP_DURATION,
          delay: reduced ? 0 : REASONING_STRIP_DELAY,
          ease: EASE_EMPHASIZED as unknown as number[],
        }}
        className="flex items-center gap-2 rounded-[14px] border px-3 py-2"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Why these
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {highlights.map((chip) => (
            <Chip key={`${chip.source}:${chip.label}`} chip={chip} />
          ))}
          {totalCost ? <TotalCostChip total={totalCost} /> : null}
        </div>
      </motion.div>
    );
  }

  function Chip({ chip }: { chip: ReasoningChip }) {
    const isAgent = chip.source === 'agent';
    return (
      <span
        className="rounded-full border px-2 py-0.5"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6875rem',
          background: isAgent ? 'var(--accent-primary-soft)' : 'var(--surface-overlay)',
          borderColor: isAgent ? 'var(--accent-primary-soft)' : 'var(--border-subtle)',
          color: isAgent ? 'var(--accent-primary)' : 'var(--ink-secondary)',
        }}
      >
        {chip.label}
      </span>
    );
  }

  function TotalCostChip({ total }: { total: { amount: number; currency: string } }) {
    return (
      <span
        className="rounded-full border px-2 py-0.5"
        style={{
          background: 'var(--surface-overlay)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.6875rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          total{' '}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '0.8125rem',
            color: 'var(--accent-primary)',
          }}
        >
          {total.amount.toLocaleString()} {total.currency}
        </span>
      </span>
    );
  }
  ```

## Task 3: Hero stay card

- [ ] Create `src/features/workspace/canvas/trip-board/hero-stay-card.tsx`:
  ```tsx
  'use client';

  import Image from 'next/image';
  import { motion } from 'framer-motion';
  import { useEffect, useState } from 'react';
  import type { Stay } from '@core/stay';
  import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
  import {
    BREATHE_DELAY_MS,
    BREATHE_DURATION_S,
    EASE_EMPHASIZED,
    HERO_DURATION,
    REDUCED_DURATION,
  } from './motion-tokens';

  /**
   * Hero stay card. Materialize choreography (spec §5.6):
   *   T+0    opacity 0→1, scale 0.96→1, blur(8px)→blur(0), 600ms ease-emphasized
   *   T+200  Top pick badge fades up, photo overlay begins
   *   T+600  switch to breathe loop - scale 1↔1.005, 5s infinite
   *
   * Reduced motion: 200ms cross-fade, no breathing.
   */
  export function HeroStayCard({ stay }: { stay: Stay }) {
    const reduced = useReducedMotion();
    const [stage, setStage] = useState<'materialize' | 'breathe'>('materialize');
    const photo = stay.photos[0];

    useEffect(() => {
      if (reduced) {
        setStage('breathe');
        return;
      }
      setStage('materialize');
      const t = setTimeout(() => setStage('breathe'), BREATHE_DELAY_MS);
      return () => clearTimeout(t);
    }, [stay.id, reduced]);

    return (
      <motion.div
        layoutId={`hero-${stay.id}`}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
        animate={
          stage === 'materialize'
            ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
            : { opacity: 1, scale: reduced ? 1 : [1, 1.005, 1], filter: 'blur(0px)' }
        }
        transition={
          stage === 'materialize'
            ? {
                duration: reduced ? REDUCED_DURATION : HERO_DURATION,
                ease: EASE_EMPHASIZED as unknown as number[],
              }
            : {
                duration: BREATHE_DURATION_S,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        whileHover={reduced ? undefined : { scale: 1.005 }}
        className="group relative flex-shrink-0 overflow-hidden rounded-[22px] border"
        style={{
          aspectRatio: '4/3',
          maxHeight: '60%',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--elev-hero)',
        }}
      >
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt}
            fill
            sizes="(max-width: 1280px) 60vw, 800px"
            className="object-cover"
            priority
          />
        ) : null}

        {/* Top-down warm bloom (spec §4.7) */}
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-[var(--dur-base)]"
          style={{
            background:
              'linear-gradient(180deg, rgba(212,165,116,0.18) 0%, transparent 35%)',
            opacity: 0.7,
          }}
        />

        {/* Bottom-up scrim - deepens slightly on hover */}
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-[var(--dur-base)] group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.62) 100%)',
            opacity: 0.92,
          }}
        />

        <motion.span
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? REDUCED_DURATION : 0.35,
            delay: reduced ? 0 : 0.2,
            ease: EASE_EMPHASIZED as unknown as number[],
          }}
          className="absolute top-3 left-3 rounded-full px-2.5 py-1"
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
        </motion.span>

        <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-3">
          <div>
            <p
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-display-sm)',
                fontWeight: 400,
                color: '#EDE6DB',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
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
              letterSpacing: '-0.01em',
            }}
          >
            {stay.pricing.pricePerNight.amount.toLocaleString()}{' '}
            <span style={{ fontSize: 'var(--text-body-sm)' }}>
              {stay.pricing.pricePerNight.currency}
            </span>
          </p>
        </div>
      </motion.div>
    );
  }
  ```

## Task 4: Alternative card

- [ ] Create `src/features/workspace/canvas/trip-board/alternative-card.tsx`:
  ```tsx
  'use client';

  import Image from 'next/image';
  import { motion } from 'framer-motion';
  import type { Stay } from '@core/stay';
  import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
  import {
    ALT_DURATION,
    ALT_STAGGER,
    EASE_EMPHASIZED,
    REDUCED_DURATION,
  } from './motion-tokens';

  /** Alternative card. Same materialize as hero, staggered 60ms per index. */
  export function AlternativeCard({ stay, index }: { stay: Stay; index: number }) {
    const reduced = useReducedMotion();
    const photo = stay.photos[0];

    return (
      <motion.div
        layout
        layoutId={`alt-${stay.id}`}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
        transition={{
          duration: reduced ? REDUCED_DURATION : ALT_DURATION,
          delay: reduced ? 0 : (index + 1) * ALT_STAGGER + 0.15,
          ease: EASE_EMPHASIZED as unknown as number[],
        }}
        whileHover={reduced ? undefined : { scale: 1.005 }}
        className="group relative aspect-[16/10] overflow-hidden rounded-[18px] border"
        style={{
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--elev-card)',
        }}
      >
        {photo ? (
          <Image src={photo.url} alt={photo.alt} fill sizes="30vw" className="object-cover" />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-[var(--dur-base)]"
          style={{
            background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)',
            opacity: 0.92,
          }}
        />
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2">
          <p
            className="truncate"
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
            className="flex-shrink-0"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body)',
              color: 'var(--accent-primary)',
            }}
          >
            {stay.pricing.pricePerNight.amount.toLocaleString()}
          </p>
        </div>
      </motion.div>
    );
  }
  ```

## Task 5: Adaptation banner (Slice B+ seam)

- [ ] Create `src/features/workspace/canvas/trip-board/adaptation-banner.tsx`:
  ```tsx
  'use client';

  import { AnimatePresence, motion } from 'framer-motion';
  import { useEffect, useState } from 'react';
  import type { AdaptationNote } from '@core/reasoning';
  import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
  import {
    ADAPTATION_BANNER_LIFETIME_MS,
    EASE_EMPHASIZED,
    REDUCED_DURATION,
  } from './motion-tokens';

  /**
   * "Why this changed" banner. Renders when proposal.adaptation events
   * arrive (Slice B+ via RankingAgent). Auto-dismisses after 5s. Slice
   * A's orchestrator never emits these so this component is silently
   * inactive in the current demo - but the wire is ready.
   */
  export function AdaptationBanner({ notes }: { notes: AdaptationNote[] }) {
    const reduced = useReducedMotion();
    const [visible, setVisible] = useState(notes.length > 0);

    useEffect(() => {
      if (notes.length === 0) {
        setVisible(false);
        return;
      }
      setVisible(true);
      const t = setTimeout(() => setVisible(false), ADAPTATION_BANNER_LIFETIME_MS);
      return () => clearTimeout(t);
    }, [notes]);

    return (
      <AnimatePresence>
        {visible && notes.length > 0 ? (
          <motion.div
            key="adaptation-banner"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{
              duration: reduced ? REDUCED_DURATION : 0.4,
              ease: EASE_EMPHASIZED as unknown as number[],
            }}
            className="rounded-[14px] border px-3 py-2"
            style={{
              background: 'var(--accent-primary-soft)',
              borderColor: 'var(--accent-primary-soft)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
              }}
            >
              Why this changed
            </span>
            <ul className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {notes.map((note, i) => (
                <li
                  key={`${note.signal}-${i}`}
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: 'var(--text-body-sm)',
                    fontStyle: 'italic',
                    color: 'var(--ink-primary)',
                  }}
                >
                  {note.description}
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }
  ```

## Task 6: Trip Board container

- [ ] Create `src/features/workspace/canvas/trip-board/trip-board.tsx`:
  ```tsx
  'use client';

  import { AnimatePresence } from 'framer-motion';
  import type { TripProposal } from '@core/trip-proposal';
  import type { AdaptationNote } from '@core/reasoning';
  import { HeroStayCard } from './hero-stay-card';
  import { AlternativeCard } from './alternative-card';
  import { ReasoningStrip } from './reasoning-strip';
  import { AdaptationBanner } from './adaptation-banner';

  export function TripBoard({
    proposal,
    adaptationNotes = [],
  }: {
    proposal: TripProposal;
    adaptationNotes?: AdaptationNote[];
  }) {
    const alts = proposal.alternatives.slice(0, 2);

    return (
      <div className="flex h-full flex-col gap-3 px-6 py-6">
        <AdaptationBanner notes={adaptationNotes} />

        <AnimatePresence mode="popLayout" initial={false}>
          <HeroStayCard key={proposal.hero.id} stay={proposal.hero} />
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {alts.map((s, i) => (
              <AlternativeCard key={s.id} stay={s} index={i} />
            ))}
          </AnimatePresence>
        </div>

        <ReasoningStrip
          highlights={proposal.reasoning.highlights}
          {...(proposal.reasoning.totalCost ? { totalCost: proposal.reasoning.totalCost } : {})}
        />
      </div>
    );
  }
  ```

## Task 7: Workspace store handles `proposal.adaptation`

- [ ] Modify `src/features/workspace/store/workspace-store.ts`:
  - Add `adaptationNotes: AdaptationNote[]` to `Turn`
  - In `beginTurn`, initialize `adaptationNotes: []`
  - Handle `proposal.adaptation` event → append to current turn's adaptationNotes

## Task 8: Wire Trip Board into canvas

- [ ] Modify `src/features/workspace/canvas/canvas.tsx`:
  ```tsx
  'use client';

  import { useWorkspaceStore } from '../store/workspace-store';
  import { selectCurrentTurn } from '../store/derived';
  import { EmptyState } from './empty-state';
  import { ShimmerPlaceholder } from './shimmer-placeholder';
  import { TripBoard } from './trip-board/trip-board';

  export function Canvas() {
    const phase = useWorkspaceStore((s) => s.phase);
    const turn = useWorkspaceStore((s) => selectCurrentTurn(s));

    if (phase === 'idle' || !turn) return <EmptyState />;
    if (phase === 'shimmering') return <ShimmerPlaceholder />;
    if (turn.proposal) {
      return <TripBoard proposal={turn.proposal} adaptationNotes={turn.adaptationNotes ?? []} />;
    }
    if (phase === 'refining') return <ShimmerPlaceholder />;
    return <EmptyState />;
  }
  ```
- [ ] Delete `src/features/workspace/canvas/stay-list.tsx`.

## Task 9: Test additions

- [ ] In `tests/workspace-store.test.ts`, add a test for `proposal.adaptation`.

## Task 10: Final pipeline + tag

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
  git tag -a slice-a8 -m "Slice A8 complete: Trip Board cinematic materialization"
  ```
- [ ] After A8, write the Slice A9 plan (Refine flow polish + Compare mode + Memory hints + Detail view).
