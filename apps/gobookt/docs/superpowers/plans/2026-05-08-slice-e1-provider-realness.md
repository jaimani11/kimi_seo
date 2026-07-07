# Slice E1 - Provider Realness

> Executed inline. Stop feeling like a curated demo; start behaving like a real travel-discovery engine.

**Goal:** Make the data + AI layer real. The UI stays as it is - but listings feel sourced (provider provenance visible), photos vary per-stay rather than per-category, the Expedia/Vrbo adapter shape is production-accurate, and refines actually change ranking + reasoning. No fake autonomous booking. No new architectural slices.

**Non-goal:** Live API integration with Expedia / Vrbo / Booking.com - those require partner approval. We ship the adapter shape + setup docs so a partner-approved deploy has a one-line cutover.

---

## Why this matters

The current demo has every architectural surface in place but **three honesty gaps** make it feel like a curated mock:

1. **Provenance is invisible.** A `mock-italy` stay, an `expedia` stay, and an `llm-synthesized` stay look identical in the UI. The `badges` array on each provider result has a `'preview'` kind for synthesized content - never rendered.
2. **One photo per category.** Every cityscape stay shows the same Unsplash URL. The Tokyo capsule pod and the Tokyo modern apartment have the **same photo**.
3. **Refine doesn't change much downstream.** Vibe-tag overlap is the dominant ranking signal, and only `family-friendly` / `walkable` / `luxury|budget|mid-range` get bespoke treatment. "Wellness," "foodie," "romantic," "remote" all flow through tag-overlap only. Avoid + must-have don't filter.

Plus a **realism gap on the integration side**: the Expedia adapter's HTTP shape is sketchy (Basic auth instead of the HMAC signature EPS Rapid v3 uses; legacy `api.ean.com` endpoint instead of `api.ean.com/v3` with proper headers; affiliate URL is hand-rolled rather than EAN-style).

This slice fixes the visible honesty issues, strengthens the integration adapter so partner-approved deploys don't have to rewrite it, and adds Vrbo as a sibling so the "provider family" pattern is exercised twice.

---

## Architectural Tenets

**1. Provenance is non-negotiable.** Every listing renders a provider chip - `EXPEDIA · LIVE`, `BOOKING.COM · LIVE`, `CURATED · ITALY`, `AI PREVIEW`. Users always know where the data came from.

**2. AI Preview is loud.** Synthesized stays get a visible chip plus a soft accent on photos (a small "AI" sigil). They still look beautiful; they're just labeled honestly.

**3. The Rapid adapter is production-shaped.** When EXPEDIA_API_KEY + EXPEDIA_SHARED_SECRET land, the code that ships in this slice should make real EPS Rapid calls with the right HMAC signature, the right request schema, and the right redirect URL. Setup walkthrough lives in `docs/providers.md`.

**4. Vrbo is a Rapid sibling.** Expedia Group acquired Vrbo in 2015; their API surface is the same EPS Rapid endpoints with `category` filter set to vacation-rental types. We share the HTTP client + signature + mapper, with one specialization layer.

**5. Refine changes ranking visibly.** Intent-delta is already computed; this slice wires it into ranking so a refine like "less remote" actually drops remote stays in score, and reasoning chips cite the specific change.

