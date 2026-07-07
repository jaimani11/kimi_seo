# Slice C - Memory, Monitoring, Itinerary, Payments, Admin

> Continuation of the StayScout architecture from Slices A + B. Slice A built the cinematic foundation; Slice B built persistence + auth + share + redirect + provider framework + traces + dashboard. Slice C deepens the conversational memory, runs ongoing work in the background, generates rich itineraries, opens a paid tier via Stripe, and grows the operator console.

## Goal of Slice C

Move from "single-turn travel concierge" to **"travel concierge that remembers, watches, plans, and bills."** Each sub-slice ships independently, mock-safe by default, no breaking changes to the public surfaces of Slices A + B.

## Sub-slices

| Sub | Theme | Mock-safe primitive | Real-mode upgrade |
|---|---|---|---|
| **C1** | pgvector memory | `InMemoryMemoryStore` + naive bag-of-words retrieval | `PgvectorMemoryStore` + Anthropic embeddings |
| **C2** | MonitoringAgent (saved-trip watcher) | In-process scheduler, deterministic mock changes | Postgres-backed jobs + real provider re-search |
| **C3** | ItineraryAgent (multi-day plans) | Curated mock itineraries per destination | Live model + Viator/GetYourGuide for activities |
| **C4** | Stripe (premium tier) | `MockBillingProvider` - every user is "premium" in dev | Real Stripe checkout + webhook subscription state |
| **C5** | Admin panel extensions | All visible in dev (auth-public override) | Auth-gated views with click-to-conversion linking |

Each sub-slice ships with the same constraints used throughout Slice B:
- Public APIs invariant; new behavior layers on existing seams.
- No subagents, no per-task review pauses.
- Mock-safe is the invariant - keyless dev experience never degrades.
- One environment-flag turns each subsystem on; absence keeps the demo working.

---

## C1 - pgvector Memory

**Goal:** Persistent semantic memory across sessions + devices. The IntentAgent's prompt is enriched with relevant prior preferences ("we always travel in September", "we're vegetarian"), and the workspace surfaces a memory hint when the inference uses them.

**Architecture:**
- `MemoryStore` interface: `record(memory)`, `search(query, ownerKey)`. Two implementations:
  - `InMemoryMemoryStore` - process-local map of memory records, naive bag-of-words ranking. Always available.
  - `PgvectorMemoryStore` - Postgres + pgvector. Cosine similarity on embedded vectors. Active when `DATABASE_URL` is set + the `pgvector` extension is enabled.
- `EmbeddingProvider` interface: `embed(text): Promise<number[]>`. Two implementations:
  - `BagOfWordsEmbedding` - deterministic local embedding from token counts. Always available; stable hashes.
  - `AnthropicEmbedding` - uses the Anthropic embeddings API when `ANTHROPIC_API_KEY` is set + opt-in env flag (`STAYSCOUT_USE_ANTHROPIC_EMBEDDINGS=1`).
- `MemoryRecorder` - observes completed turns; persists durable memories (rawInput, intent vibe tags, traveler composition, observed preferences).
- IntentAgent (or a thin pre-step) queries `MemoryStore.search(rawInput, owner)` before the model call, includes top-K memories in the user prompt as context.
- Workspace already has `concierge.memory.hint` event from Slice A9 - Slice C populates it from real recall, not just the heuristic.

**Owner model:** Memory is owned per `User.id` (matches the existing trip ownership). Anonymous sessions get session-scoped memory; sign-in promotes via the existing migration path.

---

## C2 - MonitoringAgent

**Goal:** Saved trips become living. When the price drops, availability changes, or a featured stay opens up at a destination the user has saved, the next turn surfaces it.

**Architecture:**
- `MonitoringScheduler` - runs jobs at intervals. Two implementations:
  - `InProcessScheduler` - `setInterval`-driven, dev-only. Deterministic mock changes for demo.
  - `PostgresScheduler` - `pg_cron` or a simple "next_run_at" + worker poll. Production.
