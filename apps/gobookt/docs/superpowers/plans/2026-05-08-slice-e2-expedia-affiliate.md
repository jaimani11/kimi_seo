# Slice E2 - Expedia Affiliate (real monetization)

> Executed inline. Stop pretending; start earning.

**Goal:** Wire the user's actual Expedia Creator Platform affiliate
credentials so every listing - including curated and AI-synthesized
ones - has a real "View on Expedia" CTA that earns commission.
Affiliate links work via URL pattern, **independent of Rapid API
inventory access** (which is a separate partner approval). The same
adapter shape we shipped in E1 is ready for live inventory; this
slice doesn't depend on it.

**Non-goal:** Replacing Rapid API. The two are orthogonal:

  - **Affiliate links** generate `expedia.com/Hotel-Search?…&affcid=…`
    URLs from intent (destination + dates + occupancy). No partner API
    approval needed; just sign up at the Creator Platform.
  - **Rapid API** is real-time availability + pricing for the
    listings *we* render. Requires partner approval (weeks).

A user can click "View on Expedia" on any listing → land on
Expedia.com with the right search prefilled and our affcid attached →
book → we earn commission. With Rapid keys later, the *same* listing
shows real availability before the click - but the affiliate flow is
already revenue-generating today.

---

## Architectural Tenets

**1. Affiliate links are URL-pattern generators.** No API. No keys
beyond the `affcid`. They work for any destination Expedia indexes.

**2. Inventory and affiliate are decoupled.** A listing without
direct property data still gets a usable affiliate link via a
destination-level Expedia search. Rapid-sourced listings get a
property-level deeplink when the property id maps. Both wrap through
the same redirect.

**3. The redirect is short and stable.** `/r/[id]` instead of the
existing query-string `/api/go?u=…`. Self-contained id (base64url
JSON payload) so we don't need a new persistence layer; click
attribution still flows through the existing `AffiliateClick` table
from B4.

**4. Mock-safe, again.** Without `EXPEDIA_AFFILIATE_CID` set, the
URL builder still produces a valid Expedia.com search URL - just
without the affcid param. CTAs work; commission doesn't track.
Honest behavior.

**5. Clear disclosure.** Every Expedia CTA carries "Affiliate link"
+ "Prices may change" copy. FTC-aligned. The user sees what's going on.

**6. Provenance stays honest.** The `AI PREVIEW` chip from E1 stays
on synthesized listings even when the affiliate CTA points to a real
Expedia search - because the listing the *user is reading on our
page* is AI-generated, even if Expedia might have similar real ones.

**7. No tight coupling to mock data.** The builder takes typed
inputs (destination, dates, occupancy) - not "the mock-italy stay."
When Rapid inventory lands, the builder still produces the right URL.

---

## File structure

**Create:**
- `src/lib/affiliate/expedia-link-builder.ts` - pure URL builder
- `src/lib/affiliate/link-encoder.ts` - base64url JSON id codec
- `src/app/r/[id]/route.ts` - redirect + click record
- `src/features/shared/expedia-cta.tsx` - CTA + disclosure
- `docs/providers/expedia-affiliate.md` - setup walkthrough
- Tests: `expedia-link-builder.test.ts`, `link-encoder.test.ts`,
  `r-route.test.ts` (smoke; lib tests cover substantive logic)

**Modify:**
- `.env.example` - `EXPEDIA_AFFILIATE_CID`, `EXPEDIA_AFFILIATE_LABEL`,
  `EXPEDIA_AFFILIATE_BASE_URL`, `EXPEDIA_AFFILIATE_SITE_ID`
- `src/features/workspace/canvas/trip-board/hero-stay-card.tsx` -
  small "View on Expedia →" link in the corner footer
- `src/features/workspace/detail/detail-panel.tsx` - primary
  "Check availability on Expedia" CTA + disclosure
- `src/lib/env/get-server-features.ts` - surface
  `affiliate: { expediaConfigured: boolean }` for /admin
- `src/features/admin/admin-shell.tsx` - N/A (chrome unchanged)

---

## Tasks

### Task 1 - Expedia URL builder (`src/lib/affiliate/expedia-link-builder.ts`)

- [ ] `buildExpediaSearchUrl({ destination, checkIn, checkOut, adults, children, config })`
  → URL with `affcid`, `siteid`, `destination`, `startDate`, `endDate`,
  `rooms`, `adults`, `children` ages, optional `label`/`utm_*`.
- [ ] `buildExpediaPropertyUrl({ propertyId, ... })` for direct property
  deeplinks (used when Rapid is wired later).
- [ ] `getExpediaAffiliateConfig()` reads env: `EXPEDIA_AFFILIATE_CID`
  (required for tracking; unset = un-tracked URL still produced),
  `EXPEDIA_AFFILIATE_LABEL`, `EXPEDIA_AFFILIATE_BASE_URL` (default
  `https://www.expedia.com`), `EXPEDIA_AFFILIATE_SITE_ID` (default
  `1`).
