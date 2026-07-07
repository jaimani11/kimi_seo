# Slice C3 Implementation Plan - ItineraryAgent (multi-day plans)

> Executed inline, batched, only pausing for real blockers.

**Goal:** Saved trips can be expanded into a day-by-day itinerary - activities, meals, transit, sequenced morning → late evening. The saved-trips panel grows a "Plan day-by-day" link; clicking it opens a server-rendered itinerary page at `/trips/[tripId]/itinerary`. Mock-safe end-to-end via curated 3-day itineraries for the 7 Italian destinations + a generic synthesized fallback.

**Architecture:** A new `Itinerary` type (Day → Slot, where Slot is one of Activity / Meal / Transit / Rest). An `ItineraryGenerator` interface with two impls: `CuratedItineraryGenerator` (lookup-based; the C3 demo path) and `ModelItineraryGenerator` (live model + activity-provider context; lands in C3.x once we have Viator wired). An `ItineraryStore` caches generated itineraries per `tripId` so revisiting the page doesn't regenerate. A new owner-gated route `/trips/[tripId]/itinerary` renders the view. Saved-trip rows + the resurfaced canvas hero gain a "Plan day-by-day" CTA linking to the page.

**Tech Stack:** No new deps. Curated content lives in `src/lib/curation/itineraries.ts` next to the existing destinations + moods.

---

## Architectural Tenets (Opus-level)

**1. Itineraries are tied to saved trips.** The user must save a trip before planning a day-by-day. Reason: the day-by-day is a richer commitment than the initial "what does my trip look like" - if it's worth planning out, it's worth saving. Also gives a stable URL (`/trips/[tripId]/itinerary`) without needing share-slug semantics.

**2. The shape is editorial, not booking.** Itinerary slots are descriptive ("a slow walk from the Boboli Garden"), not transactional ("3pm reservation at X"). Reason: a 3-day plan you can adjust is far more useful than a rigid 3-day schedule the model will get wrong on dates/availability. C3.x layers Viator activity search to add bookable items to specific slots; the editorial frame stays.

**3. Generator behind one interface.** `CuratedItineraryGenerator` (lookup) and `ModelItineraryGenerator` (live model) both satisfy `ItineraryGenerator.generate(trip): Promise<Itinerary>`. C3 ships only the curated path. Switching is one factory line.

**4. Curated coverage is real, not stub.** Hand-written 3-day itineraries for all 7 Italian destinations from the existing curation library. ~5–6 slots per day × 3 days × 7 destinations = ~105 slots of authored content. Voice rule applies: italic Fraunces fragments, no banned words; the existing `containsBannedWord` lint runs across every slot description.

**5. Generic synthesized fallback.** For destinations outside the curated list (e.g. someone saves a Tokyo trip via LLMSynthesizedProvider), the synthesized generator produces a reasonable 3-day skeleton derived from the trip's intent (vibe tags, traveler composition). It's mediocre on detail but never crashes the UX.

**6. Cache by tripId, ephemeral.** `InMemoryItineraryStore` caches generated itineraries per tripId so navigating away + back doesn't re-generate. Process-local; Postgres-persisted itineraries land in C3.x when worth keeping across deploys. Critically: regeneration is cheap (curated lookup is O(1)); the cache is convenience, not correctness.

**7. Mock-safe end-to-end + owner-gated.** No keys needed for the demo. The page is owner-gated on the underlying `Trip.ownerKind/ownerId`; the server-rendered route 404s if the requester doesn't own it.

---

## File Structure

**Create:**
- `src/core/itinerary.ts` - Zod schemas + types for `Itinerary`, `ItineraryDay`, `ItinerarySlot`
- `src/lib/itinerary/generator.ts` - interface + `CuratedItineraryGenerator` + `SynthesizedItineraryGenerator`
- `src/lib/itinerary/itinerary-store.ts` - interface
- `src/lib/itinerary/in-memory-itinerary-store.ts` - process-local cache
- `src/lib/itinerary/factory.ts` - `getItinerarySubsystem()`
- `src/lib/itinerary/index.ts` - barrel
- `src/lib/curation/itineraries.ts` - `CURATED_ITINERARIES: Record<slug, Itinerary>` (7 destinations × 3 days)
- `src/app/trips/[tripId]/itinerary/page.tsx` - server-rendered itinerary page
- `src/features/itinerary/itinerary-view.tsx` - visual layout (day blocks, slot cards)
- `src/features/itinerary/slot-card.tsx` - individual slot
- `tests/itinerary-curation.test.ts` - every curated entry passes voice lint + has well-formed days
- `tests/itinerary-generator.test.ts` - curated lookup vs synthesized fallback
- `tests/itinerary-store.test.ts` - round-trip + owner isolation

