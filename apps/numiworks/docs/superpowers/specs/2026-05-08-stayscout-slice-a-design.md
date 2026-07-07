# StayScout AI - Slice A Design

**Document type:** Design specification
**Project:** StayScout AI - AI-native travel discovery & booking orchestration platform
**Slice:** A · Cinematic Foundation
**Date:** 2026-05-08
**Status:** Approved (sections 1–7), pending user review of full document

---

## 0. Context

StayScout AI is a multi-agent travel orchestration platform that sits above existing inventory sources (Vrbo, Expedia, Booking.com, Hotelbeds, Skyscanner, Viator) and provides:

- intent-aware search & ranking
- a curated trip-board interaction model
- long-term memory and personalization
- monitoring of saved trips
- (eventually) autonomous booking coordination

The platform owns no inventory. It aggregates, reasons, ranks, orchestrates, recommends, monitors, learns, and monetizes via affiliate flows.

This document specifies **Slice A** - the cinematic foundation. Slice A is the first of four planned slices:

- **Slice A** - cinematic frontend + conversational experience + Intent + MoodSnapshot agents + mock+synthesized provider layer + refine flow + compare seam
- **Slice B** - Postgres + auth + multi-agent orchestrator (LangGraph) + real provider integrations + observability + affiliate infrastructure + programmatic SEO
- **Slice C** - pgvector memory + monitoring + itinerary agent + admin panel + premium tier + PWA mobile
- **Slice D** - autonomous booking (approval-gated → autonomous) + trip protection + advanced monitoring rules

The architecture in this document is designed so Slices B–D are **additive** - new files in existing folders, no protocol or UI refactors.

### 0.1 Slice A North Star

> *"If an investor, traveler, or partner used this for two minutes, they would immediately understand the vision and emotionally feel the future of AI-native travel orchestration."*

Slice A optimizes for **emotional feel, UX quality, trust, polish, cinematic interaction quality, and believable AI orchestration** - not for full production travel infrastructure. The believability of the demo is the highest-leverage thing in the whole slice.

---

## 1. Decisions Reference

All decisions made during brainstorming, in one table:

| Axis | Decision | Rationale |
|---|---|---|
| Aesthetic | **B · Cinematic Dark** primary + **C-derived warm boutique** light mode | Distinctive vs every existing travel site (which are all warm-light); dual-mode preserves both moods |
| Conversation pattern | **3 · Split chat sidebar + spatial canvas** | Most "concierge"-like; supports multi-stay future |
| Entry model | **E3 · Hybrid** - workspace at fold + marketing below | Removes click between marketing and product; transforms on engagement |
| Canvas layout | **CB · Trip Board** - hero + alternatives + reasoning | A concierge hands you a *proposal*, not a search result list |
| Streaming UX | **SC · Combined** - agent steps in chat + shimmer in canvas | Both regions of screen alive; named-agent step list IS the multi-agent vision |
| Mock data | **Hybrid** (1c) - curated Italy + LLM-synthesized fallback with preview badge | Believability for primary demo path, breadth for fallback |
| Auth scope | **Anonymous session** (cookie-bound) | Removes friction; persists state without user model |
| Provider abstraction | **Build now**, ship one mock + one synthesized impl | Two-file pattern; real providers slot in cleanly |
| LLM provider | **Claude only** (haiku-4-5 for streaming intent, sonnet-4-6 for richer reasoning) | Existing API access; prompt caching strong; structured outputs solid |
| Marketing sections | How It Works → Featured Stays (light-mode break) → Why StayScout → Footer | Calm scroll narrative; single page |
| Stack | Next.js 15 App Router + TS + Tailwind v4 + shadcn/ui + Framer Motion + Lucide + Vercel AI SDK + TanStack Query + Zustand + Fraunces × Inter × Geist Mono via `next/font` + pnpm | Fast, well-trodden, additive |
| Mobile fidelity | Desktop-first, graceful mobile (bottom-sheet rough) | Slice A is a demo; thumb-first redesign is Slice B |
| Deploy target | Vercel preview | Same cost as local; shareable URL |
| Architecture pattern | **Approach 2 · Architected Monolith with Orchestrator** | Strict folder boundaries + typed JSONL events + Orchestrator class; converts mechanically to Turborepo monorepo when needed |

---

## 2. High-Level Architecture

### 2.1 Runtime topology

Single Next.js 15 App Router app on **Node runtime** (not Edge - we want `fs` for the curated seed and don't need Edge's cold-start profile yet), deployed to Vercel.

### 2.2 Layered structure

ESLint-enforced boundaries via `eslint-plugin-boundaries`. Folders map 1:1 to future Turborepo packages - when monorepo split is wanted, it's a `git mv` and a `package.json` per folder.

```
src/
  core/           types & contracts only - no runtime, no React, no Next imports
  agents/         Agent implementations             ← deps: core, lib
  providers/      Provider implementations          ← deps: core, lib
  orchestrator/   Orchestrator + event stream      ← deps: core, agents, providers, lib
  lib/            model client, JSONL streaming, fonts, photos, session,
                  quality (taste lint), curation (curated moods/voice templates),
                  evaluation (interfaces) ← deps: core
  features/       UI features by domain (landing, workspace, shared) ← deps: anything except app
  app/            Next.js routes - thin glue only   ← deps: anything
  styles/         design tokens, globals
```

Allowed import direction: `app → features → orchestrator → agents/providers → lib → core`. The reverse is a CI failure.

### 2.3 Server / client split

- `/` page - RSC for marketing sections (How It Works, Featured Stays, Why StayScout, Footer). Single Client boundary at the workspace shell so marketing stays static-fast.
- Workspace - fully client-side (Zustand state, streaming consumer, Framer Motion). One client component at the root; everything below it.
- `/api/concierge` - Node runtime route handler. Returns `Response` with a `ReadableStream<Uint8Array>` of JSONL events.

### 2.4 Request flow

```
[Browser] user types in chat input
   │  POST /api/concierge { messages, sessionId, turnId, type, input }
   ▼
[Route handler · src/app/api/concierge/route.ts]
   thin glue: parses request, opens JSONL response stream, hands writer to Orchestrator
   ▼
[Orchestrator · src/orchestrator]
   emits OrchestratorEvent stream as it walks its agent graph
     · session.started? · turn.started
     · agent.step.started("intent")
     · IntentAgent.run() → TripIntent
     · agent.step.completed("intent")
     · provider.search.completed
     · proposal.shimmering
     · proposal.ready / proposal.evolved
     · MoodSnapshotAgent.run() (non-blocking, post-proposal)
     · concierge.memory.hint? (if MemoryHinter threshold met)
     · turn.completed
   ▼
[Browser] reads JSONL, dispatches typed events into Zustand store
   chat sidebar renders agent steps; canvas renders shimmer → trip board
```

---

## 3. Core Contracts

All types live in `src/core/`. No runtime, no React, no Next imports.

### 3.1 Domain types

#### `TripIntent`

What the Intent Agent extracts from natural language.

```ts
type TripIntent = {
  destinations: Destination[];          // multi-city ready
  dates: TripDates;                     // discriminated: specific | flexible-month | flexible-season | unspecified
  duration: { nights: number; flexible: boolean };
  travelers: { adults; children; infants; groupKind? };
  budget: BudgetIntent;                 // total | per-night | unspecified, with flexibility
  vibe: { tags: VibeTag[] };            // closed taxonomy union - no string drift
  preferences: { amenities; avoid; transportation?; accessibility? };
  caveats: string[];                    // "no tourist traps", "wife is gluten-free"
  rawInput: string;                     // original text always preserved
  confidence: Partial<Record<keyof TripIntent, number>>;
};
```

`VibeTag` is a closed string union (`'luxury' | 'walkable' | 'family-friendly' | …`). Future enrichment fields (pace, luxury tolerance, social vs private style, food priority, spontaneity vs structure) are added as additional optional fields on `TripIntent` in Slice B/C - additive, not replacing.

#### `Stay`

Canonical accommodation shape across all providers.

