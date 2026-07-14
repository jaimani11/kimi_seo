# Route-by-Route Caching Plan — adored-moments-platform

**Date:** 2026-07-13
**Scope:** numiworks, gotript, gobookt, stayviaowner (Turborepo monorepo)
**Status:** **AUDIT + PLAN ONLY — no caching behavior is changed by this document.**

> The four apps are structurally **byte-identical** in the areas that govern caching (root layout, middleware, session/theme/auth libs, route tree). Findings and the route table below therefore apply to all four; per-site deltas are called out explicitly in §9.

---

## 0. TL;DR — the one finding that explains the whole invocation bill

**Every public page in all four apps is dynamically rendered on every request, including the ~14,600 programmatic SEO URLs that were *written* to be ISR.** The pages already declare `generateStaticParams` + `revalidate` — but the **root layout** (`apps/*/src/app/layout.tsx`) reads request state, which opts the entire route tree into dynamic rendering and silently overrides those `revalidate` values.

Two reads are the culprit (identical in all four apps):

1. `generateMetadata()` → `await headers()` — reads `x-pathname` to emit the self-referencing canonical (layout.tsx:20).
2. `RootLayout()` → `await cookies()` — via `getServerTheme()` (theme cookie, line 31) **and** directly to resolve the anonymous session for `AuthProvider` (line 36).

In the Next.js App Router, **any `cookies()` or `headers()` call in a layout forces every descendant route to render dynamically.** Because this is the *root* layout, there is no escape hatch below it: `/[slug]`, `/destinations/[slug]`, `/attractions/[slug]`, `/about`, `/privacy` — all render per-request. A crawler hitting any of them = **1 function invocation**, never a cache hit.

**Consequently the highest-leverage change in this entire plan is a single one: decouple those three reads (canonical, theme, session) from the root layout so the SEO long tail can prerender as ISR.** Nothing else here comes close to its invocation impact. Everything downstream (per-route `revalidate` tuning) only matters *after* that unlock.

This is consistent with the Vercel usage audit (`docs/vercel-usage-audit.md`): crawler-dominated traffic × 0% page cache = invocation-driven cost.

---

## 1. How rendering mode is currently determined

| Layer | What it does | Caching effect |
|---|---|---|
| **middleware.ts** | Runs on every non-asset request (matcher excludes `_next/static`, `_next/image`, favicon, common image types). Does: (1) 308 apex→www host redirect; (2) mints `stayscout-session` cookie if absent + propagates onto the request; (3) sets `x-pathname` header; (4) delegates to Clerk iff auth env is configured. | One **Edge middleware invocation per request**. Unavoidable for host-redirect + session mint, but the matcher can be tightened (see quick wins). Middleware itself does **not** force pages dynamic — but the values it publishes (cookie, `x-pathname`) are what the layout reads. |
| **Root layout** | Reads `headers()` (canonical) + `cookies()` (theme + session). | **Forces 100% of routes dynamic.** The load-bearing problem. |
| **Per-page `export const dynamic/revalidate`** | Admin/billing/bookings pages set `force-dynamic` (correct). SEO pages set `revalidate` (currently inert due to the layout). | Correct intent; overridden by the layout for the ISR set. |
| **Per-page `searchParams` / `cookies()` / auth reads** | `/search`, `/plan`, `/quiz`, `/billing/mock-checkout` read `searchParams`; all `/admin/*`, `/bookings/[id]`, `/profile/memory`, `/trips/[id]/itinerary` read auth/session. | These stay dynamic **even after** the layout is fixed — correctly (they are personalized or query-driven). |

**Current effective cache headers:** because pages resolve dynamic, Vercel serves them with `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` (no CDN caching). The `revalidate` exports would produce `s-maxage=<n>, stale-while-revalidate` **once the layout no longer forces dynamic**. No route sets explicit `Cache-Control` in code today.

---

## 2. The isolation fix (proposed — the prerequisite for everything else)

To let the static shell prerender, all three reads must leave the root layout **together** (removing only one or two leaves a `cookies()`/`headers()` call behind, and the tree stays dynamic — this is why there is no partial quick win here):

**A. Canonical (`headers()` → `x-pathname`).** Move the self-referencing canonical out of the root `generateMetadata` and onto each page's own `generateMetadata` (most SEO pages already import `canonicalUrl` from `@lib/site/origin` and set their own; the root fallback is the dynamic culprit). Audit coverage first; add per-page canonicals where missing. *Net: removes the `headers()` read.*