- `MonitoringAgent` - for each saved trip, periodically re-runs the provider search with the original intent + diffs against the last-known proposal. Material changes (price ≥ N% delta, hero unavailable, alternative now better-rated) become `MonitoringEvent`s.
- New event surface in workspace: `monitoring.update` - show on the Saved Trips panel as a small badge ("Hotel Cipriani · ↓ 12%") with a one-click resurface.

**Out of C2:** push notifications, email digests. C2 ships in-app surfacing only.

---

## C3 - ItineraryAgent

**Goal:** Saved trips can be expanded into a day-by-day itinerary - activities, restaurants, transit, sequenced by time-of-day.

**Architecture:**
- New agent `ItineraryAgent` - input: a saved trip + intent. Output: `Itinerary` (list of `Day` → list of `Slot` → `Activity | Meal | Transit`).
- Stored in a new `Itinerary` Prisma model attached to `Trip`.
- The detail/saved-trip UI grows a "Plan day-by-day" CTA that opens an `ItineraryView`.
- Mock-safe: curated per-destination mini-itineraries (one per Italian curated destination) covering ~3 days. Real-mode: live model + Viator activity search via the B5 framework.

---

## C4 - Stripe (premium tier)

**Goal:** Soft paywall around the most expensive features (itinerary generation, monitoring on >3 trips, advanced share/embed).

**Architecture:**
- `BillingProvider` interface: `getEntitlement(userId): Promise<Entitlement>`, `createCheckoutSession(userId, plan): Promise<CheckoutSessionUrl>`, `handleWebhook(event)`.
- `MockBillingProvider` - dev default; everyone is premium so the features are exercisable without a real Stripe account.
- `StripeBillingProvider` - when `STRIPE_SECRET_KEY` is set; real checkout + webhook → `Subscription` table.
- Server-side gates on premium-only routes (`/api/itinerary/generate`, etc.). UI shows lock icons + upgrade CTA when not entitled.

**Care points for C4 (Opus reasoning):**
- Webhook idempotency (Stripe retries are aggressive).
- Subscription state must be the source of truth; we never trust client-claimed "I'm premium."
- Refund + cancellation surface.
- PCI scope: zero - Stripe Checkout handles cards; we only see customer + subscription ids.
- Owner attribution: paid tier is tied to `User.id` (authenticated). Anonymous users get the dev mock or are forced to sign in before checkout.

C4 will get its own design pass when we get there - the C overall spec sketches it; the C4 plan handles the details.

---

## C5 - Admin panel extensions

**Goal:** Grow the B7 `/admin` shell from "telemetry only" to a real operator console.

**Pages:**
- `/admin` - summary (already exists)
- `/admin/turns/[turnId]` - drill into a single trace
- `/admin/clicks` - affiliate click feed + conversion mapping (linkable to B4 click rows)
- `/admin/users/[userId]` - user view: saved trips, memories, billing entitlement, recent turns
- `/admin/memories` - search the memory index (Slice C1's data)

**Auth:** The existing `STAYSCOUT_ADMIN_PUBLIC` override stays; Clerk-on mode requires sign-in.

---

## Mock-safe matrix (Slice C, end state)

| Var | Off (default) | On |
|---|---|---|
| `DATABASE_URL` | InMemoryMemoryStore + InProcessScheduler | PgvectorMemoryStore + PostgresScheduler |
| `STAYSCOUT_USE_ANTHROPIC_EMBEDDINGS` | BagOfWordsEmbedding | AnthropicEmbedding |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | MockBillingProvider (everyone premium) | StripeBillingProvider |

The keyless dev experience continues to ship every feature - just with simpler primitives backing them.

## Rollout order + dependencies

C1 → C5 is the natural dependency order (each sub-slice can use previous ones), but C2-C4 are independent of each other and could ship in any order after C1.

| Sub | Depends on |
|---|---|
| C1 | nothing new (uses Slice B persistence) |
| C2 | C1 (memory hint surface) |
| C3 | C1 (memory-aware itinerary) |
| C4 | nothing new (gates routes that exist or land in C3) |
| C5 | all preceding |

We start with **C1**.
