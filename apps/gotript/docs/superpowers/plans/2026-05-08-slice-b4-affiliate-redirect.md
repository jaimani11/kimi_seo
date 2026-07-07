# Slice B4 Implementation Plan - Affiliate Redirect + Click Attribution

> Executed inline, batched, only pausing for real blockers.

**Goal:** Wire the booking CTA through a server-side redirect that records an `AffiliateClick` row + 302s to the provider's deep link, replacing the placeholder Slice A modal. The same model later supports conversion reconciliation (B7+) and admin commission reporting (Slice C).

**Architecture:** A `GET /api/go` route that takes `{stayId, providerId, affiliateUrl, turnId?, conversationId?}`, validates the affiliateUrl host against an allowlist (open-redirect prevention), records via `SessionStore.recordClick`, and 302s. The detail panel's "Continue to Booking" CTA becomes an `<a href={generateGoUrl(stay, ctx)}>` so the browser handles target=_blank natively. The confirm modal stays - same wording, same UX - but the redirect is now real.

**Tech Stack:** No new deps.

---

## Architectural Tenets (Opus-level)

**1. Server-side 302, not client-side navigation.**
Affiliate networks set first-party cookies on the redirect hop that survive cross-origin to the provider - client-side `location.href = ...` doesn't get those cookies. Server redirect is the standard.

**2. Open-redirect prevention is mandatory.**
The redirect handler MUST validate `affiliateUrl` against a hostname allowlist. Without it, `/api/go?affiliateUrl=https://evil.example.com` becomes a phishing aid (StayScout's domain in the bar, attacker's site rendering). Allowlist is hardcoded; B5 extends it as real providers come on.

**3. Click is recorded before redirect, not after.**
A failed DB write must NOT block the redirect - booking flow is sacred. We record via try/catch + console.error on failure. Conversion attribution can backfill via the AffiliateClick row's createdAt + (userId | sessionId).

**4. Owner derived from auth state.**
Click is attributed to the same owner as everything else: `userId` for authenticated, `sessionId` for anonymous. Anonymous clicks survive sign-in via the existing migration model - but Slice B4 does NOT migrate clicks because clicks are append-only event records, not user-owned mutable state. (B7 admin can reconcile.)

**5. Mock-safe end-to-end.**
Both `InMemorySessionStore` and `PostgresSessionStore` implement `recordClick`. In-memory clicks survive within a dev session; Postgres clicks are durable. The /api/go route works regardless.

**6. The redirect URL stays clean.**
`/api/go?stayId=...&p=...&u=...&t=...` - short keys, all ASCII, encoded once. The final 302 destination is `affiliateUrl` exactly as the provider supplied it (we don't re-mangle).

**7. Click attribution doesn't authenticate.**
The click handler doesn't gate on auth: anonymous users click too. We trust the cookie-bound `sessionId` for the anonymous case. Spoofing a `sessionId` only attributes a click to a fake bucket - there's no privilege gain.

---

## File Structure

**Create:**
- `src/lib/affiliate/allowlist.ts` - hostname allowlist + `isAllowedAffiliateHost(url)` validator
- `src/lib/affiliate/go-url.ts` - `generateGoUrl({stay, turnId?, conversationId?})` URL builder
- `src/app/api/go/route.ts` - GET handler: validate, record, 302
- `tests/affiliate-allowlist.test.ts`
- `tests/affiliate-go-url.test.ts`

**Modify:**
- `src/lib/session/session-store.ts` - add `recordClick(args)` returning the recorded row
- `src/lib/session/in-memory-session-store.ts` - implement
- `src/lib/session/postgres-session-store.ts` - implement
- `src/features/workspace/detail/confirm-redirect-modal.tsx` - real redirect, not a "ships in B" placeholder
- `src/features/workspace/detail/detail-panel.tsx` - pass turnId so the click can be attributed to the turn
- `tests/session-store.test.ts` - add a click contract case

---

## Tasks

### Task 1: SessionStore.recordClick + types

- [ ] Extend `SessionStore` with `recordClick(args)` taking `{stayId, providerId, affiliateUrl, ownerKind, ownerId, sessionId, turnId?, conversationId?}` and returning `AffiliateClickRecord` with `id, createdAt`. Owner separate from sessionId because authenticated users still have a sessionId (used for migration audit).
- [ ] In-memory impl - appends to `clicks: AffiliateClickRecord[]`. Order matters for tests.
- [ ] Postgres impl - `db.affiliateClick.create`. Sets `userId` only when `ownerKind === 'user'`. Always writes `sessionId`.
- [ ] Verify: typecheck.

### Task 2: Allowlist + go-url helpers

- [ ] `src/lib/affiliate/allowlist.ts` - exported `AFFILIATE_HOST_ALLOWLIST` array + `isAllowedAffiliateHost(url): boolean`. Allowlist contains: `example.com` (mock), `booking.com`, `expedia.com`, `hotels.com`, `vrbo.com`, `airbnb.com`, `hotelbeds.com`, `skyscanner.com`, `viator.com`, `getyourguide.com`. Validator parses URL, accepts host that exact-matches OR has a trailing `.<allowed>` (subdomain).
- [ ] `src/lib/affiliate/go-url.ts` - `generateGoUrl({stay, turnId?, conversationId?, origin?}): string` - returns `${origin}/api/go?s=${stayId}&p=${providerId}&u=${encodeURIComponent(bookingLink.url)}&t=${turnId}` (omit empty params). Origin defaults to relative - server figures it out.
- [ ] Tests for allowlist (subdomain match, exact match, mismatch, malformed URL) + go-url (basic shape, encoding, optional params).

### Task 3: /api/go route + wire detail panel

- [ ] `src/app/api/go/route.ts` - `GET`. Parses `s/p/u/t/c`. Validates `u` is a https URL whose host passes the allowlist. Records click via `getSessionStore().recordClick(...)` with owner derived from `getServerAuth()`. 302 to `u`. On allowlist-fail returns 400. On record-fail logs + still 302s (booking flow sacred).
- [ ] Update `confirm-redirect-modal.tsx` - replace the "Slice A demo" content with a real "Continue to Booking" CTA that's a server-side redirect via `generateGoUrl(stay, {turnId})`. Keep the wording about commissions identical to the existing copy direction.
- [ ] Update `detail-panel.tsx` - the modal needs `turnId` (the turn that produced this stay). Use `selectTurnContainingStay(s, stayId).turnId`. Pass through.
- [ ] Verify: typecheck + lint + manual test.

### Task 4: Pipeline + changelog + tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`. Fix what flares.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-b4.md`.
- [ ] Commit at logical milestones. Tag `slice-b4`.

---

## What stays unchanged

- `OrchestratorEvent` shape - no new event kinds.
- `Stay.bookingLink` - already carries `attribution` field; B4 reads, doesn't write.
- LangGraph engine - clicks happen post-turn, outside the orchestrator.
- Auth abstraction - clicks attribute to the current owner; no new gates.

## Out of B4 scope

- Conversion tracking (provider postbacks → mark `converted=true` + `commissionAmount`). B7.
- Admin click dashboard. Slice C.
- Click migration on sign-in. Append-only records - keeping anon click rows accurately reflects who clicked when.
