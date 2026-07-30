# Portfolio family inventory + soft-consolidation plan (4 brands)

**Generated:** 2026-07-30 from the **live production sitemaps** of all four domains, plus the git history for the July expansion. This is the data-driven baseline requested to replace intuition-based pruning.

## Honesty / calibration notes (adopted from the cross-review)

- **Not "technically clean."** The correct statement: *no evidence of a current site-wide robots, canonical, or mass-noindex failure on the pages tested live as Googlebot.* Page-family and historical-deployment defects still require validation (see §6).
- **Differentiation & the Discovered bucket.** Differentiation cannot *directly* help URLs Google has not crawled ("Discovered – currently not indexed"). It *can* indirectly influence future crawl prioritization if sampled pages and overall corpus quality improve.
- **"Discovered – not indexed" has multiple causes**, not only authority + corpus size: internal-link depth, orphan pages, sitemap stability, response consistency, route churn, crawl accessibility. Authority and corpus size are the *major* factors, not the only ones.
- **GSC bucket counts are user-provided snapshots** (property + screenshot date should be recorded), not independently verifiable totals. gotript snapshot (Domain property `sc-domain:gotript.com`): Indexed 3,830 · Discovered-not-indexed 9,476 · Crawled-not-indexed 4,738 · Duplicate(diff canonical) 1.
- **Prune by measurement, not URL count.** Every "cut" recommendation below is **provisional** and must be confirmed with per-family GSC impressions before execution.
- **Manual action:** user reported **no manual action** in gotript → Security & Manual Actions. Treated as checked (re-confirm the property matches).

---

## 1. Forensic: `2da18a0` is the **highest-priority causal candidate** (not a proven sole cause)

```
commit 2da18a0  —  2026-07-07 22:24 CST
"SEO expansion: 4 climate-powered page types, ~2,966 new URLs per site"
```

**What is PROVEN (from git + live):**
- Added the **841-line `climate-seo-pages.tsx` to ALL FOUR apps** (identical insertion count) + a shared `packages/seo-data/climate-insights.ts` dataset → **identical component implementation + shared source data + identical route inventory** across four domains.
- Added exactly **four route families** (`route-parser-viator.ts` diff): `best-time`, `weather-month`, `where-to-stay`, `where-to-go-month`, each gated on `findClimate(city.slug)`.
- **Measured URL delta validates the commit message exactly** (not just its estimate): `{city}-weather-in-{month}` 2,580 (215 climate-cities × 12 months) + `best-time-to-visit-{city}` 215 + `where-to-go-in-{month}` 12 + `where-to-stay-in-{city}` 159 = **2,966 per site**.

**What is NOT yet proven:**
- **Identical *rendered* output.** Identical component code + shared data + identical routes is strong evidence of large-scale repetitive output, but does not itself prove every rendered page was byte-identical (props/labels/section config/metadata/internal links can differ). *Proof requires a before/after rendered-HTML diff for the same cities/page-types — not yet done.*
- **Sole causation.** The Jul-7 launch precedes the Jul-11 discovery spike and Jul-18 decline, but the timeline supports several readings (the new URLs *triggered* the discovery burst; Google later reduced exposure after sampling; other Jul 12–15 changes contributed; or the expansion merely *exposed* a pre-existing authority/quality ceiling). Call it the **strongest single candidate**, not the smoking gun. The spike is consistent with a new-site **discovery surge that normalized** — the "probation failed on 0.3% CTR" mechanism remains unproven.

**Related but SEPARATE:** the seasonal families `{spring,summer,fall,winter}-in-{city}` (~900 URLs each on gotript + numiworks) were added by a *different* commit (`b63f05c`, "parser collapse"), and likely overlap heavily with `best-time`/`weather-month`/`where-to-go`. So the **climate-duplication surface is larger than 2da18a0's four families** — the seasonal grid is among the clearest prune-review candidates if GSC shows no performance.

The climate family is now largely single-owner: gotript keeps `{city}-weather-in-{month}` (2,580) indexed; the other three noindex + drop it from their sitemaps.

---

## 2. Portfolio by intent category (live sitemap counts)

| Category | gotript | gobookt | numiworks | stayviaowner | TOTAL |
|---|--:|--:|--:|--:|--:|
| Core (destinations/home) | 165 | 165 | 165 | 165 | 660 |
| Climate/season | 3,707 | 0 | 900 | 0 | 4,607 |
| Accommodation-intent (hotels/apts/cars/flights/rentals) | 4,116 | 6,125 | 949 | 5,880 | 17,070 |
| Experiences/attractions | 2,025 | 900 | 3,234 | 0 | 6,159 |
| Occasion/celebration | 3,825 | 2,025 | 4,050 | 2,025 | 11,925 |
| Editorial/planning | 2,475 | 0 | 2,475 | 0 | 4,950 |
| Itineraries | 0 | 0 | 1,125 | 0 | 1,125 |
| Static/tool/other | 50 | 5 | 47 | 6 | 108 |
| **TOTAL** | **16,363** | **9,220** | **12,945** | **8,076** | **46,604** |

