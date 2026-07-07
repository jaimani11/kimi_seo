# Setup checklist

Concrete steps. No prose where a step suffices.

---

## 1 - Paste your Expedia affiliate CID

Open `.env.local` (create if missing). Add:

```dotenv
NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID=YOUR_AFFCID_HERE
```

Optional companions (all four can stay blank - the affcid is the only one needed for monetization):

```dotenv
NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL=stayscout-web
NEXT_PUBLIC_EXPEDIA_AFFILIATE_BASE_URL=https://www.expedia.com
NEXT_PUBLIC_EXPEDIA_AFFILIATE_SITE_ID=1
```

Restart the dev server:

```bash
pnpm dev
```

---

## 2 - Verify outbound affiliate links work

**Visual check (30 seconds)**

1. Open `http://localhost:3000/admin/affiliate` - the new debug page.
2. The "Expedia Affiliate CID" tile should read **`Configured`** in green.
3. The "Sample generated Expedia URL" panel shows the URL the app would build for a Tuscany search - your `affcid` should be visible in the query string.
4. The "Sample tracked redirect URL" panel shows the corresponding `/r/<id>` URL the app actually links users to.

**Click-through check (1 minute)**

1. Open `http://localhost:3000/`.
2. Type "Tuscany, slow and walkable" → wait for the trip board.
3. On any listing card, hover the corner - "View on Expedia →" link.
4. Cmd-click (or right-click → copy link). It should be `http://localhost:3000/r/<long-id>`.
5. Click it. Browser opens a new tab → `expedia.com/Hotel-Search?…&affcid=YOUR_CID&…`. Confirm `affcid` is present in the address bar.

**Admin verification**

Go to `/admin/clicks`. Your click appears in the feed with `expedia` (or whichever provider id was on the originating listing).

---

## 3 - How `/r/[id]` tracking works

| Step | What happens |
|---|---|
| 1 | App renders `<a href="/r/<encoded-id>" target="_blank" rel="sponsored">`. The `id` is a base64url-JSON payload carrying the outbound URL + `providerId` + `stayId` + `turnId`. Self-contained. No DB lookup needed. |
| 2 | User clicks → `GET /r/<id>` lands on the route. |
| 3 | Route decodes the payload. Validates URL host against the allowlist (`expedia.com`, `vrbo.com`, `hotels.com`, etc.) - defense against tampered ids. |
| 4 | Records a row in the `AffiliateClick` table (existing from Slice B4): `{ ownerKind, ownerId, sessionId, providerId, stayId, turnId, affiliateUrl, createdAt }`. |
| 5 | 302 to the decoded URL. User lands on Expedia with `affcid` attached. |

Click attribution survives session-mismatch (cookie is canonical owner). Click failures **never** block the redirect - the user must always reach the provider.

Operators see the live click feed at **`/admin/clicks`** and per-owner aggregates at **`/admin/users/[ownerId]?kind=session`**.

---

## 4 - What's real vs still mock