**B. Theme (`cookies()` → `getServerTheme`).** Replace the server-side theme-cookie read with a tiny **blocking inline `<script>` in `<head>`** that sets `data-theme` on `<html>` from the `stayscout-theme` cookie (client-readable) / `prefers-color-scheme` before first paint — the standard no-FOUC pattern. Server renders a theme-neutral shell; the script themes it pre-paint. *Net: removes the theme `cookies()` read; small, well-understood FOUC risk mitigated by the blocking script.*

**C. Session (`cookies()` → `resolveSession`).** The anonymous session cookie is **`httpOnly`**, so the client can't read it directly — today the layout reads it server-side to hand `sessionId` to the client `AuthProvider`. But a crawler or a first-paint SEO view **does not need the session to render**. Proposal: render the static shell with no server session read, and have `AuthProvider` **lazily resolve the session client-side** — a lightweight `GET /api/auth/session` (echoes the current id from the httpOnly cookie, server-read) called on mount only when a persistent/interactive action is imminent (save trip, personalized rail, analytics attribution). API routes that mutate already resolve the session server-side via `getServerAuth()` and are unaffected. *Net: removes the session `cookies()` read from render; the session contract is preserved for the flows that actually use it.*

**Alternative considered:** wrap the session/theme in a `<Suspense>` boundary / adopt Partial Prerendering (PPR). Lower code churn but PPR is still experimental on our Next version — hold as a fast-follow, not the mainline.

**Do NOT** blindly add `force-static`/`revalidate` across the apps (per the constraint). The unlock is removing the layout reads; per-route modes are then set deliberately as below.

---

## 3. Route classification — pages

Applies to all four apps. **Current mode = the *effective* mode today** (all dynamic via the layout); **Proposed = after the §2 unlock.** "Forced by" lists what would *still* force dynamic after the unlock.

### 3a. ISR candidates — the SEO long tail (this is where the invocations are)

