# gotript Phase 2 refocus — staged proposal (DOCUMENTATION — needs approval to build)

**No production change here.** This is the pre-PR evidence ChatGPT required before any
Phase-2 prune: exact counts, family→owner mapping, representative URLs, rollback, staged in
**separate PRs measured independently**. Nothing ships without your explicit "merge this PR".

## Diagnosis (both advisors now agree)
gotript's problem is **corpus scale + topical dilution** — it's a ~16,363-URL "everything
site" carrying ~35 intent families per city (hotels, flights, cars, climate, occasions,
experiences, editorial, planning). Cross-brand duplication is **fixed** (editorial metadata
differentiated live; bodies ≈0.19–0.29 similar). The July-7 climate expansion (`2da18a0`,
+2,966/site) likely tipped Google to treat the corpus as thin/programmatic.

**Keep-list correction (verified live):** Kimi proposed keeping gotript `itineraries` and
`things-to-do` — but both already return **308 (retired/redirected)**: `/paris-3-day-itinerary`
→ 308, `/things-to-do-in-paris` → 308. They are **not** live families and are already gone.

## Owner model (target)
gotript = planning / itineraries(retired) / persona + destination editorial ·
gobookt = hotels/accommodation · numiworks = tours/experiences/attractions/day-trips ·
stayviaowner = whole-home rentals.

---

## Phase 2A — remove OFF-ROLE families from gotript (highest confidence)
`noindex, follow` + drop from sitemap (keep crawlable so Google observes the directive; no
redirect — these have owner domains, not 1:1 gotript equivalents). **Exact counts (live sitemap):**

| Family (gotript) | URLs | Belongs to |
|---|--:|---|
| `hotels-in` + best/cheap/luxury/boutique/family/pet-friendly/beach-hotels (8 subtypes) | 1,800 | **gobookt** |
| `apartments-in` | 225 | gobookt/stayviaowner |
| `stays-near/*` | 949 | gobookt/stayviaowner |
| `tours-in` + `private-tours` + `walking-tours` | 675 | **numiworks** |
| `cars-in`/`car-rentals` + `cheap-car-rental` + `airport-car-rental` | 675 | off-role (thin affiliate) |
| `flights-to` + `cheap-flights-to` | 450 | off-role (thin affiliate) |
| **Phase 2A total** | **4,774** | |

**gotript sitemap: 16,363 → ~11,589** (−4,774). Representative URLs to spot-check after deploy:
`/hotels-in-paris`, `/best-hotels-in-tokyo`, `/stays-near/city-centre-in-tokyo`,
`/private-tours-in-rome`, `/car-rentals-in-paris`, `/flights-to-barcelona`.
**Rollback:** revert the PR (code reverts instantly; index effects take time — same caveat as numiworks).

---

## Phase 2B — climate compression (separate PR, after 2A measures)
17 near-identical climate pages per city from one dataset is the most defensible prune.

| Family | URLs | Action |
|---|--:|---|
| `best-time-to-visit-{city}` | 215 | **KEEP** (1 climate page/city) |
| `{city}-weather-in-{month}` | 2,580 | noindex + sitemap-drop (review) |
| `{season}-in-{city}` (spring/summer/fall/winter) | 900 | noindex + sitemap-drop (review) |
| `where-to-go-in-{month}` | 12 | noindex + sitemap-drop |
| **2B removal total** | **3,492** | |

**gotript after 2A+2B: ~8,097.**

## Phase 2C — internal-link restructuring (separate PR)
`buildCitySeoLinks` renders a ~40-link "More for {city}" rail linking every SEO surface to
every other — a flat graph with no hierarchy. Replace with **role-based topical clusters**
(planning↔planning; destination hubs as cluster centers; hotels/tours/rentals link out to
their owner brands). To be **measured** first (exact links/page, crawl depth) before changing.

## Do NOT cut yet (potential gotript editorial moat — later phase, needs evidence)
`how-many-days`, `first-time`, `budget-per-day`, `with-kids`/`with-teens`,
`for-families`/`couples`/`solo`, airport guides, general destination editorial, and
`celebrations` (until ownership resolved).

## Execution discipline
- Each phase = its own PR; **measure 1–2 weeks between phases** (impressions/day, Page-Indexing
  movement, crawl activity, no collateral drop on destination/persona pages).
- Every phase PR ships with: exact before/after sitemap count, families affected, representative
  live URLs, owner mapping, rollback plan.
- **Currently on HOLD** — two changes (numiworks itineraries, editorial metadata) deployed
  2026-07-30; let them mature before 2A unless you choose to proceed now.
