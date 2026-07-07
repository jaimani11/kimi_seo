# Slice F1 - Search opportunities (no fake hotels for unbacked destinations)

> The product evolves from "curated demo with affiliate links" to "real AI travel affiliate search engine."

**Goal:** When a user asks about a destination we don't have real or curated inventory for, **stop synthesizing fake property listings**. Show search-opportunity cards that route to real Expedia + Vrbo + Hotels.com affiliate searches instead. The AI still parses intent + understands the destination - it just stops hallucinating hotel names.

**Non-goal:** Removing curated Italy. MockItalyProvider holds 7 hand-tuned regions with real photography and accurate descriptions; those keep working as property listings. The shift is: anywhere we **don't** have real or curated data, we stop pretending and surface a search opportunity instead.

---

## The honesty problem we're fixing

Today, asking the concierge about Austria/Vancouver/Tokyo flows through `LLMSynthesizedProvider`, which asks Claude to invent 2–6 plausible hotels with names, descriptions, prices, and photos pulled from a category pool. They look like real listings. They aren't.

The user is asked to trust a UI that shows specific stays at specific prices - but those stays don't exist, the prices aren't current, and clicking through lands on a generic search anyway. The provenance chip says `AI PREVIEW`, but the listing copy looks like a hotel.

What the user actually wants for any destination we can't back with real inventory:
- "Hey, here's what I understand you're looking for."
- "Here's a real Expedia search prefilled with your dates, party size, and vibe."
- "Here's the Vrbo equivalent if you'd prefer vacation rentals."
- "Click either and you're on the actual site, looking at actual properties."

That's the search-opportunity card.

---

## Architectural Tenets

**1. No hallucinated property listings.** When real/curated data isn't available, we surface search opportunities - not invented hotels.

**2. Curated stays count as "real" data.** MockItaly's 7 Italian regions ship hand-tuned descriptions, real photography, accurate amenities. They render as property cards. Real-provider results (Rapid Expedia/Vrbo when keys land) also render as property cards.

**3. Search-opportunity cards are real Expedia/Vrbo searches.** Same affiliate-URL infrastructure as E2. Click → `/r/[id]` → real provider site with your `affcid` attached. Already monetizable today.

**4. Intent parsing stays AI-first.** Claude continues to extract destination, vibe, occupancy, lodging type from arbitrary prose ("Austria ski trip for 6 people", "Vancouver luxury weekend", "Lisbon under €200/night, near music"). The IntentAgent doesn't change.

**5. Refine actually re-shapes the search.** When the user refines - different vibe, different occupancy, different lodging type, swap destination - the same search-opportunity card updates its URL params. The CTA on screen always reflects current intent.

**6. Imagery becomes destination-aware.** Search-opportunity cards need to feel like the place. We extend the photo system with a destination → photo mapping (top ~100 destinations hand-curated), falling back to the category pool for unknown destinations.

**7. Provenance stays honest.** New chip vocabulary: `SEARCH · EXPEDIA`, `SEARCH · VRBO`, `SEARCH · HOTELS.COM`. Distinct from `EXPEDIA · LIVE` (real inventory). Users always know: "this is a real search → real Expedia," not "this is a listing."

**8. No new event schema gymnastics.** Reuse the existing `OrchestratorEvent` union. One new event kind: `search.opportunity.ready`. Workspace handles it the same way it handles `proposal.ready`. UI swaps `<TripBoard>` for `<SearchOpportunityBoard>`.

**9. No stuck skeleton states.** When the orchestrator decides "I'll emit search-opportunity here," it must shimmer briefly then transition cleanly to the cards - never strand the user on a blank canvas waiting for property data that's never coming.

**10. No hardcoded Tuscany-only assumptions.** Audit and remove anywhere the codebase assumes Italian destinations. The greeting suggestions, the destination-pickers, the example prompts should cover a real-world spread.

---

## File structure

