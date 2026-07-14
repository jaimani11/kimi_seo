# Accommodation-First Repositioning Plan — GoTript & Numiworks

**Date:** 2026-07-13
**Status:** **PLAN ONLY — no code changes. For review/approval before any implementation.**
**Scope:** GoTript + Numiworks homepages & product hierarchy. StayViaOwner and GoBookt are **confirmed unchanged** (see §7).

> Goal (per the brief): make **whole-home / vacation-rental discovery a repeated, site-wide theme** — hero, nav, homepage sections, destination pages, internal links — not merely "a bigger VRBO button." Do not clone reference sites; adopt their *accommodation-first focus*.

---

## 1. Portfolio brand roles (target)

| Site | Role | Lead product | Providers |
|---|---|---|---|
| **GoTript** | Broad travel platform **led by stays** | Vacation rentals + hotels | Expedia Group (Expedia + **VRBO** via Rapid), Hotels.com, GetYourGuide |
| **Numiworks** | Curated, **AI-assisted whole-home** inspiration | Whole homes / VRBO | VRBO (Expedia Group) primary; Viator/GYG secondary |
| **StayViaOwner** | Dedicated **vacation-rental** brand (unchanged) | Villas/cabins/cottages | VRBO/Expedia |
| **GoBookt** | **Booking.com-only** accommodation (unchanged; no VRBO) | Hotels + Booking.com stays | Booking.com (CJ) |

---

## 2. Current-state audit (what exists today)

### 2a. GoTript
- **Hero:** `MultiCategoryHero` — 5 equal tabs (Stays / Flights / Things to do / Cars / **Cruises**). Default headline: *"Find hotels, vacation rentals, flights & things to do worldwide"* (**hotels-first**). Hands off to Expedia via `/api/go/expedia`.
- **Nav:** Stays · Vacation rentals · Flights · **Packages** · Things to do · Cars · **Cruises** · Destinations · About · Contact.
- **Homepage sections:** SiteHeader → MultiCategoryHero → StatsBand → AgenticHero → RecentlyViewedRail → PopularDestinationsGrid → HowGotriptWorks → SeoLinkFooter → SiteFooter. **No VRBO/whole-home section anywhere on the home.**
- **VRBO wiring (already built):** full VRBO Rapid provider (`providers/vrbo/*`, `VRBO_API_KEY`+`VRBO_SHARED_SECRET`), a `/vacation-rentals` page ("VRBO's 2M+ listings…"), **11 accommodation-type routes** (`/villas /cabins /cottages /beach-houses /beach-villas /family-villas /luxury-villas /pet-friendly-villas /private-pool-villas /stays /vacation-rentals`), SearchOpportunityBoard with a `vrbo` flavor.
- **Affiliate routing:** stays CTAs → `active-stay-provider` → Expedia/VRBO tracked via Partnerize (camref) + Rapid; the accommodation-type pages funnel to tracked stay inventory. **Tracked. ✓**
- **Title/desc:** already *"Vacation Rentals, Hotels & Things to Do Worldwide"* (good) but claims *"real-time prices and availability"* (overclaim — trim).
- **Gap:** the *homepage* gives VR no visibility; cruises/packages still primary.

### 2b. Numiworks
- **Hero:** `SearchFormHero` — H1 *"Plan your trip with AI — tours, hotels & vacation rentals, booked in one place"* (**tours/AI-first**).
- **Nav:** Search · Destinations · Plan · About · Contact (**no accommodation categories**).
- **Homepage sections:** SiteHeader → SearchFormHero → **VrboHomepageStrip** → StatsBand → AgenticHero → RecentlyViewedRail → BrowseByType → PopularDestinationsGrid → **LiveExperienceRails (4 Viator rails)** → HowNumiworksWorks → footer.
- **VRBO surface:** one 2-card `VrboHomepageStrip`. The VRBO card links to a **raw shortlink `https://vrbo.com/affiliate/zVJTNin`** (`NEXT_PUBLIC_VRBO_SHORTLINK`) — VRBO-tracked, **but bypasses the app `/r/[id]` resolver + click-logging and is not destination-specific.** ⚠️
- **Viator:** prominent (4 live rails + "Live Viator inventory" copy).
- **Routes:** **no** accommodation-type routes (unlike GoTript/GoBookt).
- **Gap:** VR is one strip; Viator dominates; no whole-home nav/taxonomy.