```ts
type Stay = {
  id: StayId;                           // namespaced: `${providerId}:${nativeId}`
  providerId: ProviderId;
  name: string;
  type: 'hotel' | 'villa' | 'apartment' | 'farmhouse' | 'agriturismo' | 'palazzo' | 'guesthouse';
  location: StayLocation;               // country, region, locality, neighborhood, coordinates
  description: string;                  // 1–2 sentence editorial concierge voice
  photos: StayPhoto[];                  // {url, source, credit, license, alt}
  pricing: StayPricing;                 // pricePerNight, totalForStay?, fees?, cancellation
  amenities: Amenity[];
  capacity: { sleeps; bedrooms?; bathrooms? };
  rating?: { score; reviewCount; source? };
  signals: StaySignals;                 // walkability, familyFit, remoteness, noise, tags
  bookingLink: BookingLink;             // url, type: 'redirect' | 'autonomous', attribution?
  trustAnnotations?: TrustAnnotation[]; // Slice B+: {label, evidence, confidence, sourceCount?}
  dataQuality?: DataQuality;            // Slice B+: completeness, reviewQuality, priceConsistency, amenityVerification
  advantages?: ProviderAdvantage[];     // Slice B+: orchestrator-computed claims like 'best-price-from-vrbo'
  fetchedAt: string;
};
```

#### `TripProposal`

What the canvas renders.

```ts
type TripProposal = {
  intent: TripIntent;
  hero: Stay;
  alternatives: Stay[];                 // 2–4 stays
  reasoning: { highlights: ReasoningChip[]; summary: string; totalCost? };
  agentTrace: AgentTraceSummary;
  generatedAt: string;
};
```

### 3.2 Agent interface

```ts
interface Agent<I, O> {
  readonly id: AgentId;
  readonly name: string;
  readonly version: string;
  run(input: I, ctx: AgentContext): Promise<O>;
}

interface AgentContext {
  signal: AbortSignal;
  emit: AgentEventEmitter;
  modelClient: ModelClient;
  traceLogger: TraceLogger;
  memory?: MemoryContext;               // Slice C populates
  providerRegistry: ProviderRegistry;
}
```

Slice A ships:
- `IntentAgent: Agent<{ rawInput; priorIntent? }, TripIntent>`
- `MoodSnapshotAgent: Agent<{ destination }, MoodSnapshot>`

Slice B+ adds `SearchAgent`, `RankingAgent`, `WeatherAgent`, `EventEnrichmentAgent`, `MemoryAgent`, `ItineraryAgent`, `MonitoringAgent`, `BookingAgent` - all conforming to the same interface.

### 3.3 Provider interface

```ts
interface Provider {
  readonly id: ProviderId;
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;
  search(q: ProviderSearchQuery, ctx: ProviderContext): Promise<ProviderSearchResult>;
  // Slice B+ optional methods (capability-gated):
  // getDetails?(id): Promise<StayDetails>;
  // getAvailability?(id, dates): Promise<Availability>;
  // book?(id, params): Promise<BookingConfirmation>;
}

interface ProviderCapabilities {
  realtime: boolean;
  affiliateAttribution: boolean;
  supportsAvailability: boolean;
  supportsBooking: boolean;
  regions?: ISO3166[];
}

interface ProviderSearchQuery {
  destinations: Destination[];
  dates: TripDates;
  travelers: TravelerComposition;
  budget?: BudgetIntent;
  filters?: ProviderFilters;
  limit?: number;
  compareSet?: StayId[];                // ranking-aware comparison seam (Slice B uses)
  temporalContext?: TemporalContext;    // Slice B populates: seasonality, localEvents, weatherForecast
}

interface ProviderSearchResult {
  stays: Stay[];
  badges: ProviderBadge[];              // 'preview' for synthesized - auto UI surface
  pagination?: { cursor?: string; hasMore: boolean };
  freshness: FreshnessInfo;             // {fetchedAt, dataMaxAgeMs, priceMaxAgeMs?, source: 'live'|'cached'|'synthesized'}
}
```

A real provider (e.g., `BookingComProvider`) is one folder with three files: `index.ts`, `mapper.ts`, `affiliate-attribution.ts` (Slice B). The Provider interface is sacred - every real-world inventory source must fit through it (with sibling `FlightProvider`, `ActivityProvider` interfaces for fundamentally different domains).

### 3.4 `OrchestratorEvent` - the wire format

Discriminated union by `kind`. The Zustand store has one reducer that pattern-matches.

```ts
type OrchestratorEvent =
  // session / turn lifecycle
  | { kind: 'session.started';   sessionId; timestamp }
  | { kind: 'turn.started';      turnId; type: 'compose' | 'refine'; priorTurnId? }
  | { kind: 'turn.completed';    turnId; durationMs; partial?: PartialnessReport }
  | { kind: 'turn.failed';       turnId; error; recoverable }

  // agent step lifecycle
  | { kind: 'agent.step.started';   turnId; stepId; agentId; label }
  | { kind: 'agent.step.progress';  turnId; stepId; message?; counter? }
  | { kind: 'agent.step.completed'; turnId; stepId; durationMs }
  | { kind: 'agent.step.failed';    turnId; stepId; error; recoverable }

  // explanations (transparency seam)
  | { kind: 'agent.explanation'; turnId; agentId; topic: ExplanationTopic; summary; confidence? }

  // intent
  | { kind: 'intent.extracted'; turnId; intent: TripIntent }
  | { kind: 'intent.refined';   turnId; intent: TripIntent; delta: IntentDelta }

  // provider
  | { kind: 'provider.search.completed'; turnId; providerId; staysFound; badges; freshness }

  // proposal lifecycle
  | { kind: 'proposal.shimmering';  turnId; expectedCount }
  | { kind: 'proposal.refining';    turnId; priorProposalRef: ProposalRef }
  | { kind: 'proposal.adaptation';  turnId; notes: AdaptationNote[] }
  | { kind: 'proposal.ready';       turnId; proposal: TripProposal }
  | { kind: 'proposal.evolved';     turnId; proposal: TripProposal; diff: ProposalDiff }
  | { kind: 'proposal.bookmarkable';turnId; ref: ProposalRef; storage: 'session' | 'persistent' }
  | { kind: 'proposal.provenance.computed'; turnId; provenanceMap }

  // concierge voice
  | { kind: 'concierge.message';     turnId; message; tone? }
  | { kind: 'concierge.memory.hint'; turnId; message; signalKey; confidence }

  // mood snapshot (out-of-band; can fire any time after proposal)
  | { kind: 'mood.snapshot.ready';   turnId; destinationName; snapshot: MoodSnapshot };
```

`turnId` ties events together and dedupes idempotent retries. `agent.step.*` events are **infrastructure** events; `intent.*`, `proposal.*`, `concierge.*`, `mood.*` are **domain** events. Adding agents never grows the step-event schema; adding domain events never touches the step UI.

### 3.5 `ModelClient`

```ts
interface ModelClient {
  generate<T>(req: {
    model: ModelId;             // 'claude-haiku-4-5' | 'claude-sonnet-4-6' | future
    system?: string;
    messages: ModelMessage[];
    responseSchema?: ZodSchema<T>;
    cacheKey?: string;
    maxTokens?: number;
  }): Promise<T>;
  stream(req: StreamRequest): AsyncIterable<StreamChunk>;
}
```

Slice A impl: `AnthropicModelClient` with prompt caching enabled. Slice B can add `RoutedModelClient` selecting Claude/OpenAI/Gemini per agent - agents stay unchanged because they only depend on the interface.

### 3.6 Supporting types