**Create:**
- `src/core/search-opportunity.ts` - `SearchOpportunity` type + Zod schema
- `src/lib/affiliate/search-opportunity-builder.ts` - given intent, build the per-provider opportunity URLs (Expedia, Vrbo, Hotels.com)
- `src/lib/imagery/destination-photo.ts` - destination → photo lookup (hand-curated ~100 destinations + category fallback)
- `src/lib/imagery/destination-photo-data.ts` - the actual hand-curated mapping
- `src/orchestrator/route-search.ts` - `routeForIntent(intent) → { kind: 'inventory', providers } | { kind: 'opportunity', destinations }`
- `src/features/workspace/canvas/search-opportunity-board.tsx` - the UI board for `search.opportunity.ready`
- `src/features/workspace/canvas/search-opportunity-card.tsx` - single per-provider card
- `tests/search-opportunity-builder.test.ts`
- `tests/destination-photo.test.ts`
- `tests/route-search.test.ts`

**Modify:**
- `src/core/orchestrator-event.ts` - add `search.opportunity.ready` event
- `src/orchestrator/orchestrator.ts` - branch on `routeForIntent` decision: inventory path (existing) or opportunity path (new)
- `src/orchestrator/langgraph/nodes.ts` - same branch on the LangGraph engine
- `src/features/workspace/canvas/canvas.tsx` - switch between TripBoard and SearchOpportunityBoard based on the latest event
- `src/features/workspace/store/workspace-store.ts` - store the opportunity payload on the turn record
- `src/features/workspace/chat-sidebar/greeting.tsx` - diversify suggestions beyond Italy
- `src/features/shared/provenance-badge.tsx` - extend with `search-expedia` / `search-vrbo` / `search-hotels-com` tones

**Deprecate / repurpose:**
- `src/providers/llm-synthesized/` - no longer generates Stay[]. Repurposed into a `DestinationFlavorAgent` that emits a single short editorial line about the place (used inside search-opportunity cards). All the fake-hotel synthesis code retires.

---

## Tasks

### Task 1 - Core type + event

- [ ] `src/core/search-opportunity.ts`:
  ```ts
  export const SearchOpportunitySchema = z.object({
    destination: z.object({
      name: z.string(),
      country: z.string().length(2),
      region: z.string().optional(),
    }),
    intentDigest: z.object({
      vibeTags: z.array(VibeTagSchema),
      checkIn: z.string(),         // ISO YYYY-MM-DD
      checkOut: z.string(),
      adults: z.number().int().min(1),
      children: z.number().int().min(0),
    }),
    providers: z.array(z.object({
      providerId: z.enum(['expedia', 'vrbo', 'hotels-com']),
      displayName: z.string(),
      url: z.string().url(),
      // Optional editorial copy describing why this provider is a good fit
      // for this destination (e.g. "Vrbo is strong here - ski-in/ski-out
      // chalets, lots of rentals."). Omitted means use the default tag line.
      hint: z.string().max(180).optional(),
    })),
    // One-line "feel of the place" editorial copy from the DestinationFlavorAgent.
    flavor: z.string().max(220).optional(),
    photoUrl: z.string().url(),
    photoAlt: z.string(),
    photoCredit: z.string(),
    fetchedAt: z.string().datetime(),
  });
  ```
- [ ] Extend `OrchestratorEventSchema` with the new event:
  ```ts
  z.object({
    kind: z.literal('search.opportunity.ready'),
    turnId: z.string(),
    opportunity: SearchOpportunitySchema,
  })
  ```
- [ ] Tests: schema round-trip; valid + invalid cases.

### Task 2 - Search-opportunity URL builder

- [ ] `src/lib/affiliate/search-opportunity-builder.ts`:
  ```ts
  buildSearchOpportunity(intent: TripIntent): SearchOpportunity
  ```
  - For each of Expedia, Vrbo, Hotels.com - generate a real affiliate search URL.
  - Expedia: reuses `buildExpediaSearchUrl` from E2.
  - Vrbo: deeplink to `vrbo.com/search?q={destination}&checkin={ci}&checkout={co}&adults={a}&affiliateId={aid}`.
  - Hotels.com: similar pattern; the Expedia Group affcid often works here too.
  - Each URL respects current intent (dates, occupancy, optional lodging-type hint).
