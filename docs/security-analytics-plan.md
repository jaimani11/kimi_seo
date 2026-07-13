# Part B — Security, Analytics & AI-Governance Program

**Repo:** `adored-moments-platform` (Turborepo monorepo)
**Apps:** `apps/numiworks`, `apps/gotript`, `apps/gobookt`, `apps/stayviaowner`
**Shared:** `packages/{affiliate, brand-config, imagery, marketing, seo-data, seo-routing, travel-tools, ui}`
**Status:** Planning document. The four *quick wins* are now shipped (see below); Phases 1–4 remain proposed work to review before implementation.
**Date:** 2026-07-13 · rendered internally at `/admin/marketing/security-analytics-plan`

### Shipped since this plan was written
- ✅ **AI input cap** — `rawInput` is now `.max(1000)`, rejecting oversized text before any model call (Phase 2 quick win).
- ✅ **Brand-identity fix** — "StayScout" removed from the live concierge prompt; each app names its real brand (Phase 2 quick win).
- ✅ **Secrets documented** — `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET` in `docs/admin-cron-secrets.md` (Phase 4 quick win).
- ✅ **Admin + cron auth now FAIL CLOSED** — absent `ADMIN_PASSWORD` / `CRON_SECRET` DENY in production (timing-safe Bearer compare for cron); dev bypass only behind an explicit `ALLOW_INSECURE_LOCAL_ADMIN` flag. This brings forward the Phase 4 "password gate is open if `ADMIN_PASSWORD` is unset" gap.
- ✅ **gobookt Booking.com CJ routing** — every gobookt stay CTA now routes through the central CJ resolver, closing an untracked `label=`-only affiliate-link leak.

---

## How to read this document

- **Phase 0** is the concrete as-built audit. Everything below it is proposed work.
- **Phases 1–4** each carry the same subsections: (a) existing functionality, (b) gaps, (c) files/packages affected, (d) DB/infra changes, (e) env vars, (f) tests, (g) rollout & rollback, (h) effort (S/M/L/XL + rough days), (i) dependencies & risks.
- Effort sizing: **S** ≈ 1–2 days, **M** ≈ 3–5 days, **L** ≈ 6–9 days, **XL** ≈ 10+ days (one engineer, includes tests; excludes external legal review and infra procurement lead time).

### Design principles baked into every phase

1. **Shared security/analytics layer; isolated affiliate + branding.** Security, analytics, AI-governance, consent, and rate-limiting logic become shared `@adored/*` packages. Affiliate link-building and brand identity stay per-app/per-brand-config.
2. **Site determined server-side via trusted source, never user input.** Already true today (compile-time brand import). Preserve it; never introduce Host-header-driven brand selection.
3. **Privacy-safe AI telemetry only.** Never send full prompts or PII to third parties. Redact/aggregate before any egress.
4. **Server-side enforcement, not system prompts.** Every guardrail (scope, budget, rate limit, provider allowlist) must have a code-level check, not just prompt text.
5. **Per-site AI budgets + a portfolio kill switch.** Spend caps per brand and one master off-switch for all four.
6. **Do not break existing SEO, affiliate attribution, branding, or sessions.** All changes must preserve canonical URLs, affiliate camrefs/labels, brand theming, and the `stayscout-session` cookie contract (with a migration path when hardening it).

---

## Cross-cutting theme: the 4× duplication tax

The single most important structural fact from the audit: **the analytics seam, the AI/agent/orchestrator stack, auth, sessions, admin, observability, and the Prisma schema are byte-identical, copy-duplicated across all four apps.** There is no shared package for any of them.

Consequence: **every gap below exists four times, and every fix must be applied four times — or the code must first be extracted into a shared `@adored/*` package.** Extraction is therefore a prerequisite workstream that Phases 1–3 each depend on. The plan treats "extract to shared package" as the first step of each relevant phase rather than a separate phase, because extraction without a hardening goal is churn.

What already *is* shared and correct (preserve, do not disturb): `@adored/brand-config` (single source of brand identity), `@adored/affiliate` host allowlist, compile-time per-app brand binding, owner-scoped data queries, Stripe webhook signature verification.

---

# Phase 0 — Audit: current state (as-built findings)

This is what exists today, verified by reading the code. Absolute paths are given so findings are checkable.

### 0.1 Analytics