```ts
interface IntentDelta {
  added: Partial<TripIntent>;
  changed: { key; before; after }[];
  removed: (keyof TripIntent)[];
}

interface ProposalDiff {
  heroChanged: { before: StayId; after: StayId } | null;
  alternativesAdded: StayId[];
  alternativesRemoved: StayId[];
  alternativesReordered: boolean;
  reasoningChanged: { added: ReasoningChip[]; removed: ReasoningChip[] };
  totalCostDelta?: { before: number; after: number };
}

interface AdaptationNote {
  description: string;          // "Reduced nightlife weighting"
  signal: string;               // "vibrancy"
  direction: 'up' | 'down' | 'add' | 'remove';
  weight?: number;
}

interface MoodSnapshot {
  destinationName: string;
  text: string;
  source: 'curated' | 'llm';
  confidence?: number;
}

interface ProposalRef {
  turnId: string;
  proposalId: string;           // stable hash of proposal contents
  generatedAt: string;
  summary: { destinationName; nights; heroStayName };
}

interface PartialnessReport {
  missingComponents: ('ranking' | 'mood' | 'provenance' | 'reasoning')[];
  degradedComponents: { component; reason }[];
}

interface FreshnessInfo {
  fetchedAt: string;
  dataMaxAgeMs: number;
  priceMaxAgeMs?: number;
  source: 'live' | 'cached' | 'synthesized';
}

interface TrustAnnotation { label; evidence: 'reviews'|'bookings'|'amenities'|'location'|'curated'; confidence; sourceCount?; }
interface DataQuality { completeness; reviewQuality: 'rich'|'sparse'|'unverified'; priceConsistency: 'fresh'|'recent'|'stale'; amenityVerification: 'verified'|'self-reported'|'unknown'; }
interface TemporalContext { dates: TripDates; seasonality?; localEvents?; weatherForecast?; }
interface EscalationPath { kind: 'concierge-handoff'; reason; tier: 'standard' | 'vip' | 'enterprise'; }
```

---

## 4. Design System

The system is built around two non-negotiable feel goals: **calm** and **alive**. Calm comes from generous space, restrained color, and editorial typography. Alive comes from atmospheric depth (radial blooms, not shadows), purposeful motion, and the warm-gold accent that signals AI presence without being garish.

### 4.1 Colors

CSS custom properties in `src/styles/tokens.css`, exposed via Tailwind v4 `@theme`. Intentionally *not* a lazy inversion - each mode owns a different accent character.

| Token | Dark (cinematic) | Light (boutique sunset) |
|---|---|---|
| `--surface-base` | `#0B0D10` near-black | `#F4EFE6` warm cream |
| `--surface-raised` | `#14171C` | `#FAF6EC` |
| `--surface-elevated` | `rgba(255 255 255 / .04)` | `#FFFFFF` |
| `--ink-primary` | `#EDE6DB` warm white | `#2A2A1F` deep ink |
| `--ink-secondary` | `rgba(237 230 219 / .65)` | `rgba(42 42 31 / .65)` |
| `--ink-tertiary` | `rgba(237 230 219 / .40)` | `rgba(42 42 31 / .40)` |
| `--accent-primary` | `#D4A574` warm gold | `#5A6B3F` deep olive |
| `--accent-secondary` | `#5078C8` cool blue (depth) | `#B0552F` clay terracotta |
| `--border-subtle` | `rgba(255 255 255 / .08)` | `rgba(42 42 31 / .10)` |
| `--border-emphasis` | `rgba(255 255 255 / .14)` | `rgba(42 42 31 / .18)` |
| `--bloom-warm` | `radial-gradient(ellipse 80% 60% at 70% 20%, rgba(212 165 116 / .14), transparent 60%)` | `radial-gradient(...) terracotta @ 8%` |
| `--bloom-cool` | `radial-gradient(ellipse 60% 50% at 20% 90%, rgba(80 120 200 / .10), transparent 60%)` | `radial-gradient(...) olive @ 6%` |

The bloom tokens are the secret weapon of dark mode - they replace shadows as the elevation language. Every "luxe" surface in the dark workspace gets a `--bloom-warm` overlay; cards never use box-shadows alone.

**Fixed boutique-light tokens** - the "Featured stays" marketing section (5.12) needs to keep its boutique-light identity regardless of global theme. Defined as a separate, theme-independent token set:

```css
--featured-bg:           #F4EFE6;       /* always cream */
--featured-bg-raised:    #FAF6EC;
--featured-ink-primary:  #2A2A1F;
--featured-ink-secondary: rgba(42 42 31 / .65);
--featured-accent:       #5A6B3F;       /* deep olive */
--featured-accent-clay:  #B0552F;       /* terracotta */
--featured-border:       rgba(42 42 31 / .14);
```

In global dark mode these create a deliberate cream "exhale" mid-page (the light-mode preview). In global light mode they remain cohesive with the surrounding palette but slightly warmer, still reading as a section break.

### 4.2 Typography

Three families via `next/font` (no FOUT, self-hosted):

- **Fraunces** - variable, opsz 9-144, wght 300-500, italic. Display, hero stay names, AI message body, proposal summary.
- **Inter** - variable. UI, navigation, chat user messages, prices, metadata.
- **Geist Mono** - agent IDs, step counters, technical labels. Sparing.

Scale (`src/styles/tokens.css`):

```
display-xl   4.5rem / 0.95 / -0.04em   Fraunces 300       (rare)
display-lg   3.5rem / 1.00 / -0.035em  Fraunces 300       landing headline
display-md   2.25rem / 1.05 / -0.03em  Fraunces 400       section H2
display-sm   1.625rem / 1.15 / -0.025em Fraunces 400      hero stay name
body-lg      1.125rem / 1.55           Inter 400          intro copy
body         1rem / 1.60               Inter 400          default
body-sm      0.875rem / 1.50           Inter 400          metadata
label        0.75rem / 1.40 / 0.08em ↑ Inter 500 caps     section eyebrows
mono         0.8125rem / 1.50          Geist Mono 400     agent IDs
```

Italics reserved as accent - never for emphasis-as-default. They mark concierge voice (*"Tuscany & Umbria - slower, fewer crowds"*) and AI-attributed reasoning chips.

### 4.3 Spacing & radii

Spacing: Tailwind default 4px base, 1–24. Nothing custom.

Radii: `sm 6 · md 10 · lg 14 · xl 18 · 2xl 22 · full 9999`. Cards default `xl`; hero stay `2xl`; pills/inputs `full`.

### 4.4 Elevation

Dark mode - bloom + ambient ring, not shadows:

```
--elev-card-dark:   0 8px 24px -8px rgb(0 0 0 / .50),
                    inset 0 1px 0 rgb(255 255 255 / .04);
--elev-hero-dark:   0 18px 40px -12px rgb(0 0 0 / .55),
                    0 0 0 1px rgb(255 255 255 / .06),
                    inset 0 1px 0 rgb(255 255 255 / .06);
```

Light mode - 4-stop shadow scale (`sm/md/lg/hero`) with cool-tinted alphas.

### 4.5 Motion

Tokens in `src/styles/tokens.css`:

```
--ease-out          cubic-bezier(0.2, 0.8, 0.2, 1)      default entries
--ease-emphasized   cubic-bezier(0.16, 1, 0.3, 1)       hero materialization
--ease-in-out       cubic-bezier(0.4, 0, 0.2, 1)        bidirectional

--dur-instant   100ms     button press feedback
--dur-fast      200ms     hover / color shift
--dur-base      350ms     default
--dur-slow      600ms     card reveal, section enter
--dur-cinematic 900ms     hero / page-level moments
```

Six named motion patterns ship as Framer Motion variants in `src/features/shared/motion/`:

1. `fadeUp` - opacity 0→1, y 12→0
2. `materialize` - opacity 0→1, scale 0.96→1, filter blur(8px)→blur(0) - for stay cards landing on canvas after shimmer
3. `shimmer` - background-position cycle, infinite linear 1600ms
4. `glow-pulse` - box-shadow expand-fade, infinite 2000ms - active agent step indicator
5. `stagger-children` - 60ms between siblings
6. `breathe` - scale 1↔1.005, infinite 5s - hero stay subtle aliveness

`prefers-reduced-motion` collapses 3, 5, 6 to a single 200ms fade. Non-negotiable.

### 4.6 Glass / blur - codified rules

Glass is rare and earned. Used only for: chat input pill, docked input, "Preview" badges on synthesized stays, agent-step-status floating row.

