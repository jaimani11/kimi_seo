# gotript impression drop — diagnosis & recovery plan

**Status: RESOLVED (diagnosis) — 2026-07-24, based on GSC screenshots (24h / 7d / 28d + Pages + Countries tabs).**
Recovery is a baseline-*building* plan, not a restoration. gotript code freeze can end, but the
one-change-then-measure cadence still applies (see `docs/SEO-PLAYBOOK.md` conventions).

## Verdict

**Nothing was broken and nothing was lost — gotript never had a baseline.** The site's entire
impression history is one 8-day discovery spike:

- 28-day chart (Jul 6–22): flat **zero Jul 6–11** (Jul 11 = 5 impressions), vertical rise Jul 12,
  peak ~2.2K Jul 14, plateau ~1.3K Jul 15–17 (Jul 17 = 1,277), crash Jul 18–19, **~0 since Jul 20**,
  literally 0 in the last 24h.
- The 28-day total (**7.95K impressions / 20 clicks / 0.3% CTR / avg position 54.2**) equals the
  previously known all-time total → the "1,000/day" figure only ever existed for ~6 days.

## Evidence this was a discovery trial, not earned rankings

1. **Average position 54.2** — page 5–6. Google was sampling the corpus, not ranking it.
2. **Top page carried 17 of 7,950 impressions (~0.2%)** — impressions smeared across thousands of
   pSEO URLs, a handful each. That is corpus-wide trial serving after first indexing (~Jul 11–12),
   then withdrawal.
3. **Every top query is near-zero-volume long-tail** — "bachelorette bucharest" (30),
   "history museums in el nido" (20), "amsterdam at night tour" (19), "flights to chefchaouen" (17).
4. Geo: US 1,653 / UK 1,130 / CA 1,074 — no anomaly.

## Exonerated causes (closed threads)

- **Jul 19 itinerary noindex (~1,290 `/{city}-N-day-itinerary` pages): NOT the cause.** The crash
  began Jul 18, before the noindex shipped. No itinerary pages or queries appear among top earners
  → **no case for bulk-restoring those pages.**
- **Flat→nested sitemap change: refuted earlier** (gobookt got the identical change the same night
  and rose; URL parity preserved).
- **Production health: clean** on all 4 brands (200s, self-canonical, no noindex/X-Robots blocks).

## Recovery plan

Target is the first *real* baseline (realistically tens of impressions/day at first), not 1.3K/day
(that was an artifact).

### 1. GSC checks (user, weekly, ~5 min)
- **Indexing → Pages**: track the *Indexed* count vs "Crawled – currently not indexed" /
  "Discovered – currently not indexed". This distinguishes the two remaining scenarios:
  - Indexed count **falling** → Google is de-selecting gotript's corpus (duplicate-cluster
    reselection across the 4 forks).
  - Indexed count **stable** → purely a serving decision; time + authority fix it.
- **Security & Manual Actions**: confirm "No issues" once.

### 2. Code: quiet until ~Aug 6
The Jul 23 editorial-first MegaNav fix (`7660961`) is the sole live experiment. Do not stack
gotript SEO changes before the measurement window closes.

### 3. The actual levers (off-repo)
At position 54 with ~zero authority, on-page work cannot move the needle. What does:
- A handful of genuinely earned backlinks (travel roundups, Connectively/HARO, niche directories).
- Later: target 5–10 mid-volume queries where gotript has a differentiated page, and deepen those.
- **Do NOT interlink the 4 brands** to "share" authority — it feeds the duplicate-cluster problem.

### 4. Decision point ~Aug 6
- Impressions still ~0 **and** indexed count falling → duplication cluster is the binding
  constraint → deepen per-brand differentiation beyond `/destinations` (unique data per brand), or
  consider consolidating brands.
- Impressions returning at a low level → normal new-site curve → resume the one-reversible-change
  cadence on demand-targeted pages.
- Selective itinerary re-index only for genuinely distinct itineraries (self-canonical, hub-linked);
  low priority — the family never earned traffic.

---

## Measurement window log (2026-07-24 → ~2026-08-07)

**Deployments in flight (recorded for crawl-date comparison):**
- `7660961` — 2026-07-23 00:40 CT — gotript editorial-first MegaNav (the structural experiment)
- `1679822` — 2026-07-24 22:47 CT — gotript claims hygiene (copy-only, ~67 replacements)
- `a6e8223` — 2026-07-24 22:47 CT — numiworks GYG loader scoped to widget pages + 300,000+ removed

**Frozen for 10–14 days (no further gotript title / sitemap / route / nav changes,
no new broad cleanup passes).** Weekly checks instead:
1. URL-Inspect each homepage: compare **Last crawl** date, **View crawled page**
   (may still show pre-cleanup markup — that is Google's stored snapshot, not a
   deployment problem), and **Test live URL** (must show cleaned copy).
2. Indexing → Pages: indexed count vs "Crawled/Discovered – currently not indexed"
   (falling indexed count = cluster de-selection signal).
3. Impressions by page family.

**Queued structural experiments (strictly after the window, one at a time):**
- gotript: title/positioning reposition — trip planning, where-to-stay decisions,
  itineraries, stays+activities; drop generic provider-category keywords from the
  title. (H1 is already planner-voiced.)
- numiworks: 8–12 curated `/experiences/{category}` landing pages (food-tours,
  cooking-classes, day-trips, private-tours, …) to replace the highest-value
  `/search?q=` links — unique intro copy, destination recommendations, internal
  links, self-canonical; NOT a 154-page programmatic sweep, no auto city-name
  substitution.
- stayviaowner: convert primary-nav `<button>` categories to server-rendered
  anchor links (low urgency; crawlable anchors exist elsewhere).

Residual risks are no longer fabricated claims or provider leakage; they are
cross-site similarity, weak programmatic landing-page value, and gotript's
still-broad topical identity.
