# Expedia Affiliate (Creator Platform)

How the affiliate side of the Expedia integration works, and how it's
different from the EPS Rapid API integration.

---

## TL;DR

- **Affiliate links** generate `expedia.com/Hotel-Search?…&affcid=…`
  URLs from intent (destination + dates + occupancy). **No partner
  API approval required.** Sign up for the Creator Platform; get an
  affcid; paste it into `.env.local`. Every CTA in the app earns
  commission immediately.
- **EPS Rapid** is a separate product for real-time hotel **inventory**
  (search, availability, rates). Requires a separate partner approval
  through Expedia Partner Solutions, takes weeks. Independent of
  affiliate links - they don't depend on each other.
- The two complement each other but the app monetizes from day one
  with just affiliate access. With Rapid keys later, the listings the
  user reads on our page show real availability before the click; the
  affiliate flow continues to handle the click + the booking.

---

## 1. How affiliate links work (URL pattern)

An Expedia affiliate link is a regular `expedia.com` URL with a
tracking parameter attached. There's no API. There's no auth header.
There's no signature. The user clicks → lands on Expedia → Expedia
sets a cookie tied to your `affcid` → if the user books within the
cookie window (typically 90 days), you earn commission.

Example URL the app generates:

```
https://www.expedia.com/Hotel-Search
  ?destination=Tuscany%2C+Italy
  &startDate=2026-09-01
  &endDate=2026-09-05
  &rooms=1
  &adults=2
  &siteid=1
  &affcid=YOUR_CID
  &label=stayscout-web
  &_src=stayscout
```

Where each parameter goes:

| Param | Purpose |
|---|---|
| `destination` | Free-text destination Expedia's resolver maps to a region/city. |
| `startDate` / `endDate` | ISO `YYYY-MM-DD` checkin/checkout. |
| `rooms` / `adults` / `children` | Occupancy. Children encoded as comma-separated ages. |
| `siteid` | Locale (1=US, 3=UK, 23=AU, etc.). Tied to your contract; usually 1. |
| `affcid` | **Your affiliate campaign id.** Required for commission to track. |
| `label` | Optional sub-channel tag - useful when one campaign sources from web + email + social. |
| `_src=stayscout` | App-level disambiguation tag for our own analytics. Not Expedia-tracked. |

---

## 2. Setup

### Apply

1. Sign up at the Expedia Group **Creator Platform** (or your local
   creator portal) - most builders go through:
   - https://www.expedia.com/affiliates/ for the consumer-affiliate path
   - https://www.partner-solutions.expediagroup.com/ for the
     full partner solutions program
2. Approval is typically faster than EPS Rapid (days, not weeks).
3. The dashboard surfaces your `affcid` (sometimes labeled "Campaign ID"
   or "Tracking ID"). Copy it.

### Configure in `.env.local`

```dotenv
# Required for commission to track. Without it, links still work;
# clicks just don't attribute to anyone (mock-safe behavior).
NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID=replace_with_your_affcid

# Optional sub-channel label. When you launch email or social
# distribution, give each surface a different label so you can see
# them separately in the Expedia dashboard.
NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL=stayscout-web

# Optional locale override. Default is www.expedia.com (US).
# NEXT_PUBLIC_EXPEDIA_AFFILIATE_BASE_URL=https://www.expedia.co.uk

# Optional siteid override. Default 1. Match the locale you chose.
# NEXT_PUBLIC_EXPEDIA_AFFILIATE_SITE_ID=3
```

Restart `pnpm dev`. Every CTA in the app starts attaching `affcid`.
Open `/admin` - the **Affiliate** card flips to `Expedia · Live`.

### Why `NEXT_PUBLIC_*`?

The affcid + label ship in every outbound URL - they aren't secret.
Next.js only bundles `NEXT_PUBLIC_*` env vars to the client; the
naming makes it explicit that the value is publicly visible. The
non-prefixed names (`EXPEDIA_AFFILIATE_CID`) are accepted as a
server-side fallback for ops setups that already use the shorter
form, but `NEXT_PUBLIC_*` is canonical.

