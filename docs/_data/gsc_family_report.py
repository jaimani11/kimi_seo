#!/usr/bin/env python3
"""
GSC Pages export -> 68-family performance report (portfolio audit tool).

Maps every URL in a Google Search Console "Pages" CSV export to the same
68-family taxonomy used by docs/portfolio-family-inventory-and-consolidation-plan.md,
then aggregates impressions / clicks / pages-with-impressions per family so the
pruning decision (A/B/C/D) is driven by evidence, not URL count or overlap alone.

NOT part of the app build. Does not touch production code. Read-only over CSVs.

USAGE
-----
1) In GSC, for EACH property + EACH date window (recommended: 2026-07-01..07-17
   "before" and 2026-07-18..07-30 "after"), open Performance -> Pages tab ->
   Export -> CSV. The relevant file is "Pages.csv" (header "Top pages,Clicks,
   Impressions,CTR,Position").
2) Rename each to  <brand>_<window>.csv , e.g. gotript_before.csv, gotript_after.csv
   brand in {gotript,gobookt,numiworks,stayviaowner}; window in {before,after} (or any label).
3) Run:
     python3 gsc_family_report.py path/to/csv_dir --out report.csv
   Optional: --sitemap-inventory family-inventory.txt  (to join sitemap URL counts)

OUTPUT: one row per (brand, family, window) with pages_with_impressions,
impressions, clicks, avg_position; plus a wide before/after delta view if both
windows are present. Prints a summary table and writes the full CSV.
"""
import csv, os, re, sys, glob, argparse, collections

MONTHS={"january","february","march","april","may","june","july","august","september","october","november","december"}
SEASONS={"spring","summer","fall","winter","autumn"}
ACC={"villas","houses","lodges","cottages","cabins","chalets","mansions","farmhouses","penthouses","condos","glamping","apartments","bungalows"}

def path_of(url):
    m=re.match(r"https?://[^/]+(/.*)?$", url.strip()); p=(m.group(1) or "/") if m else "/"
    return p.split("?")[0].split("#")[0].strip("/")

def family(path):
    if path=="": return "home"
    if "/" in path: return path.split("/",1)[0]+"/*"
    s=path
    if re.search(r"-\d+-day-itinerary$",s): return "{city}-N-day-itinerary"
    if s.startswith("best-time-to-visit-"): return "best-time-to-visit-{city}"
    if s.startswith("where-to-stay-in-"):   return "where-to-stay-in-{city}"
    if "-in-" in s:
        head,tail=s.rsplit("-in-",1)
        if tail in MONTHS:
            return "{city}-weather-in-{month}" if head.endswith("-weather") else head+"-in-{month}"
        if tail in SEASONS: return head+"-in-{city}"
        return head+"-in-{city}"
    if "-from-" in s: return s.rsplit("-from-",1)[0]+"-from-{city}"
    if "-to-" in s:   return s.rsplit("-to-",1)[0]+"-to-{city}"
    if s.startswith("is-") and s.endswith("-worth-visiting"): return "is-{city}-worth-visiting"
    for suf in ["with-kids","with-teens","airport-guide","budget-per-day","bucket-list","for-solo-female-travelers"]:
        if s.endswith("-"+suf): return "{city}-"+suf
    if "-in-" not in s and s.split("-")[-1] in ACC: return "[accommodation-category] {type}"
    if s.split("-")[0] in SEASONS: return "{season}-in-{city}"
    if s in {"plan","about","privacy","terms","contact","stays","cars","cruises","flights",
             "experiences","destinations","tours","rentals","search","quiz","trip-cost-estimator"}:
        return "[static/tool] "+s
    return "OTHER"