- **Providers wired:** GA4 and Plausible only, both injected by `apps/numiworks/src/lib/analytics/script.tsx` and mounted once in `apps/numiworks/src/app/layout.tsx`. Both are **env-gated** (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) and load `afterInteractive` on every page. GetYourGuide's widget loader is loaded unconditionally in `layout.tsx` with a **hardcoded partner-id fallback `'SL52HD5'`**. Pinterest is present only as a hardcoded `p:domain_verify` meta tag.
- **Absent providers:** Google Tag Manager, Microsoft Clarity, Meta/Facebook Pixel, a Pinterest conversion tag (`pintrk`), and Vercel Analytics/Speed Insights are **all absent** (not dependencies in any `package.json`).
- **The seam:** `apps/numiworks/src/lib/analytics/client.ts` exposes `track(event, props)`; it fans out to `window.plausible` and `window.gtag`, and for a hardcoded allowlist of four "funnel" events also POSTs to `/api/analytics/event`. `apps/numiworks/src/lib/analytics/rollup.ts` holds pure aggregation helpers for the admin dashboard; `recently-viewed.ts` derives the "pick up where you left off" rail.
- **Server endpoint:** `apps/numiworks/src/app/api/analytics/event/route.ts` — POST, `nodejs` runtime, always returns 204, zod-validates `{ kind, ref?, metadata? }`, and resolves owner/session **server-side from the auth cookie** (clients send no identifiers). This is a good privacy posture.
- **Events:** `search_results_view`, `experience_view`, `recommendation_impression`, `save_click` (persisted to the funnel store); plus `search_submit`, `hero_search_submit`, `concierge_submit`, `concierge_refine`, `plan_submit`, `plan_reserve_all`, `gyg_cta_click` (GA/Plausible only). Affiliate clicks are a separate server-side signal recorded in `apps/numiworks/src/app/api/go/route.ts` and `apps/numiworks/src/app/r/[id]/route.ts`.
- **Storage:** `AffiliateClick` is a durable Postgres model. **There is no `FunnelEvent`/`AnalyticsEvent` table** — funnel events live in a **process-local in-memory array** in both the Postgres and in-memory session stores (`apps/numiworks/src/lib/session/postgres-session-store.ts`), so they are non-durable and per-lambda in production. Admin dashboards: `apps/numiworks/src/app/admin/analytics/page.tsx` and `.../admin/clicks/page.tsx`.
- **Site identity in analytics:** **none.** No brand/site column on `AffiliateClick`, no brand tag on funnel events, no brand dimension in the dashboards. GA/Plausible IDs are single per-app env vars, **not bound to `@adored/brand-config`** and **undocumented in `.env.example`**.
- **Consent:** **none anywhere** (no banner, no CMP, no `gtag('consent', …)`). GA4 runs with default (non-anonymized) cookies. The `stayscout-session` cookie is set for every visitor on the first request, pre-consent.

### 0.2 AI assistant / concierge

- **Where the model is called:** `apps/numiworks/src/app/api/concierge/route.ts` (POST, `nodejs`, `maxDuration=60`) does **not** call the model directly — it validates the body and streams orchestrator events as NDJSON. All LLM calls go through one client, `apps/numiworks/src/lib/ai/anthropic-client.ts`, used by agents in `apps/numiworks/src/agents/*` and the two engines in `apps/numiworks/src/orchestrator/*`. Other LLM entry points: `apps/numiworks/src/app/api/social/generate/route.ts` (admin-gated) and the marketing cron routes (template mode by default).
- **SDK/model:** `@anthropic-ai/sdk`, key `ANTHROPIC_API_KEY`. **Every real call uses `claude-haiku-4-5`, hardcoded per-agent** — no central model config. `apps/numiworks/src/lib/observability/costs.ts` carries a pricing table (with some cosmetic key drift vs. the `ModelId` type).
- **Structural containment (a genuine strength):** the only "tool" is `emit_structured_output` with forced `tool_choice`, and output is re-validated against a zod schema (`anthropic-client.ts`). The model has **no action-taking tools**, so there is nothing an injection could invoke. Booking side-effects (`apps/numiworks/src/agents/booking-agent.ts`) are **deterministic (no LLM)** and **not on the concierge path**. The fake-inventory LLM provider is dormant by default.
- **Scope-limiting / injection defense:** weak. The intent prompt (`apps/numiworks/src/lib/ai/prompts/intent-system.ts`) says its "only job" is trip-intent extraction and enumerates a closed taxonomy, but there is **no prompt-injection hardening, no "ignore embedded instructions," no untrusted-input delimiting, and no output moderation** on the free-text mood/flavor agents (only a cliché "lintVoice" retry).
- **Input validation:** the route zod-validates the body (`apps/numiworks/src/core/concierge-request.ts`), but **`rawInput: z.string().min(1)` has no `.max()`** — unbounded user text flows straight into the model → token-cost amplification / DoS. Verified.
- **Auth & rate limiting:** the concierge route is **fully public — no auth, no rate limit, no throttle, no per-session quota.** Combined with the unbounded input, an anonymous caller can drive unlimited `claude-haiku-4-5` spend. Verified (route contains only `maxDuration=60`).
- **Cost controls:** cost is **measured** (`costs.ts` + an in-memory 200-turn telemetry ring buffer) but **never enforced** — no budget, no circuit breaker, no kill switch.
- **Telemetry / PII egress:** the always-on in-memory trace logger **deliberately stores no prompt/completion text**. But when `LANGFUSE_*` keys are set, `apps/numiworks/src/lib/observability/langfuse-trace-logger.ts` **sends full input (including raw user text) and output verbatim to Langfuse (third party) with no redaction.** This is the primary sensitive-data egress.
- **Brand correctness bug:** the internal codename **"StayScout" is hardcoded in the live concierge system prompt across all four apps**, so the concierge misidentifies its own brand. The AI path does not consume `brand-config`.