- [ ] Tests: per-provider URL contains destination + dates + occupancy + affcid; URLs change when intent changes (refine path).

### Task 3 - Destination photo lookup

- [ ] `src/lib/imagery/destination-photo.ts`:
  ```ts
  resolveDestinationPhoto(destination: { name, country, region? }): { url, alt, credit }
  ```
  - Hand-curated table of ~100 destinations (Austria/Innsbruck/Vancouver/Tokyo/etc.) with one curated Unsplash id each.
  - Fallback: hash by destination name, pick from the existing category pool (cityscape if urban-named, mountains if a known mountainous region, beach if coastal, countryside otherwise).
  - Same destination → same photo across renders.
- [ ] Tests: known destination returns hand-curated; unknown destination falls through to category; deterministic same-name-same-photo.

### Task 4 - Routing decision

- [ ] `src/orchestrator/route-search.ts`:
  ```ts
  type RouteDecision =
    | { kind: 'inventory'; providers: Provider[] }   // run real/curated providers
    | { kind: 'opportunity'; destination: Destination };  // emit search.opportunity.ready

  routeForIntent(intent: TripIntent, registry: Registry): RouteDecision
  ```
  - **Inventory path** when ANY of:
    - A real provider (`features.providers.expedia` or `.vrbo` or `.bookingCom`) is configured AND its capability matches the destination
    - MockItalyProvider serves the destination (`destination.country === 'IT'` AND known curated slug)
  - **Opportunity path** otherwise.
- [ ] Tests: Italy → inventory (mock-italy). Tokyo + no Rapid → opportunity. Tokyo + Rapid → inventory.

### Task 5 - DestinationFlavorAgent (LLMSynthesized repurposed)

- [ ] `src/agents/destination-flavor-agent.ts`:
  - Takes `{ destination, intent }`.
  - Returns `{ flavor: string }` - one short editorial line (≤220 chars) describing what's distinctive about the destination given the intent.
  - Voice rule applies (italic Fraunces-friendly, no banned words).
  - Mock-safe: deterministic stub when no Anthropic key.
- [ ] Retire the fake-hotel parts of `LLMSynthesizedProvider`:
  - Keep `coerceLlmStayBatch` only for legacy callers that haven't migrated (will be removed once migration is complete).
  - Strip from `routeProviders` / `searchWithFanout`.
- [ ] Tests: agent returns a non-empty flavor; respects banned-word lint.

### Task 6 - Orchestrator branch

- [ ] `src/orchestrator/orchestrator.ts`:
  - After intent extraction, call `routeForIntent`.
  - If `'inventory'` → existing flow (provider search → proposal builder → `proposal.ready`).
  - If `'opportunity'` → DestinationFlavorAgent + buildSearchOpportunity + destination photo lookup → emit `search.opportunity.ready`.
  - The turn still completes cleanly (`turn.completed`). No stuck skeletons.
- [ ] Same branch in `src/orchestrator/langgraph/nodes.ts`.
- [ ] Tests: full event sequence for Tokyo (intent → search opportunity → completed); for Tuscany (intent → proposal → completed); for Vancouver (intent → search opportunity).

### Task 7 - Workspace UI

- [ ] Extend the workspace store to capture `opportunity` per turn alongside `proposal`.
- [ ] `<SearchOpportunityBoard>`:
  - Hero band: destination name + flavor copy + photo.
  - Three (or N) `<SearchOpportunityCard>` tiles - Expedia, Vrbo, Hotels.com.
  - Each card: provider logo/wordmark, "Search Tokyo on Expedia →", optional hint line, photo, real `/r/[id]` link.
  - Bottom strip: intent digest chip ("2 adults · Sep 1–5 · luxury, walkable").
