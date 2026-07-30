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