**Headline finding: gotript is the "everything" site.** It is the only brand carrying *every* intent category — accommodation (gobookt's lane), experiences (numiworks' lane), climate, occasion, and editorial. That maximal breadth is why it is both the largest corpus (16,363) and the most topically diffuse — a real problem for a lead/hub domain, and a strong internal reason its indexed pages don't rank for anything focused.

---

## 3. Cross-brand overlap → dedup candidates (the "keep on one owner" list)

Families present on 2+ brands, with a natural single owner:

| Family group | On brands | Natural owner | Action for the others |
|---|---|---|---|
| `celebrations/*` (2,025 ea) | all 4 | **one** (numiworks, occasion lane) | B: keep 1, noindex/drop 3 |
| `stays-near/*` (949 ea) | all 4 | gobookt or stayviaowner (accommodation) | B: keep 1, noindex/drop 3 |
| `destinations/*` (164 ea) | all 4 | **keep per-brand** (differentiated, core) | A: retain all (they differ) |
| hotel-intent (`best/cheap/luxury/family/boutique/pet-friendly/beach-hotels`, `hotels-in`, `apartments-in`) | gotript+gobookt(+stay) | **gobookt** | C on gotript/stayviaowner |
| car/flights (`car-rentals`, `cheap/airport-car-rental`, `flights-to`, `cheap-flights-to`) | gotript+gobookt | **gobookt** (or retire flights — no affiliate) | C/D on gotript |
| experience-intent (`tours-in`, `museums-in`, `top-attractions`, `free-things-to-do`, `private/walking-tours`, `best-food-tours`, `best-family-activities`, `day-trips-from`) | gotript+gobookt / gotript+numiworks | **numiworks** | C on gotript/gobookt |
| occasion (`honeymoon`, `solo-travel`, `girls-trip`, `bachelor(ette)-party`, `first-time`, `weekend`, `night`, `rainy-day`) | gotript+numiworks | **numiworks** | C on gotript |
| editorial (`hidden-gems`, `most-instagrammable`, `luxury-travel`, `how-many-days`, `with-kids/teens`, `airport-guide`, `budget-per-day`, `is-worth-visiting`, `solo-female`, `bucket-list`) | gotript+numiworks | **gotript** (planning hub) | C on numiworks |

Because gotript overlaps every sibling, the largest single dedup win is **removing the accommodation- and experience-intent permutation families from gotript** and letting it keep only planning/editorial + destinations + its climate ownership.

---

## 4. Pruning worksheet (fill GSC columns, then classify)

**Decision rule (agreed):** a family is a **cut (C)** only if it is *all* of: thousands of URLs · ~0 impressions · no search demand · heavy cross-brand overlap · thin/templated · no affiliate value. Otherwise retain/improve. **Do not cut on URL count alone.**