---

## 3. Proposed hierarchy (target)

**GoTript** (broad, stays-led):
1. Vacation rentals & whole homes → 2. Hotels & resorts → 3. Villas/cabins/cottages/apartments/beach homes → 4. Destination & neighborhood guidance → 5. Activities & itineraries → 6. Cars & flights (secondary tools) → 7. **Cruises + Packages removed from primary.**

**Numiworks** (curated whole-home + AI):
1. Whole-home / vacation-rental discovery → 2. Visual destination inspiration → 3. AI-assisted planning → 4. Family & group stays → 5. Villas/cabins/cottages/beach houses → 6. Activities (supporting) → 7. Hotels (secondary).

---

## 4. Homepage section order — before → after (text wireframes)

### GoTript
```
BEFORE                              AFTER (proposed)
──────────────────────────         ────────────────────────────────────────
SiteHeader (7 cat + cruises)       SiteHeader (stays-led, no cruises/packages)
MultiCategoryHero (5 tabs)         StayHero  (Stays/Vacation-rentals default,
StatsBand                            2 primary tabs; flights/cars/activities
AgenticHero                          demoted to a "Plan your trip" row)
RecentlyViewedRail                 Vrbo/Whole-home RAIL  ← "More space. More
PopularDestinationsGrid              privacy. A place of your own." (6 cards)
HowGotriptWorks                    StatsBand
SeoLinkFooter                      PropertyTypeGrid (villas/cabins/cottages/
SiteFooter                           beach houses/pools/pet-friendly/family/
                                     apartments)
                                   PopularVrboDestinations
                                   AgenticHero (planning, secondary)
                                   HotelsAndResorts (secondary)
                                   RecentlyViewedRail
                                   PopularDestinationsGrid
                                   WhereToStayGuides
                                   HowGotriptWorks → SeoLinkFooter → SiteFooter
```

### Numiworks
```
BEFORE                              AFTER (proposed)
──────────────────────────         ────────────────────────────────────────
SiteHeader (Search/Dest/Plan)      SiteHeader (+ Vacation homes / Villas /
SearchFormHero (AI/tours-first)      Cabins / Destinations / Plan with AI)
VrboHomepageStrip (1 strip →       WholeHomeHero  "Discover whole homes worth
  raw shortlink)                     traveling for" · CTA "Explore vacation
StatsBand                            homes" + "Plan with AI"
AgenticHero                        WholeHomeCollections (villas/cabins/beach/
RecentlyViewedRail                   groups/family/pet-friendly/pools/
BrowseByType                         work-from-anywhere/romantic weekend)
PopularDestinationsGrid            PopularVrboDestinations (image-led)
LiveExperienceRails (4 Viator)     StatsBand
HowNumiworksWorks                  AgenticHero ("AI-selected stays by travel
SeoLinkFooter → SiteFooter           style" — plan around the home)
                                   PinterestDestinations (visual)
                                   BrowseByType
                                   LiveExperienceRails (Viator — MOVED DOWN,
                                     de-emphasized, "activities" framing)
                                   HowNumiworksWorks → SeoLinkFooter → Footer
```

---

## 5. Hero copy — before → after

**GoTript**
- Headline: ~~"Find hotels, vacation rentals, flights & things to do worldwide"~~ → **"Find vacation homes, hotels, villas and unique stays worldwide."**
- Subhead: **"Explore whole-home rentals, cabins, beach houses, apartments, resorts and hotels — then continue securely to trusted travel partners."**
- Primary CTA: **"Search stays"** (default tab = Stays / Vacation rentals).
- Secondary row: "Plan your trip" → Flights · Cars · Activities. Cruises/Packages removed.

**Numiworks**
- Headline: ~~"Plan your trip with AI — tours, hotels & vacation rentals"~~ → **"Discover whole homes worth traveling for."** (alt: "Find a beautiful place to stay — and build the trip around it.")
- Subhead: **"Explore villas, cabins, cottages, beach homes and family-friendly vacation rentals, then use AI to plan the rest of your trip."**
- Primary CTA: **"Explore vacation homes"** · Secondary CTA: **"Plan with AI."**

---

## 6. Navigation changes — before → after

