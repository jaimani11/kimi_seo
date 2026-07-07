# StayScout AI - Slice B Design

**Document type:** Design specification (extends Slice A spec §8)
**Project:** StayScout AI - Slice B · Production Backbone
**Date:** 2026-05-08
**Status:** Draft, pending sub-slice priority confirmation

---

## 0. Context

Slice A shipped a feature-complete cinematic frontend with mock data and the AI core (Intent + Mood agents, JSONL orchestrator stream, Trip Board materialization, refine flow, compare, memory hints, detail view, marketing scroll). All Slice A architectural seams (`Provider` interface, `TraceLogger`, `MemoryHinter`, `SessionStore`, `Orchestrator` class) were designed to be **additive replacement points** - Slice B fills them in without touching consumers.

This spec is **not** a fresh design. It expands [Slice A's §8 extensibility seams](2026-05-08-stayscout-slice-a-design.md) into concrete architecture and decomposes Slice B into ten sub-slices (B1–B10) in priority order.

### 0.1 Slice B North Star

> *"A real traveler arrives at stayscout.com, signs in, books a stay through us, and we earn affiliate revenue - without anything in the user-facing experience changing from Slice A."*

The architecture earns this by being silent: the cinematic UX, the typed event stream, the workspace state model - none of it changes. What changes is everything beneath the wire.

---

## 1. Scope summary

| Adds | Slice B path |
|---|---|
| Postgres + Prisma + Clerk auth | B1 |
| LangGraph.js orchestrator (drop-in for hand-rolled class) | B2 |
| `SearchAgent` + `RankingAgent` + `WeatherAgent` + `EventEnrichmentAgent` | B3 |
| Booking.com real provider integration | B4 |
| Expedia + Vrbo real providers + parallel ProviderRouter | B5 |
| Affiliate redirect + click attribution + conversion tracking | B6 |
| Langfuse observability (replaces `NoOpTraceLogger`) | B7 |
| Programmatic SEO (`/destinations/[slug]`) | B8 |
| Mobile bottom-sheet redesign (proper, not the A10 stack) | B9 |
| Hotelbeds wholesaler + final polish + production deploy | B10 |

### What does NOT change (the invariants from Slice A §8.13)

- The `OrchestratorEvent` wire format. Every event the UI consumes today still exists. New events are additive.
- `Provider` interface signature. Real providers fit through it; sibling interfaces (`FlightProvider`, `ActivityProvider`) are reserved for Slice C.
- The `Agent<I, O>` interface. New agents conform to it.
- Workspace store reducer logic. New events get new branches; existing branches don't change.
- Cinematic UX (Trip Board materialization, agent step list, etc.) - pixel-identical.

---

## 2. External resources Slice B needs

This is the part that requires **you** to set up accounts. The code is ours; the keys are yours.

| Resource | Slice that needs it | Free tier sufficient? | Application required |
|---|---|---|---|
| Anthropic API key | A4+ (already needed for live demo) | Pay-as-you-go, ~$5 covers thousands of demos | No |
| Postgres database | B1 | Yes (Supabase / Neon / Railway free tier) | No |
| Clerk account | B1 | Yes (10k MAU free) | No |
| Langfuse account | B7 | Yes (50k traces/month free) | No |
| Booking.com Partner Hub API | B4 | N/A | Yes - partner application (~2 weeks) |
| Expedia Partner Solutions | B5 | N/A | Yes - EPS partnership |
| Vrbo affiliate (via Expedia Group) | B5 | N/A | Yes - same EPS partnership |
| Hotelbeds APITUDE | B10 | Test sandbox available | Yes - B2B account |
| Custom domain | B10 | n/a | n/a |
| Vercel deployment | already configured | Yes | No |

**Mock-first strategy**: every real-provider sub-slice ships with a Mock impl that simulates realistic API responses (latency, error modes, pagination). Code path is identical; only the implementation file swaps. This means **B4–B5 and B10 deliver complete code that can run end-to-end against mocks today and switch to real APIs the moment partnership credentials arrive.** The user-facing experience is identical either way.

---

## 3. Sub-slice decomposition

### B1 · Persistence + Auth (foundation)

**Goal:** Move from in-memory state to a real database, add anonymous→authenticated user flow.

**Adds:**
- `prisma/schema.prisma` with: `User`, `Trip`, `Conversation`, `Turn`, `AffiliateClick`, `MemoryRecord` (stub for C)
- `src/lib/db/` - Prisma client singleton
- `src/lib/session/postgres-session-store.ts` - replaces in-memory turn map
- Clerk `<ClerkProvider>` in root layout
- `src/middleware.ts` - public routes only, no auth gates yet
- "Save trip" CTA appears on the detail panel for signed-in users
- Migration script: anonymous-session cookie → User if they sign up
- `npm run db:migrate` and `db:seed` scripts

**Doesn't yet:**
- Gate any features behind auth (workspace stays public)
- Implement billing
- Touch the orchestrator's behavior

**Ship value:** Saved trips persist across refresh. Clerk handles email/Google/Apple. Postgres ready for real provider data.

---

### B2 · LangGraph orchestrator drop-in

**Goal:** Replace the hand-rolled `Orchestrator` class with a LangGraph.js graph. Same emitted events, gain parallelism + retries + checkpointing.

**Adds:**
- `pnpm add @langchain/langgraph @langchain/core`
- `src/orchestrator/graph/` - graph node definitions, state channels, checkpointer
- `src/orchestrator/graph/orchestrator-graph.ts` - `class GraphOrchestrator implements OrchestratorOptions`
- Postgres checkpointer for graph state (B1 persistence dependency)
- `src/orchestrator/singleton.ts` switches to GraphOrchestrator behind a `LANGGRAPH_ENABLED` env flag (allows rollback)

**Wire format**: unchanged. The graph emits the same `OrchestratorEvent` JSONL stream Slice A defined. UI doesn't notice.

**Ship value:** parallel agent execution (B3's WeatherAgent + EventEnrichmentAgent + SearchAgent run concurrently → ~40% faster turns), built-in retry on transient failures, graph state checkpointing for replay.

---

### B3 · Real agents (Search + Ranking + Weather + Events)

**Goal:** Make the agent step list mean something. Slice A had Intent → (provider) → Mood. B3 inserts the missing agents between them.

**Adds:**
- `src/agents/search-agent.ts` - `Agent<TripIntent, Stay[]>`. Replaces the orchestrator's direct `provider.search()` call. Fans out to multiple providers in parallel, merges, dedupes by canonical `(name, locality)` heuristic.
- `src/agents/ranking-agent.ts` - `Agent<{intent, stays, compareSet?, memory?}, RankedProposal>`. Real signal-weighted scoring with explanation. Emits real `AdaptationNote[]` (replacing the `synthesize-adaptation.ts` stub).
- `src/agents/weather-agent.ts` - `Agent<{destinations, dates}, WeatherSummary>`. Open-Meteo free API.
- `src/agents/event-enrichment-agent.ts` - `Agent<{destinations, dates}, LocalEvent[]>`. Ticketmaster Discovery free API.
- `src/lib/quality/eval-recorder.ts` - records ranking quality samples for offline review.

**Wire**: agent steps surface as the named-agent rows the UI already renders. Cinematic step list now shows: `Read your trip` (intent) → `Searched 240 stays` (search) → `Ranked by family fit` (ranking) → `Composing the vibe` (mood). Order matches spec §5.3 exactly.

**Ship value:** the Trip Board now reflects real ranking reasoning. AdaptationBanner shows actual notes during refine ("Reduced nightlife weighting because you said quieter"). MoodSnapshotAgent gets richer destination context (weather + events).

---

### B4 · Booking.com real provider

**Goal:** First real inventory. Italy queries that hit destinations outside the curated set, plus all non-Italy queries, return real Booking.com properties with real photos and real prices.

**Adds:**
- `src/providers/booking-com/index.ts` - implements `Provider` interface
- `src/providers/booking-com/api-client.ts` - typed wrapper around Booking Partner Hub API
- `src/providers/booking-com/mapper.ts` - Booking response → canonical `Stay`
- `src/providers/booking-com/affiliate-attribution.ts` - appends affiliate ID to `bookingLink.url`
- `src/providers/_mocks/booking-com-mock.ts` - sandbox mock matching the real API response shape (used in tests + when `BOOKING_API_KEY` not set)
- `next.config.ts` `remotePatterns` for `cf.bstatic.com` (Booking's photo CDN)

**Routing:** `createDefaultProviderRouter` updates - for non-IT queries (or unknown IT destinations), fan out to `[BookingComProvider]`. MockItalyProvider stays for known IT destinations.

**Ship value:** answer "Tokyo, long weekend, foodie" with actual Tokyo properties. The `LLMSynthesizedProvider` becomes a fallback when Booking returns 0 results.

---

### B5 · Expedia + Vrbo + parallel ProviderRouter

**Goal:** Multi-provider competition. Routing fans out to all three (Booking + Expedia + Vrbo) in parallel; results merge with provenance attribution.

**Adds:**
- `src/providers/expedia/` - same three files as Booking
- `src/providers/vrbo/` - vacation-rental focused (Vrbo via Expedia Partner Solutions)
- `src/providers/_shared/parallel-router.ts` - `ParallelProviderRouter` fans out to all enabled providers, races with timeout, merges + dedupes
- `src/orchestrator/orchestrator.ts` integration - `proposal.provenance.computed` event now fires with real provenance map (Stay X is "best price from Vrbo · 12% cheaper than Expedia")
- `Stay.advantages` populated in the orchestrator post-merge - drives "Best price" / "Most flexible cancellation" badge surfacing in Slice C's UI

**Mobile note:** Vrbo's vacation rentals (whole-home, multi-bedroom) are where family-trip queries shine - pairs well with Slice A's strong family-friendly signals.

---

### B6 · Affiliate infrastructure

**Goal:** Make money. Click → redirect → conversion → revenue tracking.

**Adds:**
- `src/lib/affiliate/wrap-attribution.ts` - wraps every `Stay.bookingLink.url` with `https://stayscout.com/r/<linkId>` at proposal-render time
- `src/app/r/[linkId]/route.ts` - POST/GET handler: records `AffiliateClick` row in Postgres, 302s to upstream affiliate URL with their tracking params
- `src/app/api/postbacks/[provider]/route.ts` - webhook receivers for Booking/Expedia/Vrbo conversion postbacks, updates `AffiliateClick.converted` + `commissionAmount`
- `src/lib/affiliate/click-attribution-context.ts` - propagates `(sessionId, turnId, userId?, stayId)` into the redirect URL
- Tests: tampering protection (signed link IDs)

**Ship value:** revenue. Every booking through StayScout earns commission. Conversion attribution complete enough for the eventual admin dashboard (Slice C).

---

### B7 · Langfuse observability

**Goal:** every agent run, every model call, every event traceable.

**Adds:**
- `pnpm add langfuse`
- `src/lib/observability/langfuse-trace-logger.ts` - implements `TraceLogger` interface
- One-line wire-up in `src/orchestrator/singleton.ts`: `traceLogger: new LangfuseTraceLogger(env.LANGFUSE_*)`
- Per-event spans, per-agent runs, per-model token + cost tracking
- Trace correlation across the multi-agent graph (B2)

**Doesn't yet:**
- Build a custom trace UI (use Langfuse's hosted UI)
- Aggregate dashboards (Slice C's admin panel does that)

**Ship value:** debugging. Every demo turn becomes a complete traceable record. Cost tracking exact per turn.

---

### B8 · Programmatic SEO

**Goal:** Be discoverable. Generate `/destinations/[slug]` pages for every curated destination, plus dynamic ones for the most-searched non-curated locations.

**Adds:**
- `src/app/destinations/[slug]/page.tsx` - RSC page rendering: editorial blurb (LLM-generated, taste-linted), curated stays for that destination, "Plan a trip here" CTA that pre-fills the workspace
- `src/app/sitemap.ts` - generated from `ITALIAN_DESTINATIONS` + a Postgres-backed `Destination` table populated as users search non-curated cities
- `src/app/robots.ts`
- JSON-LD `LodgingBusiness` + `TouristAttraction` schema markup
- `<FeaturedStaysSection>` from Slice A's marketing now reused on these pages
- `src/lib/seo/destination-content.ts` - caching layer for LLM-generated blurbs (24h TTL)

**Crawl budget**: Slice B starts with ~20 destinations (the 7 curated + 13 most-searched). Slice C scales to thousands.

**Ship value:** organic search traffic. Each destination page is a landing page that converts to workspace use.

---

### B9 · Mobile bottom-sheet redesign

**Goal:** Replace Slice A10's "graceful but not optimized" mobile stack with the proper thumb-first design from spec §5.16.

**Adds:**
- `pnpm add vaul`
- `src/features/workspace/mobile/` - bottom-sheet workspace shell
- Canvas takes full viewport on mobile; chat is a `vaul` `<Drawer>` with three states: collapsed (peek of input bar), half-expanded (input + recent message), fully-expanded (full thread)
- Swipe gestures, touch-optimized 44px+ targets, haptics on supported browsers
- Detail panel becomes full-screen modal on mobile (was 480px side panel on desktop)
- Compare tray sticks to bottom-above-drawer
- PWA manifest + install prompt

**Ship value:** mobile becomes a first-class experience. Investor demos work on phones, real users on phones convert.

---

### B10 · Hotelbeds + final polish + production deploy

**Goal:** Ship to production. Real domain, real users, real revenue.

**Adds:**
- `src/providers/hotelbeds/` - wholesaler API (best for hotel inventory in markets where direct affiliates underperform)
- Provider routing logic refined - for any given query, picks 2-3 providers based on capability + region heuristics
- Performance pass: bundle size, image optimization, edge caching, route handler runtime profiling
- Vercel production environment variables checklist
- Health check route (`/api/health`)
- Error monitoring (Sentry) wired to `traceLogger`
- DNS + custom domain
- Privacy policy, terms of service, GDPR cookie consent

**Ship value:** stayscout.com is live and bookable.

---

## 4. Recommended sub-slice order

The natural order is **B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → B10**, but there's a meaningful choice on the early ordering:

**Option α (foundation-first, recommended):** B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → B10
- Pro: each slice depends only on what came before. No rework.
- Con: takes longer to see the first "real provider" win (B4 is week 4-ish in a real-team estimate).

**Option β (provider-first):** B4 → B1 → B2 → B3 → B5 → B6 → B7 → B8 → B9 → B10
- Pro: real Booking.com data appears in Slice A's existing UI immediately (just swap the LLMSynthesizedProvider). Most demo-able.
- Con: when B1 lands, B4's mock turn-history needs migrating.

**Recommendation: α.** B1 unblocks every later slice (LangGraph wants Postgres, affiliate wants AffiliateClick rows, SEO wants a Destination table). The ordering pain in β is bigger than the demo win.

---

## 5. Mock-first invariant

Every Slice B sub-slice has a hard rule: **the system runs end-to-end without any new external API keys.** The dev experience is identical to Slice A's. Real-API code lives behind environment-flag gates with mock fallbacks.

This means:
- Postgres → SQLite mode for dev (Prisma supports it), Postgres for prod
- Clerk → `ClerkProvider` works in test mode without a real account; sign-in is mocked
- Booking/Expedia/Vrbo → mock JSON files matching real response shapes (the same shapes that ship the real `mapper.ts`)
- Langfuse → no-op fallback if `LANGFUSE_*` env vars unset
- Affiliate redirect → records to console + DB; no real upstream redirect in dev
- LangGraph → can run in single-process mode without checkpointer if dev wants it

The user can ship **all of B1–B10 to production with zero real-provider keys** if they want - the system would still work end-to-end with mocks-on-record. Real providers swap in by setting environment variables.

---

## 6. Decomposition for execution

Slice A had ten sub-slices, each one ~1 turn of focused implementation. Slice B is comparable in code volume but each sub-slice is more nuanced because it touches real-world systems. Realistic per-slice cost in this collaborative format:

| Sub-slice | Files added | Effort feel |
|---|---|---|
| B1 | ~25 (schema + Prisma + Clerk + middleware + session store) | medium |
| B2 | ~12 (graph nodes + checkpointer + singleton swap) | medium-heavy |
| B3 | ~16 (4 agents × 3 files + integration tests) | medium-heavy |
| B4 | ~10 (one provider - established pattern) | medium |
| B5 | ~14 (two providers + parallel router) | medium |
| B6 | ~12 (redirect handler + postbacks + DB + signing) | medium |
| B7 | ~6 (one impl, mostly wire-up) | light |
| B8 | ~14 (per-destination pages + sitemap + JSON-LD) | medium |
| B9 | ~16 (mobile redesign - visual + touch handling) | medium-heavy |
| B10 | ~12 (Hotelbeds + perf pass + deploy config) | medium |

Total: ~135 new files. Slice A was ~150. Comparable.

---

## 7. Open questions before B1

Before writing the B1 plan, I want a confirmation on three points:

**1. Postgres host preference.** Default would be **Supabase** (postgres + auth in one product, generous free tier, edge-friendly), but Neon is a clean alternative (serverless postgres, better cold-start, no bundled auth - pairs with Clerk). Either works. Pick by gut.

**2. Auth strategy.** Default **Clerk** (best DX, generous free tier, fewer surprises). Alternative: **Auth.js** (NextAuth) if you want to own more of it. Clerk for B1 unless you say otherwise.

**3. Anonymous-to-authenticated migration.** When a user signs up after using the workspace anonymously, do their session-only saved trips migrate to their account? Default **yes** - feels concierge-like. Cost is minor (a one-time copy of `session.turns` to `User.trips` on first auth).

If you say "go with defaults," I write the B1 plan with Supabase + Clerk + auto-migration. Or override any of the three.

---

## 8. Glossary additions

| Term | Meaning |
|---|---|
| **Mock-first** | Every Slice B real-API integration ships with a mock that the same code path uses when env vars are unset |
| **Provenance attribution** | Per-stay claim "best price from Vrbo · 12% cheaper" populated by ParallelProviderRouter post-merge |
| **Affiliate postback** | Webhook from Booking/Expedia confirming a click resulted in a booking; updates `AffiliateClick.converted` |
| **Graph checkpointer** | LangGraph's mechanism for persisting partial graph state - lets us replay or resume a turn |

---

*End of Slice B design specification. After confirmation on §7's open questions, write `docs/superpowers/plans/2026-05-08-slice-b1-persistence-and-auth.md` and execute.*