- [ ] Tests: destination URL with all params; un-tracked fallback when
  CID unset; date encoding ISO `YYYY-MM-DD`; adults/children count;
  baseUrl override.

### Task 2 - Link encoder (`src/lib/affiliate/link-encoder.ts`)

- [ ] `encodeAffiliateLink({ url, providerId, stayId?, turnId?, conversationId? })`
  → base64url-encoded compact JSON. Length-bounded (the `id` segment
  in `/r/[id]` should be < 200 chars typically).
- [ ] `decodeAffiliateLink(id)` → payload or `null`. Validates the
  decoded URL is on the allowlist; rejects malformed.
- [ ] No DB persistence - payload is self-contained. Click record
  stays in the existing `AffiliateClick` table.
- [ ] Tests: round-trip; malformed rejection; oversized rejection;
  disallowed host rejection.

### Task 3 - `/r/[id]` route (`src/app/r/[id]/route.ts`)

- [ ] GET. Decode id; reject (404) on malformed/disallowed.
- [ ] Resolve `RouteContext`. Record an `AffiliateClick` (owner
  attribution from cookie, providerId + stayId + turnId from payload,
  affiliateUrl as the decoded url). Failures don't block.
- [ ] 302 to the decoded URL.
- [ ] Logs each redirect with truncated url + providerId for ops
  visibility.

### Task 4 - `<ExpediaCta>` (`src/features/shared/expedia-cta.tsx`)

- [ ] Receives `{ stay, intent, variant: 'primary' | 'compact' }`.
- [ ] Resolves the affiliate URL for the stay:
   - If the stay's `bookingLink.url` is an `expedia.com` host, use
     that (it's already affiliate-tracked from the Rapid mapper).
   - Otherwise build a destination-level search URL via the URL builder.
- [ ] Encodes via `encodeAffiliateLink` and renders an anchor to
  `/r/<id>`.
- [ ] Primary variant: full button "Check availability on Expedia →"
  with disclosure footer "Powered by Expedia · Affiliate link ·
  Prices may change".
- [ ] Compact variant: small "View on Expedia →" link.
- [ ] Server component (no `'use client'`) - pure URL math + an anchor.

### Task 5 - Wire into stay surfaces

- [ ] `hero-stay-card.tsx`: add a small `<ExpediaCta variant="compact">`
  in the footer next to the price. (Card click still opens detail.)
- [ ] `alternative-card.tsx`: same treatment.
- [ ] `detail-panel.tsx`: replace the existing booking redirect with
  `<ExpediaCta variant="primary">`. Disclosure visible.

### Task 6 - Env + features

- [ ] `.env.example`: add the new four env vars with comments + a
  cross-link to `docs/providers/expedia-affiliate.md`.
- [ ] `getServerFeatures()` adds `affiliate: { expediaConfigured: boolean }`
  so /admin can show whether the demo is monetized vs not.
- [ ] Update admin dashboard tile (small "Affiliate" card) showing
  Expedia configured/not.

### Task 7 - `docs/providers/expedia-affiliate.md`

- [ ] How affiliate links work (URL pattern; click → cookie → booking
  → commission).
- [ ] Where IDs go (`affcid`, `siteid`, `label` semantics).
- [ ] How commissions are tracked (90-day cookie, per-program rate).
- [ ] How redirects work (our `/r/[id]` → click record → 302 →
  Expedia.com).
- [ ] Difference between affiliate links vs Rapid API inventory.
- [ ] Setup steps (creator platform, finding your CID, optional label
  for source-attribution sub-channels).
- [ ] FAQ: what happens when CID is missing, what hosts are allowed,
  how to test in dev.

### Task 8 - Tests + pipeline + commit + tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
  && pnpm build`. Fix anything that flares.
- [ ] One commit, tagged `slice-e2`.

---

## Mock-safe matrix

| Vars | Behavior |
|---|---|
| (none) | Affiliate URL still generated, no `affcid` attached. CTAs work; commission isn't tracked. |
| `EXPEDIA_AFFILIATE_CID` | Real affiliate tracking. Every CTA earns. |
| `EXPEDIA_AFFILIATE_BASE_URL=https://www.expedia.co.uk` | Locale override. Useful for UK/EU creators. |
| All four | Full configuration; admin shows "Affiliate · Expedia" green chip. |

## What does NOT change

- Rapid API integration - still gated on `EXPEDIA_API_KEY` +
  `EXPEDIA_SHARED_SECRET`. The affiliate flow doesn't depend on them.
- Booking flow (D-series) - still mock-only. Real reservation API is D.x.
- Provider provenance chips - `AI PREVIEW` stays on synthesized
  listings even when their CTA points to a real Expedia search.
- The existing `/api/go` route - kept for backward compat with any
  existing share/click links. New CTAs use `/r/[id]`.