Always: `backdrop-filter: blur(12px) saturate(1.4)`, paired with `--border-emphasis` and an inner highlight. **Never glass over flat color** - must be over a bloom or photo.

### 4.7 Photo treatment

- Aspect ratios: hero 4:3, alternative 16:10, thumbnail 1:1
- Always a bottom-up scrim `linear-gradient(180deg, transparent 50%, rgba(0,0,0,.55))` for legibility
- Hero gets an additional top-down warm bloom at 30% opacity
- Loading state is a bloom gradient, never a gray box
- All via `next/image`; hero is `priority`, alternatives lazy

### 4.8 Icons

Lucide for utility (search, refresh, close, chevrons, send). One custom SVG sparkle (`✦`) is the AI/concierge motif - appears in chat input, AI message prefix, agent step bullets, docked-input symbol. All icons use `currentColor` and inherit `--ink-secondary` by default.

### 4.9 Component primitives

shadcn/ui pulled selectively (Button, Dialog, Tooltip, ScrollArea, Slot) and re-skinned in `src/features/shared/primitives/`. Single primary button variant per mode (gold-on-near-black for dark, olive-on-cream for light) + ghost. Inputs are pill or borderless-underline. Cards use the bloom system, not shadcn shadows.

### 4.10 Sound (deferred)

Architecture leaves a `useAmbientSound()` hook stub at `src/features/shared/sound/`. Subtle send-tap, Trip Board materialization chime, with global mute and `prefers-reduced-motion` opt-out. Not in Slice A scope.

---

## 5. Features

Slice A has two surfaces:
- **Workspace** (client, immersive, where the product lives)
- **Marketing scroll narrative** (RSC, calm support not spectacle)

Together they're the single page at `/`.

### 5.1 Workspace shell
- Full-viewport at the fold (100vh). Single client component, everything below it RSC.
- Header: tiny wordmark top-left; `v0.1 · public preview` badge in Geist Mono; theme toggle top-right.
- Background: `--surface-base` + `--bloom-warm` + `--bloom-cool` composited. Single ambient surface, not a "page with sections."
- Split: 38% chat sidebar / 62% canvas. 1px hairline divider in `--border-subtle`.

### 5.2 Chat sidebar - three states

1. **Greeting** - Time-aware ("Good evening. Where to *next?*" - `display-sm` Fraunces, italic on "next") + 3 suggestion chips (static in Slice A; personalized from memory in Slice C).
2. **Active turn** - User message → agent step list (5.3). The step list IS the AI's "typing" indicator. **No bouncing dots, no typing dots, no avatar.**
3. **Resolved turn** - User message → collapsed step summary ("*Composed in 2.4s · 3 agents*", expandable for transparency) → concierge summary message in Fraunces italic.

Older turns recede to opacity 0.7. Auto-scroll keeps the active turn pinned.

Input bar fixed bottom, glass pill, sparkle prefix, send arrow. `Enter` sends, `Shift+Enter` newline. Focus state is a subtle gold outline glow - no harsh focus ring.

**Voice rules** (`src/lib/quality/voice.ts` enforces):
- Concierge speaks in fragments and italics, not paragraphs and exclamations
- Banned words: *unforgettable, experience, hidden gem, discover, journey*
- Microcopy template: *"Tuscany & Umbria - slower, fewer crowds, walkable hill towns."* Never *"Hey there, great choice!"*

### 5.3 Agent step list - the streaming UX

Each step row:
- Left: status indicator. Empty ring → gold ring + `glow-pulse` (active) → solid gold + check (done).
- Center: label. Present participle when active ("Reading your trip"); past tense when complete.
- Right: agent attribution in Geist Mono italic, prefixed with `·`.
- Optional sub-progress: tiny "120 of 240" counter + thin gold underline animating beneath active steps.

Steps enter with `fadeUp`, stagger 60ms. **No animated chevrons, no spinners, no robot icons.** The pulsing gold ring is the only motion.

### 5.4 Canvas - empty state ("Featured today")

Pre-turn state. **Curated, not decorative.**

- One large hero stay (daily-rotated from curated Italy seed), full-bleed within canvas
- Caption in Fraunces italic: *"Tuscany, today"*
- Three smaller thumbnails below
- Subtle prompt at canvas top: *"Tell me about your trip - or start with one of these."*

In Slice A the rotation is by `Date.now()` quantized to a daily bucket over the curated set. Slice C personalizes from memory.

### 5.5 Canvas - shimmer state

Triggered by `proposal.shimmering` event. The Trip Board *layout grid* materializes empty, with shimmer placeholders, **before the cards exist**:

- Hero placeholder (full-width, 4:3, `2xl` radius)
- 2 alternative placeholders (16:10, `xl` radius)
- Reasoning strip placeholder

Each shimmer is a warm-gold gradient sweep over `--surface-elevated`, 1600ms cycle. Layout matches eventual content exactly - **zero layout shift** when real cards arrive.

### 5.6 Canvas - Trip Board: the materialization moment

The single highest-leverage interaction in the product. Choreography is frame-precise:

```
T+0ms     proposal.ready event arrives
T+0ms     Shimmer placeholders cross-fade to solid card surfaces (200ms)
T+0–600   Hero card materializes:
              · opacity 0→1
              · scale 0.96→1
              · filter blur(8px)→blur(0)
              · ease-emphasized, 600ms
          Photo loads first; text overlays fade in 200ms after photo paints, stagger 60ms
T+150ms   Alternative card 1 starts (60ms behind hero)
T+210ms   Alternative card 2 starts
T+400ms   Reasoning chip strip slides up (fadeUp, 350ms)
T+600ms   Hero begins breathe loop (scale 1↔1.005, 5s)
T+600ms   Concierge summary message in chat (fadeUp)
T+~700ms  Settled - Trip Board is alive
T+~1000ms (post) MoodSnapshotAgent emits → mood text fades onto hero card
```

`prefers-reduced-motion` collapses to a single 200ms cross-fade.

**Hero stay card** (`2xl` radius, full-bleed photo):
- Top-left: gold "Top pick" badge
- Bottom-left: stay name in `display-sm` Fraunces; sublabel ("Tuscany · vineyard view") in Inter `body-sm` `--ink-secondary`
- Bottom-right: price in `display-sm` Fraunces, `--accent-primary`
- Hover: scale 1.005 + scrim deepens 8% (350ms)

**Alternative cards** (`xl` radius, 16:10):
- Photo + scrim
- Stay name (Inter `body-sm`) + price (Fraunces, gold)
- Click → detail view OR swap with hero

**Reasoning strip** (full-width below cards):
- Eyebrow `Why these` in Inter `label`
- Chips: closed pills with provenance distinction - chips from user intent in `--ink-secondary`, chips from AI in `--accent-primary`. Visual difference between user-said and AI-inferred is the whole point.
- Last chip shows total cost in Fraunces gold.

### 5.7 Refine flow

When the user types a follow-up ("less touristy", "smaller villas"), it's a **refine turn** (Section 6.4) - not a fresh compose. The Trip Board does a **diff transition**, not a fresh materialize:

- Cards present in both old and new proposals stay fixed (no animation)
- Removed cards fade out (250ms)
- Added cards materialize into their slots (600ms emphasized)
- Hero swap (if any) is an 800ms cross-fade with a small scale dance
- A brief "Why this changed" banner above the board for 5s, populated from `proposal.adaptation` notes

The user sees what changed. The trip is alive and editable.

### 5.8 Compare mode

Pin/unpin actions on stay cards (max 3). `CompareTray` strip at workspace bottom shows pinned stays. Clicking opens `<CompareView>` modal with synchronized reasoning chips and inline diff highlights (price, walkability, vibe match, family fit).

Slice A: simple side-by-side. Slice B: ranking-aware comparison via `compareSet` parameter to the Ranking Agent.

### 5.9 Soft memory hints

`MemoryHinter` heuristic at `src/lib/memory-hinter/`. Session-only:

```ts
interface MemoryHinter {
  observeTurn(turn: CompletedTurn): void;
  evaluate(): MemoryHint | null;
}
```

