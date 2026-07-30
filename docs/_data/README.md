# GSC portfolio export → 68-family report

Turns Google Search Console page data into an evidence-based, per-family prune
table for the 4-brand portfolio. Two scripts, both read-only, neither part of the
app build.

**Why the API (not the UI):** the GSC UI Pages export is capped at ~1,000
representative rows — truncating for a 46,604-URL portfolio. The API exporter pages
through with `rowLimit=25000` + `startRow`. Even so, the API returns *the rows it
makes available*, **subject to Google's internal limits — not guaranteed to be every
URL.** The complete corpus comes from the **sitemap** (the denominator); GSC is
joined onto it.

## 1. One-time setup
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install google-api-python-client google-auth
```
Create a Google Cloud **service account**, enable the **Search Console API**, download
its JSON key to `docs/_data/service-account.json`. Then in GSC → each property →
Settings → Users and permissions → add the service-account email (read access).
`.gitignore` already excludes the key — **do not commit it.**

## 2. Test ONE site first (catch auth/parse issues before all 8 runs)
```bash
python3 docs/_data/gsc_pages_export.py --creds docs/_data/service-account.json \
  --site "sc-domain:gotript.com" --brand gotript --window before \
  --start 2026-07-01 --end 2026-07-17 --out docs/_data/gsc_csv
wc -l docs/_data/gsc_csv/gotript_before.csv   # expect >>1000 rows if not truncated
head -3 docs/_data/gsc_csv/gotript_before.csv
```
Confirm the CSV has the header `Top pages,Clicks,Impressions,CTR,Position` and a
`.raw.json` + `.meta.txt` sidecar were written.

## 3. Run all 8 exports (4 sites × 2 windows)
Windows: **Before = 2026-07-01..07-17**, **After = 2026-07-18..07-27** (mature; rerun
`after` later once 07-28..31 finalize). Domain properties use `sc-domain:<domain>`.
```bash
DIR=docs/_data/gsc_csv; CR=docs/_data/service-account.json
for S in gotript gobookt numiworks stayviaowner; do
  python3 docs/_data/gsc_pages_export.py --creds $CR --site "sc-domain:$S.com" \
    --brand $S --window before --start 2026-07-01 --end 2026-07-17 --out $DIR
  python3 docs/_data/gsc_pages_export.py --creds $CR --site "sc-domain:$S.com" \
    --brand $S --window after  --start 2026-07-18 --end 2026-07-27 --out $DIR
done
```

## 4. Build the family report (join GSC onto the sitemap denominator)
Download the 4 live sitemaps into a dir (so `gsc_missing` can be computed), then:
```bash
python3 docs/_data/gsc_family_report.py docs/_data/gsc_csv \
  --sitemap-dir docs/_data/sitemaps --out docs/_data/report.csv
```
Output columns: `sitemap_urls, gsc_present (impr>0), gsc_zero (in GSC, 0 impr),
gsc_missing (in sitemap, no GSC row), pages_with_impr, impressions, impr_per_day,
clicks, avg_position`. Windows are unequal (17 vs 10 days) — **compare `impr_per_day`,
not raw totals.**

## 5. Classify each family → send `report.csv` back
- **A — keep & improve:** differentiated, clearly owned, real demand.
- **B — consolidate:** demand exists, but another brand should own it.
- **C — noindex / drop from sitemap:** weak/duplicate surface, no owner, `gsc_missing`≈all.
- **D — investigate:** ambiguous/unclassified/conflicting.

A URL with **no GSC row = `gsc_missing`** (crawl/index gap), which is different from
**`gsc_zero`** (Google saw it, 0 impressions). Don't treat missing as zero.

## Guardrails
- Do **not** prune from URL count or overlap alone — use the GSC evidence.
- Keep all URL/sitemap/canonical/noindex changes **off `main`** until the report is reviewed.
- Verify in Vercel that the `seo-forensic-inventory` branch is **Preview**, never Production.
