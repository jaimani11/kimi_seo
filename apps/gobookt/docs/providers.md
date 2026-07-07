# Providers - setup walkthrough

Real-time inventory comes from partner APIs. Each one self-registers
when its env vars are present; otherwise the registry skips it and
the keyless-dev floor (curated Italy + LLM-synthesized) handles the
request. Adding keys is purely additive - no code changes needed.

This doc walks through partner-application + env wiring for the three
real providers we ship adapters for, plus what to expect when you
can't get keys yet.

---

## At a glance

| Provider | What it serves | Keys required | Self-registers when… |
|---|---|---|---|
| Expedia (EPS Rapid) | Hotels + apart-hotels, real-time availability + rates | `EXPEDIA_API_KEY` + `EXPEDIA_SHARED_SECRET` | both set |
| Vrbo (EPS Rapid + category filter) | Vacation rentals - cottages, villas, cabins, private homes | `VRBO_API_KEY` + `VRBO_SHARED_SECRET`, optional `VRBO_AFFILIATE_ID` | both required keys set |
| Booking.com Affiliate Partner Network | Affiliate-deeplink redirect to Booking.com property pages | `BOOKING_COM_AFFILIATE_ID` + `BOOKING_COM_API_KEY` | both set |

If none are set, the app still works end-to-end via the curated +
synthesized providers. Listings are clearly marked `CURATED · ITALY`
or `AI PREVIEW` so users always know where data came from.

---

## Provider provenance - what users see

Every stay card shows a provenance chip in the corner. Vocabulary:

| Chip | Meaning |
|---|---|
| `EXPEDIA · LIVE` | Real Expedia EPS Rapid availability + rates |
| `VRBO · LIVE` | Real Vrbo (Rapid vacation-rental categories) |
| `BOOKING.COM · LIVE` | Affiliate deeplink to a real Booking.com property |
| `CURATED · ITALY` | Hand-picked from our seven Italian regions |
| `AI PREVIEW` | LLM-synthesized stay (when no real provider matches the destination) |

The `AI PREVIEW` chip uses a distinct warning-tone border so users
never confuse a model-generated stay with a live partner listing.
Honesty is the load-bearing thing.

---

## Expedia - EPS Rapid

### What it is

Expedia Partner Solutions runs **Rapid**, a B2B API surface that
returns hotel content, availability, and rates. The Shopping endpoint
we hit (`/v3/properties/availability`) returns properties + rates for
a date window; redirect-based booking goes through your affiliate URL.

The integration adapter shape lives at `src/providers/expedia/`. When
keys land, the existing code makes real calls - no rewrites needed.

### Apply

1. Visit https://www.partner-solutions.expediagroup.com/.
2. Apply for the **Affiliate** (or **Affiliate Lite**) tier. Affiliate
   Lite supports Shop + Availability without the booking endpoints -
   the right tier for our redirect flow.
3. Approval typically takes 2–6 weeks. Sandbox creds arrive first;
   production creds after a compliance review.
4. From the Rapid dashboard, capture **API Key** and **Shared Secret**.

### Configure

```dotenv
EXPEDIA_API_KEY=replace_with_eps_api_key
EXPEDIA_SHARED_SECRET=replace_with_eps_shared_secret
```

Restart `pnpm dev`. The provider self-registers; queries hitting
non-Italian destinations (or Italy when Expedia returns more matches
than the curated set) start showing `EXPEDIA · LIVE` chips.

### Auth

Rapid uses **HMAC-SHA512** over `apiKey + sharedSecret + epochSeconds`,
sent as the `Authorization: EAN APIKey=…,Signature=…,timestamp=…`
header. Built in `src/providers/_shared/rapid-signature.ts` and
shared with Vrbo. Rapid rejects requests whose timestamp drifts more
than ±5 minutes - we mint per-request, so long-running calls don't
expire mid-flight.

Plus two per-request headers Rapid requires for affiliate attribution:

- `Customer-Ip` - the inbound user's IP. Production should set from
  `CF-Connecting-IP` or `X-Forwarded-For`. Defaults to `127.0.0.1`
  in dev.
- `Customer-Session-Id` - opaque per-user id. We pass our anon-session
  UUID; production can also use Clerk userId.

### Rate limits + sandbox