**6. Photo diversification is deterministic.** Same stay slug → same photo (so a refresh doesn't flicker), but different stays in the same category → different photos. Hash-based selection from a pool.

**7. Booking.com stays affiliate-redirect (no booking).** Booking.com's affiliate program is deeplink-based, not search-API-based for unapproved partners. The existing adapter pattern (search via mock/LLM, redirect via affiliate URL) is correct; we just polish the redirect URL builder.

**8. No new core types.** Everything builds on `Stay`, `ProviderSearchResult`, `TripIntent`. Provenance UI is purely additive on existing data.

---

## File structure

**Create:**
- `src/features/shared/provenance-badge.tsx` - small `<ProvenanceBadge providerId, badges?>` component used on every stay card.
- `src/providers/_shared/photo-pool.ts` - `pickPhotoId(category, slug)` - hash-based selection from a pool of ~5 photos per category.
- `src/providers/_shared/rapid-signature.ts` - Expedia EPS Rapid HMAC-SHA512 signature builder (shared by Expedia + Vrbo).
- `src/providers/vrbo/{client,index,mapper,types}.ts` - Vrbo provider via Rapid with vacation-rental category filter.
- `docs/providers.md` - setup walkthrough for EPS Rapid, Vrbo, Booking.com Affiliate Partner Network.
- Tests: `provenance-badge.test.tsx` (visual snapshot via DOM render), `photo-pool.test.ts`, `rapid-signature.test.ts`, `vrbo-mapper.test.ts`, `ranking-refine.test.ts`.

**Modify:**
- `src/providers/llm-synthesized/photo-resolver.ts` - switch from one photo per category to deterministic-pool selection.
- `src/providers/llm-synthesized/index.ts` - bump the `'preview'` badge label from "AI Preview" to a more specific signal so the UI can render the matching chip.
- `src/providers/expedia/client.ts` - switch to real EPS Rapid v3 endpoint pattern, HMAC-SHA512 signature header, request shape per the public Rapid Shopping API.
- `src/providers/expedia/mapper.ts` - affiliate redirect URL via the existing `/api/go` route (so click attribution flows through B4's pattern); EAN-style deeplink params.
- `src/providers/expedia/index.ts` - emit `'live'` badge with "Expedia · Live" label.
- `src/providers/index.ts` - register Vrbo alongside Expedia + BookingCom.
- `src/providers/mock-italy/ranking.ts` - add weights for `wellness`, `foodie`, `romantic`, `cultural`, `remote`, `iconic-landmarks`. Apply must-have and avoid filters before scoring.
- `src/orchestrator/synthesize-adaptation.ts` - adaptation notes cite the specific intent-delta (added/removed vibes, budget changes, must-have additions).
- `src/features/workspace/canvas/trip-board/hero-stay-card.tsx` - render `<ProvenanceBadge>`.
- `src/features/workspace/canvas/trip-board/alternative-card.tsx` - render `<ProvenanceBadge>`.
- `src/features/workspace/detail/detail-panel.tsx` - render `<ProvenanceBadge>` on the detail header.
- `.env.example` - add Vrbo placeholder section.

---

## Tasks

### Task 1 - Provider provenance pill

- [ ] `src/features/shared/provenance-badge.tsx`:
  - Accepts `providerId: ProviderId`, optional `badges?: ProviderBadge[]`.
  - Maps providerId → canonical chip text + tone:
    - `expedia` → `EXPEDIA · LIVE` (accent-primary)
    - `vrbo` → `VRBO · LIVE` (accent-primary)
    - `booking-com` → `BOOKING.COM · LIVE` (accent-primary)
    - `mock-italy` → `CURATED · ITALY` (accent-primary)
    - `llm-synthesized` → `AI PREVIEW` (accent-warning, distinct tone)
    - Unknown → providerId as-is, ink-tertiary tone
  - Uses geist-mono uppercase, surface-overlay background, 1px border in the chosen tone, 0.55rem font (matches `EntitlementBadge` vocabulary from C4).
- [ ] Render in `hero-stay-card.tsx`, `alternative-card.tsx`, `detail-panel.tsx`. Top-right of the card on hero/alternative; top of the metadata block on detail.

### Task 2 - Photo diversification

- [ ] `src/providers/_shared/photo-pool.ts`:
  - Pool of 5 hand-curated Unsplash IDs per `PhotoCategory`.
  - `pickPhotoId(category, slug)`: hash the slug (FNV-1a like the rest of the app); index into the pool. Same slug → same photo.
- [ ] `src/providers/llm-synthesized/photo-resolver.ts`: re-export the pool selector; the existing `resolvePhotoId(category)` becomes `resolvePhotoId(category, slug)`.
- [ ] Update callsite in `llm-stay.ts` mapper to pass the slug.
- [ ] Tests: same slug → same id; different slugs → different ids; all category pools have ≥5 entries.

### Task 3 - `AI PREVIEW` badge wiring

- [ ] `LLMSynthesizedProvider.search` already emits `{ kind: 'preview', label: 'AI Preview' }`. Promote the label to `'AI Preview · synthesized for you'` so the dashboard's badge cluster can read it; the `<ProvenanceBadge>` ignores label and uses the kind for tone.
- [ ] Add a regression test that verifies the badge is present in the result.

### Task 4 - EPS Rapid signature + endpoint

- [ ] `src/providers/_shared/rapid-signature.ts`:
  - `signRapidRequest({ apiKey, sharedSecret, timestamp? }): { authorization, signature, headers }`.
  - HMAC-SHA512 over `apiKey + sharedSecret + timestamp` (Rapid's standard signing pattern).
  - Returns the `Authorization: EAN APIKey=<key>,Signature=<hex>,timestamp=<ts>` header.
  - Tests: known input → known signature; reproducible across timestamps; constant-time comparison helper.
- [ ] `src/providers/expedia/client.ts`:
  - Switch endpoint to `https://api.ean.com/v3/properties/availability` (the actual Shopping endpoint that returns price+availability) - keep `/properties/search` as a fallback path.
  - Use the new signature instead of Basic auth.
  - Add `Customer-Ip` and `Customer-Session-Id` headers per Rapid spec (we synthesize with the request id; production sets from CF-Connecting-IP).
  - Increase response schema fidelity per Rapid's actual shape.
- [ ] Vrbo client (Task 5) reuses the same signature module.

### Task 5 - Vrbo provider

- [ ] `src/providers/vrbo/{client,index,mapper,types}.ts` - same shape as Expedia.
  - The Rapid endpoints accept a `category` filter; Vrbo properties are categories `8` (cottage), `16` (vacation rental), `19` (private vacation home), etc. Filter on the client.
  - Mapper produces `Stay.type = 'villa' | 'apartment' | 'farmhouse' | 'guesthouse'` based on Rapid category id.
  - Affiliate redirect via Vrbo's deep-link pattern (`https://www.vrbo.com/<id>?affid=<aid>`).
- [ ] Self-registers via `VrboProvider.fromEnv()` reading `VRBO_API_KEY` + `VRBO_SHARED_SECRET` (separate keys; some partners share Expedia credentials, others have distinct).
- [ ] Add to `buildProviderRegistry()` alongside Expedia + Booking.com.
- [ ] `.env.example`: add `VRBO_API_KEY=` + `VRBO_SHARED_SECRET=` block.

### Task 6 - Stronger ranking

- [ ] `mock-italy/ranking.ts`:
  - Generic vibe-tag bonus: for any tag in `intent.vibe.tags`, +5 if the stay has it (in addition to the existing tag-overlap × 30).
  - `W_REMOTE`, `W_WELLNESS`, `W_FOODIE`, `W_ROMANTIC` weights when those vibes are requested AND stay has corresponding signal/tag.
  - **Filters** (run before scoring):
    - `intent.preferences.amenities`: stay must include at least one - drop otherwise.
    - `intent.preferences.avoid`: any stay carrying an avoided amenity tag is dropped.
    - `intent.budget.kind === 'per-night' && intent.budget.amount > 0`: drop stays whose price > 1.5× the cap.
    - Capacity: drop stays whose `capacity.sleeps < total travelers`.
- [ ] Tests: tier change drops/raises specific stays; avoid filter removes specific stays; budget filter trims hard.

### Task 7 - Refine intent-delta in reasoning

- [ ] `src/orchestrator/synthesize-adaptation.ts`:
  - Already computes intent diffs. Promote them into specific notes:
    - "Added: walkable, dropped: remote." → renders as a chip on the trip board.
    - "Tightened budget to €200/night." → chip.
    - "Now requires: pool, breakfast." → chip.
- [ ] Tests: each delta type produces a corresponding note with the right wording.

### Task 8 - `docs/providers.md`

- [ ] Setup walkthrough for:
  - **Expedia Partner Solutions / EPS Rapid** - apply at https://www.partner-solutions.expediagroup.com/, get sandbox creds, set `EXPEDIA_API_KEY` + `EXPEDIA_SHARED_SECRET`, expected response shape, rate limits, sandbox vs production.
  - **Vrbo (via EPS Rapid)** - same Rapid creds with category filter; if your contract is Vrbo-only, get a separate `VRBO_*` key pair.
  - **Booking.com Affiliate Partner Network** - apply at https://partner.booking.com/ for affiliate id, set `BOOKING_COM_AFFILIATE_ID` + `BOOKING_COM_API_KEY`, deeplink pattern, attribution rules, no-search-API caveat.
  - **What if you can't get keys?** - keyless dev runs MockItaly + LLMSynthesizedProvider. The `AI PREVIEW` chip makes that explicit. The adapter shape is in place for a one-line cutover when keys arrive.
  - **Affiliate redirect flow** - describe `/api/go` + click attribution + host allowlist.
  - **Provider provenance** - the chip vocabulary; how to add a new provider.

### Task 9 - Tests + pipeline + commit

- [ ] All new tests pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
- [ ] One logical commit per task or two; final summary commit.

---

## What stays unchanged

- Concierge stream protocol, IntentAgent prompts, orchestrator structure, save/share/redirect flows, billing, booking, admin pages.
- The `Stay` core type - additive UI uses what's already there.
- The mock-italy curated dataset - same content, better ranking.
- Mock-safe end-to-end. No keys → still works, with honest "AI PREVIEW" + "CURATED" labeling instead of pretending listings are live.

## Out of scope

- Real Expedia / Vrbo / Booking API calls - gated on partner approval. The adapter is shaped to make those work when keys land; this slice doesn't make HTTP requests to real partners.
- New providers beyond Vrbo - pattern is established; Hotelbeds / GetYourGuide / Viator follow the same shape.
- Proposal-builder reasoning rewrites beyond the intent-delta chips.
- A real RankingAgent (LLM-driven). Deterministic ranking is good enough for now; LLM-driven is a Slice-E2 candidate.
- Photo search via Unsplash API - current pool is hand-curated. Real photo search lands when we want per-property photos for synthesized stays.
- Mobile responsiveness improvements (already triaged in stabilization #6).

## Mock-safe matrix

| Vars | Behavior |
|---|---|
| (none) | MockItaly (Italy) + LLMSynthesized (rest). Provenance chips show `CURATED · ITALY` or `AI PREVIEW`. Photos diversified per stay. |
| `EXPEDIA_API_KEY` + `EXPEDIA_SHARED_SECRET` | Expedia Rapid live calls. Provenance chip `EXPEDIA · LIVE`. |
| `VRBO_API_KEY` + `VRBO_SHARED_SECRET` | Vrbo Rapid live calls (vacation-rental category filter). Provenance chip `VRBO · LIVE`. |
| `BOOKING_COM_AFFILIATE_ID` + `BOOKING_COM_API_KEY` | Booking.com search via the existing adapter; chip `BOOKING.COM · LIVE`. |
| Multiple set | Fanout - all configured providers run in parallel; the proposal builder ranks across the union. |