| Layer | Status | Notes |
|---|---|---|
| **Affiliate links** | ✅ **Real** when CID set | Real Expedia.com URLs; `affcid` attached; commission earns. |
| **Click tracking** | ✅ **Real** | `AffiliateClick` rows persisted; admin feed shows them. |
| **Listing copy + photos** | 🔶 **Mock** for Italy (curated) + AI-synthesized for everywhere else | Real listings require Rapid API access (separate from affiliate). |
| **Listing prices** | 🔶 **Mock** | Hand-tuned for Italy; LLM-synthesized for elsewhere. Real prices = Rapid. |
| **Real-time availability** | ❌ **Not yet** | Same - gated on Rapid. |
| **Concierge AI (intent + ranking)** | ✅ **Real** | Claude-driven intent extraction; signal-weighted ranking. |
| **Stripe billing** | ✅ **Real test-mode** when keys set | C4 - `docs/billing.md`. |
| **Booking confirmation** | 🔶 **Mock provider** | D-series shipped the agent + flow + persistence; real reservation API is D.x. |
| **Database persistence** | 🔶 **In-memory by default** | `DATABASE_URL` flips to Postgres for trips/clicks/turns/memories. |
| **Auth** | 🔶 **Anonymous cookie by default** | Clerk drops in via `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. |

The "real monetizable" property is true today: every click earns commission. The "real listings" property requires Rapid.

---

## 5 - What Rapid API access unlocks

Once you have Rapid credentials, the app starts pulling **real Expedia inventory**:

- **Real properties** - actual hotel names, descriptions, addresses, coordinates from Expedia's catalog. Replaces the curated Italian dataset (for Italy queries) and the AI-synthesized stays (for non-Italy queries) with live results.
- **Real photos** - Expedia's licensed photography per property. Replaces the hand-curated Unsplash pool.
- **Real prices** - current rates for the requested dates + occupancy. Replaces the hand-tuned + LLM-synthesized prices.
- **Real availability** - only properties bookable for the user's window come back. Replaces the "always available" mock.
- **Property-level deeplinks** - every listing's affiliate link goes straight to its Expedia property page (no destination-search redirect). Higher conversion.

The provenance chip flips from `CURATED · ITALY` / `AI PREVIEW` → `EXPEDIA · LIVE` automatically.

---

## 6 - Exactly which Rapid credentials to request

Two values, both from the **Expedia Group Rapid** product (different product from the Creator Platform that gave you the affcid).

### What to apply for

- Apply at https://www.partner-solutions.expediagroup.com/.
- Request the **Rapid** API. Specifically:
  - **Affiliate Lite** tier - supports Property Search + Property Availability without booking endpoints. This is the right tier for our redirect-based booking flow (we don't need their booking API; we redirect via affiliate URL).
  - If you also want Vrbo (vacation rentals), say so during application - Rapid serves Vrbo via the same surface with a category filter.
- Approval takes typically 2–6 weeks. Sandbox creds arrive first; production creds after a compliance review.

### What you'll receive

- **`API Key`** - string identifier for your account.
- **`Shared Secret`** - used to compute the HMAC-SHA512 signature on every request.

Both go in `.env.local`:

```dotenv
EXPEDIA_API_KEY=replace_with_eps_api_key
EXPEDIA_SHARED_SECRET=replace_with_eps_shared_secret
```

If you have a separate Vrbo contract:

```dotenv
VRBO_API_KEY=replace_with_vrbo_api_key
VRBO_SHARED_SECRET=replace_with_vrbo_shared_secret
```

If your contract grants both Expedia + Vrbo on the same Rapid creds (common), just set both env pairs to the same values.

### What stays the same

The Creator Platform `affcid` from step 1 stays exactly as-is. Rapid + affiliate are two products that work together - Rapid populates the listings; the affcid earns the commission when the user clicks through.

---

## 7 - Which files change once Rapid keys land

**Zero code changes.** All the wiring already exists from Slice E1.

What flips:

| File | Today (no keys) | After Rapid keys set |
|---|---|---|
| `src/providers/expedia/index.ts` | `ExpediaProvider.fromEnv()` returns null; provider absent from registry | Returns the provider; registry includes it; queries hit the real Expedia Rapid API |
| `src/providers/expedia/client.ts` | Defined, never invoked | Makes live `/v3/properties/availability` calls with HMAC-SHA512 signature |
| `src/providers/expedia/mapper.ts` | Defined, never invoked | Maps real Rapid responses to our `Stay` shape |
| `src/providers/vrbo/*` | Same - present, dormant | Same - activates with `VRBO_*` keys |
| `src/lib/env/get-server-features.ts` | `providers.expedia: false` | `providers.expedia: true` (visible at `/admin`) |
| `src/features/shared/expedia-cta.tsx` | Builds destination-level search URLs | Uses real property deeplinks (the existing booking link from the Rapid mapper) |
| Listings UI | `CURATED · ITALY` / `AI PREVIEW` chips | `EXPEDIA · LIVE` chips |

The only hands-on work is dropping the keys in and restarting. No new code, no new tests, no migrations.

---

## At-a-glance: what you need to do today vs what's deferred

| Now (today) | Deferred (when Rapid lands) |
|---|---|
| Paste affcid in `.env.local` | Paste `EXPEDIA_API_KEY` + `EXPEDIA_SHARED_SECRET` |
| Restart dev | Restart dev |
| Verify at `/admin/affiliate` | Verify the same page shows "Live Rapid" mode |
| Ship - every click earns | Ship - every listing is real + every click earns |

---

## Reference

- **Affiliate setup walkthrough:** [`docs/providers/expedia-affiliate.md`](providers/expedia-affiliate.md)
- **All providers + Rapid setup:** [`docs/providers.md`](providers.md)
- **Operator console:** [`/admin`](http://localhost:3000/admin) (open while dev is running)
- **Affiliate debug page:** [`/admin/affiliate`](http://localhost:3000/admin/affiliate) (one-glance health check)