**Modify:**
- `src/features/workspace/saved-trips/saved-trip-row.tsx` - add "Plan day-by-day" link
- `src/features/workspace/saved-trips/saved-trips-panel.tsx` - pass through the link
- `src/lib/env/get-server-features.ts` - surface `itineraryGenerator: 'curated' | 'model'` for `/admin`

---

## Tasks

### Task 1: Itinerary types + schemas

- [ ] `src/core/itinerary.ts`: define Zod schemas:
  - `ItinerarySlotKind = 'activity' | 'meal' | 'transit' | 'rest'`
  - `ItineraryStartHint = 'morning' | 'midday' | 'afternoon' | 'evening' | 'late'`
  - `ItinerarySlot { id, kind, startHint, title, detail, durationMinutes?, location?, costTier?, tags? }`
  - `ItineraryDay { dayNumber, theme, slots }`
  - `Itinerary { tripId, generatedAt, source: 'curated' | 'synthesized', days, summary }`
- [ ] Export branded `ItineraryId` if needed; otherwise tripId is the key.
- [ ] Verify: typecheck.

### Task 2: Curated itineraries (`src/lib/curation/itineraries.ts`)

- [ ] Hand-author 3-day itineraries for tuscany, umbria, amalfi, rome, venice, lake-como, cinque-terre.
- [ ] Each day: 5–6 slots (morning activity, midday meal, afternoon activity, evening meal, optional late). Voice rule: italic Fraunces fragments, no banned words.
- [ ] Slot detail strings ≤ 220 chars.
- [ ] Test (`itinerary-curation.test.ts`): every slot passes `containsBannedWord`; every itinerary has exactly 3 days; every day has ≥4 slots; titles are non-empty.

### Task 3: Generator + Store + factory + tests

- [ ] `generator.ts`: `ItineraryGenerator` interface with `generate(args): Promise<Itinerary>`. `CuratedItineraryGenerator` looks up by destination slug (matching the existing `findDestinationBySlugOrAlias`). Falls through to `SynthesizedItineraryGenerator` when no curated match. The synthesized generator builds a generic 3-day skeleton: morning walk, lunch, afternoon explore, dinner, evening, with details derived from trip.intent (vibe tags + traveler composition + destination name).
- [ ] `in-memory-itinerary-store.ts`: process-singleton cache (HMR-safe globalThis). `get(tripId)` / `put(itinerary)`.
- [ ] `factory.ts`: `getItinerarySubsystem()` → `{store, generator, kind}`.
- [ ] Tests (`itinerary-generator.test.ts`): curated path returns a curated itinerary; non-curated destination returns synthesized; both pass schema parse. (`itinerary-store.test.ts`): round-trip + owner-isolation via tripId.

### Task 4: Server-rendered page `/trips/[tripId]/itinerary`

- [ ] `app/trips/[tripId]/itinerary/page.tsx`: server component.
  - Resolve owner via `getServerAuth()`.
  - Look up trip via `getSessionStore().getTrip({owner, tripId})`. 404 if not owned.
  - Look up cached itinerary via `getItinerarySubsystem().store.get(tripId)`. Generate if missing; cache the result.
  - Render `<ItineraryView>` with the itinerary.
  - `generateMetadata`: returns title + description with the destination + heroStayName.
- [ ] Verify: typecheck + lint.

### Task 5: ItineraryView UI

- [ ] `itinerary-view.tsx`: full-bleed layout with hero (destination + dates summary), then 3 day blocks. Each day block: theme line + slot column.
- [ ] `slot-card.tsx`: chip for kind (activity/meal/transit/rest) + start hint + title (Fraunces) + detail (italic Fraunces) + tags.
- [ ] Visual polish: same vocabulary as the canvas/destination pages - surface-elevated cards on the dark base.

### Task 6: CTA wiring

- [ ] Saved-trip row gains a small "Plan day-by-day" link (Link to `/trips/[tripId]/itinerary`). Lives below the hero name; doesn't conflict with existing Share/Remove buttons.
- [ ] No other workspace surface change in C3 - the canvas + detail panel keep their existing affordances.

### Task 7: Pipeline + changelog + slice-c3 tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`. Fix anything that flares.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-c3.md`.
- [ ] Tag `slice-c3`. Commit at logical milestones.

---

## What stays unchanged

- `OrchestratorEvent` shape - no new event kinds; itineraries are out-of-band from the turn flow.
- LangGraph engine - untouched.
- Auth / persistence / share / redirect / providers / monitoring / memory - all preserved.

## Out of C3 scope (deferred to C3.x)

- `ModelItineraryGenerator` - live model + activity-provider context for non-curated destinations. Lands when Viator/GetYourGuide is wired.
- Editing slots (drag-and-drop, manual swaps).
- Sharing an itinerary (separate share-slug surface).
- Stripe gate (C4 will lock the CTA behind premium for non-curated destinations).
- PDF / iCal export.
- Postgres-persisted itineraries.