Slice A heuristic: 3+ turns within session sharing a `vibe.tag` triggers hint *"You seem to prefer slower, walkable destinations."* Fired at most once per session via `concierge.memory.hint` event. Slice C replaces with cross-session Memory Agent - same event shape.

### 5.10 Detail view

Click any stay card → side panel slides in from right (350ms ease-emphasized), 480px wide. Glass border on canvas-facing edge.
- Photo gallery (3–5 photos), peek-scroll
- Name, location, price
- Description (1–2 short paragraphs)
- Amenity chips
- Single primary CTA: gold pill `Continue to Booking →` opens placeholder confirmation modal with honest *"Slice A demo - booking redirect lives in Slice B."*
- Inline disclosure: *"StayScout earns affiliate commission on bookings. Prices identical."*
- Closes via Esc / click-outside / X

### 5.11 Marketing - How It Works

Three steps, sticky-scroll narrative (each ~80vh, scroll-driven `whileInView` with `once: true`):

1. **Describe** - Illustration: chat-input pill morphs into structured `TripIntent` fields appearing one at a time. Headline: *"You write a sentence."*
2. **The concierge composes** - Illustration: three agent rows progressing in sequence. Headline: *"Specialized agents do the work."*
3. **You confirm** - Illustration: static Trip Board hero card. Headline: *"You stay in control."*

Cool blue ambient bloom in this section to break visual monotony.

### 5.12 Marketing - Featured stays (light-mode break)

4–6 editorial cards in **warm boutique-light palette** using the fixed `--featured-*` token set (4.1) - cream base, olive + clay accents - regardless of global theme. Intentionally different mood from the dark workspace above. Acts as preview of light mode and a visual exhale.

