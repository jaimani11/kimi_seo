# Portfolio family review — PRELIMINARY (not decision-grade)

Based on the four GSC **Pages** exports (2026-07-06…07-28, filter said "Last 3 months"
but data only begins Jul 6) joined to the live sitemap denominator via
`docs/_data/gsc_family_report.py`.

## Honesty caveats (read first)
- **These are UI-reported page rows, not a complete corpus.** gotript's `Pages.csv`
  hit the **1,000-row UI cap** → its family totals are **lower bounds**. gobookt's
  `Queries.csv` is also capped at 1,000. The other exports are under the cap but GSC
  still returns *top/representative* rows, not a guaranteed exhaustive log.
- **Search Performance presence is NOT an index-status signal.** A URL absent from the
  export (`gsc_not_reported`) has **unknown** status — could be zero-impression,
  truncated-out, or indexed-but-never-surfaced. Crawl/index status only comes from the
  **Page Indexing** report / URL Inspection. Do not read `gsc_not_reported` as "not crawled."
- **Small sample:** 37 total clicks across ~23 days; per-family samples are tiny and
  average position is unstable on a handful of impressions.
- Chart totals ≠ Pages-table totals (normal GSC aggregation/privacy): gotript 7,953 vs
  7,013; gobookt 4,436 vs 4,466; numiworks 1,157 vs 1,231; stayviaowner 343 vs 408.
- **This review identifies CANDIDATES for a staged, page-level review — it does NOT
  authorize a mass 24,000-URL noindex event.**

## Reported totals (Jul 6–28)
| Domain | Clicks | Impr (table) | Peak day | Pages rows | Capped? |
|---|--:|--:|---|--:|:--:|
| gotript | 20 | 7,013 | Jul 14 | 1,000 | **YES** |
| gobookt | 3 | 4,466 | Jul 17 | 848 | no |
| numiworks | 7 | 1,231 | Jul 12 | 248 | no |
| stayviaowner | 7 | 408 | Jul 28 | 61 | no |

The whole portfolio: **~46,600 URLs → 37 clicks in 3 weeks.** Almost all reported
families rank at position 40–80 (page 4–8) — impressions that don't convert. **Position
is the durable signal; impressions are inflated by the July discovery spike.**

## Single-owner model (target)
- **gotript** — general planning, editorial, **itineraries**, selected climate.
- **gobookt** — hotels / accommodation.
- **numiworks** — tours / experiences.
- **stayviaowner** — whole-home rentals.

Celebrations (per review): **broad celebration guides → gotript**; celebration
*accommodation* pages → gobookt; *group-rental* celebration pages → stayviaowner **only
where rental intent is explicit**. Do NOT keep three generic versions.

## Candidate families (for page-level review, NOT blanket cuts)
- **Keep & improve** (rank p1–3 or earned the few clicks): gotript persona grid
  `{city}-with-teens/-with-kids/-for-families` (pos 11.8, 5 clicks); `museums-in`,
  `flights-to` (pos ~17); homepages, `/plan`, `/destinations/*`, tool pages; gobookt
  `hotels/*`; numiworks `experiences/*`; stayviaowner `pet-friendly-hotels` (pos 7.8) +
  curated rentals.
- **Consolidate to one owner:** `celebrations/*` (on 3 brands, 6,075 URLs, 0 clicks);
  climate/seasons (gotript); `day-trips-from` (numiworks); `flights-to` (gotript).
- **Review for noindex/sitemap-drop (page-level thresholds, not round numbers):**
  gotript `{city}-weather-in-{month}` (2,580 URLs, pos 62, 1 click — keep only pages
  meeting an impression/position/demand threshold); stayviaowner `rentals/*` tail
  (quality/inventory review, NOT a blanket cut of its core product); gobookt
  `stays-near/*` (POI-specificity/inventory review).

## Highest-confidence action ready NOW (one family)
**numiworks `{city}-N-day-itinerary` → noindex + drop from sitemap.**
- 1,125 URLs; **2 reported pages, 2 impressions, 0 clicks**, positions 66 & 87; export
  **not** capped (complete for numiworks). Exact URLs: `docs/_data/numiworks_itineraries.txt`.
- Rationale: itineraries belong to **gotript** in the single-owner model; on numiworks
  they are a thin, near-zero-return duplicate surface.
- Already-consistent: climate families (`weather-month`/`best-time`/`where-to-go`) are
  **already absent** from gobookt/numiworks/stayviaowner sitemaps (0 entries) — no action.

## Next step
Produce page-level retain/noindex lists (URL, impressions, clicks, position, reason,
capped-flag) for each *reviewed* family **before** any production change. Implement only
the highest-confidence item (numiworks itineraries) first, as a reviewable PR. No mass
noindex until the exact URL lists are approved.