- [ ] `<Canvas>` switches between `<TripBoard>` and `<SearchOpportunityBoard>` based on which event the turn carries.
- [ ] Provenance chips on opportunity cards: `SEARCH · EXPEDIA` etc. (distinct tone from `EXPEDIA · LIVE`).

### Task 8 - Refine flow propagates to opportunity URLs

- [ ] When the user refines on a turn whose result was an opportunity, the new intent re-runs `buildSearchOpportunity`. The cards re-render with updated URLs. The intent digest chip updates.
- [ ] Saving an opportunity turn is allowed but with a distinct shape - the SavedTrip carries the opportunity payload (not a proposal). Render as a saved-trip row pointing to the search rather than a hero stay.
  - **Out of F1 scope:** the saved-trip variant for opportunities. F1 focuses on the live concierge surface; saving an opportunity lands in F1.x.

### Task 9 - Misc audit + polish

- [ ] Greeting suggestions: replace the current 3 with a more diverse spread:
  - "Austria ski trip for 6 people"
  - "Vancouver luxury weekend"
  - "Tuscany, slow and walkable"
  - "Tokyo for a long weekend"
  - "Lisbon under €200/night, near music"
- [ ] Audit codebase for hardcoded `'Tuscany'` / `'Italy'` strings - flag any that bias defaults toward Italy. Italy can stay as the strongest curated demo, but it shouldn't be the only mention in fallback paths.
- [ ] No stuck skeletons: verify the shimmer placeholder transitions cleanly for opportunity-path turns. (Existing shimmer is keyed on `phase === 'shimmering'`; works as-is since the orchestrator still emits `proposal.shimmering` before either branch.)
- [ ] Update `.env.example` if any new env vars surface (Hotels.com if it needs separate creds).

### Task 10 - Tests + pipeline + commit + tag

- [ ] All new tests pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
- [ ] One logical commit per task or grouped where natural; final summary commit.
- [ ] Tag `slice-f1`.

---

## What stays unchanged

- IntentAgent and the AI parsing flow.
- MockItalyProvider for the 7 Italian regions (still serves as a real demo with property cards).
- Affiliate URL infrastructure (E2) - Expedia builder, link encoder, `/r/[id]`.
- Provider provenance UI (E1) - extended with new chip tones, not replaced.
- ExpediaProvider Rapid adapter (E1) - wakes up when keys land; this slice doesn't depend on it.
- Concierge stream protocol - additive event, no breaking changes.

## Out of F1 scope (deferred)

- Saving an opportunity turn as a SavedTrip variant - F1.x.
- Per-property Vrbo deeplinks (we currently link to search; deeplink → individual rental requires Vrbo property catalog access).
- A real CountryDestinationCatalog (we hand-curate ~100 in F1; future work expands to ~1000 via a real dataset).
- The DestinationFlavorAgent's mood-snapshot integration (the agent already emits flavor copy; merging with `MoodSnapshotAgent` is a separate consolidation pass).
- Removing the existing `LLMSynthesizedProvider` entirely - kept dormant until we're confident no flow needs it. Full removal in F1.x.
- Hotels.com affiliate-creator account separately. The Expedia affcid often works on hotels.com URLs (same group); F1 reuses it. If a partner has a distinct hotels.com program, that's a one-line env var addition in F1.x.

## Mock-safe matrix (end of F1)

| Vars | Behavior |
|---|---|
| (none) | MockItaly for Italy → property cards. Anywhere else → search-opportunity cards pointing at Expedia/Vrbo/Hotels.com. CTAs work; commission untracked. |
| `NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID` | Same as above, plus affcid attached on every CTA → commission tracks. |
| `EXPEDIA_API_KEY` + `EXPEDIA_SHARED_SECRET` | Italy stays curated (mock-italy beats Rapid for known regions). Everywhere else → real Expedia property cards (no more search-opportunity for those destinations). |
| `VRBO_*` set | Vrbo vacation-rental property cards on top of any vacation-rental-friendly destination. |
| All set | Inventory mode everywhere supported; search-opportunity only for destinations no provider has capability for (rare edge). |