- Sandbox: ~10 req/sec, ~30K/day.
- Production: per-contract; typical Affiliate Lite is ~50 req/sec,
  capped at 1M/day.
- Cache TTL: the `BaseAffiliateProvider` caches search results for
  30 minutes per canonical query. Tune via `cacheTtlMs` in
  `src/providers/expedia/index.ts`.

### Reference

- Property Availability: https://developers.expediagroup.com/docs/rapid/lodging/shop/property-availability
- Property Catalog: https://developers.expediagroup.com/docs/rapid/lodging/content/property-catalog
- Auth: https://developers.expediagroup.com/docs/rapid/getting-started/api-overview

---

## Vrbo - EPS Rapid with vacation-rental filter

### What it is

Vrbo became Expedia Group's vacation-rental brand after the 2015
acquisition. Their inventory is served through the same Rapid surface
as Expedia - we just filter by Rapid's vacation-rental category ids
(8 cottage, 16 vacation rental, 19 private vacation home, 22 cabin,
35 guest house, 37 villa).

The adapter at `src/providers/vrbo/` reuses the Expedia client +
signature module, then runs results through a Vrbo-specific mapper
that namespaces ids as `vrbo:<property_id>` and points the affiliate
URL at `vrbo.com`.

### Two key patterns

1. **Vrbo-only contract.** You have keys for Vrbo specifically (not
   for Expedia hotels). Apply through Expedia Partner Solutions and
   request the Vrbo product line. You get a separate api-key /
   shared-secret pair.

   ```dotenv
   VRBO_API_KEY=replace_with_vrbo_api_key
   VRBO_SHARED_SECRET=replace_with_vrbo_shared_secret
   ```

2. **Combined Expedia Group contract.** Same Rapid creds work for
   both products; you just call with the right category filter. Use
   the same value for both env pairs:

   ```dotenv
   EXPEDIA_API_KEY=$RAPID_KEY
   EXPEDIA_SHARED_SECRET=$RAPID_SECRET
   VRBO_API_KEY=$RAPID_KEY
   VRBO_SHARED_SECRET=$RAPID_SECRET
   ```

   Setting both pairs registers both providers. They run in parallel
   via `searchWithFanout` and the proposal builder ranks across the
   union.

### Optional: separate affiliate id

```dotenv
VRBO_AFFILIATE_ID=optional_vrbo_affiliate_id
```

If unset, the affiliate URL falls back to the api-key (matches the
Expedia redirect pattern).

### Why a category filter?

Without `category_ids`, the Rapid `/properties/availability` endpoint
returns hotels too. The Vrbo product is specifically vacation
rentals; the filter ensures the chip + the listing match.

### Reference

- Rapid Property Categories: https://developers.expediagroup.com/docs/rapid/lodging/content/property-data-reference

---

## Booking.com - Affiliate Partner Network

### What it is

Booking.com's affiliate program is **deeplink-based**, not search-API-
based for unapproved partners. The adapter we ship resolves a stay
search through our existing in-process providers, then constructs an
affiliate-attributed deeplink so the click lands on Booking.com with
your aid attached.

There **is** a Booking.com Demand API for full search, but it's
restricted to vetted enterprise partners (typically distribution
partners, not affiliates). For most builders, the affiliate program
is the right starting point.

### Apply

1. Visit https://partner.booking.com/.
2. Sign up as an Affiliate Partner.
3. Approval is typically faster than EPS Rapid (days, not weeks).
4. From the dashboard, capture your **Affiliate ID** (sometimes
   labeled "aid") and any API key the program issues for tracking.

### Configure

```dotenv
BOOKING_COM_AFFILIATE_ID=replace_with_aid
BOOKING_COM_API_KEY=replace_with_api_key
```

### What changes when configured

Affiliate-deeplinks for stays in the registry get the
`BOOKING.COM · LIVE` chip, and clicks through `/api/go` (the
affiliate redirect router from Slice B4) attribute properly with
your aid + label.

### Reference

- Affiliate Partner Network: https://www.booking.com/affiliate-program/
- Deeplink URL pattern: see `src/providers/booking-com/mapper.ts`

---

## Affiliate redirect - `/api/go`

All three live providers route bookings through our redirect:

```
/api/go?s=<stayId>&p=<providerId>&u=<encoded_affiliate_url>&t=<turnId>
```

The route:

1. Validates `u` against the per-provider host allowlist
   (`src/lib/affiliate/allowlist.ts`) - closes the open-redirect
   attack surface that would otherwise let StayScout's domain be
   used for phishing.
2. Records an `AffiliateClick` row keyed on the current owner
   (cookie session for anon, userId for signed-in).
3. 302s to `u`. The user lands on the partner site with first-party
   cookies set on the cross-origin hop, which is what affiliate
   networks need for tracking.

Click failures don't block the redirect - booking flow is sacred.
Failures are logged + the user proceeds.

---

## What if you can't get keys yet?

The platform was designed to work end-to-end without partner
approval. Two providers are always present:

### MockItalyProvider (`mock-italy`)

Hand-curated dataset for the seven Italian regions: Tuscany, Umbria,
Amalfi, Rome, Venice, Lake Como, Cinque Terre. Real photography,
hand-tuned descriptions, deterministic ranking. Tagged
`CURATED · ITALY`.

### LLMSynthesizedProvider (`llm-synthesized`)

When the user asks about a destination outside the curated set
(Tokyo, Patagonia, Lisbon, etc.), this provider asks Claude for 4
plausible stays and renders them with photos hashed from a
per-category Unsplash pool (5–6 photos per category, deterministic
selection by stay slug - different stays in the same batch get
different photos). Tagged `AI PREVIEW`.

The synthesized stays look beautiful but are **not real listings**.
The chip + the warning-tone styling make this explicit. Booking
links route to a placeholder; users can't book a synthesized stay.

This is the right behavior for a product still waiting on partner
approval - the demo is honest. The moment Expedia/Vrbo/Booking.com
keys land, the same destinations start surfacing real partner
results, and the chip flips from `AI PREVIEW` to `EXPEDIA · LIVE`.

---

## Adding a new provider

The pattern is the same every time. Reference: `src/providers/expedia/`
and `src/providers/vrbo/` (the latter shows how to specialize a
sibling provider on top of an existing client).

1. **`types.ts`** - Zod schema for the partner's response shape.
   Validate only fields you actually map; extras strip on parse.
2. **`client.ts`** - HTTP function that takes
   `(query, creds, signal, opts?)` and returns the validated
   response (or `null` on transport failure).
3. **`mapper.ts`** - Convert partner records → our `Stay` shape.
   Namespace the id as `<providerId>:<nativeId>`. Set `providerId`
   so the provenance chip resolves. Build the affiliate redirect URL
   here.
4. **`index.ts`** - `class FooProvider extends BaseAffiliateProvider`,
   `static fromEnv()` returning null when keys missing, override
   `fetchStays` + `buildBadges`.
5. Register in `src/providers/index.ts` (`buildProviderRegistry`).
6. Add env-var placeholders to `.env.example`.
7. Add this file's "At a glance" row + a section.
8. Tests: mapper round-trips a sample partner record into `StaySchema`;
   self-registration returns null without keys.

The `BaseAffiliateProvider` handles caching, freshness metadata,
circuit-breaker, error wrapping. Subclasses are tiny.

---

## Verifying a partner integration locally

When keys arrive, smoke-test before relying on them:

```bash
# 1. Set keys in .env.local
echo 'EXPEDIA_API_KEY=…' >> .env.local
echo 'EXPEDIA_SHARED_SECRET=…' >> .env.local

# 2. Restart dev
pnpm dev

# 3. Compose a non-Italy query
curl -sN -m 30 -H "Content-Type: application/json" \
  -d '{"turnId":"t_smoke","type":"compose","input":{"rawInput":"London, four nights, walkable"},"clientCapabilities":{"supportsAdaptationDelta":true,"supportsMoodSnapshot":true,"supportsMemoryHint":true}}' \
  http://localhost:3000/api/concierge \
  | jq -r 'select(.kind=="proposal.ready") | .proposal.hero.providerId'
# Expected: "expedia" - chip shows EXPEDIA · LIVE in the UI.
```

If the call fails, check `/tmp/stayscout-dev.log` for the
`[expedia/rapid]` warning lines (signature failures + Zod parse
issues are logged with the first 3 issues).