---

## 3. How redirects + click tracking work

Every "View on Expedia" / "Check availability" CTA in the app routes
through `/r/[id]` instead of linking directly to expedia.com. The
flow:

1. The CTA renders as `<a href="/r/<encoded-id>" target="_blank">`.
2. The `id` is a base64url-encoded JSON payload carrying the outbound
   URL + the originating context (providerId, stayId, turnId,
   conversationId). Self-contained - no DB lookup needed.
3. The user clicks. Browser navigates to `/r/<id>`.
4. The route decodes + validates the payload (rejects anything not
   on the affiliate host allowlist - defense against a tampered id
   becoming an open-redirect).
5. Records an `AffiliateClick` row keyed on the current owner
   (cookie session for anon, userId for signed-in). Failures are
   logged but never block the redirect.
6. 302 to the decoded Expedia URL. The user lands on Expedia with
   `affcid` attached, first-party cookies set.

Operators see clicks at `/admin/clicks` with the originating
providerId, stayId, and turnId.

### Why a separate route from `/api/go`?

`/api/go` is the older redirect handler from Slice B4 - it takes the
URL as a query param, which is fine for inline use but makes the
URL long + brittle. `/r/[id]` has shorter URLs, self-contained
payload, and is the canonical entrypoint for new affiliate clicks.
`/api/go` stays in place for back-compat with anything already
linking to it.

---

## 4. How commissions are tracked

This is Expedia's side, not ours. Standard creator-platform mechanics:

1. User clicks a link with your `affcid`.
2. Expedia sets a cookie on `expedia.com` tying the session to
   your campaign. Cookie window is **typically 90 days** but varies
   by program.
3. If the user books any hotel during the window, the booking is
   attributed to your campaign.
4. Commission is paid out per Expedia's program terms - typically a
   percentage of the booking total, sometimes a flat fee per
   completed stay. Look up specifics in the Creator Platform
   dashboard for your contract.

What we control on our side:

- The `affcid` is correct (set in env).
- Every monetizable CTA passes through it.
- Click attribution (so we can see WHICH listing drove WHICH click).

What Expedia controls on their side:

- Cookie window length.
- Commission rate.
- Booking-to-commission delay (typically 30 days for refund window).
- Reports / payout schedule.

---

## 5. Affiliate vs Rapid API - the difference

| | Affiliate Link | EPS Rapid API |
|---|---|---|
| **What it provides** | Outbound URL with tracking | Real-time inventory (search, availability, rates) |
| **Approval time** | Days (creator platform) | Weeks (partner solutions) |
| **Auth** | None (CID in URL) | HMAC-SHA512 signature header per request |
| **Cost** | Free | Per-call rate limits + per-contract terms |
| **Independent?** | Yes - affiliate works without Rapid | No - Rapid mandatory affiliate program too |
| **In our app** | `<ExpediaCta>` builds URLs from intent | `ExpediaProvider.fetchStays` calls live |
| **Mock-safe?** | Yes (URL still resolves without CID) | Yes (provider absent without keys) |

The two **work together** when both are set:

- Rapid populates listings with real properties + photos + prices.
- Affiliate CTA on each listing builds a property-level deeplink (or
  falls back to destination-level search) carrying your `affcid`.
- User clicks → /r/[id] → expedia.com → Expedia attributes → you
  earn.

**You can ship monetization today with just affiliate access.** Rapid
is a real-inventory upgrade.

---

## 6. CTAs and disclosure

Every monetizable CTA carries:

- "View on Expedia →" or "Check availability on Expedia →"
- Followed by the disclosure footer:
  > Powered by Expedia · **Affiliate link** · Prices may change

The disclosure copy is FTC-aligned (US affiliate-disclosure rules)
and equivalents in EU/UK regulatory contexts. It's intentionally
visible - a tiny line at the bottom of every primary CTA.