Headline: *"Hand-selected by the concierge."* Background gradient transitions from `--surface-base` (the global theme's base) into `--featured-bg` over the 80vh between this and the previous section. In dark mode this produces the cream "exhale" break; in light mode it produces a subtle warmth shift, still reading as a section.

### 5.13 Marketing - Why StayScout

Three calm tiles, two-column layout:

1. **Specialized agents, not a chatbot.** - Multi-agent architecture copy + small named-agents visual.
2. **Honest about how we make money.** - Affiliate disclosure copy.
3. **Memory that improves with you.** - Preference learning copy (Slice C feature; tile sets expectation early).

### 5.14 Footer

One line: wordmark + tagline (*"Travel concierge software."*), status badge (`v0.1 · public preview` Geist Mono), affiliate disclosure link, theme toggle mirror.

### 5.15 Theme toggle

Top-right header + footer mirror. Default: `prefers-color-scheme`. Cookie-stored to prevent FOUC. Switch triggers 600ms cross-fade across `--surface-*` and `--ink-*` variables. Workspace bloom and accent colors transition independently for tactile depth.

### 5.16 Mobile fallback (Slice A graceful)

- ≥ 768px: full split workspace
- < 768px: chat collapses to bottom sheet (25vh resting / 75vh expanded on focus). Canvas takes full viewport. Marketing single-column.
- Bottom sheet uses `vaul` (decision in plan phase) or hand-rolled physics.

Slice B does the proper thumb-first redesign.

### 5.17 Voice & taste rules (codified)

`src/lib/quality/` enforces:
- `banned-words.ts` - shared cliché list (`unforgettable`, `experience`, `hidden gem`, `discover`, `journey`, `magical`, `unique`, `breathtaking`, `must-see`, `bucket-list`)
- `taste-lint.ts` - runs in CI on:
  - Curated stay descriptions (`src/providers/mock-italy/data/stays/*.ts`)
  - Curated mood snapshots (`src/lib/curation/moods.ts`)
  - All static UI microcopy
- `mood-lint.ts` - used live by `MoodSnapshotAgent` to validate LLM output before emitting; on fail, retry once with stricter prompt; on second fail, suppress mood for that destination ("better silent than corny")

### 5.18 Slice A explicit non-goals

- No saved trips beyond session (anonymous session persists in cookie + localStorage)
- No user accounts
- No Stripe / payments / real bookings
- No real provider integrations
- No itinerary view (single Trip Board only - no multi-day, no flights, no activities)
- No admin panel, no observability dashboard, no traces UI
- No SEO programmatic pages - only `/`
- No human concierge escalation (interface stub only)
- No PWA / push notifications

---

## 6. Streaming Protocol

### 6.1 Wire format

POST `/api/concierge`, response `Content-Type: application/x-ndjson` - newline-delimited JSON, one `OrchestratorEvent` per line, flushed eagerly.

```ts
type ConciergeRequest = {
  sessionId: string;                  // anon_<uuid>, cookie-bound
  turnId: string;                     // client-generated UUID, idempotent
  type: 'compose' | 'refine';
  input: {
    rawInput: string;
    priorProposalRef?: ProposalRef;   // present iff type='refine'
    compareSet?: StayId[];
  };
  cancelPriorTurn?: boolean;
  clientCapabilities: {
    supportsAdaptationDelta: boolean;
    supportsMoodSnapshot: boolean;
    supportsMemoryHint: boolean;
  };
};
```

JSONL chosen over SSE for: plain `fetch().body.getReader()` consumer (no EventSource quirks), `curl --no-buffer` shows the stream verbatim, append-to-file gives a replay log.

### 6.2 Compose turn lifecycle

```
turn.started                   (compose)
agent.step.started             intent           "Reading your trip"
intent.extracted
agent.step.completed           intent
agent.step.started             search           "Searching N stays in <destination>"
agent.step.progress            search           counter: 120/240
provider.search.completed
agent.step.completed           search
agent.step.started             ranking          "Ranking by family fit, walkability"
proposal.shimmering                              ← canvas paints shimmer placeholders
agent.step.completed           ranking
proposal.ready                                   ← canvas materializes
proposal.bookmarkable                            ← seam (storage='session' in Slice A)
concierge.message                                ← summary in Fraunces italic
agent.step.started             mood             "Composing the vibe"
mood.snapshot.ready                              ← appears as italic line on hero card
agent.step.completed           mood
concierge.memory.hint?                           ← MemoryHinter fires if pattern detected
turn.completed
```

### 6.3 Refine turn lifecycle

```
turn.started                   (refine, priorTurnId=...)
agent.step.started             intent           "Adjusting your trip"
intent.refined                                   ← carries IntentDelta
agent.step.completed           intent
agent.step.started             ranking          ← skip search if only weights changed
proposal.refining                                ← canvas ripple on existing cards (NOT placeholders)
proposal.adaptation            [{description: "Reduced nightlife weighting", ...}]
                                                   ← banner above Trip Board for ~5s
agent.step.completed           ranking
proposal.evolved                                 ← carries ProposalDiff for animated diff
concierge.message              tone='narrate'    ← "Pulled the plan slightly quieter."
turn.completed
```

Two key UI differences vs compose:
1. Canvas does *not* shimmer - existing cards stay visible with subtle ripple while AI thinks
2. `proposal.evolved` arrives → Trip Board does diff transition (cards present in both freeze, removed fade, added materialize, hero swap cross-fade)

### 6.4 Cancellation

- New POST with `cancelPriorTurn: true` (default when in-flight) → server aborts in-flight `AbortController`
- Aborted turn emits `turn.failed { error: 'cancelled', recoverable: true }` and closes
- Client store discards events from cancelled turns by `turnId`
- Standalone cancel: `DELETE /api/concierge/turn/:turnId`

### 6.5 Resilience (Slice A)

Stream drop mid-turn → soft inline notice in chat: *"Stream interrupted. Try again?"* and rolls state back to pre-turn. **No silent retry.** No replay protocol in Slice A.

### 6.6 Idempotency

`turnId` generated client-side. Orchestrator dedupes via in-memory map (Slice A; persisted in Slice B). Same turnId twice = no-op join to existing stream.

### 6.7 Observability stub

Every event also flows through `TraceLogger` interface (no-op + console writer in Slice A):

```ts
interface TraceLogger {
  recordEvent(event: OrchestratorEvent): void;
  recordAgentRun(agent: AgentId, input, output, durationMs, modelMeta?): void;
}
```

Slice B replaces with Langfuse (or OpenTelemetry-equivalent) impl. Zero changes to agents or orchestrator.

### 6.8 Client consumer

Single `useConciergeStream()` hook in `src/features/workspace/hooks/`:

```ts
const { send, status, currentTurnId, cancel } = useConciergeStream();
send({ rawInput: 'Italy. 7 days. Family of 4.', type: 'compose' });
```

Internally:
1. POST request with ConciergeRequest body
2. `response.body.getReader()` → UTF-8 decode → split on `\n` → parse each line as JSON
3. Validate against Zod schema per `kind` (defensive against drift)
4. Dispatch typed event into Zustand workspace store
5. Return turn-level lifecycle (`idle | streaming | settled | error`)

Single source of truth: Zustand store has one reducer pattern-matching `event.kind`. **All UI reads from this store.** Component-local state only for ephemera (input value, hover, focus).

### 6.9 Anti-flicker discipline

Three rules:

1. **Shimmer/refining states paint immediately** on event arrival - never an intermediate "loading…" string
2. **Reducer never sets `proposal = null` mid-turn** - explicit phases: `idle → composing → shimmering → ready` and `settled → refining → evolved → settled`
3. **Layout grid for Trip Board renders the moment shimmering begins**, with placeholders at exact final dimensions. Cards mutate in place; grid never reflows.

### 6.10 Failure & degradation

Three classes:

| Failure | Behavior |
|---|---|
| Provider timeout | Drop provider's results, emit `agent.step.failed { recoverable: true }` for that provider, continue with remaining (`turn.completed.partial.degradedComponents`) |
| Provider 0 stays for known destination | Soft failure; emit `concierge.message { tone: 'apologize', message: '*Couldn't find anything that fits - try broadening the dates?*' }` |
| Provider throws | Same as timeout; classified `recoverable` if any other provider returned, `non-recoverable` (turn.failed) if not |

Sub-agent failures (Mood, MemoryHinter) are **always** `recoverable: true` - proposal ships without them. **Trip Board never blocks on optional polish.**

---

## 7. Mock Data / Provider Layer

### 7.1 Folder layout

```
src/providers/
├── index.ts                  # ProviderRegistry & route(intent)
├── _shared/
│   ├── stay-mapper.ts        # canonical Stay shape helpers
│   ├── photo.ts              # photo URL builders, attribution
│   ├── timeout.ts            # withTimeout(provider, ms) decorator
│   └── errors.ts             # ProviderError, ProviderTimeoutError
├── mock-italy/
│   ├── index.ts              # MockItalyProvider impl
│   ├── search.ts             # query → ranked stays
│   ├── ranking.ts            # local deterministic signal-weighted score
│   └── data/
│       ├── destinations.ts   # 7 destinations (canonical metadata)
│       └── stays/
│           ├── tuscany.ts
│           ├── umbria.ts
│           ├── amalfi.ts
│           ├── rome.ts
│           ├── venice.ts
│           ├── lake-como.ts
│           └── cinque-terre.ts
└── llm-synthesized/
    ├── index.ts              # LLMSynthesizedProvider impl
    ├── prompts.ts            # generation prompts (Zod-typed structured output)
    ├── photo-resolver.ts     # Unsplash keyword search
    └── cache.ts              # in-memory LRU keyed by (destination, vibe fingerprint)
```

### 7.2 `MockItalyProvider`

Capabilities:
```ts
{ realtime: false, affiliateAttribution: false, supportsAvailability: false, supportsBooking: false, regions: ['IT'] }
```

**Curated dataset:** ~30 stays across 7 Italian destinations, hand-picked to feel like a luxury concierge's actual rolodex. Mix of villas, design hotels, agriturismos, palazzo conversions.

Each stay record includes:
- 5–7 real photos (Unsplash, photographer credit + license)
- Realistic price range in EUR
- Editorial 1–2 sentence description in concierge voice (Fraunces italic in UI)
- Pre-populated `signals` (walkability/familyFit/remoteness/noise on 0–100 scales)
- Vibe tags from closed taxonomy
- Canonical id `mock-italy:<slug>`

**Search algorithm** (`mock-italy/search.ts`, deterministic):
1. Match destinations against curated taxonomy (case-insensitive + alias map: "Florence"→"Tuscany")
2. Filter by hard constraints (capacity ≥ travelers, budget if specified, date validity)
3. Score by signal-weighted match against `intent.vibe.tags` + `intent.preferences`
4. Return top N (default 12)
5. Mark misses with badges ("Closest match" if no exact destination match)

**Latency simulation:** artificial 250–400ms via `setTimeout` (env: `MOCK_PROVIDER_LATENCY_MS`). Too-fast results undermine the streaming UX.

**Variability:** Deterministic given `(intentHash, dateBucket)`. Same query on same day → same stays. New day rotates the "Featured today" anchor and slightly perturbs ordering for non-hero results.

### 7.3 `LLMSynthesizedProvider`

Capabilities:
```ts
{ realtime: false, affiliateAttribution: false, supportsAvailability: false, supportsBooking: false, regions: undefined }
// emits 'preview' badge automatically
```

**Generation flow:**
1. Claude generates 4–5 plausible stays for the destination via `ModelClient.generate<Stay[]>` with strict Zod schema
2. Photos resolved via Unsplash keyword search per stay
3. Result cached by `(destinationName, vibeTagFingerprint)` for 24h in-memory LRU (Slice B → Redis)
4. Each stay marked with `badges: [{ kind: 'preview', label: 'AI Preview' }]` plus `confidence: ~0.6`

**System prompt** is intentionally conservative: *"Generate plausible stays. Avoid invented brand names that could be confused with real properties. Prefer 'A boutique guesthouse in [neighborhood]' over a fake hotel name."* This protects against hallucinated trademark issues.

### 7.4 `MoodSnapshotAgent` data

The curated mood data lives at `src/lib/curation/moods.ts` - **outside providers**, so the agent (which sits in `src/agents/`) can import it without violating layer boundaries (`agents` deps `core, lib`; not `providers`). Both `MockItalyProvider` and `MoodSnapshotAgent` read from this single source.

~10 hand-written snapshots, editorial tone:

```ts
'tuscany': {
  destinationName: 'Tuscany',
  text: 'Golden-hour vineyard dinners and slower mornings. The kind of place that makes you forget you have email.',
  source: 'curated', confidence: 1.0,
}
```

For LLM-synthesized destinations the agent generates inline with rule: *"One sentence, sensory, present tense, no clichés, no 'discover' or 'unforgettable.'"* Confidence ~0.7. Output passes through `mood-lint.ts`; on fail retries once with stricter prompt; on second fail emits no snapshot.

### 7.5 Provider routing

```ts
// src/providers/index.ts
export const ProviderRegistry: Record<ProviderId, Provider> = {
  'mock-italy': MockItalyProvider,
  'llm-synthesized': LLMSynthesizedProvider,
};

export function routeProvider(intent: TripIntent): Provider {
  const dest = intent.destinations[0];
  if (dest?.country === 'IT' && MockItalyProvider.knowsDestination(dest)) {
    return ProviderRegistry['mock-italy'];
  }
  return ProviderRegistry['llm-synthesized'];
}
```

Slice A: simple if/else. Slice B: `ProviderRouter` fans out to multiple providers in parallel and merges.

### 7.6 Photos - Unsplash + `next/image`

- Hot-link via `next/image` with `remotePatterns: [{ hostname: 'images.unsplash.com' }]` configured
- Next.js optimizes server-side, caches in Vercel image CDN
- Photographer credit + license URL stored on every photo (FTC + Unsplash license compliance)
- Loading states are bloom gradients, not gray boxes
- `Stay.photos[].source: 'unsplash' | 'expedia' | 'vrbo' | …` - Slice B routes by source to right CDN

### 7.7 Provider seam - what real Booking.com looks like

For verification the seam is real:

```ts
// Slice B - src/providers/booking-com/index.ts
export const BookingComProvider: Provider = {
  id: 'booking-com',
  displayName: 'Booking.com',
  capabilities: {
    realtime: true, affiliateAttribution: true,
    supportsAvailability: true, supportsBooking: false,
    regions: undefined,
  },
  async search(q, ctx) {
    const url = buildBookingApiUrl(q);
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${ctx.secrets.BOOKING_API_KEY}` },
      signal: ctx.signal,
    });
    const data = await resp.json();
    return {
      stays: data.results.map(mapBookingResponseToStay),
      badges: [],
      pagination: { cursor: data.next_cursor, hasMore: data.has_more },
      freshness: { fetchedAt: new Date().toISOString(), dataMaxAgeMs: 60_000, source: 'live' },
    };
  },
};
```

Three files per provider: `index.ts`, `mapper.ts`, `affiliate-attribution.ts`. One PR. No agent or UI changes.

### 7.8 Quality bar (taste constraints)

Things this Italy seed does *not* do:
- No fake brand names that could be confused with real properties
- No stock photo with text overlay or visible watermarks
- No price points outside realistic ranges for destination/category
- No more than one photo of the same room per stay
- No editorial copy with banned words (5.17)

Enforced by `pnpm test:seed` running at CI: Zod schema + banned-words check on every stay in `data/stays/`.

---

## 8. Extensibility Seams

The architecture's value isn't proven by Slice A working - it's proven by Slices B–D being **additive** rather than refactor-driven.

### 8.1 Agent expansion roadmap

| Agent | Slice | I → O | Plugs in at |
|---|---|---|---|
| `IntentAgent` | A ✓ | `{rawInput, priorIntent?}` → `TripIntent` | step 1 |
| `MoodSnapshotAgent` | A ✓ | `{destination}` → `MoodSnapshot` | post-proposal, non-blocking |
| `SearchAgent` | B | `TripIntent` → `Stay[]` | step 2 (replaces direct provider call) |
| `RankingAgent` | B | `{intent, stays, compareSet?, memory?}` → `RankedProposal` | step 3 (replaces deterministic ranking) |
| `WeatherAgent` | B | `{destinations, dates}` → `WeatherSummary` | parallel with Search |
| `EventEnrichmentAgent` | B | `{destinations, dates}` → `LocalEvent[]` | parallel with Weather |
| `MemoryAgent` | C | `{user, turn, proposal}` → `MemoryDelta` | post-turn write; pre-turn read |
| `ItineraryAgent` | C | `{proposal, dates, preferences}` → `Itinerary` | optional follow-up turn |
| `MonitoringAgent` | C | n/a (background worker) | watches saved trips |
| `BookingAgent` | D | `{stay, params}` → `BookingDraft \| BookingConfirmation` | terminal node, human-approval (D.1) → autonomous (D.2) |

### 8.2 Provider expansion order

1. **Booking.com** (Slice B) - affiliate API, hotels + apartments
2. **Expedia** (Slice B) - affiliate, hotels
3. **Vrbo** (Slice B) - affiliate, vacation rentals
4. **Hotelbeds** (Slice B/C) - wholesaler, B2B inventory
5. **Skyscanner** (Slice C) - flights - sibling `FlightProvider` interface
6. **Viator** (Slice C) - activities - sibling `ActivityProvider` interface

### 8.3 Persistence (Slice B - Postgres + Prisma + Clerk)

Slice A: anonymous cookie session, in-memory turn map. Persistence boundary lives behind `SessionStore` interface in `src/lib/session/`.

Slice B Prisma schema (sketch):

```prisma
model User { id String @id ; email String? @unique ; preferences Json ; trips Trip[] ; conversations Conversation[] }
model Trip { id String @id @default(cuid()); userId String; user User @relation(...); proposalId String; proposal Json; intent Json; bookmarkedAt DateTime @default(now()); monitoring MonitoringJob? ; conversations Conversation[] }
model Conversation { id String @id @default(cuid()); userId String; tripId String?; assignedConcierge HumanConcierge?; turns Turn[]; startedAt DateTime @default(now()) }
model Turn { id String @id; conversationId String; type String; events Json; createdAt DateTime @default(now()) }
model AffiliateClick { ... } // 8.7
model MonitoringJob { ... } // Slice C
model MemoryRecord { ... }   // Slice C - pgvector
```

### 8.4 Memory (Slice C - pgvector)

`MemoryAgent` runs post-turn, async, non-blocking. Two writes per turn:
- **Episodic** - turn summary embedded into `pgvector` (`MemoryRecord` table with `embedding vector(1536)`)
- **Structural** - preference deltas applied to `User.preferences` JSON (`PreferenceGraph` shape - pace, luxury tolerance, social style, food priority, spontaneity, walkability bias, etc.)

Pre-turn read: `MemoryAgent.recall(intent)` returns top-K relevant memories, consumed by `IntentAgent` via `AgentContext.memory?: MemoryContext`.

The session-only `MemoryHinter` from Slice A is replaced by the same event shape (`concierge.memory.hint`) emitted from real cross-session evidence.

### 8.5 Orchestration (Slice B - LangGraph.js drop-in)

Slice A `Orchestrator` is a hand-written sequential class. The wire output (`OrchestratorEvent` stream) is the contract.

Slice B re-implements as LangGraph.js graph. Same exports, same emitted events. Consumers don't see the change.

```ts
const graph = new StateGraph<TurnState>(turnStateChannels)
  .addNode('intent', intentNode)
  .addNode('weather', weatherNode)
  .addNode('events', eventsNode)
  .addNode('search', searchNode)
  .addNode('ranking', rankingNode)
  .addNode('mood', moodNode)
  .addEdge('intent', ['weather', 'events', 'search'])  // parallel
  .addEdge(['weather', 'events', 'search'], 'ranking')
  .addEdge('ranking', 'mood')
  .compile({ checkpointer: postgresCheckpointer });
