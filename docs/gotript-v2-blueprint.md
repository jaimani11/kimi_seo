# GoTript V2 — one-site rebuild blueprint

**Final decision (2026-08-01):** end the four-site strategy. **gotript.com is the only
active, indexable travel site.** gobookt/numiworks/stayviaowner are frozen now and will be
retired to redirect-only (301 to genuine equivalents / 410 otherwise), domains kept registered.
This blueprint is the disciplined build plan. **Nothing here deploys without explicit
"merge this PR".** Backup taken: tag/branch `pre-consolidation-2026-08-01` @ `aeeac8e` (both remotes + bundle).

## Why (calibrated)
No advisor proved a single Google cause, but the portfolio is a shared-data content network:
climate/editorial bodies are 70–82% identical across brands, FAQ JSON-LD is byte-identical,
and 218 impressions across ~46,600 pages = 0.004/page. We stop gambling on four properties and
build **one** genuinely useful site. **100k impressions/day is an ambition earned through
quality + demand + authority — not a date, and not achievable by URL volume.**

## V2 route hierarchy (NOT the old 35-family flat grid under new folders)
```
/                                  home
/destinations/{city}               destination hub (planning overview)
/stays/{city}                      stays hub
/stays/{city}/hotels               Booking.com
/stays/{city}/vacation-rentals     Vrbo
/things-to-do/{city}               experiences (provider decided below)
/itineraries/{city}                itinerary hub (start: 1 meaningful/city)
/guides/{city}/{qualified-topic}   with-kids · budget · first-time · best-time
/tools/{tool}                      trip-cost, crowd calendar, hotel-vs-rental, etc.
```
One canonical owner per intent. No monthly-weather grid, no city×persona×occasion multiplication,
no six-adjective hotel permutations.

## Initial launch size (explicit)
**~50 priority destinations, ~300–500 high-quality indexable pages.** A page exists ONLY if it
passes eligibility — a city appearing in a shared data file is NOT sufficient.

### Eligibility (per page, human-reviewed before indexation)
meaningful search demand · real affiliate inventory for that section · destination-specific value ·
useful decision support · enough original/curated info · no empty cards/placeholders · a clear
role in the hierarchy · not a near-duplicate of a sibling page.

## Provider ownership (verified live; decide things-to-do before building)
- `/stays/{city}/hotels` → **Booking.com** (confirm CJ promotional-property approval covers gotript;
  generate gotript-specific tracking — do NOT assume gobookt links transfer).
- `/stays/{city}/vacation-rentals` → **Vrbo** (confirm gotript-approved property/tracking).
- `/things-to-do/{city}` → **DECISION REQUIRED**: Viator+GYG (numiworks' live stack) vs Expedia
  Attractions (gotript's current). Pick ONE primary + defined fallback; no duplicate cards.

## Content & quality rules
Do NOT use the shared SEO-prose generators as V2's foundation. Shared utils allowed only for
formatting/dates/APIs/UI/inventory. Every indexable page must have: distinct purpose · unique
title + H1 · destination-specific content · NO portfolio-scale repeated FAQ block · no unsupported
claims · no thin affiliate shell · no empty inventory · explicit canonical · sitemap entry · a
clear internal-link path.

### Automated pre-index checks (build gate)
duplicate titles/H1s · body text-similarity threshold · repeated FAQ schema · thin word-count ·
empty provider results · sitemap URLs returning redirect/noindex/error · internal links to retired URLs.

## Internal linking
Remove the universal "link to every permutation" rail. Hierarchy only:
`home → regional hub → destination hub → stays / things-to-do / itinerary / selected guides`.
Each page links to a SMALL number of contextually relevant pages.

## Retiring the 3 sites (after V2 equivalents exist; sequential)
Order: **numiworks → gobookt → stayviaowner (last).** Per old URL: **A)** 301 to a genuine
gotript equivalent, **B)** 410 if it shouldn't survive, **C)** manual review. No blanket homepage
redirects, no redirect chains, no independent indexable content left. Redirect-only Vercel project
per domain (test on preview → confirm gotript destinations live → move domains → verify → archive
old app, don't delete). GSC **Change of Address** per domain, one at a time. Keep domains registered.

## Staged growth
1. Launch 300–500 excellent pages; regain crawl/index; earn top-30 rankings + real clicks.
2. Expand only proven page types, in batches of 20–50, measuring before scaling.
3. Authority: original research/tools + backlinks, all pointed at gotript.
4. Scale to thousands only after the small corpus performs.
Defensible link-worthy assets: trip-cost data, hotel-vs-rental tool, crowd/seasonality calendars,
neighborhood-fit scoring, airport-to-city comparisons, saved trips, reviews/photos.

## Merge control
No production PR merges without explicit "merge this PR." Every PR provides: files changed ·
URL/sitemap impact · build + test results · representative preview URLs · robots/canonical/status ·
rollback · production SHA before deploy. V2 builds on a **preview project blocked from indexing**
(`X-Robots-Tag: noindex` + robots.txt disallow on the preview host) until cutover.

## Proposed FIRST milestone (for approval before building content)
1. Confirm the **things-to-do provider** decision.
2. Confirm the **~50 destination starter list** (I'll propose it from: has-destination-guide ∩
   real affiliate inventory ∩ search-demand signal).
3. Build a **pilot (5 cities)** on `gotript-v2-rebuild` / preview: the route skeleton +
   destination-hub + stays + things-to-do + one itinerary + 2 guides per city, with the
   quality-check harness — noindexed preview. Review the pilot before scaling to 50.