The compact CTA on hero/alternative cards uses just "View on Expedia"
without disclosure copy because the listing-detail panel (where the
user has decided this is the listing they care about) carries the
full disclosure with the primary button.

---

## 7. What happens when CID is missing?

Mock-safe behavior:

- The URL builder still produces a valid Expedia.com search URL.
- The user clicks → lands on Expedia → can browse + book normally.
- No commission tracks (the click isn't attributed to anyone).

This is intentional. The CTA shouldn't disappear because env wasn't
set - that would make local development feel broken. Better: keep
the link working, lose only the monetization. The `/admin` Affiliate
card shows `Untracked` so operators see the gap.

---

## 8. Testing locally

```bash
# 1. Set CID in .env.local
echo 'NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID=YOUR_CID' >> .env.local

# 2. Restart
pnpm dev   # http://localhost:3000

# 3. Compose a search
# In the workspace, type "Tuscany, slow and walkable" + Save the trip
# Open the saved trip's detail panel → "Check availability on Expedia"
# Click it → /r/<id> → 302 → expedia.com with affcid attached

# 4. Verify in admin
# /admin → "Affiliate" card shows "Expedia · Live"
# /admin/clicks → fresh click row appears with providerId, stayId, turnId
```

To verify the affcid is reaching Expedia, hover the CTA and inspect
the URL Chrome shows in the bottom-left status bar - the `affcid=…`
should be visible. Or open DevTools → Network → click the CTA →
inspect the 302's Location header.

---

## 9. Adding more affiliate networks

The pattern is the same: add a `<NetworkCta>` component that builds
the network's URL pattern, route through `/r/[id]` (no changes
needed), document setup here.

Networks worth adding when contracts land:

- **Booking.com Affiliate Partner Network** - already wired via the
  existing `BookingComProvider` + `bookingLink.url` (uses
  affiliate-deeplinks). The `<ExpediaCta>` resolver falls back to
  destination Expedia search even for Booking.com listings, so users
  always have a Expedia option even if Booking.com declined.
- **Hotels.com** - Expedia Group brand, same affcid often works on
  hotels.com URLs. Consider a sibling `<HotelsCta>` that builds the
  parallel pattern.
- **Vrbo** - already wired via `VrboProvider` for vacation rentals;
  the redirect URL is built in the Vrbo mapper.
- **Skyscanner** for flights, **Viator** for activities - both have
  affiliate creator programs. Same redirect pattern.

---

## 10. FAQ

**Q: Can I use multiple Expedia campaigns (one for web, one for
email)?**
A: Yes - set `NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL` to a
per-deployment value. The label flows through every URL and lets
you separate channels in the Expedia reports.

**Q: Does the user need to be signed in for clicks to attribute?**
A: No. Affiliate attribution is by Expedia's first-party cookie, not
by us. Anonymous sessions on our side still earn commission for you.

**Q: What hosts are on the redirect allowlist?**
A: See `src/lib/affiliate/allowlist.ts`. Currently:
`expedia.com`, `vrbo.com`, `hotels.com`, `booking.com`, `airbnb.com`,
`hotelbeds.com`, `skyscanner.com`, `viator.com`,
`getyourguide.com`, plus `example.com` for the mock-italy redirect.
Adding a new affiliate network = adding its host here.

**Q: Why does the AI Preview chip stay on synthesized listings even
when the CTA points to a real Expedia search?**
A: The listing the user is reading on our page is AI-generated -
that's an honest signal. The fact that we built a usable Expedia
search URL from the same intent is a separate thing; it links to
*real* Expedia, but the *listing copy* on our side is still
synthesized. The two chips would conflict if we tried to paper over
the synthesized origin.

**Q: Will the link still earn if the user opens it in a different
browser?**
A: No - Expedia attribution requires the cookie set at click time.
Cross-device flows are an Expedia program problem, not ours.

**Q: How do I see which prompts/turns drove clicks?**
A: `/admin/clicks` lists every redirect with the originating turnId.
Click the turnId to drill into `/admin/turns/[turnId]` and see the
full agent trace that led to the proposal.