### 0.3 Consent / cookies

- **No consent mechanism of any kind** (no banner, no CMP, no consent state, no default-deny). Cookies set: `stayscout-session` (every visitor, pre-consent, **unsigned, no `Secure` flag**), `<brand>_admin` (signed, `Secure` in prod), `stayscout-theme`, and `_ga*` if GA is configured. `privacy` and `terms` pages exist in all four apps; there is **no cookie-policy page** and no ePrivacy/GDPR cookie gating.

### 0.4 Auth & data isolation

- **End-user auth:** hybrid. An **anonymous cookie session** `stayscout-session` (`anon_<uuid>`, minted in `apps/numiworks/src/middleware.ts`) is the default identity; Clerk is loaded dynamically **only when `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are set.** The session cookie is `httpOnly`+`sameSite=lax` but **unsigned and missing `Secure`** (signing explicitly deferred in code comments).
- **Ownership:** `getServerAuth()` → `ownerOf()` yields a single ownership key (`user:<id>` or `session:<id>`). Data queries **are correctly owner-scoped**: `getTrip`/`listTrips`/`deleteTrip`/`mintShareSlug` all filter by `userId`. Public share reads (`getTripBySlug`) are intentionally un-owned but mask `rawInput` and rely on a ~95-bit unguessable slug. One user cannot read another's trip by id.
- **The isolation headline gap:** **no `site`/`brand`/`siteId`/`tenantId` column on any of the 10 Prisma models** (User, Conversation, Turn, Trip, AffiliateClick, Subscription, WebhookEvent, BookingDraft, Booking, MemoryRecord) and no site filter in any query. Verified. **If the four apps share one `DATABASE_URL` (and/or one Clerk instance), rows commingle across brands with zero code-level isolation** — a live cross-brand data leak. Whether the DBs are shared is **operator config in Vercel and cannot be determined from the repo** (`.env.example` leaves `DATABASE_URL` blank).
- **Admin auth:** two gates. A **password gate** (`<brand>_admin` signed cookie, constant-time compare against `ADMIN_PASSWORD`, HMAC via `ADMIN_SESSION_SECRET`) — but it is **open if `ADMIN_PASSWORD` is unset**, and covers only a few routes (marketing, Pinterest). Most admin pages (users, clicks, memories, analytics, turns, bookings) rely **only on `requireAdmin()` (Clerk), which has no role/allowlist check — any authenticated Clerk user is "admin,"** and is a no-op when Clerk is disabled. **No rate limit / lockout on `/api/admin/login`.**
- **Billing:** real Stripe when keyed, else mock. **Webhook signature is verified** (`stripe.webhooks.constructEvent`), checkout returns 401 for anonymous, entitlement is webhook-derived. Subscription/webhook stores are **in-memory even in Stripe mode** (non-durable).
- **Auth migrate:** `apps/numiworks/src/app/api/auth/migrate/route.ts` merges anon→user trips; requires an authenticated caller; forgeable-cookie hijack vector exists only because the session cookie is unsigned.

### 0.5 Rate limiting / cost controls / infra

- **Completely absent.** No `@upstash/*`, `ioredis`, `redis`, `@vercel/kv`, `lru-cache`, or rate-limit dependency anywhere. No KV/Edge Config. No budget/quota/kill-switch/circuit-breaker concept in code. **Per-site budgets and a portfolio kill switch are greenfield** — there is no shared counter store to build on.
- **No security headers / CSP** in middleware, `next.config.ts`, or `vercel.json` anywhere in the platform.

### 0.6 Shared packages & site determination

- **8 shared packages** (`@adored/affiliate`, `brand-config`, `imagery`, `marketing`, `seo-data`, `seo-routing`, `travel-tools`, `ui`). **Confirmed absent:** `packages/analytics`, `packages/ai` (or `ai-*`), `packages/security`, `packages/auth`, `packages/observability`, `packages/consent`, `packages/rate-limit`.
- **Site determination (correct today):** each app statically imports exactly one brand const in `apps/<app>/src/lib/site/origin.ts` (e.g. numiworks → `NUMIWORKS`). `getSiteOrigin()` prefers `NEXT_PUBLIC_SITE_URL`, else the brand's `siteUrl`; `VERCEL_URL` is deliberately never used. **The Host header is only used defensively** (middleware 308-redirects any non-canonical host to the trusted `getSiteOrigin()` host) — it never selects brand or affiliate config. **This already satisfies "site determined via trusted source, never user input."**
- **Affiliate isolation (partial):** the `@adored/affiliate` host allowlist (`isAllowedAffiliateHost`) is **runtime-enforced** in `/api/go`, but it is **platform-wide, not per-brand** (gobookt's redirect would accept any allowlisted host, not just booking.com). Each brand's `affiliate.providers[]` in `brand-config` is **declarative only — a whole-repo grep found zero runtime reads of it.** Isolation today rests on per-app code separation + a public env var, not a server-side check.
- **Env hygiene:** several **secrets are used in code but undocumented in `.env.example`**: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`, plus `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `MARKETING_LLM_PACKS`, and the entire Viator provider var set. The `turbo.json` `env` allowlist is **stale and incomplete** (name mismatches + missing `DATABASE_URL`, `CLERK_*`, `STRIPE_*`, `LANGFUSE_*`, etc.), which is both a build-cache-correctness risk and a config-drift risk.

### 0.7 Open questions for the operator (must be answered before Phase 4)

1. **Do the four apps share one `DATABASE_URL`, or one DB each?** This is the single pivotal unknown. If shared → live cross-brand leak (no `siteId` exists).
2. **Is Clerk one shared instance or one per brand?** A shared instance means one `userId` spans all four sites.
3. **Are GA/Plausible IDs unique per brand today, or reused?** Determines whether Phase 1 is "wire up" or "de-dupe."

---

# Phase 1 — Analytics correctness, per-site IDs, consent, privacy-safe events

**Objective:** trustworthy, brand-attributed, consent-gated analytics with durable funnel storage, delivered through a shared package.

**(a) Existing functionality discovered**
GA4 + Plausible env-gated seam (`script.tsx`, `client.ts`); privacy-safe server event endpoint that derives identity from the cookie (`api/analytics/event/route.ts`); four persisted funnel events + several GA/Plausible-only events; durable `AffiliateClick` Postgres model; admin analytics + clicks dashboards; pure rollup helpers.

**(b) Gaps**
- No consent gating — GA4 + `_ga` cookies fire pre-consent with default (non-anonymized) settings.
- No brand/site tag on funnel events or `AffiliateClick`; dashboards have no brand dimension.
- Funnel events are **in-memory / non-durable** in production (reset per deploy, per-lambda) → unreliable funnel metrics.
- GA/Plausible measurement IDs are undocumented env vars **not bound to `brand-config`** → cross-project ID-reuse risk with no in-code guard.
- Analytics code duplicated 4× (no `packages/analytics`).
- GetYourGuide loader carries a hardcoded partner-id fallback; Pinterest has only a domain-verify meta (no conversion signal — optional to add).

**(c) Files / packages likely affected**
- **New** `packages/analytics` (extract from `apps/*/src/lib/analytics/*`): `client.ts`, `script.tsx`, `rollup.ts`, `recently-viewed.ts`, event-name constants, consent gate.
- `packages/brand-config/src/types.ts` + `brands.ts`: add an optional `analytics` block (`ga4MeasurementId?`, `plausibleDomain?`) so IDs are brand-bound and self-documenting.
- `apps/*/src/app/layout.tsx` (mount consented `<AnalyticsScript>`), `apps/*/src/lib/analytics/*` (replace with package re-exports), `apps/*/src/app/api/analytics/event/route.ts` (stamp brand/site + write durably).
- `apps/*/prisma/schema.prisma`: new `FunnelEvent` model; `site` column on `FunnelEvent` and `AffiliateClick`.
- `apps/*/src/lib/session/*-session-store.ts`: persist funnel events instead of in-memory array.
- Admin dashboards: optional per-brand filter (only meaningful if a shared DB is used).

**(d) Database / infrastructure changes**
- Add `FunnelEvent { id, site, ownerKind, ownerId, kind, ref?, metadata Json?, createdAt }` with indexes on `[site, kind, createdAt]` and `[ownerId]`.
- Add `site String` to `AffiliateClick` (+ index). Backfill existing rows with the app's brand key.
- One Prisma migration per app (or one if DBs are shared). No new external infra.

**(e) Environment variables**
- Document `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in every `.env.example`; move canonical IDs into `brand-config` (env stays an override).
- New `NEXT_PUBLIC_ANALYTICS_CONSENT_MODE` (`opt-in` | `off`) to control default-deny behavior per region if needed.
- Fix the `turbo.json` `env` allowlist to match actual names.

**(f) Tests**
- Unit: no analytics cookies/tags emitted before consent; GA loads with anonymized/consent-mode settings after opt-in.
- Unit: every persisted event and `AffiliateClick` carries the correct `site`; rollups filter by site.
- Contract: `api/analytics/event` still returns 204, still derives owner server-side, still rejects oversized metadata.
- Integration: funnel events survive a simulated cold start (durable store).

**(g) Rollout & rollback**
- Ship the `packages/analytics` extraction first as a **behavior-neutral refactor** (byte-equivalent output), verified by diffing rendered tags.
- Ship consent banner **behind a flag**, default region-aware (EU/UK default-deny, else on) — coordinate with Phase 4 legal review.
- DB migration is additive (new table + nullable-then-backfilled column) → safe.
- **Rollback:** flip the consent flag off and revert the package import; the additive schema stays.

**(h) Effort:** **L — ~6–8 days** (extraction 2–3d, consent gate 1–2d, DB durability + brand tag 2–3d).

**(i) Dependencies & risks**
- Depends on the operator answering "are GA/Plausible IDs unique per brand?" (0.7.3).
- Risk: consent default-deny reduces GA data volume (expected/acceptable). Risk: extraction must not change event names/params or it breaks existing GA reports and the SEO-neutral funnel. No SEO/affiliate impact.

---

# Phase 2 — Narrow AI scope, server-side validation, prompt-injection defenses, tool allowlists

**Objective:** enforce AI scope and safety in code (not prompts), cap input, harden against injection, fix brand identity, and stop unredacted PII egress — delivered through a shared AI package.

**(a) Existing functionality discovered**
Single `AnthropicModelClient`; `claude-haiku-4-5` everywhere; **forced structured tool-output + strict zod re-validation** (strong structural containment — no action tools to abuse); deterministic fallbacks on model failure; dormant fake-inventory provider; booking is LLM-free and off the concierge path; zod body validation; cliché "lintVoice" on free-text agents.

**(b) Gaps**
- `rawInput` has **no max length** → token-cost amplification / DoS.
- **No prompt-injection hardening** and **no output moderation** on free-text mood/flavor agents.
- **Brand misidentification** — "StayScout" hardcoded in the live prompt across all four apps; AI path ignores `brand-config`.
- Model id hardcoded per-agent → no central config, no per-site model policy.
- **Unredacted full-prompt + PII egress to Langfuse** when keys are set.
- AI stack duplicated 4× (no `packages/ai`).
- Scope guarantee rests on structural containment for the intent path but only cliché-lint for free-text paths — needs an explicit server-side scope/safety check.

**(c) Files / packages likely affected**
- **New** `packages/ai` (or `@adored/ai-core`): extract `lib/ai/*`, `agents/*`, `orchestrator/*`, `core/model-client.ts`, prompts. Add a **central model registry** (one place per site to set the model id and per-site policy) and an **input-guard** module.
- `core/concierge-request.ts`: add `rawInput` `.max()` (and a normalized-length check).
- `lib/ai/prompts/intent-system.ts` + siblings: replace "StayScout" with the brand from `brand-config`; add untrusted-input delimiting + "ignore embedded instructions" framing (defense-in-depth on top of structural containment).
- `lib/observability/langfuse-trace-logger.ts`: redact/truncate/hash raw text and strip PII before egress (or gate egress behind an allowlist of non-sensitive fields).
- `apps/*/src/app/api/concierge/route.ts` and `social/generate/route.ts`: wire the shared input-guard + scope check.

**(d) Database / infrastructure changes**
- None required. Optional: a small `rejected_input` counter (feeds Phase 3 dashboards) — can be a Redis counter rather than a table.

**(e) Environment variables**
- `AI_MAX_INPUT_CHARS` (default, e.g., 2000) — server-enforced cap.
- `AI_MODEL_<site>` or a `brand-config` model field — central model policy.
- `AI_TELEMETRY_REDACTION` (`strict` default) — controls Langfuse redaction level.
- `AI_MODERATION_ENABLED` — flag for optional pre/post moderation on free-text agents.

**(f) Tests**
- Input cap: oversized `rawInput` rejected with 400 before any model call.
- Red-team fixtures: injection strings ("ignore previous instructions…", tool-spoofing, data-exfil prompts) still yield schema-valid `TripIntent` and never alter agent behavior; free-text agents refuse/neutralize off-scope content.
- Brand identity: generated prompt names the correct brand per app.
- Telemetry: Langfuse payloads contain no raw user text / PII (assert redaction).
- Output-schema conformance and deterministic-fallback paths preserved.

**(g) Rollout & rollback**
- Ship the input cap + Langfuse redaction + brand-string fix **first** (low-risk, high-value; brand fix is a plain correctness bug).
- Ship prompt-injection framing and optional moderation **behind flags**, measuring intent-extraction quality before/after.
- **Rollback:** flags off revert to current behavior; the input cap is a constant that can be raised via env without redeploy.

**(h) Effort:** **L — ~6–8 days** (shared-package extraction 3–4d is the bulk; guards + redaction + brand fix 2–3d; red-team fixtures 1d).

**(i) Dependencies & risks**
- Complements Phase 3 (input cap is the first line of cost defense).
- Risk: over-aggressive injection framing or moderation could degrade intent-extraction quality — mitigate with A/B on the eval suite in `apps/*/tests/eval`. Must preserve the forced-structured-output guarantee and deterministic fallbacks.

---

# Phase 3 — Rate limits, token/cost budgets, kill switches, usage dashboards

**Objective:** stop runaway spend and abuse — per-IP/session rate limits, per-site daily budgets, a portfolio kill switch, and durable usage dashboards.

**(a) Existing functionality discovered**
Cost is computed per invocation (`costs.ts` `computeCostUsd` + `MODEL_PRICING`) and aggregated in an in-memory 200-turn telemetry ring buffer with P50/P95; optional Langfuse export; an admin turns dashboard. That is the entire cost surface.

**(b) Gaps**
- **No rate limiting, no throttle, no quota anywhere.** The public concierge and social routes are unbounded.
- **No budget cap, no circuit breaker, no kill switch.**
- Cost/telemetry is **in-memory and per-process** → cannot back a portfolio-wide budget; needs a durable, cross-instance counter store.
- No shared limiter package; enforcement points (concierge, social/generate, contact, newsletter, crons) are duplicated 4×.

**(c) Files / packages likely affected**
- **New** `packages/rate-limit` (or fold into `@adored/security`): a limiter (sliding-window), a per-site budget accountant, and a kill-switch reader, all backed by a shared store.
- Wire into the expensive POST surfaces: `apps/*/src/app/api/concierge/route.ts`, `social/generate/route.ts`, `contact/route.ts`, `newsletter/subscribe/route.ts`, and optionally `middleware.ts` for a coarse edge limit.
- `lib/observability/*`: write per-turn cost to the durable counter (in addition to the ring buffer).
- **New** admin usage dashboard page reading durable counters (per-site spend, request rates, rejections, budget headroom, kill-switch state).

**(d) Database / infrastructure changes**
- **Provision Upstash Redis (REST, edge-compatible)** — recommended over `@vercel/kv` for portability and atomic counters. Keys: `budget:<site>:<yyyy-mm-dd>`, `ratelimit:<site>:<ip|session>`, `killswitch:portfolio`, `killswitch:<site>`.
- Optional durable Postgres rollup table `AiUsageDaily { site, date, requests, tokensIn, tokensOut, costUsd }` for history beyond Redis retention.
- Kill-switch flags in Redis (or Vercel Edge Config for lowest-latency reads in middleware).

**(e) Environment variables**
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (secrets).
- `AI_DAILY_BUDGET_USD_<site>` (per brand) and `AI_DAILY_BUDGET_USD_DEFAULT`.
- `RATE_LIMIT_CONCIERGE_PER_MIN`, `RATE_LIMIT_CONTACT_PER_HOUR`, etc.
- `AI_KILLSWITCH` (portfolio master; also readable from Edge Config), `AI_KILLSWITCH_<site>`.
- `RATE_LIMIT_MODE` (`monitor` | `enforce`) for a safe staged rollout.
- Document `CRON_SECRET` (currently missing) so cron endpoints aren't open.

**(f) Tests**
- Limiter allows under-threshold, returns 429 over-threshold, is per-site + per-identity.
- Budget accounting increments correctly; exhaustion returns a graceful 429/503 and blocks further model calls that day.
- Portfolio kill switch immediately disables the concierge across all sites; per-site switch scopes to one brand.
- Counters are atomic under concurrency (no double-spend on parallel lambdas).
- `monitor` mode logs but never blocks; `enforce` mode blocks.

**(g) Rollout & rollback**
- Deploy in **`monitor` mode first** (log would-be-blocks, no user impact) for ~1 week to calibrate thresholds against real traffic; then flip to `enforce`.
- Kill switch defaults to **allow**; verify the off→on→off path in staging.
- **Rollback:** set `RATE_LIMIT_MODE=monitor` or raise limits via env (no redeploy); kill switch is itself the fastest rollback for an incident.

**(h) Effort:** **L — ~7–9 days** (limiter/budget/kill-switch package 3–4d, wiring 4 apps 2d, durable dashboard 2–3d) + ~1–2 days lead time to provision Upstash.

**(i) Dependencies & risks**
- Depends on Phase 2's input cap (cheap first-line defense) and benefits from Phase 1's durable-storage groundwork.
- Requires external infra (Upstash) — adds a runtime dependency and cost; the limiter must **fail-open on store outage for legitimate traffic but fail-closed for budget breaches** — design this trade-off explicitly.
- Risk: false-positive blocking of shared-IP users (mobile carriers, offices) — prefer session+IP composite keys and generous burst allowances.

---

# Phase 4 — Cross-site isolation, red-team testing, legal notices, production rollout

**Objective:** guarantee brand isolation, prove the whole program with adversarial testing, ship required legal notices, and roll out to production safely.

**(a) Existing functionality discovered**
Compile-time per-app brand binding (trusted, not host-derived) — the correct foundation. Owner-scoped trip/booking/memory queries. Runtime affiliate host allowlist in `/api/go`. Verified Stripe webhook signatures. Authenticated migrate route. `privacy`/`terms` pages in all four apps.

**(b) Gaps**
- **No `siteId` on any model** → shared-DB commingling with zero code isolation (pivotal, pending 0.7.1).
- **Affiliate `providers[]` is declarative, not enforced** → a brand could surface an off-brand-but-allowlisted host via `/api/go` (the allowlist is platform-wide, not per-brand).
- **Weak admin authz** — `requireAdmin()` accepts any authenticated Clerk user (no role/allowlist); most admin pages are Clerk-only; **no rate limit on `/api/admin/login`**; the password gate is open if `ADMIN_PASSWORD` is unset.
- **Session cookie unsigned + no `Secure`** → tamper/forgery + migrate-hijack vector.
- **No consent mechanism** (legal exposure for EU/UK; cookies set pre-consent).
- **No security headers / CSP** anywhere.
- **Shared cookie names** (`stayscout-session`, `stayscout-theme`) and `globalThis` singletons would bleed across brands if ever co-hosted under a shared parent domain.
- Undocumented secrets (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`); stale `turbo.json` env allowlist.

**(c) Files / packages likely affected**
- `apps/*/prisma/schema.prisma` + all session-store queries: add `siteId` to owned models **and enforce it in every query** (defense-in-depth even with per-app DBs).
- `packages/affiliate` + `/api/go` route: enforce a **per-brand** provider/host allowlist derived from `brand-config.affiliate.providers`.
- `apps/*/src/lib/admin/*` + `require-admin.ts`: add an **admin email/role allowlist**; require the password gate on all admin pages; add login rate limiting (reuse Phase 3 limiter).
- `apps/*/src/lib/session/anonymous.ts` + middleware: **sign the session cookie + add `Secure`**, with a dual-read migration so existing `anon_<uuid>` cookies remain valid during transition.
- `apps/*/src/middleware.ts` (or `next.config.ts`): add **CSP + security headers** (`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, framed CSP with report-only first).
- **New** `packages/consent` (shared banner + state) wired into layout; per-brand `privacy`/`terms`/**new cookie-policy** pages.
- `.env.example` (all apps) + `turbo.json`: document all secrets, fix the env allowlist.

**(d) Database / infrastructure changes**
- **Confirm DB topology (0.7.1).** Recommended target: **one database per brand** (cleanest isolation). If a shared DB must stay, add `siteId` to every owned model, backfill, and enforce a site filter in all reads/writes.
- **Confirm Clerk topology (0.7.2).** Prefer per-brand Clerk instances; if shared, scope `userId` lookups by `siteId`.
- Security headers via middleware/host config; CSP report endpoint (can reuse `/api/analytics` pattern or an external collector).

**(e) Environment variables**
- Document `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET` (required, not optional).
- `ADMIN_EMAIL_ALLOWLIST` (comma-separated) for role gating.
- `SESSION_COOKIE_SECRET` for signing the anonymous cookie.
- `CSP_REPORT_URI`, `SECURITY_HEADERS_MODE` (`report-only` | `enforce`).
- Per-brand `DATABASE_URL` / Clerk keys confirmed distinct.

**(f) Tests**
- **Red-team suite (the capstone):** cross-tenant trip access by id/slug across brands; affiliate host bypass per brand (gobookt must reject non-booking hosts); prompt-injection replay against the concierge (from Phase 2 fixtures); admin authz (non-allowlisted Clerk user denied; login brute-force throttled); cookie tamper/forgery rejected; kill-switch + budget enforcement (from Phase 3).
- Isolation: every store query filtered by `siteId`; a seeded "other brand" row is never returned.
- Consent presence + correct default-deny by region; security headers present and CSP blocks inline/off-origin as intended.
- Legal: privacy/terms/cookie-policy render per brand with correct entity + contact.

**(g) Rollout & rollback**
- **Gate 0 (blocking):** confirm DB + Clerk topology before any isolation code ships.
- Ship security headers and CSP in **report-only** first; sign the session cookie with **dual-read** so no user is logged out.
- **Legal notices reviewed by counsel** before publishing (consent copy, cookie policy, entity details) — external dependency, start early.
- Canary one app (numiworks) through the full red-team suite, then roll the portfolio.
- **Rollback:** CSP report-only and dual-read cookie make header/cookie changes reversible without user impact; `siteId` enforcement can be toggled per-query behind a flag during bake-in; the Phase 3 kill switch is the emergency stop.

**(h) Effort:** **XL — ~10–12 days** (siteId + query enforcement 3–4d, per-brand affiliate enforcement 1–2d, admin authz + cookie signing + headers 3–4d, consent/legal pages 1–2d, red-team suite 2–3d) + external legal-review lead time.

**(i) Dependencies & risks**
- Depends on Phases 1–3 (consent banner from 1, injection fixtures from 2, login limiter + kill switch from 3) and on the operator answering 0.7.
- **Highest risk:** if the DB is shared and un-tagged, this is a live data-leak that must be remediated before any launch — treat DB topology confirmation as P0.
- Risk: cookie signing without dual-read logs everyone out (mitigated). Legal review is an external gating dependency — schedule it in parallel with Phases 1–3.

---

## Effort summary

| Phase | Scope | Size | Rough days |
|---|---|---|---|
| 0 | Audit (this document) | — | done |
| 1 | Analytics correctness, per-site IDs, consent, privacy-safe events | L | 6–8 |
| 2 | Narrow AI scope, server-side validation, injection defense, tool allowlists | L | 6–8 |
| 3 | Rate limits, token/cost budgets, kill switches, usage dashboards | L | 7–9 (+1–2 infra lead) |
| 4 | Cross-site isolation, red-team, legal notices, production rollout | XL | 10–12 (+ legal review) |
| **Total** | | | **~29–37 engineering days** (~6–8 calendar weeks incl. review, legal, and infra procurement) |

**Sequencing note:** Phases are ordered by dependency, but three quick wins can ship immediately and independently of the extraction work: (1) the `rawInput` max-length cap, (2) the "StayScout" → correct-brand prompt fix, (3) documenting `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET`/`CRON_SECRET` in `.env.example`. Start the DB/Clerk topology confirmation (0.7) and legal review on day 1 — both are external gating items for Phase 4.
