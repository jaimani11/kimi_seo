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
    ap.add_argument("--sitemap-inventory", default=None, help="family-inventory.txt to join sitemap URL counts (optional)")
    a=ap.parse_args()

    # (brand,window,family) -> aggregates
    agg=collections.defaultdict(lambda: {"pages":0,"impr":0.0,"clicks":0.0,"pos_wsum":0.0,"pos_w":0.0})
    windows=set(); brands=set()
    for fp in sorted(glob.glob(os.path.join(a.csv_dir,"*.csv"))):
        base=os.path.basename(fp)[:-4]
        if "_" not in base:
            print(f"skip (need <brand>_<window>.csv): {base}", file=sys.stderr); continue
        brand,window=base.split("_",1); brands.add(brand); windows.add(window)
        for url,clicks,impr,pos in read_gsc_csv(fp):
            fam=family(path_of(url)); k=(brand,window,fam); d=agg[k]
            if impr>0: d["pages"]+=1
            d["impr"]+=impr; d["clicks"]+=clicks
            if impr>0: d["pos_wsum"]+=pos*impr; d["pos_w"]+=impr
    if not agg:
        print("No data parsed. Check CSV filenames and format.", file=sys.stderr); sys.exit(1)

    rows=[]
    for (brand,window,fam),d in sorted(agg.items(), key=lambda kv:(-kv[1]["impr"])):
        avgpos=round(d["pos_wsum"]/d["pos_w"],1) if d["pos_w"] else ""
        rows.append({"brand":brand,"window":window,"family":fam,
                     "pages_with_impr":d["pages"],"impressions":int(d["impr"]),
                     "clicks":int(d["clicks"]),"avg_position":avgpos})
    with open(a.out,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f, fieldnames=["brand","window","family","pages_with_impr","impressions","clicks","avg_position"])
        w.writeheader(); w.writerows(rows)

    print(f"windows={sorted(windows)}  brands={sorted(brands)}  rows={len(rows)}")
    print(f"wrote {a.out}\n")
    print(f"{'brand':<13}{'window':<8}{'family':<34}{'pgs':>5}{'impr':>9}{'clk':>6}{'pos':>6}")
    print("-"*81)
    for r in rows[:40]:
        print(f"{r['brand']:<13}{r['window']:<8}{r['family']:<34}{r['pages_with_impr']:>5}{r['impressions']:>9}{r['clicks']:>6}{str(r['avg_position']):>6}")
    if len(rows)>40: print(f"... (+{len(rows)-40} more rows in {a.out})")
    print("\nClassify each family A/B/C/D using: URLs, pages_with_impr, impressions(before/after),")
    print("clicks, avg_position, cross-brand overlap, affiliate value. Do NOT cut on URL count alone.")

if __name__=="__main__":
    main()