| Route | Current | Why dynamic now | Still forced by (post-unlock) | Proposed | Revalidate | Invalidation | Staleness risk | Affiliate/analytics impact | Est. invocation ↓ | Complexity | Rollback |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/[slug]` (itinerary / things-to-do / themed / comparison / climate — ~14.6k URLs via `generateStaticParams`) | Dynamic | Root layout | nothing | **ISR** | 3600s (already declared) | on-demand `revalidatePath` on content deploy | Low — editorial + slow-moving picks | CTAs are client/`/r` redirects — unaffected; analytics fire client-side | **Very high** (dominant crawler target) | Low *(once §2 done)* | revert layout; page unchanged |
| `/destinations/[slug]` (destination guides) | Dynamic | Root layout | nothing | **ISR** | 3600s | on-demand on guide edit | Low | none | High | Low | per-route flag |
| `/attractions/[slug]` | Dynamic | Root layout | nothing | **ISR** | 3600s (declared) | on-demand | Low | none | High | Low | per-route flag |
| `/destinations` (index) | Dynamic | Root layout | nothing | **ISR/Static** | 86400s | on deploy | Very low | none | Medium | Low | per-route flag |
| `/experiences/[productCode]` | Dynamic | Root layout | nothing | **ISR (short)** | 300s (declared) | time-based only | **Medium — live-ish inventory**; keep short, never long | shows provider content; must stay within provider display rules | Medium | Low | lower to dynamic |
| `/t/[slug]` (shared trip, public via ~95-bit slug) | Dynamic | Root layout | nothing | **ISR or dynamic** | 300s or on-demand | on-demand on trip edit | Medium (owner may edit) | masks `rawInput`; no PII | Medium | Medium | keep dynamic |

### 3b. Static candidates

| Route | Current | Still forced by (post-unlock) | Proposed | Notes |
|---|---|---|---|---|
| `/` (home) | Dynamic | nothing (hero is a client component) | **Static** | biggest single-URL crawler hit; verify no server session read on the page itself |
| `/about`, `/privacy`, `/terms` | Dynamic | nothing | **Static** | pure content / legal |
| `/contact` (GET page) | Dynamic | nothing | **Static** shell | form POSTs to `/api/contact` (stays dynamic) |
| `/trip-cost-estimator` | Dynamic | nothing | **Static** shell | client-side calculator |
| `/quiz` | Dynamic | `searchParams` | **Static** shell + client query read | move the query read to `useSearchParams` (client) |

### 3c. Keep dynamic (personalized / query-driven / interactive)

| Route | Forced by | Proposed | Rationale |
|---|---|---|---|
| `/search` | `searchParams` + (revalidate=300) | **Dynamic** (or static shell + client-fetched results) | query-driven results |
| `/plan` | `searchParams` (+ live picks) | **Dynamic** (or static shell + client) | prefilled from query; builds a live plan |
| `/trips/[tripId]/itinerary` | auth (owner-scoped) | **Dynamic** | authenticated saved trip |
| `/profile/memory` | `cookies()`/auth | **Dynamic** (already `force-dynamic`) | personalized |
| `/bookings/[bookingId]` | auth | **Dynamic** (already `force-dynamic`) | user booking |
| `/billing/mock-checkout`, `/billing/return` | `searchParams` + auth | **Dynamic** (already `force-dynamic`) | checkout flow |
| **All `/admin/*`** (incl. `/admin/marketing/security-analytics-plan`) | auth (`requireAdmin`/`requirePasswordAdmin`) | **Dynamic — Never cache** (already `force-dynamic`) | admin, sensitive |

---

## 4. Route classification — API & special routes

| Group | Routes | Class | Notes |
|---|---|---|---|
| **Affiliate redirects** | `/r/[id]`, `/api/go`, `/api/go/booking` | **NEVER CACHE** (already `force-dynamic`/dynamic) | 302s — must never be cached; each records a click / carries attribution |
| **Click / analytics logging** | `/api/analytics/event` | **NEVER CACHE** | POST, 204, server-derives owner |
| **Auth** | `/api/admin/login`, `/api/admin/logout`, `/api/auth/migrate` | **NEVER CACHE** | sessions/credentials |
| **Admin mutations** | `/api/admin/marketing/*`, `/api/social/generate`, `/api/memory/[id]` | **NEVER CACHE** | admin-gated writes |
| **Billing** | `/api/billing/webhook`, `/api/billing/checkout`, `/api/billing/entitlement` | **NEVER CACHE** | webhook signature-verified; entitlement per-user |
| **User data** | `/api/trips/*` (save/list/share/resurface/by-slug), `/api/bookings/*` | **NEVER CACHE** | owner-scoped |
| **Forms** | `/api/contact`, `/api/newsletter/subscribe` | **NEVER CACHE** (dynamic) | submissions |
| **AI** | `/api/concierge` (streams), `/api/discovery/experiences` | **Keep dynamic**; discovery may stay **short ISR 300s** (already declared) | never cache the concierge stream; discovery is provider-live, keep short |
| **Cron** | `/api/cron/marketing-daily`, `/api/cron/marketing-catchup` | **NEVER CACHE** | Bearer-gated (fail-closed) |
| **Pinterest OAuth/admin** | `/api/pinterest/*` | **NEVER CACHE** | oauth + admin |
| **SEO assets** | `/sitemap.xml` (ISR 3600), `/sitemap.xsl` (ISR 86400), `/llms.txt` (`force-static`), `/robots` | **Static / ISR** — already correct | leave as-is; verify after unlock |

**Every provider (Booking.com/Expedia/Vrbo/GetYourGuide) live-price or availability surface stays dynamic or short-ISR only, within provider display rules. No affiliate redirect is ever cached.** ✔ against constraints.

---

## 5. Top 20 routes by likely invocation volume (highest first)

Ranked by crawler + human hit frequency × current dynamic cost. The top cluster is the entire savings story.

| # | Route | Class today → proposed | Volume driver |
|---|---|---|---|
| 1 | `/[slug]` (things-to-do-in-*, *-day-itinerary, themed, comparison, climate) | Dynamic → **ISR** | ~14.6k URLs; primary crawl target |
| 2 | `/destinations/[slug]` | Dynamic → **ISR** | per-city guides, heavily crawled |
| 3 | `/attractions/[slug]` | Dynamic → **ISR** | per-attraction, growing set |
| 4 | `/` (home) | Dynamic → **Static** | every crawler entry + brand traffic |
| 5 | `/destinations` (index) | Dynamic → **ISR/Static** | hub link target |
| 6 | `/sitemap.xml` | ISR (ok) | fetched by every crawler; already ISR |
| 7 | `/experiences/[productCode]` | Dynamic → **ISR 300** | product detail crawl |
| 8 | `/robots` / `/llms.txt` | Static (ok) | every crawler |
| 9 | `/search` | Dynamic (query) | human + some crawl of param variants |
| 10 | `/t/[slug]` (shared trips) | Dynamic → **ISR/on-demand** | shared links |
| 11 | `/plan` | Dynamic (query) | tool usage |
| 12 | `/quiz` | Dynamic → **Static shell** | tool usage |
| 13 | `/trip-cost-estimator` | Dynamic → **Static shell** | tool usage |
| 14 | `/about` / `/privacy` / `/terms` / `/contact` | Dynamic → **Static** | footer/legal crawl |
| 15 | `/api/go`, `/api/go/booking`, `/r/[id]` | Never cache (ok) | affiliate clicks — volume is real but must not cache |
| 16 | `/api/analytics/event` | Never cache (ok) | fires per funnel event |
| 17 | `/api/concierge` | Dynamic (ok) | AI usage |
| 18 | `/api/discovery/experiences` | ISR 300 (ok) | live inventory |
| 19 | `/api/trips/*` | Never cache (ok) | logged-in usage |
| 20 | `/admin/*` | Never cache (ok) | low volume, correctly dynamic |

**Rows 1–8 and 12–14 are the win.** Rows 15+ are correctly excluded from caching and stay as-is.

---

## 6. Quick wins (safe, < 1 day each)

1. **Tighten the middleware matcher** to also skip `/llms.txt`, `/sitemap.xml`, `/sitemap.xsl`, `/robots.txt` (and `/_next/data`) — these don't need session-mint or the host cookie. Small edge-invocation reduction; zero risk to SEO. *(½ day, low risk.)*
2. **Theme via inline pre-paint script (§2-B)** — self-contained; removes one of the three layout reads. Ships behind a flag; verify no FOUC in light/dark. *(≈½ day.)*
3. **Per-page canonical audit (§2-A)** — confirm every SEO template sets its own `canonical`; fill gaps. Enables removing the root `headers()` read. *(≈½ day.)*
4. **Verify already-correct routes** (`/llms.txt` static, `/sitemap.*` ISR, all `/admin/*` + affiliate redirects never-cache) — document as intentional; no change. *(quick.)*

> Note: quick wins 2 + 3 are prerequisites that, combined with the session change (§7), *together* unlock ISR. On their own they don't change page caching — they de-risk the atomic unlock.

## 7. Medium-risk changes

1. **Session decouple (§2-C)** + flip the root layout to static shell — the actual unlock. Requires the client `AuthProvider` lazy-session path and a `GET /api/auth/session`. Pilot on one app. *(1–2 days.)*
2. **Convert the SEO long tail to real ISR** — no page code changes needed (declarations exist); this is realized automatically once the layout is static. Verify `s-maxage` headers appear + `generateStaticParams` prebuilds. *(≈1 day of verification.)*
3. **`/search`, `/plan`, `/quiz` → static shell + client query read** — move `searchParams` reads to `useSearchParams`. Per-page. *(1 day each.)*

## 8. High-risk changes (do last, or defer)

1. **Home + shared-trip (`/t/[slug]`) static/ISR** — home is the highest-traffic single URL; get it right after the pattern is proven. `/t/[slug]` is semi-personalized (owner edits) → needs on-demand invalidation, otherwise a stale shared trip. *(defer until monitoring is in place.)*
2. **On-demand revalidation wiring** (`revalidatePath`/tag on content publish + trip edit) — needed so ISR pages update promptly rather than only on the timer. Touches the publish/edit paths. *(medium-high.)*
3. **Anything touching the session cookie contract** — must preserve owner attribution (a divergence would orphan saved trips). Covered by the §2-C design, but this is the sensitive part; canary + watch attribution metrics.

---

## 9. Estimated invocation reduction by site

Directional (precise figures need the Vercel Usage → Functions breakdown from `docs/vercel-usage-audit.md` §5). The mechanism: crawler hits on the ISR/static long tail convert from **function invocations → CDN cache hits (edge requests)**.

| Site | Route mix | Est. **page** invocation reduction after unlock | Notes |
|---|---|---|---|
| **numiworks** | Hub — most route types (itinerary, things-to-do, themed, comparison, climate, attractions, destinations) | **~75–90%** of page invocations | biggest absolute win; largest long tail |
| **gotript** | Expedia+GYG+Vrbo; similar SEO long tail | **~75–90%** | same architecture |
| **stayviaowner** | VRBO/Expedia; similar long tail | **~70–85%** | slightly fewer route types |
| **gobookt** | Booking.com-only; SEO long tail + category/vertical pages | **~70–85%** | fewer public provider routes, but same crawler-dominated long tail |

Platform-wide, **page** function invocations should fall by roughly **3–5×** on crawler-heavy days. API-route invocations (concierge, affiliate redirects, analytics) are unaffected by design — they must not be cached. Middleware edge invocations drop modestly from the matcher tightening.

---

## 10. Phased rollout (start with one low-risk site + route group)

**Pilot: gobookt, `/attractions/[slug]` + `/destinations/[slug]` only.** gobookt is the smallest public surface (Booking.com-only) and these two route groups are pure content (no query/auth) — the cleanest place to prove the layout unlock without touching the concierge or checkout flows.

1. **Phase 0 — instrument (before any change).** Capture baseline: per-route invocations, cache-hit %, middleware invocations, `Cache-Control` headers on the pilot routes (all currently `no-store`).
2. **Phase 1 — quick wins (§6.1, 6.2, 6.3) on gobookt behind a flag.** No page-cache change yet; verify theme + canonicals hold.
3. **Phase 2 — session decouple (§7.1) on gobookt; flip root layout to static shell.** Watch: `s-maxage` now present on `/attractions/[slug]` + `/destinations/[slug]`; cache-hit % climbs; **owner-attribution / saved-trip metrics unchanged**; theme + session behavior intact.
4. **Phase 3 — widen on gobookt** to `/[slug]`, `/`, legal pages once Phase 2 is green for 48h.
5. **Phase 4 — roll to gotript → stayviaowner → numiworks** (numiworks last: hub, most surface area, highest traffic). Same sequence each.
6. **Phase 5 — on-demand revalidation + high-risk items (§8).**

Each phase is independently revertible: the layout change is one commit per app behind a flag; per-route modes are one export each.

---

## 11. Monitoring metrics & rollback thresholds

**Watch (per site, per phase):**
- **Function invocations / day** (target: sharp drop on pilot routes) and **CDN cache-hit %** (target: >80% on ISR/static routes).
- **`Cache-Control` header** on pilot routes (expect `s-maxage=<n>, stale-while-revalidate`).
- **Owner attribution integrity** — saved-trip continuity across requests; `AffiliateClick` owner resolution rate. *(Regression here = the session decouple broke attribution.)*
- **Affiliate click volume** through `/r/[id]` + `/api/go*` (must be flat — redirects uncached).
- **SEO health** — Search Console coverage + canonical correctness; crawl stats (crawlers must still get 200s, correct canonicals).
- **Theme correctness** — no FOUC, light/dark honored (synthetic check + spot screenshots).
- **Error rate / p95 latency** on pilot routes.

**Rollback thresholds (trip any → revert the phase's flag):**
- Owner-attribution or saved-trip continuity regresses **> 1%**.
- Affiliate click-through volume drops **> 5%** vs. baseline (redirect/attribution broke).
- Canonical or indexed-URL errors appear in Search Console for pilot routes.
- Stale content served past its `revalidate` window (invalidation broken) on a user-visible route.
- p95 latency up **> 20%** or error rate up **> 0.5pp** on pilot routes.

Rollback = flip the per-app flag (or revert the single layout commit); ISR/`revalidate` exports are inert without the layout unlock, so reverting the layout fully restores today's behavior with no data migration.

---

### Appendix — constraint compliance check

- ✅ No Booking.com/Expedia/Vrbo/GetYourGuide live price/availability cached beyond short ISR within provider rules (`/experiences` 300s, `/api/discovery` 300s; provider redirects never cached).
- ✅ Affiliate attribution + click logging untouched (`/r/[id]`, `/api/go*`, `/api/analytics/event` stay never-cache).
- ✅ No 302/307 affiliate redirect cached.
- ✅ Crawler access unchanged (caching, not blocking).
- ✅ SEO metadata + canonicals preserved (moved per-page, audited).
- ✅ Theme + session behavior preserved (inline theme script; lazy client session; API session contract intact).
- ✅ Layout cookie/header reads identified as the root cause + isolation proposed (§2).
- ✅ No blind `force-static`/`revalidate` sweep — the unlock is removing layout reads; per-route modes set deliberately.