| Site | Before | After |
|---|---|---|
| **GoTript** | Stays · Vacation rentals · Flights · **Packages** · Things to do · Cars · **Cruises** · Destinations | **Vacation rentals · Stays · Villas · Cabins · Destinations** · Things to do · (Flights/Cars in a "Plan" submenu). **Remove Cruises + Packages.** |
| **Numiworks** | Search · Destinations · Plan | **Vacation homes · Villas · Cabins · Destinations · Plan with AI** |

---

## 7. StayViaOwner & GoBookt (confirm unchanged)
- **StayViaOwner:** already the dedicated vacation-rental brand — **no changes**; it stays the most aggressively VR-focused site (RentByOwner-style).
- **GoBookt:** **Booking.com-only** — **do not add VRBO.** Already repositioned stays-first this session (`ea37f30`/`3f04a98`).

---

## 8. Affiliate-routing plan (every VR CTA must be tracked — no raw untracked vrbo.com links)

| Path | Today | Proposed |
|---|---|---|
| **GoTript** VR search + accommodation-type pages | `active-stay-provider` → Expedia/VRBO via Partnerize camref + Rapid — **tracked ✓** | Reuse verbatim. New home rail cards build **tracked destination/category search URLs** through the same resolver (via `/r/[id]` or `/api/go/expedia`). No raw `vrbo.com`. |
| **Numiworks** VRBO home strip | **raw `vrbo.com/affiliate/zVJTNin` shortlink** — VRBO-tracked but not app-logged, not destination-specific ⚠️ | Route the new whole-home cards through a **tracked resolver** (VRBO/Expedia Group affiliate resolver + `/r/[id]` click-logging). Keep the shortlink only as the generic "browse all VRBO" fallback. |
| **All new cards** (both sites) | — | `rel="sponsored nofollow noopener noreferrer"`, open in new tab, provider+site logged, fail-safe if unconfigured — same contract as the gobookt CJ hardening. |

**No unsupported claims** on any new surface: no live-inventory / price / savings / availability / ratings / free-cancellation assertions unless provider-permitted. (Trim GoTript's "real-time prices and availability" from its meta.)

---

## 9. Pages / routes affected

**GoTript** — *modify* (no new routes needed; taxonomy already exists):
- `app/page.tsx` (section order), `features/site/multi-category-hero.tsx` → new stays-led hero, `features/site/site-header.tsx` (nav), `+ new` home sections (VRBO rail, property-type grid, popular-VRBO, where-to-stay). Meta trim.

**Numiworks** — *modify + add*:
- `app/page.tsx`, `features/site/search-form-hero.tsx` → whole-home hero, `features/site/site-header.tsx` (nav), `features/site/vrbo-homepage-strip.tsx` → promote to full collections + fix affiliate routing, de-emphasize `live-experience-rails.tsx`.
- **New accommodation-type routes** to match GoTript/StayViaOwner (`/vacation-rentals /villas /cabins /cottages /beach-houses /family-rentals /group-stays /pet-friendly /homes-with-pools /weekend-rentals`) + `destinations/[location]/vacation-rentals|villas|cabins`. **Only publish pages with real, distinct guidance — no thin keyword-swap pages, valid canonicals, real internal links.**

---

## 10. SEO taxonomy (build deliberately, not mass-thin)
`/vacation-rentals · /villas · /cabins · /cottages · /beach-homes · /family-rentals · /group-stays · /pet-friendly · /homes-with-pools · /weekend-rentals` and `/destinations/[location]/vacation-rentals|villas|cabins`.
**Rules:** meaningful original guidance per page, distinct search intent, real internal linking, useful property-type advice, valid self-canonicals, **no duplicate city-name swapping.** (This is also the exact discipline that just bit GoBookt's home — see the caching/indexing work.)

---

## 11. What I need approved before writing any code
1. The **new hierarchy + section order** (§3–4) for each site.
2. The **hero copy** (§5).
3. The **nav changes** (§6).
4. The **affiliate-routing** approach (§8) — especially routing Numiworks VRBO through the resolver vs. keeping the shortlink.
5. Scope of **new Numiworks routes** (§9–10) — how many property-type pages to launch in phase 1 (I recommend starting with `/vacation-rentals` + 4 top types, each with real content, not all 10 at once).

**Suggested build order once approved:** GoTript hero+nav+VRBO rail → GoTript property sections → Numiworks hero+nav+collections + affiliate-routing fix → Numiworks new routes (phased) → build all four apps → verify mobile+desktop → report any remaining untracked/low-visibility VR CTAs.