```

### 8.6 Observability (Slice B - Langfuse)

`TraceLogger` interface already abstract. Slice B impl swaps no-op for `LangfuseTraceLogger`. One-line wire-up in route handler. Every existing event automatically becomes a trace.

### 8.7 Affiliate infrastructure (Slice B)

Two pieces:
1. **Click attribution** - orchestrator post-processes `Stay.bookingLink.url` through `wrapWithAttribution(link, { stayId, providerId, sessionId, turnId, userId? })`, producing `https://stayscout.com/r/<linkId>`
2. **Redirect handler** - `app/r/[linkId]/route.ts` records click in Postgres (`AffiliateClick`), 302s to upstream affiliate URL with their tracking params

Conversion tracking via webhooks/postbacks. `Stay` shape doesn't change; only the link wrapper.

### 8.8 Programmatic SEO (Slice B)

- `app/destinations/[slug]/page.tsx` - RSC pages per destination
- `app/sitemap.ts` - generates from destination + neighborhood combinations
- `app/robots.ts`
- JSON-LD `TouristAttraction` / `LodgingBusiness` schema markup (hand-rolled)
- `<FeaturedStaysSection>` reuses Trip Board components from workspace - visual consistency, code reuse

Slice C scales to thousands of pages with `generateStaticParams`.

### 8.9 Monetization

- **Affiliate commissions** - live the moment Slice B's affiliate infrastructure ships
- **Premium tier** - Slice C: Stripe subscription. `User.tier: 'free' | 'premium'` gates priority concierge (Sonnet model), autonomous booking access, multiple monitoring jobs, advanced memory features
- **Trip protection** - Slice D: insurance partner via Provider interface family

### 8.10 Admin panel (Slice C)

New route group `app/(admin)/admin/*`, auth-gated to admin role. Reads from same Postgres tables. **Reuses workspace's chat sidebar pattern for the agent trace viewer** - code reuse, not redesign.

Sections: Funnel, Agents (per-agent latency/error/cost), Affiliate revenue, Traces (live agent trace viewer replays JSONL stream), Monitoring.

### 8.11 Mobile (Slice B PWA)

Bottom-sheet redesign with `vaul` or hand-rolled. Touch-optimized targets. PWA manifest + service worker. Push notifications for monitoring alerts.

