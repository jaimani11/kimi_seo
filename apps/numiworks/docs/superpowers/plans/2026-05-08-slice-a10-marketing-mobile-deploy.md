# StayScout Slice A10 - Marketing + Mobile + Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land the four below-fold marketing sections (How It Works → Featured Stays in light-mode break → Why StayScout → Footer), the mobile fallback for the workspace, and ship-ready README + Vercel config. After A10, Slice A is complete: a single page that opens with the cinematic workspace and scrolls into a calm marketing narrative below the fold.

**Architecture:** Marketing sections live in `src/features/marketing/` and are RSC (Server Components) - no client JS, fast first paint, SEO-friendly. They sit *below* the `<Workspace>` (which stays a single 100vh client island). Mobile fallback uses Tailwind responsive breakpoints to stack the chat sidebar below the canvas at `<md` (768px). README + Vercel config get final-pass polish.

**Tech additions:** none.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §5.11–5.16

---

## Slice A10 file structure

```
src/features/marketing/
├── how-it-works.tsx              [new] sticky-scroll 3-step narrative
├── featured-stays.tsx            [new] light-mode boutique break
├── why-stayscout.tsx             [new] 3 calm tiles
└── footer.tsx                    [new] wordmark + status + disclosure

src/features/workspace/workspace.tsx  [modify] mobile responsive layout
src/app/page.tsx                  [modify] mount marketing sections below workspace
src/app/layout.tsx                [modify] allow page to scroll past the workspace fold

README.md                         [modify] Slice A complete + curl example
docs/superpowers/specs/...        unchanged

tests/                            no new tests (RSC visual sections)
```

---

## Task 1: How It Works section

- [ ] Create `src/features/marketing/how-it-works.tsx`:
  - Three steps, ~80vh each, sticky-scroll
  - Step 1: "You write a sentence." - input pill illustration
  - Step 2: "Specialized agents do the work." - three agent rows
  - Step 3: "You stay in control." - Trip Board hero preview
  - Cool blue bloom background overlay (var(--bloom-cool))
  - Server Component (no `'use client'`)

## Task 2: Featured Stays section

- [ ] Create `src/features/marketing/featured-stays.tsx`:
  - Headline: "Hand-selected by the concierge."
  - Pulls 6 stays from `ALL_STAYS` (deterministic - first 6 in registry order)
  - Cards: 16:10 photo, stay name (Fraunces), 1-line italic description, price
  - Uses fixed `--featured-*` tokens (cream + olive + clay) regardless of global theme
  - Section background gradient transitions from `--surface-base` to `--featured-bg`

## Task 3: Why StayScout section

- [ ] Create `src/features/marketing/why-stayscout.tsx`:
  - Three calm tiles, 2-col on desktop, 1-col on mobile
  - "Specialized agents, not a chatbot." + multi-agent visual
  - "Honest about how we make money." + affiliate disclosure copy
  - "Memory that improves with you." + preference learning copy

## Task 4: Footer

- [ ] Create `src/features/marketing/footer.tsx`:
  - One-line: wordmark · status badge · affiliate disclosure · theme toggle mirror
  - Theme toggle reuses `<ThemeToggle>` from `src/lib/theme/`

## Task 5: Workspace mobile fallback

- [ ] Modify `src/features/workspace/workspace.tsx`:
  - Desktop (≥md): existing `grid-cols-[38%_62%]` layout
  - Mobile (<md): `grid-rows-[60vh_40vh]` with canvas above, chat below
  - Header stays the same
  - Chat sidebar at <md drops the right border, gets a top border instead

## Task 6: Page wiring

- [ ] Modify `src/app/page.tsx`:
  - Render `<Workspace />` followed by marketing sections
  - Page scrolls past 100vh workspace into the sections

- [ ] Modify `src/app/layout.tsx` if needed to allow scroll

## Task 7: README polish

- [ ] Update `README.md`:
  - Mark Slice A complete; check off A1–A10
  - Add a "Try it" section with curl example
  - Add architecture-diagram section noting the JSONL stream
  - Note the demo runs against real Anthropic API (requires key)

## Task 8: Final pipeline + tag

- [ ] Run pipeline + tag both `slice-a10` and `slice-a` (Slice A complete).
