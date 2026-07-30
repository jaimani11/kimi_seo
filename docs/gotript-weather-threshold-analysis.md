# gotript weather-grid — page-level threshold analysis (DOCUMENTATION ONLY)

**No production change. No noindex rules generated.** This is a URL-level review of
the gotript climate/weather grid so a keep-vs-noindex decision can be made on
evidence and page-level thresholds — **not** a round number, and **not** auto-applied.
Data: `docs/_data/gotript_weather_analysis.csv` (2,807 rows).

## Scope
The gotript "weather grid" = three climate families (added by `2da18a0`, 2026-07-07):

| Family | URLs |
|---|--:|
| `{city}-weather-in-{month}` | 2,580 |
| `best-time-to-visit-{city}` | 215 |
| `where-to-go-in-{month}` | 12 |
| **Total** | **2,807** |

## ⚠️ Data caveat (read before acting)
gotript's GSC Pages export **hit the ~1,000-row UI cap**, so only **394** weather URLs
are reported. The other **2,413** are `gsc_reported = no` → **status UNKNOWN**: they may
have zero impressions, or they may have impressions we cannot see because the export was
truncated. **Do not treat "not reported" as proven zero.** A complete verdict on the
2,413 requires the **API export** (`docs/_data/gsc_pages_export.py`) or the **Page
Indexing** report. This analysis is directional on the reported 394 and flags the rest
for API-backed confirmation.

## What the reported data shows (the 394 we can see)
| Bucket | Count |
|---|--:|
| **RETAIN** (earned a click, or reported impressions + page-1–3 position) | **1** |
| **REVIEW** (reported impressions, but deep position / low volume) | **393** |
| **REVIEW\*** (NOT reported in capped export — status unknown) | **2,413** |

**Every** top weather page by impressions ranks **position 55–83 (page 6–8) with 0
clicks** — including the best performer, `goa-weather-in-may` (106 impressions, position
71, 0 clicks). Not a single weather URL in the reported set ranks on page 1–3 or earned
a click. The family drew ~3,483 impressions and **1 click** in the window.

## Retain / review rule used (page-level, data-driven — not a round number)
- **RETAIN** = `clicks ≥ 1` OR (`impressions ≥ 15` AND `avg_position ≤ 35`) — a page with
  realistic ranking potential.
- **REVIEW** = reported but deep position (>35) or low impressions — a noindex candidate,
  pending the owner's call.
- **REVIEW\*** = not in the capped export — **confirm with the API export first**; do not
  noindex on absence alone.

## Reading of the evidence (for your decision — NOT applied)
On the reported data, the weather grid is deep-position, zero-click vanity — the classic
signature of programmatic bloat that consumes crawl budget without earning traffic. That
argues for noindexing the bulk of it and keeping only genuinely-ranking pages. **But**
because 2,413 URLs are unreported due to the cap, the honest next step before any noindex
is a **complete API export of the weather families**, then re-run this analysis. If the
API confirms the pattern (near-zero across the grid), a page-level noindex of the REVIEW /
REVIEW\* set — keeping any RETAIN pages — would be the phase-2 candidate.

## Next step (requires your explicit approval)
1. Run the API export for gotript weather URLs → refresh this analysis (removes the cap caveat).
2. You review the URL-level keep/noindex list.
3. Only on your explicit "merge this PR" does any weather noindex ship — as its own
   isolated PR, mirroring the numiworks-itinerary pattern. **Nothing here is applied.**