### 8.12 Autonomous booking (Slice D)

- **D.1** - Approval-gated: `BookingAgent` prepares params, surfaces confirmation UI, user confirms → execute
- **D.2** - Autonomous: same flow, user rules ("auto-book if price drops below $X"), human-approval node becomes conditional. Audit log per autonomous action. Revocable.

Architectural change between D.1 and D.2: a single graph edge condition in LangGraph.

### 8.13 Taste governance (Slice B+)

`src/lib/quality/` extends:

- `taste-lint.ts` (Slice A: live for curated copy + LLM mood snapshots) → Slice B extends to all LLM-generated copy
- `eval-recorder.ts` (Slice B) - records ranking quality samples to Postgres for offline review by curators
- `hallucination-monitor.ts` (Slice B) - flags responses mentioning specific brand names from a banned list, fictional locations, or impossible price points
- `quality-gates.ts` (Slice C) - blocks proposals that fail quality bars (e.g., all stays have stale pricing) before emission

### 8.14 Human concierge escalation (Slice C+)

`EscalationPath` interface in `core/` (Slice A: stub, no impl). Slice C adds:
- LangGraph human-handoff node (interrupts graph, awaits operator)
- `Conversation.assignedConcierge?: HumanConcierge` field
- Slack/Email integration interface for operator routing
- UI affordance: "Speak to a real concierge" CTA in detail view (Slice A: present but disabled with tooltip; Slice C+: enabled for premium tier)

### 8.15 Evaluation framework (Slice B+)

`src/lib/evaluation/` interfaces in Slice A (no impl). Slice B+ wires:
- `RankingEvaluator` - golden test cases for "would a human concierge agree with this ranking?"
- `RefinementEvaluator` - does refine actually move the proposal in the user-requested direction?
- `HallucinationDetector` - runs on every LLM output via spot-check
- Offline eval harness via Promptfoo or Anthropic's eval kit

Slice A ships only golden TripIntent test cases at `tests/eval/intent-extraction/` to baseline the Intent Agent's accuracy.

### 8.16 Marketplace risk principle (positioning invariant)

Architecture must prevent the product from drifting into "raw inventory marketplace":

- No "browse all stays" surfaces in any slice
- Search results never show "and 1,242 more" - always curated finite sets (max 5 alternatives)
- Orchestrator never just dumps inventory; always narrates/ranks/explains
- Provider response data is canonicalized through `Stay` mapper - providers don't get their own UI surface
- The `<TripBoard>` is the only inventory presentation component; if a slice wants to add a new way to show stays, it must be a curated, explained, finite arrangement (e.g., `<DestinationGuide>`, `<CompareView>`)

### 8.17 Five invariants

1. **Single source of truth for UI state** - Zustand store fed by typed events from wire. No component-local state for non-ephemeral data.
2. **`core/` knows nothing about runtime** - no `import 'next/...'`, no `import 'react'`, no upward imports. ESLint enforces.
3. **Domain events ≠ infrastructure events** - `intent.extracted` is domain; `agent.step.completed` is infra. New domain objects never grow step-event schema.
4. **Optional polish never blocks critical path** - `MoodSnapshotAgent` failing must not block proposal. Orchestrator's degradation handling is the firewall.
5. **The Provider interface is sacred** - every real-world inventory source must fit through it (with sibling interfaces for Flights/Activities). Inventory-specific quirks live in mappers, not the interface.

Plus the marketplace risk principle (8.16) as a sixth positioning invariant.

### 8.18 Completion path summary

| Slice | Adds | New files | Refactor risk | Realistic effort |
|---|---|---|---|---|
| **A** | This spec | ~80 | n/a | 2–3 weeks for one strong full-stack engineer |
| **B** | Postgres + Clerk, real Search/Ranking/Weather/Events agents, Booking + Expedia + Vrbo providers, LangGraph orchestrator, Langfuse traces, affiliate redirect, /destinations SEO, mobile bottom-sheet | ~80 | Provider routing → `ProviderRouter`, orchestrator → LangGraph - both behind existing interfaces. **No UI changes.** | 8–12 weeks for 2 engineers |
| **C** | pgvector memory, MemoryAgent, MonitoringAgent + workers, ItineraryAgent, Stripe subscription, admin panel, push notifications, programmatic SEO scale-out | ~60 | Memory plugs into `AgentContext`; admin reuses workspace components | 8–10 weeks for 2 engineers |
| **D** | BookingAgent (approval-gated → autonomous), trip-protection partner, advanced monitoring rules, audit logs | ~30 | LangGraph edge condition + human-approval node - no protocol changes | 6–8 weeks for 2 engineers |

Total honest estimate to "complete the platform per the original spec": **~6–8 months of focused work for a small team after Slice A**.

---

## 9. Stack Summary

- Next.js 15 App Router, TypeScript strict
- React Server Components for marketing; Client for workspace
- Tailwind CSS v4 + shadcn/ui (selectively, customized)
- Framer Motion for cinematic motion
- Lucide icons
- Vercel AI SDK for LLM calls (used inside agents; orchestrator owns wire format)
- TanStack Query for non-streaming data
- Zustand for workspace UI state
- `next/font` for Fraunces × Inter × Geist Mono
- Anthropic Claude (haiku-4-5 + sonnet-4-6) via `@anthropic-ai/sdk`
- Zod for runtime validation of LLM structured outputs and stream events
- pnpm workspaces (single package today; ready for split)
- ESLint + `eslint-plugin-boundaries` for layer enforcement
- Vitest for unit tests; Playwright for one critical-path e2e
- Vercel for hosting

---

## 10. Open Questions / Deferred to Plan

These are decisions deliberately left for the implementation plan phase (writing-plans skill output):

1. **Bottom-sheet implementation** - `vaul` library vs hand-rolled physics
2. **Specific Italian destinations & stays** - exact ~30 stays curated from real or composite properties; needs research/curation pass during Slice A implementation
3. **Test scope** - exact set of unit/integration/e2e tests for Slice A
4. **CI configuration** - which checks run on PR vs main (typecheck + lint + test:seed at minimum)
5. **Vercel project settings** - analytics, image optimization quotas, edge config
6. **Anonymous session implementation** - signed cookie via `iron-session` vs hand-rolled HMAC
7. **Exact rate limits on the LLM-synthesized provider** - per-IP, per-session
8. **Claude prompt details** - system prompts for Intent Agent and MoodSnapshotAgent (drafted in plan phase)

None of these are blocking. Each will be resolved in the implementation plan.

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **Slice** | A coherent vertical phase of the platform (A, B, C, D) |
| **Trip Board** | The curated proposal layout in the canvas: hero stay + alternatives + reasoning chips |
| **Compose turn** | A fresh user request from idle state |
| **Refine turn** | A follow-up message that evolves the existing proposal |
| **Workspace** | The full-viewport split-pane (chat + canvas) at `/` |
| **Materialization** | The choreographed reveal of the Trip Board after `proposal.ready` |
| **Shimmer** | The placeholder animation while AI is composing |
| **Agent step** | A single named stage in the orchestrator's execution (intent / search / ranking / mood) |
| **Provider** | An inventory source (mock, synthesized, real) implementing the `Provider` interface |
| **Orchestrator** | The component that walks the agent graph and emits the JSONL event stream |
| **Wire format** | JSONL over POST `/api/concierge` - newline-delimited `OrchestratorEvent` objects |
| **Bloom** | A radial gradient overlay used as the primary elevation language in dark mode |
| **Editorial voice** | The concierge tone: fragmentary, italic, sensory, no clichés |
| **Mock Italy** | The curated 30-stay seed dataset for Slice A's primary demo path |
| **LLM-synthesized** | The fallback provider that generates plausible stays for unknown destinations via Claude |
| **Memory hint** | A subtle, session-detected pattern surfaced by the MemoryHinter (e.g., *"You seem to prefer walkable destinations"*) |

---

*End of design specification. Implementation plan to be produced via the writing-plans skill in the next phase.*
