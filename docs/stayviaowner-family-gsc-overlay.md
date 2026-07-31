# stayviaowner family-level GSC overlay (DOCUMENTATION — evidence, no change)

Purpose: before touching stayviaowner (flagged in the similarity audit for ~0.80 body
overlap with gotript), overlay its **actual GSC data + live noindex/sitemap state** per
family. Result: **the mass-prune hypothesis does not hold — no stayviaowner pruning is
needed.** Data: `docs/_data/stayviaowner-family-gsc-overlay.csv` (GSC window 2026-07-06…07-28,
UI export, 61 reported page rows / 408 table impressions — NOT capped).

## The decisive finding
The families the audit flagged as near-duplicate (seasonal/occasion/persona) are **already
`noindex, follow` and already absent from the stayviaowner sitemap** — verified live:

| Live check | Result |
|---|---|
| `/spring-in-paris` | HTTP 200 · **`noindex, follow`** · not in sitemap |
| `/bachelor-party-in-paris` | HTTP 200 · **`noindex, follow`** · not in sitemap |
| `/bachelorette-party-in-paris` | HTTP 200 · **`noindex, follow`** · not in sitemap |

So the ~0.80 body similarity is on **noindexed** pages — it does **not** create duplicate
content in Google's index. These are already effectively retired (same pattern as numiworks
itineraries: 200 + noindex + out of sitemap). **No action required.**

## What IS in the stayviaowner sitemap (and its GSC performance)
| Family | sitemap URLs | GSC reported | impr | clicks | avg pos | Verdict |
|---|--:|--:|--:|--:|--:|---|
| `rentals/*` | 3,114 | 9 | 46 | 0 | 44.2 | **Core product — retain** (quality/inventory review only, not deletion) |
| `celebrations/*` | 2,025 | 3 | 6 | 0 | 48.0 | **Retain** — rental-framed (see below), on-role group-stay intent |
| `pet-friendly-hotels-in-{city}` | 225 | 5 | 50 | 0 | **7.8** | Retain — ranks page 1; accommodation-adjacent |
| hotel families (luxury/apartments/beach/family/boutique/best) | ~1,300 | few | low | 0 | 39–65 | Review — overlap gobookt (hotels), but low volume; not urgent |
| `destinations/*` | 164 | 5 | 10 | 0 | 57.2 | Retain (core) |
| home + static/tool | ~7 | — | 59 | **7** | 3–33 | Retain (homepage carries all 7 clicks) |

## celebrations are rental-framed → on-role (retain)
Live meta on `/celebrations/bachelorette-party-in-paris`:
> *"Bachelorette Party in Paris? Rent a whole home for the group on VRBO — space, a kitchen
> and room for everyone…"*
This is explicitly **whole-home rental selection for the occasion** — exactly the "retain"
condition. stayviaowner's celebrations are **not** generic editorial; they serve rental intent.

## Conclusion (analytical)
- **No stayviaowner editorial retirement needed.** The generic editorial is already noindexed
  + out of sitemap; celebrations are rental-framed and on-role; rentals is the core product.
- The only *optional* future items (low priority, need approval): a quality/inventory pass on
  the large `rentals/*` grid (on-role but deep-position), and deciding whether the already-
  noindexed editorial pages should eventually return `410` (no urgency — current handling is
  correct).
- This overturns the earlier "prune 8,814 stayviaowner URLs" idea — a good example of why
  GSC + live evidence must precede any prune.

## Caveat
GSC UI export (61 rows, not capped for this low-traffic property) + live robots/sitemap
checks 2026-07-30. Performance presence is not an index-status signal; the noindex/sitemap
facts here are from direct live fetches, not inferred from the export.
