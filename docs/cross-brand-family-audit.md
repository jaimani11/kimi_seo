# Cross-brand rendered-family similarity audit (Workstream 2 — DOCUMENTATION ONLY)

**No production change. No pruning implemented.** A rendered-output comparison of
overlapping page families across brands, to separate *shared factual overlap* from
*actual page duplication* and to assign one clear owner per intent. Data (140 comparisons):
`docs/_data/cross-brand-family-audit.csv`.

## Method
- **10 cities** (major + secondary): paris, rome, tokyo, barcelona, lisbon, dubai, bangkok,
  mexico-city, cape-town, reykjavik.
- Fetched each family on every brand (Googlebot UA); compared vs the first brand serving 200.
- Measured per pair: `title_sim`, `meta_sim`, `h1_sim` (difflib ratio), `body_jaccard`
  (word-set overlap), body length, shared-oneLiner flag, robots, schema.
- **Caveat:** similarity metrics are directional. High body_jaccard from shared *city facts*
  is different from two pages serving the *same intent with the same structure/conclusions* —
  the classification below weighs intent + owner, not just the number.

## Headline results (averages across the 10 cities)

| Family | pair | title | meta | h1 | body overlap | oneLiner shared |
|---|---|--:|--:|--:|--:|--:|
| seasonal `spring-in` | gotript→numiworks | 1.00 | **1.00** | 1.00 | 0.28 | 10/10 |
| seasonal `spring-in` | gotript→stayviaowner | 1.00 | **1.00** | 1.00 | **0.80** | 10/10 |
| occasion `bachelor-party` | gotript→numiworks | 1.00 | **1.00** | 1.00 | 0.29 | 10/10 |
| occasion `bachelor-party` | gotript→stayviaowner | 1.00 | **1.00** | 1.00 | **0.81** | 10/10 |
| occasion `honeymoon` | gotript→numiworks | 1.00 | **1.00** | 1.00 | 0.29 | 10/10 |
| occasion `honeymoon` | gotript→stayviaowner | 1.00 | **1.00** | 1.00 | **0.81** | 10/10 |
| persona `with-kids` | gotript→numiworks | 0.97 | **1.00** | 0.97 | 0.29 | 10/10 |
| persona `with-kids` | gotript→stayviaowner | 1.00 | **1.00** | 1.00 | **0.80** | 10/10 |
| `day-trips` | gotript→numiworks | 1.00 | 1.00 | 1.00 | 0.29 | 10/10 |
| `day-trips` | gotript→stayviaowner | 1.00 | 1.00 | 1.00 | **0.80** | 10/10 |
| `museums` (attractions) | gotript→stayviaowner | 1.00 | 0.81 | 1.00 | **0.77** | 5/10 |
| `things-to-do` | numiworks→stayviaowner | 1.00 | 0.81 | 1.00 | 0.40 | 10/10 |

## Two distinct problems (the key takeaway)
1. **Metadata duplication is portfolio-wide and total** — title/meta/H1 ≈ 1.0 on essentially
   every editorial family across brands. This is the **verified defect** Workstream 1 fixes.
2. **Body duplication is brand-specific:**
   - **gotript ↔ numiworks ≈ 0.29** — bodies mostly share *city facts*; numiworks adds its
     Viator experience content, so these are **not** duplicate pages. Distinct enough by body.
   - **gotript ↔ stayviaowner ≈ 0.80** — bodies are **near-duplicates**. stayviaowner renders
     essentially the same editorial page as gotript with minimal added value. **This is the
     more serious duplication**, and it's off-role for a rentals brand.

## Family-by-family classification (A–F)
Owner model: gotript = planning/editorial · gobookt = hotels · numiworks = tours/experiences/
attractions/day-trips · stayviaowner = whole-home rentals.

| Family | Owner | gotript | numiworks | stayviaowner | Class |
|---|---|---|---|---|---|
| seasonal `spring/summer/…-in` | gotript | retain (differentiate meta) | near-dup meta / distinct body | **near-dup body — off-role** | **E** (needs meta diff) + **C/F** on stayviaowner |
| occasion `honeymoon/bachelor/girls-trip/…` | gotript (editorial) | meta-dup, distinct body | off-role | **near-dup, off-role** | **E** + **C** (assign gotript) + **F** stayviaowner |
| persona `with-kids/teens` | gotript | retain (differentiate meta) | meta-dup | **near-dup, off-role** | **E** + **F** stayviaowner |
| `day-trips` | **numiworks** (experiences) | meta-dup — reassign | retain | near-dup, off-role | **C** (owner = numiworks) |
| `museums`/attractions | **numiworks** | — | retain | near-dup, off-role | **C** (owner = numiworks) |
| `things-to-do` | **numiworks** | thin | retain | meta-dup | **C** (owner = numiworks) |

**A** distinct-retain · **B** same-topic-different-commercial · **C** same-intent-assign-one-owner ·
**D** thin/unsupported · **E** needs-differentiation · **F** retirement-candidate.

## Recommendations (analytical — require explicit approval before any production change)
1. **Fix metadata first** (Workstream 1, already in flight) — resolves the portfolio-wide E.
2. **stayviaowner editorial families** (seasonal/occasion/persona/day-trips/museums) are the
   **highest-confidence retirement/reassignment candidates**: near-duplicate bodies *and*
   off-role for a rentals brand. Candidate for **F** (noindex/retire on stayviaowner) — but
   only after (a) confirming with GSC that they earn ~nothing, and (b) your explicit approval.
3. **day-trips / museums / things-to-do → numiworks** ownership; gotript's copies become
   reassignment candidates (**C**), not immediate deletions.
4. Do **not** mass-prune. Each cut needs GSC evidence + owner sign-off, family by family.

## What this does NOT prove
This measures rendered similarity, not index status or ranking cause. GSC Page Indexing /
URL Inspection are still required to confirm how Google treats each family before retirement.
