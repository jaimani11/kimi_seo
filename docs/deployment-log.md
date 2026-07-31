# SEO recovery — deployment log

## Operating rule (control point)
**No production PR is merged without the owner's explicit words "merge this PR."**
"Build it," "open the PR," or "I validate by metrics" do NOT constitute merge approval.
(Exception already used: the numiworks-itinerary deploy below was merged on the owner's
explicit merge-after-test instruction, since their validation is live metrics.)

---

## 2026-07-30 — seo-recovery-phase-1: numiworks itinerary family → noindex + sitemap-drop

| Field | Value |
|---|---|
| Previous `main` SHA | `774c563` |
| Deployed `main` SHA | `004f0a7` (merge of PR #3, commit `c3a3359`) |
| Deploy timestamp | 2026-07-30 16:30:55 -0500 |
| Family | numiworks `{city}-{N}-day-itinerary` (1,125 URLs) |
| numiworks sitemap | 12,945 → **11,820** (−1,125; itinerary_in_sitemap = 0) |
| Page behavior | HTTP **200** + `noindex, follow` (crawlable; NOT robots.txt-blocked) |
| Redirects | **none** (gotript itinerary is a 308 — no 1:1 equivalent to redirect to) |
| Internal links | removed numiworks-side (local `buildCitySeoLinks` filter) |
| Build / tests | numiworks build 1/1; **2,256/2,256** tests pass (also fixed a pre-existing climate parity test) |
| Live verification | confirmed ~80s post-merge: `noindex, follow` live, HTTP 200, 0 itinerary URLs in sitemap |
| Blast radius | numiworks + docs only; gotript/gobookt/stayviaowner source untouched |

**Reversibility (corrected):** the **code** is easily reversible (revert PR #3), **but
Google's index effects may take time to reverse** — once Google crawls the `noindex` and
drops these URLs, reverting the code does not instantly restore them to the index.
Reindexing would take its own time.

**Longer-term open decision (no action needed now):** whether these pages should remain
permanently `noindex` + accessible, or eventually return `410` once Google has processed
the removal. Decide after the index effect settles.

### What to monitor (owner)
- 24–72h: numiworks sitemap settles at ~11,820; itinerary URLs move to "Excluded by
  'noindex'" in GSC Page Indexing.
- 1–2 weeks: those 1,125 URLs leave the index; watch for **no** collateral drop in
  numiworks tours/destinations.
- Expected first effect: fewer low-value URLs + cleaner crawl concentration — **not** an
  immediate traffic increase.

---

## 2026-07-30 — editorial metadata/H1/intro brand differentiation (PR #6)

| Field | Value |
|---|---|
| Deployed `main` SHA | `f772ce7` (merge of PR #6) |
| Scope | gotript + numiworks + stayviaowner: `kind==='themed-list'` editorial pages (seasonal/occasion/persona/day-trips/…) |
| Change | brand-role framed `<title>`, `<meta description>`, on-page `<h1>` + intro (`applyEditorialVoice`). Shared `city.oneLiner` opener dropped; city facts kept |
| NOT changed | routes, sitemaps, noindex, canonicals, URL counts, internal-link architecture, body-section structure, affiliate/provider logic |
| Live verification | confirmed: `/spring-in-paris`, `/honeymoon-in-rome` now render distinct title+meta per brand |
| Framing | hygiene + differentiation correction — **not** a standalone SEO recovery |

Also merged same day: **PR #7** (test-only, fixed pre-existing gotript/stayviaowner sitemap-index assertions) and **PR #5** (docs, cross-brand similarity audit).

## HOLD — no further production change

Two substantive production changes deployed close together (numiworks itinerary noindex;
editorial metadata differentiation). **Freeze additional pruning** and measure over 1–2 weeks:
impressions/day, pages receiving impressions, numiworks Page-Indexing movement into "Excluded
by noindex", sitemap processing, crawl activity, and any collateral change to destination /
tour / rental pages. Early 24–72h checks are informational; judge on 1–2 week trends.

**stayviaowner:** overlay complete (`docs/stayviaowner-family-gsc-overlay.md`) — **no prune
needed** (generic editorial already noindexed; celebrations are rental-framed/on-role).