**Data source — use the API, not the UI export.** The GSC **UI** Pages export is capped at **~1,000 representative rows**; for a 46,604-URL portfolio that silently truncates the long tail and would understate low-traffic families. Use `docs/_data/gsc_pages_export.py` (Search Analytics API, `rowLimit=25000` + `startRow` pagination — retrieves the rows the API makes available for the query, **subject to Google's internal limits, not guaranteed to be every URL**) → then `docs/_data/gsc_family_report.py` maps each exported URL to these 68 families and joins them onto the **sitemap denominator** (`--sitemap-dir`) so every family reports `gsc_present` / `gsc_zero` / `gsc_missing`. The report records source, rows imported, and classified/unclassified counts, and flags possible UI truncation.

**Date windows — recent data is immature.** Use **Before = 2026-07-01…07-17** and, initially, **After = 2026-07-18…07-27** (mature); rerun `After` once 07-28…07-31 finalize. A URL absent from the export is *"no GSC row,"* **not** proven zero traffic. Record the **latest-complete-data date** with each run.

Columns per family:

`Family | Total URLs | Indexed | Crawled-not-indexed | Discovered-not-indexed | Pages w/ ≥1 impression | Impressions (before/after) | Clicks | Avg position | Cross-brand overlap (Y/N) | Affiliate value | → Class (A/B/C/D)`

Classes: **A** retain & improve · **B** retain on one owner only · **C** noindex + remove from sitemap (keep URL live) · **D** redirect/retire.

**Provisional classes (CONFIRM with GSC before acting):**

- **A – retain & improve:** `destinations/*` (all brands), `best-time-to-visit-{city}` (gotript), a curated high-demand subset of editorial/planning on gotript.
- **B – one owner only:** `celebrations/*`, `stays-near/*` (collapse 4→1 each).
- **C – noindex/drop (provisional, pending GSC):** the `{intent}-in-{city}` permutation grids that duplicate another brand's lane — hotel/car/flight families on gotript & stayviaowner; experience/occasion families on gotript; editorial families on numiworks. This is the bulk of the ~38K Discovered/Crawled-not-indexed.
- **D – redirect/retire:** `flights-to-{city}` / `cheap-flights-to-{city}` if there is no flights affiliate; any already-retired itinerary/where-to-stay remnants.

Full 68-family table with exact per-brand counts is in the appendix export (`docs/_data/family-inventory.txt`).

---

## 5. 60–90 day soft-consolidation test — measurable success criteria

**Provisional lead: gotript** (largest indexed footprint; broadest top-of-funnel identity; previously surfaced at volume). gobookt is the defensible alternative (current impressions + transactional hotel intent). This is a *provisional operating decision, not a permanent retirement.*

**Baseline to capture NOW (all 4 properties, record date):** daily impressions, clicks, pages with ≥1 impression, indexed count, Discovered-not-indexed, Crawled-not-indexed, crawl requests (Crawl Stats), referring domains, affiliate outbound clicks.

**During the window:**
- All new SEO content, internal linking, link-building, and tool development → **gotript only**.
- No new broad programmatic families on **any** site.
- Keep gobookt (hotels), numiworks (tours), stayviaowner (rentals) online but **narrow to their lane**; stop producing overlapping destination guides on them.

**Continue-with-gotript decision rule (evaluate at 4-week intervals):** sustained improvement in **non-branded impressions**, **pages receiving ≥1 impression**, and **indexed high-priority pages** over ≥4 weeks. Full 301 consolidation only if, at 60–90 days: lead clearly outperforms, others stay dormant, families overlap, 1:1 URL equivalents exist, and affiliate architecture works on one site (then use Change of Address, 1:1 redirects, 410 for no-equivalent pages — never redirect-all-to-homepage).

---

## 6. Confirmed-defects-to-validate BEFORE freezing (status)

| Item | Status (2026-07-30) |
|---|---|
| Site-wide noindex / X-Robots block on gotript | Not found — homepage + 6 deep families live-tested indexable |
| noindex URLs still inside sitemaps | gotript sampled families all indexable; where-to-stay correctly dropped. **Re-audit each brand's full sitemap for any noindexed loc.** |
| Redirect URLs in sitemaps | gobookt `sitemap.xml` at www 308-redirects to non-www (cosmetic under Domain property; consider serving 200 at canonical host) |
| Duplicate sitemap entries | Not observed in sampling; confirm on full parse |
| Broken routes / 500s | None observed in sampling |
| Canonical correctness | Self-canonical on all sampled pages, all 4 brands |
| Unsupported commercial claims | Swept & removed across all 4 brands (commits `b18c6a1`, `04173ac`); only JSDoc references remain |
| stayviaowner "missing brand config" (earlier flag) | Disproven — no `buildBrandPlan('stayviaowner')` calls; builds pass |
| Deploy safety of this audit branch | Production `main` untouched. NOTE: a branch push can create a Vercel **Preview** deployment — confirm in each project's Deployments that new builds are **Preview**, never **Production**, and custom domains stay on `main`. (Docs-only files render no new pages regardless.) |

---

## Appendix — method + sitemap provenance

**Sitemap provenance (crawl 2026-07-30 ~06:15 UTC, Googlebot UA):**

| Domain | Canonical host | Sitemap HTTP | Raw `<loc>` | Unique | Duplicates |
|---|---|--:|--:|--:|--:|
| gotript | www | 200 (flat) | 16,363 | 16,363 | 0 |
| gobookt | apex | 200 (flat; www→apex 308 on `/sitemap.xml`) | 9,220 | 9,220 | 0 |
| numiworks | www | 200 (5-child index) | 12,945 | 12,945 | 0 |
| stayviaowner | www | 200 (flat) | 8,076 | 8,076 | 0 |

- **No duplicate sitemap entries** on any brand (clears one validation item).
- **Count-discrepancy note:** this snapshot shows gotript = **16,363**; earlier sessions referenced ~15,755 / "14–16K". The difference is expected from later commits + live sitemap changes + different crawl timestamps, **not** a counting error — hence recording the timestamp/host/raw/unique/dup fields above. Re-run with the same fields to compare like-for-like.
- **gobookt redirect:** informational, not a defect — apex is the canonical host and it's a single permanent hop. Only worth fixing if Googlebot is routinely handed the `www` sitemap URL (robots.txt declares apex).
- Families derived by masking city/month/season tokens; unclassified residue = 83 URLs (0.2%).
- Counts are **sitemap-declared URLs, not indexed counts**; overlay GSC per family (see §4) for the pruning decision. **No final prune from overlap alone.**