def read_gsc_csv(fp):
    """Yield (url, clicks, impressions, position) from a GSC Pages export."""
    with open(fp, newline="", encoding="utf-8-sig", errors="ignore") as f:
        r=csv.reader(f); header=next(r, None)
        if not header: return
        cols={h.strip().lower():i for i,h in enumerate(header)}
        def find(*names):
            for n in names:
                if n in cols: return cols[n]
            return None
        iu=find("top pages","page","url","pages"); ic=find("clicks"); ii=find("impressions"); ip=find("position")
        if iu is None:  # fall back to first column
            iu=0
        for row in r:
            if not row or len(row)<=iu: continue
            url=row[iu]
            if not url.startswith("http"): continue
            def num(i):
                if i is None or i>=len(row): return 0.0
                try: return float(row[i].replace(",","").replace("%",""))
                except: return 0.0
            yield url, num(ic), num(ii), num(ip)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("csv_dir", help="dir of <brand>_<window>.csv GSC Pages exports")
    ap.add_argument("--out", default="gsc_family_report.csv")
    ap.add_argument("--sitemap-dir", default=None,
        help="dir of live sitemap .xml files (the DENOMINATOR). Enables gsc_present/gsc_zero/gsc_missing per family.")
    ap.add_argument("--before-days", type=int, default=17, help="days in the 'before' window (Jul 1-17 = 17)")
    ap.add_argument("--after-days", type=int, default=10, help="days in the 'after' window (Jul 18-27 = 10)")
    a=ap.parse_args()
    day_map={"before":a.before_days,"after":a.after_days}

    # DENOMINATOR: classify the full sitemap URL inventory per (brand, family).
    # GSC is JOINED onto this — a URL absent from GSC is 'gsc_missing', not zero.
    sm_paths=collections.defaultdict(set)  # (brand,family) -> {paths}
    if a.sitemap_dir:
        for xf in glob.glob(os.path.join(a.sitemap_dir,"*.xml")):
            txt=open(xf,encoding="utf-8",errors="ignore").read()
            for loc in re.findall(r"<loc>([^<]+)</loc>", txt):
                b=next((br for br in ("gotript","gobookt","numiworks","stayviaowner") if br in loc), None)
                if not b: continue
                sm_paths[(b,family(path_of(loc)))].add(path_of(loc))

    # (brand,window,family) -> aggregates + path sets for present/zero
    agg=collections.defaultdict(lambda: {"pages":0,"impr":0.0,"clicks":0.0,"pos_wsum":0.0,"pos_w":0.0})
    gsc_impr=collections.defaultdict(set)  # (brand,window,family)->{paths with impr>0}
    gsc_zero=collections.defaultdict(set)  # (brand,window,family)->{paths seen with impr==0}
    windows=set(); brands=set(); provenance=[]
    for fp in sorted(glob.glob(os.path.join(a.csv_dir,"*.csv"))):
        base=os.path.basename(fp)[:-4]
        if "_" not in base:
            print(f"skip (need <brand>_<window>.csv): {base}", file=sys.stderr); continue
        brand,window=base.split("_",1); brands.add(brand); windows.add(window)
        rows_imported=0; classified=0; unclassified=0
        for url,clicks,impr,pos in read_gsc_csv(fp):
            rows_imported+=1
            pth=path_of(url); fam=family(pth); k=(brand,window,fam); d=agg[k]
            if fam=="OTHER": unclassified+=1
            else: classified+=1
            if impr>0:
                d["pages"]+=1; d["pos_wsum"]+=pos*impr; d["pos_w"]+=impr; gsc_impr[k].add(pth)
            else:
                gsc_zero[k].add(pth)
            d["impr"]+=impr; d["clicks"]+=clicks
        # POSSIBLE UI truncation — only a heuristic (a real property may return exactly 1,000).
        truncated = 999<=rows_imported<=1001
        provenance.append({"file":base,"rows_imported":rows_imported,
                           "urls_classified":classified,"unclassified":unclassified,
                           "possible_UI_truncation":"POSSIBLE" if truncated else "no"})
    if not agg:
        print("No data parsed. Check CSV filenames and format.", file=sys.stderr); sys.exit(1)

    # --- provenance / metadata (source completeness + immature data) ---
    print("=== IMPORT PROVENANCE (record source; verify completeness) ===")
    print(f"{'file':<26}{'rows':>7}{'classfd':>9}{'unclass':>8}  possible-UI-trunc?")
    any_trunc=False
    for p in provenance:
        if p["possible_UI_truncation"]=="POSSIBLE": any_trunc=True
        print(f"{p['file']:<26}{p['rows_imported']:>7}{p['urls_classified']:>9}{p['unclassified']:>8}  {p['possible_UI_truncation']}")
    if any_trunc:
        print("\n  !! POSSIBLE UI truncation: a file returned ~1,000 rows. The GSC *UI* Pages export is")
        print("     capped at ~1,000 representative rows. If this CSV came from the UI it is truncated")
        print("     for a 46,604-URL portfolio; use the API export (gsc_pages_export.py). If it came")
        print("     from the API and the property is genuinely small, ~1,000 may be legitimate.")
    print("\n  NOTE: rows are what the API/UI made available — NOT guaranteed to be every URL. A URL")
    print("  absent from the export = 'no GSC row' (gsc_missing), NOT proven zero. Use a mature window")
    print("  (Before Jul 1-17, After Jul 18-27); rerun once recent days finalize.")
    if not a.sitemap_dir:
        print("  TIP: pass --sitemap-dir <dir of live *.xml> to get gsc_present/gsc_zero/gsc_missing.\n")
    else: print()

    rows=[]
    for (brand,window,fam),d in sorted(agg.items(), key=lambda kv:(-kv[1]["impr"])):
        k=(brand,window,fam)
        avgpos=round(d["pos_wsum"]/d["pos_w"],1) if d["pos_w"] else ""
        days=day_map.get(window)
        row={"brand":brand,"window":window,"family":fam,
             "pages_with_impr":d["pages"],"impressions":int(d["impr"]),
             "impr_per_day": round(d["impr"]/days,1) if days else "",
             "clicks":int(d["clicks"]),"avg_position":avgpos}
        if a.sitemap_dir:
            sm=sm_paths.get((brand,fam),set())
            present=gsc_impr[k]; zero=gsc_zero[k]-present; seen=present|gsc_zero[k]
            row["sitemap_urls"]=len(sm)
            row["gsc_present"]=len(present)          # in GSC with impressions>0
            row["gsc_zero"]=len(zero)                # in GSC, 0 impressions (Google saw it)
            row["gsc_missing"]=len(sm-seen)          # in sitemap, no GSC row (crawl/index gap)
        rows.append(row)
    fields=["brand","window","family","sitemap_urls","gsc_present","gsc_zero","gsc_missing",
            "pages_with_impr","impressions","impr_per_day","clicks","avg_position"]
    if not a.sitemap_dir: fields=[c for c in fields if c not in ("sitemap_urls","gsc_present","gsc_zero","gsc_missing")]
    with open(a.out,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for r in rows: w.writerow({c:r.get(c,"") for c in fields})

    print(f"windows={sorted(windows)}  brands={sorted(brands)}  rows={len(rows)}  wrote {a.out}\n")
    print(f"{'brand':<12}{'window':<7}{'family':<32}{'impr':>8}{'/day':>7}{'clk':>5}{'pos':>6}")
    print("-"*77)
    for r in rows[:40]:
        print(f"{r['brand']:<12}{r['window']:<7}{r['family']:<32}{r['impressions']:>8}{str(r['impr_per_day']):>7}{r['clicks']:>5}{str(r['avg_position']):>6}")
    if len(rows)>40: print(f"... (+{len(rows)-40} more rows in {a.out})")
    print("\nClassify A/B/C/D using: sitemap_urls, gsc_present/zero/missing, impr_per_day (windows are")
    print("unequal — 17 vs 10 days), avg_position, cross-brand overlap, affiliate value. Not URL count alone.")

if __name__=="__main__":
    main()
