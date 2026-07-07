# Slice B6 Implementation Plan - `/destinations/[slug]` SEO + Mobile Bottom-Sheet

> Executed inline, batched, only pausing for real blockers.

**Goal:** Static destination pages drive long-tail search traffic; the mobile bottom-sheet wraps the existing workspace UX in a tappable native-feeling shell. The destinations curation library (`@lib/curation/destinations`) already has the data - B6 wires routes + sheet + Open Graph + sitemap.

**Architecture:** Server-rendered destination pages at `/destinations/[slug]` use `generateStaticParams` over the 7 curated Italian destinations. Each page composes hero + mood + 3–6 featured stays + JSON-LD structured data + a CTA that pre-fills the workspace input bar via `?prompt=...` (B3's `UrlInit` already consumes that param). A `/destinations` index lists all curated entries. A `sitemap.ts` exposes them to crawlers. The mobile bottom-sheet replaces the existing `<768px` chat-below-canvas layout with a draggable sheet that snaps to peek / half / full - same children components, different shell.

**Tech Stack:** No new deps (uses existing Framer Motion drag).

---

## Architectural Tenets (Opus-level)

**1. Destination pages are static (SSG).**
The 7 curated destinations don't change per-request. `generateStaticParams` + Next 16's static rendering means zero runtime cost + cacheable edges. New destinations require a code change anyway (curation library is hand-written), so SSG is the right granularity.

**2. JSON-LD structured data, not just OG.**
Travel destinations have Schema.org coverage (`TouristDestination`, `LodgingBusiness`). Including JSON-LD lifts SERP rich results - a small bytes cost for measurable traffic upside.

**3. The CTA is `?prompt=...`, not a separate API.**
B3 already taught the workspace to consume `?prompt=` on first paint. Destination pages reuse that - "Plan a trip to Tuscany" → `/?prompt=Tuscany%2C%207%20nights%2C%20couple`. No new flow plumbing.

**4. The mobile bottom-sheet is desktop-invariant.**
The existing desktop layout is untouched. Below the breakpoint we swap the shell - same `ChatSidebar` and `Canvas` children, just inside a `MobileBottomSheet` instead of a stacked grid. Breakpoint logic lives in one place; nothing rendered conditionally based on `useIsMobile()` (fragile across hydration).

**5. Snap points, not free-drag.**
Three snap positions: `peek` (bottom strip, ~140px), `half` (50vh), `full` (95vh). Drag with rubber-banding; release snaps to nearest. Why: free-drag is a UX trap (users get stuck at random heights); discrete snaps mirror native iOS/Android sheets.

**6. SEO content respects the editorial voice.**
Hero copy uses italic Fraunces fragments ("Stone hill towns, deep olive groves"). No "discover/journey/unforgettable" - the existing `taste-lint.ts` already enforces this in CI on tests; B6 ships content that passes the same bar.

**7. Mock-safe end-to-end.**
Featured stays come from `STAYS_BY_DESTINATION` (mock-italy curated data) - works with zero env keys. Real-provider augmentation slots in via `searchWithFanout` in a later sub-slice without changing the page shape.

---

## File Structure

**Create:**
- `src/app/destinations/page.tsx` - index, lists curated destinations
- `src/app/destinations/[slug]/page.tsx` - single destination
- `src/app/destinations/[slug]/destination-jsonld.tsx` - Schema.org JSON-LD component
- `src/app/sitemap.ts` - Next.js sitemap (root + destinations + /t excluded - slugs are unguessable, not for crawling)
- `src/features/destinations/destination-hero.tsx`
- `src/features/destinations/featured-stays.tsx`
- `src/features/destinations/destination-card.tsx` - used by index
- `src/features/destinations/plan-trip-cta.tsx`
- `src/features/workspace/mobile-bottom-sheet.tsx`
- `src/features/shared/use-media-query.ts` - small SSR-safe hook
- `tests/destinations-page-data.test.ts` - verifies content composition for each curated destination

**Modify:**
- `src/features/workspace/workspace.tsx` - wrap mobile branch with `MobileBottomSheet`
- `src/lib/curation/destinations.ts` - add `headline: string` + `oneLiner: string` editorial fields per destination (used by the page hero)
- `src/lib/curation/moods.ts` - already has the prose; reused unchanged
- `src/app/layout.tsx` - extend `metadata.metadataBase`/`openGraph` defaults so destination pages inherit
- `README.md` - note the new routes

---

## Tasks

### Task 1: Curation extension (headline + oneLiner per destination)

- [ ] Add `headline: string` (Fraunces-italic short fragment, ~5–8 words) and `oneLiner: string` (single sentence, ~12–18 words) to each `CuratedDestination` in `src/lib/curation/destinations.ts`. Stay within voice - no banned words.
- [ ] Verify: `pnpm typecheck` + existing tests (taste-lint covers the moods, not curation; manual eyes on banned-word adjacency).

### Task 2: Destination components

- [ ] `destination-hero.tsx` - full-bleed hero photo (use the first stay's photo as background) + headline + oneLiner + region/coordinates badge. Slow scale-in motion on mount.
- [ ] `featured-stays.tsx` - grid of 3–6 stays from `STAYS_BY_DESTINATION[slug]`. Each card: photo, name, locality, per-night price. Click → `/?prompt=<oneLiner>`.
- [ ] `plan-trip-cta.tsx` - primary CTA "Plan your trip to {name}" → links to `/?prompt={composed prompt}`. Secondary link to `/`.
- [ ] `destination-card.tsx` - used by the index. Compact card with photo + name + headline + oneLiner.
- [ ] Verify: typecheck + lint.

### Task 3: Routes (single + index + JSON-LD)

- [ ] `app/destinations/page.tsx` - server component. Lists all `ITALIAN_DESTINATIONS` via `DestinationCard`. Generates static.
- [ ] `app/destinations/[slug]/page.tsx` - server component. `generateStaticParams` over curated slugs. `generateMetadata` returns title + description + Open Graph image (use first stay's photo). 404 on unknown slug.
- [ ] `destination-jsonld.tsx` - emits Schema.org TouristDestination JSON-LD inline.
- [ ] Verify: typecheck + lint + build (the build step proves SSG works).

### Task 4: Sitemap

- [ ] `app/sitemap.ts` - Next 16 sitemap helper. Includes `/`, `/destinations`, all `/destinations/[slug]`. Excludes `/t/[slug]` (share slugs are unguessable, not for crawlers).
- [ ] Verify: typecheck + build (sitemap shows in route table).

### Task 5: Mobile bottom-sheet

- [ ] `use-media-query.ts` - SSR-safe hook returning a boolean. Renders `false` on SSR + first paint, then flips post-mount. Used to gate the mobile shell so desktop renders without flash.
- [ ] `mobile-bottom-sheet.tsx` - fixed-position sheet with 3 snap points (peek 140px, half 50vh, full 95vh). Drag handle. Framer Motion drag with `dragConstraints` + spring snap-to-nearest on `onDragEnd`. Children: the `ChatSidebar`. Backdrop (rgba) only at full snap.
- [ ] Update `workspace.tsx` - below `md` use the bottom-sheet shell (canvas full-screen + sheet over); at/above `md` use the existing split layout.
- [ ] Verify: typecheck + lint. Manual: dev server on a narrow viewport.

### Task 6: Tests + pipeline

- [ ] `destinations-page-data.test.ts` - for each curated slug, verify: a `CuratedDestination` resolves, a `MoodSnapshot` is present, `STAYS_BY_DESTINATION[slug]` has ≥3 stays, the headline + oneLiner pass the banned-word filter.
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-b6.md`.
- [ ] Commit at logical milestones. Tag `slice-b6`.

---

## Out of B6 scope (deferred)

- International destination pages. Italy is what we have curated content for; non-Italy lands when real-provider stays exist.
- Per-destination weather/season data.
- Server-side analytics on destination pages (impressions). Slice C.
- Real-provider stay augmentation on destination pages - `searchWithFanout` is ready (B5), but layering live availability over curated data is a B6.x polish.
